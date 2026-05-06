<?php
function home(){
    require_once("model/team_model.php");

    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $model = new Team_model();
    $mapas = $model->get_mapas();

    $mapa = $_GET["mapa"] ?? "";
    $seleccionados = $_GET["agentes"] ?? [];
    if(!is_array($seleccionados)){ $seleccionados = []; }
    $seleccionados = array_values(array_unique(array_map('intval', $seleccionados)));
    $seleccionados = array_slice($seleccionados, 0, 5);

    $agentes = [];
    $resultado = null;

    if($mapa !== "" && in_array($mapa, $mapas, true)){
        $agentes = $model->get_agentes_con_meta($mapa);
        if(isset($_GET["recomendar"])){
            $resultado = $model->recomendar($mapa, $seleccionados);
        }
    }

    page_meta([
        'title'       => 'Composición · Recomendador de comp · ValoSense',
        'description' => 'Elige mapa y agentes ya elegidos; el recomendador sugiere picks flex para completar tu composición en Valorant.',
    ]);

    require_once("view/team_view.php");
}
?>
