<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<?php
    $errores_map = [
        'token'   => ['Sesión caducada', 'Recarga la página e inténtalo de nuevo.'],
        'nombre'  => ['Nombre no válido', 'Usa entre 2 y 80 caracteres.'],
        'email'   => ['Email no válido', 'Revisa el formato del correo.'],
        'asunto'  => ['Asunto no válido', 'Elige uno del listado.'],
        'mensaje' => ['Mensaje no válido', 'Entre 10 y 2000 caracteres.'],
    ];
    $err_key = $error ?? '';
    $err_data = $errores_map[$err_key] ?? null;
    $show_ok  = !empty($mensaje);
?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Contacto</li>
            </ol>
        </div>
    </nav>

    <!-- Hero compacto -->
    <section class="hero">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// CONTACTO · DIRECTO CON EL AUTOR</span>
            <h1 class="hero-title">¿Mejoras o <span class="text-red">promoción</span>?</h1>
            <p class="hero-subtitle">Escríbeme para sugerir cambios, reportar bugs o promocionar ValoSense. Te responderé lo antes posible.</p>
        </div>
    </section>

    <!-- Grid: form + tarjetas laterales -->
    <section class="contacto-section">
        <div class="contacto-wrap">

            <!-- Flash de éxito / error -->
            <?php if ($show_ok): ?>
                <div class="contacto-flash contacto-flash--ok" role="status">
                    <span class="contacto-flash-icon" aria-hidden="true">✓</span>
                    <div>
                        <strong>Mensaje enviado.</strong>
                        <span>Gracias por escribir — te responderé en cuanto pueda.</span>
                    </div>
                </div>
            <?php elseif ($err_data): ?>
                <div class="contacto-flash contacto-flash--err" role="alert">
                    <span class="contacto-flash-icon" aria-hidden="true">✕</span>
                    <div>
                        <strong><?php echo htmlspecialchars($err_data[0]); ?>.</strong>
                        <span><?php echo htmlspecialchars($err_data[1]); ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <div class="contacto-grid">

                <!-- Columna principal: formulario -->
                <article class="contacto-card contacto-card--form">
                    <header class="contacto-card-head">
                        <span class="eyebrow">// FORMULARIO</span>
                        <h2 class="contacto-card-title">Envíame un mensaje</h2>
                        <p class="contacto-card-sub">Cuéntame tu idea, incidencia o propuesta con el mayor detalle posible.</p>
                    </header>

                    <form class="contacto-form"
                          action="index.php?controlador=contacto&amp;action=enviar"
                          method="post"
                          data-keep-scroll>
                        <?php echo csrf_field(); ?>

                        <div class="contacto-form-row">
                            <div class="form-group">
                                <label class="filter-label" for="nombre">Tu nombre</label>
                                <input class="form-input" type="text" id="nombre" name="nombre"
                                       minlength="2" maxlength="80" required
                                       placeholder="Ej: David">
                            </div>
                            <div class="form-group">
                                <label class="filter-label" for="email">Tu email</label>
                                <input class="form-input" type="email" id="email" name="email"
                                       required placeholder="tu@correo.com">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="asunto">Asunto</label>
                            <select class="filter-select" id="asunto" name="asunto" required>
                                <option value="">Elige un motivo…</option>
                                <option value="mejora">Mejora para la web</option>
                                <option value="promocion">Promoción / colaboración</option>
                                <option value="bug">Reportar un bug</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="mensaje">Mensaje</label>
                            <textarea class="form-input" id="mensaje" name="mensaje"
                                      rows="6" minlength="10" maxlength="2000" required
                                      placeholder="Cuéntame tu propuesta, mejora o incidencia…"></textarea>
                            <small class="contacto-form-hint">Entre 10 y 2000 caracteres.</small>
                        </div>

                        <div class="contacto-form-actions">
                            <button type="submit" class="btn-primary">Enviar mensaje</button>
                        </div>
                    </form>
                </article>

                <!-- Columna lateral: datos directos + CTA lineup -->
                <aside class="contacto-aside">

                    <article class="contacto-card contacto-card--info">
                        <header class="contacto-card-head">
                            <span class="eyebrow">// DIRECTO</span>
                            <h2 class="contacto-card-title">Prefieres el correo</h2>
                            <p class="contacto-card-sub">Si quieres escribirme a mi email personal:</p>
                        </header>
                        <a class="contacto-email-link" href="mailto:djcreateweb@gmail.com?subject=ValoSense%20%E2%80%94%20Mejora%2Fpromo">
                            <span class="contacto-email-icon" aria-hidden="true">@</span>
                            <span class="contacto-email-text">djcreateweb@gmail.com</span>
                        </a>
                        <p class="contacto-info-note">Respuesta habitual en menos de 48 horas.</p>
                    </article>

                    <!-- CTA "Enviar lineup" — ahora vive aquí, no en el navbar superior -->
                    <article class="contacto-card contacto-card--lineup">
                        <header class="contacto-card-head">
                            <span class="eyebrow">// COLABORA</span>
                            <h2 class="contacto-card-title">¿Tienes un <span class="text-red">lineup</span>?</h2>
                            <p class="contacto-card-sub">Comparte tu jugada con la comunidad. Revisaré tu lineup antes de publicarlo.</p>
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
                        <p class="contacto-info-note">Se revisa manualmente. Solo smokes, flashes y mollies útiles.</p>
                    </article>

                </aside>

            </div>
        </div>
    </section>

</main>
