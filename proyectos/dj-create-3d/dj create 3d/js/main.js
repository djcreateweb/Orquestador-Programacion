

// ── NAV SCROLLED STATE ─────────────────────────────────────
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 60);
}, { passive: true });

// ── SMOOTH SCROLL PARA ANCLAS ──────────────────────────────
document.querySelectorAll('a[data-scroll]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── REVEAL ON SCROLL (base — solo .reveal) ─────────────────
// Las variantes .reveal-* las gestiona el bloque cinemático abajo.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── AÑO ACTUAL EN FOOTER ───────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── FORM CONTACTO ──────────────────────────────────────────
const form = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.classList.remove('error');
    feedback.textContent = '';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      feedback.classList.add('error');
      feedback.textContent = 'Rellena todos los campos antes de enviar.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.classList.add('error');
      feedback.textContent = 'El email no es válido.';
      return;
    }

    const plan    = (form.plan?.value || 'No especificado').trim();
    const subject = encodeURIComponent('Consulta web — ' + plan);
    const body    = encodeURIComponent(
      'Hola, me llamo ' + name + ' y os escribo desde djcreate.es.\n\n' +
      'Plan de interés: ' + plan + '\n\n' +
      'Mensaje:\n' + message + '\n\n' +
      'Email de contacto: ' + email
    );
    const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1' +
                     '&to=djcreateweb%40gmail.com' +
                     '&su=' + subject +
                     '&body=' + body;
    window.open(gmailUrl, '_blank', 'noopener');

    feedback.textContent = '¡Abriendo Gmail! Revisa la ventana que acaba de abrirse.';
    form.reset();
  });
}

