<?php
function home(){
    require_once("model/training_model.php");

    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $model      = new Training_model();
    $rangos     = $model->get_rangos();
    $categorias = $model->get_categorias();

    // Rango por defecto: el del usuario en sesión, o Iron como fallback.
    $rango = $_GET["rango"] ?? ($_SESSION["usuario"]["rango"] ?? 'Iron');
    if(!in_array($rango, $rangos, true)){
        $rango = 'Iron';
    }

    // Primera carga sin parámetros GET: no mostrar tarjetas.
    // Tras pulsar "Buscar" (submit GET): filtrar solo por categorías marcadas.
    $es_busqueda = isset($_GET["rango"]) || isset($_GET["categorias"]);

    if($es_busqueda){
        $cat_seleccionadas = $_GET["categorias"] ?? [];
        if(!is_array($cat_seleccionadas)){ $cat_seleccionadas = []; }
        // Sanitizamos: solo categorías válidas del listado.
        $cat_seleccionadas = array_values(array_intersect(
            $cat_seleccionadas, array_keys($categorias)
        ));
    } else {
        // Primera carga: mostramos 2 videos por defecto del rango del usuario.
        $cat_seleccionadas = array_slice(array_keys($categorias), 0, 2);
    }

    // Consultamos la BD solo si hay categorías marcadas.
    if(!empty($cat_seleccionadas)){
        $videos = $model->get_videos_por_rango($rango);
    } else {
        $videos = [];
    }

    page_meta([
        'title'       => "Entrenamiento · Rutinas de {$rango} · ValoSense",
        'description' => "Rutinas y vídeos de entrenamiento para Valorant adaptados al rango {$rango}. Aim, utilidad, game sense.",
    ]);

    require_once("view/training_view.php");
}
?>
