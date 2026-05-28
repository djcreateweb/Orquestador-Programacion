<?php
function home(){
    session_start();
    $logeado = isset($_SESSION["usuario"]);
    require_once("view/home_view.php");
}
?>
