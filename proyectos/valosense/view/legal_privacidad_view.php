<?php require_once("view/menu.php"); ?>

<main class="main-content legal-view" id="main">
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><span>Legal</span></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Política de privacidad</li>
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
            <span class="eyebrow">// LEGAL · 02</span>
            <h1 class="hero-title">Política de <span class="text-red">privacidad</span></h1>
            <p class="hero-subtitle">Tratamiento de datos personales en ValoSense y derechos del Usuario.</p>
        </div>
    </section>

    <section class="legal-section">
        <div class="container legal-container">

            <aside class="legal-nav" aria-label="Secciones legales">
                <span class="legal-nav-title">Documentos</span>
                <ul class="legal-nav-list">
                    <li><a href="index.php?controlador=legal&amp;action=terminos">Términos de uso</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=privacidad" class="is-active" aria-current="page">Política de privacidad</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=cookies">Política de cookies</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=aviso">Aviso legal</a></li>
                </ul>
                <p class="legal-nav-update">Última actualización: <?php echo date('d/m/Y'); ?></p>
            </aside>

            <article class="legal-article">
                <p class="legal-intro">
                    La presente Política de Privacidad describe cómo se recogen, utilizan y protegen los datos personales
                    que los Usuarios proporcionan al utilizar la plataforma ValoSense (en adelante, «la Plataforma»).
                    El tratamiento se realiza conforme al Reglamento (UE) 2016/679 General de Protección de Datos (RGPD)
                    y a la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
                </p>

                <h2 id="p1">1. Responsable del tratamiento</h2>
                <p>
                    La titularidad de la Plataforma corresponde al equipo de ValoSense, un proyecto académico desarrollado
                    en el marco de un Trabajo de Fin de Grado. Para cualquier cuestión relacionada con la protección de
                    datos, puedes contactar en la dirección <a href="mailto:hola@valosense.local">hola@valosense.local</a>.
                </p>

                <h2 id="p2">2. Datos personales que tratamos</h2>
                <p>En función del uso que hagas de la Plataforma, podemos tratar las siguientes categorías de datos:</p>
                <ul>
                    <li><strong>Datos de registro:</strong> nombre de usuario, correo electrónico, contraseña cifrada, rango y región en Valorant.</li>
                    <li><strong>Datos opcionales de perfil:</strong> Riot ID, tag, región de Riot y visibilidad de los mismos, agentes favoritos, estado de presencia.</li>
                    <li><strong>Datos de uso:</strong> lineups enviados, mensajes enviados a tus amigos, invitaciones de amistad, rutinas de entrenamiento consultadas.</li>
                    <li><strong>Datos técnicos:</strong> identificador de sesión, preferencias de interfaz, timestamps de última actividad.</li>
                </ul>
                <p>
                    No se recogen datos de categorías especiales (origen racial, opiniones políticas, religión, salud u
                    orientación sexual). No se solicita información financiera porque la Plataforma no procesa pagos.
                </p>

                <h2 id="p3">3. Finalidades del tratamiento</h2>
                <ul>
                    <li>Permitir el acceso y uso de las funcionalidades que requieren cuenta.</li>
                    <li>Ofrecer matchmaking entre usuarios del mismo rango, región y rol.</li>
                    <li>Gestionar invitaciones de amistad, mensajes privados y moderación de lineups.</li>
                    <li>Facilitar rutinas de entrenamiento adaptadas al rango del Usuario.</li>
                    <li>Atender consultas y ejercer los derechos reconocidos en la normativa.</li>
                    <li>Prevenir usos fraudulentos y proteger la seguridad de la Plataforma.</li>
                </ul>

                <h2 id="p4">4. Base jurídica</h2>
                <ul>
                    <li><strong>Ejecución del contrato de servicio</strong> (art. 6.1.b RGPD): tratamiento de los datos
                        necesarios para crear la cuenta y prestar las funcionalidades solicitadas.</li>
                    <li><strong>Consentimiento del Usuario</strong> (art. 6.1.a RGPD): para datos opcionales como la
                        vinculación del Riot ID o la publicación del estado de presencia.</li>
                    <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): para la seguridad de la Plataforma, la
                        moderación de contenidos y la prevención de abusos.</li>
                </ul>

                <h2 id="p5">5. Plazo de conservación</h2>
                <p>
                    Los datos se conservarán mientras el Usuario mantenga su cuenta activa. Una vez solicitada la baja
                    de cuenta desde los ajustes, los datos se eliminarán de forma definitiva en un plazo máximo de
                    treinta (30) días, salvo las obligaciones legales que impongan su conservación durante un plazo
                    superior. Los mensajes enviados a otros Usuarios permanecerán en el buzón del destinatario hasta
                    que éste los elimine.
                </p>

                <h2 id="p6">6. Destinatarios</h2>
                <p>
                    No se cederán datos a terceros salvo obligación legal. La Plataforma no realiza transferencias
                    internacionales de datos. Los lineups, mensajes y descripciones públicas publicadas por el Usuario
                    serán accesibles para otros Usuarios según las condiciones propias del servicio.
                </p>

                <h2 id="p7">7. Derechos del Usuario</h2>
                <p>Conforme al RGPD, tienes derecho a:</p>
                <ul>
                    <li><strong>Acceder</strong> a los datos personales que tratamos sobre ti.</li>
                    <li><strong>Rectificar</strong> los datos inexactos o incompletos.</li>
                    <li><strong>Suprimir</strong> tus datos cuando ya no sean necesarios o retires el consentimiento.</li>
                    <li><strong>Oponerte</strong> al tratamiento en determinadas circunstancias.</li>
                    <li><strong>Solicitar la limitación</strong> del tratamiento.</li>
                    <li><strong>Portar</strong> tus datos a otro responsable en formato estructurado.</li>
                    <li><strong>Retirar el consentimiento</strong> previamente otorgado en cualquier momento.</li>
                    <li><strong>Reclamar</strong> ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras
                        que el tratamiento no se ajusta a la normativa.</li>
                </ul>
                <p>
                    Puedes ejercer la mayoría de estos derechos directamente desde la sección <em>Ajustes</em> de tu cuenta
                    (editar datos, cambiar contraseña, eliminar cuenta) o solicitarlo por correo electrónico a
                    <a href="mailto:hola@valosense.local">hola@valosense.local</a>, indicando en el asunto «Protección de datos».
                </p>

                <h2 id="p8">8. Medidas de seguridad</h2>
                <p>
                    La Plataforma aplica medidas técnicas y organizativas razonables y proporcionales al riesgo:
                </p>
                <ul>
                    <li>Contraseñas almacenadas con algoritmos de hash modernos (<em>password_hash</em> con coste adaptativo).</li>
                    <li>Cookies de sesión con atributos <code>HttpOnly</code> y <code>SameSite=Lax</code>, y <code>Secure</code> en HTTPS.</li>
                    <li>Protección CSRF en todos los formularios que modifican información.</li>
                    <li>Cabeceras de seguridad (Content Security Policy, X-Frame-Options, Referrer-Policy, X-Content-Type-Options).</li>
                    <li>Uso de <em>prepared statements</em> en todas las consultas SQL para prevenir inyección.</li>
                    <li>Regeneración del identificador de sesión al autenticarse y al cambiar la contraseña.</li>
                </ul>

                <h2 id="p9">9. Menores de edad</h2>
                <p>
                    La Plataforma no está dirigida a menores de catorce (14) años. Si se detecta el registro de un
                    menor sin el consentimiento de su representante legal, su cuenta será eliminada. Los
                    representantes legales pueden contactarnos para ejercer los derechos del menor.
                </p>

                <h2 id="p10">10. Cambios en la política</h2>
                <p>
                    La titularidad de la Plataforma puede actualizar esta Política de Privacidad. Los cambios se
                    publicarán en esta misma página y, si afectan sustancialmente al tratamiento, se informará al
                    Usuario por los medios de contacto disponibles.
                </p>
            </article>

        </div>
    </section>
</main>
