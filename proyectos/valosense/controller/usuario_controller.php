<?php
require_once("model/helpers.php");

// Helper interno: guarda un mensaje flash en sesión (retrocompatible con 2 args)
// Normaliza los tipos aceptados a 3: 'ok' | 'err' | 'warn'.
if (!function_exists('flash')) {
    function flash(string $tipo, string $msg, string $detalle = ''): void {
        $map = [
            'ok' => 'ok', 'success' => 'ok', 'info' => 'ok',
            'err' => 'err', 'error' => 'err', 'danger' => 'err', 'fail' => 'err',
            'warn' => 'warn', 'warning' => 'warn',
        ];
        $tipo = $map[$tipo] ?? 'err';
        $_SESSION['flash'] = ['tipo' => $tipo, 'msg' => $msg, 'detalle' => $detalle];
    }
}

function home(){
    if(isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
    $message = "";
    page_meta([
        'title'       => 'Iniciar sesión · ValoSense',
        'description' => 'Accede a tu cuenta de ValoSense para usar el matchmaker, enviar lineups y guardar rutinas.',
        'robots'      => 'noindex,follow',
    ]);
    require_once("view/usuario_view.php");
}

function login(){
    require_once("model/usuario_model.php");
    $message = "";

    if(isset($_POST["login"])){
        if(!csrf_check()){
            $message = "La sesión ha caducado. Recarga la página e inténtalo de nuevo.";
        } else {
            $user = trim($_POST["nombre"] ?? "");
            $pass = $_POST["pswd"] ?? "";

            $model    = new Usuario_model();
            $registro = $model->login($user, $pass);

            if($registro){
                // Evita session fixation: regeneramos el ID tras autenticar
                session_regenerate_id(true);
                $_SESSION["usuario"] = $registro;
                header('Location: index.php?controlador=matchmaker&action=home');
                exit();
            }
            $message = "Usuario o contraseña incorrectos.";
        }
    }

    require_once("view/usuario_view.php");
}

function registro(){
    require_once("model/usuario_model.php");
    $message = "";

    if(isset($_POST["registrar"])){
        if(!csrf_check()){
            $message = "La sesión ha caducado. Recarga la página e inténtalo de nuevo.";
        } else {
            $user  = trim($_POST["nombre"] ?? "");
            $pass  = $_POST["pswd"] ?? "";
            $rango = $_POST["rango"] ?? "Iron";
            $email = $user . "@valosense.local";

            $rangos_validos = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];

            if($user === "" || $pass === ""){
                $message = "Rellena usuario y contraseña.";
            } elseif(!preg_match('/^[A-Za-z0-9_]{3,30}$/', $user)){
                $message = "El usuario debe tener entre 3 y 30 caracteres (letras, números o _).";
            } elseif(strlen($pass) < 8){
                $message = "La contraseña debe tener al menos 8 caracteres.";
            } elseif(!in_array($rango, $rangos_validos, true)){
                $message = "El rango seleccionado no es válido.";
            } else {
                $model = new Usuario_model();
                $ok    = $model->registro($user, $email, $pass, $rango, "EU");
                $message = $ok
                    ? "Registro completado. Ya puedes iniciar sesión."
                    : "No se pudo registrar. Quizá el usuario ya existe.";
            }
        }
    }

    page_meta([
        'title'       => 'Registro · ValoSense',
        'description' => 'Crea tu cuenta gratuita en ValoSense.',
        'robots'      => 'noindex,follow',
    ]);
    require_once("view/usuario_view.php");
}

function gestionar(){
    require_once("model/usuario_model.php");

    if(!isset($_SESSION["usuario"]) || empty($_SESSION["usuario"]["es_admin"])){
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }

    $model = new Usuario_model();
    $message = "";

    if(isset($_POST["borrar"])){
        if(!csrf_check()){
            $message = "Token CSRF inválido. Recarga la página.";
        } else {
            $id = (int)($_POST["id"] ?? 0);
            if($id > 0 && $id !== (int)$_SESSION["usuario"]["id"]){
                $model->borrar($id);
            }
            header('Location: index.php?controlador=usuario&action=gestionar');
            exit();
        }
    }

    $array = $model->get_usuarios();
    page_meta([
        'title'       => 'Admin · Gestión de usuarios · ValoSense',
        'description' => 'Panel de administración.',
        'robots'      => 'noindex,nofollow',
    ]);
    require_once("view/gestiona_usuario_view.php");
}

