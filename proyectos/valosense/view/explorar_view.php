<?php require_once("view/menu.php"); ?>
<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Explorar</li>
            </ol>
        </div>
    </nav>

    <!-- ==========================================================
         HERO de la página Explorar
         ========================================================== -->
    <section class="hero hero-explorar">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// CATÁLOGO DE HERRAMIENTAS</span>
            <h1 class="hero-title">
                Qué ofrece <span class="text-red">ValoSense</span>
            </h1>
            <p class="hero-subtitle">
                Cuatro módulos pensados para jugadores competitivos. Aquí puedes leer qué hace cada uno.
                <?php if(!$logeado): ?>
                    Para usarlos de verdad, tendrás que iniciar sesión.
                <?php endif; ?>
            </p>

            <?php if(!$logeado): ?>
                <div class="hero-cta-row">
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">
                        Crear cuenta gratis
                    </a>
                    <a href="#tool-matchmaker" class="btn-ghost btn-large">Ver herramientas</a>
                </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- ==========================================================
         ÍNDICE rápido: permite saltar a cualquier herramienta
         ========================================================== -->
    <nav class="explorar-toc" aria-label="Índice de herramientas">
        <div class="container">
            <ol class="explorar-toc-list">
                <?php foreach($herramientas as $h): ?>
                    <li>
                        <a href="#tool-<?php echo htmlspecialchars($h['key']); ?>" class="explorar-toc-link">
                            <span class="explorar-toc-num"><?php echo htmlspecialchars($h['numero']); ?></span>
                            <span class="explorar-toc-label"><?php echo htmlspecialchars($h['titulo']); ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ol>
        </div>
    </nav>

    <!-- ==========================================================
         SECCIONES: una por herramienta
         ========================================================== -->
    <?php foreach($herramientas as $h): ?>
        <section class="tool-section" id="tool-<?php echo htmlspecialchars($h['key']); ?>">
            <div class="container">

                <header class="tool-section-header">
                    <span class="tool-section-number"><?php echo htmlspecialchars($h['numero']); ?></span>
                    <div>
                        <span class="eyebrow"><?php echo htmlspecialchars($h['eyebrow']); ?></span>
                        <h2 class="tool-section-title"><?php echo htmlspecialchars($h['titulo']); ?></h2>
                        <p class="tool-section-subtitle"><?php echo htmlspecialchars($h['subtitulo']); ?></p>
                    </div>
                </header>

                <div class="tool-section-grid">

                    <!-- Columna izquierda: qué ofrece -->
                    <div class="tool-section-col">
                        <h3 class="tool-col-title">Qué ofrece</h3>
                        <ul class="tool-bullets">
                            <?php foreach($h['bullets'] as $b): ?>
                                <li><?php echo htmlspecialchars($b); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>

                    <!-- Columna derecha: cómo se usa -->
                    <div class="tool-section-col">
                        <h3 class="tool-col-title">Cómo se usa</h3>
                        <ol class="tool-steps">
                            <?php foreach($h['pasos'] as $i => $p): ?>
                                <li>
                                    <span class="tool-step-num"><?php echo str_pad($i + 1, 2, '0', STR_PAD_LEFT); ?></span>
                                    <span class="tool-step-text"><?php echo htmlspecialchars($p); ?></span>
                                </li>
                            <?php endforeach; ?>
                        </ol>
                    </div>

                </div>

                <!-- Pie con estado de acceso y CTA -->
                <footer class="tool-section-footer">
                    <?php if(!empty($h['nota_acceso'])): ?>
                        <!-- Caso especial: lineups son públicos -->
                        <p class="tool-access-note">
                            <span class="tool-access-icon" aria-hidden="true">ℹ</span>
                            <?php echo htmlspecialchars($h['nota_acceso']); ?>
                        </p>
                        <div class="tool-actions">
                            <a href="index.php?controlador=lineup&amp;action=home" class="btn-ghost">Ver biblioteca</a>
                            <?php if(!$logeado): ?>
                                <a href="<?php echo htmlspecialchars($href_login); ?>" class="btn-primary">
                                    Iniciar sesión para enviar
                                </a>
                            <?php else: ?>
                                <a href="index.php?controlador=lineup&amp;action=enviar" class="btn-primary">Enviar lineup</a>
                            <?php endif; ?>
                        </div>

                    <?php elseif($h['requiere_login'] && !$logeado): ?>
                        <!-- Herramienta bloqueada: hay que iniciar sesión -->
                        <p class="tool-access-note tool-locked">
                            <span class="tool-access-icon" aria-hidden="true">🔒</span>
                            Para usar esta herramienta necesitas una cuenta. Es gratis.
                        </p>
                        <div class="tool-actions">
                            <a href="<?php echo htmlspecialchars($href_login); ?>" class="btn-primary">
                                Iniciar sesión para usar
                            </a>
                            <a href="<?php echo htmlspecialchars($href_login); ?>" class="btn-ghost">
                                Crear cuenta gratis
                            </a>
                        </div>

                    <?php else: ?>
                        <!-- Usuario logueado: acceso directo a la herramienta -->
                        <div class="tool-actions">
                            <a href="index.php?controlador=<?php echo htmlspecialchars($h['key']); ?>&amp;action=home" class="btn-primary">
                                Abrir <?php echo htmlspecialchars($h['titulo']); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </footer>

            </div>
        </section>
    <?php endforeach; ?>

    <!-- ==========================================================
         CTA final para invitados
         ========================================================== -->
    <?php if(!$logeado): ?>
        <section class="cta-banner">
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>
            <div class="container cta-banner-inner">
                <div class="cta-banner-text">
                    <span class="eyebrow">// ÚNETE</span>
                    <h2 class="cta-banner-title">Desbloquea las cuatro herramientas</h2>
                    <p class="cta-banner-desc">Crear cuenta tarda 30 segundos y no pedimos ningún dato sensible.</p>
                </div>
                <div class="cta-banner-actions">
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">
                        Crear cuenta gratis
                    </a>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>
