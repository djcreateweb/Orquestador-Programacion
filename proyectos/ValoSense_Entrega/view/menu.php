<?php
$c_actual = $_GET['controlador'] ?? '';
$logeado = isset($_SESSION["usuario"]);
$es_admin = !empty($_SESSION["usuario"]["es_admin"]);
$username = $logeado ? ($_SESSION["usuario"]["username"] ?? '') : '';
?>

<a href="#main" class="skip-link">Saltar al contenido</a>

<header class="navbar">
    <div class="navbar-container">
        <div class="navbar-brand">
            <button type="button" id="orbsFreeze" class="orbs-freeze"
                    aria-pressed="false" aria-label="Congelar las bolitas" title="Congelar las bolitas">
                <span class="orbs-freeze-dot" aria-hidden="true"></span>
            </button>
            <a href="index.php" class="navbar-logo">
                <img src="imagenes/logo.svg" alt="ValoSense" width="32" height="32">
                <span class="logo-text">Valo<span class="logo-accent">Sense</span></span>
            </a>
        </div>

        <button class="navbar-toggle" id="menu-toggle" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>

        <nav class="navbar-menu" id="navbar-menu" aria-label="Menú principal">
            <ul class="nav-list">

                <?php if (!$logeado): ?>
                    <li class="nav-item">
                        <a href="index.php" class="nav-link<?php echo ($c_actual === '' || $c_actual === 'home') ? ' nav-link-active' : ''; ?>">Inicio</a>
                    </li>
                    <li class="nav-item">
                        <a href="index.php?controlador=explorar&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'explorar' ? ' nav-link-active' : ''; ?>">
                            Explorar
                        </a>
                    </li>
                <?php endif; ?>

                <?php if ($logeado): ?>
                    <li class="nav-item">
                        <a href="index.php?controlador=matchmaker&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'matchmaker' ? ' nav-link-active' : ''; ?>">
                            Encontrar equipo
                        </a>
                    </li>
                    <?php if (!$es_admin): ?>
                    <li class="nav-item">
                        <a href="index.php?controlador=lineup&amp;action=home"
                           class="nav-link<?php echo ($c_actual === 'lineup' && ($_GET['action'] ?? '') !== 'enviar') ? ' nav-link-active' : ''; ?>">
                            Lineups
                        </a>
                    </li>
                    <?php endif; ?>
                    <li class="nav-item">
                        <a href="index.php?controlador=team&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'team' ? ' nav-link-active' : ''; ?>">
                            Composición
                        </a>
                    </li>

                    <li class="nav-item nav-item-push-right">
                        <a href="index.php?controlador=amistad&amp;action=home"
                           class="nav-link<?php echo ($c_actual === 'amistad' && ($_GET['action'] ?? '') !== 'amigos') ? ' nav-link-active' : ''; ?>">
                            Solicitudes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="index.php?controlador=amistad&amp;action=amigos"
                           class="nav-link<?php echo ($c_actual === 'amistad' && ($_GET['action'] ?? '') === 'amigos') ? ' nav-link-active' : ''; ?>">
                            Amigos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="index.php?controlador=chat&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'chat' ? ' nav-link-active' : ''; ?>">
                            Mensajes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="index.php?controlador=contacto&amp;action=home"
                           class="nav-link<?php echo $c_actual === 'contacto' ? ' nav-link-active' : ''; ?>">
                            Contacto
                        </a>
                    </li>
                    <?php if (!$es_admin): ?>
                    <li class="nav-item">
                        <a href="index.php?controlador=lineup&amp;action=enviar"
                           class="nav-link<?php echo ($c_actual === 'lineup' && ($_GET['action'] ?? '') === 'enviar') ? ' nav-link-active' : ''; ?>">
                            Enviar lineup
                        </a>
                    </li>
                    <?php endif; ?>

                    <?php if ($es_admin): ?>
                        <li class="nav-item">
                            <a href="index.php?controlador=lineup&amp;action=home"
                               class="nav-link nav-link-red<?php echo ($c_actual === 'lineup' && ($_GET['action'] ?? '') !== 'gestionar') ? ' nav-link-active' : ''; ?>">
                                Editor lineup
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="index.php?controlador=admin&amp;action=lineups"
                               class="nav-link nav-link-red<?php echo ($c_actual === 'admin' && ($_GET['action'] ?? '') === 'lineups') ? ' nav-link-active' : ''; ?>">
                                Moderar Videos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="index.php?controlador=admin&amp;action=usuarios"
                               class="nav-link nav-link-red<?php echo ($c_actual === 'admin' && (($_GET['action'] ?? '') === 'usuarios' || ($_GET['action'] ?? '') === 'home')) ? ' nav-link-active' : ''; ?>">
                                Usuarios
                            </a>
                        </li>
                    <?php endif; ?>

                    <!-- menú del usuario -->
                    <?php
                        $user_menu_activo = in_array($c_actual, ['perfil','usuario']) && in_array($_GET['action'] ?? '', ['ajustes','completar_perfil','ver','']);
                    ?>
                    <li class="nav-item nav-item-user nav-dropdown">
                        <button type="button" class="nav-user-toggle nav-dropdown-toggle<?php echo $user_menu_activo ? ' nav-link-active' : ''; ?>"
                                aria-haspopup="menu" aria-expanded="false"
                                aria-label="Menú de <?php echo htmlspecialchars($username); ?>">
                            <span class="nav-user-avatar"><?php echo htmlspecialchars(strtoupper(substr($username, 0, 2))); ?></span>
                            <span class="dropdown-caret" aria-hidden="true">▾</span>
                        </button>

                        <div class="nav-dropdown-menu nav-dropdown-menu--user" role="menu">
                            <div class="nav-user-meta">
                                <span class="nav-user-meta-name"><?php echo htmlspecialchars($username); ?></span>
                                <span class="nav-user-meta-role"><?php echo $es_admin ? 'Administrador' : 'Jugador'; ?></span>
                            </div>
                            <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $_SESSION['usuario']['id']; ?>"
                               class="nav-dropdown-link" role="menuitem">
                                <span class="nav-dropdown-link-label">Mi perfil</span>
                                <span class="nav-dropdown-link-desc">Ver tu página pública</span>
                            </a>
                            <a href="index.php?controlador=usuario&amp;action=completar_perfil"
                               class="nav-dropdown-link" role="menuitem">
                                <span class="nav-dropdown-link-label">Completa tu perfil</span>
                                <span class="nav-dropdown-link-desc">Riot ID, rango y RR</span>
                            </a>
                            <a href="index.php?controlador=usuario&amp;action=ajustes"
                               class="nav-dropdown-link" role="menuitem">
                                <span class="nav-dropdown-link-label">Ajustes</span>
                                <span class="nav-dropdown-link-desc">Presencia, contraseña y cuenta</span>
                            </a>
                            <a href="index.php?controlador=usuario&amp;action=desconectar"
                               class="nav-dropdown-link nav-dropdown-link--danger" role="menuitem">
                                <span class="nav-dropdown-link-label">Cerrar sesión</span>
                                <span class="nav-dropdown-link-desc">Salir de tu cuenta</span>
                            </a>
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
