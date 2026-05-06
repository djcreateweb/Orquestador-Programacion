// =====================================================
// ValoSense · main.js
// JavaScript global cargado en todas las páginas
// =====================================================

(function(){
    'use strict';

    // ===================================================
    //  API global: window.VS
    // ===================================================
    const VS = window.VS = window.VS || {};

    // --- Toast notifications ---
    VS.toast = function(message, type /* info|success|warning */, timeout){
        if(!message) return;
        let host = document.querySelector('.vs-toasts');
        if(!host){
            host = document.createElement('div');
            host.className = 'vs-toasts';
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        const el = document.createElement('div');
        el.className = 'vs-toast' + (type ? ' vs-toast--' + type : '');
        el.setAttribute('role', 'status');
        el.textContent = message;

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'vs-toast-close';
        close.setAttribute('aria-label', 'Cerrar aviso');
        close.textContent = '×';
        close.addEventListener('click', () => dismiss());
        el.appendChild(close);

        host.appendChild(el);

        const dismiss = () => {
            el.classList.add('vs-toast--leaving');
            setTimeout(() => el.remove(), 400);
        };
        const t = setTimeout(dismiss, timeout || 4500);
        el.addEventListener('mouseenter', () => clearTimeout(t), { once: true });
    };

    // --- Password strength (0-4) ---
    VS.passwordStrength = function(pwd){
        if(!pwd) return { score: 0, label: '' };
        let score = 0;
        if(pwd.length >= 8) score++;
        if(pwd.length >= 12) score++;
        if(/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
        if(/[0-9]/.test(pwd)) score++;
        if(/[^A-Za-z0-9]/.test(pwd)) score = Math.min(4, score + 1);
        score = Math.min(4, score);
        const labels = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];
        return { score, label: labels[score] };
    };

    // --- Copy to clipboard con fallback ---
    VS.copy = async function(text){
        if(!text) return false;
        try {
            if(navigator.clipboard && window.isSecureContext){
                await navigator.clipboard.writeText(text);
                return true;
            }
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            return ok;
        } catch(e){ return false; }
    };

    // ===================================================
    //  Preservación de scroll en búsquedas/filtros
    //  - Forms GET: automático (salvo data-no-keep-scroll).
    //  - Forms POST: opt-in con data-keep-scroll.
    //  - Enlaces <a data-keep-scroll>: opt-in.
    //  Clave: keepScroll:<pathname>:<id|action|href>
    // ===================================================
    (function () {
        var PREFIX = 'keepScroll:';

        var guardar = function (id) {
            var key = PREFIX + location.pathname + ':' + (id || '');
            try {
                sessionStorage.setItem(key, String(window.scrollY || window.pageYOffset || 0));
            } catch (_) { /* sessionStorage no disponible */ }
        };

        // Envío de formulario: GET siempre, POST solo con opt-in
        document.addEventListener('submit', function (e) {
            var form = e.target;
            if (!form) return;
            var metodo = form.method.toLowerCase();
            var optIn  = form.hasAttribute('data-keep-scroll');
            var optOut = form.hasAttribute('data-no-keep-scroll');
            if (optOut) return;
            if (metodo !== 'get' && !optIn) return;
            guardar(form.id || form.getAttribute('action') || '');
        }, true);

        // Clicks en enlaces <a data-keep-scroll>: guarda antes de navegar
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[data-keep-scroll]');
            if (!a) return;
            if (a.target && a.target !== '' && a.target !== '_self') return;
            guardar(a.getAttribute('href') || '');
        }, true);

        // En DOMContentLoaded, restaura si hay querystring (resultado de submit GET)
        document.addEventListener('DOMContentLoaded', function () {
            if (!location.search) return; // sin querystring → no es resultado de búsqueda
            try {
                var base = PREFIX + location.pathname + ':';
                var key = null;
                for (var i = 0; i < sessionStorage.length; i++) {
                    var k = sessionStorage.key(i);
                    if (k && k.indexOf(base) === 0) { key = k; break; }
                }
                if (!key) return;
                var raw = sessionStorage.getItem(key);
                sessionStorage.removeItem(key);
                var y = parseInt(raw, 10);
                if (isNaN(y)) return;
                // Solo aquí ponemos manual para evitar que el navegador sobreescriba
                if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
                var restore = function () { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); };
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(restore);
                } else {
                    setTimeout(restore, 0);
                }
            } catch (_) { /* ignore */ }
        });
    }());

    // ===================================================
    //  DOM ready
    // ===================================================
    document.addEventListener('DOMContentLoaded', () => {

        // -----------------------------------------------
        // Menú responsive: abrir/cerrar el navbar en móvil
        // -----------------------------------------------
        const menuToggle = document.getElementById('menu-toggle');
        const navbarMenu = document.getElementById('navbar-menu');

        if (menuToggle && navbarMenu) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = navbarMenu.classList.toggle('is-open');
                menuToggle.setAttribute('aria-expanded', String(isOpen));
            });
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
                    navbarMenu.classList.remove('is-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navbarMenu.classList.contains('is-open')) {
                    navbarMenu.classList.remove('is-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.focus();
                }
            });
        }

        // -----------------------------------------------
        // Imágenes rotas se ocultan
        // -----------------------------------------------
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
        });

        // -----------------------------------------------
        // Barras de progreso via data-progress
        // -----------------------------------------------
        document.querySelectorAll('.progress-bar-fill[data-progress]').forEach(bar => {
            const val = Math.max(0, Math.min(100, parseInt(bar.dataset.progress, 10) || 0));
            bar.style.width = val + '%';
        });

        // -----------------------------------------------
        // Auto-ocultar mensajes transitorios
        // -----------------------------------------------
        document.querySelectorAll('.auth-message:not(:empty)').forEach(msg => {
            setTimeout(() => {
                msg.style.transition = 'opacity 0.4s ease';
                msg.style.opacity = '0';
            }, 6000);
        });

        // -----------------------------------------------
        // Confirmación de formularios destructivos (data-confirm)
        // -----------------------------------------------
        document.querySelectorAll('form[data-confirm]').forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!window.confirm(form.dataset.confirm)) {
                    e.preventDefault();
                }
            });
        });

        // -----------------------------------------------
        // Dropdown "Explorar" (si existe .nav-dropdown)
        // -----------------------------------------------
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            const menu   = dropdown.querySelector('.nav-dropdown-menu');
            if (!toggle || !menu) return;
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const abierto = dropdown.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', String(abierto));
                if (abierto) {
                    dropdowns.forEach(otro => {
                        if (otro !== dropdown) {
                            otro.classList.remove('is-open');
                            const otroToggle = otro.querySelector('.nav-dropdown-toggle');
                            if (otroToggle) otroToggle.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
            });
        });
        document.addEventListener('click', (e) => {
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('is-open');
                    const t = dropdown.querySelector('.nav-dropdown-toggle');
                    if (t) t.setAttribute('aria-expanded', 'false');
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            dropdowns.forEach(dropdown => {
                if (dropdown.classList.contains('is-open')) {
                    dropdown.classList.remove('is-open');
                    const t = dropdown.querySelector('.nav-dropdown-toggle');
                    if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); }
                }
            });
        });

        // -----------------------------------------------
        // Scroll reveal con IntersectionObserver
        // Aplica .is-visible a todos los .reveal / .reveal-zoom
        // También auto-aplica .reveal a ciertos elementos comunes
        // -----------------------------------------------
        const autoTargets = document.querySelectorAll(
            '.lineup-card, .player-card, .feature-card, .routine-card, ' +
            '.admin-card, .step-card, .hero-stat, .rec-block, .empty-state'
        );
        autoTargets.forEach(el => {
            if (!el.classList.contains('reveal') && !el.classList.contains('reveal-zoom')) {
                el.classList.add('reveal');
            }
        });

        const reveals = document.querySelectorAll('.reveal, .reveal-zoom');
        if ('IntersectionObserver' in window && reveals.length) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
            reveals.forEach(el => io.observe(el));
        } else {
            reveals.forEach(el => el.classList.add('is-visible'));
        }

        // Ripple en botones eliminado: el círculo blanco de 600 ms se
        // confundía con una "estela" al bajar por la página.

        // -----------------------------------------------
        // Show / hide password (data-toggle-password="id")
        // -----------------------------------------------
        document.querySelectorAll('[data-toggle-password]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-toggle-password');
                const input = document.getElementById(id);
                if (!input) return;
                const showing = input.type === 'text';
                input.type = showing ? 'password' : 'text';
                btn.textContent = showing ? 'Ver' : 'Ocultar';
                btn.setAttribute('aria-pressed', String(!showing));
            });
        });

        // -----------------------------------------------
        // Password strength meter (data-strength-for="idInput")
        // -----------------------------------------------
        document.querySelectorAll('.pwd-meter[data-strength-for]').forEach(meter => {
            const input = document.getElementById(meter.dataset.strengthFor);
            if (!input) return;
            // Genera 4 barras si están vacías
            if (!meter.children.length) {
                for (let i = 0; i < 4; i++) {
                    const b = document.createElement('span');
                    b.className = 'pwd-meter-bar';
                    meter.appendChild(b);
                }
            }
            let label = meter.nextElementSibling;
            if (!label || !label.classList.contains('pwd-meter-label')) {
                label = document.createElement('p');
                label.className = 'pwd-meter-label';
                meter.after(label);
            }
            const update = () => {
                const { score, label: text } = VS.passwordStrength(input.value);
                meter.setAttribute('data-strength', String(score));
                label.textContent = input.value ? (text + ' · ' + input.value.length + ' caracteres') : '';
            };
            input.addEventListener('input', update);
            update();
        });

        // -----------------------------------------------
        // Copy to clipboard (.btn-copy[data-copy])
        // -----------------------------------------------
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const text = btn.getAttribute('data-copy') || '';
                const ok = await VS.copy(text);
                if (ok) {
                    const original = btn.dataset.labelOriginal || btn.textContent;
                    if (!btn.dataset.labelOriginal) btn.dataset.labelOriginal = original;
                    btn.textContent = '✓ Copiado';
                    btn.classList.add('is-copied');
                    VS.toast('Enlace copiado al portapapeles.', 'success', 2200);
                    setTimeout(() => {
                        btn.textContent = btn.dataset.labelOriginal;
                        btn.classList.remove('is-copied');
                    }, 1800);
                } else {
                    VS.toast('No se pudo copiar. Selecciona y copia manualmente.', 'warning');
                }
            });
        });

        // -----------------------------------------------
        // Convertir mensajes PHP existentes en toasts (data-toast="tipo")
        // -----------------------------------------------
        document.querySelectorAll('[data-toast]:not(:empty)').forEach(el => {
            const tipo = el.getAttribute('data-toast') || 'info';
            const txt = el.textContent.trim();
            if (txt) VS.toast(txt, tipo, 5500);
            el.remove();
        });

        // ===================================================
        //  Interacciones 3D y de cursor (todas con guard de
        //  prefers-reduced-motion y de touch para no molestar).
        // ===================================================
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Considera "desktop con ratón" si HAY al menos un puntero fino
        // con hover. En portátiles con touchscreen (any-hover=hover, any-pointer=fine)
        // también se activará. Solo bloqueamos en móviles puros.
        const canHover = window.matchMedia('(any-hover: hover)').matches
                       && window.matchMedia('(any-pointer: fine)').matches;
        const isTouch = !canHover;

        // -----------------------------------------------
        // Tilt 3D en cards: usa CSS vars --rx/--ry/--mx/--my.
        //   Aplica a cualquier elemento con clase .tilt-card.
        //   Se activan tras pointerenter y se resetean al salir.
        // -----------------------------------------------
        if (!reducedMotion && !isTouch) {
            const TILT_MAX = 8; // grados máximos
            document.querySelectorAll('.tilt-card').forEach(card => {
                let rafId = 0;
                const onMove = (e) => {
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width;   // 0..1
                    const y = (e.clientY - r.top)  / r.height;  // 0..1
                    const rx = (0.5 - y) * TILT_MAX * 2;         // rotateX
                    const ry = (x - 0.5) * TILT_MAX * 2;         // rotateY
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
                        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
                        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                    });
                };
                const reset = () => {
                    if (rafId) cancelAnimationFrame(rafId);
                    card.style.setProperty('--rx', '0deg');
                    card.style.setProperty('--ry', '0deg');
                };
                card.addEventListener('pointermove', onMove);
                card.addEventListener('pointerleave', reset);
            });
        }

        // Cursor-glow en heroes desactivado: dejaba estela rara al bajar
        // el ratón sobre el canvas de hero-orbs.

        // -----------------------------------------------
        // Count-up en [data-count-up]: anima valores numéricos
        //   al entrar en viewport. Respeta sufijos (%, K, +).
        // -----------------------------------------------
        if ('IntersectionObserver' in window) {
            const animateNumber = (el) => {
                const raw = (el.dataset.countUp || el.textContent || '').trim();
                const match = raw.match(/^([\d.,]+)\s*(.*)$/);
                if (!match) return;
                const target = parseFloat(match[1].replace(',', '.'));
                if (!isFinite(target)) return;
                const suffix = match[2];
                const dur = reducedMotion ? 0 : 1100;
                const start = performance.now();
                const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
                const step = (now) => {
                    const t = dur ? Math.min((now - start) / dur, 1) : 1;
                    const val = target * ease(t);
                    // Conserva número de decimales del target original
                    const decimals = match[1].includes('.') ? 1 : 0;
                    el.textContent = val.toFixed(decimals) + suffix;
                    if (t < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            };
            const io2 = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    animateNumber(entry.target);
                    io2.unobserve(entry.target);
                });
            }, { threshold: 0.4 });
            document.querySelectorAll('[data-count-up]').forEach(el => io2.observe(el));
        }

        // -----------------------------------------------
        // Back-to-top: aparece al scrollear > 400px.
        // -----------------------------------------------
        const btt = document.createElement('button');
        btt.type = 'button';
        btt.className = 'back-to-top';
        btt.setAttribute('aria-label', 'Volver arriba');
        btt.innerHTML = '<span aria-hidden="true">▲</span>';
        btt.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
        document.body.appendChild(btt);
        let bttPending = false;
        const syncBtt = () => {
            btt.classList.toggle('is-visible', window.scrollY > 400);
            bttPending = false;
        };
        window.addEventListener('scroll', () => {
            if (bttPending) return;
            bttPending = true;
            requestAnimationFrame(syncBtt);
        }, { passive: true });
        syncBtt();

        // -----------------------------------------------
        // Botón magnético sutil: desplaza un poco el .btn-primary
        //   al pasar el ratón cerca (solo desktop, sin reduced-motion).
        // -----------------------------------------------
        if (!reducedMotion && !isTouch) {
            document.querySelectorAll('.btn-magnetic').forEach(btn => {
                const strength = 10; // px máximos
                let raf = 0;
                btn.addEventListener('pointermove', (e) => {
                    const r = btn.getBoundingClientRect();
                    const dx = ((e.clientX - r.left) / r.width  - 0.5) * strength;
                    const dy = ((e.clientY - r.top)  / r.height - 0.5) * strength;
                    if (raf) cancelAnimationFrame(raf);
                    raf = requestAnimationFrame(() => {
                        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
                    });
                });
                btn.addEventListener('pointerleave', () => {
                    if (raf) cancelAnimationFrame(raf);
                    btn.style.transform = '';
                });
            });
        }

        // -----------------------------------------------
        // Cursor personalizado: mira estilo Valorant
        //   - 4 líneas (N/S/E/O) + punto central.
        //   - Sigue al cursor vía rAF sobre CSS vars --cx/--cy.
        //   - Se pone en rojo sobre elementos interactivos.
        //   - Animación de retroceso (kick) en cada pointerdown.
        //   - Solo desktop, respeta prefers-reduced-motion.
        // -----------------------------------------------
        if (!reducedMotion && !isTouch) {
            const ch = document.createElement('div');
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

            let cx = -100, cy = -100, chPending = false;
            document.addEventListener('pointermove', (e) => {
                cx = e.clientX; cy = e.clientY;
                if (chPending) return;
                chPending = true;
                requestAnimationFrame(() => {
                    ch.style.setProperty('--cx', cx + 'px');
                    ch.style.setProperty('--cy', cy + 'px');
                    chPending = false;
                });
            }, { passive: true });

            // Selector de "zonas calientes" donde el crosshair se pone rojo
            const HOT_SELECTOR = 'a, button, [role="button"], input, textarea, select, .tilt-card, .map-btn, .agent-btn, .chip, .nav-link, .role-pill';
            document.addEventListener('pointerover', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                ch.classList.toggle('is-hot', !!target.closest(HOT_SELECTOR));
            });

            // Disparo: recoil al pulsar. Quitar y volver a poner la clase
            // reinicia las animaciones en las 4 líneas.
            const fire = () => {
                ch.classList.remove('is-firing');
                // force reflow para reiniciar keyframes
                void ch.offsetWidth;
                ch.classList.add('is-firing');
            };
            document.addEventListener('pointerdown', fire, { passive: true });
            // No se oculta ni reinicia en blur/focus/pointerleave/pointerenter:
            // al cambiar de pestaña la mira queda donde estaba y no reaparece
            // el cursor nativo.
        }
    });
})();
