<?php
// INSTRUCCION: reemplaza el contenido completo de view/lineup_view.php con este
// CAMBIO: se elimina el HTML standalone anterior
// RAZON: la vista ahora sigue el patron de la profesora:
//   - require_once menu al principio
//   - sin session_start ni logica de negocio
//   - $lineups viene del controlador y se pasa al JS como JSON

$modo_envio_lineup = !empty($modo_envio_lineup);
require_once("view/menu.php"); ?>

<!-- contenedor principal del apartado lineups -->
<div class="app">
    <aside class="sidebar">
        <div class="map-selector" id="mapSelector">
            <!-- boton que muestra el mapa activo y abre el dropdown -->
            <button class="map-hero" id="mapHero" type="button">
                <h1 id="heroTitle">Abyss</h1>
                <div class="hero-check">▼</div>
            </button>
            <!-- dropdown con grid de mapas -->
            <div class="maps-dropdown" id="mapsDropdown">
                <div class="maps-grid" id="mapsGrid">
                    <div class="loading">Cargando mapas...</div>
                </div>
            </div>
        </div>

        <div class="side-content">
            <!-- tabs ataque defensa -->
            <div class="tabs">
                <button class="tab active" type="button" data-side="Ataque">Ataque</button>
                <button class="tab" type="button" data-side="Defensa">Defensa</button>
                <div class="separator"></div>
                <div class="star">☆</div>
            </div>

            <h2 class="section-title agent-title">Selecciona un agente</h2>
            <!-- grid de agentes, se rellena por JS -->
            <div class="agents-grid" id="agentsGrid">
                <div class="loading">Cargando agentes...</div>
            </div>

            <?php if ($modo_envio_lineup): ?>
            <!-- apartado: lineups que ya ha enviado este usuario -->
            <section class="mis-envios-panel">
                <h2 class="section-title agent-title">Tus envios</h2>
                <p class="lineup-editor-hint mis-envios-hint">Pulsa un lineup para verlo en el mapa y comprobar su estado.</p>
                <button class="mis-envios-user-card" type="button">
                    <i><?php echo htmlspecialchars(strtoupper(substr($_SESSION['usuario']['username'] ?? 'TU', 0, 2))); ?></i>
                    <span><?php echo htmlspecialchars($_SESSION['usuario']['username'] ?? 'Usuario'); ?></span>
                    <b id="misEnviosContador"><?php echo count($mis_envios ?? array()); ?></b>
                </button>
                <?php if (empty($mis_envios)): ?>
                    <div class="mis-envios-lista" id="misEnviosLista">
                        <p class="mis-envios-vacio">Todavia no has enviado ningun lineup. Crea uno y aparecera aqui con su estado.</p>
                    </div>
                <?php else: ?>
                    <div class="mis-envios-lista" id="misEnviosLista">
                        <?php foreach ($mis_envios as $envio): ?>
                            <button class="mis-envios-item" type="button" data-id="<?php echo (int)$envio['id']; ?>">
                                <span class="aul-titulo"><?php echo htmlspecialchars($envio['agente']); ?> · <?php echo htmlspecialchars($envio['habilidad']); ?></span>
                                <span class="aul-meta"><?php echo htmlspecialchars($envio['mapa']); ?> · <?php echo htmlspecialchars($envio['lado']); ?></span>
                                <span class="mis-envios-estado <?php echo !empty($envio['aprobado']) ? 'is-aprobado' : 'is-pendiente'; ?>">
                                    <?php echo !empty($envio['aprobado']) ? 'Aprobado' : 'Pendiente'; ?>
                                </span>
                            </button>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>
            <?php endif; ?>

            <section class="abilities-panel">
                <h2 class="section-title">Personaje seleccionado</h2>
                <!-- caja del agente seleccionado actualmente -->
                <div class="selected-agent-box" id="selectedAgentBox">
                    <img id="selectedAgentImage" src="" alt="Agente seleccionado">
                    <div>
                        <h3 id="selectedAgentName">Selecciona agente</h3>
                        <p id="selectedAgentRole">Habilidades del personaje</p>
                    </div>
                    <button class="back-agents" id="backAgents" type="button">Atrás</button>
                </div>
                <h2 class="section-title">Habilidades</h2>
                <!-- grid de habilidades, se rellena por JS -->
                <div class="abilities-grid" id="abilitiesGrid"></div>

                <!-- tabla de lineups del agente -->
                <section class="lineup-tabla-panel">
                    <h2 class="section-title">Lineups creados</h2>
                    <div class="lineup-tabla-wrap">
                        <table class="lineup-tabla">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Habilidad</th>
                                    <th>Mapa</th>
                                    <th>Lado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="lineupTablaBody">
                                <tr>
                                    <td colspan="5">Selecciona un agente.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>
        </div>
    </aside>

    <main class="main">
        <section class="lineup-board">
            <!-- caja del minimapa con pines de lineup encima -->
            <div class="map-image-box" id="mapBox">
                <div class="map-rotator" id="mapRotator">
                    <img id="mapImage" src="" alt="Mapa seleccionado">
                    <!-- capa donde JS pinta los pines y lineas de lineup -->
                    <div class="lineup-layer" id="lineupLayer">
                        <svg class="lineup-lines" id="lineupLines"></svg>
                    </div>
                </div>
            </div>

            <?php if ((!isset($_SESSION['usuario']) || $_SESSION['usuario']['es_admin'] != 1) && !$modo_envio_lineup): ?>
            <!-- panel derecho con info del mapa solo para usuarios normales -->
            <aside class="map-info">
                <h2 id="mapName">Selecciona un mapa</h2>
                <p id="mapText">Elige un mapa y un agente para ver los lineups disponibles.</p>
                <p><strong>Lado:</strong> <span id="sideText">Ataque</span></p>
                <p><strong>Agente:</strong> <span id="agentText">Sin seleccionar</span></p>
                <div class="pill-row">
                    <span class="pill">Mapas</span>
                    <span class="pill">Agentes</span>
                    <span class="pill">Lineups</span>
                </div>
            </aside>
            <?php endif; ?>

            <?php if ((isset($_SESSION['usuario']) && $_SESSION['usuario']['es_admin'] == 1) || $modo_envio_lineup): ?>
            <!-- editor de lineups visible para admin y para envíos de usuarios -->
            <section class="lineup-editor">
                <div class="lineup-editor-header">
                    <h3><?php echo $modo_envio_lineup ? 'Enviar prueba de lineup' : 'Editor de lineup'; ?></h3>
                    <p class="lineup-editor-hint"><?php echo $modo_envio_lineup ? 'Prepara una prueba de lineup con inicio, destino y video para que el admin la revise.' : 'Selecciona habilidad y haz dos clics en el mapa: inicio y destino.'; ?></p>
                </div>
                <div class="lineup-editor-body">
                    <div class="editor-aviso" id="editorAviso"></div>
                    <div class="editor-btn-row">
                        <button id="toggleEditorMode" type="button">Crear lineup</button>
                        <button id="clearLineupDraft" type="button">Limpiar puntos</button>
                    </div>

                    <!-- campos para rellenar el lineup -->
                    <div class="editor-campos" id="editorCampos" style="display:none">
                        <label>URL de YouTube <span style="font-weight:normal;opacity:.6">(opcional, se puede añadir después)</span></label>
                        <input type="text" id="editorVideoUrl" value="" autocomplete="off">
                        <button id="guardarLineup" type="button"><?php echo $modo_envio_lineup ? 'Enviar prueba' : 'Guardar lineup'; ?></button>
                    </div>

                    <pre id="lineupJsonOutput">Aqui aparecera el JSON del lineup.</pre>
                </div>
            </section>
            <?php endif; ?>
        </section>
    </main>
