(function () {
    'use strict';

    function initCrosshair() {
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isTouch = !window.matchMedia('(any-pointer: fine)').matches;

        if (!reducedMotion && !isTouch) {
            var ch = document.createElement('div');
            ch.id = 'vs-crosshair';
            ch.setAttribute('aria-hidden', 'true');
            ch.innerHTML =
                '<span class="vs-ch-line vs-ch-top"></span>' +
                '<span class="vs-ch-line vs-ch-right"></span>' +
                '<span class="vs-ch-line vs-ch-bottom"></span>' +
                '<span class="vs-ch-line vs-ch-left"></span>' +
                '<span class="vs-ch-dot"></span>';
            document.body.appendChild(ch);
            document.documentElement.classList.add('vs-has-crosshair');

            var cx = -100, cy = -100, chPending = false;
            document.addEventListener('pointermove', function (e) {
                cx = e.clientX; cy = e.clientY;
                if (chPending) return;
                chPending = true;
                requestAnimationFrame(function () {
                    ch.style.setProperty('--cx', cx + 'px');
                    ch.style.setProperty('--cy', cy + 'px');
                    chPending = false;
                });
            }, { passive: true });

            // Selectores donde la mira se pone roja — ajusta a tu proyecto
            var HOT_SELECTOR = 'a, button, [role="button"], input, textarea, select';
            document.addEventListener('pointerover', function (e) {
                var target = e.target;
                if (!(target instanceof Element)) return;
                ch.classList.toggle('is-hot', !!target.closest(HOT_SELECTOR));
            });

            // Kick al pulsar
            document.addEventListener('pointerdown', function () {
                ch.classList.remove('is-firing');
                void ch.offsetWidth; // force reflow para reiniciar keyframes
                ch.classList.add('is-firing');
            }, { passive: true });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCrosshair);
    } else {
        initCrosshair();
    }
})();
