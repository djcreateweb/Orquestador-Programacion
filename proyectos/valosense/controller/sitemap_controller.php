<?php
// =====================================================
// sitemap_controller.php
// Genera un sitemap XML dinámico con las URLs públicas:
// home, explorar, login, lineups (con combinaciones de mapa),
// training, team. Lineup/chat/amistad privadas no se incluyen.
// =====================================================

function xml(){
    // Vacía el buffer para no mezclar con el HTML base de index.php.
    while (ob_get_level() > 0) { ob_end_clean(); }
    header('Content-Type: application/xml; charset=utf-8');

    // Detección correcta de HTTPS (alineada con helpers.php::current_url).
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
           || (($_SERVER['SERVER_PORT'] ?? 80) == 443);
    $base = rtrim(($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), '/');

    // Detecta subruta (en XAMPP suele servirse bajo /ValoSense/).
    $script = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    $prefix = rtrim(dirname($script), '/\\');
    $root   = $base . ($prefix === '' ? '' : $prefix) . '/';

    $lastmod = date('c');

    $urls = [
        ['loc' => $root,                                                 'priority' => '1.0', 'changefreq' => 'weekly'],
        ['loc' => $root . 'index.php?controlador=explorar&action=home',  'priority' => '0.8', 'changefreq' => 'monthly'],
        ['loc' => $root . 'index.php?controlador=lineup&action=home',    'priority' => '0.9', 'changefreq' => 'weekly'],
        ['loc' => $root . 'index.php?controlador=training&action=home',  'priority' => '0.8', 'changefreq' => 'monthly'],
        ['loc' => $root . 'index.php?controlador=team&action=home',      'priority' => '0.7', 'changefreq' => 'monthly'],
        ['loc' => $root . 'index.php?controlador=usuario&action=home',   'priority' => '0.5', 'changefreq' => 'monthly'],
    ];

    // Una URL por cada mapa oficial de Valorant (combinado con el listado de lineups).
    $mapas = ['Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss'];
    foreach ($mapas as $m) {
        $urls[] = [
            'loc'        => $root . 'index.php?controlador=lineup&action=home&mapa=' . urlencode($m),
            'priority'   => '0.7',
            'changefreq' => 'monthly',
        ];
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $u) {
        echo "  <url>\n";
        echo '    <loc>' . htmlspecialchars($u['loc'], ENT_QUOTES | ENT_XML1) . "</loc>\n";
        echo '    <lastmod>' . $lastmod . "</lastmod>\n";
        echo '    <changefreq>' . $u['changefreq'] . "</changefreq>\n";
        echo '    <priority>' . $u['priority'] . "</priority>\n";
        echo "  </url>\n";
    }
    echo '</urlset>' . "\n";
    exit;
}
