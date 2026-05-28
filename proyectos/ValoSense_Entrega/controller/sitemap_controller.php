<?php
function xml(){
    session_start();
    header('Content-Type: application/xml; charset=utf-8');
    $mapas = [
        'Ascent',
        'Bind',
        'Breeze',
        'Fracture',
        'Haven',
        'Icebox',
        'Lotus',
        'Pearl',
        'Split',
        'Sunset',
        'Abyss',
    ];
    $urls = [
        'index.php',
        'index.php?controlador=explorar&action=home',
        'index.php?controlador=lineup&action=home',
        'index.php?controlador=training&action=home',
        'index.php?controlador=team&action=home',
        'index.php?controlador=usuario&action=home',
    ];
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $url) {
        echo "  <url>\n";
        echo '    <loc>' . htmlspecialchars($url) . "</loc>\n";
        echo "  </url>\n";
    }
    foreach ($mapas as $mapa) {
        echo "  <url>\n";
        echo '    <loc>' . htmlspecialchars('index.php?controlador=lineup&action=home&mapa=' . $mapa) . "</loc>\n";
        echo "  </url>\n";
    }
    echo '</urlset>' . "\n";
    exit();
}
?>
