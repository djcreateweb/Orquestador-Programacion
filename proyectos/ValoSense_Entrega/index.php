<?php
if (!empty($_POST['ajax'])) {
    require_once("controller/front_controller.php");
    exit();
}
$ctrl   = $_GET['controlador'] ?? 'home';
$action = $_GET['action']      ?? 'home';
$bloquear_zoom_100 = (
    ($ctrl === 'lineup' && in_array($action, ['home', 'enviar'], true)) ||
    ($ctrl === 'admin' && $action === 'lineups')
);
$desactivar_orbs = ($ctrl === 'admin' && $action === 'lineups');
?>
<html lang="es"><head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="imagenes/favicon.svg">
    <link rel="shortcut icon" href="imagenes/favicon.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0<?php echo $bloquear_zoom_100 ? ', minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' : ''; ?>">
    <title>ValorantSense</title>
    <!-- Hoja de estilos principal -->
    <link rel="stylesheet" href="css/styles.css">
    <?php
    $css_map = [
        'home'       => 'home.css',
        'chat'       => 'chat.css',
        'contacto'   => 'contacto.css',
        'explorar'   => 'explorar.css',
        'lineup'     => 'lineup.css',
        'matchmaker' => 'matchmaker.css',
        'perfil'     => 'perfil.css',
        'team'       => 'team.css',
        'legal'      => 'contacto.css',
        'sitemap'    => 'contacto.css',
        'usuario'    => 'auth.css',
        'admin'      => 'lineup.css',
    ];

    $js_map = [
        'home'       => 'home.js',
        'chat'       => 'chat.js',
        'explorar'   => 'explorar.js',
        'lineup'     => 'lineup.js',
        'matchmaker' => 'matchmaker.js',
        'team'       => 'team.js',
        'usuario'    => 'auth.js',
    ];

    // ajustes.css cuando es usuario+ajustes
    $extra_css = ($ctrl === 'usuario' && $action === 'ajustes') ? 'ajustes.css' : null;

    if (isset($css_map[$ctrl]))
        echo '<link rel="stylesheet" href="css/' . $css_map[$ctrl] . '">' . "\n";
    if ($extra_css)
        echo '<link rel="stylesheet" href="css/' . $extra_css . '">' . "\n";
    if (isset($js_map[$ctrl]))
        echo '<script src="js/' . $js_map[$ctrl] . '"></script>' . "\n";
    if (!$desactivar_orbs)
        echo '<script src="js/hero-orbs.js"></script>' . "\n";
    ?>
    <?php if ($bloquear_zoom_100): ?>
    <script>
    window.bloquearZoom100 = true;
    function normalizarZoomLineup() {
        document.documentElement.style.zoom = '100%';
        document.documentElement.style.transform = 'none';
        if (document.body) {
            document.body.style.zoom = '100%';
            document.body.style.transform = 'none';
        }
    }
    normalizarZoomLineup();
    window.addEventListener('DOMContentLoaded', normalizarZoomLineup);
    window.addEventListener('pageshow', function(e) {
        normalizarZoomLineup();
        if (e.persisted) window.location.reload();
    });
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    document.addEventListener('keydown', function(e) {
        var tecla = e.key;
        var bloqueada = tecla === '+' || tecla === '-' || tecla === '=' || tecla === '0';
        if ((e.ctrlKey || e.metaKey) && bloqueada) e.preventDefault();
    });
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });
    </script>
    <?php endif; ?>
    <script src="js/crosshair.js"></script>
</head>
<body>
    <?php
    require_once("controller/front_controller.php");
    require_once("view/footer.php");
    ?>
    <script src="js/validacion.js"></script>
    <script src="js/main.js"></script>
</body></html>
