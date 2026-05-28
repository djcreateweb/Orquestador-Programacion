<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><a href="index.php?controlador=lineup&amp;action=home">Lineups</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Enviar</li>
            </ol>
        </div>
    </nav>

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

    <section class="search-section">
        <div class="container">

            <?php if (!empty($message)): ?>
                <p class="auth-message"><?= htmlspecialchars($message) ?></p>
            <?php endif; ?>

            <form class="search-form" action="" method="get" onsubmit="return enviarLineupGmail()">

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="titulo">Título</label>
                    <input class="form-input" type="text" id="titulo" name="titulo" maxlength="100" required
                           value="<?php echo htmlspecialchars(isset($_GET['titulo']) ? $_GET['titulo'] : ''); ?>"
                           placeholder="Ej: Smoke desde spawn a A main">
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="agente">Agente</label>
                    <input class="form-input" type="text" id="agente" name="agente" required
                           placeholder="Ej: Viper"
                           value="<?php echo htmlspecialchars(isset($_GET['agente']) ? $_GET['agente'] : ''); ?>">
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="mapa">Mapa</label>
                    <input class="form-input" type="text" id="mapa" name="mapa" required
                           placeholder="Ej: Ascent"
                           value="<?php echo htmlspecialchars(isset($_GET['mapa']) ? $_GET['mapa'] : ''); ?>">
                </div>

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="video_url">URL de YouTube</label>
                    <input class="form-input" type="url" id="video_url" name="video_url" required
                           placeholder="https://www.youtube.com/watch?v=..."
                           value="<?php echo htmlspecialchars(isset($_GET['video_url']) ? $_GET['video_url'] : ''); ?>">
                </div>

                <div class="filter-group form-span-full">
                    <label class="filter-label" for="descripcion">Descripción</label>
                    <textarea class="form-input" id="descripcion" name="descripcion" rows="5" required
                              placeholder="Explica desde dónde lanzar, qué habilidad usar y qué zona cubre."><?php echo htmlspecialchars(isset($_GET['descripcion']) ? $_GET['descripcion'] : ''); ?></textarea>
                </div>

                <div class="filter-actions">
                    <a href="index.php?controlador=lineup&amp;action=home" class="btn-secondary">Cancelar</a>
                    <button type="submit" class="btn-enviar">Enviar lineup</button>
                </div>
            </form>

        </div>
    </section>

</main>

<script>
function enviarLineupGmail() {
    let titulo = document.getElementById("titulo").value;
    let agente = document.getElementById("agente").value;
    let mapa = document.getElementById("mapa").value;
    let videoUrl = document.getElementById("video_url").value;
    let descripcion = document.getElementById("descripcion").value;
    let asunto = "Nuevo lineup: " + titulo;
    let cuerpo = "Agente: " + agente + "\nMapa: " + mapa + "\nTitulo: " + titulo + "\nVideo: " + videoUrl + "\n\n" + descripcion;
    let url = "https://mail.google.com/mail/?view=cm&fs=1"
        + "&to=" + encodeURIComponent("djcreateweb@gmail.com")
        + "&su=" + encodeURIComponent(asunto)
        + "&body=" + encodeURIComponent(cuerpo);
    window.open(url, "_blank");
    return false;
}
</script>
