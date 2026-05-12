/**
 * Giant Barber Studio — Tijeras automáticas
 *
 * Al cargar la página las tijeras bajan solas por los laterales
 * sin que el usuario haga nada. Se quedan abiertas abajo.
 * Al hacer scroll a la sección 2, la izquierda sube rápido
 * y la derecha baja rápido como transición de página.
 */
(function () {
  "use strict";

  var izqEl = document.getElementById("tijeras-izq");
  var derEl = document.getElementById("tijeras-der");
  var cIzq  = document.getElementById("tijeras-canvas-izq");
  var cDer  = document.getElementById("tijeras-canvas-der");

  if (!cIzq || !cDer || !izqEl || !derEl) return;

  var ctxIzq = cIzq.getContext("2d");
  var ctxDer = cDer.getContext("2d");

  if (!ctxIzq || !ctxDer) {
    console.warn("[tijeras] Canvas 2D no disponible, animación desactivada");
    return;
  }

  var SRC    = 960;
  /* HiDPI / Retina: usamos el devicePixelRatio (limitado a 2x para no saturar
   * móviles) para que el buffer interno del canvas sea más nítido sin cambiar
   * las dimensiones lógicas (SRC) usadas en drawImage. */
  var ratio = Math.min(window.devicePixelRatio || 1, 2);
  cIzq.width  = cDer.width  = SRC * ratio;
  cIzq.height = cDer.height = SRC * ratio;
  ctxIzq.scale(ratio, ratio);
  ctxDer.scale(ratio, ratio);

  /* Detectar recarga con scroll ya avanzado: si el usuario refresca la página
   * con scroll > 100px, evitamos el delay/fade-in inicial para que las tijeras
   * aparezcan de inmediato en su sitio. */
  var scrollInicial = window.scrollY || window.pageYOffset || 0;
  var recargaConScroll = scrollInicial > 100;

  var TOTAL = 40;
  var imgs  = [];
  var vw, vh, SIZE;
  var animado = false; /* evita re-lanzar la animación en resize */

  /* ── Precargar frames ─────────────────────────────────── */
  function precargar(cb) {
    var n = 0;
    var called = false;
    function done() {
      if (called) return;
      called = true;
      if (cb) cb();
    }
    /* Fallback: si tras 8s no se han cargado todos los frames, lanzamos la
     * animación con los que haya disponibles para no bloquear la página. */
    var timeout = setTimeout(function () {
      console.warn("[tijeras] Timeout precarga: lanzando animación con frames disponibles");
      done();
    }, 8000);
    for (var i = 1; i <= TOTAL; i++) {
      (function (idx) {
        var img = new Image();
        img.onload = function () {
          if (++n >= TOTAL) {
            clearTimeout(timeout);
            done();
          }
        };
        img.onerror = function () {
          console.error("[tijeras] Frame no cargado:", this.src);
          if (++n >= TOTAL) {
            clearTimeout(timeout);
            done();
          }
        };
        img.src = "Videos/frames-transparentes/frame_" +
          String(idx).padStart(4, "0") + ".png";
        imgs[idx - 1] = img;
      })(i);
    }
  }

  /* ── Dibujar frame ────────────────────────────────────── */
  var pendingFrame = 0;
  var rafPendiente = false;

  function flush() {
    rafPendiente = false;
    var fi = Math.max(0, Math.min(TOTAL - 1, Math.round(pendingFrame)));

    /* Izquierda: normal */
    ctxIzq.clearRect(0, 0, SRC, SRC);
    if (imgs[fi] && imgs[fi].complete && imgs[fi].naturalWidth > 0)
      ctxIzq.drawImage(imgs[fi], 0, 0, SRC, SRC);

    /* Derecha: espejada */
    ctxDer.clearRect(0, 0, SRC, SRC);
    if (imgs[fi] && imgs[fi].complete && imgs[fi].naturalWidth > 0) {
      ctxDer.save();
      ctxDer.translate(SRC, 0);
      ctxDer.scale(-1, 1);
      ctxDer.drawImage(imgs[fi], 0, 0, SRC, SRC);
      ctxDer.restore();
    }
  }

  function dibujar(idx) {
    pendingFrame = idx;
    if (!rafPendiente) {
      rafPendiente = true;
      requestAnimationFrame(flush);
    }
  }

  /* ── Dimensiones ──────────────────────────────────────── */
  function calcDims() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    if (vw >= 1200) {
      SIZE = Math.round(Math.min(vw * 0.18, vh * 0.32, 320));   /* desktop: reducido */
    } else if (vw >= 768) {
      SIZE = Math.round(Math.min(vw * 0.20, vh * 0.32, 300));   /* tablet */
    } else {
      SIZE = Math.round(Math.min(vw * 0.30, 120));                /* móvil: más grandes */
    }
    cIzq.style.width = cIzq.style.height =
    cDer.style.width = cDer.style.height = SIZE + "px";
    document.documentElement.style.setProperty('--tijeras-size', SIZE + 'px');
  }

  /* ── Animación principal ──────────────────────────────── */
  function lanzarAnimacion() {
    if (animado) return;
    animado = true;

    try {
      var xIzq = SIZE * 0.35;        /* más pegadas al borde izq, 15% fuera */
      var xDer = vw - SIZE * 0.35;   /* más pegadas al borde der, 15% fuera */
      var yIni = -(SIZE * 0.6);  /* arranca fuera de pantalla */
      var yFin = vh * 0.5;       /* para centrada verticalmente */

      /*
       * La animación auto llega hasta el frame FRAME_LLEGADA (~40% de apertura).
       * A partir de ahí el scroll controla la apertura completa.
       */
      var FRAME_LLEGADA = Math.round(TOTAL * 0.40); /* ≈ frame 16 */

      /*
       * Si la página se recarga con scroll > 100px, evitamos el delay y el
       * fade-in iniciales: arrancamos con opacidad 1 y la posición Y final
       * para que las tijeras aparezcan ya colocadas.
       */
      var opIni  = recargaConScroll ? 1 : 0;
      var yIni0  = recargaConScroll ? yFin : yIni;
      var frame0 = recargaConScroll ? FRAME_LLEGADA : 0;
      var delay  = recargaConScroll ? 0 : 0.4;

      gsap.set(izqEl, { x: xIzq, y: yIni0, xPercent: -50, yPercent: -50, opacity: opIni });
      gsap.set(derEl, { x: xDer, y: yIni0, xPercent: -50, yPercent: -50, opacity: opIni });
      dibujar(frame0);

      var proxy = { frame: frame0, yPos: yIni0 };

      var tl = gsap.timeline({ delay: delay });

      if (!recargaConScroll) {
        tl.to([izqEl, derEl], { opacity: 1, duration: 0.3, ease: "power1.in" });
      }

      /* Bajan y se abren parcialmente (hasta FRAME_LLEGADA) */
      tl.to(proxy, {
        frame: FRAME_LLEGADA,
        yPos:  yFin,
        duration: recargaConScroll ? 0 : 2.4,
        ease:  "power2.inOut",
        onUpdate: function () {
          gsap.set(izqEl, { x: xIzq, y: proxy.yPos, xPercent: -50, yPercent: -50 });
          gsap.set(derEl, { x: xDer, y: proxy.yPos, xPercent: -50, yPercent: -50 });
          dibujar(proxy.frame);
        },
        onComplete: function () {
          dibujar(FRAME_LLEGADA);

          /*
           * Scroll controla la apertura completa: FRAME_LLEGADA → TOTAL-1
           * mientras el usuario scrollea por las secciones 1 y 2.
           *
           * scrub más bajo en móvil (0.4) para que la animación NO arrastre
           * el scroll: con scrub:2 el motor de GSAP se queda "pillando" el
           * progreso durante 2 segundos después de cada touch, lo que el
           * usuario percibe como un atasco/parón al deslizar. En desktop
           * mantenemos un scrub algo más alto para suavidad.
           */
          var esMovil = window.matchMedia("(max-width: 768px)").matches;
          ScrollTrigger.create({
            trigger: ".video-scroll-zona",
            start:   "top top",
            end:     "bottom bottom",
            scrub:   esMovil ? 0.4 : 1,
            onUpdate: function (self) {
              var f = FRAME_LLEGADA + self.progress * (TOTAL - 1 - FRAME_LLEGADA);
              dibujar(f);
            }
          });
        }
      }, recargaConScroll ? 0 : "<0.05");

      /*
       * Salida en sección 3 (#equipo):
       * izquierda sube rápido, derecha baja rápido.
       */
      ScrollTrigger.create({
        trigger: "#equipo",
        start:   "top 82%",
        once:    true,
        onEnter: function () {
          gsap.to(izqEl, { y: -(SIZE * 2), opacity: 0, duration: 0.55, ease: "power3.in" });
          gsap.to(derEl, { y: vh + SIZE * 1.5, opacity: 0, duration: 0.55, ease: "power3.in" });
        }
      });
    } catch (err) {
      console.error("[tijeras] Error iniciando animación:", err);
      /* Fallback: si GSAP/ScrollTrigger fallan, mostramos las tijeras estáticas
       * con el primer frame para no dejar la zona vacía. */
      if (imgs[0] && imgs[0].complete) {
        izqEl.style.opacity = "1";
        derEl.style.opacity = "1";
        if (ctxIzq && ctxDer) {
          ctxIzq.clearRect(0, 0, SRC, SRC);
          ctxIzq.drawImage(imgs[0], 0, 0, SRC, SRC);
          ctxDer.save();
          ctxDer.clearRect(0, 0, SRC, SRC);
          ctxDer.translate(SRC, 0);
          ctxDer.scale(-1, 1);
          ctxDer.drawImage(imgs[0], 0, 0, SRC, SRC);
          ctxDer.restore();
        }
      }
    }
  }

  /* ── Arranque ─────────────────────────────────────────── */
  calcDims();
  dibujar(0);

  precargar(function () {
    dibujar(0);
    lanzarAnimacion();
  });

  /* Resize: re-posicionar sin re-animar.
   *
   * En iOS Safari, mostrar/ocultar la barra de URL durante el scroll dispara
   * eventos `resize` con cambios SOLO de altura. Si refrescamos ScrollTrigger
   * en cada uno, el scroll se siente "atascado" porque el motor recalcula
   * los rangos a mitad del gesto. Solo refrescamos cuando cambia el ancho
   * (rotación o cambio real de viewport). */
  var resizeTimer;
  var anchoPrev = window.innerWidth;
  window.addEventListener("resize", function () {
    var anchoNuevo = window.innerWidth;
    var soloAltura = anchoNuevo === anchoPrev;
    if (soloAltura) return;
    anchoPrev = anchoNuevo;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      calcDims();
      /* Actualizar posición X al nuevo ancho */
      gsap.set(izqEl, { x: SIZE * 0.35, xPercent: -50 });
      gsap.set(derEl, { x: vw - SIZE * 0.35, xPercent: -50 });
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 260);
  });

})();
