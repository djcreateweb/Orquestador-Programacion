<?php
// muestra errores en consola
function console_log($data) {
    echo '<script>';
    echo 'console.log(' . json_encode($data) . ')';
    echo '</script>';
}

// carpeta de controladores
define('CONTROLLERS_FOLDER', "controller/");
// controlador por defecto
define('DEFAULT_CONTROLLER', "home");
// acción por defecto
define('DEFAULT_ACTION', "home");

$controller = DEFAULT_CONTROLLER;
if (!empty($_GET['controlador']))
    $controller = $_GET['controlador'];

$action = DEFAULT_ACTION;
if (!empty($_GET['action']))
    $action = $_GET['action'];

// forma la ruta del controlador
$controller = CONTROLLERS_FOLDER . $controller . '_controller.php';

try {
    if (is_file($controller)) {
        require_once($controller);
    } else {
        throw new Exception('El controlador no existe - 404 not found');
    }

    if (is_callable($action)) {
        $action();
    } else {
        throw new Exception('La accion no existe - 404 not found');
    }
} catch (Exception $e) {
    console_log($e->getMessage());
}
?>
