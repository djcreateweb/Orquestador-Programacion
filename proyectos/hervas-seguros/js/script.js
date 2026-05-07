/* ============================================================
   HERVÁS SEGUROS — JAVASCRIPT PRINCIPAL
   ============================================================
   Funcionalidades:
   1. Navbar: cambio de estilo al hacer scroll + menú mobile
   2. Scroll Reveal: animación de entrada por Intersection Observer
   3. Contador animado de stats
   4. Tabs de tipos de seguro (seguros.html)
   5. Slider de testimonios (nosotros.html)
   6. Formulario de presupuesto con validación (contacto.html)
   7. Smooth scroll para anclas internas
   8. Lazy loading de imágenes
   ============================================================ */

'use strict';

/* ============================================================
   1. NAVBAR — scroll + mobile toggle
   ============================================================ */
(function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const menu     = document.getElementById('navMenu');
  const overlay  = document.getElementById('navOverlay');

  if (!navbar) return;

  // Cambio de clase al hacer scroll
  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('navbar--scrolled');
      navbar.classList.remove('navbar--transparent');
    } else {
      navbar.classList.remove('navbar--scrolled');
      navbar.classList.add('navbar--transparent');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estado inicial

  // Mobile toggle
  if (toggle && menu) {
    function closeMenu() {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-is-open');
      if (overlay) overlay.classList.remove('is-visible');
    }

    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('is-open');
      toggle.classList.toggle('is-active');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-is-open', isOpen);
      if (overlay) overlay.classList.toggle('is-visible', isOpen);
    });

    // Cerrar al hacer click en un link del menu
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Cerrar al hacer click en overlay
    if (overlay) {
      overlay.addEventListener('click', function () {
        closeMenu();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  // Marcar el link activo según la página actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navbar.querySelectorAll('.nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ============================================================
   2. SCROLL REVEAL — Intersection Observer
   ============================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();

/* ============================================================
   3. CONTADOR ANIMADO DE STATS
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const duration = 2000;
    const step     = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString('es-ES');
    }, step);
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (counter) {
    observer.observe(counter);
  });
})();

/* ============================================================
   4. TABS DE TIPOS DE SEGURO
   ============================================================ */
(function initTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (!tabBtns.length) return;

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = btn.getAttribute('data-tab');

      // Quitar activo de todos
      tabBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(function (p) { p.classList.remove('active'); });

      // Activar seleccionado
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });
})();

/* ============================================================
   5. SLIDER DE TESTIMONIOS
   ============================================================ */
(function initSlider() {
  const track  = document.querySelector('.slider__track');
  const dots   = document.querySelectorAll('.dot');
  const btnPrev = document.getElementById('sliderPrev');
  const btnNext = document.getElementById('sliderNext');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!track) return;

  let currentIndex = 0;
  const slides = track.querySelectorAll('.testimonial-card');
  const total  = slides.length;

  function goTo(index) {
    currentIndex = (index + total) % total;
    track.style.setProperty('--slider-offset', '-' + (currentIndex * 100) + '%');
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === currentIndex);
      d.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
    });
  }

  if (btnPrev) btnPrev.addEventListener('click', function () { goTo(currentIndex - 1); });
  if (btnNext) btnNext.addEventListener('click', function () { goTo(currentIndex + 1); });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { goTo(i); });
  });

  // Auto-play cada 5 segundos
  let autoplay = reduceMotion ? null : setInterval(function () { goTo(currentIndex + 1); }, 5000);

  // Pausar al hacer hover
  if (track.parentElement) {
    track.parentElement.addEventListener('mouseenter', function () {
      if (autoplay) clearInterval(autoplay);
    });
    track.parentElement.addEventListener('mouseleave', function () {
      if (!reduceMotion) {
        autoplay = setInterval(function () { goTo(currentIndex + 1); }, 5000);
      }
    });
  }

  // Touch/swipe en mobile
  let startX = 0;
  track.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: true });

  goTo(0);
})();

/* ============================================================
   6. FORMULARIO DE PRESUPUESTO — validación y envío simulado
   ============================================================ */
(function initForm() {
  const form    = document.getElementById('presupuestoForm');
  const success = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validación básica
    let valid = true;
    const required = form.querySelectorAll('[required]');

    required.forEach(function (field) {
      const group = field.closest('.form-group');
      field.classList.remove('is-invalid');
      if (group) group.classList.remove('is-invalid');
      if (!field.value.trim()) {
        field.classList.add('is-invalid');
        if (group) group.classList.add('is-invalid');
        valid = false;
      }
    });

    // Validar email
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        emailField.classList.add('is-invalid');
        valid = false;
      }
    }

    if (!valid) return;

    // Simular envío
    const submitBtn = form.querySelector('.form-submit');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    setTimeout(function () {
      form.classList.add('is-hidden');
      if (success) {
        success.classList.add('is-visible');
        success.textContent = 'Solicitud recibida. Nos pondremos en contacto contigo en menos de 24 horas.';
      }
    }, 1200);
  });

  // Eliminar borde rojo al escribir
  form.querySelectorAll('input, select, textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      field.classList.remove('is-invalid');
      const group = field.closest('.form-group');
      if (group) group.classList.remove('is-invalid');
    });
  });
})();

/* ============================================================
   7. SMOOTH SCROLL para anclas internas
   ============================================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = document.getElementById('navbar')
        ? document.getElementById('navbar').offsetHeight
        : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   8. LAZY LOADING de imágenes
   ============================================================ */
(function initLazyLoad() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (!lazyImages.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
        img.classList.add('is-loaded');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  lazyImages.forEach(function (img) {
    observer.observe(img);
  });
})();
