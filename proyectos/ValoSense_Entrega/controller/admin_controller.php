<?php
function comprobar_admin(){
    if (!isset($_SESSION["usuario"]) || empty($_SESSION["usuario"]["es_admin"])) {
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
}

function home(){
    usuarios();
}

function usuarios(){
    session_start();
    comprobar_admin();
    require_once("model/admin_model.php");
    $model = new Admin_model();
    $message = "";
    if (isset($_POST["borrar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "" && $id != $_SESSION["usuario"]["id"]) {
            $model->borrar_usuario($id);
        }
        header('Location: index.php?controlador=admin&action=usuarios');
        exit();
    } elseif (isset($_POST["cambiar_rol"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        $es_admin = isset($_POST["es_admin"]) ? (int)$_POST["es_admin"] : 0;
        if ($id != "" && $id != $_SESSION["usuario"]["id"]) {
            $model->cambiar_rol_usuario($id, $es_admin);
        }
        header('Location: index.php?controlador=admin&action=usuarios');
        exit();
    }
    $seccion = "usuarios";
    $array = $model->get_usuarios();
    require_once("view/admin_view.php");
}

function lineups(){
    session_start();
    comprobar_admin();
    require_once("model/admin_model.php");
    $model = new Admin_model();
    if (isset($_POST["aprobar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "") $model->aprobar_lineup($id);
        header('Location: index.php?controlador=admin&action=lineups');
        exit();
    } elseif (isset($_POST["borrar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "") $model->borrar_lineup($id);
        header('Location: index.php?controlador=admin&action=lineups');
        exit();
    }
    $seccion = "lineups";
    $pendientes = $model->get_lineups_pendientes();
    $aprobados = $model->get_lineups_aprobados_usuarios();
    require_once("view/admin_view.php");
}

function guardar_lineup(){
    session_start();
    comprobar_admin();
    require_once("model/admin_model.php");
    $model = new Admin_model();
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
    if ($mapa != "" && $titulo != "" && $agente_id > 0) {
        $model->guardar_lineup(
            $_SESSION['usuario']['id'],
            $agente_id, $mapa, $lado, $habilidad,
            $inicio_x, $inicio_y, $destino_x, $destino_y,
            $titulo, $descripcion, $video_url
        );
    }
    header('Location: index.php?controlador=lineup&action=home');
    exit();
}

function eliminar_lineup(){
    session_start();
    comprobar_admin();
    require_once("model/admin_model.php");
    $model = new Admin_model();
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id > 0) {
        $model->borrar_lineup($id);
    }
    $mapa = isset($_POST['mapa']) ? trim($_POST['mapa']) : '';
    $lado = isset($_POST['lado']) ? trim($_POST['lado']) : 'Ataque';
    $agente_id = isset($_POST['agente_id']) ? (int)$_POST['agente_id'] : 0;
    header('Location: index.php?controlador=lineup&action=home&mapa=' . urlencode($mapa) . '&lado=' . urlencode($lado) . '&agente_id=' . $agente_id);
    exit();
}
?>
