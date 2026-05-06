<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><a href="index.php?controlador=lineup&amp;action=home">Lineups</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Moderación</li>
            </ol>
        </div>
    </nav>

    <!-- Hero compacto para zona admin -->
    <section class="hero hero-lineups">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · MODERACIÓN</span>
            <h1 class="hero-title">Moderación de <span class="text-red">lineups</span></h1>
            <p class="hero-subtitle">Aprueba o rechaza los envíos pendientes de la comunidad.</p>

            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($pendientes); ?></span>
                    <span class="hero-stat-label">Pendientes</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($aprobados); ?></span>
                    <span class="hero-stat-label">Publicados</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($pendientes) + count($aprobados); ?></span>
                    <span class="hero-stat-label">Total envíos</span>
                </li>
            </ul>
        </div>
    </section>

    <!-- Pendientes -->
    <section class="results-section">
        <div class="container">

            <div class="results-bar">
                <h2 class="section-title results-title">
                    Pendientes de aprobación
                    <span class="badge <?php echo count($pendientes) > 0 ? 'badge--glow' : 'badge--muted'; ?>"><?php echo count($pendientes); ?></span>
                </h2>
            </div>

            <?php if(empty($pendientes)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">✓</div>
                    <h3 class="empty-title">¡Bandeja vacía!</h3>
                    <p class="empty-desc">No hay lineups esperando revisión. Buen trabajo.</p>
                </div>
            <?php else: ?>
                <?php foreach($pendientes as $l): ?>
                    <article class="admin-card reveal">
                        <div class="admin-card-meta">
                            <span class="agent-tag"><?php echo htmlspecialchars($l['agente']); ?></span>
                            <span class="lineup-map-tag"><?php echo htmlspecialchars($l['mapa']); ?></span>
                            <?php if(!empty($l['autor'])): ?>
                                <span>Por <?php echo htmlspecialchars($l['autor']); ?></span>
                            <?php endif; ?>
                        </div>

                        <h3 class="lineup-title"><?php echo htmlspecialchars($l['titulo']); ?></h3>

                        <figure class="lineup-thumb">
                            <iframe src="<?php echo htmlspecialchars(youtube_embed($l['video_url'])); ?>"
                                    frameborder="0" allowfullscreen loading="lazy"
                                    class="lineup-thumb-img"></iframe>
                        </figure>

                        <p class="lineup-desc"><?php echo nl2br(htmlspecialchars($l['descripcion'])); ?></p>

                        <div class="admin-card-actions">
                            <form class="inline-form" action="index.php?controlador=lineup&amp;action=gestionar" method="post">
                                <?php echo csrf_field(); ?>
                                <input type="hidden" name="id" value="<?php echo (int)$l['id']; ?>">
                                <button type="submit" name="aprobar" value="1" class="btn-primary btn-small">Aprobar</button>
                            </form>
                            <form class="inline-form" action="index.php?controlador=lineup&amp;action=gestionar" method="post" data-confirm="¿Rechazar este lineup?">
                                <?php echo csrf_field(); ?>
                                <input type="hidden" name="id" value="<?php echo (int)$l['id']; ?>">
                                <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Rechazar</button>
                            </form>
                        </div>
                    </article>
                <?php endforeach; ?>
            <?php endif; ?>

            <!-- Aprobados -->
            <div class="results-bar spaced-top-xl">
                <h2 class="section-title results-title">
                    Publicados
                    <span class="badge badge--muted"><?php echo count($aprobados); ?></span>
                </h2>
            </div>

            <?php if(empty($aprobados)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin lineups publicados</h3>
                    <p class="empty-desc">Aún no se ha aprobado ningún lineup.</p>
                </div>
            <?php else: ?>
                <div class="admin-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Agente</th>
                                <th>Mapa</th>
                                <th>Autor</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($aprobados as $l): ?>
                                <tr>
                                    <td><?php echo $l['id']; ?></td>
                                    <td><?php echo htmlspecialchars($l['titulo']); ?></td>
                                    <td><?php echo htmlspecialchars($l['agente']); ?></td>
                                    <td><?php echo htmlspecialchars($l['mapa']); ?></td>
                                    <td><?php echo htmlspecialchars($l['autor'] ?? ''); ?></td>
                                    <td>
                                        <form class="inline-form" action="index.php?controlador=lineup&amp;action=gestionar" method="post" data-confirm="¿Borrar este lineup publicado?">
                                            <?php echo csrf_field(); ?>
                                            <input type="hidden" name="id" value="<?php echo (int)$l['id']; ?>">
                                            <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Borrar</button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </section>

</main>
