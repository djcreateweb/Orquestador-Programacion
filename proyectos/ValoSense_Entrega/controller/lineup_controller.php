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

function eliminar() {
    session_start();
    if (!isset($_SESSION['usuario']) || $_SESSION['usuario']['es_admin'] != 1) {
        header('Location: index.php?controlador=lineup&action=home');
        exit();
    }
    require_once("model/lineup_model.php");
    $model = new Lineup_model();
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id > 0) {
        $model->eliminar_lineup($id);
    }
    $mapa = isset($_POST['mapa']) ? trim($_POST['mapa']) : '';
    $lado = isset($_POST['lado']) ? trim($_POST['lado']) : 'Ataque';
    $agente_id = isset($_POST['agente_id']) ? (int)$_POST['agente_id'] : 0;
    header('Location: index.php?controlador=lineup&action=home&mapa=' . urlencode($mapa) . '&lado=' . urlencode($lado) . '&agente_id=' . $agente_id);
    exit();
}

function guardar() {
    session_start();
    if (!isset($_SESSION['usuario']) || $_SESSION['usuario']['es_admin'] != 1) {
        header('Location: index.php?controlador=lineup&action=home');
        exit();
    }
    require_once("model/lineup_model.php");
    $model = new Lineup_model();

    $mapa = isset($_POST['mapa']) ? trim($_POST['mapa']) : '';
    $lado = isset($_POST['lado']) ? trim($_POST['lado']) : 'Ataque';
    $agente_id = isset($_POST['agente_id']) ? (int)$_POST['agente_id'] : 0;
    $habilidad = isset($_POST['habilidad']) ? trim($_POST['habilidad']) : '';
    $inicio_x = isset($_POST['inicio_x']) ? (float)$_POST['inicio_x'] : 0;
    $inicio_y = isset($_POST['inicio_y']) ? (float)$_POST['inicio_y'] : 0;
    $destino_x = isset($_POST['destino_x']) ? (float)$_POST['destino_x'] : 0;
    $destino_y = isset($_POST['destino_y']) ? (float)$_POST['destino_y'] : 0;
    $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
    $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
    $video_url = isset($_POST['video_url']) ? trim($_POST['video_url']) : '';

    if (empty($mapa) || empty($titulo) || $agente_id === 0) {
        header('Location: index.php?controlador=lineup&action=home');
        exit();
    }

    $model->guardar_lineup(
        $_SESSION['usuario']['id'],
        $agente_id, $mapa, $lado, $habilidad,
        $inicio_x, $inicio_y, $destino_x, $destino_y,
        $titulo, $descripcion, $video_url
    );

    header('Location: index.php?controlador=lineup&action=home');
    exit();
}

function gestionar(){
    session_start();
    // solo el admin puede guardar lineups
    if (!isset($_SESSION['usuario']) || $_SESSION['usuario']['es_admin'] != 1) {
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
