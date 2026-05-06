<?php
// Buffer de salida: permite que los controladores llamen header('Location:...')
// aunque ya se haya escrito HTML, porque todavía está en el buffer y no se envió.
ob_start();

// Cabeceras de seguridad — se emiten en todas las respuestas.
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
// CSP: se mantiene 'unsafe-inline' en style-src porque main.js asigna
// dimensiones/posiciones vía element.style (progress bars, ripples, toasts).
// Se añaden directivas duras que no rompen nada:
//   - frame-ancestors 'self' (no empotrable fuera del propio sitio)
//   - form-action 'self'     (POST siempre al propio host)
//   - base-uri 'self'        (evita secuestros con <base>)
//   - object-src 'none'      (prohíbe <object>/<embed>)
header(
    "Content-Security-Policy: " .
    "default-src 'self'; " .
    "img-src 'self' data: https://img.youtube.com; " .
    "font-src 'self' https://fonts.gstatic.com; " .
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com; " .
    "script-src 'self'; " .
    "connect-src 'self'; " .
    "object-src 'none'; " .
    "base-uri 'self'; " .
    "form-action 'self'; " .
    "frame-ancestors 'self';"
);

// Cookie de sesión endurecida: HttpOnly, SameSite=Lax, Secure si HTTPS.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? 80) == 443);
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);

// Arrancamos la sesión antes de emitir nada (evita warning "headers sent").
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Metadata SEO por defecto. Cualquier controller puede llamar a page_meta([...])
// antes de que termine la ejecución para sobreescribir estos valores.
require_once __DIR__ . '/model/helpers.php';
page_meta(); // inicializa $GLOBALS['page_meta'] con los defaults
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php
        // Nota: los controllers ya se ejecutaron en el <body> antes de que este
        // head final se sirva (ob_start()+buffer). Sin embargo el `require_once` del
        // front_controller está más abajo. Usamos un ob_start buffer temprano para
        // recolectar output y aplicar meta DESPUÉS de que los controllers llamen
        // a page_meta(). Como esto complicaría el flujo, dejamos el head mínimo
        // aquí y lo completamos más tarde tras ejecutar el controller.
    ?>
    <link rel="icon" type="image/svg+xml" href="imagenes/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <!-- Head SEO: title/description/canonical/OG. Se rellena al final del render. -->
    <!--VS_HEAD_MARKER-->

    <!-- CSS global siempre cargado (cache-busting con mtime) -->
    <?php $vs_css_ver = @filemtime(__DIR__ . '/css/styles.css') ?: time(); ?>
    <link rel="stylesheet" href="css/styles.css?v=<?php echo (int)$vs_css_ver; ?>">

    <!-- CSS específico según la sección actual -->
    <?php $c = $_GET['controlador'] ?? 'home'; ?>
    <?php if ($c === 'home'): ?>
        <link rel="stylesheet" href="css/home.css">
    <?php elseif ($c === 'explorar'): ?>
        <link rel="stylesheet" href="css/explorar.css">
    <?php elseif ($c === 'usuario'): ?>
        <?php $a = $_GET['action'] ?? ''; ?>
        <?php if ($a === 'ajustes'): ?>
            <link rel="stylesheet" href="css/ajustes.css">
        <?php else: ?>
            <link rel="stylesheet" href="css/auth.css">
        <?php endif; ?>
    <?php elseif ($c === 'training' || $c === 'team'): ?>
        <link rel="stylesheet" href="css/lineup.css">
        <link rel="stylesheet" href="css/training.css">
    <?php elseif ($c === 'matchmaker'): ?>
        <link rel="stylesheet" href="css/matchmaker.css">
    <?php elseif ($c === 'lineup'): ?>
        <link rel="stylesheet" href="css/lineup.css">
    <?php elseif ($c === 'chat'): ?>
        <link rel="stylesheet" href="css/chat.css">
    <?php elseif ($c === 'perfil'): ?>
        <link rel="stylesheet" href="css/perfil.css">
    <?php elseif ($c === 'contacto'): ?>
        <link rel="stylesheet" href="css/contacto.css">
    <?php endif; ?>
