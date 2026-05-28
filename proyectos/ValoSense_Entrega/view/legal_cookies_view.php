<?php require_once("view/menu.php"); ?>

<main class="main-content legal-view" id="main">
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><span>Legal</span></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Política de cookies</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero-compact">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>
        <div class="container hero-content">
            <span class="eyebrow">// LEGAL · 03</span>
            <h1 class="hero-title">Política de <span class="text-red">cookies</span></h1>
            <p class="hero-subtitle">Qué cookies utiliza ValoSense, con qué finalidad y cómo gestionarlas.</p>
        </div>
    </section>

    <section class="legal-section">
        <div class="container legal-container">

            <aside class="legal-nav" aria-label="Secciones legales">
                <span class="legal-nav-title">Documentos</span>
                <ul class="legal-nav-list">
                    <li><a href="index.php?controlador=legal&amp;action=terminos">Términos de uso</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=privacidad">Política de privacidad</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=cookies" class="is-active" aria-current="page">Política de cookies</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=aviso">Aviso legal</a></li>
                </ul>
                <p class="legal-nav-update">Última actualización: <?php echo date('d/m/Y'); ?></p>
            </aside>

            <article class="legal-article">
                <p class="legal-intro">
                    Esta Política de Cookies explica qué son las cookies, cuáles utiliza la plataforma ValoSense
                    (en adelante, «la Plataforma»), con qué finalidad y cómo puede el Usuario gestionarlas o
                    eliminarlas. Esta política complementa a la
                    <a href="index.php?controlador=legal&amp;action=privacidad">Política de privacidad</a>.
                </p>

                <h2 id="c1">1. ¿Qué son las cookies?</h2>
                <p>
                    Una cookie es un pequeño archivo de texto que un sitio web almacena en el dispositivo del Usuario
                    cuando éste lo visita. Las cookies permiten, entre otras cosas, recordar información entre
                    páginas (por ejemplo, mantener la sesión iniciada), guardar preferencias o recopilar información
                    técnica sobre el uso del sitio. Pueden ser de sesión (se borran al cerrar el navegador) o
                    persistentes (permanecen un tiempo definido).
                </p>

                <h2 id="c2">2. Tipos de cookies según su titularidad</h2>
                <ul>
                    <li><strong>Cookies propias:</strong> enviadas al equipo del Usuario desde los servidores de la
                        propia Plataforma.</li>
                    <li><strong>Cookies de terceros:</strong> enviadas desde dominios distintos, como proveedores de
                        vídeo o fuentes externas.</li>
                </ul>

                <h2 id="c3">3. Tipos de cookies según su finalidad</h2>
                <ul>
                    <li><strong>Técnicas / necesarias:</strong> imprescindibles para el funcionamiento del sitio
                        (mantener la sesión iniciada, detectar login, proteger formularios con CSRF). No requieren
                        consentimiento conforme al artículo 22.2 LSSI.</li>
                    <li><strong>De preferencias:</strong> recuerdan decisiones del Usuario (idioma, tema).</li>
                    <li><strong>Analíticas:</strong> miden de forma agregada el uso del sitio.</li>
                    <li><strong>Publicidad / marketing:</strong> presentan anuncios personalizados.</li>
                </ul>

                <h2 id="c4">4. Cookies que utiliza ValoSense</h2>
                <p>A día de hoy, la Plataforma únicamente utiliza cookies técnicas estrictamente necesarias:</p>

                <div class="legal-table-wrap">
                    <table class="legal-table" aria-label="Listado de cookies utilizadas">
                        <thead>
                            <tr>
                                <th scope="col">Nombre</th>
                                <th scope="col">Titular</th>
                                <th scope="col">Finalidad</th>
                                <th scope="col">Duración</th>
                                <th scope="col">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>PHPSESSID</code></td>
                                <td>ValoSense</td>
                                <td>Identificador de sesión que permite mantener al Usuario autenticado entre páginas y validar tokens CSRF.</td>
                                <td>De sesión (se elimina al cerrar el navegador).</td>
                                <td>Técnica</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p>
                    La Plataforma <strong>no utiliza cookies analíticas ni publicitarias</strong> de terceros. No se
                    emplean Google Analytics, píxeles sociales ni sistemas de tracking similares. El chat, el
                    matchmaker y el chat funcionan sin instrumentación externa.
                </p>

                <p>
                    Algunos servicios embebidos voluntariamente por los Usuarios (por ejemplo, reproductores de vídeo
                    de YouTube insertados en los lineups) pueden establecer sus propias cookies al visualizar el
                    contenido. Esas cookies están fuera del control de ValoSense y se rigen por la política del
                    servicio correspondiente:
                </p>
                <ul>
                    <li>Política de cookies de YouTube: <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/cookies</a></li>
                </ul>

                <h2 id="c5">5. Almacenamiento local (localStorage / sessionStorage)</h2>
                <p>
                    Además de las cookies, la Plataforma utiliza el almacenamiento local del navegador para mejorar
                    la experiencia de navegación. Son datos guardados en el propio equipo del Usuario, no se envían
                    al servidor y pueden borrarse en cualquier momento desde las herramientas del navegador:
                </p>
                <ul>
                    <li><strong><code>keepScroll:&lt;ruta&gt;</code></strong> — recuerda la posición de scroll al filtrar
                        búsquedas (se borra al restaurarla).</li>
                    <li><strong><code>vsOrbsBroken</code></strong> — recuerda cuántas «bolas» del hero has roto durante
                        la sesión (se resetea al recargar con F5).</li>
                </ul>

                <h2 id="c6">6. Cómo gestionar o desactivar las cookies</h2>
                <p>
                    El Usuario puede permitir, bloquear o eliminar las cookies instaladas en su dispositivo mediante
                    la configuración del navegador. Enlaces de referencia:
                </p>
                <ul>
                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                    <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
                    <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari (macOS)</a></li>
                </ul>
                <p>
                    Si el Usuario bloquea las cookies técnicas necesarias, la Plataforma puede no funcionar
                    correctamente (por ejemplo, no podrá mantenerse la sesión iniciada).
                </p>

                <h2 id="c7">7. Cambios en la política de cookies</h2>
                <p>
                    Esta política puede actualizarse para reflejar cambios en la normativa o en la propia Plataforma.
                    Cualquier modificación se publicará en esta misma página junto con la fecha de actualización.
                </p>
            </article>

        </div>
    </section>
</main>
