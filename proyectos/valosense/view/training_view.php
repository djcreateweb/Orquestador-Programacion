<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Entrenamiento</li>
            </ol>
        </div>
    </nav>

    <!-- Hero de entrenamiento -->
    <section class="training-hero hero">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// TRAINING · MÓDULO 03</span>
            <h1 class="hero-title">Videos para tu <span class="text-red">rango</span></h1>
            <p class="hero-subtitle">Elige rango y áreas a mejorar. Cada categoría te trae un video curado.</p>

            <div class="user-progress">
                <div class="progress-item">
                    <span class="progress-label">Rango activo</span>
                    <span class="rank-badge rank-<?php echo strtolower($rango); ?>" id="rank-badge-active"><?php echo htmlspecialchars($rango); ?></span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Categorías activas</span>
                    <span class="progress-value" id="cat-count"><?php echo count($cat_seleccionadas); ?></span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Videos visibles</span>
                    <span class="progress-value" id="video-count"><?php echo count($cat_seleccionadas); ?> / 5</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Atajo</span>
                    <a href="index.php?controlador=team&amp;action=home" class="link-arrow">Composición por mapa →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- ============================================================ -->
    <!-- VIDEOS PARA TU RANGO                                          -->
    <!-- - Selector de rango + checkboxes + botón "Buscar videos"      -->
    <!-- - Sin auto-submit: la búsqueda es explícita con el botón       -->
    <!-- - Primera carga sin GET: empty-state informativo               -->
    <!-- - Tras submit: tarjetas alineadas con el patrón lineup-card    -->
    <!-- ============================================================ -->
    <section class="routine-section" id="videos-rango">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// VIDEOS · POR RANGO</span>
                <h2 class="section-title">Videos para tu <span class="text-red">rango</span></h2>
                <p class="section-subtitle">Elige rango y áreas a mejorar, luego pulsa Buscar para ver los videos.</p>
            </header>

            <form class="lineup-form" id="videos-form" action="index.php#videos-rango" method="get">
                <input type="hidden" name="controlador" value="training">
                <input type="hidden" name="action" value="home">

                <div class="lineup-filters">
                    <div>
                        <label class="filter-label" for="rango">Rango</label>
                        <select class="filter-select rank-select rank-<?php echo strtolower($rango); ?>" id="rango" name="rango">
                            <?php foreach($rangos as $r): ?>
                                <option value="<?php echo htmlspecialchars($r); ?>"
                                    class="rank-<?php echo strtolower($r); ?>"
                                    <?php if($rango === $r) echo 'selected'; ?>>
                                    <?php echo htmlspecialchars($r); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="filter-group-checks">
                        <span class="filter-label" id="cat-dropdown-label">¿Qué quieres mejorar?</span>
                        <div class="cat-dropdown" data-cat-dropdown>
                            <button type="button"
                                    class="cat-dropdown-toggle"
                                    aria-haspopup="listbox"
                                    aria-expanded="false"
                                    aria-labelledby="cat-dropdown-label cat-dropdown-summary">
                                <span class="cat-dropdown-summary" id="cat-dropdown-summary">Selecciona categorías</span>
                                <span class="cat-dropdown-caret" aria-hidden="true">▾</span>
                            </button>
                            <div class="cat-dropdown-panel" role="group" aria-label="Categorías a mejorar">
                                <?php foreach($categorias as $key => $label): ?>
                                    <label class="cat-dropdown-option">
                                        <input type="checkbox" name="categorias[]"
                                               value="<?php echo htmlspecialchars($key); ?>"
                                               data-cat="<?php echo htmlspecialchars($key); ?>"
                                               data-label="<?php echo htmlspecialchars($label); ?>"
                                            <?php if(in_array($key, $cat_seleccionadas, true)) echo 'checked'; ?>>
                                        <span class="cat-dropdown-check" aria-hidden="true"></span>
                                        <span class="cat-dropdown-label"><?php echo htmlspecialchars($label); ?></span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Botón de búsqueda explícita -->
                    <div class="filter-actions">
                        <button type="submit" class="btn-primary">Buscar videos</button>
                    </div>
                </div>
            </form>
        </div>
    </section>

    <!-- Tarjetas de video: solo se renderizan las categorías seleccionadas -->
    <section class="routine-section">
        <div class="container">

            <?php if(!empty($cat_seleccionadas)): ?>
                <ol class="lineups-grid" id="videos-grid">
                    <?php $i = 0; foreach($cat_seleccionadas as $key):
                        $label = $categorias[$key] ?? $key;
                        $v     = $videos[$key] ?? null;
                        $i++;
                    ?>
                        <li class="lineup-card tilt-card routine-card video-card"
                            data-cat="<?php echo htmlspecialchars($key); ?>">
                            <span class="corner corner-tl" aria-hidden="true"></span>
                            <span class="corner corner-br" aria-hidden="true"></span>

                            <?php if($v): ?>
                                <!-- Miniatura 16:9 con iframe YouTube -->
                                <figure class="lineup-thumb">
                                    <iframe src="<?php echo htmlspecialchars(youtube_embed($v['video_url'])); ?>"
                                            title="<?php echo htmlspecialchars($v['titulo']); ?>"
                                            frameborder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowfullscreen
                                            loading="lazy"
                                            class="lineup-thumb-img"></iframe>
                                </figure>
                            <?php endif; ?>

                            <div class="lineup-card-body">
                                <!-- Tags: rango + categoría -->
                                <div class="lineup-card-top">
                                    <span class="lineup-agent-tag rank-badge rank-<?php echo strtolower($rango); ?>">
                                        <?php echo htmlspecialchars($rango); ?>
                                    </span>
                                    <span class="lineup-map-tag">
                                        <?php echo htmlspecialchars($label); ?>
                                    </span>
                                </div>

                                <?php if($v): ?>
                                    <!-- Título real del video -->
                                    <h3 class="lineup-title">
                                        <?php echo htmlspecialchars($v['titulo']); ?>
                                    </h3>

                                    <!-- Descripción -->
                                    <p class="lineup-desc">
                                        <?php echo nl2br(htmlspecialchars($v['descripcion'])); ?>
                                    </p>

                                    <!-- Footer con rango + enlace a YouTube -->
                                    <footer class="lineup-card-footer">
                                        <ul class="lineup-stats">
                                            <li>Rango <span><?php echo htmlspecialchars($v['rango']); ?></span></li>
                                        </ul>
                                        <div class="lineup-actions">
                                            <a href="<?php echo htmlspecialchars(safe_http_url($v['video_url'] ?? '')); ?>"
                                               class="btn-primary btn-small"
                                               target="_blank" rel="noopener noreferrer">
                                                Abrir en YouTube
                                            </a>
                                        </div>
                                    </footer>
                                <?php else: ?>
                                    <p class="empty-hint">
                                        Aún no hay video para esta categoría en rango <?php echo htmlspecialchars($rango); ?>.
                                    </p>
                                <?php endif; ?>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ol>

            <?php else: ?>
                <!-- Estado vacío en primera carga o sin categorías seleccionadas -->
                <div class="empty-state" id="videos-empty">
                    <div class="empty-icon" aria-hidden="true">▶</div>
                    <h3 class="empty-title">Sin resultados</h3>
                    <p class="empty-desc">Selecciona rango y áreas a mejorar y pulsa <strong>Buscar</strong>.</p>
                </div>
            <?php endif; ?>

        </div>
    </section>

</main>
