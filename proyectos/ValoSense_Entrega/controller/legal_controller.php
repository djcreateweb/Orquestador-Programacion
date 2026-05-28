<?php
function terminos(){
    session_start();
    require_once("view/legal_terminos_view.php");
}

function privacidad(){
    session_start();
    require_once("view/legal_privacidad_view.php");
}

function cookies(){
    session_start();
    require_once("view/legal_cookies_view.php");
}

function aviso(){
    session_start();
    require_once("view/legal_aviso_view.php");
}
?>
