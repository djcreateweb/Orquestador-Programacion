<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Lineups</li>
            </ol>
        </div>
    </nav>

    <!-- Hero de lineups -->
    <section class="hero hero-lineups">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// LIBRARY · MÓDULO 02</span>
            <h1 class="hero-title">Biblioteca de <span class="text-red">lineups</span></h1>
            <p class="hero-subtitle">Smokes, flashes y mollies publicados por la comunidad. Filtra por agente y mapa.</p>

            <div class="hero-cta-row">
                <?php if(isset($_SESSION["usuario"])): ?>
                    <a href="index.php?controlador=lineup&amp;action=enviar" class="btn-primary btn-large">Enviar mi lineup</a>
                <?php else: ?>
                    <a href="index.php?controlador=usuario&amp;action=home" class="btn-primary btn-large">Inicia sesión para enviar</a>
                <?php endif; ?>
                <a href="#agent-picker" class="btn-ghost btn-large">Explorar ahora</a>
            </div>

            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo isset($total_lineups) ? (int)$total_lineups : 0; ?></span>
                    <span class="hero-stat-label">Lineups totales</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo isset($mapas) ? count($mapas) : 0; ?></span>
                    <span class="hero-stat-label">Mapas</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo isset($agentes) ? count($agentes) : 0; ?></span>
                    <span class="hero-stat-label">Agentes</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value">92%</span>
                    <span class="hero-stat-label">Verificados</span>
                </li>
            </ul>
        </div>
    </section>

    <!-- Chips de filtros activos (solo si hay alguno) -->
    <?php
        $agente_activo_nombre = '';
        $agente_activo_rol    = '';
        if(!empty($_GET['agente_id'])){
            foreach($agentes as $ag){
                if((int)$ag['id'] === (int)$_GET['agente_id']){
                    $agente_activo_nombre = $ag['nombre'];
                    $agente_activo_rol    = $ag['rol'] ?? '';
                    break;
                }
            }
        }
        $mapa_activo = $_GET['mapa'] ?? '';
    ?>
    <?php if($agente_activo_nombre !== '' || $mapa_activo !== ''): ?>
        <section class="lineup-search" id="search">
            <div class="container">
                <div class="chip-row" aria-label="Filtros activos">
                    <?php if($agente_activo_nombre !== ''): ?>
                        <a href="index.php?controlador=lineup&amp;action=home<?php echo $mapa_activo ? '&amp;mapa=' . urlencode($mapa_activo) : ''; ?>" class="chip" data-keep-scroll>
                            Agente: <?php echo htmlspecialchars($agente_activo_nombre); ?>
                            <span class="chip-close" aria-hidden="true">×</span>
                        </a>
                    <?php endif; ?>
                    <?php if($mapa_activo !== ''): ?>
                        <a href="index.php?controlador=lineup&amp;action=home<?php echo !empty($_GET['agente_id']) ? '&amp;agente_id=' . urlencode($_GET['agente_id']) : ''; ?>" class="chip" data-keep-scroll>
                            Mapa: <?php echo htmlspecialchars($mapa_activo); ?>
                            <span class="chip-close" aria-hidden="true">×</span>
                        </a>
                    <?php endif; ?>
                    <a href="index.php?controlador=lineup&amp;action=home" class="chip" data-keep-scroll>
                        Limpiar todo
                        <span class="chip-close" aria-hidden="true">×</span>
                    </a>
                </div>
            </div>
        </section>
    <?php endif; ?>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 01 · MAPA</span>
    </div>

    <!-- Acceso rápido por mapa -->
    <section class="map-quick-access" id="filtros">
        <div class="container">
            <header class="section-head section-head-row">
                <div>
                    <span class="eyebrow">// ACCESO RÁPIDO</span>
                    <h2 class="section-title">Explora por <span class="text-red">mapa</span></h2>
                </div>
                <a href="index.php?controlador=lineup&amp;action=home" class="link-arrow" data-keep-scroll>Ver todos →</a>
            </header>

            <?php
                // Conservar el filtro de agente al cambiar de mapa (y viceversa)
                $agente_actual_id = $_GET['agente_id'] ?? '';
                $mapa_actual      = $_GET['mapa'] ?? '';
                $qs_agente = $agente_actual_id !== '' ? '&amp;agente_id=' . urlencode($agente_actual_id) : '';
                $qs_mapa   = $mapa_actual      !== '' ? '&amp;mapa=' . urlencode($mapa_actual)        : '';
            ?>

            <ul class="lineup-maps-grid">
                <?php foreach($mapas as $m):
                    $activo_m = $mapa_actual === $m;
                ?>
                    <li>
                        <a href="index.php?controlador=lineup&amp;action=home&amp;mapa=<?php echo urlencode($m); ?><?php echo $qs_agente; ?>#agent-picker"
                           class="lineup-map-chip<?php echo $activo_m ? ' is-active' : ''; ?>">
                            <img src="imagenes/mapas/<?php echo htmlspecialchars($m); ?>.png"
                                 alt="<?php echo htmlspecialchars($m); ?>"
                                 class="lineup-map-chip-img" loading="lazy">
                            <span class="lineup-map-chip-overlay" aria-hidden="true"></span>
                            <span class="lineup-map-chip-name"><?php echo htmlspecialchars($m); ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 02 · AGENTE</span>
    </div>

    <!-- Acceso rápido por agente (mismo estilo que los chips de mapa) -->
    <section class="map-quick-access" id="agent-picker">
        <div class="container">
            <header class="section-head section-head-row">
                <div>
                    <span class="eyebrow">// ACCESO RÁPIDO</span>
                    <h2 class="section-title">Selecciona <span class="text-red">agente</span></h2>
                </div>
                <a href="index.php?controlador=lineup&amp;action=home<?php echo $qs_mapa; ?>" class="link-arrow" data-keep-scroll>Ver todos →</a>
            </header>

            <?php
                // Píldoras de rol: la del agente seleccionado se ilumina (is-covered).
                // Mismo look que en team_view.php para mantener la coherencia visual.
                $roles_pills = [
                    'Duelist'    => 'Duelista',
                    'Initiator'  => 'Iniciador',
                    'Controller' => 'Controlador',
                    'Sentinel'   => 'Centinela',
                ];
                $roles_pills_tip = [
                    'Duelist'    => 'Entry fragger: entra primero a ganar espacios.',
                    'Initiator'  => 'Abre sites con info, flashes y stuns.',
                    'Controller' => 'Bloquea visibilidad con humos y divide el mapa.',
                    'Sentinel'   => 'Defiende flancos, da info y ancla los sites.',
                ];
            ?>
            <ul class="role-pills role-pills-lineup" aria-label="Rol del agente seleccionado">
                <?php foreach($roles_pills as $rol_en => $rol_es):
                    $activo = ($agente_activo_rol === $rol_en);
                ?>
                    <li class="role-pill tip<?php echo $activo ? ' is-covered' : ''; ?>"
                        data-role="<?php echo $rol_en; ?>"
                        data-tip="<?php echo htmlspecialchars($roles_pills_tip[$rol_en]); ?>">
                        <?php echo htmlspecialchars($rol_es); ?>
                    </li>
                <?php endforeach; ?>
            </ul>

            <?php
                // Agrupamos agentes por rol en el orden táctico clásico del juego.
                $roles_orden = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
                $por_rol = array_fill_keys($roles_orden, []);
                foreach ($agentes as $ag) {
                    $r = $ag['rol'] ?? '';
                    if (isset($por_rol[$r])) $por_rol[$r][] = $ag;
                }
            ?>
            <div class="lineup-agents-rows">
                <?php foreach ($roles_orden as $rol):
                    $lista = $por_rol[$rol];
                    if (empty($lista)) continue;
                    $rol_lc = strtolower($rol);
                ?>
                    <section class="lineup-agents-row role-<?php echo htmlspecialchars($rol_lc); ?>">
                        <header class="lineup-agents-row-head">
                            <span class="lineup-agents-row-rol"><?php echo htmlspecialchars($rol); ?></span>
                            <span class="lineup-agents-row-count"><?php echo count($lista); ?></span>
                        </header>
                        <ul class="lineup-agents-row-list">
                            <?php foreach ($lista as $a):
                                $activo = (string)($agente_actual_id ?? '') === (string)$a['id'];
                            ?>
                                <li>
                                    <a href="index.php?controlador=lineup&amp;action=home&amp;agente_id=<?php echo (int)$a['id']; ?><?php echo $qs_mapa; ?>#resultados"
                                       class="lineup-agent-chip role-<?php echo htmlspecialchars($rol_lc); ?><?php echo $activo ? ' is-active' : ''; ?>">
                                        <img src="imagenes/agentes/<?php echo htmlspecialchars($a['nombre']); ?>.png"
                                             alt="<?php echo htmlspecialchars($a['nombre']); ?>"
                                             class="lineup-agent-chip-img" loading="lazy">
                                        <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($a['nombre']); ?></span>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </section>
                <?php endforeach; ?>
            </div>

            <!-- CTA: al pulsar, baja suavemente a los resultados -->
            <div class="lineup-cta-row">
                <a href="#resultados" class="btn-primary btn-large btn-magnetic lineup-go-results">
                    Ver lineups
                    <?php if(isset($lineups) && count($lineups) > 0): ?>
                        <span class="lineup-go-count"><?php echo (int)count($lineups); ?></span>
                    <?php endif; ?>
                </a>
            </div>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 03 · RESULTADOS</span>
    </div>

    <!-- Resultados de lineups -->
    <section class="lineups-results" id="resultados">
        <div class="container">

            <?php if(empty($lineups)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">No hay lineups con esos filtros</h3>
                    <p class="empty-desc">Prueba a ampliar la búsqueda o cambiar de mapa.</p>
                </div>
            <?php else: ?>
                <div class="results-bar">
                    <h2 class="section-title results-title">
                        <?php if(!empty($sin_filtros)): ?>
                            Selección destacada <span class="results-count" id="lineup-search-count"><?php echo count($lineups); ?></span>
                        <?php else: ?>
                            Resultados <span class="results-count" id="lineup-search-count"><?php echo count($lineups); ?></span>
                        <?php endif; ?>
                    </h2>
                    <?php if(!empty($sin_filtros)): ?>
                        <p class="results-hint">Filtra por mapa o agente arriba para ver el lineup específico.</p>
                    <?php endif; ?>
                </div>

                <div class="lineups-grid reveal-stagger">
                    <?php foreach($lineups as $l): ?>
                        <article class="lineup-card tilt-card reveal">
                            <span class="corner corner-tl" aria-hidden="true"></span>
                            <span class="corner corner-br" aria-hidden="true"></span>

                            <figure class="lineup-thumb">
                                <iframe src="<?php echo htmlspecialchars(youtube_embed($l['video_url'])); ?>"
                                        title="<?php echo htmlspecialchars($l['titulo']); ?>"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen
                                        loading="lazy"
                                        class="lineup-thumb-img"></iframe>
                            </figure>

                            <div class="lineup-card-body">
                                <div class="lineup-card-top">
                                    <span class="lineup-agent-tag"><?php echo htmlspecialchars($l['agente']); ?></span>
                                    <span class="lineup-map-tag"><?php echo htmlspecialchars($l['mapa']); ?></span>
                                </div>

                                <h3 class="lineup-title"><?php echo htmlspecialchars($l['titulo']); ?></h3>
                                <p class="lineup-desc"><?php echo nl2br(htmlspecialchars($l['descripcion'])); ?></p>

                                <footer class="lineup-card-footer">
                                    <ul class="lineup-stats">
                                        <?php if(!empty($l['autor'])): ?>
                                            <li>Por <?php echo htmlspecialchars($l['autor']); ?></li>
                                        <?php endif; ?>
                                    </ul>
                                    <?php $__url = safe_http_url($l['video_url'] ?? ''); ?>
                                    <div class="lineup-actions">
                                        <button type="button" class="btn-copy" data-copy="<?php echo htmlspecialchars($__url); ?>" title="Copiar enlace">Copiar</button>
                                        <a href="<?php echo htmlspecialchars($__url); ?>" class="btn-primary btn-small" target="_blank" rel="noopener noreferrer">Abrir video</a>
                                    </div>
                                </footer>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

        </div>
    </section>

    <!-- Banner de envío -->
    <?php if(isset($_SESSION["usuario"])): ?>
        <section class="cta-banner">
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>
            <div class="container cta-banner-inner">
                <div class="cta-banner-text">
                    <span class="eyebrow">// COMPARTE</span>
                    <h2 class="cta-banner-title">¿Tienes un lineup secreto?</h2>
                    <p class="cta-banner-desc">Súbelo a la biblioteca y ayuda al resto de jugadores a mejorar su juego táctico.</p>
                </div>
                <div class="cta-banner-actions">
                    <a href="index.php?controlador=lineup&amp;action=enviar" class="btn-primary btn-large">Enviar lineup</a>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>
