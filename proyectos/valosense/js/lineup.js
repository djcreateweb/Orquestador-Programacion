// =====================================================
// ValoSense · lineup.js
// Lógica de las páginas de lineups
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    // ===== Utilidad: extraer ID de YouTube =====
    function ytId(url) {
        if (!url) return '';
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : '';
    }

    // -----------------------------------------------
    // Biblioteca: auto-submit al cambiar agente/mapa
    // -----------------------------------------------
    const formFiltros = document.querySelector('form.lineup-form');
    if (formFiltros) {
        formFiltros.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', () => formFiltros.submit());
        });
    }

    // -----------------------------------------------
    // Biblioteca: búsqueda client-side en .lineup-card
    // Filtra por título y descripción
    // -----------------------------------------------
    const searchInput = document.getElementById('lineup-search');
    const cards = document.querySelectorAll('.lineup-card');
    if (searchInput && cards.length) {
        const normaliza = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const doFilter = () => {
            const q = normaliza(searchInput.value.trim());
            let shown = 0;
            cards.forEach(card => {
                const title = card.querySelector('.lineup-title')?.textContent || '';
                const desc  = card.querySelector('.lineup-desc')?.textContent  || '';
                const agent = card.querySelector('.lineup-agent-tag')?.textContent || '';
                const map   = card.querySelector('.lineup-map-tag')?.textContent || '';
                const haystack = normaliza(title + ' ' + desc + ' ' + agent + ' ' + map);
                const match = q === '' || haystack.includes(q);
                card.style.display = match ? '' : 'none';
                if (match) shown++;
            });
            const counter = document.getElementById('lineup-search-count');
            if (counter) counter.textContent = shown + ' / ' + cards.length;
        };
        searchInput.addEventListener('input', doFilter);
    }

    // -----------------------------------------------
    // Enviar: preview de YouTube en vivo + validación
    // -----------------------------------------------
    const inputVideo = document.getElementById('video_url');
    const preview    = document.getElementById('yt-preview');
    const previewEmpty = document.getElementById('yt-preview-empty');

    if (inputVideo && preview) {
        let lastId = '';
        const update = () => {
            const id = ytId(inputVideo.value.trim());
            if (id === lastId) return;
            lastId = id;

            // Validación visual
            if (inputVideo.value.trim() === '') {
                inputVideo.removeAttribute('data-valid');
            } else {
                inputVideo.setAttribute('data-valid', id ? 'yes' : 'no');
            }

            // Render preview
            preview.querySelectorAll('iframe').forEach(f => f.remove());
            if (id) {
                if (previewEmpty) previewEmpty.style.display = 'none';
                const iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube-nocookie.com/embed/' + id;
                iframe.loading = 'lazy';
                iframe.allow = 'accelerometer; encrypted-media; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.title = 'Preview del lineup';
                preview.appendChild(iframe);
            } else if (previewEmpty) {
                previewEmpty.style.display = '';
                previewEmpty.textContent = inputVideo.value.trim()
                    ? 'URL no válida todavía. Usa un enlace de YouTube (watch, embed o youtu.be).'
                    : 'Pega la URL del video y verás el preview aquí.';
            }
        };
        inputVideo.addEventListener('input', update);
        update();
    }

    // -----------------------------------------------
    // Enviar: validación antes de submit + contador desc
    // -----------------------------------------------
    const formEnviar = inputVideo ? inputVideo.closest('form') : null;
    if (formEnviar) {
        formEnviar.addEventListener('submit', (e) => {
            const url = inputVideo.value.trim();
            if (!ytId(url)) {
                e.preventDefault();
                window.VS?.toast && window.VS.toast('URL de YouTube no válida. Debe ser youtube.com/watch, youtu.be o embed.', 'warning');
                inputVideo.focus();
                return;
            }
            const desc = formEnviar.querySelector('textarea[name="descripcion"]');
            if (desc && desc.value.trim().length < 10) {
                e.preventDefault();
                window.VS?.toast && window.VS.toast('La descripción necesita al menos 10 caracteres.', 'warning');
                desc.focus();
                return;
            }
        });

        // Contador de caracteres en descripción
        const desc = formEnviar.querySelector('textarea[name="descripcion"]');
        if (desc && !desc.parentNode.querySelector('.contador-desc')) {
            const counter = document.createElement('small');
            counter.className = 'contador-desc';
            desc.parentNode.appendChild(counter);
            const update = () => {
                const n = desc.value.length;
                counter.textContent = n + ' / ' + (desc.maxLength > 0 ? desc.maxLength : '∞') + ' caracteres';
                counter.style.color = n < 10 ? 'var(--red-primary)' : 'var(--text-muted)';
            };
            desc.addEventListener('input', update);
            update();
        }
    }

    // =======================================================
    // Role-pills preview: al pasar el ratón por un agente del
    // selector, se ilumina la píldora de su rol (Duelista /
    // Iniciador / Controlador / Centinela). Al salir, vuelve a
    // mostrar el rol del agente actualmente seleccionado.
    // =======================================================
    const rolePills  = document.querySelectorAll('.role-pills-lineup .role-pill');
    const agentChips = document.querySelectorAll('.lineup-agent-chip');
    if (rolePills.length && agentChips.length) {
        const ROLE_MAP = { duelist: 'Duelist', initiator: 'Initiator', controller: 'Controller', sentinel: 'Sentinel' };

        const fija = Array.from(rolePills).find(p => p.classList.contains('is-covered'));
        const rolFijo = fija ? fija.dataset.role : null;

        const activar = (rol) => {
            rolePills.forEach(p => p.classList.toggle('is-covered', p.dataset.role === rol));
        };

        agentChips.forEach(chip => {
            let rol = null;
            chip.classList.forEach(c => {
                if (c.startsWith('role-')) {
                    const clave = c.slice(5).toLowerCase();
                    if (ROLE_MAP[clave]) rol = ROLE_MAP[clave];
                }
            });
            if (!rol) return;

            chip.addEventListener('pointerenter', () => activar(rol));
            chip.addEventListener('pointerleave', () => activar(rolFijo));
            chip.addEventListener('focus', () => activar(rol));
            chip.addEventListener('blur',  () => activar(rolFijo));
        });
    }
});
