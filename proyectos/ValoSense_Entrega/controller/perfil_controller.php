<?php
function ver(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    require_once("model/matchmaker_model.php");
    require_once("model/amistad_model.php");
    $usuario_model = new Usuario_model();
    $matchmaker_model = new Matchmaker_model();
    $amistad_model = new Amistad_model();
    $id = isset($_GET["id"]) ? $_GET["id"] : 0;
    if ($id <= 0) {
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
    $perfil = $usuario_model->get_por_id($id);
    if (empty($perfil)) {
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
    $me = $_SESSION["usuario"]["id"];
    $resultado = $amistad_model->estado_entre($me, $id);
    $estado = $resultado['estado'];
    $rel_id = $resultado['amistad_id'];
    $favoritos = $matchmaker_model->get_agentes_by_usuario($id);
    require_once("view/perfil_view.php");
}
?>
