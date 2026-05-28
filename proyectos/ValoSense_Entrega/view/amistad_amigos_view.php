<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Amigos</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero-compact">
        <div class="container hero-content">
            <span class="eyebrow">// SOCIAL · AMIGOS</span>
            <h1 class="hero-title">Tus <span class="text-red">amigos</span> confirmados</h1>
            <p class="hero-subtitle">
                Jugadores con los que ya conectaste. Pulsa en uno para ver su perfil.
                ¿Tienes solicitudes pendientes? Míralas en
                <a href="index.php?controlador=amistad&amp;action=home" class="hero-inline-link">Solicitudes</a>.
            </p>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($array); ?></span>
                    <span class="hero-stat-label">Amigos</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <?php if (empty($array)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Tu lista de amigos está vacía</h3>
                    <p class="empty-desc">
                        Invita a otros jugadores desde el
                        <a href="index.php?controlador=matchmaker&amp;action=home">matchmaker</a>
                        o acepta invitaciones desde
                        <a href="index.php?controlador=amistad&amp;action=home">Solicitudes</a>.
                    </p>
                </div>
            <?php else: ?>
                <div class="amistad-grid">
                    <?php foreach ($array as $a): ?>
                        <article class="amistad-card tilt-card is-friend reveal">
                            <div class="amistad-card-head">
                                <div class="amistad-avatar"><?php echo htmlspecialchars(strtoupper(substr($a['username'], 0, 2))); ?></div>
                                <div class="amistad-card-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $a['usuario_id']; ?>" class="amistad-name">
                                        <?php echo htmlspecialchars($a['username']); ?>
                                    </a>
                                    <p class="amistad-meta">
                                        <span><?php echo htmlspecialchars($a['rango']); ?></span> ·
                                        <span><?php echo htmlspecialchars($a['region']); ?></span>
                                    </p>
                                </div>
                                <span class="amistad-status amigo">✓ Amigo</span>
                            </div>
                            <div class="amistad-card-actions">
                                <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $a['usuario_id']; ?>" class="btn-primary btn-small">Ver perfil</a>
                                <a href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo $a['usuario_id']; ?>" class="btn-ghost btn-small">Mensaje</a>
                                <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post">
                                    <input type="hidden" name="id" value="<?php echo $a['amistad_id']; ?>">
                                    <button type="submit" class="btn-ghost btn-small">Eliminar</button>
                                </form>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

        </div>
    </section>

</main>
