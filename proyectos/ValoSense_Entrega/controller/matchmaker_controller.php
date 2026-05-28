<?php
function home(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/matchmaker_model.php");
    $model = new Matchmaker_model();
    $message = "";
    $jugadores = array();
    $rango_sel = "";
    $agente_sel = "";
    $rol_sel = "";
    $perfil_incompleto = (!isset($_SESSION["usuario"]["perfil_completo"]) || $_SESSION["usuario"]["perfil_completo"] === 'no');
    $agentes = $model->get_agentes();
    if (!$perfil_incompleto && isset($_POST["buscar"])) {
        $rango_sel = isset($_POST["rango"]) ? $_POST["rango"] : "";
        $agente_sel = isset($_POST["agente_id"]) ? $_POST["agente_id"] : "";
        $rol_sel = isset($_POST["rol"]) ? $_POST["rol"] : "";
        if ($rango_sel == "") {
            $message = "Selecciona un rango para buscar jugadores";
        } else {
            $jugadores = $model->get_jugadores($rango_sel, $agente_sel, $_SESSION["usuario"]["id"], $rol_sel);
            if (empty($jugadores)) {
                $message = "No hay jugadores con esos filtros";
            } else {
                require_once("model/amistad_model.php");
                $amistad_model = new Amistad_model();
                $me_id = $_SESSION["usuario"]["id"];
                foreach ($jugadores as &$j) {
                    $rel = $amistad_model->estado_entre($me_id, $j['id']);
                    $j['rel_estado'] = $rel['estado'];
                    $j['rel_id'] = $rel['amistad_id'];
                }
                unset($j);
            }
        }
    }
    require_once("view/matchmaker_view.php");
}

?>
