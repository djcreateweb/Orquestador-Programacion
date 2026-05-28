<?php require_once("view/menu.php"); ?>

<main class="main-content completar-page" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Completar perfil</li>
            </ol>
        </div>
    </nav>

    <section class="hero hero-compact">
        <div class="container hero-content">
            <span class="eyebrow">// PERFIL · COMPETITIVO</span>
            <h1 class="hero-title">Completa tu <span class="text-red">perfil</span></h1>
            <p class="hero-subtitle">Estos datos te permiten usar el matchmaker y aparecer en el ranking.</p>
        </div>
    </section>

    <section class="search-section">
        <div class="container">

            <?php if (!empty($message)): ?>
                <div class="vincular-message <?php echo strpos($message, 'correctamente') !== false ? 'vincular-message--success' : 'vincular-message--error'; ?>">
                    <span class="vincular-message-icon">
                        <?php echo strpos($message, 'correctamente') !== false ? 'OK' : '!'; ?>
                    </span>
                    <div class="vincular-message-body">
                        <strong><?php echo strpos($message, 'correctamente') !== false ? 'Perfil guardado' : 'Revisa los datos'; ?></strong>
                        <p><?php echo htmlspecialchars($message); ?></p>
                    </div>
                </div>
            <?php endif; ?>

            <form class="search-form completar-form" method="post" action="index.php?controlador=usuario&amp;action=completar_perfil">
                <div class="filter-group">
                    <label class="filter-label" for="riot_id">Riot ID</label>
                    <input class="form-input" type="text" id="riot_id" name="riot_id" placeholder="TuNombre" required>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="riot_tag">Tag</label>
                    <input class="form-input" type="text" id="riot_tag" name="riot_tag" placeholder="EUW1" required>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="riot_region">Region</label>
                    <select class="filter-select" id="riot_region" name="riot_region" required>
                        <option value="">Selecciona region</option>
                        <option value="eu">Europa</option>
                        <option value="na">Norteamerica</option>
                        <option value="latam">LATAM</option>
                        <option value="br">Brasil</option>
                        <option value="ap">Asia Pacifico</option>
                        <option value="kr">Corea</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="rango">Rango</label>
                    <select class="filter-select" id="rango" name="rango" required>
                        <option value="">Selecciona rango</option>
                        <option value="Iron 1">Iron 1</option>
                        <option value="Iron 2">Iron 2</option>
                        <option value="Iron 3">Iron 3</option>
                        <option value="Bronze 1">Bronze 1</option>
                        <option value="Bronze 2">Bronze 2</option>
                        <option value="Bronze 3">Bronze 3</option>
                        <option value="Silver 1">Silver 1</option>
                        <option value="Silver 2">Silver 2</option>
                        <option value="Silver 3">Silver 3</option>
                        <option value="Gold 1">Gold 1</option>
                        <option value="Gold 2">Gold 2</option>
                        <option value="Gold 3">Gold 3</option>
                        <option value="Platinum 1">Platinum 1</option>
                        <option value="Platinum 2">Platinum 2</option>
                        <option value="Platinum 3">Platinum 3</option>
                        <option value="Diamond 1">Diamond 1</option>
                        <option value="Diamond 2">Diamond 2</option>
                        <option value="Diamond 3">Diamond 3</option>
                        <option value="Ascendant 1">Ascendant 1</option>
                        <option value="Ascendant 2">Ascendant 2</option>
                        <option value="Ascendant 3">Ascendant 3</option>
                        <option value="Immortal 1">Immortal 1</option>
                        <option value="Immortal 2">Immortal 2</option>
                        <option value="Immortal 3">Immortal 3</option>
                        <option value="Radiant">Radiant</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="rango_rr">RR</label>
                    <input class="form-input" type="number" id="rango_rr" name="rango_rr" min="0" max="100" value="0" required>
                </div>

                <div class="filter-actions">
                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $_SESSION['usuario']['id']; ?>" class="btn-secondary">Cancelar</a>
                    <button type="submit" name="guardar_perfil" value="1" class="btn-primary">Guardar perfil</button>
                </div>
            </form>

        </div>
    </section>

</main>
