<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <!-- hero -->
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
                <?php if ($logeado): ?>
                    <a href="index.php?controlador=matchmaker&amp;action=home" class="btn-primary btn-large">Buscar equipo</a>
                    <a href="#features" class="btn-ghost btn-large">Ver herramientas</a>
                <?php else: ?>
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">Crear cuenta gratis</a>
                    <a href="#features" class="btn-ghost btn-large">Ver cómo funciona</a>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 01 · HERRAMIENTAS</span>
    </div>

    <!-- features -->
    <section class="features-section" id="features">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// HERRAMIENTAS</span>
                <h2 class="section-title">Todo lo que <span class="text-red">necesitas</span> para competir</h2>
                <p class="section-subtitle">Cuatro módulos independientes que trabajan juntos para ayudarte a mejorar.</p>
            </header>

            <ul class="features-grid reveal-stagger">

                <li class="feature-card tilt-card feature-card-matchmaker reveal">
                    <span class="eyebrow">// MATCHMAKER</span>
                    <h3 class="feature-title">Encuentra tu equipo ideal</h3>
                    <p class="feature-desc">Filtra por rango, agente y rol. Consigue compañeros de tu nivel.</p>
                    <ul class="feature-bullets">
                        <li>Filtros por rango, región y agentes favoritos</li>
                        <li>Estadísticas reales de cada jugador</li>
                    </ul>
                    <?php if (!$logeado): ?>
                        <p class="feature-locked"><span class="feature-lock-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta</p>
                    <?php endif; ?>
                    <a href="<?php echo $logeado ? 'index.php?controlador=matchmaker&action=home' : 'index.php?controlador=usuario&action=home'; ?>" class="feature-cta">
                        <?php echo $logeado ? 'Buscar equipo' : 'Iniciar sesión para usar'; ?> <span class="feature-cta-arrow" aria-hidden="true">→</span>
                    </a>
                </li>

                <li class="feature-card tilt-card feature-card-lineup reveal">
                    <span class="eyebrow">// LINEUPS</span>
                    <h3 class="feature-title">Biblioteca de lineups</h3>
                    <p class="feature-desc">Smokes, flashes y molotovs revisados por la comunidad. Filtra por agente y mapa.</p>
                    <ul class="feature-bullets">
                        <li>Lineups moderados antes de publicarse</li>
                        <li>Videos integrados desde YouTube</li>
                    </ul>
                    <a href="index.php?controlador=lineup&amp;action=home" class="feature-cta">
                        Ver lineups <span class="feature-cta-arrow" aria-hidden="true">→</span>
                    </a>
                </li>

                <li class="feature-card tilt-card feature-card-training reveal">
                    <span class="eyebrow">// ENTRENAMIENTO</span>
                    <h3 class="feature-title">Rutinas según tu rango</h3>
                    <p class="feature-desc">Entrenamientos de aim, utilidad y táctica adaptados a tu nivel actual.</p>
                    <ul class="feature-bullets">
                        <li>Rutinas por categoría</li>
                        <li>Videos de referencia integrados</li>
                    </ul>
                    <?php if (!$logeado): ?>
                        <p class="feature-locked"><span class="feature-lock-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta</p>
                    <?php endif; ?>
                    <a href="<?php echo $logeado ? 'index.php?controlador=training&action=home' : 'index.php?controlador=usuario&action=home'; ?>" class="feature-cta">
                        <?php echo $logeado ? 'Empezar rutina' : 'Iniciar sesión para usar'; ?> <span class="feature-cta-arrow" aria-hidden="true">→</span>
                    </a>
                </li>

                <li class="feature-card tilt-card feature-card-team reveal">
                    <span class="eyebrow">// COMPOSICIÓN</span>
                    <h3 class="feature-title">Recomendador de comp</h3>
                    <p class="feature-desc">Elige mapa y dinos con qué agentes vais. Te sugerimos cómo completar el equipo.</p>
                    <ul class="feature-bullets">
                        <li>Recomendaciones por rol faltante</li>
                        <li>Basado en tier list por mapa</li>
                    </ul>
                    <?php if (!$logeado): ?>
                        <p class="feature-locked"><span class="feature-lock-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta</p>
                    <?php endif; ?>
                    <a href="<?php echo $logeado ? 'index.php?controlador=team&action=home' : 'index.php?controlador=usuario&action=home'; ?>" class="feature-cta">
                        <?php echo $logeado ? 'Probar recomendador' : 'Iniciar sesión para usar'; ?> <span class="feature-cta-arrow" aria-hidden="true">→</span>
                    </a>
                </li>

            </ul>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 02 · CÓMO FUNCIONA</span>
    </div>

    <!-- cómo funciona -->
    <section class="how-section" id="how-it-works">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// FLUJO</span>
                <h2 class="section-title">Empezar es <span class="text-red">sencillo</span></h2>
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
                    <p class="step-desc">Matchmaker, lineups, rutinas o composición según lo que necesites.</p>
                </li>
                <li class="step-card reveal">
                    <span class="step-number">03</span>
                    <h3 class="step-title">Mejora</h3>
                    <p class="step-desc">Entrena, conecta con jugadores y gana más partidas.</p>
                </li>
            </ol>
        </div>
    </section>

    <?php if (!$logeado): ?>
        <section class="cta-banner">
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>
            <div class="container cta-banner-inner">
                <div class="cta-banner-text">
                    <span class="eyebrow">// ÚNETE</span>
                    <h2 class="cta-banner-title">¿Listo para subir de rango?</h2>
                    <p class="cta-banner-desc">Crea tu perfil y desbloquea las cuatro herramientas completas.</p>
                </div>
                <div class="cta-banner-actions">
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">Crear cuenta gratis</a>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>
