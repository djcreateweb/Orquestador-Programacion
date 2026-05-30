(function () {
    'use strict';

    var NUM_ORBS = 8;
    var STORAGE_KEY = 'vsOrbsBroken';
    var FROZEN_KEY = 'vsOrbsFrozen';

    // Estado global de congelado, compartido por todas las instancias y persistente
    // entre páginas (se guarda en localStorage para que aplique en toda la web).
    function leerFrozen() {
        try { return localStorage.getItem(FROZEN_KEY) === '1'; } catch (_) { return false; }
    }
    function guardarFrozen(v) {
        try { localStorage.setItem(FROZEN_KEY, v ? '1' : '0'); } catch (_) {}
    }
    var frozen = leerFrozen();

    // colores de las bolas
    var COLORES = [
        { r: 255, g: 70,  b: 85  }, // rojo
        { r: 0,   g: 224, b: 255 }  // cian
    ];

    // Reset del contador al recargar página (F5)
    try {
        var navs = performance.getEntriesByType && performance.getEntriesByType('navigation');
        if (navs && navs[0] && navs[0].type === 'reload') {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch (_) {}

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

    function crearOrbsHero(heroEl) {
        if (heroEl.dataset.orbsInit === '1') return;
        heroEl.dataset.orbsInit = '1';

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

        var orbs = [];
        function spawnOrb() {
            var r   = rand(10, 16);
            var v   = rand(0.22, 0.5);
            var ang = rand(0, Math.PI * 2);
            var col = pick(COLORES);
            return {
                x: rand(r, W - r), y: rand(r, H - r),
                vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
                r: r, color: col, alpha: 1
            };
        }
        var numSpawn = Math.max(0, NUM_ORBS - getRotas());
        for (var i = 0; i < numSpawn; i++) orbs.push(spawnOrb());

        var particulas = [];
        function romperOrb(orb) {
            for (var k = 0; k < 10; k++) {
                var ang = (k / 10) * Math.PI * 2 + rand(-0.1, 0.1);
                var sp  = rand(0.9, 1.8);
                particulas.push({
                    x: orb.x, y: orb.y,
                    vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                    r: rand(1.2, 2.4), color: orb.color, life: 1
                });
            }
        }

        function coordsRelativas(e) {
            var rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        function intentarRomperEn(x, y) {
            for (var i = 0; i < orbs.length; i++) {
                var o  = orbs[i];
                var dx = x - o.x, dy = y - o.y;
                if (dx * dx + dy * dy <= (o.r + 10) * (o.r + 10)) {
                    romperOrb(o);
                    orbs.splice(i, 1);
                    incRotas();
                    return true;
                }
            }
            return false;
        }

        var pulsado = false;

        heroEl.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            pulsado = true;
            var p = coordsRelativas(e);
            intentarRomperEn(p.x, p.y);
        }, true);

        window.addEventListener('mouseup',  function () { pulsado = false; });
        window.addEventListener('blur',     function () { pulsado = false; });

        heroEl.addEventListener('mousemove', function (e) {
            var p = coordsRelativas(e);
            if (pulsado) intentarRomperEn(p.x, p.y);

            var hover = false;
            for (var i = 0; i < orbs.length; i++) {
                var o = orbs[i];
                var dx = p.x - o.x, dy = p.y - o.y;
                if (dx * dx + dy * dy <= (o.r + 10) * (o.r + 10)) { hover = true; break; }
            }
            var enInteractivo = e.target && e.target.closest && e.target.closest('a,button,input,select,textarea,label');
        }, true);

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

        var running = true;
        var lastT = performance.now();

        function tick(now) {
            if (!running) return;
            var dt = Math.min(40, now - lastT);
            lastT = now;
            ctx.clearRect(0, 0, W, H);

            for (var i = 0; i < orbs.length; i++) {
                var o = orbs[i];
                if (!frozen) {
                    o.x += o.vx * dt;
                    o.y += o.vy * dt;
                    if (o.x - o.r < 0)      { o.x = o.r;     o.vx = -o.vx; }
                    else if (o.x + o.r > W) { o.x = W - o.r; o.vx = -o.vx; }
                    if (o.y - o.r < 0)      { o.y = o.r;     o.vy = -o.vy; }
                    else if (o.y + o.r > H) { o.y = H - o.r; o.vy = -o.vy; }
                }

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

                ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * o.alpha) + ')';
                ctx.beginPath();
                ctx.arc(o.x - o.r * 0.35, o.y - o.r * 0.35, o.r * 0.32, 0, Math.PI * 2);
                ctx.fill();
            }

            for (var j = particulas.length - 1; j >= 0; j--) {
                var p = particulas[j];
                if (!frozen) {
                    p.x += p.vx * dt * 0.6;
                    p.y += p.vy * dt * 0.6;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    p.life -= dt * 0.0016;
                }
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

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                running = false;
            } else if (!running) {
                running = true;
                lastT = performance.now();
                requestAnimationFrame(tick);
            }
        });

        var ro = window.ResizeObserver ? new ResizeObserver(redimensionar) : null;
        if (ro) ro.observe(heroEl);
        else window.addEventListener('resize', redimensionar);
    }

    function conectarBoton() {
        var btn = document.getElementById('orbsFreeze');
        if (!btn) return;

        function pintar() {
            btn.classList.toggle('is-frozen', frozen);
            btn.setAttribute('aria-pressed', frozen ? 'true' : 'false');
            btn.title = frozen ? 'Reanudar las bolitas' : 'Congelar las bolitas';
            btn.setAttribute('aria-label', btn.title);
        }

        btn.addEventListener('click', function () {
            frozen = !frozen;
            guardarFrozen(frozen);
            pintar();
        });
        pintar();
    }

    function init() {
        var heros = document.querySelectorAll('.hero');
        for (var i = 0; i < heros.length; i++) crearOrbsHero(heros[i]);
        conectarBoton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
