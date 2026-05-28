<?php require_once("view/menu.php"); ?>

<?php
// convierte url de youtube a embed
function youtube_embed($url){
    preg_match('/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/', $url, $m);
    return isset($m[1]) ? 'https://www.youtube.com/embed/' . $m[1] : '';
}
?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Entrenamiento</li>
            </ol>
        </div>
    </nav>

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
                    <span class="rank-badge rank-<?php echo strtolower($rango); ?>"><?php echo htmlspecialchars($rango); ?></span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Categorías activas</span>
                    <span class="progress-value"><?php echo count($cat_seleccionadas); ?></span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Atajo</span>
                    <a href="index.php?controlador=team&amp;action=home" class="link-arrow">Composición por mapa →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- selector de rango y categorías -->
    <section class="routine-section" id="videos-rango">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// VIDEOS · POR RANGO</span>
                <h2 class="section-title">Videos para tu <span class="text-red">rango</span></h2>
                <p class="section-subtitle">Elige rango y áreas a mejorar, luego pulsa Buscar para ver los videos.</p>
            </header>

            <form class="lineup-form" action="index.php#videos-rango" method="get">
                <input type="hidden" name="controlador" value="training">
                <input type="hidden" name="action" value="home">
                <div class="lineup-filters">
                    <div>
                        <label class="filter-label" for="rango">Rango</label>
                        <select class="filter-select rank-select rank-<?php echo strtolower($rango); ?>" id="rango" name="rango">
                            <?php foreach ($rangos as $r): ?>
                                <option value="<?php echo htmlspecialchars($r); ?>"
                                        class="rank-<?php echo strtolower($r); ?>"
                                        <?php if ($rango === $r) echo 'selected'; ?>>
                                    <?php echo htmlspecialchars($r); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="filter-group-checks">
                        <span class="filter-label">¿Qué quieres mejorar?</span>
                        <div class="cat-dropdown" data-cat-dropdown>
                            <button type="button" class="cat-dropdown-toggle" aria-haspopup="listbox" aria-expanded="false">
                                <span class="cat-dropdown-summary">Selecciona categorías</span>
                                <span class="cat-dropdown-caret" aria-hidden="true">▾</span>
                            </button>
                            <div class="cat-dropdown-panel" role="group" aria-label="Categorías a mejorar">
                                <?php foreach ($categorias as $key => $label): ?>
                                    <label class="cat-dropdown-option">
                                        <input type="checkbox" name="categorias[]"
                                               value="<?php echo htmlspecialchars($key); ?>"
                                               data-cat="<?php echo htmlspecialchars($key); ?>"
                                               <?php if (in_array($key, $cat_seleccionadas, true)) echo 'checked'; ?>>
                                        <span class="cat-dropdown-check" aria-hidden="true"></span>
                                        <span class="cat-dropdown-label"><?php echo htmlspecialchars($label); ?></span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button type="submit" class="btn-primary">Buscar videos</button>
                    </div>
                </div>
            </form>
        </div>
    </section>

    <!-- tarjetas de video -->
    <section class="routine-section">
        <div class="container">

            <?php if (!empty($cat_seleccionadas)): ?>
                <ol class="lineups-grid" id="videos-grid">
                    <?php foreach ($cat_seleccionadas as $key): ?>
                        <?php
                            $label = $categorias[$key] ?? $key;
                            $v     = $videos[$key] ?? null;
                        ?>
                        <li class="lineup-card tilt-card routine-card video-card" data-cat="<?php echo htmlspecialchars($key); ?>">
                            <span class="corner corner-tl" aria-hidden="true"></span>
                            <span class="corner corner-br" aria-hidden="true"></span>

                            <?php if ($v && youtube_embed($v['video_url'])): ?>
                                <figure class="lineup-thumb">
                                    <iframe src="<?php echo htmlspecialchars(youtube_embed($v['video_url'])); ?>"
                                            title="<?php echo htmlspecialchars($v['titulo']); ?>"
                                            frameborder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowfullscreen loading="lazy"
                                            class="lineup-thumb-img"></iframe>
                                </figure>
                            <?php endif; ?>

                            <div class="lineup-card-body">
                                <div class="lineup-card-top">
                                    <span class="lineup-agent-tag rank-badge rank-<?php echo strtolower($rango); ?>">
                                        <?php echo htmlspecialchars($rango); ?>
                                    </span>
                                    <span class="lineup-map-tag"><?php echo htmlspecialchars($label); ?></span>
                                </div>

                                <?php if ($v): ?>
                                    <h3 class="lineup-title"><?php echo htmlspecialchars($v['titulo']); ?></h3>
                                    <p class="lineup-desc"><?php echo nl2br(htmlspecialchars($v['descripcion'])); ?></p>
                                    <footer class="lineup-card-footer">
                                        <ul class="lineup-stats">
                                            <li>Rango <span><?php echo htmlspecialchars($v['rango']); ?></span></li>
                                        </ul>
                                        <div class="lineup-actions">
                                            <a href="<?php echo htmlspecialchars($v['video_url']); ?>"
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
                <div class="empty-state" id="videos-empty">
                    <div class="empty-icon" aria-hidden="true">▶</div>
                    <h3 class="empty-title">Sin resultados</h3>
                    <p class="empty-desc">Selecciona rango y áreas a mejorar y pulsa <strong>Buscar</strong>.</p>
                </div>
            <?php endif; ?>

        </div>
    </section>

</main>
