<?php require_once("view/menu.php"); ?>

<?php
function rol_es($rol){
    $map = ['Duelist'=>'Duelista','Initiator'=>'Iniciador','Controller'=>'Controlador','Sentinel'=>'Centinela'];
    return $map[$rol] ?? $rol;
}

function descripcion_rol($rol){
    $map = [
        'Duelist' => 'Entra primero a ganar espacios y acumular bajas.',
        'Initiator' => 'Abre sites con flashes e informacion para el equipo.',
        'Controller' => 'Bloquea visibilidad con humos y divide el mapa.',
        'Sentinel' => 'Defiende flancos y ancla los sites con trampas.',
    ];
    return $map[$rol] ?? '';
}

$roles_orden = ['Duelist','Initiator','Controller','Sentinel'];
$roles_label = ['Duelist'=>'Duelista','Initiator'=>'Iniciador','Controller'=>'Controlador','Sentinel'=>'Centinela'];
$por_rol = ['Duelist'=>[],'Initiator'=>[],'Controller'=>[],'Sentinel'=>[]];
foreach (($agentes ?? []) as $a) {
    if (isset($por_rol[$a['rol']])) $por_rol[$a['rol']][] = $a;
}

$roles_sel = [];
if (!empty($seleccionados) && !empty($agentes)) {
    $por_id_team = [];
    foreach ($agentes as $a) $por_id_team[(int)$a['id']] = $a['rol'];
    foreach ($seleccionados as $sid) {
        if (isset($por_id_team[$sid])) $roles_sel[$por_id_team[$sid]] = true;
    }
}
?>

