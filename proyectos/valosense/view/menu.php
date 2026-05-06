<?php
// =====================================================
// menu.php
// Navbar principal de ValoSense. Se incluye en todas las vistas.
// =====================================================
require_once(__DIR__ . "/../model/helpers.php");

// Detectamos la sección actual para marcar el enlace activo
$c_actual = $_GET['controlador'] ?? '';
$a_actual = $_GET['action'] ?? '';
$logeado  = isset($_SESSION["usuario"]);
$es_admin = !empty($_SESSION["usuario"]["es_admin"]);
// Preferimos display_name (nombre real de Google) y caemos a username para cuentas locales.
$username = nombre_visible($_SESSION["usuario"] ?? null);

// Contador de invitaciones pendientes + mensajes no leídos (badges)
// y actualización de "última actividad" del usuario logueado.
// Se cachea en sesión con TTL 30s para no disparar 3 queries por request.
$invitaciones_pendientes = 0;
$chat_no_leidos = 0;
if($logeado){
    require_once(__DIR__ . "/../model/amistad_model.php");
    require_once(__DIR__ . "/../model/chat_model.php");
    require_once(__DIR__ . "/../model/usuario_model.php");

    $me_id = (int)$_SESSION["usuario"]["id"];
    $nav_cache = $_SESSION['nav_counters'] ?? null;
    $stale = !$nav_cache || ($nav_cache['me'] ?? 0) !== $me_id || (time() - ($nav_cache['ts'] ?? 0)) >= 30;
    // También invalidamos si el propio flujo pidió forzar refresco (p.e. tras marcar leído).
    if (!empty($_SESSION['nav_counters_dirty'])) { $stale = true; unset($_SESSION['nav_counters_dirty']); }

    if ($stale) {
        try {
            (new Usuario_model())->ping($me_id);
            $invitaciones_pendientes = (new Amistad_model())->count_pendientes_recibidas($me_id);
            $chat_no_leidos          = (new Chat_model())->count_no_leidos_total($me_id);
            $_SESSION['nav_counters'] = [
                'me'     => $me_id,
                'ts'     => time(),
                'inv'    => $invitaciones_pendientes,
                'unread' => $chat_no_leidos,
            ];
        } catch (Throwable $e) {
            error_log('menu counters — ' . $e->getMessage());
        }
    } else {
        $invitaciones_pendientes = (int)$nav_cache['inv'];
        $chat_no_leidos          = (int)$nav_cache['unread'];
    }
}

// Devuelve la clase de enlace activo si la sección coincide
if (!function_exists('nav_active')) {
    function nav_active($seccion, $actual){
        return $seccion === $actual ? ' nav-link-active' : '';
    }
}

// Secciones del dropdown "Explorar"
// key coincide con el parámetro "controlador" para poder marcar el activo
$opciones_explorar = [
    ['key' => 'matchmaker', 'href' => 'index.php?controlador=matchmaker&action=home', 'label' => 'Encontrar equipo',  'desc' => 'Busca compañeros de tu nivel'],
    ['key' => 'lineup',     'href' => 'index.php?controlador=lineup&action=home',     'label' => 'Lineups',           'desc' => 'Smokes, flashes y molotovs'],
    ['key' => 'team',       'href' => 'index.php?controlador=team&action=home',       'label' => 'Composición',       'desc' => 'Recomendador de comp'],
];

// ¿Alguna de las secciones del dropdown está activa ahora?
$explorar_activo = in_array($c_actual, array_column($opciones_explorar, 'key'), true)
                || $c_actual === 'explorar';
?>

<!-- Enlace de accesibilidad para saltar al contenido -->
<a href="#main" class="skip-link">Saltar al contenido</a>