// ════════════════════════════════════════════════════════════
//  CINEMATIC MOTION LAYER  (Subagente 3, integrado)
//  Vanilla — IntersectionObserver + rAF + Web Animations API
// ════════════════════════════════════════════════════════════
(() => {
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  // ── 1) REVEAL VARIANTS + STAGGER ────────────────────────
  const variantSel = '.reveal-up, .reveal-fade, .reveal-blur, .reveal-scale, .reveal-clip';
  const variantIO = new IntersectionObserver((entries, io) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -80px 0px' });
  $$(variantSel).forEach(el => variantIO.observe(el));

  // Stagger en padres con [data-reveal-stagger]
  const staggerIO = new IntersectionObserver((entries, io) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const parent = e.target;
      const step = parseInt(parent.dataset.revealStagger, 10) || 100;
      Array.from(parent.children).forEach((child, i) => {
        child.style.setProperty('--stagger-delay', `${i * step}ms`);
      });
      io.unobserve(parent);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal-stagger]').forEach(el => staggerIO.observe(el));

  // ── 2) SPLIT TEXT (palabras) ────────────────────────────
  // Walker recursivo: tokeniza solo nodos de texto, preserva <br> y <span class="grad">
  function splitWords(el) {
    if (el.dataset.splitDone === '1') return;
    const walk = (node) => {
      const out = document.createDocumentFragment();
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const tokens = child.textContent.split(/(\s+)/);
          tokens.forEach(t => {
            if (/^\s+$/.test(t)) {
              out.appendChild(document.createTextNode(t));
            } else if (t.length) {
              const w = document.createElement('span');
              w.className = 'tw';
              w.textContent = t;
              out.appendChild(w);
            }
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName === 'BR') {
            out.appendChild(child.cloneNode());
            return;
          }
          const clone = child.cloneNode(false);
          clone.appendChild(walk(child));
          out.appendChild(clone);
        }
      });
      return out;
    };
    const frag = walk(el);
    el.innerHTML = '';
    el.appendChild(frag);
    $$('.tw', el).forEach((t, i) => t.style.setProperty('--i', i));
    el.dataset.splitDone = '1';
  }
  $$('.split-words').forEach(splitWords);

  const splitIO = new IntersectionObserver((entries, io) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('split-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
  $$('.split-words').forEach(el => splitIO.observe(el));

  // ── 3) CONTADORES NUMÉRICOS ─────────────────────────────
  function setCounterText(el, value) {
    const prefix = el.dataset.counterPrefix || '';
    const suffix = el.dataset.counterSuffix || '';
    const decimals = parseInt(el.dataset.counterDecimals, 10) || 0;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
  }
  // Pre-fill: setea a 0 para evitar el flash del valor final al entrar al viewport.
  $$('[data-counter]').forEach(el => {
    if (REDUCE) return; // mantén el texto original
    setCounterText(el, 0);
  });

  function animateCounter(el) {
    const target = parseFloat(el.dataset.counter);
    if (Number.isNaN(target)) return;
    if (REDUCE) { setCounterText(el, target); return; }
    const dur = parseInt(el.dataset.counterDuration, 10) || 1400;
    const t0 = performance.now();
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      setCounterText(el, target * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(tick);
      else setCounterText(el, target);
    }
    requestAnimationFrame(tick);
  }
  const counterIO = new IntersectionObserver((entries, io) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      animateCounter(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  $$('[data-counter]').forEach(el => counterIO.observe(el));

  // ── 4) LÍNEAS QUE SE DIBUJAN + DOTS DEL TIMELINE ────────
  const drawIO = new IntersectionObserver((entries, io) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('drawn');
      const dots = $$('.timeline-dot', e.target);
      dots.forEach((d, i) => {
        d.style.setProperty('--dot-delay', `${600 + i * 180}ms`);
        d.classList.add('lit');
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  $$('.steps--timeline, .section-title.has-rule').forEach(el => drawIO.observe(el));

  // ── 5) PARALLAX LIGERO ──────────────────────────────────
  const parallaxItems = $$('[data-parallax-speed]').map(el => ({
    el,
    speed: parseFloat(el.dataset.parallaxSpeed) || 0.15,
    base: el.getBoundingClientRect().top + window.scrollY
  }));
  let pTicking = false;
  function parallaxTick() {
    pTicking = false;
    const sy = window.scrollY;
    const vh = window.innerHeight;
    parallaxItems.forEach(p => {
      const rect = p.el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const offset = (sy + vh / 2 - p.base) * p.speed;
      const clamped = clamp(offset, -300, 300);
      p.el.style.transform = `translate3d(0, calc(-50% + ${clamped}px), 0)`;
    });
  }
  function onScrollParallax() {
    if (REDUCE || !parallaxItems.length) return;
    if (!pTicking) { requestAnimationFrame(parallaxTick); pTicking = true; }
  }
  if (parallaxItems.length && !REDUCE) {
    window.addEventListener('scroll', onScrollParallax, { passive: true });
    window.addEventListener('resize', () => {
      parallaxItems.forEach(p => { p.base = p.el.getBoundingClientRect().top + window.scrollY; });
    }, { passive: true });
    parallaxTick();
  }

  // ── 6) MAGNETIC BUTTONS ─────────────────────────────────
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Cursor custom eliminado — se usa el cursor del navegador.

  if (finePointer && !REDUCE) {
    $$('.btn-main, .nav-cta').forEach(btn => {
      const STRENGTH = 0.22;
      const RADIUS = 90;
      btn.addEventListener('pointermove', (ev) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = ev.clientX - cx;
        const dy = ev.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > RADIUS * 1.6) return;
        btn.style.transform = `translate3d(${dx * STRENGTH}px, ${dy * STRENGTH}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ── 7) TILT 3D EN PORTFOLIO ─────────────────────────────
  if (finePointer && !REDUCE) {
    $$('.portfolio-card:not(.portfolio-card--cta)').forEach(card => {
      let raf = null, lastEv = null;
      const MAX = 5; // grados
      function apply() {
        raf = null;
        if (!lastEv) return;
        const r = card.getBoundingClientRect();
        const px = (lastEv.clientX - r.left) / r.width - 0.5;
        const py = (lastEv.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateY(-4px)`;
      }
      card.addEventListener('pointermove', (ev) => {
        lastEv = ev;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', () => {
        lastEv = null;
        card.style.transform = '';
      });
    });
  }

  // ── 8) SCROLL HINT — fade + cursor follow ───────────────
  const scrollHint = document.querySelector('.scroll-hint');
  const heroSec = document.getElementById('hero');
  if (scrollHint) {
    window.addEventListener('scroll', () => {
      scrollHint.classList.toggle('hidden', window.scrollY > 80);
    }, { passive: true });
  }
  // Cursor follow — solo en hero, con puntero fino y sin reduce-motion
  // El reticle (.shc) queda anclado al cursor; "Scroll" + drip caen debajo.
  if (scrollHint && heroSec && finePointer && !REDUCE) {
    const RETICLE_HALF = 14;       // mitad del SVG (28px)
    const LERP = 0.22;             // follow rápido pero suave
    const TX_TPL = (x, y) => `translate3d(${x}px, ${y}px, 0) translate(-50%, -${RETICLE_HALF}px)`;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    let following = false;
    let rafFollow = null;

    function followTick() {
      cx += (tx - cx) * LERP;
      cy += (ty - cy) * LERP;
      scrollHint.style.transform = TX_TPL(cx, cy);
      if (following && (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3)) {
        rafFollow = requestAnimationFrame(followTick);
      } else {
        rafFollow = null;
      }
    }

    function activate(ev) {
      following = true;
      scrollHint.classList.add('scroll-hint--following');
      cx = ev.clientX; cy = ev.clientY;
      tx = cx; ty = cy;
      scrollHint.style.transform = TX_TPL(cx, cy);
    }

    // Activamos con pointermove (más fiable que pointerenter cuando el mouse
    // ya estaba sobre el hero al desaparecer la intro).
    heroSec.addEventListener('pointermove', (ev) => {
      if (!following) {
        activate(ev);
        return;
      }
      tx = ev.clientX;
      ty = ev.clientY;
      if (!rafFollow) rafFollow = requestAnimationFrame(followTick);
    });
    heroSec.addEventListener('pointerleave', () => {
      following = false;
      scrollHint.classList.remove('scroll-hint--following');
      scrollHint.style.transform = '';
    });
  }

  // ── 9) FORM: HAS-VALUE STATE PARA LABEL FLOTANTE ────────
  $$('.contacto-form .field').forEach(f => {
    const input = f.querySelector('input, textarea, select');
    if (!input) return;
    const sync = () => f.classList.toggle('has-value', !!input.value && input.value !== '');
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    sync();
  });

  // ── 10) PORTFOLIO VIDEOS — play/pause según viewport ────
  const portfolioVideos = $$('.portfolio-card video');
  if (portfolioVideos.length) {
    const videoIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting && e.intersectionRatio > 0.25) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75] });
    portfolioVideos.forEach(v => videoIO.observe(v));
  }

  // ── 11) SUBMIT SUCCESS STATE ────────────────────────────
  const formEl = document.getElementById('contactForm');
  const submitBtn = formEl?.querySelector('.btn-submit');
  if (formEl && submitBtn) {
    formEl.addEventListener('submit', () => {
      // Espera al feedback que pone el handler original (lína 41)
      setTimeout(() => {
        if (feedback?.classList.contains('error')) return;
        if (feedback?.textContent?.startsWith('¡Mensaje')) {
          submitBtn.classList.add('is-success');
          submitBtn.disabled = true;
          setTimeout(() => {
            submitBtn.classList.remove('is-success');
            submitBtn.disabled = false;
          }, 2400);
        }
      }, 50);
    });
  }
})();