function vincular(){
    require_once("model/usuario_model.php");

    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $model   = new Usuario_model();
    $message = "";

    if(isset($_POST["vincular"])){
        if(!csrf_check()){
            $message = "Token CSRF inválido. Recarga la página.";
        } else {
            $riot_id     = trim($_POST["riot_id"] ?? "");
            $riot_tag    = trim($_POST["riot_tag"] ?? "");
            $riot_region = strtolower($_POST["riot_region"] ?? "");

            $tag_limpio = ltrim($riot_tag, "#");
            $regiones   = ['eu','na','ap','kr','latam','br'];

            if($riot_id === "" || $tag_limpio === "" || !in_array($riot_region, $regiones, true)){
                $message = "Rellena el nombre, el tag (sin el #) y la región.";
            } elseif(!preg_match("/^[\p{L}\p{N}\p{M} ._'-]{2,50}$/u", $riot_id)){
                $message = "El nombre tiene caracteres no válidos o es demasiado corto.";
            } elseif(!preg_match('/^[A-Za-z0-9]{2,10}$/', $tag_limpio)){
                $message = "El tag solo puede tener letras y números (2-10 caracteres).";
            } else {
                // Validación contra la API comunitaria HenrikDev antes de guardar.
                require_once("model/env.php");
                require_once("model/RiotAccountValidator.php");
                $res = RiotAccountValidator::validar($riot_id, $tag_limpio);

                if (!$res['ok']) {
                    if ($res['error'] === 'not_found') {
                        $message = "No encontramos esa cuenta en Valorant. Revisa el nombre y el tag.";
                    } elseif ($res['error'] === 'rate_limit') {
                        $message = "Demasiadas consultas, espera un momento e inténtalo de nuevo.";
                    } elseif ($res['error'] === 'no_key') {
                        $message = "La validación automática no está configurada. Contacta con el administrador.";
                    } elseif ($res['error'] === 'timeout') {
                        $message = "La validación con Riot ha tardado demasiado. Inténtalo de nuevo.";
                    } else {
                        $message = "No hemos podido validar la cuenta con Riot. Inténtalo más tarde.";
                    }
                } else {
                    // La región devuelta por HenrikDev es más fiable — usarla si viene.
                    if (!empty($res['region'])) {
                        $region_api = strtolower($res['region']);
                        if (in_array($region_api, $regiones, true)) {
                            $riot_region = $region_api;
                        }
                    }
                    $ok = $model->vincular_riot_validado(
                        $_SESSION["usuario"]["id"],
                        $riot_id,
                        $tag_limpio,
                        $riot_region,
                        $res['puuid'],
                        date('Y-m-d H:i:s')
                    );
                    if ($ok) {
                        $_SESSION["usuario"]["riot_id"]     = $riot_id;
                        $_SESSION["usuario"]["riot_tag"]    = $tag_limpio;
                        $_SESSION["usuario"]["riot_region"] = $riot_region;
                        $_SESSION["usuario"]["riot_puuid"]  = $res['puuid'];
                        $message = "Cuenta verificada y vinculada correctamente.";
                    } else {
                        $message = "No se pudo guardar. Inténtalo de nuevo.";
                    }
                }
            }
        }
    }

    if(isset($_POST["desvincular"])){
        if(!csrf_check()){
            $message = "Token CSRF inválido. Recarga la página.";
        } else {
            $model->desvincular_riot($_SESSION["usuario"]["id"]);
            unset($_SESSION["usuario"]["riot_id"], $_SESSION["usuario"]["riot_tag"], $_SESSION["usuario"]["riot_region"]);
            $message = "Cuenta desvinculada.";
        }
    }

    page_meta([
        'title'       => 'Vincular cuenta Riot · ValoSense',
        'description' => 'Vincula tu Riot ID a ValoSense para recuperar estadísticas en cuanto conectemos la API.',
        'robots'      => 'noindex,follow',
    ]);
    require_once("view/vincular_view.php");
}

