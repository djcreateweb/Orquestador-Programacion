<?php
require_once("model/helpers.php");

function home(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = (int)$_SESSION["usuario"]["id"];

    // Vista "Solicitudes": solo invitaciones recibidas + enviadas.
    // Los amigos confirmados viven ahora en action=amigos.
    $recibidas = $model->get_recibidas($me);
    $enviadas  = $model->get_enviadas($me);

    $message = $_GET['msg'] ?? '';
    page_meta([
        'title'       => 'Solicitudes · ValoSense',
        'description' => 'Invitaciones de amistad recibidas y enviadas en ValoSense.',
        'robots'      => 'noindex,nofollow',
    ]);
    require_once("view/amistad_view.php");
}

// Lista de amigos confirmados (separada de las solicitudes).
function amigos(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = (int)$_SESSION["usuario"]["id"];

    $amigos  = $model->get_amigos($me);
    $message = $_GET['msg'] ?? '';
    page_meta([
        'title'       => 'Amigos · ValoSense',
        'description' => 'Tu lista de amigos en ValoSense con acceso a sus perfiles.',
        'robots'      => 'noindex,nofollow',
    ]);
    require_once("view/amistad_amigos_view.php");
}

function invitar(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        header('Location: index.php?controlador=amistad&action=home');
        exit();
    }

    $target_id = (int)($_POST['target_id'] ?? 0);
    $target_username = trim((string)($_POST['target_username'] ?? ''));
    $me = (int)$_SESSION["usuario"]["id"];
    $redirect = safe_redirect($_POST['redirect'] ?? '', 'index.php?controlador=amistad&action=home');

    // Si no viene target_id pero sí username, lo resolvemos
    if($target_id <= 0 && $target_username !== ''){
        require_once("model/usuario_model.php");
        $u = (new Usuario_model())->get_por_username($target_username);
        if(!empty($u)) $target_id = (int)$u['id'];
    }

    if($target_id <= 0 || $target_id === $me){
        header('Location: ' . $redirect);
        exit();
    }

    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $model->crear_invitacion($me, $target_id);
    $_SESSION['nav_counters_dirty'] = true;

    // Vuelve al sitio donde pulsó (matchmaker, perfil, amistad…)
    header('Location: ' . $redirect);
    exit();
}

function aceptar(){   _amistad_cambiar_estado('aceptar');   }
function rechazar(){  _amistad_cambiar_estado('rechazar');  }
function eliminar(){  _amistad_cambiar_estado('eliminar');  }

function _amistad_cambiar_estado($accion){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        header('Location: index.php?controlador=amistad&action=home');
        exit();
    }

    $id = (int)($_POST['id'] ?? 0);
    $me = (int)$_SESSION["usuario"]["id"];
    // 'redirect' viene del formulario (hidden input). Si venía con #amigos desde ajustes,
    // la vista debe enviarlo SIN el hash — el controller lo reenvía literalmente sin modificar.
    $redirect = safe_redirect($_POST['redirect'] ?? '', 'index.php?controlador=amistad&action=home');

    require_once("model/amistad_model.php");
    $model = new Amistad_model();

    if($id > 0){
        if     ($accion === 'aceptar')   $model->aceptar($id, $me);
        elseif ($accion === 'rechazar')  $model->rechazar($id, $me);
        elseif ($accion === 'eliminar')  $model->eliminar($id, $me);
        $_SESSION['nav_counters_dirty'] = true;
    }

    header('Location: ' . $redirect);
    exit();
}
?>
