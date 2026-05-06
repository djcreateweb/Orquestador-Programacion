<?php
define('CONTROLLERS_FOLDER', "controller/");
define('DEFAULT_CONTROLLER', "home");
define('DEFAULT_ACTION', "home");

// Whitelist explícita: controlador => [acciones permitidas]
// Cualquier combinación fuera de aquí cae a "pronto_view".
$RUTAS_PERMITIDAS = [
    'home'       => ['home'],
    'usuario'    => ['home','login','registro','gestionar','vincular','google','google_callback','vincular_google','desconectar','ajustes','cambiar_presencia','cambiar_password','eliminar_cuenta','editar_datos','cambiar_visibilidad_riot'],
    'lineup'     => ['home','enviar','gestionar'],
    'matchmaker' => ['home','gestionar'],
    'training'   => ['home'],
    'team'       => ['home'],
    'explorar'   => ['home'],
    'amistad'    => ['home','amigos','invitar','aceptar','rechazar','eliminar'],
    'perfil'     => ['ver'],
    'contacto'   => ['home','enviar'],
    'chat'       => ['home','enviar','poll'],
    'sitemap'    => ['xml'],
    'legal'      => ['terminos','privacidad','cookies','aviso'],
];

$controller_name = DEFAULT_CONTROLLER;
if (!empty($_GET['controlador'])) {
    $controller_name = preg_replace('/[^a-z_]/i', '', $_GET['controlador']);
}

$action_name = DEFAULT_ACTION;
if (!empty($_GET['action'])) {
    $action_name = preg_replace('/[^a-z_]/i', '', $_GET['action']);
}

$controller_path = CONTROLLERS_FOLDER . $controller_name . '_controller.php';

try {
    // Validar contra whitelist antes de incluir nada
    if (!array_key_exists($controller_name, $RUTAS_PERMITIDAS)) {
        throw new Exception('La sección "' . htmlspecialchars($controller_name) . '" no existe.');
    }
    if (!in_array($action_name, $RUTAS_PERMITIDAS[$controller_name], true)) {
        throw new Exception('Esta opción todavía no está implementada.');
    }
    if (!is_file($controller_path)) {
        throw new Exception('La sección "' . htmlspecialchars($controller_name) . '" aún no está disponible.');
    }

    require_once($controller_path);

    // Doble check: la función de la acción debe estar definida en ESTE archivo
    // (no acepta funciones globales de PHP como phpinfo, mail, etc.).
    if (!function_exists($action_name)) {
        throw new Exception('Esta opción todavía no está implementada.');
    }

    $action_name();

} catch (Throwable $e) {
    $pronto_mensaje = $e->getMessage();
    require_once("view/pronto_view.php");
}
?>
