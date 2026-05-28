<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Contacto</li>
            </ol>
        </div>
    </nav>

    <section class="hero">
        <div class="container hero-content">
            <span class="eyebrow">// CONTACTO · DIRECTO CON EL AUTOR</span>
            <h1 class="hero-title">¿Mejoras o <span class="text-red">promoción</span>?</h1>
            <p class="hero-subtitle">Escríbeme para sugerir cambios, reportar bugs o promocionar ValoSense.</p>
        </div>
    </section>

    <section class="contacto-section">
        <div class="contacto-wrap">

            <?php if (!empty($message)): ?>
                <p class="auth-message"><?= htmlspecialchars($message) ?></p>
            <?php endif; ?>

            <div class="contacto-grid">

                <!-- formulario -->
                <article class="contacto-card contacto-card--form">
                    <header class="contacto-card-head">
                        <span class="eyebrow">// FORMULARIO</span>
                        <h2 class="contacto-card-title">Envíame un mensaje</h2>
                    </header>

                    <form class="contacto-form" id="contacto-form" action="https://mail.google.com/mail/" method="get" target="_blank">
                        <input type="hidden" name="view" value="cm">
                        <input type="hidden" name="fs" value="1">
                        <input type="hidden" name="to" value="djcreateweb@gmail.com">
                        <div class="contacto-form-row">
                            <div class="form-group">
                                <label class="filter-label" for="nombre">Tu nombre</label>
                                <input class="form-input" type="text" id="nombre" name="nombre"
                                       minlength="2" maxlength="80" required placeholder="Ej: David">
                            </div>
                            <div class="form-group">
                                <label class="filter-label" for="email">Tu email</label>
                                <input class="form-input" type="email" id="email" name="email"
                                       required placeholder="tu@correo.com">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="asunto">Asunto</label>
                            <select class="filter-select" id="asunto" name="su" required>
                                <option value="">Elige un motivo…</option>
                                <option value="mejora">Mejora para la web</option>
                                <option value="promocion">Promoción / colaboración</option>
                                <option value="bug">Reportar un bug</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="mensaje">Mensaje</label>
                            <textarea class="form-input" id="mensaje" name="body"
                                      rows="6" minlength="10" maxlength="2000" required
                                      placeholder="Cuéntame tu propuesta o incidencia…"></textarea>
                        </div>
                        <div class="contacto-form-actions">
                            <button type="submit" class="btn-enviar">Enviar mensaje</button>
                        </div>
                    </form>
                </article>

                <!-- info lateral -->
                <aside class="contacto-aside">
                    <article class="contacto-card contacto-card--info">
                        <header class="contacto-card-head">
                            <span class="eyebrow">// DIRECTO</span>
                            <h2 class="contacto-card-title">Prefieres el correo</h2>
                        </header>
                        <a class="contacto-email-link" href="mailto:djcreateweb@gmail.com">
                            <span class="contacto-email-icon" aria-hidden="true">@</span>
                            <span class="contacto-email-text">djcreateweb@gmail.com</span>
                        </a>
                        <p class="contacto-info-note">Respuesta habitual en menos de 48 horas.</p>
                    </article>

                    <article class="contacto-card contacto-card--lineup">
                        <header class="contacto-card-head">
                            <span class="eyebrow">// COLABORA</span>
                            <h2 class="contacto-card-title">¿Tienes un <span class="text-red">lineup</span>?</h2>
                            <p class="contacto-card-sub">Comparte tu jugada con la comunidad.</p>
                        </header>
                        <?php if (isset($_SESSION['usuario'])): ?>
                            <a href="index.php?controlador=lineup&amp;action=enviar" class="btn-primary btn-large contacto-cta-lineup">
                                Enviar mi lineup
                            </a>
                        <?php else: ?>
                            <a href="index.php?controlador=usuario&amp;action=home" class="btn-secondary btn-large contacto-cta-lineup">
                                Inicia sesión para enviar
                            </a>
                        <?php endif; ?>
                        <p class="contacto-info-note">Solo smokes, flashes y mollies útiles.</p>
                    </article>
                </aside>

            </div>
        </div>
    </section>

</main>
