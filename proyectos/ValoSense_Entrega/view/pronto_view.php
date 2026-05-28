<?php require_once("view/menu.php"); ?>
<main class="main-content" id="main">
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">En desarrollo</li>
            </ol>
        </div>
    </nav>

    <div class="pronto-wrap">
        <div class="pronto-card pronto-card--titled reveal-zoom">
            <div class="pronto-icon" aria-hidden="true">◐</div>
            <span class="eyebrow">// PRÓXIMAMENTE</span>
            <h1 class="hero-title pronto-title">Próximamente en ValoSense</h1>
            <p class="hero-subtitle">
                <?php echo htmlspecialchars($pronto_mensaje ?? 'Esta sección aún está en desarrollo. Mientras tanto, tienes el matchmaker, los lineups y el chat ya funcionando.'); ?>
            </p>
            <div class="spaced-actions">
                <?php if(isset($_SESSION["usuario"])): ?>
                    <a href="index.php?controlador=matchmaker&amp;action=home" class="btn-primary">Buscar equipo</a>
                    <a href="index.php?controlador=lineup&amp;action=home" class="btn-ghost">Ver lineups</a>
                <?php else: ?>
                    <a href="index.php?controlador=lineup&amp;action=home" class="btn-primary">Ver lineups</a>
                    <a href="index.php" class="btn-ghost">Volver al inicio</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>
