<?php
function home(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/training_model.php");
    $model = new Training_model();
    $rangos = $model->get_rangos();
    $categorias = $model->get_categorias();
    $rango = isset($_GET["rango"]) ? $_GET["rango"] : $_SESSION["usuario"]["rango"];
    $cat_seleccionadas = isset($_GET["categorias"]) ? $_GET["categorias"] : array();
    if (!is_array($cat_seleccionadas)) {
        $cat_seleccionadas = array();
    }
    $videos = array();
    if (!empty($cat_seleccionadas)) {
        $videos = $model->get_videos_por_rango($rango);
    }
    require_once("view/training_view.php");
}
?>
