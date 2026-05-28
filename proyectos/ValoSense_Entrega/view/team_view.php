<?php require_once("view/menu.php"); ?>

<?php
// traduce el rol a español
function rol_es($rol){
    $map = ['Duelist'=>'Duelista','Initiator'=>'Iniciador','Controller'=>'Controlador','Sentinel'=>'Centinela'];
    return $map[$rol] ?? $rol;
}
// descripción del rol
function descripcion_rol($rol){
    $map = [
        'Duelist' => 'Entra primero a ganar espacios y acumular bajas.',
        'Initiator' => 'Abre sites con flashes e información para el equipo.',
        'Controller' => 'Bloquea visibilidad con humos y divide el mapa.',
        'Sentinel' => 'Defiende flancos y ancla los sites con trampas.',
    ];
    return $map[$rol] ?? '';
}
?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Composición</li>
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
            <span class="eyebrow">// TEAM · MÓDULO 04</span>
            <h1 class="hero-title">Composición por <span class="text-red">mapa</span></h1>
            <p class="hero-subtitle">Elige el mapa, marca los agentes que ya jugaréis y te sugerimos con qué completar el equipo.</p>
        </div>
    </section>

    <section class="tactics-section">
        <div class="container">

            <?php if (empty($mapa) || !in_array($mapa, $mapas, true)): ?>

                <!-- paso 1: selector de mapa -->
                <div class="step-block">
                    <div class="step-block-header">
                        <span class="step-pill">Paso 1</span>
                        <h3 class="subsection-label">Elige el mapa</h3>
                    </div>
                    <div class="map-grid">
                        <?php foreach ($mapas as $m): ?>
                            <a class="map-btn" href="index.php?controlador=team&amp;action=home&amp;mapa=<?php echo urlencode($m); ?>">
                                <img src="imagenes/mapas/<?php echo htmlspecialchars($m); ?>.png" alt="<?php echo htmlspecialchars($m); ?>" class="map-img" loading="lazy">
                                <span class="map-overlay" aria-hidden="true"></span>
                                <span class="map-name"><?php echo htmlspecialchars($m); ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>

            <?php else: ?>

                <header class="section-head section-head-row">
                    <div>
                        <span class="eyebrow">// MAPA SELECCIONADO</span>
                        <h2 class="section-title"><?php echo htmlspecialchars($mapa); ?></h2>
                    </div>
                    <a href="index.php?controlador=team&amp;action=home" class="link-arrow">Cambiar mapa →</a>
                </header>

                <form action="index.php" method="get" id="comp-form">
                    <input type="hidden" name="controlador" value="team">
                    <input type="hidden" name="action" value="home">
                    <input type="hidden" name="mapa" value="<?php echo htmlspecialchars($mapa); ?>">
                    <input type="hidden" name="recomendar" value="1">

                    <!-- paso 2: selector de agentes -->
                    <div class="step-block">
                        <div class="step-block-header">
                            <span class="step-pill">Paso 2</span>
                            <h3 class="subsection-label">Marca los agentes de tu equipo (hasta 5)</h3>
                        </div>

                        <?php
                            $roles_sel = [];
                            if (!empty($seleccionados) && !empty($agentes)) {
                                $por_id_team = [];
                                foreach ($agentes as $a) $por_id_team[(int)$a['id']] = $a['rol'];
                                foreach ($seleccionados as $sid) {
                                    if (isset($por_id_team[$sid])) $roles_sel[$por_id_team[$sid]] = true;
                                }
                            }
                            $roles_orden = ['Duelist','Initiator','Controller','Sentinel'];
                            $roles_label = ['Duelist'=>'Duelista','Initiator'=>'Iniciador','Controller'=>'Controlador','Sentinel'=>'Centinela'];
                            $roles_tip = [
                                'Duelist' => 'Entry fragger: entra primero a ganar espacios.',
                                'Initiator' => 'Abre sites con flashes e información.',
                                'Controller' => 'Bloquea visibilidad con humos.',
                                'Sentinel' => 'Defiende flancos y ancla los sites.',
                            ];
                        ?>

                        <ul class="role-pills" id="role-pills" aria-label="Roles cubiertos">
                            <?php foreach ($roles_orden as $rol): ?>
                                <li class="role-pill tip <?php echo !empty($roles_sel[$rol]) ? 'is-covered' : ''; ?>"
                                    data-role="<?php echo $rol; ?>"
                                    data-tip="<?php echo htmlspecialchars($roles_tip[$rol]); ?>">
                                    <?php echo htmlspecialchars($roles_label[$rol]); ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>

                        <?php
                            $por_rol = ['Duelist'=>[],'Initiator'=>[],'Controller'=>[],'Sentinel'=>[]];
                            foreach ($agentes as $a) {
                                if (isset($por_rol[$a['rol']])) $por_rol[$a['rol']][] = $a;
                            }
                        ?>

                        <?php foreach ($por_rol as $rol => $lista): ?>
                            <?php if (empty($lista)) continue; ?>
                            <div class="step-block">
                                <div class="step-block-header">
                                    <h3 class="subsection-label"><?php echo $rol; ?></h3>
                                </div>
                                <ul class="lineup-agents-row-list">
                                    <?php foreach ($lista as $a): ?>
                                        <?php
                                            $ruta_img = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $a['nombre']))) . '.png';
                                        ?>
                                        <li>
                                            <label class="lineup-agent-chip role-<?php echo strtolower($a['rol']); ?> agent-btn<?php if (in_array((int)$a['id'], $seleccionados, true)) echo ' is-selected'; ?>" data-rol="<?php echo htmlspecialchars($a['rol']); ?>">
                                                <input type="checkbox" name="agentes[]" value="<?php echo $a['id']; ?>" class="sr-only"
                                                    <?php if (in_array((int)$a['id'], $seleccionados, true)) echo 'checked'; ?>>
                                                <img src="<?php echo htmlspecialchars($ruta_img); ?>" alt="<?php echo htmlspecialchars($a['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                                <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($a['nombre']); ?></span>
                                                <span class="lineup-agent-chip-rol"><?php echo htmlspecialchars($a['rol']); ?></span>
                                            </label>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <p class="comp-status" id="comp-status" aria-live="polite">
                        Marca los agentes que ya tenéis y pulsa "Recomendar" cuando termines.
                    </p>

                    <div class="step-block">
                        <div class="filter-actions">
                            <button type="submit" class="btn-primary btn-large btn-recommend">
                                Recomendar el resto del equipo
                            </button>
                        </div>
                    </div>
                </form>

                <!-- resultado de recomendación -->
                <?php if (isset($resultado) && $resultado !== null): ?>
                    <div class="recommendation-result reveal-zoom" id="recommendation-result">
                        <span class="corner corner-tl" aria-hidden="true"></span>
                        <span class="corner corner-tr" aria-hidden="true"></span>
                        <span class="corner corner-bl" aria-hidden="true"></span>
                        <span class="corner corner-br" aria-hidden="true"></span>

                        <header class="rec-map-header">
                            <div class="rec-map-info">
                                <span class="eyebrow">// ANÁLISIS</span>
                                <h2 class="rec-map-name">Recomendaciones en <?php echo htmlspecialchars($mapa); ?></h2>
                            </div>
                        </header>

                        <div class="rec-body">

                            <!-- equipo actual -->
                            <?php if (!empty($resultado['seleccionados'])): ?>
                                <section class="rec-block">
                                    <header class="rec-block-head">
                                        <span class="eyebrow">// EQUIPO ACTUAL · <?php echo count($resultado['seleccionados']); ?> / <?php echo (int)$resultado['team_size']; ?></span>
                                        <h3 class="rec-block-title">Tu equipo hasta ahora</h3>
                                    </header>
                                    <ul class="lineup-agents-row-list">
                                        <?php foreach ($resultado['seleccionados'] as $s): ?>
                                            <?php
                                                $ruta_img_s = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $s['nombre']))) . '.png';
                                            ?>
                                            <li>
                                                <div class="lineup-agent-chip role-<?php echo strtolower($s['rol']); ?> is-active" data-rol="<?php echo htmlspecialchars($s['rol']); ?>">
                                                    <img src="<?php echo htmlspecialchars($ruta_img_s); ?>" alt="<?php echo htmlspecialchars($s['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                                    <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($s['nombre']); ?></span>
                                                    <span class="lineup-agent-chip-rol"><?php echo htmlspecialchars($s['rol']); ?></span>
                                                </div>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul>
                                </section>
                            <?php else: ?>
                                <p class="empty-hint">No has marcado ningún agente. Las recomendaciones son por meta del mapa.</p>
                            <?php endif; ?>

                            <!-- secciones de roles faltantes -->
                            <?php if (!empty($resultado['secciones'])): ?>
                                <?php foreach ($resultado['secciones'] as $sec): ?>
                                    <?php $rol = $sec['rol']; $opciones = $sec['opciones']; ?>
                                    <section class="rec-block rec-block-rol-<?php echo strtolower($rol); ?>">
                                        <header class="rec-block-head">
                                            <span class="eyebrow agent-rol-<?php echo strtolower($rol); ?>">
                                                // SLOT <?php echo (int)$sec['slot_num']; ?> / <?php echo (int)$resultado['team_size']; ?> · <?php echo htmlspecialchars(strtoupper($rol)); ?> FALTANTE
                                            </span>
                                            <h3 class="rec-block-title">
                                                OS FALTA UN
                                                <span class="rec-rol-chip agent-rol-<?php echo strtolower($rol); ?>">[<?php echo htmlspecialchars(strtoupper(rol_es($rol))); ?>]</span>
                                                <?php if ($sec['occurrence'] > 1): ?>
                                                    <span class="rec-occurrence">(doble <?php echo htmlspecialchars(strtolower(rol_es($rol))); ?>)</span>
                                                <?php endif; ?>
                                            </h3>
                                            <p class="rec-block-intro"><?php echo htmlspecialchars(descripcion_rol($rol)); ?></p>
                                            <p class="rec-block-hint">Top <?php echo count($opciones); ?> opciones en <?php echo htmlspecialchars($mapa); ?>:</p>
                                        </header>
                                        <?php if (empty($opciones)): ?>
                                            <p class="empty-hint">No encontré agentes disponibles de este rol.</p>
                                        <?php else: ?>
                                            <ul class="lineup-agents-row-list">
                                                <?php foreach ($opciones as $i => $a): ?>
                                                    <?php
                                                        $ruta_img_a = 'imagenes/agentes/' . ucfirst(strtolower(str_replace('/', '', $a['nombre']))) . '.png';
                                                    ?>
                                                    <li>
                                                        <div class="lineup-agent-chip role-<?php echo strtolower($a['rol']); ?>" data-rol="<?php echo htmlspecialchars($a['rol']); ?>">
                                                            <sup class="rank-badge">#<?php echo $i + 1; ?></sup>
                                                            <img src="<?php echo htmlspecialchars($ruta_img_a); ?>" alt="<?php echo htmlspecialchars($a['nombre']); ?>" class="lineup-agent-chip-img" loading="lazy">
                                                            <span class="lineup-agent-chip-name"><?php echo htmlspecialchars($a['nombre']); ?></span>
                                                            <span class="lineup-agent-chip-rol"><?php echo htmlspecialchars($a['rol']); ?></span>
                                                        </div>
                                                    </li>
                                                <?php endforeach; ?>
                                            </ul>
                                        <?php endif; ?>
                                    </section>
                                <?php endforeach; ?>
                            <?php endif; ?>

                            <!-- rating del equipo completo -->
                            <?php if (!empty($resultado['team_rating'])): ?>
                                <?php $tr = $resultado['team_rating']; ?>
                                <section class="rec-block team-rating-block">
                                    <header class="rec-block-head">
                                        <span class="eyebrow">// TEAM RATING · <?php echo htmlspecialchars($mapa); ?></span>
                                        <h3 class="rec-block-title">Valoración del equipo</h3>
                                    </header>
                                    <div class="team-rating-grid">
                                        <div class="team-rating-score team-rating-<?php echo strtolower($tr['label']); ?>">
                                            <span class="team-rating-label">Tier</span>
                                            <strong class="team-rating-big"><?php echo htmlspecialchars($tr['label']); ?></strong>
                                            <span class="team-rating-avg"><?php echo htmlspecialchars($tr['score_avg']); ?> / <?php echo (int)$tr['score_max']; ?></span>
                                        </div>
                                        <ul class="team-rating-roles">
                                            <?php
                                                $roles_info = [
                                                    'Duelist' => ['es'=>'Duelistas', 'ok'=>$tr['conteos']['Duelist'] >= 1 && $tr['conteos']['Duelist'] <= 2],
                                                    'Initiator' => ['es'=>'Iniciadores', 'ok'=>$tr['conteos']['Initiator'] >= 1],
                                                    'Controller' => ['es'=>'Controladores', 'ok'=>$tr['conteos']['Controller'] >= 1],
                                                    'Sentinel' => ['es'=>'Centinelas', 'ok'=>$tr['conteos']['Sentinel'] >= 1],
                                                ];
                                            ?>
                                            <?php foreach ($roles_info as $r => $info): ?>
                                                <li class="team-rating-role role-<?php echo strtolower($r); ?> <?php echo $info['ok'] ? 'is-ok' : 'is-off'; ?>">
                                                    <span class="team-rating-role-count"><?php echo (int)$tr['conteos'][$r]; ?></span>
                                                    <span class="team-rating-role-label"><?php echo htmlspecialchars($info['es']); ?></span>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    </div>
                                    <p class="team-rating-msg <?php echo $tr['balance_ok'] ? 'is-ok' : 'is-off'; ?>">
                                        <?php if ($tr['balance_ok']): ?>
                                            ✓ Composición balanceada para <?php echo htmlspecialchars($mapa); ?>. Team tier <strong><?php echo htmlspecialchars($tr['label']); ?></strong>.
                                        <?php else: ?>
                                            ⚠ Composición desbalanceada — revisad los roles (máx 2 Duelistas; mín 1 Iniciador, Controlador y Centinela).
                                        <?php endif; ?>
                                    </p>
                                </section>
                            <?php endif; ?>

                        </div>
                    </div>
                <?php endif; ?>

            <?php endif; ?>

        </div>
    </section>

</main>
