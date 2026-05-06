<?php
/**
 * Servicio que obtiene y cachea estadísticas reales de Valorant via HenrikDev API.
 *
 * Endpoints consumidos:
 *   - GET /valorant/v2/mmr/{region}/{name}/{tag}                                  → rango + RR
 *   - GET /valorant/v1/by-puuid/stored-matches/{region}/{puuid}?size=20&mode=competitive   (preferido)
 *   - GET /valorant/v3/matches/{region}/{name}/{tag}?size=20&mode=competitive             (fallback)
 *   - GET /valorant/v1/account/{name}/{tag}                                       → account_level
 *
 * Política de caché:
 *   - Tabla riot_stats_cache (PK puuid). TTL = 15 min (CACHE_TTL_SECONDS).
 *   - Si falla la llamada en vivo pero hay caché previa: source='stale'.
 *   - Sin PUUID → source='none'. Sin caché y fallo total → source='error'.
 *
 * Dependencias:
 *   - model/env.php         → lectura de HENRIK_API_KEY
 *   - model/cacert.pem      → CA bundle (XAMPP Windows no trae uno)
 *   - model/conectar.php    → conexión mysqli
 */

require_once(__DIR__ . '/env.php');
require_once(__DIR__ . '/conectar.php');

class RiotStatsService
{
    /** TTL del caché en segundos (15 min). */
    public const CACHE_TTL_SECONDS = 900;

    private const BASE_URL = 'https://api.henrikdev.xyz';
    private const TIMEOUT_SECONDS = 8;
    private const CONNECT_TIMEOUT_SECONDS = 5;

    /** Duración estimada de una partida competitiva (minutos) para derivar "horas jugadas". */
    private const MATCH_AVG_MINUTES = 35;

