<?php require_once("view/menu.php"); ?>
<main class="main-content" id="main">

    <!-- ==========================================================
         HERO: cabecera grande con titular, subtítulo y stats
         ========================================================== -->
    <section class="hero hero-home">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content reveal">
            <span class="eyebrow">// VALOSENSE · PLATAFORMA</span>
            <h1 class="hero-title">
                Sube de rango en <span class="text-red">Valorant</span>.<br>
                Con inteligencia, no con horas.
            </h1>
            <p class="hero-subtitle">
                Matchmaking, lineups, rutinas de entrenamiento y composiciones.
                Todo lo que necesitas para jugar mejor, en una sola plataforma.
            </p>

            <div class="hero-cta-row">
                <?php if(isset($_SESSION["usuario"])): ?>
                    <a href="index.php?controlador=matchmaker&amp;action=home" class="btn-primary btn-large btn-magnetic">
                        Buscar equipo
                    </a>
                    <a href="#features" class="btn-ghost btn-large">Ver herramientas</a>
                <?php else: ?>
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large btn-magnetic">
                        Crear cuenta gratis
                    </a>
                    <a href="#features" class="btn-ghost btn-large">Ver cómo funciona</a>
                <?php endif; ?>
            </div>

            <!-- Tira de stats -->
            <ul class="hero-stats">
                <?php foreach($stats as $s): ?>
                    <li class="hero-stat">
                        <span class="hero-stat-value"><?php echo htmlspecialchars($s['valor']); ?></span>
                        <span class="hero-stat-label"><?php echo htmlspecialchars($s['label']); ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 01 · HERRAMIENTAS</span>
    </div>

    <!-- ==========================================================
         FEATURES: cuatro tarjetas con cada módulo de la app
         ========================================================== -->
    <section class="features-section" id="features">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// HERRAMIENTAS</span>
                <h2 class="section-title">
                    Todo lo que <span class="text-red">necesitas</span> para competir
                </h2>
                <p class="section-subtitle">
                    Cuatro módulos independientes que trabajan juntos para ayudarte a mejorar.
                </p>
            </header>

            <ul class="features-grid reveal-stagger">
                <?php foreach($features as $f): ?>
                    <li class="feature-card tilt-card feature-card-<?php echo htmlspecialchars($f['key']); ?> reveal"
                        id="feature-<?php echo htmlspecialchars($f['key']); ?>">
                        <span class="corner corner-tl" aria-hidden="true"></span>
                        <span class="corner corner-tr" aria-hidden="true"></span>
                        <span class="corner corner-bl" aria-hidden="true"></span>
                        <span class="corner corner-br" aria-hidden="true"></span>

                        <span class="eyebrow"><?php echo htmlspecialchars($f['eyebrow']); ?></span>
                        <h3 class="feature-title"><?php echo htmlspecialchars($f['titulo']); ?></h3>
                        <p class="feature-desc"><?php echo htmlspecialchars($f['desc']); ?></p>

                        <?php if(!empty($f['bullets'])): ?>
                            <ul class="feature-bullets">
                                <?php foreach($f['bullets'] as $b): ?>
                                    <li><?php echo htmlspecialchars($b); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>

                        <?php if(!empty($f['requiere_login'])): ?>
                            <p class="feature-locked">
                                <span class="feature-lock-icon" aria-hidden="true">🔒</span>
                                Necesitas una cuenta para usar esta herramienta
                            </p>
                        <?php endif; ?>

                        <a href="<?php echo htmlspecialchars($f['href']); ?>" class="feature-cta">
                            <?php echo htmlspecialchars($f['cta']); ?>
                            <span class="feature-cta-arrow" aria-hidden="true">→</span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 02 · CÓMO FUNCIONA</span>
    </div>

    <!-- ==========================================================
         CÓMO FUNCIONA: flujo de 3 pasos para nuevos usuarios
         ========================================================== -->
    <section class="how-section" id="how-it-works">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// FLUJO</span>
                <h2 class="section-title">
                    Empezar es <span class="text-red">sencillo</span>
                </h2>
            </header>

            <ol class="steps-list reveal-stagger">
                <li class="step-card reveal">
                    <span class="step-number">01</span>
                    <h3 class="step-title">Crea tu cuenta</h3>
                    <p class="step-desc">Registra tu rango y tu agente favorito. En 30 segundos.</p>
                </li>
                <li class="step-card reveal">
                    <span class="step-number">02</span>
                    <h3 class="step-title">Elige herramienta</h3>
                    <p class="step-desc">Matchmaker, lineups, rutinas o composición según lo que necesites hoy.</p>
                </li>
                <li class="step-card reveal">
                    <span class="step-number">03</span>
                    <h3 class="step-title">Mejora</h3>
                    <p class="step-desc">Entrena, conecta con jugadores y gana más partidas. Así de simple.</p>
                </li>
            </ol>
        </div>
    </section>

    <?php if(!isset($_SESSION["usuario"])): ?>
        <div class="section-divider" aria-hidden="true">
            <span class="sd-eyebrow">// 03 · EMPEZAR</span>
        </div>

    <!-- ==========================================================
         CTA final para invitar a registrarse si no está logueado
         ========================================================== -->
        <section class="cta-banner">
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>
            <div class="container cta-banner-inner">
                <div class="cta-banner-text">
                    <span class="eyebrow">// ÚNETE</span>
                    <h2 class="cta-banner-title">¿Listo para subir de rango?</h2>
                    <p class="cta-banner-desc">
                        Crea tu perfil y desbloquea las cuatro herramientas completas.
                    </p>
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

