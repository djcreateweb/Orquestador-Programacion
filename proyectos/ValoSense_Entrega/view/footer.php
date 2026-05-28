<!-- pie de página -->
<footer class="footer">
    <div class="container">
        <div class="footer-grid">

            <div class="footer-col footer-col-brand">
                <a href="index.php" class="navbar-logo">
                    <img src="imagenes/logo.svg" alt="ValoSense" width="32" height="32">
                    <span class="logo-text">Valo<span class="logo-accent">Sense</span></span>
                </a>
                <p class="footer-brand-desc">Matchmaking inteligente y chat con tu equipo para jugadores competitivos de Valorant.</p>
            </div>

            <nav class="footer-col" aria-label="Producto">
                <h3 class="footer-col-title">Producto</h3>
                <ul class="footer-links">
                    <li><a href="index.php?controlador=matchmaker&amp;action=home">Encontrar equipo</a></li>
                    <li><a href="index.php?controlador=lineup&amp;action=home">Lineups</a></li>
                    <li><a href="index.php?controlador=chat&amp;action=home">Chat</a></li>
                    <li><a href="index.php?controlador=team&amp;action=home">Composición</a></li>
                </ul>
            </nav>

            <nav class="footer-col" aria-label="Recursos">
                <h3 class="footer-col-title">Recursos</h3>
                <ul class="footer-links">
                    <li><a href="index.php?controlador=explorar&amp;action=home">Guía de agentes</a></li>
                    <li><a href="index.php?controlador=lineup&amp;action=home">Guía de mapas</a></li>
                    <li><a href="#">Preguntas frecuentes</a></li>
                    <li><a href="mailto:hola@valosense.local">Contacto</a></li>
                </ul>
            </nav>

            <nav class="footer-col" aria-label="Legal">
                <h3 class="footer-col-title">Legal</h3>
                <ul class="footer-links">
                    <li><a href="index.php?controlador=legal&amp;action=terminos">Términos de uso</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=privacidad">Privacidad</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=cookies">Cookies</a></li>
                    <li><a href="index.php?controlador=legal&amp;action=aviso">Aviso legal</a></li>
                </ul>
            </nav>

        </div>

        <div class="footer-bottom">
            <p class="footer-text">ValoSense &copy; <?php echo date('Y'); ?> — Proyecto TFG DAW</p>
        </div>
    </div>
</footer>
