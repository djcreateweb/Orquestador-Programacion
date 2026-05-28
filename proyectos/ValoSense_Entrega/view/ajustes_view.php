<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Ajustes</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero--compact">
        <div class="container hero-content">
            <span class="eyebrow">// CUENTA · AJUSTES</span>
            <h1 class="hero-title hero-title--sm">Tus <span class="text-red">ajustes</span></h1>
            <p class="hero-subtitle">Gestiona tu presencia, contraseña, amigos y cuenta Valorant vinculada.</p>
        </div>
    </section>

    <div class="container">
        <?php if (!empty($message)): ?>
        <div class="auth-aviso <?php echo strpos($message, 'correctamente') !== false ? 'auth-aviso-ok' : 'auth-aviso-error'; ?>">
            <span class="auth-aviso-icono"><?php echo strpos($message, 'correctamente') !== false ? '✓' : '✕'; ?></span>
            <span class="auth-aviso-texto"><?php echo htmlspecialchars($message); ?></span>
        </div>
        <?php endif; ?>
        <div class="ajustes-grid">

            <!-- presencia -->
            <section class="ajustes-card" id="presencia">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// ESTADO</span>
                    <h2 class="section-title">Estado de presencia</h2>
                </header>
                <form id="form-presencia" method="post" action="index.php?controlador=usuario&amp;action=cambiar_presencia">
                    <fieldset class="presence-fieldset">
                        <legend class="sr-only">Elige tu estado de presencia</legend>
                        <div class="presence-options">
                            <div class="presence-option">
                                <input type="radio" id="p-en_linea" name="estado" value="en_linea"
                                    <?php echo ($user['estado_presencia'] ?? '') === 'en_linea' ? 'checked' : ''; ?>>
                                <label for="p-en_linea">
                                    <span class="status-dot status-online" aria-hidden="true"></span>
                                    <span>En linea</span>
                                </label>
                            </div>
                            <div class="presence-option">
                                <input type="radio" id="p-ausente" name="estado" value="ausente"
                                    <?php echo ($user['estado_presencia'] ?? '') === 'ausente' ? 'checked' : ''; ?>>
                                <label for="p-ausente">
                                    <span class="status-dot status-away" aria-hidden="true"></span>
                                    <span>Ausente</span>
                                </label>
                            </div>
                            <div class="presence-option">
                                <input type="radio" id="p-invisible" name="estado" value="invisible"
                                    <?php echo ($user['estado_presencia'] ?? '') === 'invisible' ? 'checked' : ''; ?>>
                                <label for="p-invisible">
                                    <span class="status-dot status-dot--invisible" aria-hidden="true"></span>
                                    <span>Invisible</span>
                                </label>
                            </div>
                        </div>
                    </fieldset>
                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Guardar presencia</button>
                    </div>
                </form>
            </section>

            <!-- datos basicos -->
            <section class="ajustes-card" id="datos">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// PERFIL</span>
                    <h2 class="section-title">Datos basicos</h2>
                </header>
                <form id="form-datos" method="post" action="index.php?controlador=usuario&amp;action=editar_datos">
                    <div class="ajustes-form-grid">
                        <div class="form-group">
                            <label class="filter-label" for="username">Nombre de usuario</label>
                            <input type="text" id="username" name="username" class="form-input"
                                   value="<?php echo htmlspecialchars($user['username'] ?? ''); ?>"
                                   maxlength="30" required>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="email">Correo electronico</label>
                            <input type="email" id="email" name="email" class="form-input"
                                   value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>" required>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="rango">Rango</label>
                            <select id="rango" name="rango" class="filter-select" required>
                                <?php foreach ($rangos as $r): ?>
                                    <option value="<?php echo htmlspecialchars($r); ?>"
                                        <?php echo ($user['rango'] ?? '') === $r ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($r); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="region">Region</label>
                            <select id="region" name="region" class="filter-select" required>
                                <?php foreach ($regiones as $reg): ?>
                                    <option value="<?php echo htmlspecialchars($reg); ?>"
                                        <?php echo ($user['region'] ?? '') === $reg ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($reg); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Guardar cambios</button>
                    </div>
                </form>
            </section>

            <!-- contraseña -->
            <section class="ajustes-card" id="password">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// SEGURIDAD</span>
                    <h2 class="section-title">Cambiar contraseña</h2>
                </header>
                <form id="form-password" method="post" action="index.php?controlador=usuario&amp;action=cambiar_password">
                    <div class="ajustes-form-grid ajustes-form-grid--single">
                        <div class="form-group">
                            <label class="filter-label" for="actual">Contraseña actual</label>
                            <input type="password" id="actual" name="actual" class="form-input" required autocomplete="current-password">
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="nueva">Nueva contraseña</label>
                            <input type="password" id="nueva" name="nueva" class="form-input" required minlength="8" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="confirmar">Confirmar nueva contraseña</label>
                            <input type="password" id="confirmar" name="confirmar" class="form-input" required minlength="8" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Cambiar contraseña</button>
                    </div>
                </form>
            </section>

            <!-- amigos -->
            <section class="ajustes-card" id="amigos">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// SOCIAL</span>
                    <h2 class="section-title">
                        Mis amigos
                        <?php if (!empty($amigos)): ?>
                            <span class="badge badge--cyan"><?php echo count($amigos); ?></span>
                        <?php endif; ?>
                    </h2>
                </header>
                <?php if (empty($amigos)): ?>
                    <div class="empty-state empty-state--inline">
                        <div class="empty-icon" aria-hidden="true">◎</div>
                        <p class="empty-desc">Aun no tienes amigos en ValoSense.</p>
                    </div>
                <?php else: ?>
                    <ul class="amigos-list">
                        <?php foreach ($amigos as $amigo): ?>
                            <li class="amigo-item">
                                <div class="amigo-avatar-wrap">
                                    <div class="amigo-avatar"><?php echo htmlspecialchars(strtoupper(substr($amigo['username'] ?? '?', 0, 2))); ?></div>
                                    <?php if (($amigo['estado_presencia'] ?? '') === 'en_linea'): ?>
                                        <span class="status-dot status-online" aria-label="En linea"></span>
                                    <?php elseif (($amigo['estado_presencia'] ?? '') === 'ausente'): ?>
                                        <span class="status-dot status-away" aria-label="Ausente"></span>
                                    <?php endif; ?>
                                </div>
                                <div class="amigo-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $amigo['id']; ?>" class="amigo-username">
                                        <?php echo htmlspecialchars($amigo['username']); ?>
                                    </a>
                                    <span class="amigo-meta">
                                        <?php if (!empty($amigo['rango'])): ?>
                                            <span class="rank-badge"><?php echo htmlspecialchars($amigo['rango']); ?></span>
                                        <?php endif; ?>
                                        <?php if (!empty($amigo['region'])): ?>
                                            <span class="amigo-region"><?php echo htmlspecialchars($amigo['region']); ?></span>
                                        <?php endif; ?>
                                    </span>
                                </div>
                                <form class="inline-form" method="post" action="index.php?controlador=amistad&amp;action=eliminar">
                                    <input type="hidden" name="id" value="<?php echo $amigo['relacion_id']; ?>">
                                    <button type="submit" class="btn-secondary btn-small">Eliminar</button>
                                </form>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </section>

            <!-- perfil competitivo -->
            <section class="ajustes-card" id="riot">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// VALORANT</span>
                    <h2 class="section-title">Perfil competitivo</h2>
                </header>
                <?php if (($user['perfil_completo'] ?? 'no') === 'si'): ?>
                    <p class="ajustes-text-muted">
                        Riot ID: <strong><?php echo htmlspecialchars($user['riot_id'] ?? ''); ?>#<?php echo htmlspecialchars($user['riot_tag'] ?? ''); ?></strong>
                        &nbsp;&mdash;&nbsp;
                        Rango: <strong><?php echo htmlspecialchars($user['rango'] ?? ''); ?></strong>
                    </p>
                <?php endif; ?>
                <form id="form-completar-perfil" method="post" action="index.php?controlador=usuario&amp;action=completar_perfil">
                    <div class="ajustes-form-grid">
                        <div class="form-group">
                            <label class="filter-label" for="riot_id">Riot ID</label>
                            <input class="form-input" type="text" id="riot_id" name="riot_id"
                                   value="<?php echo htmlspecialchars($user['riot_id'] ?? ''); ?>"
                                   placeholder="TuNombre" required>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="riot_tag">Tag</label>
                            <input class="form-input" type="text" id="riot_tag" name="riot_tag"
                                   value="<?php echo htmlspecialchars($user['riot_tag'] ?? ''); ?>"
                                   placeholder="EUW1" required>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="riot_region">Region</label>
                            <select class="filter-select" id="riot_region" name="riot_region" required>
                                <option value="">Selecciona region</option>
                                <option value="eu" <?php echo ($user['riot_region'] ?? '') === 'eu' ? 'selected' : ''; ?>>Europa</option>
                                <option value="na" <?php echo ($user['riot_region'] ?? '') === 'na' ? 'selected' : ''; ?>>Norteamerica</option>
                                <option value="latam" <?php echo ($user['riot_region'] ?? '') === 'latam' ? 'selected' : ''; ?>>LATAM</option>
                                <option value="br" <?php echo ($user['riot_region'] ?? '') === 'br' ? 'selected' : ''; ?>>Brasil</option>
                                <option value="ap" <?php echo ($user['riot_region'] ?? '') === 'ap' ? 'selected' : ''; ?>>Asia Pacifico</option>
                                <option value="kr" <?php echo ($user['riot_region'] ?? '') === 'kr' ? 'selected' : ''; ?>>Corea</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="rango_comp">Rango</label>
                            <select class="filter-select" id="rango_comp" name="rango" required>
                                <option value="">Selecciona rango</option>
                                <option value="Iron 1" <?php echo ($user['rango'] ?? '') === 'Iron 1' ? 'selected' : ''; ?>>Iron 1</option>
                                <option value="Iron 2" <?php echo ($user['rango'] ?? '') === 'Iron 2' ? 'selected' : ''; ?>>Iron 2</option>
                                <option value="Iron 3" <?php echo ($user['rango'] ?? '') === 'Iron 3' ? 'selected' : ''; ?>>Iron 3</option>
                                <option value="Bronze 1" <?php echo ($user['rango'] ?? '') === 'Bronze 1' ? 'selected' : ''; ?>>Bronze 1</option>
                                <option value="Bronze 2" <?php echo ($user['rango'] ?? '') === 'Bronze 2' ? 'selected' : ''; ?>>Bronze 2</option>
                                <option value="Bronze 3" <?php echo ($user['rango'] ?? '') === 'Bronze 3' ? 'selected' : ''; ?>>Bronze 3</option>
                                <option value="Silver 1" <?php echo ($user['rango'] ?? '') === 'Silver 1' ? 'selected' : ''; ?>>Silver 1</option>
                                <option value="Silver 2" <?php echo ($user['rango'] ?? '') === 'Silver 2' ? 'selected' : ''; ?>>Silver 2</option>
                                <option value="Silver 3" <?php echo ($user['rango'] ?? '') === 'Silver 3' ? 'selected' : ''; ?>>Silver 3</option>
                                <option value="Gold 1" <?php echo ($user['rango'] ?? '') === 'Gold 1' ? 'selected' : ''; ?>>Gold 1</option>
                                <option value="Gold 2" <?php echo ($user['rango'] ?? '') === 'Gold 2' ? 'selected' : ''; ?>>Gold 2</option>
                                <option value="Gold 3" <?php echo ($user['rango'] ?? '') === 'Gold 3' ? 'selected' : ''; ?>>Gold 3</option>
                                <option value="Platinum 1" <?php echo ($user['rango'] ?? '') === 'Platinum 1' ? 'selected' : ''; ?>>Platinum 1</option>
                                <option value="Platinum 2" <?php echo ($user['rango'] ?? '') === 'Platinum 2' ? 'selected' : ''; ?>>Platinum 2</option>
                                <option value="Platinum 3" <?php echo ($user['rango'] ?? '') === 'Platinum 3' ? 'selected' : ''; ?>>Platinum 3</option>
                                <option value="Diamond 1" <?php echo ($user['rango'] ?? '') === 'Diamond 1' ? 'selected' : ''; ?>>Diamond 1</option>
                                <option value="Diamond 2" <?php echo ($user['rango'] ?? '') === 'Diamond 2' ? 'selected' : ''; ?>>Diamond 2</option>
                                <option value="Diamond 3" <?php echo ($user['rango'] ?? '') === 'Diamond 3' ? 'selected' : ''; ?>>Diamond 3</option>
                                <option value="Ascendant 1" <?php echo ($user['rango'] ?? '') === 'Ascendant 1' ? 'selected' : ''; ?>>Ascendant 1</option>
                                <option value="Ascendant 2" <?php echo ($user['rango'] ?? '') === 'Ascendant 2' ? 'selected' : ''; ?>>Ascendant 2</option>
                                <option value="Ascendant 3" <?php echo ($user['rango'] ?? '') === 'Ascendant 3' ? 'selected' : ''; ?>>Ascendant 3</option>
                                <option value="Immortal 1" <?php echo ($user['rango'] ?? '') === 'Immortal 1' ? 'selected' : ''; ?>>Immortal 1</option>
                                <option value="Immortal 2" <?php echo ($user['rango'] ?? '') === 'Immortal 2' ? 'selected' : ''; ?>>Immortal 2</option>
                                <option value="Immortal 3" <?php echo ($user['rango'] ?? '') === 'Immortal 3' ? 'selected' : ''; ?>>Immortal 3</option>
                                <option value="Radiant" <?php echo ($user['rango'] ?? '') === 'Radiant' ? 'selected' : ''; ?>>Radiant</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="filter-label" for="rango_rr">RR</label>
                            <input class="form-input" type="number" id="rango_rr" name="rango_rr"
                                   min="0" max="100" value="<?php echo (int)($user['rango_rr'] ?? 0); ?>" required>
                        </div>
                    </div>
                    <div class="ajustes-card-footer">
                        <button type="submit" name="guardar_perfil" value="1" class="btn-primary">Guardar perfil</button>
                    </div>
                </form>
            </section>

            <!-- zona de peligro -->
            <section class="ajustes-card ajustes-card--danger" id="peligro">
                <header class="ajustes-card-header">
                    <span class="eyebrow eyebrow--danger">// PELIGRO</span>
                    <h2 class="section-title">Zona de peligro</h2>
                </header>
                <p class="ajustes-danger-warn">
                    <strong>Atención:</strong> Eliminar tu cuenta es permanente e irreversible.
                    Perderás todos tus datos, amigos y lineups.
                </p>
                <form method="post" action="index.php?controlador=usuario&amp;action=eliminar_cuenta">
                    <div class="form-group">
                        <label class="filter-label" for="password_confirm">Introduce tu contraseña para confirmar</label>
                        <input type="password" id="password_confirm" name="password_confirm"
                               class="form-input form-input--danger" required autocomplete="current-password"
                               placeholder="Tu contraseña actual">
                    </div>
                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-danger">Eliminar mi cuenta</button>
                    </div>
                </form>
            </section>

        </div>
    </div>

</main>
