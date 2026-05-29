<?php
if (!empty($_POST['ajax'])) {
    require_once("controller/front_controller.php");
    exit();
}
?>
<html lang="es"><head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="imagenes/favicon.svg">
    <link rel="shortcut icon" href="imagenes/favicon.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ValorantSense</title>
    <!-- Hoja de estilos principal -->
    <link rel="stylesheet" href="css/styles.css">
    <?php
    $ctrl   = $_GET['controlador'] ?? 'home';
    $action = $_GET['action']      ?? 'home';

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
    echo '<script src="js/hero-orbs.js"></script>' . "\n";
    ?>
    <script src="js/crosshair.js"></script>
</head>
<body>
    <?php
    require_once("controller/front_controller.php");
    require_once("view/footer.php");
    ?>
    <script src="js/main.js"></script>
</body></html>
