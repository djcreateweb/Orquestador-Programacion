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

            </div>
        </div>
    </section>

</main>