    /**
     * Devuelve las estadísticas para la fila $user (tal cual sale de SELECT * FROM usuario).
     *
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    public static function getForUser(array $user): array
    {
        $puuid = isset($user['riot_puuid']) ? trim((string) $user['riot_puuid']) : '';

        $region = strtolower(trim((string) ($user['riot_region'] ?? 'eu')));
        if ($region === '') { $region = 'eu'; }

        $name = trim((string) ($user['riot_id']  ?? ''));
        $tag  = ltrim(trim((string) ($user['riot_tag'] ?? '')), '#');

        // Si no hay PUUID pero el usuario introdujo un Riot ID, intentamos
        // resolverlo al vuelo via HenrikDev y lo persistimos en la fila de usuario.
        if ($puuid === '' && $name !== '' && $tag !== '') {
            $resolved = self::httpGet('/valorant/v1/account/' . rawurlencode($name) . '/' . rawurlencode($tag));
            if ($resolved['ok'] && isset($resolved['json']['data']['puuid'])) {
                $puuid = (string) $resolved['json']['data']['puuid'];
                $regionApi = isset($resolved['json']['data']['region']) ? strtolower((string)$resolved['json']['data']['region']) : '';
                if ($regionApi !== '' && in_array($regionApi, ['eu','na','ap','kr','latam','br'], true)) {
                    $region = $regionApi;
                }
                $uid = isset($user['id']) ? (int) $user['id'] : 0;
                if ($uid > 0) {
                    self::persistPuuid($uid, $puuid, $region);
                }
            }
        }

        if ($puuid === '') {
            return self::emptyStats('none');
        }

        // 1) Consulta caché
        $cached = self::readCache($puuid);
        if ($cached !== null) {
            $ageSec = time() - strtotime($cached['updated_at']);
            if ($ageSec >= 0 && $ageSec < self::CACHE_TTL_SECONDS) {
                $out = $cached['data'];
                $out['source']     = 'cache';
                $out['fetched_at'] = $cached['updated_at'];
                return $out;
            }
        }

        // 2) Llamadas en vivo (MMR + matches). account_level opcional.
        if ($name === '' || $tag === '') {
            // No podemos llamar a HenrikDev sin name/tag. Devolvemos caché aunque caducada.
            if ($cached !== null) {
                $out = $cached['data'];
                $out['source']     = 'stale';
                $out['fetched_at'] = $cached['updated_at'];
                return $out;
            }
            return self::emptyStats('error');
        }

        $mmr = self::httpGet('/valorant/v2/mmr/' . rawurlencode($region) . '/' . rawurlencode($name) . '/' . rawurlencode($tag));

        // Preferir endpoint por PUUID (más estable). Fallback a v3/matches name/tag.
        $stored = self::httpGet('/valorant/v1/by-puuid/stored-matches/' . rawurlencode($region) . '/' . rawurlencode($puuid) . '?size=20&mode=competitive');
        $storedOk = ($stored['ok'] && isset($stored['json']['data']) && is_array($stored['json']['data']) && count($stored['json']['data']) > 0);

        $agg = null;
        if ($storedOk) {
            $agg = self::aggregateStoredMatches($stored['json']['data'], $puuid);
        }

        // Si stored-matches falló o no devolvió partidas, probar el fallback v3/matches
        $matchesOk = false;
        if ($agg === null || ($agg['total'] ?? 0) === 0) {
            $matches = self::httpGet('/valorant/v3/matches/' . rawurlencode($region) . '/' . rawurlencode($name) . '/' . rawurlencode($tag) . '?size=20&mode=competitive');
            $matchesOk = ($matches['ok'] && isset($matches['json']['data']) && is_array($matches['json']['data']));
            if ($matchesOk) {
                $agg = self::aggregateV3Matches($matches['json']['data'], $puuid);
            }
        }

        $mmrOk = ($mmr['ok'] && isset($mmr['json']['data']) && is_array($mmr['json']['data']));
        $anyMatches = ($storedOk || $matchesOk);

        if (!$mmrOk && !$anyMatches) {
            // Si hay algo cacheado (aunque caducado) servimos stale.
            if ($cached !== null) {
                $out = $cached['data'];
                $out['source']     = 'stale';
                $out['fetched_at'] = $cached['updated_at'];
                return $out;
            }
            return self::emptyStats('error');
        }

        // --- Extraer MMR ---
        // /v2/mmr envuelve el rango actual en data.current_data. Algunos clones de la API
        // siguen devolviéndolo en data.* — aceptamos ambas formas.
        $rank = '';
        $rr   = 0;
        if ($mmrOk) {
            $mdata = $mmr['json']['data'];
            $cur   = isset($mdata['current_data']) && is_array($mdata['current_data']) ? $mdata['current_data'] : $mdata;
            $rank  = isset($cur['currenttierpatched']) ? (string) $cur['currenttierpatched'] : '';
            $rr    = isset($cur['ranking_in_tier'])    ? (int)    $cur['ranking_in_tier']    : 0;
        }

        // --- Extraer stats agregadas (del helper que corresponda) ---
        $agg = $agg ?? ['total'=>0,'wins'=>0,'kills'=>0,'deaths'=>0,'hs'=>0,'bs'=>0,'ls'=>0];
        $totalMatches = (int) $agg['total'];
        $wins   = (int) $agg['wins'];
        $kills  = (int) $agg['kills'];
        $deaths = (int) $agg['deaths'];
        $hs     = (int) $agg['hs'];
        $bs     = (int) $agg['bs'];
        $ls     = (int) $agg['ls'];

        $kd = $deaths > 0 ? round($kills / $deaths, 2) : round((float) $kills, 2);
        $wr = $totalMatches > 0 ? (int) round(($wins / $totalMatches) * 100) : 0;
        $shotsTotal = $hs + $bs + $ls;
        $hsPct = $shotsTotal > 0 ? (int) round(($hs / $shotsTotal) * 100) : 0;
        $hours = (int) round(($totalMatches * self::MATCH_AVG_MINUTES) / 60);

        // account_level: si hay /v1/account disponible lo usamos; si no, 0.
        $level = 0;
        $account = self::httpGet('/valorant/v1/account/' . rawurlencode($name) . '/' . rawurlencode($tag));
        if ($account['ok'] && isset($account['json']['data']['account_level'])) {
            $level = (int) $account['json']['data']['account_level'];
        }

        $now = date('Y-m-d H:i:s');
        $payload = [
            'kd'    => number_format($kd, 2, '.', ''),
            'wr'    => $wr,
            'hs'    => $hsPct,
            'games' => $totalMatches,
            'hours' => $hours,
            'nivel' => $level,
            'rank'  => $rank,
            'rr'    => $rr,
        ];

        self::writeCache($puuid, $payload, $now);

        $out = $payload;
        $out['source']     = 'live';
        $out['fetched_at'] = substr($now, 0, 16); // "YYYY-MM-DD HH:MM"
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Agrega stats a partir de /valorant/v1/by-puuid/stored-matches.
     * Cada partida viene con stats ya filtrados para el PUUID consultado.
     *
     * @param array<int,mixed> $matches
     * @return array{total:int,wins:int,kills:int,deaths:int,hs:int,bs:int,ls:int}
     */
    private static function aggregateStoredMatches(array $matches, string $puuid): array
    {
        $total = 0; $wins = 0;
        $kills = 0; $deaths = 0;
        $hs = 0; $bs = 0; $ls = 0;

        foreach ($matches as $match) {
            if (!is_array($match)) continue;
            $stats = isset($match['stats']) && is_array($match['stats']) ? $match['stats'] : null;
            if ($stats === null) continue;

            // Sanity-check: si hay puuid en los stats, debe coincidir.
            if (isset($stats['puuid']) && strcasecmp((string)$stats['puuid'], $puuid) !== 0) {
                continue;
            }

            $total++;
            $kills  += (int) ($stats['kills']  ?? 0);
            $deaths += (int) ($stats['deaths'] ?? 0);

            $shots = isset($stats['shots']) && is_array($stats['shots']) ? $stats['shots'] : [];
            $hs += (int) ($shots['head'] ?? $shots['headshots'] ?? 0);
            $bs += (int) ($shots['body'] ?? $shots['bodyshots'] ?? 0);
            $ls += (int) ($shots['leg']  ?? $shots['legshots']  ?? 0);

            // Victoria: comparar stats.team con teams.red/blue (cuenta de rondas ganadas).
            $team = strtolower((string) ($stats['team'] ?? ''));
            $teams = isset($match['teams']) && is_array($match['teams']) ? $match['teams'] : [];
            $red  = (int) ($teams['red']  ?? 0);
            $blue = (int) ($teams['blue'] ?? 0);
            if ($team === 'red'  && $red  > $blue) $wins++;
            if ($team === 'blue' && $blue > $red)  $wins++;
        }

        return [
            'total'  => $total,
            'wins'   => $wins,
            'kills'  => $kills,
            'deaths' => $deaths,
            'hs'     => $hs,
            'bs'     => $bs,
            'ls'     => $ls,
        ];
    }

