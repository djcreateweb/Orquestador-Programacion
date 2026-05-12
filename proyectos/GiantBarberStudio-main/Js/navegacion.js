/**
 * Giant Barber Studio — menú móvil y cierre al elegir enlace
 */
(function () {
  const btn = document.getElementById("hamburguesa");
  const nav = document.getElementById("navegacion-principal");
  if (!btn || !nav) {
    return;
  }

  function cerrar() {
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir menú");
    nav.classList.remove("navegacion--abierta");
  }

  function abrir() {
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Cerrar menú");
    nav.classList.add("navegacion--abierta");
  }

  btn.addEventListener("click", () => {
    const abierto = btn.getAttribute("aria-expanded") === "true";
    if (abierto) {
      cerrar();
    } else {
      abrir();
    }
  });

  nav.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      cerrar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 1025px)").matches) {
      cerrar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      cerrar();
      btn.focus();
    }
  });

  // Active nav link según sección visible
  const secciones = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-enlace');
  if (secciones.length && navLinks.length) {
    const obsNav = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(a => a.classList.remove('nav-enlace--activo'));
            const link = document.querySelector(`.nav-enlace[href="#${entry.target.id}"]`);
            if (link) link.classList.add('nav-enlace--activo');
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    secciones.forEach(s => obsNav.observe(s));
  }

  // Scroll-to-top
  const btnArriba = document.getElementById('volver-arriba');
  if (btnArriba) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btnArriba.removeAttribute('hidden');
      } else {
        btnArriba.setAttribute('hidden', '');
      }
    }, { passive: true });
    btnArriba.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
