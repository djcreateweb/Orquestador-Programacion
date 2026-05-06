// =====================================================
// ValoSense · training.js
// Sección "Videos para tu rango": actualiza el contador
// del panel de progreso en vivo al marcar/desmarcar
// categorías. El submit es nativo (botón Buscar).
// También maneja la composición de equipo (team_view.php).
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // VIDEOS PARA TU RANGO (training_view.php)
    // ===============================================
    const videosForm = document.getElementById('videos-form');

    if (videosForm) {
        const checks   = videosForm.querySelectorAll('input[name="categorias[]"]');
        const catCount = document.getElementById('cat-count');
        const vidCount = document.getElementById('video-count');

        // --- Dropdown colapsable de categorías ---
        const catDropdown = videosForm.querySelector('[data-cat-dropdown]');
        const catToggle   = catDropdown ? catDropdown.querySelector('.cat-dropdown-toggle') : null;
        const catPanel    = catDropdown ? catDropdown.querySelector('.cat-dropdown-panel') : null;
        const catSummary  = catDropdown ? catDropdown.querySelector('.cat-dropdown-summary') : null;

        if (catDropdown) {
            // Activamos el modo JS: el CSS ahora colapsa el panel por defecto.
            catDropdown.classList.add('is-js-ready');
        }

        const cerrarDropdown = (devolverFoco = false) => {
            if (!catDropdown) return;
            catDropdown.classList.remove('is-open');
            if (catToggle) catToggle.setAttribute('aria-expanded', 'false');
            if (devolverFoco && catToggle) catToggle.focus();
        };

        const abrirDropdown = () => {
            if (!catDropdown) return;
            catDropdown.classList.add('is-open');
            if (catToggle) catToggle.setAttribute('aria-expanded', 'true');
        };

        if (catToggle) {
            catToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (catDropdown.classList.contains('is-open')) {
                    cerrarDropdown();
                } else {
                    abrirDropdown();
                }
            });
        }

        // Click fuera cierra el panel
        document.addEventListener('click', (e) => {
            if (!catDropdown || !catDropdown.classList.contains('is-open')) return;
            if (!catDropdown.contains(e.target)) cerrarDropdown();
        });

        // Escape dentro del dropdown cierra y devuelve foco
        if (catDropdown) {
            catDropdown.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && catDropdown.classList.contains('is-open')) {
                    e.stopPropagation();
                    cerrarDropdown(true);
                }
            });
        }

        // Actualiza el texto del summary según categorías marcadas.
        const actualizarSummary = () => {
            if (!catSummary) return;
            const seleccionadas = Array.from(checks).filter(c => c.checked);
            const n = seleccionadas.length;
            if (n === 0) {
                catSummary.textContent = 'Selecciona categorías';
            } else if (n === 1) {
                const lbl = seleccionadas[0].dataset.label || seleccionadas[0].value;
                catSummary.textContent = '1 categoría: ' + lbl;
            } else {
                catSummary.textContent = n + ' categorías seleccionadas';
            }
        };

        // Actualiza solo el contador del panel de progreso en vivo.
        // No toca las tarjetas — eso lo hace el servidor tras el submit.
        const actualizarContador = () => {
            let marcadas = 0;
            checks.forEach(chk => { if (chk.checked) marcadas++; });
            if (catCount) catCount.textContent = marcadas;
            if (vidCount) vidCount.textContent = marcadas + ' / 5';
            actualizarSummary();
        };

        checks.forEach(chk => chk.addEventListener('change', actualizarContador));

        // Sincroniza color del select de rango y del badge del hero en vivo
        const rankSelect = videosForm.querySelector('.rank-select');
        const rankBadge  = document.getElementById('rank-badge-active');
        if (rankSelect) {
            const RANK_CLASSES = ['rank-iron','rank-bronze','rank-silver','rank-gold',
                'rank-platinum','rank-diamond','rank-ascendant','rank-immortal','rank-radiant'];
            const syncRank = () => {
                const v = (rankSelect.value || '').toLowerCase();
                [rankSelect, rankBadge].forEach(el => {
                    if (!el) return;
                    RANK_CLASSES.forEach(c => el.classList.remove(c));
                    if (v) el.classList.add('rank-' + v);
                });
            };
            rankSelect.addEventListener('change', syncRank);
            syncRank();
        }
        actualizarContador();
    }

    // ===============================================
    // COMPOSICIÓN DE EQUIPO (team_view.php)
    // ===============================================
    const compForm = document.getElementById('comp-form');

    if (compForm) {
        const maxAgentes = 5;
        const checks = compForm.querySelectorAll('input[name="agentes[]"]');
        const statusEl = document.getElementById('comp-status');
        const rolePills = document.querySelectorAll('#role-pills .role-pill');

        function updateRolePills(rolesCubiertos) {
            rolePills.forEach(pill => {
                const rol = pill.dataset.role;
                pill.classList.toggle('is-covered', !!rolesCubiertos[rol]);
            });
        }

        function actualizarEstadoComp() {
            const checked = Array.from(checks).filter(c => c.checked);
            const total = checked.length;

            const rolesCubiertos = {};
            checked.forEach(c => {
                const lbl = c.closest('.agent-btn');
                const rol = lbl && lbl.dataset.rol;
                if (rol) rolesCubiertos[rol] = true;
            });
            updateRolePills(rolesCubiertos);

            // Deshabilitar los no marcados si ya hay 5
            checks.forEach(c => {
                const btn = c.closest('.agent-btn');
                if (!c.checked && total >= maxAgentes) {
                    c.disabled = true;
                    if (btn) btn.classList.add('is-disabled');
                } else {
                    c.disabled = false;
                    if (btn) btn.classList.remove('is-disabled');
                }
            });

            if (statusEl) {
                const rolesTotal = Object.keys(rolesCubiertos).length;
                if (total === 0) {
                    statusEl.textContent = 'Marca los agentes que ya tenéis y pulsa "Recomendar".';
                } else if (total >= maxAgentes) {
                    statusEl.textContent = `${total} / ${maxAgentes} agentes · ${rolesTotal} / 4 roles · equipo completo`;
                } else {
                    const faltan = maxAgentes - total;
                    statusEl.textContent = `${total} / ${maxAgentes} agentes · ${rolesTotal} / 4 roles · faltan ${faltan}`;
                }
            }
        }

        checks.forEach(chk => chk.addEventListener('change', actualizarEstadoComp));
        actualizarEstadoComp();
    }

    // -----------------------------------------------
    // Selector de mapa (team_view): marca activo el pulsado
    // -----------------------------------------------
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
        });
    });

    // -----------------------------------------------
    // Selector de agentes: marcar activo al togglear el checkbox
    // -----------------------------------------------
    document.querySelectorAll('.agent-btn input[type="checkbox"]').forEach(chk => {
        const btn = chk.closest('.agent-btn');
        if (!btn) return;
        if (chk.checked) btn.classList.add('is-selected');
        chk.addEventListener('change', () => {
            btn.classList.toggle('is-selected', chk.checked);
        });
    });

    // -----------------------------------------------
    // Scroll al resultado de composición si existe
    // -----------------------------------------------
    const recResult = document.getElementById('recommendation-result');
    if (recResult) {
        setTimeout(() => {
            recResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 180);
    }

});