<main class="team-compose-app" id="main">
    <aside class="team-sidebar">
        <div class="team-map-selector" id="teamMapSelector">
            <button class="team-map-hero" id="teamMapHero" type="button"
                    style="background-image: linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.58)), url('imagenes/mapas/<?php echo htmlspecialchars($mapa); ?>.png');">
                <h1><?php echo htmlspecialchars($mapa); ?></h1>
                <span class="team-map-caret">▼</span>
            </button>
            <div class="team-maps-dropdown" id="teamMapsDropdown">
                <div class="team-maps-grid">
                    <?php foreach ($mapas as $m): ?>
                        <a class="team-map-card <?php echo $m === $mapa ? 'active' : ''; ?>"
                           href="index.php?controlador=team&amp;action=home&amp;mapa=<?php echo urlencode($m); ?>">
                            <img src="imagenes/mapas/<?php echo htmlspecialchars($m); ?>.png" alt="<?php echo htmlspecialchars($m); ?>">
                            <span><?php echo htmlspecialchars($m); ?></span>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <form action="index.php" method="get" id="comp-form" class="team-agent-form">
            <input type="hidden" name="controlador" value="team">
            <input type="hidden" name="action" value="home">
            <input type="hidden" name="mapa" value="<?php echo htmlspecialchars($mapa); ?>">
            <input type="hidden" name="recomendar" value="1">

            <div class="team-sidebar-content">
                <h2 class="team-sidebar-title">Selecciona agente</h2>
                <p class="team-sidebar-hint" id="comp-status" aria-live="polite">Marca hasta 5 agentes y recomienda el resto.</p>

                <ul class="team-role-pills" id="role-pills" aria-label="Roles cubiertos">
                    <?php foreach ($roles_orden as $rol): ?>
                        <li class="team-role-pill <?php echo !empty($roles_sel[$rol]) ? 'is-covered' : ''; ?>"
                            data-role="<?php echo htmlspecialchars($rol); ?>">
                            <?php echo htmlspecialchars($roles_label[$rol]); ?>
                        </li>
                    <?php endforeach; ?>
                </ul>

                <?php foreach ($por_rol as $rol => $lista): ?>
                    <?php if (empty($lista)) continue; ?>
                    <section class="team-role-block">
                        <h3 class="team-role-title"><?php echo htmlspecialchars($roles_label[$rol]); ?></h3>
                        <ul class="team-agent-grid">
                            <?php foreach ($lista as $a): ?>
                                <?php $ruta_img = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $a['nombre']))) . '.png'; ?>
                                <li>
                                    <label class="lineup-agent-chip role-<?php echo strtolower($a['rol']); ?> agent-btn<?php if (in_array((int)$a['id'], $seleccionados, true)) echo ' is-selected'; ?>" data-rol="<?php echo htmlspecialchars($a['rol']); ?>">
                                        <input type="checkbox" name="agentes[]" value="<?php echo (int)$a['id']; ?>" class="sr-only"
                                            <?php if (in_array((int)$a['id'], $seleccionados, true)) echo 'checked'; ?>>
                                        <img src="<?php echo htmlspecialchars($ruta_img); ?>" alt="<?php echo htmlspecialchars($a['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                        <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($a['nombre']); ?></span>
                                    </label>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </section>
                <?php endforeach; ?>

                <button type="submit" class="btn-primary team-recommend-btn">Recomendar equipo</button>
            </div>
        </form>
    </aside>

    <section class="team-main-panel">
        <div class="team-result-shell" id="recommendation-result">
            <header class="team-result-header">
                <div>
                    <span class="eyebrow">// COMPOSICION</span>
                    <h1>Equipo para <span class="text-red"><?php echo htmlspecialchars($mapa); ?></span></h1>
                </div>
                <span class="team-count"><?php echo count($seleccionados); ?> / 5</span>
            </header>

            <?php if (isset($resultado) && $resultado !== null): ?>
                <div class="team-result-grid">
                    <section class="rec-block team-current-block">
                        <header class="rec-block-head">
                            <span class="eyebrow">// EQUIPO ACTUAL</span>
                            <h3 class="rec-block-title">Seleccionados</h3>
                        </header>
                        <?php if (!empty($resultado['seleccionados'])): ?>
                            <ul class="lineup-agents-row-list">
                                <?php foreach ($resultado['seleccionados'] as $s): ?>
                                    <?php $ruta_img_s = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $s['nombre']))) . '.png'; ?>
                                    <li>
                                        <div class="lineup-agent-chip role-<?php echo strtolower($s['rol']); ?> is-active" data-rol="<?php echo htmlspecialchars($s['rol']); ?>">
                                            <img src="<?php echo htmlspecialchars($ruta_img_s); ?>" alt="<?php echo htmlspecialchars($s['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                            <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($s['nombre']); ?></span>
                                            <span class="lineup-agent-chip-rol"><?php echo htmlspecialchars(rol_es($s['rol'])); ?></span>
                                        </div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p class="empty-hint">No has marcado ningun agente. Las recomendaciones salen del meta del mapa.</p>
                        <?php endif; ?>
                    </section>

                    <?php if (!empty($resultado['secciones'])): ?>
                        <?php foreach ($resultado['secciones'] as $sec): ?>
                            <?php $rol = $sec['rol']; $opciones = $sec['opciones']; ?>
                            <section class="rec-block rec-block-rol-<?php echo strtolower($rol); ?>">
                                <header class="rec-block-head">
                                    <span class="eyebrow agent-rol-<?php echo strtolower($rol); ?>">// SLOT <?php echo (int)$sec['slot_num']; ?> · <?php echo htmlspecialchars(strtoupper(rol_es($rol))); ?></span>
                                    <h3 class="rec-block-title">Opciones recomendadas</h3>
                                    <p class="rec-block-intro"><?php echo htmlspecialchars(descripcion_rol($rol)); ?></p>
                                </header>
                                <?php if (empty($opciones)): ?>
                                    <p class="empty-hint">No quedan agentes disponibles de este rol.</p>
                                <?php else: ?>
                                    <ul class="lineup-agents-row-list">
                                        <?php foreach ($opciones as $i => $a): ?>
                                            <?php $ruta_img_a = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $a['nombre']))) . '.png'; ?>
                                            <li>
                                                <div class="lineup-agent-chip role-<?php echo strtolower($a['rol']); ?>" data-rol="<?php echo htmlspecialchars($a['rol']); ?>">
                                                    <sup class="rank-badge">#<?php echo $i + 1; ?></sup>
                                                    <img src="<?php echo htmlspecialchars($ruta_img_a); ?>" alt="<?php echo htmlspecialchars($a['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                                    <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($a['nombre']); ?></span>
                                                    <?php if (!empty($a['tier'])): ?>
                                                    <span class="lineup-agent-chip-rol"><?php echo htmlspecialchars($a['tier']); ?></span>
                                                    <?php endif; ?>
                                                </div>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul>
                                <?php endif; ?>
                            </section>
                        <?php endforeach; ?>
                    <?php endif; ?>

                    <?php if (!empty($resultado['team_rating'])): ?>
                        <?php $tr = $resultado['team_rating']; ?>
                        <section class="team-rating-compact team-rating-<?php echo strtolower($tr['label']); ?>">
                            <span>Tier equipo</span>
                            <strong><?php echo htmlspecialchars($tr['label']); ?></strong>
                            <em><?php echo htmlspecialchars($tr['score_avg']); ?> / <?php echo (int)$tr['score_max']; ?></em>
                        </section>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="team-empty-center">
                    <h2>Prepara tu composicion</h2>
                    <p>Elige los agentes que ya teneis en el sidebar y pulsa recomendar equipo.</p>
                </div>
            <?php endif; ?>
        </div>
    </section>
</main>
