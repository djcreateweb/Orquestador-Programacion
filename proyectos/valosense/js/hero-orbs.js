// =====================================================
// ValoSense · hero-orbs.js
// Bolas flotantes tipo AimLab en el hero de cada página.
// - Velocidad lenta, rebote en bordes del hero.
// - Click rompe la bola con partículas y respawn tras 2s.
// - Respeta prefers-reduced-motion y pausa si la pestaña no es visible.
// =====================================================

(function () {
    'use strict';

    var PREFERS_REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var NUM_ORBS = 8;
    var STORAGE_KEY = 'vsOrbsBroken';

    // Paleta: solo dos colores, alineados con los tokens del proyecto.
    var COLORES = [
        { r: 255, g: 70,  b: 85  }, // rojo primario
        { r: 0,   g: 224, b: 255 }  // cian accent
    ];

    // Al pulsar F5 / recargar: reset del contador. Navegación interna lo respeta.
    try {
        var navs = performance.getEntriesByType && performance.getEntriesByType('navigation');
        if (navs && navs[0] && navs[0].type === 'reload') {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch (_) { /* sin performance API */ }

    function getRotas() {
        try {
            var n = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
            return (isNaN(n) || n < 0) ? 0 : n;
        } catch (_) { return 0; }
    }
    function incRotas() {
        try { sessionStorage.setItem(STORAGE_KEY, String(getRotas() + 1)); } catch (_) {}
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function pick(a)        { return a[Math.floor(Math.random() * a.length)]; }

    // ----- Una instancia de orbs por cada hero -----
    function crearOrbsHero(heroEl) {
        // Evita duplicar si el script corre dos veces
        if (heroEl.dataset.orbsInit === '1') return;
        heroEl.dataset.orbsInit = '1';

        // El canvas vive dentro del hero, en z-index 1 (por debajo del contenido que está en z-index 2+)
        var canvas = document.createElement('canvas');
        canvas.className = 'hero-orbs';
        canvas.setAttribute('aria-hidden', 'true');
        heroEl.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        var W = 0, H = 0;

        function redimensionar() {
            var rect = heroEl.getBoundingClientRect();
            W = Math.max(100, Math.floor(rect.width));
            H = Math.max(100, Math.floor(rect.height));
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width  = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        redimensionar();

        // ----- Bolas -----
        var orbs = [];
        function spawnOrb() {
            // Tamaño pequeño-medio
            var r = rand(10, 16);
            // Velocidad lenta
            var v = rand(0.22, 0.5);
            var ang = rand(0, Math.PI * 2);
            var col = pick(COLORES);
            return {
                x: rand(r, W - r),
                y: rand(r, H - r),
                vx: Math.cos(ang) * v,
                vy: Math.sin(ang) * v,
                r: r,
                color: col,
                alpha: 1
            };
        }
        // Spawn inicial: NUM_ORBS menos las que el usuario ya rompió en esta sesión.
        var numSpawn = Math.max(0, NUM_ORBS - getRotas());
        for (var i = 0; i < numSpawn; i++) orbs.push(spawnOrb());

        // ----- Partículas al romper -----
        var particulas = [];
        function romperOrb(orb) {
            var n = 10;
            for (var k = 0; k < n; k++) {
                var ang = (k / n) * Math.PI * 2 + rand(-0.1, 0.1);
                var sp  = rand(0.9, 1.8);
                particulas.push({
                    x: orb.x, y: orb.y,
                    vx: Math.cos(ang) * sp,
                    vy: Math.sin(ang) * sp,
                    r: rand(1.2, 2.4),
                    color: orb.color,
                    life: 1
                });
            }
        }

        // Convierte cualquier click dentro del hero en coordenadas relativas al canvas.
        // Se engancha al hero en fase de captura → llega SIEMPRE, aunque el cursor
        // esté sobre un botón, título o enlace. No se llama preventDefault: el botón
        // sigue activándose normalmente después.
        function coordsRelativas(e) {
            var rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        function intentarRomperEn(x, y) {
            // Tolerancia extra generosa (10 px) para que sea fácil acertar
            for (var i = 0; i < orbs.length; i++) {
                var o = orbs[i];
                var dx = x - o.x, dy = y - o.y;
                var radio = o.r + 10;
                if (dx * dx + dy * dy <= radio * radio) {
                    romperOrb(o);
                    orbs.splice(i, 1);
                    incRotas();
                    return true;
                }
            }
            return false;
        }

        // Estado: el usuario está "disparando" solo mientras tiene el botón pulsado.
        // Click simple rompe en la posición. Si arrastra con el botón pulsado,
        // cualquier bola que roce también se rompe.
        var pulsado = false;

        heroEl.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return; // solo botón izquierdo
            pulsado = true;
            var p = coordsRelativas(e);
            intentarRomperEn(p.x, p.y);
        }, true);

        // El mouseup puede ocurrir fuera del hero, lo escuchamos en window.
        window.addEventListener('mouseup', function () { pulsado = false; });
        window.addEventListener('blur',    function () { pulsado = false; });

        // Mousemove: solo rompe mientras se mantenga el botón pulsado.
        heroEl.addEventListener('mousemove', function (e) {
            var p = coordsRelativas(e);

            if (pulsado) {
                intentarRomperEn(p.x, p.y);
            }

            // Cursor crosshair si hay bola bajo el puntero (indicador visual)
            var hover = false;
            for (var i = 0; i < orbs.length; i++) {
                var o = orbs[i];
                var dx = p.x - o.x, dy = p.y - o.y;
                var radio = o.r + 10;
                if (dx * dx + dy * dy <= radio * radio) { hover = true; break; }
            }
            var tg = e.target;
            var enInteractivo = tg && tg.closest && tg.closest('a,button,input,select,textarea,label');
            if (!enInteractivo) {
                heroEl.style.cursor = hover ? 'crosshair' : '';
            }
        }, true);

        // Touch: toque inicial rompe; si arrastra el dedo, también rompe en cadena.
        heroEl.addEventListener('touchstart', function (e) {
            if (!e.touches || !e.touches.length) return;
            pulsado = true;
            var t = e.touches[0];
            var rect = canvas.getBoundingClientRect();
            intentarRomperEn(t.clientX - rect.left, t.clientY - rect.top);
        }, { passive: true, capture: true });

        heroEl.addEventListener('touchmove', function (e) {
            if (!pulsado || !e.touches || !e.touches.length) return;
            var t = e.touches[0];
            var rect = canvas.getBoundingClientRect();
            intentarRomperEn(t.clientX - rect.left, t.clientY - rect.top);
        }, { passive: true, capture: true });

        heroEl.addEventListener('touchend',    function () { pulsado = false; });
        heroEl.addEventListener('touchcancel', function () { pulsado = false; });

        // ----- Loop -----
        // Con prefers-reduced-motion y sin orbs (todas ya rotas) no arrancamos
        // el rAF: dibujaría un canvas vacío 60 veces/seg gastando batería en vano.
        var running = true;
        var lastT = performance.now();
        if (PREFERS_REDUCED && orbs.length === 0) {
            running = false;
        }

        function tick(now) {
            if (!running) return;
            var dt = Math.min(40, now - lastT); // cap para evitar saltos
            lastT = now;

            ctx.clearRect(0, 0, W, H);

            // Bolas (las rotas se eliminan del array, no reaparecen)
            for (var i = 0; i < orbs.length; i++) {
                var o = orbs[i];

                o.x += o.vx * dt;
                o.y += o.vy * dt;
                if (o.x - o.r < 0)       { o.x = o.r;     o.vx = -o.vx; }
                else if (o.x + o.r > W)  { o.x = W - o.r; o.vx = -o.vx; }
                if (o.y - o.r < 0)       { o.y = o.r;     o.vy = -o.vy; }
                else if (o.y + o.r > H)  { o.y = H - o.r; o.vy = -o.vy; }

                // Dibujo: halo suave + núcleo
                var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2.4);
                var c = o.color;
                g.addColorStop(0,   'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.55 * o.alpha) + ')');
                g.addColorStop(0.5, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.18 * o.alpha) + ')');
                g.addColorStop(1,   'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r * 2.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.92 * o.alpha) + ')';
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();

                // Brillo superior
                ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * o.alpha) + ')';
                ctx.beginPath();
                ctx.arc(o.x - o.r * 0.35, o.y - o.r * 0.35, o.r * 0.32, 0, Math.PI * 2);
                ctx.fill();
            }

            // Partículas
            for (var j = particulas.length - 1; j >= 0; j--) {
                var p = particulas[j];
                p.x += p.vx * dt * 0.6;
                p.y += p.vy * dt * 0.6;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.life -= dt * 0.0016;
                if (p.life <= 0) { particulas.splice(j, 1); continue; }
                var pc = p.color;
                ctx.fillStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + p.life + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Pausa cuando la pestaña no es visible
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                running = false;
            } else if (!running) {
                running = true;
                lastT = performance.now();
                requestAnimationFrame(tick);
            }
        });

        // Redimensionado del viewport
        var ro = (window.ResizeObserver) ? new ResizeObserver(redimensionar) : null;
        if (ro) ro.observe(heroEl);
        else window.addEventListener('resize', redimensionar);
    }

    function init() {
        var heros = document.querySelectorAll('.hero');
        for (var i = 0; i < heros.length; i++) crearOrbsHero(heros[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
