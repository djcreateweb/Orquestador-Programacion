<?php
function home(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/chat_model.php");
    $chat = new Chat_model();
    $me = $_SESSION["usuario"]["id"];
    $amigos = $chat->get_resumen_amigos($me);
    $amigo_id = isset($_GET["id"]) ? $_GET["id"] : 0;
    $amigo_actual = null;
    $mensajes = array();
    if ($amigo_id > 0) {
        foreach ($amigos as $a) {
            if ($a["usuario_id"] == $amigo_id) {
                $amigo_actual = $a;
                break;
            }
        }
        if ($amigo_actual) {
            $chat->marcar_leidos($me, $amigo_id);
            $mensajes = $chat->get_conversacion($me, $amigo_id);
        }
    }
    require_once("view/chat_view.php");
}

function enviar(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/chat_model.php");
    $chat = new Chat_model();
    $me = $_SESSION["usuario"]["id"];
    $target_id = isset($_POST["target_id"]) ? $_POST["target_id"] : "";
    $contenido = isset($_POST["contenido"]) ? $_POST["contenido"] : "";
    if ($target_id != "" && $contenido != "") {
        $chat->enviar_mensaje($me, $target_id, $contenido);
    }
    header('Location: index.php?controlador=chat&action=home&id=' . $target_id);
    exit();
}
?>
