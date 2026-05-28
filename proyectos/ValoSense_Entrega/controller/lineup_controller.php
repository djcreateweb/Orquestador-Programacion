<?php
function home(){
    session_start();
    require_once("model/lineup_model.php");
    $model = new Lineup_model();

    // el JS filtra por mapa/lado/agente en cliente, PHP pasa todos los lineups
    $lineups = $model->get_todos_aprobados();

    require_once("view/lineup_view.php");
}

function enviar(){
    session_start();
    $message = "";
    require_once("view/lineup_enviar_view.php");
}

function gestionar(){
    session_start();
    if (!isset($_SESSION["usuario"]) || empty($_SESSION["usuario"]["es_admin"])) {
        header('Location: index.php?controlador=lineup&action=home');
        exit();
    }
    require_once("model/lineup_model.php");
    $model = new Lineup_model();
    if (isset($_POST["aprobar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "") $model->aprobar($id);
        header('Location: index.php?controlador=lineup&action=gestionar');
        exit();
    } elseif (isset($_POST["borrar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "") $model->borrar($id);
        header('Location: index.php?controlador=lineup&action=gestionar');
        exit();
    }
    $pendientes = $model->get_pendientes();
    $aprobados = $model->get_aprobados();
    require_once("view/gestiona_lineup_view.php");
}
?>