<!-- Navegación principal -->
<header class="navbar">
    <div class="navbar-container">
        <a href="index.php" class="navbar-logo">
            <img src="imagenes/logo.svg" alt="ValoSense" width="32" height="32">
            <span class="logo-text">Valo<span class="logo-accent">Sense</span></span>
        </a>

        <button class="navbar-toggle" id="menu-toggle" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>

        <nav class="navbar-menu" id="navbar-menu" aria-label="Menú principal">
            <ul class="nav-list">

                <?php if(!$logeado): ?>
                    <!-- Inicio (solo invitados) -->
                    <li class="nav-item">
                        <a href="index.php" class="nav-link<?php echo $c_actual === '' || $c_actual === 'home' ? ' nav-link-active' : ''; ?>">Inicio</a>
                    </li>

                    <!-- Explorar (solo invitados): link a la página resumen -->
                    <!-- Los módulos están bloqueados hasta iniciar sesión, por eso no es dropdown -->
                    <li class="nav-item">
                        <a href="index.php?controlador=explorar&amp;action=home"
                           class="nav-link<?php echo $explorar_activo ? ' nav-link-active' : ''; ?>">
                            Explorar
                        </a>
                    </li>
                <?php endif; ?>

                <?php if($logeado): ?>
                    <!-- Enlaces directos a las herramientas (usuarios logueados) -->
                    <?php foreach($opciones_explorar as $op): ?>
                        <?php
                            // "Lineups" (key=lineup) no se marca activo cuando la acción es "enviar":
                            // ese caso lo cubre el enlace "Enviar lineup" de abajo.
                            $op_activo = ($c_actual === $op['key'])
                                      && !($op['key'] === 'lineup' && $a_actual === 'enviar');
                        ?>
                        <li class="nav-item">
                            <a href="<?php echo htmlspecialchars($op['href']); ?>"
                               class="nav-link<?php echo $op_activo ? ' nav-link-active' : ''; ?>">
                                <?php echo htmlspecialchars($op['label']); ?>
                            </a>
                        </li>
                    <?php endforeach; ?>

                    <!-- Solicitudes de amistad (primera del grupo derecho → empuja a la derecha) -->
                    <?php $solicitudes_activo = ($c_actual === 'amistad' && $a_actual !== 'amigos'); ?>
                    <li class="nav-item nav-item-push-right">
                        <a href="index.php?controlador=amistad&amp;action=home"
                           class="nav-link<?php echo $solicitudes_activo ? ' nav-link-active' : ''; ?>">
                            Solicitudes
                            <?php if($invitaciones_pendientes > 0): ?>
                                <span class="badge badge--glow nav-badge"><?php echo (int)$invitaciones_pendientes; ?></span>
                            <?php endif; ?>
                        </a>
                    </li>

                    <!-- Amigos confirmados -->
                    <?php $amigos_activo = ($c_actual === 'amistad' && $a_actual === 'amigos'); ?>
                    <li class="nav-item">
                        <a href="index.php?controlador=amistad&amp;action=amigos"
                           class="nav-link<?php echo $amigos_activo ? ' nav-link-active' : ''; ?>">
                            Amigos
                        </a>
                    </li>

                    <!-- Mensajes (chat) -->
                    <li class="nav-item">
                        <a href="index.php?controlador=chat&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'chat' ? ' nav-link-active' : ''; ?>">
                            Mensajes
                            <span id="nav-chat-badge" class="badge badge--cyan nav-chat-badge <?php echo $chat_no_leidos > 0 ? '' : 'is-hidden'; ?>">
                                <?php echo (int)$chat_no_leidos; ?>
                            </span>
                        </a>
                    </li>

                    <!-- Contacto (mejoras / promoción) -->
                    <li class="nav-item">
                        <a href="index.php?controlador=contacto&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'contacto' ? ' nav-link-active' : ''; ?>">
                            Contacto
                        </a>
                    </li>

                    <?php if($es_admin): ?>
                        <li class="nav-item">
                            <a href="index.php?controlador=lineup&amp;action=gestionar" class="nav-link nav-link-red">Moderar</a>
                        </li>
                        <li class="nav-item">
                            <a href="index.php?controlador=usuario&amp;action=gestionar" class="nav-link nav-link-red">Usuarios</a>
                        </li>
                    <?php endif; ?>

                    <!-- Menú del usuario (avatar como toggle del dropdown) -->
                    <?php
                        $vincular_activo  = ($c_actual === 'usuario' && ($_GET['action'] ?? '') === 'vincular');
                        $ajustes_activo   = ($c_actual === 'usuario' && ($_GET['action'] ?? '') === 'ajustes');
                        $perfil_activo    = ($c_actual === 'perfil');
                        $user_menu_activo = $vincular_activo || $ajustes_activo || $perfil_activo;
                    ?>
                    <li class="nav-item nav-item-user nav-dropdown<?php echo $user_menu_activo ? ' is-active' : ''; ?>">
                        <button type="button"
                                class="nav-user-toggle nav-dropdown-toggle"
                                aria-haspopup="menu"
                                aria-expanded="false"
                                aria-label="Menú del usuario <?php echo htmlspecialchars($username); ?>">
                            <span class="nav-user-avatar"><?php echo htmlspecialchars(strtoupper(substr($username, 0, 2))); ?></span>
                            <span class="dropdown-caret" aria-hidden="true">▾</span>
                        </button>

                        <div class="nav-dropdown-menu nav-dropdown-menu--user" role="menu">
                            <div class="nav-user-meta">
                                <span class="nav-user-meta-name"><?php echo htmlspecialchars($username); ?></span>
                                <span class="nav-user-meta-role"><?php echo $es_admin ? 'Administrador' : 'Jugador'; ?></span>
                            </div>

                            <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$_SESSION['usuario']['id']; ?>"
                               class="nav-dropdown-link<?php echo $perfil_activo ? ' is-active' : ''; ?>"
                               role="menuitem">
                                <span class="nav-dropdown-link-label">Mi perfil</span>
                                <span class="nav-dropdown-link-desc">Ver tu página pública</span>
                            </a>

                            <a href="index.php?controlador=usuario&amp;action=vincular"
                               class="nav-dropdown-link<?php echo $vincular_activo ? ' is-active' : ''; ?>"
                               role="menuitem">
                                <span class="nav-dropdown-link-label">Mi cuenta Valorant</span>
                                <span class="nav-dropdown-link-desc">Vincular Riot ID y rango</span>
                            </a>

                            <a href="index.php?controlador=usuario&amp;action=ajustes"
                               class="nav-dropdown-link<?php echo $ajustes_activo ? ' is-active' : ''; ?>"
                               role="menuitem">
                                <span class="nav-dropdown-link-label">Ajustes</span>
                                <span class="nav-dropdown-link-desc">Presencia, contraseña y cuenta</span>
                            </a>

                            <form class="inline-form" action="index.php?controlador=usuario&amp;action=desconectar" method="post">
                                <?php echo csrf_field(); ?>
                                <button type="submit" class="nav-dropdown-link nav-dropdown-link--danger" role="menuitem">
                                    <span class="nav-dropdown-link-label">Cerrar sesión</span>
                                    <span class="nav-dropdown-link-desc">Salir de tu cuenta</span>
                                </button>
                            </form>
                        </div>
                    </li>
                <?php else: ?>
                    <li class="nav-item nav-item-user">
                        <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary">Login</a>
                    </li>
                <?php endif; ?>

            </ul>
        </nav>
    </div>
</header>
