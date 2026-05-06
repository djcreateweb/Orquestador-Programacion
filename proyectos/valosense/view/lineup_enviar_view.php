<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><a href="index.php?controlador=lineup&amp;action=home">Lineups</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Enviar</li>
            </ol>
        </div>
    </nav>

    <!-- Hero -->
    <section class="hero hero-lineups">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// SUBMIT · MÓDULO 02b</span>
            <h1 class="hero-title">Envía un <span class="text-red">lineup</span></h1>
            <p class="hero-subtitle">Comparte tu jugada con la comunidad. Un administrador la revisará antes de publicarla.</p>
        </div>
    </section>

    <!-- Formulario de envío -->
    <section class="search-section">
        <div class="container">

            <?php if(isset($message) && $message !== ""): ?>
                <p class="auth-message" data-toast="info"><?php echo htmlspecialchars($message); ?></p>
            <?php endif; ?>

            <form class="search-form" action="index.php?controlador=lineup&amp;action=enviar" method="post">
                <?php echo csrf_field(); ?>

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="titulo">Título</label>
                    <input class="form-input" type="text" id="titulo" name="titulo" maxlength="100" required
                           value="<?php echo htmlspecialchars($_POST['titulo'] ?? ''); ?>"
                           placeholder="Ej: Smoke desde spawn a A main">
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="agente_id">Agente</label>
                    <select class="filter-select" id="agente_id" name="agente_id" required>
                        <option value="">Elige un agente</option>
                        <?php foreach($agentes as $a): ?>
                            <option value="<?php echo $a['id']; ?>" <?php if(($_POST['agente_id'] ?? '') == $a['id']) echo 'selected'; ?>>
                                <?php echo htmlspecialchars($a['nombre']); ?> (<?php echo htmlspecialchars($a['rol']); ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="mapa">Mapa</label>
                    <select class="filter-select" id="mapa" name="mapa" required>
                        <option value="">Elige un mapa</option>
                        <?php foreach($mapas as $m): ?>
                            <option value="<?php echo $m; ?>" <?php if(($_POST['mapa'] ?? '') === $m) echo 'selected'; ?>>
                                <?php echo $m; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="video_url">URL de YouTube</label>
                    <input class="form-input" type="url" id="video_url" name="video_url" required
                           placeholder="https://www.youtube.com/watch?v=..."
                           value="<?php echo htmlspecialchars($_POST['video_url'] ?? ''); ?>">
                    <div class="yt-preview" id="yt-preview" aria-live="polite">
                        <p class="yt-preview-empty" id="yt-preview-empty">Pega la URL del video y verás el preview aquí.</p>
                    </div>
                </div>

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="descripcion">Descripción</label>
                    <textarea class="form-input" id="descripcion" name="descripcion" rows="5" required
                              placeholder="Explica desde dónde lanzar, qué habilidad usar y qué zona cubre."><?php echo htmlspecialchars($_POST['descripcion'] ?? ''); ?></textarea>
                </div>

                <div class="filter-actions">
                    <a href="index.php?controlador=lineup&amp;action=home" class="btn-secondary">Cancelar</a>
                    <button class="btn-primary" type="submit" name="enviar" value="1">Enviar para revisión</button>
                </div>
            </form>
        </div>
    </section>

</main>