    /**
     * Agrega stats a partir de /valorant/v3/matches (players.all_players[]).
     *
     * @param array<int,mixed> $matches
     * @return array{total:int,wins:int,kills:int,deaths:int,hs:int,bs:int,ls:int}
     */
    private static function aggregateV3Matches(array $matches, string $puuid): array
    {
        $total = 0; $wins = 0;
        $kills = 0; $deaths = 0;
        $hs = 0; $bs = 0; $ls = 0;

        foreach ($matches as $match) {
            if (!is_array($match)) continue;
            $players = $match['players']['all_players'] ?? null;
            if (!is_array($players)) continue;

            $mine = null;
            foreach ($players as $p) {
                if (is_array($p) && isset($p['puuid']) && strcasecmp((string)$p['puuid'], $puuid) === 0) {
                    $mine = $p;
                    break;
                }
            }
            if ($mine === null) continue;

            $total++;
            $stats = isset($mine['stats']) && is_array($mine['stats']) ? $mine['stats'] : [];
            $kills  += (int) ($stats['kills']     ?? 0);
            $deaths += (int) ($stats['deaths']    ?? 0);
            $hs     += (int) ($stats['headshots'] ?? 0);
            $bs     += (int) ($stats['bodyshots'] ?? 0);
            $ls     += (int) ($stats['legshots']  ?? 0);

            $team = strtolower((string) ($mine['team'] ?? ''));
            $teams = $match['teams'] ?? [];
            if ($team !== '' && is_array($teams) && isset($teams[$team]['has_won'])) {
                if (!empty($teams[$team]['has_won'])) $wins++;
            }
        }

        return [
            'total'  => $total,
            'wins'   => $wins,
            'kills'  => $kills,
            'deaths' => $deaths,
            'hs'     => $hs,
            'bs'     => $bs,
            'ls'     => $ls,
        ];
    }

