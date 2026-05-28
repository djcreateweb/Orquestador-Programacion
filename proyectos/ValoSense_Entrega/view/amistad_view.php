<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Solicitudes</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero-compact">
        <div class="container hero-content">
            <span class="eyebrow">// SOCIAL · SOLICITUDES</span>
            <h1 class="hero-title">Tus <span class="text-red">invitaciones</span> de amistad</h1>
            <p class="hero-subtitle">Acepta o rechaza las solicitudes recibidas y gestiona las que has enviado.
                Tus amigos confirmados están en <a href="index.php?controlador=amistad&amp;action=amigos" class="hero-inline-link">Amigos</a>.</p>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($recibidas); ?></span>
                    <span class="hero-stat-label">Recibidas</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($enviadas); ?></span>
                    <span class="hero-stat-label">Enviadas</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <!-- invitar por username -->
            <section class="results-section invitar-form-section">
                <div class="invitar-form-wrap">
                    <header class="section-head">
                        <span class="eyebrow">// INVITAR</span>
                        <h2 class="section-title">Añade un <span class="text-red">amigo</span> por nombre de usuario</h2>
                    </header>
                    <form class="search-form" action="index.php?controlador=amistad&amp;action=invitar" method="post">
                        <div class="filter-group form-span-full">
                            <label class="filter-label" for="target_username">Nombre del jugador</label>
                            <input type="text" id="target_username" name="target_username" class="form-input"
                                   placeholder="Ej: gold_standard, silver_fox…" required autocomplete="off">
                        </div>
                        <div class="filter-actions">
                            <button type="submit" class="btn-primary btn-small">Enviar invitación</button>
                        </div>
                    </form>
                </div>
            </section>

            <!-- solicitudes recibidas -->
            <div class="results-bar">
                <h2 class="section-title results-title">
                    Solicitudes recibidas
                    <span class="badge <?php echo count($recibidas) > 0 ? 'badge--glow' : 'badge--muted'; ?>"><?php echo count($recibidas); ?></span>
                </h2>
            </div>

            <?php if (empty($recibidas)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin solicitudes pendientes</h3>
                    <p class="empty-desc">Cuando alguien te invite como amigo aparecerá aquí.</p>
                </div>
            <?php else: ?>
                <div class="amistad-grid">
                    <?php foreach ($recibidas as $r): ?>
                        <article class="amistad-card tilt-card reveal">
                            <div class="amistad-card-head">
                                <div class="amistad-avatar"><?php echo htmlspecialchars(strtoupper(substr($r['username'], 0, 2))); ?></div>
                                <div class="amistad-card-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $r['usuario_id']; ?>" class="amistad-name">
                                        <?php echo htmlspecialchars($r['username']); ?>
                                    </a>
                                    <p class="amistad-meta">
                                        <span><?php echo htmlspecialchars($r['rango']); ?></span> ·
                                        <span><?php echo htmlspecialchars($r['region']); ?></span>
                                    </p>
                                </div>
                            </div>
                            <div class="amistad-card-actions">
                                <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $r['usuario_id']; ?>" class="btn-ghost btn-small">Ver perfil</a>
                                <form class="inline-form" action="index.php?controlador=amistad&amp;action=aceptar" method="post">
                                    <input type="hidden" name="id" value="<?php echo $r['amistad_id']; ?>">
                                    <button type="submit" class="btn-primary btn-small">Aceptar</button>
                                </form>
                                <form class="inline-form" action="index.php?controlador=amistad&amp;action=rechazar" method="post">
                                    <input type="hidden" name="id" value="<?php echo $r['amistad_id']; ?>">
                                    <button type="submit" class="btn-secondary btn-small">Rechazar</button>
                                </form>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <!-- enviadas -->
            <div class="results-bar spaced-top-xl">
                <h2 class="section-title results-title">
                    Enviadas pendientes
                    <span class="badge badge--muted"><?php echo count($enviadas); ?></span>
                </h2>
            </div>

            <?php if (empty($enviadas)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◌</div>
                    <h3 class="empty-title">No tienes invitaciones enviadas</h3>
                    <p class="empty-desc">Ve al matchmaker para invitar a otros jugadores.</p>
                </div>
            <?php else: ?>
                <div class="amistad-grid">
                    <?php foreach ($enviadas as $e): ?>
                        <article class="amistad-card tilt-card reveal">
                            <div class="amistad-card-head">
                                <div class="amistad-avatar"><?php echo htmlspecialchars(strtoupper(substr($e['username'], 0, 2))); ?></div>
                                <div class="amistad-card-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $e['usuario_id']; ?>" class="amistad-name">
                                        <?php echo htmlspecialchars($e['username']); ?>
                                    </a>
                                    <p class="amistad-meta">
                                        <span><?php echo htmlspecialchars($e['rango']); ?></span> ·
                                        <span><?php echo htmlspecialchars($e['region']); ?></span>
                                    </p>
                                </div>
                                <span class="amistad-status pendiente">Pendiente</span>
                            </div>
                            <div class="amistad-card-actions">
                                <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $e['usuario_id']; ?>" class="btn-ghost btn-small">Ver perfil</a>
                                <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post">
                                    <input type="hidden" name="id" value="<?php echo $e['amistad_id']; ?>">
                                    <button type="submit" class="btn-secondary btn-small">Cancelar</button>
                                </form>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

        </div>
    </section>

</main>
