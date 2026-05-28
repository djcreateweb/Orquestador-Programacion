<?php
function home(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/team_model.php");
    $model = new Team_model();
    $mapas = $model->get_mapas();
    $mapa = isset($_GET["mapa"]) ? $_GET["mapa"] : "";
    $seleccionados = isset($_GET["agentes"]) ? $_GET["agentes"] : [];
    if (!is_array($seleccionados)) $seleccionados = [];
    $seleccionados = array_slice(array_values(array_unique(array_map('intval', $seleccionados))), 0, 5);
    $agentes = [];
    $resultado = null;
    if ($mapa != "") {
        $agentes = $model->get_agentes_con_meta($mapa);
        if (isset($_GET["recomendar"])) {
            $resultado = $model->recomendar($mapa, $seleccionados);
        }
    }
    require_once("view/team_view.php");
}
?>
