/**
 * Giant Barber Studio — revelado al scroll. El bloque #inicio se anima al cerrar la precarga;
 * el resto de apartados al entrar en viewport.
 */
(function () {
  const elems = document.querySelectorAll(".animar-al-scroll");
  if (!elems.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elems.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    elems.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const inicio = document.getElementById("inicio");

  function esDelInicio(el) {
    return inicio && inicio.contains(el);
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
  );

  function revelarBloqueInicio() {
    document.querySelectorAll("#inicio .animar-al-scroll").forEach((el) => {
      el.classList.add("is-visible");
    });
  }

  const hayPreloader = document.getElementById("pantalla-carga");

  if (hayPreloader) {
    window.addEventListener("giant-preloader-cerrado", revelarBloqueInicio, { once: true });
  } else {
    window.requestAnimationFrame(() => {
      revelarBloqueInicio();
    });
  }

  elems.forEach((el) => {
    if (!esDelInicio(el)) {
      obs.observe(el);
    }
  });

  function observarTarjetasServicios() {
    document.querySelectorAll(".servicio-tarjeta").forEach((card) => {
      obs.observe(card);
    });
  }

  observarTarjetasServicios();
  window.addEventListener("giant-servicios-renderizados", observarTarjetasServicios);
})();
