<?php
// =====================================================
// CSRF helpers
// =====================================================
function csrf_token(){
    if(empty($_SESSION['csrf'])){
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(){
    return '<input type="hidden" name="csrf" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES) . '">';
}

function csrf_check(){
    return !empty($_POST['csrf']) && !empty($_SESSION['csrf'])
        && hash_equals($_SESSION['csrf'], (string)$_POST['csrf']);
}

// =====================================================
// Metadata SEO por vista. El controller llama page_meta([...]) antes de
// incluir la vista; index.php lee $GLOBALS['page_meta'] para renderizar
// <title>, <meta description>, canonical y OpenGraph.
// =====================================================
function page_meta(array $overrides = []): array {
    $base = [
        'title'       => 'ValoSense · Sube de rango en Valorant con inteligencia',
        'description' => 'Matchmaking por rango, lineups verificados de YouTube y rutinas de entrenamiento para jugadores de Valorant.',
        'og_image'    => 'imagenes/logo.svg',
        'canonical'   => null,
        'robots'      => 'index,follow',
        'jsonld'      => [],
    ];
    if (!isset($GLOBALS['page_meta'])) $GLOBALS['page_meta'] = $base;
    $GLOBALS['page_meta'] = array_replace($GLOBALS['page_meta'], $overrides);
    return $GLOBALS['page_meta'];
}

// URL absoluta del request actual (para canonical + og:url).
function current_url(): string {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
           || (($_SERVER['SERVER_PORT'] ?? 80) == 443);
    $scheme = $https ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST']   ?? 'localhost';
    $uri    = $_SERVER['REQUEST_URI'] ?? '/';
    return $scheme . '://' . $host . $uri;
}

// URL absoluta del sitio (sin path) — base para canonical de listados.
function site_base_url(): string {
    $u = current_url();
    return preg_replace('#\?.*$#', '', $u);
}

// =====================================================
// Redirect seguro: acepta sólo rutas relativas propias de la app
// (empezando por `index.php`). Evita open-redirect por $_POST['redirect']
// o $_GET['next']. El fallback se usa si la URL pasada no cumple.
// =====================================================
function safe_redirect(string $url, string $fallback = 'index.php'): string {
    $url = (string)$url;
    if ($url === '' || $url[0] === '/') {
        // '/algo' puede ser absoluto dentro del mismo host, pero lo descartamos
        // por simplicidad: todas nuestras rutas empiezan por `index.php`.
        return $fallback;
    }
    // Rechaza esquemas (http://, //evil.com, javascript:, data:…)
    if (preg_match('#^[a-z][a-z0-9+.\-]*:#i', $url) || str_starts_with($url, '//')) {
        return $fallback;
    }
    // Corta nuevas líneas (header injection)
    if (preg_match('/[\r\n]/', $url)) {
        return $fallback;
    }
    // Debe empezar por `index.php` (con querystring o fragmento opcional)
    if (!preg_match('#^index\.php(\?|\#|$)#', $url)) {
        return $fallback;
    }
    return $url;
}

// =====================================================
// YouTube embed — devuelve about:blank si la URL no
// es de YouTube, para que no se pueda colar javascript:
// =====================================================
function youtube_embed($url){
    if(preg_match('#(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_-]{11})#', $url, $m)){
        return "https://www.youtube.com/embed/" . $m[1];
    }
    return "about:blank";
}

/**
 * Devuelve la URL sólo si es http(s) absoluta válida, o 'about:blank'.
 * Defensa en profundidad antes de renderizar <a href>/<iframe src>.
 */
function safe_http_url(?string $url): string {
    $url = (string)$url;
    if (!filter_var($url, FILTER_VALIDATE_URL)) return 'about:blank';
    $esquema = strtolower((string)parse_url($url, PHP_URL_SCHEME));
    if ($esquema !== 'http' && $esquema !== 'https') return 'about:blank';
    return $url;
}

/**
 * Genera stats "jugables" deterministas para un usuario demo a partir
 * de su username. Mismo user → mismos stats (CRC32 como seed).
 */
function fake_player_stats($username, $region = 'EU'){
    $seed = abs(crc32((string)$username));
    $estilos_opts = ['Agresivo','Táctico','Soporte','Entry fragger','Lurker','Clutch player'];
    $disp_opts    = ['Tardes 18-22h','Noches 22-02h','Fines de semana','Mañanas','Flexible'];
    $langs_by_region = [
        'EU'    => 'Español · Inglés',
        'NA'    => 'Inglés',
        'LATAM' => 'Español',
        'BR'    => 'Portugués',
        'AP'    => 'Inglés',
        'KR'    => 'Coreano',
    ];
    return [
        'kd'     => number_format(0.75 + ($seed % 180) / 100, 2),
        'wr'     => 42 + ($seed % 38),           // 42–79 %
        'hs'     => 15 + ($seed % 33),           // 15–47 %
        'hours'  => 180 + ($seed % 1820),        // 180–1999
        'games'  => 420 + ($seed % 2880),        // 420–3299
        'nivel'  => 60 + ($seed % 240),          // 60–299
        'estilo' => $estilos_opts[$seed % count($estilos_opts)],
        'disp'   => $disp_opts[$seed % count($disp_opts)],
        'lang'   => $langs_by_region[$region] ?? 'Inglés',
    ];
}

/**
 * Genera una descripción única para un agente en un mapa concreto.
 * - Si el meta tiene nota específica (agente_mapa_meta.nota), se usa.
 * - Si no, se construye combinando rasgos únicos del agente y del mapa,
 *   de forma que cada par (agente, mapa) produzca una frase distinta.
 */
function descripcion_agente_mapa($agente, $mapa){
    static $rasgos_agente = [
        'Jett'      => 'duelista ágil con dash y cuchillos ultimate: ideal para entries verticales y holds con Operator',
        'Reyna'     => 'duelista self-sustain que se alimenta de frags con alma y dismiss; necesita snowballear',
        'Raze'      => 'duelista explosiva con boombot y granadas para despejar ángulos cortos',
        'Phoenix'   => 'duelista independiente con flash curvada, muro de fuego y auto-heal',
        'Yoru'      => 'duelista de flanco con teletransporte y clon — premia el engaño y el timing',
        'Neon'      => 'duelista veloz con sprint eléctrico y stuns: domina pasillos cortos',
        'Iso'       => 'duelista de duelos limpios con escudo propio y flash indetectable',
        'Sova'      => 'iniciador de info pura con recon darts y ult que atraviesa paredes',
        'Breach'    => 'iniciador de impacto con stuns y faults que rompen defensas compactas',
        'Skye'      => 'iniciadora con flashes, perro de info y heal de equipo',
        'KAY/O'     => 'iniciador con knife de supresión que anula habilidades enemigas y flashes largas',
        'Fade'      => 'iniciadora con prowlers y ult que marca posiciones: info en espacios cerrados',
        'Gekko'     => 'iniciador con utilidad reutilizable y capacidad de desactivar spike a distancia',
        'Brimstone' => 'controlador clásico con 3 humos aéreos, molly incendiaria y ultimate orbital',
        'Viper'     => 'controladora del muro eléctrico y humo decay — imprescindible en mapas abiertos',
        'Omen'      => 'controlador versátil con humos recargables, paranoia y teletransporte global',
        'Astra'     => 'controladora galáctica: coloca estrellas por el mapa y las convierte en humo, stun o pull',
        'Harbor'    => 'controlador acuático con muros de agua para cobertura amplia en ejecutes',
        'Clove'     => 'controladora revivible: humos auto-regenerables y reanimación tras morir',
        'Sage'      => 'sentinel de soporte con muro, lenta, heal y revive',
        'Cypher'    => 'sentinel de info: tripwires, cámara espía y trap invisible para cazar flancos',
        'Killjoy'   => 'sentinel alemana: turret, alarmbot, mollys nanoswarm y ult de lockdown',
        'Chamber'   => 'sentinel con Operator propio, trampa marcadora y teleport para reposicionar',
        'Deadlock'  => 'sentinel nórdica con sensor sonoro, muro de malla y ult cápsula que atrapa',
        'Vyse'      => 'sentinel moderna con traps que frenan y humo efímero — demoledora contra ejecutes rápidos',
    ];

    static $hints_mapa = [
        'Ascent'   => 'En Ascent todo gira en torno al mid abierto y al control de B main — quien domine mid gana',
        'Bind'     => 'Bind no tiene mid pero sí dos teleports, premia sentinels y utilidad corta',
        'Breeze'   => 'Breeze es gigante y muy abierto: reinan Viper y el Operator, cuesta jugarlo sin smokes grandes',
        'Fracture' => 'Fracture es en forma de H con spawn dividido: premia ejecutes coordinados y flashes largas',
        'Haven'    => 'Haven tiene 3 sitios, así que brillan los que dan info o rotan rápido entre ellos',
        'Icebox'   => 'Icebox es vertical y con mucha altura: premia recon y muros grandes',
        'Lotus'    => 'Lotus tiene 3 sitios con puertas giratorias — la info y las rotaciones mandan',
        'Pearl'    => 'Pearl premia el control de mid con sightlines largas y conectores estrechos',
        'Split'    => 'Split es estrecho con mid vertical, agentes de utilidad corta y stuns mandan',
        'Sunset'   => 'Sunset tiene mid con market y dos sitios compactos, premia ejecutes rápidos',
        'Abyss'    => 'Abyss tiene huecos de caída y pasarelas: cuidado con empujones, premia self-sustain y lockdown',
    ];

    // Tono según tier del meta
    $prefijo = '';
    $tier = $agente['tier'] ?? '';
    if($tier === 'S'){
        $prefijo = 'S-tier meta en este mapa. ';
    } elseif($tier === 'A'){
        $prefijo = 'Sólida opción meta. ';
    } else {
        $prefijo = 'Pick de reserva, no es meta pero puede funcionar si lo dominas. ';
    }

    // Si hay nota específica seeded, combinarla con el prefijo de tier
    if(!empty($agente['nota'])){
        return $prefijo . $agente['nota'];
    }

    $rasgo = $rasgos_agente[$agente['nombre']] ?? ($agente['rol'] ?? 'Agente') . ' genérico';
    $hint  = $hints_mapa[$mapa] ?? 'Valora cómo encaja con los demás agentes del equipo';

    return $prefijo . ucfirst($agente['nombre']) . ' es ' . $rasgo . '. ' . $hint . '.';
}

/**
 * Detecta automáticamente el tipo de mensaje del chat:
 *   - discord_link:  invitación a servidor de Discord (con o sin protocolo)
 *   - discord_id:    snowflake de 17–19 dígitos
 *   - riot_id:       Riot ID de Valorant (Nombre#TAG)
 *   - valorant_code: código de partida (#CODIGO, code: CODIGO o bare alfanum)
 *   - text (por defecto)
 *
 * Detecta el mensaje ENTERO (tras trim). Para evitar falsos positivos el
 * mensaje debe ser exclusivamente el dato; mezclado con texto queda "text".
 */
function detectar_tipo_mensaje($contenido){
    $c = trim((string)$contenido);
    if($c === '') return 'text';

    // 1) Invitación / enlace a Discord (admite sin https://)
    if(preg_match('#^(https?://)?(www\.)?(discord\.gg|discord(app)?\.com)/[A-Za-z0-9_\-/?=&.]+$#i', $c)){
        return 'discord_link';
    }

    // 2) Snowflake de Discord (17–19 dígitos)
    if(preg_match('/^\d{17,19}$/', $c)) return 'discord_id';

    // 3) Riot ID: Nombre#TAG (el # va ENTRE el nombre y el tag)
    //    Nombre: 3–16 caracteres alfanuméricos/espacios/._-
    //    TAG:    2–5 alfanuméricos
    if(preg_match('/^[A-Za-z0-9 _.\-]{3,16}#[A-Za-z0-9]{2,5}$/u', $c)) return 'riot_id';

    // 4) Código de partida Valorant: #CODE o code: CODE
    if(preg_match('/^#[A-Za-z0-9]{4,12}$/', $c)) return 'valorant_code';
    if(preg_match('/^code:\s*[A-Za-z0-9]{4,12}$/i', $c)) return 'valorant_code';
    //    …o código "pelado" 5–8 alfanum. MAYÚSCULAS con al menos una letra y un dígito
    if(preg_match('/^[A-Z0-9]{5,8}$/', $c) && preg_match('/[A-Z]/', $c) && preg_match('/\d/', $c)){
        return 'valorant_code';
    }

    return 'text';
}

/**
 * Render seguro de una URL de Discord. Devuelve about:blank si no pasa la regex.
 */
function safe_discord_link($url){
    if(preg_match('#^https?://(www\.)?(discord\.gg|discord(app)?\.com)/[A-Za-z0-9_\-\/]+#i', (string)$url)){
        return $url;
    }
    return 'about:blank';
}

/**
 * Descripción corta del rol que cubre un tipo de agente.
 * Se usa para introducir las recomendaciones antes de listar ejemplos.
 */
function descripcion_rol($rol){
    static $descripciones = [
        'Duelist'    => 'Entry fragger. Entra primero a los sitios, crea espacio y gana duelos de apertura. El frag principal del equipo.',
        'Initiator'  => 'Rompe defensas con flashes, stuns e info. Prepara el ejecute y deja a los duelistas entrar con ventaja.',
        'Controller' => 'Corta visión con humos y utilidad. Bloquea ángulos, ralentiza rotaciones y permite ejecutes limpios.',
        'Sentinel'   => 'Ancla el sitio y vigila flancos con trampas, cámaras y mollys. El guardián defensivo del equipo.',
    ];
    return $descripciones[$rol] ?? 'Rol del equipo que aporta utilidad específica al ejecute.';
}

/**
 * Devuelve el estado de presencia visible para mostrar el dot.
 * Retorna null si no debe mostrarse (invisible, inactivo ≥15min o sin datos).
 * Retorna 'en_linea' o 'ausente' si debe mostrarse.
 */
function presencia_visible(?string $estado, ?string $ultima_actividad): ?string {
    if (!$estado || $estado === 'invisible') return null;
    if (!$ultima_actividad) return null;
    if (strtotime($ultima_actividad) < time() - 15 * 60) return null;
    return $estado; // 'en_linea' o 'ausente'
}

/**
 * Devuelve el nombre visible del usuario: display_name si existe, username como fallback.
 * Útil para mostrar el nombre real de cuentas Google y username para cuentas manuales.
 */
if (!function_exists('nombre_visible')) {
    function nombre_visible(?array $u): string {
        if (!$u) return '';
        $dn = trim((string)($u['display_name'] ?? ''));
        if ($dn !== '') return $dn;
        return (string)($u['username'] ?? '');
    }
}

/**
 * Nombre del rol en español (Duelist → Duelista, etc.)
 */
function rol_es($rol){
    static $es = [
        'Duelist' => 'Duelista', 'Initiator' => 'Iniciador',
        'Controller' => 'Controlador', 'Sentinel' => 'Centinela',
    ];
    return $es[$rol] ?? $rol;
}

/**
 * Versión MINI: una frase corta (≈80 chars) por agente+mapa.
 * Prioridad:
 *   1. Nota específica del meta del mapa (agente_mapa_meta.nota)
 *   2. Rasgo único del agente (distinto para cada uno)
 *   3. Fallback genérico (muy raro, solo agentes sin datos)
 */
function mini_descripcion_agente_mapa($agente, $mapa){
    if(!empty($agente['nota'])){
        return $agente['nota'];
    }

    // Un rasgo corto y distinto por agente para evitar texto repetido.
    static $rasgos_mini = [
        'Jett'      => 'Duelista ágil con dash y cuchillos. Ideal para entries verticales.',
        'Reyna'     => 'Duelista self-sustain: se alimenta de frags con alma y dismiss.',
        'Raze'      => 'Duelista explosiva con boombot y granadas para ángulos cortos.',
        'Phoenix'   => 'Duelista independiente con flash curvada, muro de fuego y heal.',
        'Yoru'      => 'Duelista de flanco con teletransporte y clon: premia el engaño.',
        'Neon'      => 'Duelista veloz con sprint eléctrico y stuns. Domina pasillos.',
        'Iso'       => 'Duelista de duelos limpios con escudo propio y flash indetectable.',
        'Sova'      => 'Iniciador de info pura: recon darts y ult que cruza paredes.',
        'Breach'    => 'Iniciador de impacto: stuns y faults que rompen defensas.',
        'Skye'      => 'Iniciadora con flashes, perro de info y heal de equipo.',
        'KAY/O'     => 'Iniciador con knife que anula habilidades y flashes largas.',
        'Fade'      => 'Iniciadora con prowlers y ult que marca posiciones enemigas.',
        'Gekko'     => 'Iniciador con utilidad reutilizable y desactivación de spike.',
        'Brimstone' => 'Controlador clásico: 3 humos aéreos, molly y ult orbital.',
        'Viper'     => 'Controladora del muro eléctrico. Reina en mapas abiertos.',
        'Omen'      => 'Controlador versátil: humos recargables, paranoia y teleport.',
        'Astra'     => 'Controladora galáctica: estrellas en humo, stun o pull.',
        'Harbor'    => 'Controlador acuático con muros de agua para cobertura amplia.',
        'Clove'     => 'Controladora revivible: humos auto-regenerables y reanimación.',
        'Sage'      => 'Sentinel de soporte: muro, lenta, heal y revive.',
        'Cypher'    => 'Sentinel de info: tripwires, cámara espía y trap invisible.',
        'Killjoy'   => 'Sentinel alemana: turret, alarmbot, mollys y ult de lockdown.',
        'Chamber'   => 'Sentinel con Operator propio, trampa marcadora y teleport.',
        'Deadlock'  => 'Sentinel nórdica: sensor sonoro, muro de malla y ult cápsula.',
        'Vyse'      => 'Sentinel moderna con traps que frenan y humo efímero.',
    ];

    $nombre = $agente['nombre'] ?? '';
    if(isset($rasgos_mini[$nombre])){
        return $rasgos_mini[$nombre];
    }

    // Último fallback (agentes nuevos sin rasgo registrado todavía).
    return ($agente['rol'] ?? 'Agente') . ' alternativo — viable si lo dominas.';
}
?>