    /** @return array<string,mixed> */
    private static function emptyStats(string $source): array
    {
        return [
            'source'     => $source,
            'kd'         => '0.00',
            'wr'         => 0,
            'hs'         => 0,
            'games'      => 0,
            'hours'      => 0,
            'nivel'      => 0,
            'rank'       => '',
            'rr'         => 0,
            'fetched_at' => null,
        ];
    }

    /**
     * @return array{ok:bool,http_code:int,json:array<string,mixed>|null,err:string}
     */
    private static function httpGet(string $path): array
    {
        $apiKey = env('HENRIK_API_KEY');
        if ($apiKey === null || $apiKey === '') {
            return ['ok' => false, 'http_code' => 0, 'json' => null, 'err' => 'no_key'];
        }

        $url = self::BASE_URL . $path;
        $ch  = curl_init($url);
        if ($ch === false) {
            return ['ok' => false, 'http_code' => 0, 'json' => null, 'err' => 'init'];
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT,        self::TIMEOUT_SECONDS);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, self::CONNECT_TIMEOUT_SECONDS);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        $caPath = __DIR__ . '/cacert.pem';
        if (is_file($caPath)) {
            curl_setopt($ch, CURLOPT_CAINFO, $caPath);
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $apiKey,
            'Accept: application/json',
            'User-Agent: ValoSense/1.0 (+https://valosense.local)',
        ]);

        $body     = curl_exec($ch);
        $errno    = curl_errno($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0 || $body === false) {
            return ['ok' => false, 'http_code' => $httpCode, 'json' => null, 'err' => 'curl_' . $errno];
        }
        if ($httpCode !== 200) {
            // 404/429/otros: no ok
            $json = json_decode((string)$body, true);
            return ['ok' => false, 'http_code' => $httpCode, 'json' => is_array($json) ? $json : null, 'err' => 'http_' . $httpCode];
        }

        $json = json_decode((string)$body, true);
        if (!is_array($json)) {
            return ['ok' => false, 'http_code' => $httpCode, 'json' => null, 'err' => 'bad_json'];
        }
        return ['ok' => true, 'http_code' => $httpCode, 'json' => $json, 'err' => ''];
    }

    /**
     * @return array{data:array<string,mixed>,updated_at:string}|null
     */
    private static function readCache(string $puuid): ?array
    {
        try {
            $db = Conectar::conexion();
            $stmt = $db->prepare('SELECT stats_json, updated_at FROM riot_stats_cache WHERE puuid = ? LIMIT 1');
            $stmt->bind_param('s', $puuid);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res ? $res->fetch_assoc() : null;
            $stmt->close();
            $db->close();
            if (!$row) return null;
            $data = json_decode((string)$row['stats_json'], true);
            if (!is_array($data)) return null;
            return ['data' => $data, 'updated_at' => (string)$row['updated_at']];
        } catch (\Throwable $e) {
            error_log('RiotStatsService readCache — ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Guarda el PUUID resuelto + la región en la fila del usuario.
     * Solo actualiza la columna si está NULL/vacía para no pisar vinculaciones explícitas.
     */
    private static function persistPuuid(int $userId, string $puuid, string $region): void
    {
        try {
            $db = Conectar::conexion();
            $stmt = $db->prepare(
                'UPDATE usuario
                    SET riot_puuid        = ?,
                        riot_region       = COALESCE(NULLIF(riot_region, ""), ?),
                        riot_validado_en  = IFNULL(riot_validado_en, NOW())
                  WHERE id = ? AND (riot_puuid IS NULL OR riot_puuid = "")'
            );
            $stmt->bind_param('ssi', $puuid, $region, $userId);
            $stmt->execute();
            $stmt->close();
            $db->close();
        } catch (\Throwable $e) {
            error_log('RiotStatsService persistPuuid — ' . $e->getMessage());
        }
    }

    private static function writeCache(string $puuid, array $payload, string $updatedAt): void
    {
        try {
            $db = Conectar::conexion();
            $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt = $db->prepare(
                'INSERT INTO riot_stats_cache (puuid, stats_json, updated_at)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE stats_json = VALUES(stats_json), updated_at = VALUES(updated_at)'
            );
            $stmt->bind_param('sss', $puuid, $json, $updatedAt);
            $stmt->execute();
            $stmt->close();
            $db->close();
        } catch (\Throwable $e) {
            error_log('RiotStatsService writeCache — ' . $e->getMessage());
        }
    }
}
