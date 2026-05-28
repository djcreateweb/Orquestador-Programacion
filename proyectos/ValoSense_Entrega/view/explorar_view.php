<?php require_once("view/menu.php"); ?>

<?php $logeado = isset($_SESSION["usuario"]); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Explorar</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero-explorar">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>
        <div class="container hero-content">
            <span class="eyebrow">// CATÁLOGO DE HERRAMIENTAS</span>
            <h1 class="hero-title">Qué ofrece <span class="text-red">ValoSense</span></h1>
            <p class="hero-subtitle">
                Cuatro módulos pensados para jugadores competitivos.
                <?php if (!$logeado): ?>Para usarlos, tendrás que iniciar sesión.<?php endif; ?>
            </p>
            <?php if (!$logeado): ?>
                <div class="hero-cta-row">
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">Crear cuenta gratis</a>
                </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- matchmaker -->
    <section class="tool-section" id="tool-matchmaker">
        <div class="container">
            <header class="tool-section-header">
                <span class="tool-section-number">01</span>
                <div>
                    <span class="eyebrow">// MATCHMAKER</span>
                    <h2 class="tool-section-title">Encuentra tu equipo ideal</h2>
                    <p class="tool-section-subtitle">Matchmaking por rango, región, agentes favoritos y estilo de juego.</p>
                </div>
            </header>
            <div class="tool-section-grid">
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Qué ofrece</h3>
                    <ul class="tool-bullets">
                        <li>Filtra por rango mínimo, máximo y región</li>
                        <li>Selecciona agentes favoritos y rol preferido</li>
                        <li>Lee estadísticas reales: K/D, winrate, HS %</li>
                    </ul>
                </div>
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Cómo se usa</h3>
                    <ol class="tool-steps">
                        <li><span class="tool-step-num">01</span><span class="tool-step-text">Aplica los filtros que definen tu búsqueda</span></li>
                        <li><span class="tool-step-num">02</span><span class="tool-step-text">Revisa las tarjetas de jugadores compatibles</span></li>
                        <li><span class="tool-step-num">03</span><span class="tool-step-text">Envía una invitación directa al jugador que elijas</span></li>
                    </ol>
                </div>
            </div>
            <footer class="tool-section-footer">
                <?php if ($logeado): ?>
                    <div class="tool-actions">
                        <a href="index.php?controlador=matchmaker&amp;action=home" class="btn-primary">Abrir Matchmaker</a>
                    </div>
                <?php else: ?>
                    <p class="tool-access-note tool-locked"><span class="tool-access-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta.</p>
                    <div class="tool-actions">
                        <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary">Iniciar sesión para usar</a>
                    </div>
                <?php endif; ?>
            </footer>
        </div>
    </section>

    <!-- lineups -->
    <section class="tool-section" id="tool-lineup">
        <div class="container">
            <header class="tool-section-header">
                <span class="tool-section-number">02</span>
                <div>
                    <span class="eyebrow">// LINEUPS</span>
                    <h2 class="tool-section-title">Biblioteca de lineups</h2>
                    <p class="tool-section-subtitle">Smokes, flashes y molotovs revisados por la comunidad y moderados por administradores.</p>
                </div>
            </header>
            <div class="tool-section-grid">
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Qué ofrece</h3>
                    <ul class="tool-bullets">
                        <li>Filtra la biblioteca por agente y por mapa</li>
                        <li>Videos de YouTube integrados en cada tarjeta</li>
                        <li>Publica tus propios lineups tras iniciar sesión</li>
                        <li>Todos los lineups pasan revisión antes de publicarse</li>
                    </ul>
                </div>
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Cómo se usa</h3>
                    <ol class="tool-steps">
                        <li><span class="tool-step-num">01</span><span class="tool-step-text">Elige el agente y el mapa que te interese</span></li>
                        <li><span class="tool-step-num">02</span><span class="tool-step-text">Mira el video y lee la descripción táctica</span></li>
                        <li><span class="tool-step-num">03</span><span class="tool-step-text">Si tienes uno nuevo, envíalo para revisión</span></li>
                    </ol>
                </div>
            </div>
            <footer class="tool-section-footer">
                <p class="tool-access-note"><span class="tool-access-icon" aria-hidden="true">ℹ</span> Ver la biblioteca es libre. Para enviar tus propios lineups necesitas cuenta.</p>
                <div class="tool-actions">
                    <a href="index.php?controlador=lineup&amp;action=home" class="btn-ghost">Ver biblioteca</a>
                    <?php if ($logeado): ?>
                        <a href="index.php?controlador=lineup&amp;action=enviar" class="btn-primary">Enviar lineup</a>
                    <?php else: ?>
                        <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary">Iniciar sesión para enviar</a>
                    <?php endif; ?>
                </div>
            </footer>
        </div>
    </section>

    <!-- entrenamiento -->
    <section class="tool-section" id="tool-training">
        <div class="container">
            <header class="tool-section-header">
                <span class="tool-section-number">03</span>
                <div>
                    <span class="eyebrow">// ENTRENAMIENTO</span>
                    <h2 class="tool-section-title">Rutinas según tu rango</h2>
                    <p class="tool-section-subtitle">Entrenamientos de aim, movilidad, disparo, utilidad y game sense adaptados a tu nivel.</p>
                </div>
            </header>
            <div class="tool-section-grid">
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Qué ofrece</h3>
                    <ul class="tool-bullets">
                        <li>Catálogo dividido por rango (Iron a Radiant)</li>
                        <li>Cinco categorías: aim, movilidad, disparo, utilidad, game sense</li>
                        <li>Cada rutina incluye descripción y video de referencia</li>
                    </ul>
                </div>
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Cómo se usa</h3>
                    <ol class="tool-steps">
                        <li><span class="tool-step-num">01</span><span class="tool-step-text">Selecciona tu rango actual</span></li>
                        <li><span class="tool-step-num">02</span><span class="tool-step-text">Marca qué aspectos quieres mejorar</span></li>
                        <li><span class="tool-step-num">03</span><span class="tool-step-text">Sigue los videos integrados y repite los ejercicios</span></li>
                    </ol>
                </div>
            </div>
            <footer class="tool-section-footer">
                <?php if ($logeado): ?>
                    <div class="tool-actions">
                        <a href="index.php?controlador=training&amp;action=home" class="btn-primary">Abrir Entrenamiento</a>
                    </div>
                <?php else: ?>
                    <p class="tool-access-note tool-locked"><span class="tool-access-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta.</p>
                    <div class="tool-actions">
                        <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary">Iniciar sesión para usar</a>
                    </div>
                <?php endif; ?>
            </footer>
        </div>
    </section>

    <!-- composición -->
    <section class="tool-section" id="tool-team">
        <div class="container">
            <header class="tool-section-header">
                <span class="tool-section-number">04</span>
                <div>
                    <span class="eyebrow">// COMPOSICIÓN</span>
                    <h2 class="tool-section-title">Recomendador de composición</h2>
                    <p class="tool-section-subtitle">Elige el mapa, marca los agentes que ya tenéis y te decimos cómo completar el equipo.</p>
                </div>
            </header>
            <div class="tool-section-grid">
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Qué ofrece</h3>
                    <ul class="tool-bullets">
                        <li>Recomendaciones por mapa basadas en tier list S / A / B</li>
                        <li>Sugerencias automáticas para los roles que falten</li>
                        <li>Auto-actualiza las recomendaciones al cambiar la selección</li>
                    </ul>
                </div>
                <div class="tool-section-col">
                    <h3 class="tool-col-title">Cómo se usa</h3>
                    <ol class="tool-steps">
                        <li><span class="tool-step-num">01</span><span class="tool-step-text">Selecciona el mapa donde vais a jugar</span></li>
                        <li><span class="tool-step-num">02</span><span class="tool-step-text">Marca hasta 4 agentes que ya tenéis</span></li>
                        <li><span class="tool-step-num">03</span><span class="tool-step-text">Las recomendaciones aparecen al instante</span></li>
                    </ol>
                </div>
            </div>
            <footer class="tool-section-footer">
                <?php if ($logeado): ?>
                    <div class="tool-actions">
                        <a href="index.php?controlador=team&amp;action=home" class="btn-primary">Abrir Composición</a>
                    </div>
                <?php else: ?>
                    <p class="tool-access-note tool-locked"><span class="tool-access-icon" aria-hidden="true">🔒</span> Necesitas una cuenta para usar esta herramienta.</p>
                    <div class="tool-actions">
                        <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary">Iniciar sesión para usar</a>
                    </div>
                <?php endif; ?>
            </footer>
        </div>
    </section>

    <?php if (!$logeado): ?>
        <section class="cta-banner">
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>
            <div class="container cta-banner-inner">
                <div class="cta-banner-text">
                    <span class="eyebrow">// ÚNETE</span>
                    <h2 class="cta-banner-title">Desbloquea las cuatro herramientas</h2>
                    <p class="cta-banner-desc">Crear cuenta tarda 30 segundos.</p>
                </div>
                <div class="cta-banner-actions">
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">Crear cuenta gratis</a>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>
