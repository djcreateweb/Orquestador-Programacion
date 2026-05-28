<?php require_once("view/menu.php"); ?>

<main class="main-content vincular-page" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Mi cuenta de Valorant</li>
            </ol>
        </div>
    </nav>

    <section class="hero">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>
        <div class="container hero-content">
            <span class="eyebrow">// CUENTA · RIOT ID</span>
            <h1 class="hero-title">Vincula tu cuenta de <span class="text-red">Valorant</span></h1>
            <p class="hero-subtitle">Guarda tu Riot ID para importar tus estadísticas automáticamente. Sin contraseñas — solo tu ID público y región.</p>
        </div>
    </section>

    <section class="search-section">
        <div class="container">

            <?php if (!empty($message)): ?>
            <div class="auth-aviso <?php echo strpos($message, 'correctamente') !== false ? 'auth-aviso-ok' : 'auth-aviso-error'; ?>">
                <span class="auth-aviso-icono"><?php echo strpos($message, 'correctamente') !== false ? '✓' : '✕'; ?></span>
                <span class="auth-aviso-texto"><?php echo htmlspecialchars($message); ?></span>
            </div>
            <?php endif; ?>

            <?php
                $riot_id_actual     = $_SESSION["usuario"]["riot_id"]     ?? "";
                $riot_tag_actual    = $_SESSION["usuario"]["riot_tag"]    ?? "";
                $riot_region_actual = $_SESSION["usuario"]["riot_region"] ?? "";
                $vinculada = $riot_id_actual !== "" && $riot_tag_actual !== "";
            ?>

            <?php if ($vinculada): ?>
                <div class="empty-state vincular-linked">
                    <div class="empty-icon" aria-hidden="true">✓</div>
                    <h3 class="empty-title">Cuenta vinculada</h3>
                    <p class="empty-desc vincular-riot">
                        <span class="vincular-riotid">
                            <?php echo htmlspecialchars($riot_id_actual); ?><span class="vincular-hash">#</span><?php echo htmlspecialchars($riot_tag_actual); ?>
                        </span>
                        <span class="vincular-region-pill">Región <?php echo htmlspecialchars(strtoupper($riot_region_actual)); ?></span>
                    </p>
                    <div class="vincular-actions">
                        <form action="" method="post">
                            <button type="submit" name="desvincular" value="1" class="btn-secondary btn-small">Desvincular</button>
                        </form>
                        <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $_SESSION['usuario']['id']; ?>"
                           class="btn-ghost btn-small">Ver mis stats en mi perfil →</a>
                    </div>
                </div>

            <?php else: ?>
                <form class="search-form" action="" method="post">
                    <div class="filter-group">
                        <label class="filter-label" for="riot_id">Riot ID (sin el tag)</label>
                        <input class="form-input" type="text" id="riot_id" name="riot_id" required
                               minlength="3" maxlength="50"
                               placeholder="Ej: Franma"
                               value="<?php echo htmlspecialchars($_POST['riot_id'] ?? ''); ?>">
                    </div>
                    <div class="filter-group">
                        <label class="filter-label" for="riot_tag">Tag</label>
                        <input class="form-input" type="text" id="riot_tag" name="riot_tag" required
                               maxlength="10"
                               placeholder="Ej: EUW1 (sin el #)"
                               value="<?php echo htmlspecialchars($_POST['riot_tag'] ?? ''); ?>">
                    </div>
                    <div class="filter-group">
                        <label class="filter-label" for="riot_region">Región</label>
                        <select class="filter-select" id="riot_region" name="riot_region" required>
                            <option value="">Elige tu región</option>
                            <option value="eu">EU — Europa</option>
                            <option value="na">NA — Norteamérica</option>
                            <option value="latam">LATAM</option>
                            <option value="br">BR — Brasil</option>
                            <option value="ap">AP — Asia Pacífico</option>
                            <option value="kr">KR — Corea</option>
                        </select>
                    </div>
                    <div class="filter-actions">
                        <button class="btn-primary" type="submit" name="vincular" value="1">Vincular cuenta</button>
                    </div>
                    <p class="section-subtitle spaced-top-lg vincular-trust">
                        No te pedimos tu contraseña en ningún momento. Solo usamos tu Riot ID público.
                    </p>
                </form>
            <?php endif; ?>

        </div>
    </section>

</main>
