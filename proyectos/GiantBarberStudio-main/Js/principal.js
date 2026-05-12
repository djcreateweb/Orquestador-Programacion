/**
 * Giant Barber Studio — servicios: imágenes ilustrativas (local + Unsplash/Pexels).
 * `descripcion` explica el tipo de cita / servicio; `altImagen` resume el servicio para accesibilidad.
 */
(function () {
  const URL_RESERVA = "https://giant-barber-studio.reserva-ya.com/";
  const URL_WHATSAPP = "https://wa.me/34640117415";

  /**
   * Parámetros w/h/fit/crop para carga estable.
   */
  const servicios = [
    {
      nombre: "Corte de pelo",
      duracion: "30 min",
      precio: "12.00 €",
      imagen: "Imagenes/Servicios/servicio-corte-pelo.webp",
      descripcion:
        "Corte profesional adaptado a tu estilo y a la forma de tu rostro. Trabajo con tijera y/o máquina, acabado pulido y asesoramiento para que luzcas el resultado en el día a día.",
      altImagen: "Servicio de corte de pelo masculino en barbería profesional.",
    },
    {
      nombre: "Corte + barba",
      duracion: "30 min",
      precio: "16.00 €",
      imagen:
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&w=600&h=600&fit=crop&q=80",
      descripcion:
        "Incluye corte de pelo y arreglo completo de barba en la misma cita: contornos definidos, simetría y volumen al detalle. Ideal si quieres ir bien peinado y con la barba impecable.",
      altImagen: "Pack corte de pelo más perfilado de barba en barbería.",
    },
    {
      nombre: "Arreglo de barba",
      duracion: "30 min",
      precio: "5.00 €",
      imagen:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&w=600&h=600&fit=crop&q=80",
      descripcion:
        "Mantenimiento y perfilado de barba sin corte de pelo: líneas limpias, longitud uniforme y acabado cuidado. Perfecto entre visitas o para dar forma sin cambiar el estilo del cabello.",
      altImagen: "Arreglo y perfilado de barba en barbería.",
    },
    {
      nombre: "Cejas con cera",
      duracion: "30 min",
      precio: "5.00 €",
      imagen: "Imagenes/Servicios/servicio-cejas-cera.webp",
      descripcion:
        "Diseño de cejas con cera para un marco facial definido y simétrico. Depilación precisa y acabado limpio; duradero y apto para un look ordenado y natural.",
      altImagen:
        "Hombre en primer plano: profesional aplicando cera en ceja con espátula de madera, piel tensada con guantes en ambiente de salón.",
    },
    {
      nombre: "Corte + barba + cejas",
      duracion: "30 min",
      precio: "20.00 €",
      imagen:
        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&w=600&h=600&fit=crop&q=80",
      descripcion:
        "La cita más completa: corte de pelo, arreglo de barba y cejas en una sola sesión. Ahorras tiempo y sales con imagen totalmente alineada — pelo, barba y mirada al mismo nivel.",
      altImagen: "Pack integral: corte, barba y cejas en barbería.",
    },
    {
      nombre: "Corte + cejas",
      duracion: "30 min",
      precio: "16.00 €",
      imagen:
        "https://images.unsplash.com/photo-1541533848490-bc8115cd6522?auto=format&w=600&h=600&fit=crop&q=80",
      descripcion:
        "Combina corte de pelo con diseño de cejas en la misma visita. Ideal para renovar el conjunto del rostro: pelo al día y cejas marcadas sin reservar dos citas distintas.",
      altImagen: "Corte de pelo más cejas en barbería.",
    },
  ];

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderServicios() {
    const wrap = document.getElementById("servicios-contenedor");
    if (!wrap) {
      return;
    }
    wrap.innerHTML = servicios
      .map(
        (s, i) => `
      <article class="servicio-tarjeta" data-entrada="${i % 6}" style="--srv-i: ${i}">
        <div class="servicio-imagen">
          <img src="${escHtml(s.imagen)}" alt="${escHtml(s.altImagen)}" width="600" height="600" loading="lazy" decoding="async" />
          <div class="servicio-overlay"><span class="servicio-duracion" aria-hidden="true">⏱ ${escHtml(s.duracion)}</span></div>
        </div>
        <div class="servicio-contenido">
          <h3 class="servicio-nombre">${escHtml(s.nombre)}</h3>
          <p class="servicio-descripcion">${escHtml(s.descripcion)}</p>
          <div class="servicio-footer">
            <span class="servicio-precio">${escHtml(s.precio)}</span>
          </div>
          <div class="servicio-acciones">
            <a href="${URL_RESERVA}" target="_blank" rel="noopener noreferrer" class="servicio-btn servicio-btn--reserva">Reservar cita</a>
            <a href="${URL_WHATSAPP}" target="_blank" rel="noopener noreferrer" class="servicio-btn servicio-btn--wa">WhatsApp</a>
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
