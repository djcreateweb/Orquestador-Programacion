<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

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
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

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
                    <span class="hero-stat-value"><?php echo count($amigos); ?></span>
                    <span class="hero-stat-label">Amigos</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <?php if(!empty($message)): ?>
                <p class="auth-message" data-toast="info"><?php echo htmlspecialchars($message); ?></p>
            <?php endif; ?>

            <?php if(empty($amigos)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Tu lista de amigos está vacía</h3>
                    <p class="empty-desc">
                        Invita a otros jugadores desde el
                        <a href="index.php?controlador=matchmaker&amp;action=home">matchmaker</a>
                        o acepta invitaciones pendientes desde
                        <a href="index.php?controlador=amistad&amp;action=home">Solicitudes</a>.
                    </p>
                </div>
            <?php else: ?>
                <div class="amistad-grid">
                    <?php foreach($amigos as $a): ?>
                        <?php $st = fake_player_stats($a['username'], $a['region']); ?>
                        <article class="amistad-card tilt-card is-friend reveal">
                            <div class="amistad-card-head">
                                <div class="amistad-avatar"><?php echo htmlspecialchars(strtoupper(substr($a['username'], 0, 2))); ?></div>
                                <div class="amistad-card-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$a['usuario_id']; ?>" class="amistad-name">
                                        <?php echo htmlspecialchars($a['username']); ?>
                                    </a>
                                    <p class="amistad-meta">
                                        <span><?php echo htmlspecialchars($a['rango']); ?></span> ·
                                        <span><?php echo htmlspecialchars($a['region']); ?></span>
                                    </p>
                                </div>
                                <span class="amistad-status amigo">✓ Amigo</span>
                            </div>

                            <ul class="amistad-card-stats">
                                <li><strong><?php echo $st['kd']; ?></strong><span class="tip" data-tip="Kills / Deaths · bajas por muerte. Mayor que 1.0 es positivo."><abbr title="Kills / Deaths">K/D</abbr></span></li>
                                <li><strong><?php echo $st['wr']; ?>%</strong><span class="tip" data-tip="Porcentaje de partidas ganadas.">Winrate</span></li>
                                <li><strong><?php echo $st['hs']; ?>%</strong><span class="tip" data-tip="Headshot %: porcentaje de balas que impactan en la cabeza."><abbr title="Headshot %">HS</abbr></span></li>
                            </ul>

                            <div class="amistad-card-actions">
                                <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$a['usuario_id']; ?>" class="btn-primary btn-small">Ver perfil</a>

                                <a href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo (int)$a['usuario_id']; ?>" class="btn-ghost btn-small">Mensaje</a>

                                <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post"
                                      data-confirm="¿Eliminar a <?php echo htmlspecialchars(addslashes($a['username'])); ?> de tus amigos?">
                                    <?php echo csrf_field(); ?>
                                    <input type="hidden" name="id" value="<?php echo (int)$a['amistad_id']; ?>">
                                    <input type="hidden" name="redirect" value="index.php?controlador=amistad&action=amigos">
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
