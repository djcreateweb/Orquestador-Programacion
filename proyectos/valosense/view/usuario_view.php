<?php require_once("view/menu.php"); ?>

<main class="main-content auth-page" id="main">
    <div class="container">
        <div class="auth-layout">

            <!-- Columna izquierda: panel visual con claims -->
            <aside class="auth-visual reveal" aria-hidden="true">
                <span class="corner corner-tl"></span>
                <span class="corner corner-tr"></span>
                <span class="corner corner-bl"></span>
                <span class="corner corner-br"></span>
                <div class="hero-grid-bg"></div>

                <div class="auth-visual-content">
                    <span class="eyebrow">// ACCESS · MÓDULO 00</span>
                    <h2 class="auth-visual-title">Tu próximo <span class="text-red">rango</span> empieza aquí</h2>
                    <p class="auth-visual-desc">Únete a la comunidad y desbloquea matchmaking inteligente, lineups verificados y rutinas personalizadas.</p>

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

                    <ul class="auth-social-proof">
                        <li><span class="auth-proof-value">12.4K</span><span class="auth-proof-label">Jugadores</span></li>
                        <li><span class="auth-proof-value">275</span><span class="auth-proof-label">Lineups</span></li>
                        <li><span class="auth-proof-value">45</span><span class="auth-proof-label">Rutinas</span></li>
                    </ul>
                </div>
            </aside>

            <!-- Columna derecha: formularios -->
            <section class="auth-container reveal-zoom" aria-labelledby="auth-heading">

                <header class="auth-header">
                    <span class="eyebrow">// AUTENTICACIÓN</span>
                    <h1 class="auth-heading" id="auth-heading">Accede a tu cuenta</h1>
                    <p class="auth-sub">Inicia sesión o crea una nueva cuenta para continuar.</p>
                </header>

                <!-- Pestañas login / registro -->
                <div class="auth-tabs" role="tablist" aria-label="Seleccionar formulario">
                    <button class="auth-tab active" data-tab="login" role="tab" aria-selected="true" aria-controls="tab-login" type="button">
                        Iniciar sesión
                    </button>
                    <button class="auth-tab" data-tab="registro" role="tab" aria-selected="false" aria-controls="tab-registro" type="button">
                        Registrarse
                    </button>
                </div>

                <!-- Panel de login -->
                <div class="auth-form-wrapper" id="tab-login" role="tabpanel">
                    <form class="auth-form" action="index.php?controlador=usuario&amp;action=login" method="post">
                        <?php echo csrf_field(); ?>

                        <div class="form-group">
                            <label class="form-label" for="nombre">Usuario</label>
                            <input class="form-input" type="text" id="nombre" name="nombre" required autocomplete="username" placeholder="Tu nick o Riot ID">
                        </div>

                        <div class="form-group">
                            <div class="form-label-row">
                                <label class="form-label" for="pswd">Contraseña</label>
                                <a href="#" class="form-label-link">¿Olvidaste tu contraseña?</a>
                            </div>
                            <div class="input-wrap">
                                <input class="form-input" type="password" id="pswd" name="pswd" required autocomplete="current-password" placeholder="••••••••">
                                <button type="button" class="input-toggle-btn" data-toggle-password="pswd" aria-pressed="false" aria-label="Mostrar u ocultar contraseña">Ver</button>
                            </div>
                        </div>

                        <button class="btn-primary btn-full" type="submit" name="login" value="Entrar al matchmaker">Entrar al matchmaker</button>

                        <div class="auth-divider"><span>o</span></div>

                        <a href="index.php?controlador=usuario&amp;action=google" class="btn-secondary btn-full auth-google">
                            <svg class="auth-google-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                                <path fill="#4285F4" d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6154z"/>
                                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8605-3.0477.8605-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"/>
                            </svg>
                            Continuar con Google
                        </a>

                        <?php if(isset($message) && $message !== ""): ?>
                            <p class="auth-message" data-toast="info"><?php echo htmlspecialchars($message); ?></p>
                        <?php endif; ?>

                        <p class="auth-swap">
                            ¿Todavía no tienes cuenta? <a href="#" data-swap-tab="registro">Regístrate gratis</a>
                        </p>
                    </form>
                </div>

                <!-- Panel de registro -->
                <div class="auth-form-wrapper hidden" id="tab-registro" role="tabpanel">
                    <form class="auth-form" action="index.php?controlador=usuario&amp;action=registro" method="post">
                        <?php echo csrf_field(); ?>

                        <div class="form-group">
                            <label class="form-label" for="nombre_reg">Nombre de usuario</label>
                            <input class="form-input" type="text" id="nombre_reg" name="nombre" required autocomplete="username" placeholder="Elige tu nick in-game" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]{3,30}">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="pswd_reg">Contraseña</label>
                            <div class="input-wrap">
                                <input class="form-input" type="password" id="pswd_reg" name="pswd" required autocomplete="new-password" placeholder="Mínimo 8 caracteres" minlength="8">
                                <button type="button" class="input-toggle-btn" data-toggle-password="pswd_reg" aria-pressed="false" aria-label="Mostrar u ocultar contraseña">Ver</button>
                            </div>
                            <div class="pwd-meter" data-strength-for="pswd_reg" aria-hidden="true"></div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="rango_reg">Tu rango</label>
                            <select class="form-input" id="rango_reg" name="rango" required>
                                <option value="" disabled selected>Selecciona tu rango</option>
                                <option value="Iron">Iron</option>
                                <option value="Bronze">Bronze</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                                <option value="Diamond">Diamond</option>
                                <option value="Ascendant">Ascendant</option>
                                <option value="Immortal">Immortal</option>
                                <option value="Radiant">Radiant</option>
                            </select>
                        </div>

                        <button class="btn-primary btn-full" type="submit" name="registrar" value="Registrarse">Crear cuenta</button>

                        <div class="auth-divider"><span>o</span></div>

                        <a href="index.php?controlador=usuario&amp;action=google" class="btn-secondary btn-full auth-google">
                            <svg class="auth-google-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                                <path fill="#4285F4" d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6154z"/>
                                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8605-3.0477.8605-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"/>
                            </svg>
                            Registrarse con Google
                        </a>

                        <?php if(isset($message) && $message !== ""): ?>
                            <p class="auth-message" data-toast="info"><?php echo htmlspecialchars($message); ?></p>
                        <?php endif; ?>

                        <p class="auth-swap">
                            ¿Ya tienes cuenta? <a href="#" data-swap-tab="login">Inicia sesión</a>
                        </p>
                    </form>
                </div>

            </section>
        </div>
    </div>
</main>
