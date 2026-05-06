<?php
require_once("model/helpers.php");

function home(){
    require_once("model/lineup_model.php");
    $model = new Lineup_model();

    $agente_id = $_GET["agente_id"] ?? "";
    $mapa      = $_GET["mapa"] ?? "";

    $lineups      = $model->get_aprobados($agente_id, $mapa);
    $total_lineups = $model->contar_aprobados();
    $sin_filtros  = empty($agente_id) && empty($mapa);
    $agentes      = $model->get_agentes();
    $mapas        = $model->get_mapas();

    // SEO: título y descripción dependen de los filtros activos
    $titulo_seo = 'Lineups de Valorant · ValoSense';
    $desc_seo   = "Biblioteca de {$total_lineups} lineups verificados: smokes, flashes y molotovs por agente y mapa.";
    if (!empty($mapa))      { $titulo_seo = "Lineups en {$mapa} · ValoSense"; }
    if (!empty($agente_id)) { $titulo_seo = 'Lineups por agente · ValoSense'; }

    // JSON-LD: convertir los lineups visibles en VideoObject.
    //   - Se omite si no se puede extraer el video_id de YouTube (Google exige thumbnailUrl).
    //   - uploadDate: fecha real de creación si la tenemos; si no, se omite (no usar date('c')
    //     porque Google marcaría todos los videos con la misma fecha como inválido).
    $jsonld = [];
    foreach (array_slice($lineups, 0, 20) as $l) {
        $video_url = safe_http_url($l['video_url'] ?? '');
        if ($video_url === 'about:blank') continue;
        if (!preg_match('#(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})#', $video_url, $m)) {
            continue; // sin id no se puede dar thumbnail válido
        }
        $video_id = $m[1];
        $ld = [
            '@context'    => 'https://schema.org',
            '@type'       => 'VideoObject',
            'name'        => (string)($l['titulo'] ?? ''),
            'description' => (string)($l['descripcion'] ?? ''),
            'thumbnailUrl'=> "https://img.youtube.com/vi/{$video_id}/hqdefault.jpg",
            'embedUrl'    => "https://www.youtube.com/embed/{$video_id}",
            'contentUrl'  => $video_url,
        ];
        if (!empty($l['creado_en'])) {
            $ld['uploadDate'] = (string)$l['creado_en'];
        }
        $jsonld[] = $ld;
    }

    // Canonical: si hay filtros de mapa o agente, mantenerlos en la URL canónica
    //   para que cada combinación tenga su propia URL indexable.
    $canonical = 'index.php?controlador=lineup&action=home';
    $qs = [];
    if (!empty($mapa))      $qs['mapa']      = $mapa;
    if (!empty($agente_id)) $qs['agente_id'] = (int)$agente_id;
    if ($qs) $canonical .= '&' . http_build_query($qs);

    page_meta([
        'title'       => $titulo_seo,
        'description' => $desc_seo,
        'canonical'   => $canonical,
        'jsonld'      => $jsonld,
    ]);

    require_once("view/lineup_view.php");
}

function enviar(){
    require_once("model/lineup_model.php");

    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $model   = new Lineup_model();
    $agentes = $model->get_agentes();
    $mapas   = $model->get_mapas();
    $message = "";

    if(isset($_POST["enviar"])){
        if(!csrf_check()){
            $message = "La sesión ha caducado. Recarga la página e inténtalo de nuevo.";
        } else {
            $agente_id   = (int)($_POST["agente_id"] ?? 0);
            $mapa        = $_POST["mapa"] ?? "";
            $titulo      = trim($_POST["titulo"] ?? "");
            $descripcion = trim($_POST["descripcion"] ?? "");
            $video_url   = trim($_POST["video_url"] ?? "");

            if($agente_id <= 0 || $mapa === "" || $titulo === "" || $descripcion === "" || $video_url === ""){
                $message = "Rellena todos los campos.";
            } elseif(!in_array($mapa, $mapas, true)){
                $message = "Mapa no válido.";
            } elseif(strlen($video_url) > 255){
                $message = "La URL del video es demasiado larga (máx. 255 caracteres).";
            } elseif(!preg_match('#^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)[A-Za-z0-9_-]{11}#i', $video_url)){
                $message = "La URL debe ser un enlace válido de YouTube (watch, embed o youtu.be) con un ID de 11 caracteres.";
            } elseif(strlen($descripcion) < 10){
                $message = "La descripción debe tener al menos 10 caracteres.";
            } else {
                $ok = $model->insertar_pendiente($_SESSION["usuario"]["id"], $agente_id, $mapa, $titulo, $descripcion, $video_url);
                $message = $ok
                    ? "Lineup enviado. Un administrador lo revisará antes de publicarlo."
                    : "No se pudo guardar el lineup. Inténtalo de nuevo.";
            }
        }
    }

    require_once("view/lineup_enviar_view.php");
}

function gestionar(){
    require_once("model/lineup_model.php");

    if(!isset($_SESSION["usuario"]) || empty($_SESSION["usuario"]["es_admin"])){
        header('Location: index.php?controlador=lineup&action=home');
        exit();
    }

    $model = new Lineup_model();

    if(isset($_POST["aprobar"]) || isset($_POST["borrar"])){
        if(!csrf_check()){
            header('Location: index.php?controlador=lineup&action=gestionar');
            exit();
        }
        $id = (int)($_POST["id"] ?? 0);
        if($id > 0){
            if(isset($_POST["aprobar"])){
                $model->aprobar($id);
            } else {
                $model->borrar($id);
            }
        }
        header('Location: index.php?controlador=lineup&action=gestionar');
        exit();
    }

    $pendientes = $model->get_pendientes();
    $aprobados  = $model->get_aprobados();

    require_once("view/gestiona_lineup_view.php");
}
?>
