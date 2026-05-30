<?php require_once("view/menu.php"); ?>

<?php
function youtube_embed_admin($url){
    preg_match('/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/', $url, $m);
    return isset($m[1]) ? 'https://www.youtube.com/embed/' . $m[1] : '';
}

function mapa_slug_admin($mapa){
    return strtolower(trim($mapa));
}

function mapa_img_admin($mapa, $lado){
    $slug = mapa_slug_admin($mapa);
    $lado_archivo = strtolower(trim($lado)) === 'defensa' ? 'defensa' : 'ataque';
    return 'imagenes/mapas_estrategicos/' . $slug . '/' . $lado_archivo . '.png';
}

function agente_img_admin($agente){
    return 'imagenes/agentes/' . trim($agente) . '.png';
}
?>

<main class="main-content" id="main">

    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Administración</li>
            </ol>
        </div>
    </nav>

    <?php if ($seccion == "lineups"): ?>

    <div class="app admin-lineup-map-app">
        <aside class="sidebar">
            <div class="map-selector" id="adminMapSelector">
                <button class="map-hero" id="adminMapHero" type="button">
                    <h1 id="adminHeroTitle">Abyss</h1>
                    <div class="hero-check">▼</div>
                </button>
                <div class="maps-dropdown" id="adminMapsDropdown">
                    <div class="maps-grid" id="adminMapsGrid"></div>
                </div>
            </div>

            <div class="side-content">
                <div class="tabs">
                    <button class="tab active" type="button" data-side="Ataque">Ataque</button>
                    <button class="tab" type="button" data-side="Defensa">Defensa</button>
                    <div class="separator"></div>
                    <div class="star">☆</div>
                </div>

                <h2 class="section-title agent-title">Usuarios con envios</h2>
                <p class="lineup-editor-hint admin-users-hint">Pulsa un usuario para ver y abrir sus lineups.</p>
                <div class="agents-grid admin-users-grid" id="adminUsersGrid"></div>
            </div>
        </aside>

        <main class="main">
            <section class="lineup-board">
                <div class="map-image-box" id="adminMapBox">
                    <div class="map-rotator" id="adminMapRotator">
                        <img id="adminMapImage" src="" alt="Mapa seleccionado">
                        <div class="lineup-layer" id="adminLineupLayer">
                            <svg class="lineup-lines" id="adminLineupLines"></svg>
                        </div>
                    </div>
                </div>

                <section class="lineup-editor admin-review-panel">
                    <div class="lineup-editor-header">
                        <h3 id="adminReviewTitle">Selecciona un envio</h3>
                        <p class="lineup-editor-hint" id="adminReviewHint">Pulsa un usuario y luego un punto del mapa.</p>
                    </div>
                    <div class="lineup-editor-body" id="adminReviewBody">
                        <div class="empty-state empty-state--inline">
                            <p class="empty-desc">No hay ningun lineup seleccionado.</p>
                        </div>
                    </div>
                </section>
            </section>
        </main>
    </div>

    <script>
    window.adminPendingLineups = <?php echo json_encode($pendientes ?? array()); ?>;
    </script>
    <script>
    (function() {
        let pending = window.adminPendingLineups || [];
        let maps = [
            { displayName: 'Abyss', folder: 'abyss', splash: 'imagenes/mapas/Abyss.png' },
            { displayName: 'Ascent', folder: 'ascent', splash: 'imagenes/mapas/Ascent.png' },
            { displayName: 'Breeze', folder: 'breeze', splash: 'imagenes/mapas/Breeze.png' },
            { displayName: 'Haven', folder: 'haven', splash: 'imagenes/mapas/Haven.png' },
            { displayName: 'Pearl', folder: 'pearl', splash: 'imagenes/mapas/Pearl.png' },
            { displayName: 'Split', folder: 'split', splash: 'imagenes/mapas/Split.png' }
        ];
        let estado = { userId: null, map: null, side: 'Ataque', selectedId: null };

        function slug(texto) { return String(texto || '').toLowerCase(); }
        function normalizarVideo(url) {
            let m = String(url || '').match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
            return m ? 'https://www.youtube.com/embed/' + m[1] : '';
        }
        function imgAgente(nombre) { return 'imagenes/agentes/' + nombre + '.png'; }
        function imgHabilidad(agente, habilidad) { return 'imagenes/Habilidades/' + agente + '/' + habilidad + '.png'; }
        function imgMapa(mapa, lado) { return 'imagenes/mapas_estrategicos/' + slug(mapa) + '/' + (lado === 'Defensa' ? 'defensa' : 'ataque') + '.png'; }

        function mostrarTooltipAdmin(lp) {
            limpiarTooltipAdmin();
            let layer = document.getElementById('adminLineupLayer');
            if (!layer) return;
            let tooltip = document.createElement('div');
            tooltip.className = 'lineup-tooltip admin-map-tooltip';
            tooltip.style.left = lp.destino_x + '%';
            tooltip.style.top = lp.destino_y + '%';
            let lineas = [lp.titulo || (lp.agente + ' - ' + lp.habilidad), lp.habilidad, 'Pulsa para ver el video'];
            for (let i = 0; i < lineas.length; i++) {
                if (i > 0) tooltip.appendChild(document.createElement('br'));
                tooltip.appendChild(document.createTextNode(lineas[i]));
            }
            layer.appendChild(tooltip);
        }

        function limpiarTooltipAdmin() {
            let layer = document.getElementById('adminLineupLayer');
            if (!layer) return;
            let tooltips = layer.querySelectorAll('.admin-map-tooltip');
            for (let i = 0; i < tooltips.length; i++) tooltips[i].remove();
        }

        function usuarios() {
            let res = [];
            for (let i = 0; i < pending.length; i++) {
                let existe = false;
                for (let j = 0; j < res.length; j++) if (String(res[j].id) === String(pending[i].usuario_id)) existe = true;
                if (!existe) res.push({ id: pending[i].usuario_id, nombre: pending[i].autor });
            }
            return res;
        }

        function lineupsFiltrados() {
            let out = [];
            for (let i = 0; i < pending.length; i++) {
                if (String(pending[i].usuario_id) === String(estado.userId) && pending[i].mapa === estado.map && pending[i].lado === estado.side) out.push(pending[i]);
            }
            return out;
        }

        function lineupsDelUsuario() {
            let out = [];
            for (let i = 0; i < pending.length; i++) {
                if (String(pending[i].usuario_id) === String(estado.userId)) out.push(pending[i]);
            }
            return out;
        }

        function elegirPrimerMapaDelUsuario() {
            for (let i = 0; i < pending.length; i++) {
                if (String(pending[i].usuario_id) === String(estado.userId)) {
                    estado.map = pending[i].mapa;
                    estado.side = pending[i].lado || 'Ataque';
                    return;
                }
            }
            estado.map = maps[0].displayName;
        }

        function renderUsuarios() {
            let grid = document.getElementById('adminUsersGrid');
            if (!grid) return;
            grid.innerHTML = '';
            let us = usuarios();
            if (us.length === 0) {
                grid.innerHTML = '<div class="empty-state empty-state--inline"><p class="empty-desc">No hay envios pendientes.</p></div>';
                return;
            }
            for (let i = 0; i < us.length; i++) {
                let u = us[i];
                let activo = String(u.id) === String(estado.userId);
                let total = 0;
                for (let j = 0; j < pending.length; j++) if (String(pending[j].usuario_id) === String(u.id)) total++;

                let card = document.createElement('button');
                card.type = 'button';
                card.className = 'admin-user-card' + (activo ? ' active' : '');
                let ini = document.createElement('i');
                ini.textContent = String(u.nombre || '?').substring(0, 2).toUpperCase();
                let nom = document.createElement('span');
                nom.textContent = u.nombre;
                let badge = document.createElement('b');
                badge.textContent = total;
                card.appendChild(ini);
                card.appendChild(nom);
                card.appendChild(badge);
                card.addEventListener('click', function() {
                    estado.userId = u.id;
                    estado.selectedId = null;
                    elegirPrimerMapaDelUsuario();
                    refrescarTodo();
                });
                grid.appendChild(card);

                // desplegable con todos los lineups del usuario activo
                if (activo) {
                    let drop = document.createElement('div');
                    drop.className = 'admin-user-lineups';
                    let lista = lineupsDelUsuario();
                    for (let k = 0; k < lista.length; k++) {
                        let lp = lista[k];
                        let item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'admin-user-lineup-item' + (String(lp.id) === String(estado.selectedId) ? ' active' : '');
                        let t = document.createElement('span');
                        t.className = 'aul-titulo';
                        t.textContent = (k + 1) + '. ' + lp.agente + ' · ' + lp.habilidad;
                        let m = document.createElement('span');
                        m.className = 'aul-meta';
                        m.textContent = lp.mapa + ' · ' + lp.lado;
                        item.appendChild(t);
                        item.appendChild(m);
                        item.addEventListener('click', function() {
                            estado.map = lp.mapa;
                            estado.side = lp.lado;
                            estado.selectedId = lp.id;
                            refrescarTodo();
                        });
                        drop.appendChild(item);
                    }
                    grid.appendChild(drop);
                }
            }
        }

        function renderMapas() {
            let grid = document.getElementById('adminMapsGrid');
            let hero = document.getElementById('adminMapHero');
            let selector = document.getElementById('adminMapSelector');
            if (!grid || !hero || !selector) return;
            let html = '';
            for (let i = 0; i < maps.length; i++) {
                html += '<button class="map-card' + (maps[i].displayName === estado.map ? ' active' : '') + '" type="button" data-map="' + maps[i].displayName + '"><img src="' + maps[i].splash + '" alt="' + maps[i].displayName + '"><span>' + maps[i].displayName + '</span></button>';
            }
            grid.innerHTML = html;
            hero.onclick = function() { selector.classList.toggle('open'); };
            let cards = grid.querySelectorAll('.map-card');
            for (let i = 0; i < cards.length; i++) {
                cards[i].addEventListener('click', function() {
                    estado.map = this.dataset.map;
                    estado.selectedId = null;
                    selector.classList.remove('open');
                    refrescarTodo();
                });
            }
        }

        function renderTabs() {
            let tabs = document.querySelectorAll('.admin-lineup-map-app .tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.toggle('active', tabs[i].dataset.side === estado.side);
                tabs[i].onclick = function() {
                    estado.side = this.dataset.side;
                    estado.selectedId = null;
                    refrescarTodo();
                };
            }
        }

        function renderMapa() {
            let img = document.getElementById('adminMapImage');
            let hero = document.getElementById('adminMapHero');
            let title = document.getElementById('adminHeroTitle');
            if (img) img.src = imgMapa(estado.map, estado.side);
            if (title) title.textContent = estado.map;
            if (hero) {
                let elegido = maps[0];
                for (let i = 0; i < maps.length; i++) if (maps[i].displayName === estado.map) elegido = maps[i];
                hero.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.55)), url(' + elegido.splash + ')';
            }
        }

        function renderLineups() {
            let layer = document.getElementById('adminLineupLayer');
            let lines = document.getElementById('adminLineupLines');
            if (!layer || !lines) return;
            let antiguos = layer.querySelectorAll('.admin-map-lineup-point, .admin-map-tooltip');
            for (let i = 0; i < antiguos.length; i++) antiguos[i].remove();
            lines.innerHTML = '';
            let lista = lineupsFiltrados();
            let sigueSeleccionado = false;
            for (let i = 0; i < lista.length; i++) if (String(lista[i].id) === String(estado.selectedId)) sigueSeleccionado = true;
            if (!sigueSeleccionado) estado.selectedId = null;
            if (!estado.selectedId && lista.length > 0) estado.selectedId = lista[0].id;
            for (let i = 0; i < lista.length; i++) {
                let lp = lista[i];
                let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', lp.inicio_x + '%');
                line.setAttribute('y1', lp.inicio_y + '%');
                line.setAttribute('x2', lp.destino_x + '%');
                line.setAttribute('y2', lp.destino_y + '%');
                lines.appendChild(line);
                let start = document.createElement('button');
                start.type = 'button';
                start.className = 'admin-map-lineup-point admin-map-lineup-agent' + (String(lp.id) === String(estado.selectedId) ? ' active' : '');
                start.style.left = lp.inicio_x + '%';
                start.style.top = lp.inicio_y + '%';
                start.dataset.id = lp.id;
                let startImg = document.createElement('img');
                startImg.src = imgAgente(lp.agente);
                startImg.alt = lp.agente;
                start.appendChild(startImg);
                layer.appendChild(start);
                let end = document.createElement('button');
                end.type = 'button';
                end.className = 'admin-map-lineup-point lineup-point' + (String(lp.id) === String(estado.selectedId) ? ' active' : '');
                end.style.left = lp.destino_x + '%';
                end.style.top = lp.destino_y + '%';
                end.style.pointerEvents = 'auto';
                end.dataset.id = lp.id;
                let endNum = document.createElement('span');
                endNum.textContent = i + 1;
                let endImg = document.createElement('img');
                endImg.src = imgHabilidad(lp.agente, lp.habilidad);
                endImg.alt = lp.habilidad;
                end.appendChild(endNum);
                end.appendChild(endImg);
                end.addEventListener('mouseenter', function() { mostrarTooltipAdmin(lp); });
                end.addEventListener('mouseleave', limpiarTooltipAdmin);
                layer.appendChild(end);
            }
            let points = layer.querySelectorAll('.admin-map-lineup-point');
            for (let i = 0; i < points.length; i++) {
                points[i].addEventListener('click', function() {
                    estado.selectedId = this.dataset.id;
                    refrescarTodo();
                });
            }
        }

        function renderDetalle() {
            let title = document.getElementById('adminReviewTitle');
            let hint = document.getElementById('adminReviewHint');
            let body = document.getElementById('adminReviewBody');
            if (!title || !hint || !body) return;
            let lp = null;
            for (let i = 0; i < pending.length; i++) if (String(pending[i].id) === String(estado.selectedId)) lp = pending[i];
            if (!lp) {
                title.textContent = 'Selecciona un envio';
                hint.textContent = 'Pulsa un usuario y luego un punto del mapa.';
                body.innerHTML = '<div class="empty-state empty-state--inline"><p class="empty-desc">No hay ningun lineup seleccionado.</p></div>';
                return;
            }
            title.textContent = lp.agente + ' - ' + lp.habilidad;
            hint.textContent = lp.autor + ' · ' + lp.mapa + ' · ' + lp.lado;
            let embed = normalizarVideo(lp.video_url);
            body.innerHTML = '';

            if (embed) {
                let fig = document.createElement('figure');
                fig.className = 'lineup-thumb moderation-video';
                let iframe = document.createElement('iframe');
                iframe.src = embed;
                iframe.setAttribute('frameborder', '0');
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                iframe.className = 'lineup-thumb-img';
                fig.appendChild(iframe);
                body.appendChild(fig);
            } else {
                let p = document.createElement('p');
                p.className = 'lineup-desc';
                p.textContent = 'Este envio no trae video de YouTube.';
                body.appendChild(p);
            }

            let meta = document.createElement('pre');
            meta.className = 'admin-review-meta';
            let filas = [['Mapa', lp.mapa], ['Lado', lp.lado], ['Agente', lp.agente], ['Habilidad', lp.habilidad]];
            for (let i = 0; i < filas.length; i++) {
                let s = document.createElement('span');
                s.textContent = filas[i][0];
                let b = document.createElement('strong');
                b.textContent = filas[i][1];
                meta.appendChild(s);
                meta.appendChild(b);
            }
            body.appendChild(meta);

            let acciones = document.createElement('div');
            acciones.className = 'admin-card-actions';
            let botones = [
                { name: 'aprobar', texto: 'Aprobar', clase: 'btn-primary btn-small' },
                { name: 'borrar', texto: 'Rechazar', clase: 'btn-secondary btn-small' }
            ];
            for (let i = 0; i < botones.length; i++) {
                let form = document.createElement('form');
                form.className = 'inline-form';
                form.action = 'index.php?controlador=admin&action=lineups';
                form.method = 'post';
                let inputId = document.createElement('input');
                inputId.type = 'hidden';
                inputId.name = 'id';
                inputId.value = lp.id;
                let btn = document.createElement('button');
                btn.type = 'submit';
                btn.name = botones[i].name;
                btn.value = '1';
                btn.className = botones[i].clase;
                btn.textContent = botones[i].texto;
                form.appendChild(inputId);
                form.appendChild(btn);
                acciones.appendChild(form);
            }
            body.appendChild(acciones);
        }

        function refrescarTodo() {
            renderUsuarios();
            renderMapas();
            renderTabs();
            renderMapa();
            renderLineups();
            renderDetalle();
        }

        let us = usuarios();
        estado.userId = us.length ? us[0].id : null;
        elegirPrimerMapaDelUsuario();
        refrescarTodo();
    })();
    </script>

    <section class="hero hero-lineups">
        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · MODERACIÓN</span>
            <h1 class="hero-title">Moderación de <span class="text-red">lineups</span></h1>
            <p class="hero-subtitle">Aprueba o rechaza solo los envíos hechos por usuarios.</p>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($pendientes); ?></span>
                    <span class="hero-stat-label">Pendientes</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo count($aprobados); ?></span>
                    <span class="hero-stat-label">Enviados por usuarios</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section admin-lineup-review">
        <div class="container">

            <div class="results-bar">
                <h2 class="section-title results-title">
                    Pendientes de aprobación
                    <span class="badge <?php echo count($pendientes) > 0 ? 'badge--glow' : 'badge--muted'; ?>"><?php echo count($pendientes); ?></span>
                </h2>
            </div>

            <?php if (empty($pendientes)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">✓</div>
                    <h3 class="empty-title">¡Bandeja vacía!</h3>
                    <p class="empty-desc">No hay lineups esperando revisión.</p>
                </div>
            <?php else: ?>
                <?php foreach ($pendientes as $l): ?>
                    <article class="moderation-lineup-card">
                        <div class="moderation-map">
                            <img src="<?php echo htmlspecialchars(mapa_img_admin($l['mapa'], $l['lado'] ?? 'Ataque')); ?>"
                                 alt="Mapa <?php echo htmlspecialchars($l['mapa']); ?>">
                            <svg class="moderation-map-lines" aria-hidden="true">
                                <line x1="<?php echo (float)$l['inicio_x']; ?>%" y1="<?php echo (float)$l['inicio_y']; ?>%"
                                      x2="<?php echo (float)$l['destino_x']; ?>%" y2="<?php echo (float)$l['destino_y']; ?>%"></line>
                            </svg>
                            <span class="moderation-agent-pin"
                                  style="left: <?php echo (float)$l['inicio_x']; ?>%; top: <?php echo (float)$l['inicio_y']; ?>%;">
                                <img src="<?php echo htmlspecialchars(agente_img_admin($l['agente'])); ?>"
                                     alt="<?php echo htmlspecialchars($l['agente']); ?>">
                                <b>Inicio</b>
                            </span>
                            <span class="moderation-pin moderation-pin-end"
                                  style="left: <?php echo (float)$l['destino_x']; ?>%; top: <?php echo (float)$l['destino_y']; ?>%;">
                                <b>Destino</b>
                            </span>
                        </div>
                        <div class="moderation-review">
                            <span class="eyebrow">// ENVIO DE USUARIO</span>
                            <div class="admin-card-meta">
                                <span class="agent-tag"><?php echo htmlspecialchars($l['agente']); ?></span>
                                <span class="lineup-map-tag"><?php echo htmlspecialchars($l['mapa']); ?></span>
                                <span><?php echo htmlspecialchars($l['lado'] ?? 'Ataque'); ?></span>
                                <span><?php echo htmlspecialchars($l['habilidad'] ?? ''); ?></span>
                                <?php if (!empty($l['autor'])): ?>
                                    <span>Por <?php echo htmlspecialchars($l['autor']); ?></span>
                                <?php endif; ?>
                            </div>
                            <h3 class="lineup-title"><?php echo htmlspecialchars($l['titulo']); ?></h3>
                            <?php if (youtube_embed_admin($l['video_url'])): ?>
                                <figure class="lineup-thumb moderation-video">
                                    <iframe src="<?php echo htmlspecialchars(youtube_embed_admin($l['video_url'])); ?>"
                                            frameborder="0" allowfullscreen loading="lazy"
                                            class="lineup-thumb-img"></iframe>
                                </figure>
                            <?php else: ?>
                                <p class="lineup-desc">Este envio no trae video de YouTube.</p>
                            <?php endif; ?>
                            <?php if (!empty($l['descripcion'])): ?>
                                <p class="lineup-desc"><?php echo nl2br(htmlspecialchars($l['descripcion'])); ?></p>
                            <?php endif; ?>
                            <div class="admin-card-actions">
                                <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                    <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
                                    <button type="submit" name="aprobar" value="1" class="btn-primary btn-small">Aprobar</button>
                                </form>
                                <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                    <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
                                    <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Rechazar</button>
                                </form>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            <?php endif; ?>

            <div class="results-bar spaced-top-xl">
                <h2 class="section-title results-title">
                    Enviados por usuarios
                    <span class="badge badge--muted"><?php echo count($aprobados); ?></span>
                </h2>
            </div>

            <?php if (empty($aprobados)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin envíos publicados</h3>
                    <p class="empty-desc">Aún no se ha aprobado ningún lineup enviado por usuarios.</p>
                </div>
            <?php else: ?>
                <div class="admin-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Agente</th>
                                <th>Mapa</th>
                                <th>Autor</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($aprobados as $l): ?>
                                <tr>
                                    <td><?php echo $l['id']; ?></td>
                                    <td><?php echo htmlspecialchars($l['titulo']); ?></td>
                                    <td><?php echo htmlspecialchars($l['agente']); ?></td>
                                    <td><?php echo htmlspecialchars($l['mapa']); ?></td>
                                    <td><?php echo htmlspecialchars($l['autor'] ?? ''); ?></td>
                                    <td>
                                        <form class="inline-form" action="index.php?controlador=admin&amp;action=lineups" method="post">
                                            <input type="hidden" name="id" value="<?php echo $l['id']; ?>">
                                            <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Borrar</button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

        </div>
    </section>

    <?php else: ?>

    <section class="hero">
        <div class="container hero-content">
            <span class="eyebrow">// ADMIN · USUARIOS</span>
            <h1 class="hero-title">Gestión de <span class="text-red">usuarios</span></h1>
            <p class="hero-subtitle">Revisa y elimina cuentas registradas.</p>
            <?php
                $total = isset($array) ? count($array) : 0;
                $admins = 0;
                if (isset($array)) {
                    foreach ($array as $u) { if (!empty($u['es_admin'])) $admins++; }
                }
            ?>
            <ul class="hero-stats">
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo $total; ?></span>
                    <span class="hero-stat-label">Usuarios</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo $admins; ?></span>
                    <span class="hero-stat-label">Administradores</span>
                </li>
                <li class="hero-stat">
                    <span class="hero-stat-value"><?php echo max(0, $total - $admins); ?></span>
                    <span class="hero-stat-label">Jugadores</span>
                </li>
            </ul>
        </div>
    </section>

    <section class="results-section">
        <div class="container">

            <div class="results-bar">
                <h2 class="section-title results-title">
                    Listado de usuarios
                    <span class="badge badge--muted"><?php echo $total; ?></span>
                </h2>
            </div>

            <?php if (empty($array)): ?>
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin usuarios registrados</h3>
                    <p class="empty-desc">Todavía no se ha registrado ningún jugador.</p>
                </div>
            <?php else: ?>
                <div class="admin-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rango</th>
                                <th>Región</th>
                                <th>Rol</th>
                                <th>Alta</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($array as $registro): ?>
                                <tr>
                                    <td><?php echo $registro['id']; ?></td>
                                    <td><?php echo htmlspecialchars($registro['username'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['email'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['rango'] ?? ''); ?></td>
                                    <td><?php echo htmlspecialchars($registro['region'] ?? ''); ?></td>
                                    <td><?php echo !empty($registro['es_admin']) ? 'Administrador' : 'Usuario'; ?></td>
                                    <td><?php echo htmlspecialchars($registro['creado_en'] ?? ''); ?></td>
                                    <td>
                                        <?php if ($registro['id'] == $_SESSION['usuario']['id']): ?>
                                            <span class="auth-message">Tu cuenta</span>
                                        <?php else: ?>
                                            <form class="inline-form" action="index.php?controlador=admin&amp;action=usuarios" method="post">
                                                <input type="hidden" name="id" value="<?php echo $registro['id']; ?>">
                                                <input type="hidden" name="es_admin" value="<?php echo !empty($registro['es_admin']) ? 0 : 1; ?>">
                                                <button type="submit" name="cambiar_rol" value="1" class="btn-ghost btn-small">
                                                    <?php echo !empty($registro['es_admin']) ? 'Quitar admin' : 'Hacer admin'; ?>
                                                </button>
                                            </form>
                                            <form class="inline-form" action="index.php?controlador=admin&amp;action=usuarios" method="post">
                                                <input type="hidden" name="id" value="<?php echo $registro['id']; ?>">
                                                <button type="submit" name="borrar" value="1" class="btn-secondary btn-small">Borrar</button>
                                            </form>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

        </div>
    </section>

    <?php endif; ?>

</main>
