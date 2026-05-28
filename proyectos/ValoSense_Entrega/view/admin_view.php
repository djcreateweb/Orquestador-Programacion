<?php require_once("view/menu.php"); ?>

<?php
function youtube_embed_admin($url){
    preg_match('/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/', $url, $m);
    return isset($m[1]) ? 'https://www.youtube.com/embed/' . $m[1] : '';
}
?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Administración</li>
            </ol>
        </div>
    </nav>

    <?php if ($seccion == "lineups"): ?>

    <section class="hero hero-lineups">
        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · MODERACIÓN</span>
            <h1 class="hero-title">Moderación de <span class="text-red">lineups</span></h1>
            <p class="hero-subtitle">Aprueba o rechaza solo los envíos hechos por usuarios.</p>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($pendientes); ?></span>
                    <span class="hero-stat-label">Pendientes</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($aprobados); ?></span>
                    <span class="hero-stat-label">Enviados por usuarios</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <div class="results-bar">
                <h2 class="section-title results-title">
                    Pendientes de aprobación
                    <span class="badge <?php echo count($pendientes) > 0 ? 'badge--glow' : 'badge--muted'; ?>"><?php echo count($pendientes); ?></span>
                </h2>
            </div>

            <?php if (empty($pendientes)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">✓</div>
                    <h3 class="empty-title">¡Bandeja vacía!</h3>
                    <p class="empty-desc">No hay lineups esperando revisión.</p>
                </div>
            <?php else: ?>
                <?php foreach ($pendientes as $l): ?>
                    <article class="admin-card reveal">
                        <div class="admin-card-meta">
                            <span class="agent-tag"><?php echo htmlspecialchars($l['agente']); ?></span>
                            <span class="lineup-map-tag"><?php echo htmlspecialchars($l['mapa']); ?></span>
                            <?php if (!empty($l['autor'])): ?>
                                <span>Por <?php echo htmlspecialchars($l['autor']); ?></span>
                            <?php endif; ?>
                        </div>
                        <h3 class="lineup-title"><?php echo htmlspecialchars($l['titulo']); ?></h3>
                        <?php if (youtube_embed_admin($l['video_url'])): ?>
                            <figure class="lineup-thumb">
                                <iframe src="<?php echo htmlspecialchars(youtube_embed_admin($l['video_url'])); ?>"
                                        frameborder="0" allowfullscreen loading="lazy"
                                        class="lineup-thumb-img"></iframe>
                            </figure>
                        <?php endif; ?>
                        <p class="lineup-desc"><?php echo nl2br(htmlspecialchars($l['descripcion'])); ?></p>
                        <div class="admin-card-actions">
                            <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
                                <button type="submit" name="aprobar" value="1" class="btn-primary btn-small">Aprobar</button>
                            </form>
                            <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
                                <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Rechazar</button>
                            </form>
                        </div>
                    </article>
                <?php endforeach; ?>
            <?php endif; ?>

            <div class="results-bar spaced-top-xl">
                <h2 class="section-title results-title">
                    Enviados por usuarios
                    <span class="badge badge--muted"><?php echo count($aprobados); ?></span>
                </h2>
            </div>

            <?php if (empty($aprobados)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin envíos publicados</h3>
                    <p class="empty-desc">Aún no se ha aprobado ningún lineup enviado por usuarios.</p>
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
                            <?php foreach ($aprobados as $l): ?>
                                <tr>
                                    <td><?php echo $l['id']; ?></td>
                                    <td><?php echo htmlspecialchars($l['titulo']); ?></td>
                                    <td><?php echo htmlspecialchars($l['agente']); ?></td>
                                    <td><?php echo htmlspecialchars($l['mapa']); ?></td>
                                    <td><?php echo htmlspecialchars($l['autor'] ?? ''); ?></td>
                                    <td>
                                        <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                            <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
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

    <?php else: ?>

    <section class="hero">
        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · USUARIOS</span>
            <h1 class="hero-title">Gestión de <span class="text-red">usuarios</span></h1>
            <p class="hero-subtitle">Revisa y elimina cuentas registradas.</p>
            <?php
                $total = isset($array) ? count($array) : 0;
                $admins = 0;
                if (isset($array)) {
                    foreach ($array as $u) { if (!empty($u['es_admin'])) $admins++; }
                }
            ?>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo $total; ?></span>
                    <span class="hero-stat-label">Usuarios</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo $admins; ?></span>
                    <span class="hero-stat-label">Administradores</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo max(0, $total - $admins); ?></span>
                    <span class="hero-stat-label">Jugadores</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <div class="results-bar">
                <h2 class="section-title results-title">
                    Listado de usuarios
                    <span class="badge badge--muted"><?php echo $total; ?></span>
                </h2>
            </div>

            <?php if (empty($array)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin usuarios registrados</h3>
                    <p class="empty-desc">Todavía no se ha registrado ningún jugador.</p>
                </div>
            <?php else: ?>
                <div class="admin-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rango</th>
                                <th>Región</th>
                                <th>Rol</th>
                                <th>Alta</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($array as $registro): ?>
                                <tr>
                                    <td><?php echo $registro['id']; ?></td>
                                    <td><?php echo htmlspecialchars($registro['username'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['email'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['rango'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['region'] ?? ''); ?></td>
                                    <td><?php echo !empty($registro['es_admin']) ? 'Administrador' : 'Usuario'; ?></td>
                                    <td><?php echo htmlspecialchars($registro['creado_en'] ?? ''); ?></td>
                                    <td>
                                        <?php if ($registro['id'] == $_SESSION['usuario']['id']): ?>
                                            <span class="auth-message">Tu cuenta</span>
                                        <?php else: ?>
                                            <form class="inline-form" action="index.php?controlador=admin&amp;action=usuarios" method="post">
                                                <input type="hidden" name="id" value="<?php echo $registro['id']; ?>">
                                                <input type="hidden" name="es_admin" value="<?php echo !empty($registro['es_admin']) ? 0 : 1; ?>">
                                                <button type="submit" name="cambiar_rol" value="1" class="btn-ghost btn-small">
                                                    <?php echo !empty($registro['es_admin']) ? 'Quitar admin' : 'Hacer admin'; ?>
                                                </button>
                                            </form>
                                            <form class="inline-form" action="index.php?controlador=admin&amp;action=usuarios" method="post">
                                                <input type="hidden" name="id" value="<?php echo $registro['id']; ?>">
                                                <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Borrar</button>
                                            </form>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

        </div>
    </section>

    <?php endif; ?>

</main>
