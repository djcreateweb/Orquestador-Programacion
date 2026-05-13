/**
 * Giant Barber Studio — servicios: imágenes propias en Imagenes/Servicios/.
 * `imagenBase` es el nombre de archivo sin extensión ni ruta; renderServicios()
 * construye el elemento <picture> con srcset responsive (mobile/tablet/desktop webp + jpg fallback).
 * `altImagen` resume el servicio para accesibilidad.
 */
(function () {
  const URL_RESERVA = "https://giant-barber-studio.reserva-ya.com/";
  const URL_WHATSAPP = "https://wa.me/34640117415";

  const servicios = [
    {
      nombre: "Corte de pelo",
      tituloHtml: "CORTE<br>DE PELO",
      duracion: "30 min",
      precio: "12.00 €",
      imagenBase: "servicio-corte-de-pelo-barberia-murcia",
      altImagen: "Antonio Abad realizando corte de pelo en Giant Barber Studio Murcia",
      objectPosition: "center 30%"
    },
    {
      nombre: "Corte + barba",
      tituloHtml: "CORTE +<br>BARBA",
      duracion: "30 min",
      precio: "16.00 €",
      imagenBase: "servicio-corte-y-barba-barberia-murcia",
      altImagen: "Corte de pelo y arreglo de barba en Giant Barber Studio Murcia",
      objectPosition: "center 30%"
    },
    {
      nombre: "Arreglo de barba",
      tituloHtml: "ARREGLO<br>DE BARBA",
      duracion: "30 min",
      precio: "5.00 €",
      imagenBase: "servicio-arreglo-de-barba-barberia-murcia",
      altImagen: "Arreglo y perfilado de barba en Giant Barber Studio Murcia",
      objectPosition: "center 30%"
    },
    {
      nombre: "Cejas con cera",
      tituloHtml: "CEJAS<br>CON CERA",
      duracion: "30 min",
      precio: "5.00 €",
      imagenBase: "servicio-cejas-con-cera-barberia-murcia",
      altImagen: "Diseño de cejas con cera en Giant Barber Studio Murcia",
      objectPosition: "center 25%"
    },
    {
      nombre: "Corte + barba + cejas",
      tituloHtml: "CORTE + BARBA<br>+ CEJAS",
      duracion: "30 min",
      precio: "20.00 €",
      imagenBase: "servicio-corte-barba-cejas-barberia-murcia",
      altImagen: "Pack completo corte, barba y cejas en Giant Barber Studio Murcia",
      objectPosition: "center 30%"
    },
    {
      nombre: "Corte + cejas",
      tituloHtml: "CORTE +<br>CEJAS",
      duracion: "30 min",
      precio: "16.00 €",
      imagenBase: "servicio-corte-y-cejas-barberia-murcia",
      altImagen: "Corte de pelo y cejas en Giant Barber Studio Murcia",
      objectPosition: "center 30%"
    }
  ];

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /**
   * Construye un elemento <picture> con srcset responsive webp + jpg fallback.
   * @param {string} base  — nombre base sin ruta ni extensión
   * @param {string} alt   — texto alternativo
   * @param {string} pos   — valor de object-position
   */
  function pictureSrcset(base, alt, pos) {
    const ruta = "Imagenes/Servicios/";
    return `<picture>
            <source media="(min-width: 1024px)" srcset="${ruta}${base}-desktop.webp" type="image/webp">
            <source media="(min-width: 768px)" srcset="${ruta}${base}-tablet.webp" type="image/webp">
            <source srcset="${ruta}${base}-mobile.webp" type="image/webp">
            <img class="servicio-card__imagen"
                 src="${ruta}${base}.jpg"
                 alt="${escHtml(alt)}"
                 width="600" height="800"
                 loading="lazy" decoding="async"
                 style="object-position: ${escHtml(pos)}">
          </picture>`;
  }

  function renderServicios() {
    const wrap = document.getElementById("servicios-contenedor");
    if (!wrap) {
      return;
    }
    wrap.innerHTML = servicios
      .map(
        (s, i) => `
      <article class="servicio-card" aria-label="${escHtml(s.nombre)}">
        ${pictureSrcset(s.imagenBase, s.altImagen, s.objectPosition)}

        <div class="servicio-card__overlay" aria-hidden="true"></div>

        <div class="servicio-card__top">
          <span class="servicio-card__numero" aria-hidden="true">${i + 1}</span>
          <span class="servicio-card__duracion">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${escHtml(s.duracion)}
          </span>
        </div>

        <div class="servicio-card__bottom">
          <h3 class="servicio-card__titulo">${s.tituloHtml}</h3>
          <p class="servicio-card__precio">${escHtml(s.precio)}</p>
          <div class="servicio-card__acciones">
            <a href="${URL_RESERVA}"
               target="_blank" rel="noopener noreferrer"
               aria-label="Reservar cita para ${escHtml(s.nombre)}"
               class="servicio-card__btn servicio-card__btn--reservar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Reservar cita
            </a>
            <a href="${URL_WHATSAPP}"
               target="_blank" rel="noopener noreferrer"
               aria-label="WhatsApp para ${escHtml(s.nombre)}"
               class="servicio-card__btn servicio-card__btn--whatsapp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </article>
    `
      )
      .join("");

    window.dispatchEvent(new CustomEvent("giant-servicios-renderizados"));
  }

  renderServicios();

  const pieAnio = document.getElementById("pie-anio");
  if (pieAnio) {
    pieAnio.textContent = String(new Date().getFullYear());
  }
})();
