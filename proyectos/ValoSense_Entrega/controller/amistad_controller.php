<?php
function home(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $recibidas = $model->get_recibidas($me);
    $enviadas = $model->get_enviadas($me);
    require_once("view/amistad_view.php");
}

function amigos(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $array = $model->get_amigos($me);
    require_once("view/amistad_amigos_view.php");
}

function invitar(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $target_id = 0;
    if (!empty($_POST["target_id"])) {
        $target_id = (int) $_POST["target_id"];
    } elseif (!empty($_POST["target_username"])) {
        require_once("model/usuario_model.php");
        $um = new Usuario_model();
        $target = $um->get_por_username($_POST["target_username"]);
        if ($target) {
            $target_id = (int) $target["id"];
        }
    }
    if ($target_id > 0 && $target_id != $me) {
        $model->crear_invitacion($me, $target_id);
    }
    header('Location: index.php?controlador=amistad&action=home');
    exit();
}

function aceptar(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $id = isset($_POST["id"]) ? $_POST["id"] : "";
    if ($id != "") {
        $model->aceptar($id, $me);
    }
    header('Location: index.php?controlador=amistad&action=home');
    exit();
}

function rechazar(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $id = isset($_POST["id"]) ? $_POST["id"] : "";
    if ($id != "") {
        $model->rechazar($id, $me);
    }
    header('Location: index.php?controlador=amistad&action=home');
    exit();
}

function eliminar(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/amistad_model.php");
    $model = new Amistad_model();
    $me = $_SESSION["usuario"]["id"];
    $id = isset($_POST["id"]) ? $_POST["id"] : "";
    if ($id != "") {
        $model->eliminar($id, $me);
    }
    header('Location: index.php?controlador=amistad&action=amigos');
    exit();
}
?>
