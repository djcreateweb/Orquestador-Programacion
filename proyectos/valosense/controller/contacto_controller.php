<?php
// =====================================================
// contacto_controller.php
// Página de contacto con el autor de ValoSense:
//  - GET  home  → muestra el formulario (y el bloque CTA de enviar lineup).
//  - POST enviar → guarda el mensaje en un log local y flash de confirmación.
// =====================================================

function home(){
    // Flash "gracias por contactar" si viene de un submit correcto
    $mensaje = $_GET['ok'] ?? '';
    $error   = $_GET['err'] ?? '';
    require_once("view/contacto_view.php");
}

function enviar(){
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()) {
        header('Location: index.php?controlador=contacto&action=home&err=token');
        exit();
    }

    $nombre  = trim($_POST['nombre']  ?? '');
    $email   = trim($_POST['email']   ?? '');
    $asunto  = $_POST['asunto']       ?? '';
    $mensaje = trim($_POST['mensaje'] ?? '');

    $asuntos_validos = ['mejora', 'promocion', 'bug', 'otro'];

    if ($nombre === '' || strlen($nombre) < 2 || strlen($nombre) > 80) {
        header('Location: index.php?controlador=contacto&action=home&err=nombre'); exit();
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header('Location: index.php?controlador=contacto&action=home&err=email'); exit();
    }
    if (!in_array($asunto, $asuntos_validos, true)) {
        header('Location: index.php?controlador=contacto&action=home&err=asunto'); exit();
    }
    if ($mensaje === '' || strlen($mensaje) < 10 || strlen($mensaje) > 2000) {
        header('Location: index.php?controlador=contacto&action=home&err=mensaje'); exit();
    }

    // Reject CR/LF in any value that reaches a mail header (defense-in-depth;
    // $asunto is already whitelisted and $email passed FILTER_VALIDATE_EMAIL,
    // but $nombre is free text and must be checked explicitly).
    foreach ([$nombre, $email] as $campo) {
        if (preg_match('/[\r\n]/', $campo)) {
            header('Location: index.php?controlador=contacto&action=home&err=invalid'); exit();
        }
    }

    $para = 'djcreateweb@gmail.com';
    // RFC 2047 encoding prevents header injection via the subject line.
    $asunto_email = '=?UTF-8?B?' . base64_encode('ValoSense - ' . $asunto) . '?=';
    $cuerpo = "Nombre: {$nombre}\n"
            . "Email: {$email}\n"
            . "Asunto: {$asunto}\n\n"
            . $mensaje;
    $headers = "From: ValoSense <no-reply@valosense.local>\r\n";
    $headers .= "Reply-To: {$email}\r\n";

    @mail($para, $asunto_email, $cuerpo, $headers);

    // Guardamos en un log local para TFG (sin SMTP configurado).
    // Cada línea es un registro JSON con timestamp e IP.
    $fila = [
        'ts'      => date('Y-m-d H:i:s'),
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '-',
        'nombre'  => $nombre,
        'email'   => $email,
        'asunto'  => $asunto,
        'mensaje' => $mensaje,
    ];
    $path = __DIR__ . '/../cache/contacto.log';
    @mkdir(dirname($path), 0775, true);
    @file_put_contents($path, json_encode($fila, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);

    header('Location: index.php?controlador=contacto&action=home&ok=1');
    exit();
}
