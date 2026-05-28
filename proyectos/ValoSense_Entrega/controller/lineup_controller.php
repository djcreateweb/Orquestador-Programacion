<?php
function home(){
    session_start();
    if (!isset($_SESSION['usuario'])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/lineup_model.php");
    $model = new Lineup_model();
    $lineups = $model->get_todos_aprobados();
    $agentes = $model->get_agentes();
    $agente_id = isset($_GET['agente_id']) ? (int)$_GET['agente_id'] : 0;
    $mapa_sel = isset($_GET['mapa']) ? trim($_GET['mapa']) : '';
    $lado_sel = isset($_GET['lado']) ? trim($_GET['lado']) : 'Ataque';
    $lineups_agente = array();
    if ($agente_id > 0 && !empty($mapa_sel)) {
        $lineups_agente = $model->get_por_agente_mapa($agente_id, $mapa_sel, $lado_sel);
    }
    require_once("view/lineup_view.php");
}

function enviar(){
    session_start();
    $message = "";
    require_once("view/lineup_enviar_view.php");
}
?>
