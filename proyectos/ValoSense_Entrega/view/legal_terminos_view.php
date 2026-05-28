<?php require_once("view/menu.php"); ?>

<main class="main-content legal-view" id="main">
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><span>Legal</span></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Términos de uso</li>
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
            <span class="eyebrow">// LEGAL · 01</span>
            <h1 class="hero-title">Términos <span class="text-red">de uso</span></h1>
            <p class="hero-subtitle">Condiciones que regulan el acceso y uso de la plataforma ValoSense.</p>
        </div>
    </section>

    <section class="legal-section">
        <div class="container legal-container">

            <aside class="legal-nav" aria-label="Secciones legales">
                <span class="legal-nav-title">Documentos</span>
                <ul class="legal-nav-list">
                    <li><a href="index.php?controlador=legal&amp;action=terminos" class="is-active" aria-current="page">Términos de uso</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=privacidad">Política de privacidad</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=cookies">Política de cookies</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=aviso">Aviso legal</a></li>
                </ul>
                <p class="legal-nav-update">Última actualización: <?php echo date('d/m/Y'); ?></p>
            </aside>

            <article class="legal-article">
                <p class="legal-intro">
                    Los presentes términos y condiciones (en adelante, «los Términos») regulan el acceso, navegación y uso
                    de la plataforma ValoSense (en adelante, «la Plataforma»), accesible a través de su dirección web.
                    La utilización de la Plataforma atribuye a quien accede la condición de usuario (en adelante, «el Usuario»)
                    e implica la aceptación plena y sin reservas de todas las disposiciones aquí incluidas.
                </p>

                <h2 id="t1">1. Objeto</h2>
                <p>
                    ValoSense es un proyecto académico desarrollado en el marco de un Trabajo de Fin de Grado cuyo objetivo
                    es ofrecer a la comunidad de jugadores del videojuego Valorant un conjunto de herramientas: matchmaking
                    entre jugadores del mismo rango, biblioteca de lineups verificados, chat con amigos y un
                    recomendador de composición de equipo. Los presentes Términos tienen por objeto regular las condiciones
                    de uso de dichas funcionalidades.
                </p>

                <h2 id="t2">2. Aceptación</h2>
                <p>
                    El acceso a la Plataforma implica la aceptación expresa de estos Términos. Si el Usuario no estuviera
                    de acuerdo con alguna de las cláusulas, deberá abstenerse de utilizar la Plataforma. La titularidad
                    de la Plataforma se reserva el derecho de modificar en cualquier momento los presentes Términos; los
                    cambios se publicarán en esta misma página e indicarán la fecha de última actualización.
                </p>

                <h2 id="t3">3. Registro y cuenta de usuario</h2>
                <p>
                    El uso de determinadas funcionalidades (matchmaking, envío de lineups, chat entre amigos)
                    requiere el alta de una cuenta. El Usuario se compromete a:
                </p>
                <ul>
                    <li>Proporcionar información veraz y mantenerla actualizada.</li>
                    <li>Elegir un nombre de usuario que no resulte ofensivo, engañoso ni suplantador de la identidad de terceros.</li>
                    <li>Custodiar la confidencialidad de su contraseña y no cederla a terceras personas.</li>
                    <li>Notificar de inmediato cualquier uso no autorizado de su cuenta.</li>
                </ul>
                <p>
                    La titularidad de la Plataforma podrá suspender o cancelar cuentas que incumplan estos Términos,
                    previa advertencia salvo en casos de infracción grave.
                </p>

                <h2 id="t4">4. Condiciones de uso</h2>
                <p>El Usuario se obliga a emplear la Plataforma de forma diligente, correcta y lícita. En particular, se compromete a no:</p>
                <ul>
                    <li>Publicar contenidos ilícitos, injuriosos, discriminatorios, difamatorios, pornográficos, obscenos o contrarios a la moral o al orden público.</li>
                    <li>Introducir virus, troyanos, gusanos u otros elementos dañinos que puedan alterar el funcionamiento de los sistemas.</li>
                    <li>Realizar intentos de acceso no autorizado a áreas restringidas de la Plataforma.</li>
                    <li>Emplear la Plataforma para enviar mensajes masivos no solicitados (spam), acosar a otros usuarios o difundir contenido malicioso.</li>
                    <li>Utilizar técnicas de scraping, ingeniería inversa o automatización masiva sin autorización expresa.</li>
                </ul>

                <h2 id="t5">5. Contenidos publicados por los Usuarios</h2>
                <p>
                    Los lineups, descripciones, mensajes y cualquier otro contenido aportado por los Usuarios son
                    responsabilidad exclusiva de su autor. Antes de su publicación pública, los lineups son revisados
                    por el equipo moderador para garantizar su adecuación a estos Términos, reservándose el derecho
                    a rechazar, editar o eliminar aquellos que resulten inapropiados, de baja calidad o que infrinjan
                    derechos de terceros.
                </p>
                <p>
                    El Usuario declara disponer de todos los derechos necesarios sobre el contenido que sube y concede
                    a la Plataforma una licencia no exclusiva, gratuita y revocable para mostrarlo dentro de la misma
                    con la finalidad de prestar el servicio.
                </p>

                <h2 id="t6">6. Propiedad intelectual e industrial</h2>
                <p>
                    Los contenidos originales de la Plataforma (código fuente, diseño gráfico, textos propios, logos,
                    estructura de navegación e ilustraciones) están protegidos por la normativa de propiedad intelectual.
                    Queda prohibida su reproducción, distribución, comunicación pública o transformación sin autorización
                    expresa, salvo cuando la ley lo permita.
                </p>
                <p>
                    ValoSense integra vídeos alojados en YouTube mediante su funcionalidad oficial de embebido; los
                    derechos sobre dichos vídeos corresponden a sus respectivos autores y a YouTube, LLC.
                </p>

                <h2 id="t7">7. Ausencia de afiliación con Riot Games</h2>
                <p>
                    ValoSense es un proyecto de terceros sin relación contractual, comercial ni afiliativa con
                    Riot Games, Inc. Valorant, los nombres de los agentes, los mapas y demás elementos del juego
                    son marcas registradas de Riot Games, Inc. y aparecen en esta Plataforma únicamente con fines
                    informativos y descriptivos.
                </p>

                <h2 id="t8">8. Disponibilidad y limitación de responsabilidad</h2>
                <p>
                    La Plataforma realiza esfuerzos razonables para mantener la continuidad del servicio, pero no
                    garantiza que el acceso sea ininterrumpido ni que esté libre de errores. La titularidad de la
                    Plataforma no será responsable de los daños o perjuicios que pudieran derivarse de:
                </p>
                <ul>
                    <li>Interrupciones, fallos o suspensiones del servicio.</li>
                    <li>Presencia de virus u otros elementos lesivos en los contenidos pese a haber adoptado medidas
                        técnicas de protección.</li>
                    <li>Uso indebido o ilícito de la Plataforma por parte de los Usuarios.</li>
                    <li>Información, opiniones o contenidos publicados por otros Usuarios.</li>
                </ul>

                <h2 id="t9">9. Enlaces a sitios de terceros</h2>
                <p>
                    La Plataforma incluye enlaces a recursos externos (principalmente vídeos de YouTube y servidores
                    de Discord aportados por los propios Usuarios). El acceso a dichos recursos se realiza bajo la
                    exclusiva responsabilidad del Usuario y queda sujeto a las condiciones de los sitios de destino.
                </p>

                <h2 id="t10">10. Protección de datos</h2>
                <p>
                    El tratamiento de los datos personales del Usuario se rige por la
                    <a href="index.php?controlador=legal&amp;action=privacidad">Política de privacidad</a>,
                    que forma parte integrante de estos Términos.
                </p>

                <h2 id="t11">11. Duración y resolución</h2>
                <p>
                    Los presentes Términos permanecen en vigor durante todo el tiempo en que la Plataforma esté disponible.
                    Tanto el Usuario como la titularidad de la Plataforma pueden dar por finalizada la relación en cualquier
                    momento: el Usuario solicitando la baja de su cuenta desde los ajustes, y la titularidad suspendiendo
                    el servicio o cancelando la cuenta del Usuario si concurre causa justificada.
                </p>

                <h2 id="t12">12. Legislación aplicable y jurisdicción</h2>
                <p>
                    Estos Términos se rigen por la legislación española. Para la resolución de cualquier controversia
                    derivada de su interpretación o cumplimiento, las partes se someten a los Juzgados y Tribunales del
                    domicilio del consumidor cuando el Usuario tenga tal condición; en caso contrario, a los del lugar
                    donde se considere celebrado el contrato de prestación del servicio.
                </p>

                <h2 id="t13">13. Contacto</h2>
                <p>
                    Para cualquier consulta relativa a estos Términos puedes escribir a
                    <a href="mailto:hola@valosense.local">hola@valosense.local</a>.
                </p>
            </article>

        </div>
    </section>
</main>