</head>
<body class="dark-bg">
    <?php
    require_once("controller/front_controller.php");
    require_once("view/footer.php");
    ?>

    <!-- JavaScript global de ValoSense (cache-busting con mtime) -->
    <?php $vs_mainjs_ver = @filemtime(__DIR__ . '/js/main.js') ?: time(); ?>
    <script src="js/main.js?v=<?php echo (int)$vs_mainjs_ver; ?>" defer></script>

    <!-- Bolas interactivas en el hero (tipo AimLab) — global en todas las páginas -->
    <?php $vs_orbs_ver = @filemtime(__DIR__ . '/js/hero-orbs.js') ?: time(); ?>
    <script src="js/hero-orbs.js?v=<?php echo (int)$vs_orbs_ver; ?>" defer></script>

    <!-- Cargamos solo el JS de la sección actual según el controlador -->
    <?php if ($c === 'home'): ?>
        <script src="js/home.js" defer></script>
    <?php elseif ($c === 'explorar'): ?>
        <script src="js/explorar.js" defer></script>
    <?php elseif ($c === 'usuario'): ?>
        <script src="js/auth.js" defer></script>
    <?php elseif ($c === 'training' || $c === 'team'): ?>
        <script src="js/training.js" defer></script>
    <?php elseif ($c === 'matchmaker'): ?>
        <script src="js/matchmaker.js" defer></script>
    <?php elseif ($c === 'lineup'): ?>
        <script src="js/lineup.js" defer></script>
    <?php elseif ($c === 'chat'): ?>
        <script src="js/chat.js" defer></script>
    <?php endif; ?>
</body>
</html>
<?php
// ---- Render del head SEO: ya se ejecutó el controller, $GLOBALS['page_meta']
// tiene los valores definitivos. Componemos el fragmento HTML y sustituimos
// el marcador <!--VS_HEAD_MARKER--> en el buffer antes de flush.
$meta = $GLOBALS['page_meta'] ?? page_meta();

$title       = htmlspecialchars((string)$meta['title'], ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars((string)$meta['description'], ENT_QUOTES, 'UTF-8');
$canonical   = htmlspecialchars((string)($meta['canonical'] ?? current_url()), ENT_QUOTES, 'UTF-8');
$og_image    = htmlspecialchars((string)$meta['og_image'], ENT_QUOTES, 'UTF-8');
$robots      = htmlspecialchars((string)$meta['robots'], ENT_QUOTES, 'UTF-8');

$head  = "<title>$title</title>\n";
$head .= "    <meta name=\"description\" content=\"$description\">\n";
$head .= "    <meta name=\"robots\" content=\"$robots\">\n";
$head .= "    <link rel=\"canonical\" href=\"$canonical\">\n";
$head .= "    <meta property=\"og:type\" content=\"website\">\n";
$head .= "    <meta property=\"og:site_name\" content=\"ValoSense\">\n";
$head .= "    <meta property=\"og:title\" content=\"$title\">\n";
$head .= "    <meta property=\"og:description\" content=\"$description\">\n";
$head .= "    <meta property=\"og:url\" content=\"$canonical\">\n";
$head .= "    <meta property=\"og:image\" content=\"$og_image\">\n";
$head .= "    <meta name=\"twitter:card\" content=\"summary_large_image\">\n";
$head .= "    <meta name=\"twitter:title\" content=\"$title\">\n";
$head .= "    <meta name=\"twitter:description\" content=\"$description\">\n";
$head .= "    <meta name=\"twitter:image\" content=\"$og_image\">\n";

// JSON-LD (schema.org) si la vista lo aportó
if (!empty($meta['jsonld']) && is_array($meta['jsonld'])) {
    foreach ($meta['jsonld'] as $ld) {
        if (!is_array($ld)) continue;
        $json = json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        // Evitar cierre de script dentro del JSON
        $json = str_replace('</', '<\\/', $json);
        $head .= "    <script type=\"application/ld+json\">$json</script>\n";
    }
}

$buffer = ob_get_clean();
echo str_replace('<!--VS_HEAD_MARKER-->', $head, $buffer);
?>
