/**
 * Giant Barber Studio V2.1 — galería desde manifest + fallback Unsplash
 */
(function () {
  const FALLBACK_ITEMS = [
    {
      src: "https://images.unsplash.com/photo-1599351431902-8d2ebb931e25?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 1",
      descripcion: "Ambiente de barbería profesional.",
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 2",
      descripcion: "Detalle de trabajo y estilo.",
    },
    {
      src: "https://images.unsplash.com/photo-1500636136210-6f4ee915583e?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 3",
      descripcion: "Zona de servicio y acabado.",
    },
    {
      src: "https://images.unsplash.com/photo-1570158268183-d296b2892211?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 4",
      descripcion: "Espacio pensado para el cliente.",
    },
    {
      src: "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 5",
      descripcion: "",
    },
    {
      src: "https://images.unsplash.com/photo-1599351436436-49f89e552b8c?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 6",
      descripcion: "",
    },
    {
      src: "https://images.unsplash.com/photo-1552058544-f8b08422c7f6?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 7",
      descripcion: "",
    },
    {
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 8",
      descripcion: "",
    },
    {
      src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 9",
      descripcion: "",
    },
    {
      src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=800&fit=crop&q=80",
      alt: "Estilo barbería 10",
      descripcion: "",
    },
  ];

  function normalizarItem(it, i) {
    const obj = typeof it === "string" ? { src: it } : it;
    return {
      src: obj.src,
      srcset: obj.srcset || null,
      sizes: obj.sizes || null,
      alt: obj.alt || `Imagen ${i + 1}`,
      descripcion: typeof obj.descripcion === "string" ? obj.descripcion : "",
    };
  }

  async function cargarItems() {
    try {
      const res = await fetch("Data/manifest-galeria.json", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("manifest no disponible");
      }
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((it, i) => normalizarItem(it, i));
      }
      if (Array.isArray(data.images) && data.images.length > 0) {
        return data.images.map((src, i) => normalizarItem({ src }, i));
      }
    } catch {
      /* usar fallback */
    }
    return FALLBACK_ITEMS;
  }

  const grid = document.getElementById("galeria-contenedor");
  const lightbox = document.getElementById("lightbox");
  const imgEl = document.getElementById("lightbox-imagen");
  const captionEl = document.getElementById("lightbox-caption");
  const btnCerrar = document.getElementById("lightbox-cerrar");
  const btnPrev = document.getElementById("lightbox-prev");
  const btnNext = document.getElementById("lightbox-next");
  const contador = document.getElementById("lightbox-contador");

  if (!grid || !lightbox || !imgEl || !btnCerrar || !btnPrev || !btnNext) {
    return;
  }

  let items = [];
  let abierto = false;
  let indice = 0;
  let ultimoFoco = null;

  const ENTRADAS_GALERIA = [
    "fade-up",
    "fade-down",
    "fade-left",
    "fade-right",
    "scale-in",
    "blur-in",
    "skew-in",
    "tilt-in",
    "rotate-in",
    "clip-up",
  ];

  function renderGrid() {
    grid.innerHTML = "";
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "galeria-card";
      card.setAttribute("role", "listitem");

      const btn = document.createElement("div");
      btn.className = "galeria-item animar-al-scroll";
      btn.setAttribute("data-anim", ENTRADAS_GALERIA[i % ENTRADAS_GALERIA.length]);
      const imgNodo = document.createElement("img");
      imgNodo.src = item.src;
      if (item.srcset) imgNodo.srcset = item.srcset;
      if (item.sizes) imgNodo.sizes = item.sizes;
      imgNodo.alt = item.alt || "";
      imgNodo.width = 675;
      imgNodo.height = 1200;
      imgNodo.loading = "lazy";
      imgNodo.decoding = "async";
      if (item.objectPosition) imgNodo.style.objectPosition = item.objectPosition;
      btn.appendChild(imgNodo);

      card.appendChild(btn);

      if (item.descripcion) {
        const cap = document.createElement("p");
        cap.className = "galeria-caption";
        cap.textContent = item.descripcion;
        card.appendChild(cap);
      }

      grid.appendChild(card);
    });

    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
      );
      grid.querySelectorAll(".animar-al-scroll").forEach((el) => obs.observe(el));
    } else {
      grid.querySelectorAll(".animar-al-scroll").forEach((el) => el.classList.add("is-visible"));
    }
  }

  function actualizarContador() {
    if (contador) {
      const cur = items[indice];
      contador.textContent = `${indice + 1} / ${items.length}${cur?.alt ? " — " + cur.alt : ""}`;
    }
  }

  function mostrarActual() {
    const cur = items[indice];
    imgEl.src = cur.src;
    imgEl.alt = cur.alt;
    if (captionEl) {
      if (cur.descripcion) {
        captionEl.textContent = cur.descripcion;
        captionEl.removeAttribute("hidden");
      } else {
        captionEl.textContent = "";
        captionEl.setAttribute("hidden", "");
      }
    }
    actualizarContador();
  }

  function obtenerHermanosParaInert() {
    return Array.from(document.body.children).filter((el) => el !== lightbox);
  }

  function aplicarInert(activar) {
    obtenerHermanosParaInert().forEach((el) => {
      if (activar) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function abrir(i, trigger) {
    ultimoFoco = trigger || document.activeElement;
    indice = i;
    mostrarActual();
    lightbox.removeAttribute("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    aplicarInert(true);
    requestAnimationFrame(() => lightbox.classList.add("lightbox--activo"));
    document.body.style.overflow = "hidden";
    abierto = true;
    btnCerrar.focus();
  }

  function cerrar() {
    lightbox.classList.remove("lightbox--activo");
    lightbox.setAttribute("aria-hidden", "true");
    aplicarInert(false);
    document.body.style.overflow = "";
    abierto = false;
    if (captionEl) {
      captionEl.textContent = "";
      captionEl.setAttribute("hidden", "");
    }
    setTimeout(() => {
      lightbox.setAttribute("hidden", "");
      imgEl.removeAttribute("src");
      imgEl.alt = "";
    }, 200);
    if (ultimoFoco && typeof ultimoFoco.focus === "function") {
      ultimoFoco.focus();
    }
  }

  function prev() {
    indice = (indice - 1 + items.length) % items.length;
    mostrarActual();
  }

  function next() {
    indice = (indice + 1) % items.length;
    mostrarActual();
  }

  btnCerrar.addEventListener("click", cerrar);
  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
  });
  btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    next();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      cerrar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!abierto) {
      return;
    }
    if (e.key === "Escape") {
      cerrar();
    }
    if (e.key === "ArrowLeft") {
      prev();
    }
    if (e.key === "ArrowRight") {
      next();
    }
  });

  let touchStartX = null;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      if (!abierto || !e.changedTouches.length) {
        return;
      }
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  lightbox.addEventListener(
    "touchend",
    (e) => {
      if (!abierto || touchStartX === null || !e.changedTouches.length) {
        touchStartX = null;
        return;
      }
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 56) {
        return;
      }
      if (dx > 0) {
        prev();
      } else {
        next();
      }
    },
    { passive: true }
  );

  cargarItems().then((loaded) => {
    items = loaded.length ? loaded : FALLBACK_ITEMS;
    renderGrid();
  });
})();
