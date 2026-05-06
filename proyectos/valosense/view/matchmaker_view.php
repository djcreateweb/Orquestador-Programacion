<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Encontrar equipo</li>
            </ol>
        </div>
    </nav>

    <!-- Hero principal -->
    <section class="hero">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="hero-grid-bg" aria-hidden="true"></div>

        <div class="container hero-content">
            <span class="eyebrow">// MATCHMAKER · MÓDULO 01</span>
            <h1 class="hero-title">Encuentra tu <span class="text-red">equipo</span> ideal</h1>
            <p class="hero-subtitle">Emparejamiento por rango, agente y rol preferido. Sin toxicidad, sin AFKs.</p>

            <div class="hero-cta-row">
                <a href="#search" class="btn-primary btn-large btn-magnetic">Buscar ahora</a>
                <a href="#search" class="btn-ghost btn-large">Configurar búsqueda</a>
            </div>

            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-num">
                        <span class="hero-stat-value" data-count-up="12.4">0</span><span class="hero-stat-suffix">K</span>
                    </span>
                    <span class="hero-stat-label">Jugadores activos</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-num">
                        <span class="hero-stat-value" data-count-up="847">0</span>
                    </span>
                    <span class="hero-stat-label">Online ahora</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-num">
                        <span class="hero-stat-value" data-count-up="96">0</span><span class="hero-stat-suffix">%</span>
                    </span>
                    <span class="hero-stat-label">Match positivo</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-num">
                        <span class="hero-stat-value" data-count-up="6">0</span>
                    </span>
                    <span class="hero-stat-label">Regiones</span>
                </li>
            </ul>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 01 · FILTROS</span>
    </div>

    <!-- Filtros de búsqueda -->
    <section class="search-section" id="search">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// CONSULTA</span>
                <h2 class="section-title">Configura tu <span class="text-red">búsqueda</span></h2>
                <p class="section-subtitle">Cuantos más filtros apliques, mejor será tu match.</p>
            </header>

            <?php
                // Rangos (label ES → value EN coincidente con ENUM en BD)
                $rangos_ui = [
                    'Iron'      => 'Hierro',
                    'Bronze'    => 'Bronce',
                    'Silver'    => 'Plata',
                    'Gold'      => 'Oro',
                    'Platinum'  => 'Platino',
                    'Diamond'   => 'Diamante',
                    'Ascendant' => 'Ascendente',
                    'Immortal'  => 'Inmortal',
                    'Radiant'   => 'Radiante',
                ];
                // Roles (label ES → value EN coincidente con ENUM agente.rol)
                $roles_ui = [
                    'Duelist'    => 'Duelista',
                    'Initiator'  => 'Iniciador',
                    'Sentinel'   => 'Centinela',
                    'Controller' => 'Controlador',
                ];
                $rango_default = $rango_sel !== "" ? $rango_sel : 'Gold';
            ?>

            <form class="search-form" action="index.php?controlador=matchmaker&amp;action=home#resultados" method="post" data-no-keep-scroll>

                <div class="filter-group">
                    <label class="filter-label" for="rango">Rango</label>
                    <select class="filter-select rank-select rank-<?php echo strtolower($rango_default); ?>" id="rango" name="rango" required>
                        <?php foreach($rangos_ui as $valor => $label): ?>
                            <option value="<?php echo htmlspecialchars($valor); ?>"
                                    class="rank-<?php echo strtolower($valor); ?>"
                                    <?php echo ($rango_default === $valor ? 'selected' : ''); ?>>
                                <?php echo htmlspecialchars($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="agente">Agente favorito</label>
                    <select class="filter-select" id="agente" name="agente_id">
                        <option value="">Cualquier agente</option>
                        <?php foreach($agentes as $a): ?>
                            <option value="<?php echo (int)$a['id']; ?>" <?php echo ((string)($agente_sel ?? '') === (string)$a['id'] ? 'selected' : ''); ?>>
                                <?php echo htmlspecialchars($a['nombre']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="rol">Rol preferido</label>
                    <select class="filter-select" id="rol" name="rol">
                        <option value="">Cualquier rol</option>
                        <?php foreach($roles_ui as $valor => $label): ?>
                            <option value="<?php echo htmlspecialchars($valor); ?>" <?php echo (($rol_sel ?? '') === $valor ? 'selected' : ''); ?>>
                                <?php echo htmlspecialchars($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-actions">
                    <button class="btn-secondary" type="reset">Limpiar</button>
                    <button class="btn-primary btn-search" type="submit" name="buscar" value="1">Buscar jugadores</button>
                </div>

            </form>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true">
        <span class="sd-eyebrow">// 02 · RESULTADOS</span>
    </div>

    <!-- Resultados + recomendación -->
    <section class="results-section" id="resultados">
        <div class="container">

            <?php
                // Construir chips de filtros activos
                $chips_activos = [];
                if(!empty($rango_sel))  $chips_activos[] = ['tipo'=>'rango', 'label'=>'Rango: '.($rangos_ui[$rango_sel] ?? $rango_sel), 'valor'=>$rango_sel];
                if(!empty($rol_sel))    $chips_activos[] = ['tipo'=>'rol',   'label'=>'Rol: '.($roles_ui[$rol_sel] ?? $rol_sel)];
                if(!empty($agente_sel)){
                    $nombre_ag = '';
                    foreach($agentes as $a){ if((int)$a['id'] === (int)$agente_sel){ $nombre_ag = $a['nombre']; break; } }
                    if($nombre_ag !== '') $chips_activos[] = ['tipo'=>'agente', 'label'=>'Agente: '.$nombre_ag];
                }
            ?>
            <?php if(!empty($chips_activos)): ?>
                <div class="chip-row reveal" aria-label="Filtros activos">
                    <?php foreach($chips_activos as $ch): ?>
                        <?php
                            $chip_extra = '';
                            if($ch['tipo'] === 'rango' && !empty($ch['valor'])){
                                $chip_extra = ' chip-rank rank-' . strtolower($ch['valor']);
                            }
                        ?>
                        <span class="chip<?php echo $chip_extra; ?>"><?php echo htmlspecialchars($ch['label']); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if(isset($message) && $message !== ""): ?>
                <div class="empty-state reveal">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin resultados</h3>
                    <p class="empty-desc"><?php echo htmlspecialchars($message); ?></p>
                </div>
            <?php endif; ?>

            <?php if(!empty($jugadores)): ?>
                <div class="results-bar">
                    <h2 class="section-title results-title">
                        Jugadores encontrados
                        <span class="badge badge--cyan"><?php echo count($jugadores); ?></span>
                    </h2>
                </div>

                <div class="players-grid reveal-stagger" id="players-grid">
                    <?php foreach($jugadores as $j): ?>
                        <?php
                            $nombre = $j['username'] ?? ($j['nombre'] ?? 'Jugador');
                            $rango_j = $j['rango'] ?? '';
                            $region_j = $j['region'] ?? 'EU';
                            $agente_j = $j['agente'] ?? '';
                            $rol_j = $j['rol'] ?? '';
                            $inicial = strtoupper(substr($nombre, 0, 2));

                            // Stats falsos deterministas por username (mismo user = mismos stats)
                            $seed = abs(crc32((string)$nombre));
                            $fake_kd     = number_format(0.75 + ($seed % 180) / 100, 2);
                            $fake_wr     = 42 + ($seed % 38);              // 42–79 %
                            $fake_hs     = 15 + ($seed % 33);              // 15–47 %
                            $fake_hours  = 180 + ($seed % 1820);           // 180–1999
                            $fake_games  = 420 + ($seed % 2880);           // 420–3299
                            $estilos_opts = ['Agresivo','Táctico','Soporte','Entry fragger','Lurker','Clutch player'];
                            $fake_estilo = $estilos_opts[$seed % count($estilos_opts)];
                            $disp_opts = ['Tardes 18-22h','Noches 22-02h','Fines de semana','Mañanas','Flexible'];
                            $fake_disp = $disp_opts[$seed % count($disp_opts)];
                            $langs_by_region = [
                                'EU'=>'Español · Inglés','NA'=>'Inglés','LATAM'=>'Español',
                                'BR'=>'Portugués','AP'=>'Inglés','KR'=>'Coreano'
                            ];
                            $fake_lang = $langs_by_region[$region_j] ?? 'Inglés';
                            $fake_nivel = 60 + ($seed % 240);              // Nivel 60-299
                        ?>
                        <article class="player-card tilt-card reveal"
                                 data-username="<?php echo htmlspecialchars($nombre, ENT_QUOTES); ?>"
                                 data-rango="<?php echo htmlspecialchars($rango_j, ENT_QUOTES); ?>"
                                 data-region="<?php echo htmlspecialchars($region_j, ENT_QUOTES); ?>"
                                 data-agente="<?php echo htmlspecialchars($agente_j, ENT_QUOTES); ?>"
                                 data-rol="<?php echo htmlspecialchars($rol_j, ENT_QUOTES); ?>"
                                 data-inicial="<?php echo htmlspecialchars($inicial, ENT_QUOTES); ?>"
                                 data-kd="<?php echo $fake_kd; ?>"
                                 data-wr="<?php echo $fake_wr; ?>"
                                 data-hs="<?php echo $fake_hs; ?>"
                                 data-hours="<?php echo $fake_hours; ?>"
                                 data-games="<?php echo $fake_games; ?>"
                                 data-nivel="<?php echo $fake_nivel; ?>"
                                 data-estilo="<?php echo htmlspecialchars($fake_estilo, ENT_QUOTES); ?>"
                                 data-disp="<?php echo htmlspecialchars($fake_disp, ENT_QUOTES); ?>"
                                 data-lang="<?php echo htmlspecialchars($fake_lang, ENT_QUOTES); ?>">
                            <span class="corner corner-tl" aria-hidden="true"></span>
                            <span class="corner corner-tr" aria-hidden="true"></span>
                            <span class="corner corner-bl" aria-hidden="true"></span>
                            <span class="corner corner-br" aria-hidden="true"></span>

                            <div class="player-card-header">
                                <div class="player-avatar-wrap">
                                    <div class="player-avatar"><?php echo htmlspecialchars($inicial); ?></div>
                                    <?php
                                        $p = presencia_visible($j['estado_presencia'] ?? null, $j['ultima_actividad'] ?? null);
                                        if ($p === 'en_linea'):
                                    ?>
                                        <span class="status-dot status-online" aria-label="En línea"></span>
                                    <?php elseif ($p === 'ausente'): ?>
                                        <span class="status-dot status-away" aria-label="Ausente"></span>
                                    <?php endif; ?>
                                </div>
                                <div class="player-info">
                                    <h3 class="player-name"><?php echo htmlspecialchars($nombre); ?></h3>
                                    <div class="player-meta">
                                        <span class="player-region"><?php echo htmlspecialchars($region_j); ?></span>
                                        <?php if($rol_j): ?>
                                            <span class="player-sep">·</span>
                                            <span class="player-lang"><?php echo htmlspecialchars($rol_j); ?></span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php if($rango_j): ?>
                                    <div class="player-rank">
                                        <span class="rank-name rank-<?php echo strtolower($rango_j); ?>"><?php echo htmlspecialchars($rango_j); ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <?php if($agente_j): ?>
                                <div class="player-card-body">
                                    <p class="player-agents-label">Agente favorito</p>
                                    <div class="player-agents">
                                        <span class="agent-tag"><?php echo htmlspecialchars($agente_j); ?></span>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- Mini-stats en la tarjeta (con tooltips didácticos) -->
                            <ul class="player-mini-stats" aria-label="Estadísticas">
                                <li>
                                    <span class="mini-stat-value"><?php echo $fake_kd; ?></span>
                                    <span class="mini-stat-label tip" data-tip="Kills / Deaths · bajas por muerte. Mayor que 1.0 es positivo."><abbr title="Kills / Deaths">K/D</abbr></span>
                                </li>
                                <li>
                                    <span class="mini-stat-value"><?php echo $fake_wr; ?>%</span>
                                    <span class="mini-stat-label tip" data-tip="Porcentaje de partidas ganadas sobre el total jugadas.">Winrate</span>
                                </li>
                                <li>
                                    <span class="mini-stat-value"><?php echo $fake_hs; ?>%</span>
                                    <span class="mini-stat-label tip" data-tip="Headshot %: porcentaje de balas que impactan en la cabeza."><abbr title="Headshot %">HS</abbr></span>
                                </li>
                            </ul>

                            <footer class="player-card-footer">
                                <div class="player-actions">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$j['id']; ?>"
                                       class="btn-ghost btn-small">Ver perfil</a>

                                    <?php
                                        $rel_estado = $j['rel_estado'] ?? 'ninguno';
                                        $rel_id     = (int)($j['rel_id'] ?? 0);
                                        $redirect_mm = 'index.php?' . ($_SERVER['QUERY_STRING'] ?? 'controlador=matchmaker&action=home');
                                    ?>
                                    <?php if($rel_estado === 'amigo'): ?>
                                        <span class="amistad-status amigo">✓ Amigo</span>

                                    <?php elseif($rel_estado === 'pendiente_enviada'): ?>
                                        <span class="amistad-status pendiente">Pendiente</span>

                                    <?php elseif($rel_estado === 'pendiente_recibida'): ?>
                                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=aceptar" method="post">
                                            <?php echo csrf_field(); ?>
                                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_mm); ?>">
                                            <button type="submit" class="btn-primary btn-small">Aceptar invitación</button>
                                        </form>

                                    <?php else: ?>
                                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=invitar" method="post">
                                            <?php echo csrf_field(); ?>
                                            <input type="hidden" name="target_id" value="<?php echo (int)$j['id']; ?>">
                                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_mm); ?>">
                                            <button type="submit" class="btn-primary btn-small">Invitar</button>
                                        </form>
                                    <?php endif; ?>
                                </div>
                            </footer>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if(isset($respuesta_bot) && $respuesta_bot !== ""): ?>
                <aside class="bot-response" aria-labelledby="bot-title">
                    <div class="bot-response-header">
                        <span class="bot-icon" aria-hidden="true">VS</span>
                        <div class="bot-response-meta">
                            <h3 class="bot-title" id="bot-title">Recomendación ValoSense</h3>
                            <span class="bot-sub">Análisis basado en tus filtros</span>
                        </div>
                        <span class="bot-badge">AI</span>
                    </div>
                    <div class="bot-response-body">
                        <?php echo nl2br(htmlspecialchars($respuesta_bot)); ?>
                    </div>
                </aside>
            <?php endif; ?>

        </div>
    </section>

</main>
