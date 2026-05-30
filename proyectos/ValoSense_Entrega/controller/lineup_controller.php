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
    $modo_envio_lineup = true;
    // lineups que ya ha enviado este usuario (para el apartado de la barra lateral)
    $mis_envios = $model->get_envios_usuario($_SESSION['usuario']['id']);
    require_once("view/lineup_view.php");
}

function guardar_envio(){
    session_start();
    if (!isset($_SESSION['usuario'])) {
        if (!empty($_POST['ajax'])) {
            header('Content-Type: application/json');
            echo json_encode(['ok' => false]);
            exit();
        }
        header('Location: index.php?controlador=usuario&action=home');
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

    $nuevo_id = false;
    if ($mapa != "" && $titulo != "" && $agente_id > 0 && $habilidad != "") {
        $nuevo_id = $model->guardar_envio_usuario(
            $_SESSION['usuario']['id'],
            $agente_id, $mapa, $lado, $habilidad,
            $inicio_x, $inicio_y, $destino_x, $destino_y,
            $titulo, $descripcion, $video_url
        );
    }

    if (!empty($_POST['ajax'])) {
        header('Content-Type: application/json');
        $respuesta = ['ok' => (bool)$nuevo_id, 'id' => $nuevo_id];
        if ($nuevo_id) {
            $nombre_agente = '';
            foreach ($model->get_agentes() as $ag) {
                if ((int)$ag['id'] === $agente_id) {
                    $nombre_agente = $ag['nombre'];
                    break;
                }
            }
            $respuesta['lineup'] = [
                'id' => $nuevo_id,
                'agente_id' => $agente_id,
                'agente' => $nombre_agente,
                'agente_nombre' => $nombre_agente,
                'mapa' => $mapa,
                'lado' => $lado,
                'habilidad' => $habilidad,
                'inicio_x' => $inicio_x,
                'inicio_y' => $inicio_y,
                'destino_x' => $destino_x,
                'destino_y' => $destino_y,
                'titulo' => $titulo,
                'descripcion' => $descripcion,
                'video_url' => $video_url,
                'aprobado' => 0
            ];
        }
        echo json_encode($respuesta);
        exit();
    }

    header('Location: index.php?controlador=lineup&action=enviar&mapa=' . urlencode($mapa) . '&lado=' . urlencode($lado) . '&agente_id=' . $agente_id);
    exit();
}

function editar_video_envio(){
    session_start();
    if (!isset($_SESSION['usuario'])) {
        header('Content-Type: application/json');
        echo json_encode(['ok' => false]);
        exit();
    }

    require_once("model/lineup_model.php");
    $model = new Lineup_model();
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $video_url = isset($_POST['video_url']) ? trim($_POST['video_url']) : '';
    $ok = false;
    if ($id > 0) {
        $ok = $model->actualizar_video_envio_usuario($id, $_SESSION['usuario']['id'], $video_url);
    }

    header('Content-Type: application/json');
    echo json_encode(['ok' => (bool)$ok, 'video_url' => $video_url]);
    exit();
}

function borrar_envio(){
    session_start();
    if (!isset($_SESSION['usuario'])) {
        header('Content-Type: application/json');
        echo json_encode(['ok' => false]);
        exit();
    }

    require_once("model/lineup_model.php");
    $model = new Lineup_model();
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $ok = false;
    if ($id > 0) {
        $ok = $model->borrar_envio_usuario($id, $_SESSION['usuario']['id']);
    }

    header('Content-Type: application/json');
    echo json_encode(['ok' => (bool)$ok, 'id' => $id]);
    exit();
}
?>