function google(){
    require_once("model/config.php");

    if (GOOGLE_CLIENT_ID === '' || GOOGLE_REDIRECT_URI === '') {
        flash('err', 'Google OAuth sin configurar', 'Falta GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI en .env.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // Token anti-CSRF para el ciclo OAuth
    $state = bin2hex(random_bytes(16));
    $_SESSION['google_oauth_state'] = $state;

    $params = http_build_query([
        'client_id'     => GOOGLE_CLIENT_ID,
        'redirect_uri'  => GOOGLE_REDIRECT_URI,
        'response_type' => 'code',
        'scope'         => 'openid email profile',
        'state'         => $state,
        'access_type'   => 'online',
        'prompt'        => 'select_account',
    ]);
    header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
    exit();
}

/**
 * Inicia el flujo OAuth de Google para VINCULAR la cuenta a un usuario ya autenticado.
 * Requiere sesión activa. Diferencia del flujo de login en el intent guardado en sesión.
 */
function vincular_google(){
    if (!isset($_SESSION['usuario'])) {
        flash('err', 'Debes iniciar sesión antes de vincular Google.', '');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    require_once("model/config.php");

    if (GOOGLE_CLIENT_ID === '' || GOOGLE_REDIRECT_URI === '') {
        flash('err', 'Google OAuth sin configurar', 'Falta GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI en .env.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    // Token anti-CSRF y marcador de intención
    $state = bin2hex(random_bytes(16));
    $_SESSION['google_oauth_state']  = $state;
    $_SESSION['google_oauth_intent'] = 'link';

    $params = http_build_query([
        'client_id'     => GOOGLE_CLIENT_ID,
        'redirect_uri'  => GOOGLE_REDIRECT_URI,
        'response_type' => 'code',
        'scope'         => 'openid email profile',
        'state'         => $state,
        'access_type'   => 'online',
        'prompt'        => 'select_account',
    ]);
    header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
    exit();
}

function google_callback(){
    require_once("model/config.php");
    require_once("model/usuario_model.php");

    // 1. Validar state anti-CSRF
    $state_recv = $_GET['state'] ?? '';
    $state_save = $_SESSION['google_oauth_state'] ?? '';
    unset($_SESSION['google_oauth_state']);
    if ($state_recv === '' || !hash_equals($state_save, $state_recv)) {
        flash('err', 'Error de seguridad en Google', 'El parámetro state no coincide. Intenta de nuevo.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // 2. Chequear error explícito de Google (usuario canceló, etc.)
    if (isset($_GET['error'])) {
        flash('err', 'Autenticación cancelada', 'No completaste el inicio con Google.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $code = $_GET['code'] ?? '';
    if ($code === '') {
        flash('err', 'Respuesta inválida de Google', 'No se recibió el código de autorización.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // 3. Intercambiar code por tokens vía cURL
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'code'          => $code,
            'client_id'     => GOOGLE_CLIENT_ID,
            'client_secret' => GOOGLE_CLIENT_SECRET,
            'redirect_uri'  => GOOGLE_REDIRECT_URI,
            'grant_type'    => 'authorization_code',
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);

    if ($http !== 200 || !$resp) {
        flash('err', 'No se pudo contactar con Google', $cerr ?: 'Inténtalo más tarde.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $tokens   = json_decode($resp, true);
    $id_token = $tokens['id_token'] ?? '';
    if ($id_token === '') {
        flash('err', 'Token de Google vacío', 'La respuesta no trajo id_token.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // 4. Verificar id_token localmente (firma RS256 + claims) — sin llamar a tokeninfo
    require_once("model/jwt_google.php");
    $payload = vs_google_verify_id_token($id_token, GOOGLE_CLIENT_ID);
    if (!$payload) {
        flash('err', 'Token de Google no válido', 'Firma o claims inválidos.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    $sub   = $payload['sub'];
    $email = strtolower(trim($payload['email']));
    $name  = $payload['name'] ?? '';

    $model  = new Usuario_model();
    $intent = $_SESSION['google_oauth_intent'] ?? 'login';
    unset($_SESSION['google_oauth_intent']);

    // — Flujo de vinculación: usuario ya autenticado quiere conectar su Google —
    if ($intent === 'link') {
        if (!isset($_SESSION['usuario'])) {
            flash('err', 'Sesión expirada', 'Inicia sesión antes de vincular Google.');
            header('Location: index.php?controlador=usuario&action=login');
            exit();
        }
        // Comprobar que el sub no esté ya vinculado a OTRA cuenta
        $otra = $model->buscar_por_google_id($sub);
        if ($otra && (int)$otra['id'] !== (int)$_SESSION['usuario']['id']) {
            flash('err', 'Esta cuenta de Google ya está vinculada a otro usuario', '');
            header('Location: index.php?controlador=usuario&action=ajustes');
            exit();
        }
        $ok = $model->vincular_google_id((int)$_SESSION['usuario']['id'], $sub, $name);
        if ($ok) {
            $_SESSION['usuario']['google_id']    = $sub;
            $_SESSION['usuario']['display_name'] = $_SESSION['usuario']['display_name'] ?? substr(trim($name), 0, 80);
            flash('ok', 'Cuenta de Google vinculada', 'A partir de ahora puedes iniciar sesión con Google.');
        } else {
            flash('err', 'No se pudo vincular', 'Inténtalo de nuevo.');
        }
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    // — Flujo de login/registro —

    // 5. Detectar conflicto: email ya registrado sin google_id → NO vincular automáticamente
    $existe = $model->buscar_por_email($email);
    if ($existe && empty($existe['google_id'])) {
        flash('err', 'Ese email ya tiene cuenta en ValoSense',
              'Inicia sesión con tu contraseña y luego vincula Google desde Ajustes.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // 6. Login o registro local
    $user = $model->login_por_google($sub, $email, $name);
    if (!$user) {
        flash('err', 'No se pudo iniciar sesión', 'Error guardando tu cuenta.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    // 7. Evitar session fixation y guardar sesión
    session_regenerate_id(true);
    $_SESSION['usuario'] = $user;
    $saludo = $user['display_name'] ?? $user['username'] ?? 'jugador';
    flash('ok', 'Sesión iniciada con Google', '¡Bienvenido, ' . htmlspecialchars($saludo, ENT_QUOTES, 'UTF-8') . '!');
    header('Location: index.php');
    exit();
}

function desconectar(){
    // Exigimos POST + CSRF para evitar logout-CSRF por <img src>
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        header('Location: index.php');
        exit();
    }

    // Limpieza completa de sesión
    $_SESSION = [];
    if(ini_get('session.use_cookies')){
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'] ?? '', $p['secure'] ?? false, $p['httponly'] ?? false);
    }
    session_destroy();

    header('Location: index.php');
    exit();
}

// ─── Ajustes de cuenta ────────────────────────────────────────────────────────

function ajustes(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    require_once("model/usuario_model.php");

    $model = new Usuario_model();
    $id    = (int)$_SESSION["usuario"]["id"];

    // Cargar datos actuales del usuario
    $user   = $model->get_by_id($id);
    $amigos = $model->get_amigos($id);

    // Listas de valores permitidos para los formularios
    $rangos   = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];
    $regiones = ['EU','NA','LATAM','BR','AP','KR'];
    $estados_presencia = [
        'en_linea'  => 'En línea',
        'ausente'   => 'Ausente',
        'invisible' => 'Invisible',
    ];

    // Leer y limpiar mensajes flash (soporta campo 'detalle' opcional)
    $mensaje       = '';
    $detalle       = '';
    $error         = '';
    $detalle_error = '';
    if(isset($_SESSION['flash'])){
        $f = $_SESSION['flash'];
        if(($f['tipo'] ?? '') === 'ok'){
            $mensaje = $f['msg']    ?? '';
            $detalle = $f['detalle'] ?? '';
        } else {
            $error         = $f['msg']    ?? '';
            $detalle_error = $f['detalle'] ?? '';
        }
        unset($_SESSION['flash']);
    }

    page_meta([
        'title'       => 'Ajustes · ValoSense',
        'description' => 'Gestiona tu perfil, contraseña y lista de amigos.',
        'robots'      => 'noindex,nofollow',
    ]);
    require_once("view/ajustes_view.php");
}

// Cambia el estado de presencia del usuario autenticado
function cambiar_presencia(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        flash('error', 'Token de seguridad inválido. Recarga la página.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    $estados_validos = ['en_linea', 'ausente', 'invisible'];
    $estado = $_POST['estado'] ?? '';

    if(!in_array($estado, $estados_validos, true)){
        flash('err', 'Estado no válido', 'Elige entre En línea, Ausente o Invisible.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $id    = (int)$_SESSION["usuario"]["id"];

    $ok = $model->actualizar_estado_presencia($id, $estado);
    if($ok){
        $_SESSION["usuario"]["estado_presencia"] = $estado;
        // Etiqueta legible del estado seleccionado
        $etiquetas   = ['en_linea' => 'En línea', 'ausente' => 'Ausente', 'invisible' => 'Invisible'];
        $estado_humano = $etiquetas[$estado] ?? $estado;
        flash('ok', 'Presencia actualizada', 'Ahora apareces como ' . $estado_humano . '.');
    } else {
        flash('error', 'No se pudo actualizar el estado. Inténtalo de nuevo.');
    }

    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

// Cambia la contraseña del usuario autenticado
function cambiar_password(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        flash('error', 'Token de seguridad inválido. Recarga la página.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    $actual    = $_POST['actual']    ?? '';
    $nueva     = $_POST['nueva']     ?? '';
    $confirmar = $_POST['confirmar'] ?? '';

    if($actual === '' || $nueva === '' || $confirmar === ''){
        flash('error', 'Rellena todos los campos de contraseña.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    if($nueva !== $confirmar){
        flash('err', 'Las contraseñas no coinciden', 'La nueva y la confirmación deben ser idénticas.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    require_once("model/usuario_model.php");
    $model     = new Usuario_model();
    $resultado = $model->cambiar_password((int)$_SESSION["usuario"]["id"], $actual, $nueva);

    if($resultado['ok']){
        // Regenerar ID de sesión para invalidar sesiones paralelas tras cambio de contraseña
        session_regenerate_id(true);
        flash('ok', 'Contraseña actualizada', 'Usa la nueva contraseña la próxima vez que inicies sesión.');
    } else {
        // Mapear el error del modelo a un mensaje de detalle concreto
        $err_modelo = $resultado['error'] ?? '';
        if(str_contains($err_modelo, 'actual') || str_contains($err_modelo, 'incorrecta')){
            flash('err', 'Contraseña actual incorrecta', 'Verifica que escribiste bien tu contraseña actual.');
        } else {
            flash('err', 'Nueva contraseña no válida', 'Debe tener al menos 8 caracteres y ser distinta a la actual.');
        }
    }

    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

// Permite al usuario autenticado editar sus propios datos básicos (username/email/rango/region)
function editar_datos(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        flash('error', 'Token de seguridad inválido. Recarga la página.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    $email    = trim($_POST['email']    ?? '');
    $rango    = $_POST['rango']   ?? '';
    $region   = $_POST['region']  ?? '';

    // Usuarios Google: el username es `nombre#N` inmutable, no se acepta cambio.
    // Ignoramos el POST y forzamos el valor actual de la sesión.
    $es_google_user = !empty($_SESSION["usuario"]["google_id"]);
    if ($es_google_user) {
        $username = $_SESSION["usuario"]["username"];
    } else {
        $username = trim($_POST['username'] ?? '');
    }

    $rangos_validos   = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];
    $regiones_validas = ['EU','NA','LATAM','BR','AP','KR'];

    // Validaciones de formato (solo para usuarios no-Google; los Google tienen `#` permanente)
    if (!$es_google_user && !preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
        flash('err', 'Nombre de usuario no válido', 'Usa 3-30 caracteres: letras, números o guion bajo.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        flash('err', 'Email no válido', 'Revisa el formato del correo.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    // Rango: NOT NULL en BD, debe ser un valor del ENUM (no puede quedar vacío)
    if(!in_array($rango, $rangos_validos, true)){
        flash('err', 'Valor no permitido', 'Selecciona uno de los rangos/regiones del listado.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    // Region: NOT NULL con DEFAULT 'EU' en BD, debe ser un valor del ENUM
    if(!in_array($region, $regiones_validas, true)){
        flash('err', 'Valor no permitido', 'Selecciona uno de los rangos/regiones del listado.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $id    = (int)$_SESSION["usuario"]["id"];

    // Verificar unicidad de username y email (excluyendo al propio usuario)
    $duplicado = $model->comprobar_unicidad($username, $email, $id);
    if($duplicado){
        // Distinguir qué campo está duplicado si el modelo lo informa; si no, username por defecto
        if(is_array($duplicado) && ($duplicado['campo'] ?? '') === 'email'){
            flash('err', 'Email ya registrado', 'Ya hay otra cuenta usando ese correo.');
        } else {
            flash('err', 'Nombre de usuario en uso', 'Elige otro distinto al actual.');
        }
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    $ok = $model->update($username, $email, $rango, $region, $id);
    if($ok){
        // Actualizar los datos en sesión para reflejar los cambios inmediatamente
        $_SESSION["usuario"]["username"] = $username;
        $_SESSION["usuario"]["email"]    = $email;
        $_SESSION["usuario"]["rango"]    = $rango;
        $_SESSION["usuario"]["region"]   = $region;
        flash('ok', 'Datos guardados', 'Tu perfil se actualizó correctamente.');
    } else {
        flash('error', 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
    }

    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

// Cambia la preferencia de visibilidad del Riot ID para los amigos
function cambiar_visibilidad_riot(){
    require_once("model/usuario_model.php");
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()) {
        flash('error', 'Token de seguridad inválido. Recarga la página.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    $visible = isset($_POST['riot_id_visible']) ? 1 : 0;
    $model = new Usuario_model();
    $ok = $model->actualizar_visibilidad_riot((int)$_SESSION["usuario"]["id"], $visible);
    if ($ok) {
        $_SESSION["usuario"]["riot_id_visible"] = $visible;
        if ($visible === 1) {
            flash('ok', 'Riot ID visible', 'Tus amigos podrán verlo en tu perfil.');
        } else {
            flash('ok', 'Riot ID oculto', 'Tus amigos tendrán que pedírtelo por el chat.');
        }
    } else {
        flash('err', 'No se pudo actualizar', 'Inténtalo de nuevo.');
    }
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

// Elimina la cuenta del usuario autenticado tras verificar contraseña
function eliminar_cuenta(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        flash('error', 'Token de seguridad inválido. Recarga la página.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    $password_confirm = $_POST['password_confirm'] ?? '';
    if($password_confirm === ''){
        flash('err', 'No se pudo eliminar la cuenta', 'La contraseña no es correcta.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }

    require_once("model/usuario_model.php");
    $model     = new Usuario_model();
    $resultado = $model->eliminar_cuenta((int)$_SESSION["usuario"]["id"], $password_confirm);

    if($resultado['ok']){
        // Destruir sesión completamente
        $_SESSION = [];
        if(ini_get('session.use_cookies')){
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $p['path'], $p['domain'] ?? '', $p['secure'] ?? false, $p['httponly'] ?? false);
        }
        session_destroy();
        // Iniciamos nueva sesión solo para el flash de despedida
        session_start();
        flash('ok', 'Cuenta eliminada', 'Hasta pronto.');
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    } else {
        flash('err', 'No se pudo eliminar la cuenta', 'La contraseña no es correcta.');
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
}
?>
