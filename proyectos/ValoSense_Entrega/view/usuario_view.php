<?php require_once("view/menu.php"); ?>

<main class="main-content auth-page" id="main">
    <div class="container">
        <div class="auth-layout">

            <!-- columna izquierda: panel visual -->
            <aside class="auth-visual reveal" aria-hidden="true">
                <span class="corner corner-tl"></span>
                <span class="corner corner-tr"></span>
                <span class="corner corner-bl"></span>
                <span class="corner corner-br"></span>
                <div class="hero-grid-bg"></div>
                <div class="auth-visual-content">
                    <span class="eyebrow">// ACCESS · MÓDULO 00</span>
                    <h2 class="auth-visual-title">Tu próximo <span class="text-red">rango</span> empieza aquí</h2>
                    <p class="auth-visual-desc">Únete y desbloquea matchmaking inteligente, lineups verificados y rutinas personalizadas.</p>
                    <ul class="auth-features">
                        <li class="auth-feature">
                            <span class="auth-feature-icon">◈</span>
                            <div>
                                <h3 class="auth-feature-title">Matchmaking por rango</h3>
                                <p class="auth-feature-desc">Encuentra dúos, tríos o stacks de tu nivel.</p>
                            </div>
                        </li>
                        <li class="auth-feature">
                            <span class="auth-feature-icon">◆</span>
                            <div>
                                <h3 class="auth-feature-title">Biblioteca de lineups</h3>
                                <p class="auth-feature-desc">Jugadas verificadas por la comunidad en todos los mapas.</p>
                            </div>
                        </li>
                        <li class="auth-feature">
                            <span class="auth-feature-icon">◉</span>
                            <div>
                                <h3 class="auth-feature-title">Coach de entrenamiento</h3>
                                <p class="auth-feature-desc">Rutinas y análisis táctico para tu nivel actual.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </aside>

            <!-- columna derecha: formularios -->
            <section class="auth-container reveal-zoom" aria-labelledby="auth-heading">

                <header class="auth-header">
                    <span class="eyebrow">// AUTENTICACIÓN</span>
                    <h1 class="auth-heading" id="auth-heading">Accede a tu cuenta</h1>
                    <p class="auth-sub">Inicia sesión o crea una nueva cuenta para continuar.</p>
                </header>

                <?php if (!empty($message)): ?>
                <div class="auth-aviso <?php echo strpos($message, 'correctamente') !== false ? 'auth-aviso-ok' : 'auth-aviso-error'; ?>">
                    <span class="auth-aviso-icono"><?php echo strpos($message, 'correctamente') !== false ? '✓' : '✕'; ?></span>
                    <span class="auth-aviso-texto"><?php echo htmlspecialchars($message); ?></span>
                </div>
                <?php endif; ?>

                <!-- pestañas login / registro -->
                <div class="auth-tabs" role="tablist" aria-label="Seleccionar formulario">
                    <button class="auth-tab active" data-tab="login" role="tab" aria-selected="true" aria-controls="tab-login" type="button">
                        Iniciar sesión
                    </button>
                    <button class="auth-tab" data-tab="registro" role="tab" aria-selected="false" aria-controls="tab-registro" type="button">
                        Registrarse
                    </button>
                </div>

                <!-- panel de login -->
                <div class="auth-form-wrapper" id="tab-login" role="tabpanel">
                    <form class="auth-form" action="index.php?controlador=usuario&amp;action=login" method="post">
                        <div class="form-group">
                            <label class="form-label" for="nombre">Usuario</label>
                            <input class="form-input" type="text" id="nombre" name="nombre" required autocomplete="username" placeholder="Tu nick">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="pswd">Contraseña</label>
                            <div class="input-wrap">
                                <input class="form-input" type="password" id="pswd" name="pswd" required autocomplete="current-password" placeholder="••••••••">
                                <button type="button" class="input-toggle-btn" data-toggle-password="pswd" aria-label="Mostrar u ocultar contraseña">Ver</button>
                            </div>
                        </div>
                        <button class="btn-primary btn-full" type="submit" name="login" value="1">Entrar al matchmaker</button>
                        <p class="auth-swap">
                            ¿Todavía no tienes cuenta? <a href="#" data-swap-tab="registro">Regístrate gratis</a>
                        </p>
                    </form>
                </div>

                <!-- panel de registro -->
                <div class="auth-form-wrapper hidden" id="tab-registro" role="tabpanel">
                    <form class="auth-form" action="index.php?controlador=usuario&amp;action=registro" method="post">
                        <div class="form-group">
                            <label class="form-label" for="nombre_reg">Nombre de usuario</label>
                            <input class="form-input" type="text" id="nombre_reg" name="nombre" required autocomplete="username"
                                   placeholder="Elige tu nick" minlength="3" maxlength="30">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="email_reg">Email</label>
                            <input class="form-input" type="email" id="email_reg" name="email" required autocomplete="email" placeholder="tu@correo.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="pswd_reg">Contraseña</label>
                            <div class="input-wrap">
                                <input class="form-input" type="password" id="pswd_reg" name="pswd" required autocomplete="new-password" placeholder="Mínimo 8 caracteres" minlength="8">
                                <button type="button" class="input-toggle-btn" data-toggle-password="pswd_reg" aria-label="Mostrar u ocultar contraseña">Ver</button>
                            </div>
                        </div>
                        <input type="hidden" name="rango" value="Sin clasificar">
                        <p class="auth-swap">Tu perfil competitivo empezara como Sin clasificar.</p>
                        <button class="btn-primary btn-full" type="submit" name="registrar" value="1">Crear cuenta</button>
                        <p class="auth-swap">
                            ¿Ya tienes cuenta? <a href="#" data-swap-tab="login">Inicia sesión</a>
                        </p>
                    </form>
                </div>

            </section>
        </div>
    </div>
</main>
