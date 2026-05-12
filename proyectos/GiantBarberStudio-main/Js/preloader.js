/**
 * Giant Barber Studio — pantalla de carga: mínimo 2,5 s visibles; tope de seguridad si load tarda.
 */
(function () {
  const root = document.getElementById("pantalla-carga");
  if (!root) {
    return;
  }

  const pctEl = root.querySelector("[data-preloader-pct]");
  let progress = 0;
  let pageReady = false;
  let closing = false;
  let rafId = 0;
  const tiempoMinimoMs = 500;
  const tiempoMaximoMs = 6000;
  const t0 = performance.now();

  function render() {
    const p = Math.min(100, Math.round(progress));
    if (pctEl) {
      pctEl.textContent = `${p}%`;
    }
    root.style.setProperty("--preloader-fill", `${p}%`);
  }

  function finalizar() {
    if (closing) {
      return;
    }
    closing = true;
    cancelAnimationFrame(rafId);
    progress = 100;
    render();
    root.classList.add("pantalla-carga--out");
    setTimeout(() => {
      root.setAttribute("aria-hidden", "true");
      root.style.display = "none";
      document.body.classList.remove("pantalla-carga-activa");
      window.dispatchEvent(new CustomEvent("giant-preloader-cerrado"));
    }, 520);
  }

  function tick(now) {
    if (closing) {
      return;
    }

    const elapsed = now - t0;

    if (elapsed >= tiempoMaximoMs) {
      finalizar();
      return;
    }

    if (elapsed < tiempoMinimoMs) {
      const metaBarra = 5 + (elapsed / tiempoMinimoMs) * 86;
      progress += (metaBarra - progress) * 0.05 + Math.random() * 0.035;
      progress = Math.min(91, progress);
    } else {
      if (pageReady) {
        progress += (100 - progress) * 0.14;
        if (progress >= 99.45) {
          finalizar();
          return;
        }
      } else {
        progress += (97 - progress) * 0.035;
      }
    }

    render();
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("load", () => {
    pageReady = true;
  });

  document.body.classList.add("pantalla-carga-activa");
  render();
  rafId = requestAnimationFrame(tick);
})();
