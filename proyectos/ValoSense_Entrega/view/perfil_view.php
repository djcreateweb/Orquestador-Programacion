<?php require_once("view/menu.php"); ?>

<?php
$inicial = strtoupper(substr($perfil['username'] ?? '??', 0, 2));
$rango_raw = $perfil['rango'] ?? '';
$rangos_validos = ['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'];
// extrae nombre base del rango para css
$partes_rango = explode(' ', strtolower(trim($rango_raw)));
$rango_base = $partes_rango[0];
$rango_class = in_array($rango_base, $rangos_validos) ? 'rank-' . $rango_base : '';
// determina si el visitante puede ver el riot id
$puede_ver_riot = ($estado === 'yo_mismo' || ($estado === 'amigo' && !empty($perfil['riot_id_visible'])));
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

    <!-- hero de perfil -->
    <section class="perfil-hero reveal <?php echo htmlspecialchars($rango_class); ?>">
        <div class="container">
            <div class="perfil-hero-card <?php echo htmlspecialchars($rango_class); ?>">
                <span class="corner corner-tl" aria-hidden="true"></span>
                <span class="corner corner-tr" aria-hidden="true"></span>
                <span class="corner corner-bl" aria-hidden="true"></span>
                <span class="corner corner-br" aria-hidden="true"></span>

                <div class="perfil-avatar-wrap">
                    <div class="perfil-avatar"><?php echo htmlspecialchars($inicial); ?></div>
                    <?php if (($perfil['estado_presencia'] ?? '') === 'en_linea'): ?>
                        <span class="status-dot status-online" aria-label="En línea"></span>
                    <?php elseif (($perfil['estado_presencia'] ?? '') === 'ausente'): ?>
                        <span class="status-dot status-away" aria-label="Ausente"></span>
                    <?php endif; ?>
                </div>

                <div class="perfil-header-info">
                    <span class="perfil-eyebrow">// PERFIL · JUGADOR</span>
                    <h1 class="perfil-username <?php echo !empty($perfil['es_admin']) ? 'is-admin' : ''; ?>">
                        <?php echo htmlspecialchars($perfil['username']); ?>
                        <?php if (!empty($perfil['es_admin'])): ?>
                            <span class="badge badge--cyan">ADMIN</span>
                        <?php endif; ?>
                    </h1>
                    <?php if (isset($perfil['perfil_completo']) && $perfil['perfil_completo'] === 'no'): ?>
                    <div class="perfil-incompleto">
                        <p>Perfil competitivo incompleto.</p>
                        <p>Completa tus datos para aparecer en el ranking y usar el matchmaker.</p>
                        <a href="index.php?controlador=usuario&action=completar_perfil" class="btn-primary">Completar perfil</a>
                    </div>
                    <?php else: ?>
                    <?php
                    $rango_completo = isset($perfil['rango']) ? $perfil['rango'] : 'Iron 1';
                    $rango_rr = isset($perfil['rango_rr']) ? (int)$perfil['rango_rr'] : 0;
                    $partes = explode(' ', $rango_completo);
                    $rango_base = $partes[0];
                    $tier = isset($partes[1]) ? $partes[1] : '';
                    if ($rango_base === 'Radiant') {
                        $img_rango = 'imagenes/rangos/Radiant_Rank.png';
                        $rr_pct = min(100, ($rango_rr / 800) * 100);
                        $rr_label = $rango_rr . ' RR';
                    } else {
                        $img_rango = 'imagenes/rangos/' . $rango_base . '_' . $tier . '_Rank.png';
                        $rr_pct = min(100, $rango_rr);
                        $rr_label = $rango_rr . ' / 100 RR';
                    }
                    ?>
                    <div class="perfil-rango-bloque">
                        <?php if (!empty($rango_base) && $rango_completo !== 'Sin clasificar'): ?>
                        <img src="<?php echo htmlspecialchars($img_rango); ?>" alt="<?php echo htmlspecialchars($rango_completo); ?>" class="perfil-rango-img">
                        <?php else: ?>
                        <span class="perfil-sin-rango">Sin clasificar</span>
                        <?php endif; ?>
                        <div class="perfil-rango-info">
                            <span class="perfil-rango-nombre"><?php echo htmlspecialchars($rango_completo); ?></span>
                            <div class="perfil-rr-barra-wrap">
                                <div class="perfil-rr-barra" style="width: <?php echo $rr_pct; ?>%"></div>
                            </div>
                            <span class="perfil-rr-label"><?php echo htmlspecialchars($rr_label); ?></span>
                        </div>
                    </div>
                    <?php endif; ?>
                    <ul class="perfil-meta-badges">
                        <li>
                            <span class="perfil-pill">
                                <span class="perfil-pill-key">Región</span>
                                <span class="perfil-pill-value"><?php echo htmlspecialchars($perfil['region'] ?? '-'); ?></span>
                            </span>
                        </li>
                    </ul>
                </div>

                <!-- acciones según estado de relación -->
                <div class="perfil-actions">
                    <?php if ($estado === 'yo_mismo'): ?>
                        <a href="index.php?controlador=usuario&amp;action=ajustes" class="btn-primary btn-small">Editar mi cuenta</a>

                    <?php elseif ($estado === 'amigo'): ?>
                        <span class="amistad-status amigo">✓ Amigo</span>
                        <a href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo $perfil['id']; ?>" class="btn-ghost btn-small">Mensaje</a>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post">
                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                            <button type="submit" class="btn-ghost btn-small">Eliminar amigo</button>
                        </form>

                    <?php elseif ($estado === 'pendiente_enviada'): ?>
                        <span class="amistad-status pendiente">Invitación enviada</span>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=eliminar" method="post">
                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                            <button type="submit" class="btn-secondary btn-small">Cancelar invitación</button>
                        </form>

                    <?php elseif ($estado === 'pendiente_recibida'): ?>
                        <span class="amistad-status pendiente">Te ha invitado</span>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=aceptar" method="post">
                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                            <button type="submit" class="btn-primary btn-small">Aceptar</button>
                        </form>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=rechazar" method="post">
                            <input type="hidden" name="id" value="<?php echo $rel_id; ?>">
                            <button type="submit" class="btn-secondary btn-small">Rechazar</button>
                        </form>

                    <?php else: ?>
                        <form class="inline-form" action="index.php?controlador=amistad&amp;action=invitar" method="post">
                            <input type="hidden" name="target_id" value="<?php echo $perfil['id']; ?>">
                            <button type="submit" class="btn-primary btn-small">+ Invitar como amigo</button>
                        </form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- riot id -->
    <section class="perfil-section">
        <div class="container">
            <section class="riot-card <?php echo $puede_ver_riot ? 'riot-card--on' : 'riot-card--off'; ?>">
                <header class="riot-card-head">
                    <div class="riot-card-head-text">
                        <span class="riot-card-eyebrow">// RIOT ID · VALORANT</span>
                        <h3 class="riot-card-title">Añádelo en el juego</h3>
                    </div>
                    <?php if ($puede_ver_riot && !empty($perfil['riot_region'])): ?>
                        <span class="riot-card-region"><?php echo htmlspecialchars(strtoupper($perfil['riot_region'])); ?></span>
                    <?php endif; ?>
                </header>

                <?php if ($puede_ver_riot && !empty($perfil['riot_id'])): ?>
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
                    <?php if ($estado === 'yo_mismo'): ?>
                        <p class="riot-card-hint">
                            Este es tu Riot ID público para amigos.
                            <a href="index.php?controlador=usuario&amp;action=ajustes">Gestiona la visibilidad en Ajustes.</a>
                        </p>
                    <?php else: ?>
                        <p class="riot-card-hint">Envía la solicitud desde Valorant para jugar juntos.</p>
                    <?php endif; ?>

                <?php elseif ($puede_ver_riot && empty($perfil['riot_id'])): ?>
                    <div class="riot-card-empty-wrap">
                        <div class="riot-card-empty-body">
                            <p class="riot-card-empty">Todavía no has vinculado tu cuenta de Valorant.</p>
                            <a class="btn-primary btn-small" href="index.php?controlador=usuario&amp;action=completar_perfil">Vincular cuenta</a>
                        </div>
                    </div>

                <?php else: ?>
                    <div class="riot-card-empty-wrap">
                        <div class="riot-card-empty-body">
                            <?php if (!isset($_SESSION['usuario'])): ?>
                                <p class="riot-card-empty">Inicia sesión para ver el Riot ID de este jugador.</p>
                                <a class="btn-primary btn-small" href="index.php?controlador=usuario&amp;action=home">Iniciar sesión</a>
                            <?php elseif ($estado === 'ninguno' || $estado === 'pendiente_enviada'): ?>
                                <p class="riot-card-empty">Solo los amigos pueden ver el Riot ID.</p>
                            <?php else: ?>
                                <p class="riot-card-empty">Este jugador ha preferido mantener su Riot ID privado.</p>
                                <a class="btn-ghost btn-small" href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo $perfil['id']; ?>">Abrir chat</a>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </section>
        </div>
    </section>

    <!-- agentes favoritos -->
    <section class="perfil-section">
        <div class="container">
            <header class="section-head">
                <span class="eyebrow">// AGENTES</span>
                <h2 class="section-title">
                    Favoritos de <span class="text-red"><?php echo htmlspecialchars($perfil['username']); ?></span>
                    <span class="badge badge--muted"><?php echo count($favoritos); ?></span>
                </h2>
            </header>

            <?php if (empty($favoritos)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin agentes favoritos</h3>
                    <p class="empty-desc">Este jugador todavía no ha elegido agentes preferidos.</p>
                </div>
            <?php else: ?>
                <ul class="perfil-agents-grid reveal-stagger">
                    <?php foreach ($favoritos as $f): ?>
                        <li class="perfil-agent-card reveal role-<?php echo strtolower($f['rol']); ?>">
                            <img src="imagenes/agentes/<?php echo htmlspecialchars(ucfirst(strtolower(str_replace('/', '', $f['agente'])))); ?>.png"
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

<script>
(function () {
    // copiar riot id con fallback
    var btns = document.querySelectorAll('[data-copy-riot]');
    for (var i = 0; i < btns.length; i++) {
        (function (btn) {
            btn.addEventListener('click', function () {
                var val = btn.getAttribute('data-copy-riot') || '';
                if (!val) return;
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(val).then(function () {
                        btn.textContent = 'Copiado ✓';
                        setTimeout(function () { btn.textContent = 'Copiar Riot ID'; }, 1600);
                    });
                } else {
                    var ta = document.createElement('textarea');
                    ta.value = val;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    btn.textContent = 'Copiado ✓';
                    setTimeout(function () { btn.textContent = 'Copiar Riot ID'; }, 1600);
                }
            });
        })(btns[i]);
    }
})();
</script>
