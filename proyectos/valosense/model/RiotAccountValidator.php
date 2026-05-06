<?php
/**
 * Validador de cuentas de Valorant contra la API comunitaria HenrikDev.
 *
 * Endpoint:  GET https://api.henrikdev.xyz/valorant/v1/account/{gameName}/{tagLine}
 * Header:    Authorization: {HENRIK_API_KEY}   (literal, sin "Bearer")
 *
 * Depende de model/env.php para leer la clave HENRIK_API_KEY desde .env.
 */

require_once(__DIR__ . '/env.php');

class RiotAccountValidator
{
    private const ENDPOINT = 'https://api.henrikdev.xyz/valorant/v1/account/';
    private const TIMEOUT_SECONDS = 8;
    private const CONNECT_TIMEOUT_SECONDS = 5;

    /**
     * Consulta la API y devuelve un array normalizado.
     *
     * @return array<string,mixed>
     */
    public static function validar(string $gameName, string $tagLine): array
    {
        $apiKey = env('HENRIK_API_KEY');
        if ($apiKey === null || $apiKey === '') {
            return ['ok' => false, 'error' => 'no_key'];
        }

        $gameName = trim($gameName);
        $tagLine  = ltrim(trim($tagLine), '#');
        if ($gameName === '' || $tagLine === '') {
            return ['ok' => false, 'error' => 'not_found'];
        }

        $url = self::ENDPOINT . rawurlencode($gameName) . '/' . rawurlencode($tagLine);

        $ch = curl_init($url);
        if ($ch === false) {
            return ['ok' => false, 'error' => 'upstream', 'http_code' => 0];
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER,  true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION,  true);
        curl_setopt($ch, CURLOPT_TIMEOUT,         self::TIMEOUT_SECONDS);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT,  self::CONNECT_TIMEOUT_SECONDS);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,  true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST,  2);
        // XAMPP Windows no trae un CA bundle funcional — usamos el que guardamos en el repo.
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

        // CURLE_OPERATION_TIMEDOUT = 28
        if ($errno === 28) {
            return ['ok' => false, 'error' => 'timeout'];
        }
        if ($errno !== 0 || $body === false) {
            return ['ok' => false, 'error' => 'upstream', 'http_code' => $httpCode];
        }

        if ($httpCode === 404) {
            return ['ok' => false, 'error' => 'not_found'];
        }
        if ($httpCode === 429) {
            return ['ok' => false, 'error' => 'rate_limit'];
        }
        if ($httpCode !== 200) {
            return ['ok' => false, 'error' => 'upstream', 'http_code' => $httpCode];
        }

        $json = json_decode($body, true);
        if (!is_array($json) || !isset($json['data']) || !is_array($json['data'])) {
            return ['ok' => false, 'error' => 'upstream', 'http_code' => $httpCode];
        }

        $data  = $json['data'];
        $puuid = isset($data['puuid']) ? (string) $data['puuid'] : '';
        if ($puuid === '') {
            // La API respondió 200 pero sin puuid — lo tratamos como no encontrado
            return ['ok' => false, 'error' => 'not_found'];
        }

        return [
            'ok'            => true,
            'puuid'         => $puuid,
            'region'        => isset($data['region'])        ? (string) $data['region']        : '',
            'account_level' => isset($data['account_level']) ? (int)    $data['account_level'] : 0,
            'card'          => $data['card']                 ?? null,
            'raw'           => $data,
        ];
    }
}
