<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<?php
$inicial = strtoupper(substr($perfil['username'] ?? '??', 0, 2));
$redirect_back = 'index.php?controlador=perfil&action=ver&id=' . (int)$perfil['id'];
$es_perfil_propio = ($estado === 'yo_mismo');

// Slug del rango para aplicar color oficial (--rank-color via .rank-xxx)
$rango_raw  = $perfil['rango'] ?? '';
$rango_slug = strtolower(trim($rango_raw));
$rangos_validos = ['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'];
$rango_class = in_array($rango_slug, $rangos_validos, true) ? 'rank-' . $rango_slug : '';

// Winrate acotado 0-100 para la barra de progreso
$wr_val = max(0, min(100, (int)($stats['wr'] ?? 0)));
?>

<main class="main-content <?php echo htmlspecialchars($rango_class); ?>" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><a href="index.php?controlador=matchmaker&amp;action=home">Matchmaker</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">
                    Perfil de <?php echo htmlspecialchars($perfil['username']); ?>
                </li>
            </ol>
        </div>
    </nav>

    <!-- ============== Hero de perfil ============== -->
    <section class="perfil-hero reveal <?php echo htmlspecialchars($rango_class); ?>">
        <div class="container">
            <div class="perfil-hero-card <?php echo htmlspecialchars($rango_class); ?>">
                <span class="corner corner-tl" aria-hidden="true"></span>
                <span class="corner corner-tr" aria-hidden="true"></span>
                <span class="corner corner-bl" aria-hidden="true"></span>
                <span class="corner corner-br" aria-hidden="true"></span>

                <div class="perfil-avatar-wrap">
                    <div class="perfil-avatar">
                        <?php echo htmlspecialchars($inicial); ?>
                    </div>
                    <?php
                        $p = presencia_visible($perfil['estado_presencia'] ?? null, $perfil['ultima_actividad'] ?? null);
                        if ($p === 'en_linea'):
                    ?>
                        <span class="status-dot status-online" aria-label="En línea"></span>
                    <?php elseif ($p === 'ausente'): ?>
                        <span class="status-dot status-away" aria-label="Ausente"></span>
                    <?php endif; ?>
                </div>

                <div class="perfil-header-info">
                    <span class="perfil-eyebrow">// PERFIL · JUGADOR</span>
                    <?php $nombre_mostrar = nombre_visible($perfil); ?>
                    <h1 class="perfil-username <?php echo !empty($perfil['es_admin']) ? 'is-admin' : ''; ?>">
                        <?php echo htmlspecialchars($nombre_mostrar); ?>
                        <?php if(!empty($perfil['es_admin'])): ?>
                            <span class="badge badge--cyan">ADMIN</span>
                        <?php endif; ?>
                    </h1>
                    <?php if ($nombre_mostrar !== ($perfil['username'] ?? '')): ?>
                        <p class="perfil-handle">@<?php echo htmlspecialchars($perfil['username']); ?></p>
                    <?php endif; ?>
                    <ul class="perfil-meta-badges">
                        <?php if (!empty($rango_raw)): ?>
                            <li>
                                <span class="rank-badge <?php echo htmlspecialchars($rango_class); ?>">
                                    <?php echo htmlspecialchars($rango_raw); ?>
                                </span>
                            </li>
                        <?php endif; ?>
                        <li>
                            <span class="perfil-pill">
                                <span class="perfil-pill-key">Región</span>
                                <span class="perfil-pill-value"><?php echo htmlspecialchars($perfil['region'] ?? '-'); ?></span>
                            </span>
                        </li>
                        <li>
                            <span class="perfil-pill">
                                <span class="perfil-pill-key">Nivel</span>
                                <span class="perfil-pill-value"><?php echo (int)$stats['nivel']; ?></span>
                            </span>
                        </li>
                    </ul>
                </div>

                <!-- Botones según relación con el usuario actual -->
                <div class="perfil-actions">
                    <?php if($estado === 'yo_mismo'): ?>
                        <a href="index.php?controlador=usuario&amp;action=vincular" class="btn-primary btn-small">Editar mi cuenta</a>

                    <?php elseif($estado === 'amigo'): ?>
                        <span class="amistad-status amigo">✓ Amigo</span>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post"
                              data-confirm="¿Quitar a <?php echo htmlspecialchars(addslashes($perfil['username'])); ?> de tus amigos?">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="id" value="<?php echo (int)$rel_id; ?>">
                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_back); ?>">
                            <button type="submit" class="btn-ghost btn-small">Eliminar amigo</button>
                        </form>

                    <?php elseif($estado === 'pendiente_enviada'): ?>
                        <span class="amistad-status pendiente">Invitación enviada</span>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="id" value="<?php echo (int)$rel_id; ?>">
                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_back); ?>">
                            <button type="submit" class="btn-secondary btn-small">Cancelar invitación</button>
                        </form>

                    <?php elseif($estado === 'pendiente_recibida'): ?>
                        <span class="amistad-status pendiente">Te ha invitado</span>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=aceptar" method="post">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="id" value="<?php echo (int)$rel_id; ?>">
                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_back); ?>">
                            <button type="submit" class="btn-primary btn-small">Aceptar</button>
                        </form>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=rechazar" method="post"
                              data-confirm="¿Rechazar la invitación?">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="id" value="<?php echo (int)$rel_id; ?>">
                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_back); ?>">
                            <button type="submit" class="btn-secondary btn-small">Rechazar</button>
                        </form>

                    <?php else: ?>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=invitar" method="post">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="target_id" value="<?php echo (int)$perfil['id']; ?>">
                            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect_back); ?>">
                            <button type="submit" class="btn-primary btn-small">+ Invitar como amigo</button>
                        </form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- ============== Stats ============== -->
    <section class="perfil-section <?php echo htmlspecialchars($rango_class); ?>">
        <div class="container">
            <?php
                $stats_src = $stats['source'] ?? 'demo';
                $eyebrow_source = match($stats_src){
                    'live'   => '// EN VIVO · VALORANT',
                    'cache'  => '// VALORANT · ACTUALIZADO RECIENTEMENTE',
                    'stale'  => '// VALORANT · DATOS CACHEADOS',
                    'error'  => '// VALORANT · NO DISPONIBLE',
                    default  => '// ESTADÍSTICAS · DEMO',
                };
                if (in_array($stats_src, ['live','cache','stale'], true)) {
                    $games_n = (int)($stats['games'] ?? 0);
                    if ($games_n > 0) {
                        $stats_subtitle = 'Basado en tus últimas ' . $games_n . ' competitivas.';
                    } else {
                        $stats_subtitle = 'Aún no hay partidas registradas para esta cuenta.';
                    }
                } elseif ($stats_src === 'error') {
                    $stats_subtitle = 'No hemos podido contactar con Riot. Inténtalo más tarde.';
                } else {
                    $stats_subtitle = $es_propio
                        ? 'Vincula tu cuenta de Riot para ver stats reales.'
                        : 'Este jugador todavía no ha vinculado su cuenta de Riot.';
                }
            ?>
            <?php
                // Datos reales de Valorant: parsear rango, RR y timestamp
                $is_live_data = in_array($stats_src, ['live','cache','stale'], true);
                $rank_str  = trim((string)($stats['rank'] ?? ''));
                $rank_tier = $rank_str !== '' ? strtolower(explode(' ', $rank_str)[0]) : '';
                $rank_slug = in_array($rank_tier, ['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'], true)
                    ? $rank_tier : '';
                $rr_val    = max(0, min(100, (int)($stats['rr'] ?? 0)));
                $fetched_at = trim((string)($stats['fetched_at'] ?? ''));
                $is_eyebrow_live = ($stats_src === 'live');
            ?>
            <header class="section-head">
                <span class="eyebrow <?= $is_eyebrow_live ? 'eyebrow--live' : '' ?>">
                    <?php if ($is_eyebrow_live): ?><span class="live-dot" aria-hidden="true"></span><?php endif; ?>
                    <?= htmlspecialchars($eyebrow_source) ?>
                </span>
                <h2 class="section-title">Rendimiento en <span class="text-red">partidas</span></h2>
                <p class="section-subtitle"><?= htmlspecialchars($stats_subtitle) ?></p>
            </header>

            <?php if ($is_live_data && $rank_slug !== ''): ?>
                <article class="perfil-rank-card rank-<?= htmlspecialchars($rank_slug) ?>" aria-label="Rango actual del jugador">
                    <span class="corner corner-tl" aria-hidden="true"></span>
                    <span class="corner corner-tr" aria-hidden="true"></span>
                    <span class="corner corner-bl" aria-hidden="true"></span>
                    <span class="corner corner-br" aria-hidden="true"></span>

                    <div class="perfil-rank-card__head">
                        <span class="perfil-rank-card__eyebrow">// RANGO ACTUAL &middot; ACTO EN CURSO</span>
                        <?php if ($stats_src === 'live'): ?>
                            <span class="perfil-live-pill perfil-live-pill--live" aria-label="Datos en vivo">
                                <span class="live-dot" aria-hidden="true"></span>EN VIVO
                            </span>
                        <?php elseif ($stats_src === 'cache'): ?>
                            <span class="perfil-live-pill perfil-live-pill--cache" aria-label="Datos cacheados">CACHEADO</span>
                        <?php else: /* stale */ ?>
                            <span class="perfil-live-pill perfil-live-pill--stale" aria-label="Datos antiguos">DESACTUALIZADO</span>
                        <?php endif; ?>
                    </div>

                    <h3 class="perfil-rank-card__name"><?= htmlspecialchars($rank_str) ?></h3>

                    <div class="perfil-rank-card__rr">
                        <div class="perfil-rank-card__bar" role="progressbar"
                             aria-valuenow="<?= $rr_val ?>" aria-valuemin="0" aria-valuemax="100"
                             aria-label="Rank Rating">
                            <div class="perfil-rank-card__bar-fill" style="width: <?= $rr_val ?>%"></div>
                        </div>
                        <div class="perfil-rank-card__rr-text">
                            <strong>RR <?= $rr_val ?></strong><span class="perfil-rank-card__rr-max">/100</span>
                        </div>
                    </div>

                    <?php if ($fetched_at !== ''): ?>
                        <p class="perfil-rank-card__ts">
                            <span class="perfil-rank-card__ts-label">Última actualización:</span>
                            <time class="perfil-rank-card__ts-value" datetime="<?= htmlspecialchars($fetched_at) ?>">
                                <?= htmlspecialchars($fetched_at) ?>
                            </time>
                        </p>
                    <?php endif; ?>
                </article>
            <?php endif; ?>

            <ul class="perfil-stats-grid<?= $is_live_data ? ' perfil-stats-grid--live' : '' ?>">
                <li class="perfil-stat-card" data-stat-kind="combat">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">K/D</span>
                        <span class="perfil-stat-label">Ratio</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo htmlspecialchars($stats['kd']); ?></strong>
                </li>
                <li class="perfil-stat-card has-bar" data-stat-kind="combat">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">%</span>
                        <span class="perfil-stat-label">Winrate</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo $wr_val; ?><span class="unit">%</span></strong>
                    <div class="perfil-stat-bar" aria-hidden="true">
                        <div class="perfil-stat-bar-fill" style="width: <?php echo $wr_val; ?>%"></div>
                    </div>
                </li>
                <li class="perfil-stat-card" data-stat-kind="precision">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">HS</span>
                        <span class="perfil-stat-label">Headshot</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo (int)$stats['hs']; ?><span class="unit">%</span></strong>
                </li>
                <li class="perfil-stat-card" data-stat-kind="volume">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">#</span>
                        <span class="perfil-stat-label">Partidas</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo number_format((int)$stats['games'], 0, ',', '.'); ?></strong>
                </li>
                <li class="perfil-stat-card" data-stat-kind="volume">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">&gt;_</span>
                        <span class="perfil-stat-label">Jugadas</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo number_format((int)$stats['hours'], 0, ',', '.'); ?><span class="unit">h</span></strong>
                </li>
                <li class="perfil-stat-card" data-stat-kind="account">
                    <div class="perfil-stat-head">
                        <span class="perfil-stat-icon" aria-hidden="true">LV</span>
                        <span class="perfil-stat-label">Nivel</span>
                    </div>
                    <strong class="perfil-stat-value"><?php echo (int)$stats['nivel']; ?></strong>
                </li>
            </ul>
        </div>
    </section>

    <!-- ============== Riot ID ============== -->
    <section class="perfil-section">
        <div class="container">

            <?php
                // Determinar si el estado A aplica también en perfil propio
                // (el dueño siempre puede ver su propio Riot ID)
                $mostrar_datos_riot = $puede_ver_riot && !empty($perfil['riot_id']);
            ?>

            <section class="riot-card <?php echo $puede_ver_riot ? 'riot-card--on' : 'riot-card--off'; ?>">
                <header class="riot-card-head">
                    <div class="riot-card-head-text">
                        <span class="riot-card-eyebrow">// RIOT ID · VALORANT</span>
                        <h3 class="riot-card-title">Añádelo en el juego</h3>
                    </div>
                    <?php if ($mostrar_datos_riot && !empty($perfil['riot_region'])): ?>
                        <span class="riot-card-region"><?php echo htmlspecialchars(strtoupper($perfil['riot_region'])); ?></span>
                    <?php endif; ?>
                </header>

                <?php if ($mostrar_datos_riot): ?>
                    <!-- Estado A: visible -->
                    <div class="riot-card-id">
                        <span class="riot-card-name"><?php echo htmlspecialchars($perfil['riot_id']); ?></span>
                        <span class="riot-card-tag">#<?php echo htmlspecialchars($perfil['riot_tag'] ?? ''); ?></span>
                    </div>
                    <div class="riot-card-meta">
                        <button type="button" class="btn-primary btn-small"
                                data-copy-riot="<?php echo htmlspecialchars($perfil['riot_id'] . '#' . ($perfil['riot_tag'] ?? '')); ?>">
                            Copiar Riot ID
                        </button>
                    </div>
                    <?php if ($es_perfil_propio): ?>
                        <p class="riot-card-hint">
                            Este es tu Riot ID público para amigos.
                            <a href="index.php?controlador=usuario&amp;action=ajustes">Gestiona la visibilidad en Ajustes.</a>
                        </p>
                    <?php else: ?>
                        <p class="riot-card-hint">Envía la solicitud desde Valorant para jugar juntos.</p>
                    <?php endif; ?>

                <?php elseif ($puede_ver_riot && empty($perfil['riot_id'])): ?>
                    <!-- Estado A sin cuenta vinculada (perfil propio sin vincular) -->
                    <div class="riot-card-empty-wrap">
                        <span class="riot-card-lock" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="4" y="11" width="16" height="10" rx="2"></rect>
                                <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                            </svg>
                        </span>
                        <div class="riot-card-empty-body">
                            <p class="riot-card-empty">Todavía no has vinculado tu cuenta de Valorant.</p>
                            <a class="btn-primary btn-small" href="index.php?controlador=usuario&amp;action=vincular">Vincular cuenta</a>
                        </div>
                    </div>

                <?php else: ?>
                    <!-- Estado B: no visible — mostrar motivo -->
                    <?php
                        $mensajes_motivo = [
                            'no_logueado' => 'Inicia sesión para ver el Riot ID de este jugador.',
                            'no_amigo'    => 'Solo los amigos pueden ver el Riot ID. Envíale una solicitud de amistad primero.',
                            'sin_vincular'=> 'Este jugador todavía no ha vinculado su cuenta de Valorant. Pídeselo por el chat.',
                            'oculto'      => 'Este jugador ha preferido mantener su Riot ID privado. Pídeselo por el chat si quiere compartirlo.',
                        ];
                        $texto_motivo = $mensajes_motivo[$motivo_riot] ?? 'No puedes ver el Riot ID de este jugador.';
                    ?>
                    <div class="riot-card-empty-wrap">
                        <span class="riot-card-lock" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="4" y="11" width="16" height="10" rx="2"></rect>
                                <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                            </svg>
                        </span>
                        <div class="riot-card-empty-body">
                            <p class="riot-card-empty"><?php echo htmlspecialchars($texto_motivo); ?></p>

                            <?php if ($motivo_riot === 'no_logueado'): ?>
                                <a class="btn-primary btn-small" href="index.php?controlador=usuario&amp;action=login">Iniciar sesión</a>
                            <?php elseif (isset($_SESSION['usuario'])): ?>
                                <a class="btn-ghost btn-small"
                                   href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo (int)$perfil['id']; ?>">
                                    Abrir chat
                                </a>
                            <?php endif; ?>
                        </div>
                    </div>

                <?php endif; ?>
            </section>

        </div>
    </section>

    <!-- ============== Detalles ============== -->
    <section class="perfil-section">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// DETALLES</span>
                <h2 class="section-title">Preferencias de <span class="text-red">juego</span></h2>
            </header>

            <dl class="perfil-details">
                <div class="perfil-detail">
                    <dt>Estilo de juego</dt>
                    <dd><?php echo htmlspecialchars($stats['estilo']); ?></dd>
                </div>
                <div class="perfil-detail">
                    <dt>Disponibilidad</dt>
                    <dd><?php echo htmlspecialchars($stats['disp']); ?></dd>
                </div>
                <div class="perfil-detail">
                    <dt>Idiomas</dt>
                    <dd><?php echo htmlspecialchars($stats['lang']); ?></dd>
                </div>
                <div class="perfil-detail">
                    <dt>Miembro desde</dt>
                    <dd><?php echo htmlspecialchars($perfil['creado_en'] ?? '-'); ?></dd>
                </div>
            </dl>
        </div>
    </section>

    <!-- ============== Agentes favoritos ============== -->
    <section class="perfil-section">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// AGENTES</span>
                <h2 class="section-title">
                    Favoritos de <span class="text-red"><?php echo htmlspecialchars($perfil['username']); ?></span>
                    <span class="badge badge--muted"><?php echo count($favoritos); ?></span>
                </h2>
            </header>

            <?php if(empty($favoritos)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin agentes favoritos</h3>
                    <p class="empty-desc">Este jugador todavía no ha elegido agentes preferidos.</p>
                </div>
            <?php else: ?>
                <ul class="perfil-agents-grid reveal-stagger">
                    <?php foreach($favoritos as $f): ?>
                        <li class="perfil-agent-card reveal role-<?php echo strtolower($f['rol']); ?>">
                            <img src="imagenes/agentes/<?php echo htmlspecialchars($f['agente']); ?>.png"
                                 alt="<?php echo htmlspecialchars($f['agente']); ?>"
                                 class="perfil-agent-img" loading="lazy">
                            <span class="perfil-agent-name"><?php echo htmlspecialchars($f['agente']); ?></span>
                            <span class="perfil-agent-rol rol-<?php echo strtolower($f['rol']); ?>">
                                <?php echo htmlspecialchars($f['rol']); ?>
                            </span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>
    </section>

</main>

<!-- Botón copiar Riot ID: navigator.clipboard con fallback a execCommand -->
<script>
(function () {
    function copiarTexto(texto) {
        // Ruta moderna: sólo disponible en HTTPS o localhost
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(texto);
        }
        // Fallback universal: textarea fuera de pantalla + execCommand('copy')
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = texto;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '0';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, texto.length);
            try {
                var ok = document.execCommand('copy');
                document.body.removeChild(ta);
                ok ? resolve() : reject(new Error('execCommand falló'));
            } catch (e) {
                document.body.removeChild(ta);
                reject(e);
            }
        });
    }

    function feedback(btn, texto, estadoOk) {
        var original = btn.dataset.originalText || btn.textContent;
        btn.dataset.originalText = original;
        btn.textContent = texto;
        btn.classList.toggle('is-copied', !!estadoOk);
        btn.classList.toggle('is-error', !estadoOk);
        clearTimeout(btn._copyTimer);
        btn._copyTimer = setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('is-copied', 'is-error');
        }, 1600);
    }

    document.querySelectorAll('[data-copy-riot]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var val = btn.getAttribute('data-copy-riot') || '';
            if (!val) return;
            copiarTexto(val)
                .then(function () { feedback(btn, 'Copiado ✓', true); })
                .catch(function () { feedback(btn, 'No se pudo copiar', false); });
        });
    });
})();
</script>
