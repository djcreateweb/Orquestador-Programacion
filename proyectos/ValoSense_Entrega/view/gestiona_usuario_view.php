<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Gestión de usuarios</li>
            </ol>
        </div>
    </nav>

    <section class="hero">
        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · USUARIOS</span>
            <h1 class="hero-title">Gestión de <span class="text-red">usuarios</span></h1>
            <p class="hero-subtitle">Revisa y elimina cuentas registradas.</p>
            <?php
                $total  = isset($array) ? count($array) : 0;
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

            <?php if (isset($message)) echo "<p>$message</p>"; ?>

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
                                            <form class="inline-form" action="index.php?controlador=usuario&amp;action=gestionar" method="post">
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

</main>