</div>

<!-- modal de video de youtube -->
<div class="video-modal" id="videoModal">
    <div class="video-box">
        <div class="video-header">
            <h3 id="videoTitle">Lineup</h3>
            <button class="close-video" id="closeVideo" type="button">×</button>
        </div>
        <iframe id="videoFrame" src="" title="Video del lineup" allowfullscreen></iframe>
    </div>
</div>

<?php
// CAMBIO: los lineups del controlador se pasan al JS como JSON
// RAZON: el JS filtra por mapa/lado/agente en cliente sin recargar la pagina
// $lineups viene de $model->get_todos_aprobados() en lineup_controller.php
?>
<script>
window.lineupData = <?php echo json_encode($lineups ?? array()); ?>;
window.esAdminLineup = <?php echo (isset($_SESSION['usuario']) && $_SESSION['usuario']['es_admin'] == 1) ? 'true' : 'false'; ?>;
window.modoEnvioLineup = <?php echo $modo_envio_lineup ? 'true' : 'false'; ?>;
window.misEnviosUsuario = <?php echo json_encode($mis_envios ?? array()); ?>;
window.lineupInicial = {
    mapa: <?php echo json_encode($mapa_sel ?? ''); ?>,
    lado: <?php echo json_encode($lado_sel ?? 'Ataque'); ?>,
    agente_id: <?php echo json_encode($agente_id ?? 0); ?>
};
window.agentesIds = <?php
    $ids = array();
    if (!empty($agentes)) {
        foreach ($agentes as $ag) {
            $ids[$ag['nombre']] = $ag['id'];
        }
    }
    echo json_encode($ids);
?>;
</script>
