<?php
// =====================================================
// legal_controller.php
// Páginas legales: términos, privacidad, cookies, aviso.
// Contenido genérico sin datos personales identificativos
// (proyecto académico TFG). Cada acción carga su propia vista.
// =====================================================
require_once("model/helpers.php");

function terminos(){
    page_meta([
        'title'       => 'Términos de uso · ValoSense',
        'description' => 'Condiciones que regulan el uso de la plataforma ValoSense.',
        'robots'      => 'index,follow',
    ]);
    require_once("view/legal_terminos_view.php");
}

function privacidad(){
    page_meta([
        'title'       => 'Política de privacidad · ValoSense',
        'description' => 'Información sobre el tratamiento de datos personales en ValoSense.',
        'robots'      => 'index,follow',
    ]);
    require_once("view/legal_privacidad_view.php");
}

function cookies(){
    page_meta([
        'title'       => 'Política de cookies · ValoSense',
        'description' => 'Información sobre las cookies que utiliza ValoSense y cómo gestionarlas.',
        'robots'      => 'index,follow',
    ]);
    require_once("view/legal_cookies_view.php");
}

function aviso(){
    page_meta([
        'title'       => 'Aviso legal · ValoSense',
        'description' => 'Información legal y titularidad del proyecto ValoSense.',
        'robots'      => 'index,follow',
    ]);
    require_once("view/legal_aviso_view.php");
}
