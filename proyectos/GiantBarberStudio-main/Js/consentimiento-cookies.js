(function () {
  const CLAVE = "gbs-cookies-v1";
  const banner = document.getElementById("consentimiento-cookies");
  if (!banner) {
    return;
  }
  const estado = (() => {
    try {
      return localStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  })();

  function persistir(valor) {
    try {
      localStorage.setItem(CLAVE, valor);
    } catch {
      /* privacidad reforzada: si falla, no pasa nada */
    }
  }

  function ocultar() {
    banner.setAttribute("hidden", "");
  }

  function activarMapaSiProcede() {
    if (estado !== "aceptado" && localStorage.getItem(CLAVE) !== "aceptado") {
      return;
    }
    document.querySelectorAll("iframe[data-src-consentimiento]").forEach((f) => {
      f.src = f.getAttribute("data-src-consentimiento");
      f.removeAttribute("data-src-consentimiento");
    });
  }

  if (estado === "aceptado" || estado === "rechazado") {
    ocultar();
    activarMapaSiProcede();
    return;
  }

  banner.removeAttribute("hidden");

  const btnAceptar = banner.querySelector("[data-cookies-aceptar]");
  const btnRechazar = banner.querySelector("[data-cookies-rechazar]");

  btnAceptar?.addEventListener("click", () => {
    persistir("aceptado");
    ocultar();
    activarMapaSiProcede();
  });
  btnRechazar?.addEventListener("click", () => {
    persistir("rechazado");
    ocultar();
  });

  requestAnimationFrame(() => btnAceptar?.focus({ preventScroll: true }));
})();
