<?php require_once("view/menu.php"); ?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Encontrar equipo</li>
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
            <span class="eyebrow">// MATCHMAKER · MÓDULO 01</span>
            <h1 class="hero-title">Encuentra tu <span class="text-red">equipo</span> ideal</h1>
            <p class="hero-subtitle">Emparejamiento por rango, agente y rol preferido.</p>
            <div class="hero-cta-row">
                <a href="#search" class="btn-primary btn-large btn-magnetic">Buscar ahora</a>
            </div>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true"><span class="sd-eyebrow">// 01 · FILTROS</span></div>

    <!-- filtros -->
    <section class="search-section" id="search">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// CONSULTA</span>
                <h2 class="section-title">Configura tu <span class="text-red">búsqueda</span></h2>
            </header>

            <?php
                $rangos_ui = [
                    'Iron 1' => 'Hierro 1', 'Iron 2' => 'Hierro 2', 'Iron 3' => 'Hierro 3',
                    'Bronze 1' => 'Bronce 1', 'Bronze 2' => 'Bronce 2', 'Bronze 3' => 'Bronce 3',
                    'Silver 1' => 'Plata 1', 'Silver 2' => 'Plata 2', 'Silver 3' => 'Plata 3',
                    'Gold 1' => 'Oro 1', 'Gold 2' => 'Oro 2', 'Gold 3' => 'Oro 3',
                    'Platinum 1' => 'Platino 1', 'Platinum 2' => 'Platino 2', 'Platinum 3' => 'Platino 3',
                    'Diamond 1' => 'Diamante 1', 'Diamond 2' => 'Diamante 2', 'Diamond 3' => 'Diamante 3',
                    'Ascendant 1' => 'Ascendente 1', 'Ascendant 2' => 'Ascendente 2', 'Ascendant 3' => 'Ascendente 3',
                    'Immortal 1' => 'Inmortal 1', 'Immortal 2' => 'Inmortal 2', 'Immortal 3' => 'Inmortal 3',
                    'Radiant' => 'Radiante',
                ];
                $roles_ui = [
                    'Duelist' => 'Duelista', 'Initiator' => 'Iniciador',
                    'Sentinel' => 'Centinela', 'Controller' => 'Controlador',
                ];
                $rango_default = $rango_sel !== "" ? $rango_sel : 'Gold 1';
            ?>

            <?php if (!empty($perfil_incompleto)): ?>
                <div class="matchmaker-aviso">
                    <div class="matchmaker-aviso-body">
                        <span class="matchmaker-aviso-kicker">// PERFIL INCOMPLETO</span>
                        <h3>Encontrar equipo no funcionara todavia</h3>
                        <p>Completa tu Riot ID, rango y RR para poder buscar jugadores y aparecer en el ranking.</p>
                    </div>
                    <a href="index.php?controlador=usuario&amp;action=completar_perfil" class="btn-primary">
                        Completar perfil
                    </a>
                </div>
            <?php endif; ?>

            <form class="search-form" action="index.php?controlador=matchmaker&amp;action=home#resultados" method="post">
                <div class="filter-group">
                    <label class="filter-label" for="rango">Rango</label>
                    <select class="filter-select rank-select rank-<?php echo strtolower($rango_default); ?>" id="rango" name="rango" required>
                        <?php foreach ($rangos_ui as $valor => $label): ?>
                            <option value="<?php echo htmlspecialchars($valor); ?>"
                                    class="rank-<?php echo strtolower($valor); ?>"
                                    <?php echo $rango_default === $valor ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="agente">Agente favorito</label>
                    <select class="filter-select" id="agente" name="agente_id">
                        <option value="">Cualquier agente</option>
                        <?php foreach ($agentes as $a): ?>
                            <option value="<?php echo $a['id']; ?>" <?php echo ($agente_sel ?? '') == $a['id'] ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($a['nombre']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="rol">Rol preferido</label>
                    <select class="filter-select" id="rol" name="rol">
                        <option value="">Cualquier rol</option>
                        <?php foreach ($roles_ui as $valor => $label): ?>
                            <option value="<?php echo htmlspecialchars($valor); ?>" <?php echo ($rol_sel ?? '') === $valor ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-actions">
                    <a class="btn-secondary" href="index.php?controlador=matchmaker&amp;action=home">Limpiar</a>
                    <button class="btn-primary btn-search" type="submit" name="buscar" value="1" <?php echo !empty($perfil_incompleto) ? 'disabled' : ''; ?>>
                        Buscar jugadores
                    </button>
                </div>
            </form>
        </div>
    </section>

    <div class="section-divider" aria-hidden="true"><span class="sd-eyebrow">// 02 · RESULTADOS</span></div>

    <!-- resultados -->
    <section class="results-section" id="resultados">
        <div class="container">

            <?php if (isset($message) && $message !== ""): ?>
                <div class="empty-state reveal">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin resultados</h3>
                    <p class="empty-desc"><?php echo htmlspecialchars($message); ?></p>
                </div>
            <?php endif; ?>

            <?php if (!empty($jugadores)): ?>
                <div class="results-bar">
                    <h2 class="section-title results-title">
                        Jugadores encontrados
                        <span class="badge badge--cyan"><?php echo count($jugadores); ?></span>
                    </h2>
                </div>

                <div class="players-grid reveal-stagger" id="players-grid">
                    <?php foreach ($jugadores as $j): ?>
                        <?php
                            $nombre   = $j['username'] ?? 'Jugador';
                            $rango_j  = $j['rango'] ?? '';
                            $region_j = $j['region'] ?? 'EU';
                            $agente_j = $j['agente'] ?? '';
                            $rol_j    = $j['rol'] ?? '';
                            $inicial  = strtoupper(substr($nombre, 0, 2));
                            $rel_estado = $j['rel_estado'] ?? 'ninguno';
                            $rel_id     = $j['rel_id'] ?? 0;
                        ?>
                        <article class="player-card tilt-card reveal">
                            <span class="corner corner-tl" aria-hidden="true"></span>
                            <span class="corner corner-tr" aria-hidden="true"></span>
                            <span class="corner corner-bl" aria-hidden="true"></span>
                            <span class="corner corner-br" aria-hidden="true"></span>

                            <div class="player-card-header">
                                <div class="player-avatar-wrap">
                                    <div class="player-avatar"><?php echo htmlspecialchars($inicial); ?></div>
                                    <?php if (($j['estado_presencia'] ?? '') === 'en_linea'): ?>
                                        <span class="status-dot status-online" aria-label="En línea"></span>
                                    <?php elseif (($j['estado_presencia'] ?? '') === 'ausente'): ?>
                                        <span class="status-dot status-away" aria-label="Ausente"></span>
                                    <?php endif; ?>
                                </div>
                                <div class="player-info">
                                    <h3 class="player-name"><?php echo htmlspecialchars($nombre); ?></h3>
                                    <div class="player-meta">
                                        <span class="player-region"><?php echo htmlspecialchars($region_j); ?></span>
                                        <?php if ($rol_j): ?>
                                            <span class="player-sep">·</span>
                                            <span class="player-lang"><?php echo htmlspecialchars($rol_j); ?></span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php if ($rango_j): ?>
                                    <div class="player-rank">
                                        <span class="rank-name rank-<?php echo strtolower($rango_j); ?>"><?php echo htmlspecialchars($rango_j); ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <?php if ($agente_j): ?>
                                <div class="player-card-body">
                                    <p class="player-agents-label">Agente favorito</p>
                                    <div class="player-agents">
                                        <span class="agent-tag"><?php echo htmlspecialchars($agente_j); ?></span>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <footer class="player-card-footer">
                                <div class="player-actions">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $j['id']; ?>" class="btn-ghost btn-small">Ver perfil</a>

                                    <?php if ($rel_estado === 'amigo'): ?>
                                        <span class="amistad-status amigo">✓ Amigo</span>

                                    <?php elseif ($rel_estado === 'pendiente_enviada'): ?>
                                        <span class="amistad-status pendiente">Pendiente</span>

                                    <?php elseif ($rel_estado === 'pendiente_recibida'): ?>
                                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=aceptar" method="post">
                                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                                            <button type="submit" class="btn-primary btn-small">Aceptar invitación</button>
                                        </form>

                                    <?php else: ?>
                                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=invitar" method="post">
                                            <input type="hidden" name="target_id" value="<?php echo $j['id']; ?>">
                                            <button type="submit" class="btn-primary btn-small">Invitar</button>
                                        </form>
                                    <?php endif; ?>
                                </div>
                            </footer>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

        </div>
    </section>

</main>
