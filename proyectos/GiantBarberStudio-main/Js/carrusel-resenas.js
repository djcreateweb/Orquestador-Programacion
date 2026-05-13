/**
 * Giant Barber Studio — reseñas (datos reales) + carrusel con fade
 */
(function () {
  /** Ficha de Google Maps (reseña: botón «Escribir una reseña» en la ficha). */
  const ENLACE_ESCRIBIR_RESEÑA_GOOGLE =
    "https://g.page/r/Cf4gq3v3Ng7dEBM/review";

  function aplicarEnlaceResenaDirecto() {
    const enlace = document.querySelector(".resenas-enlace-reseña");
    if (!enlace) {
      return;
    }
    if (ENLACE_ESCRIBIR_RESEÑA_GOOGLE) {
      enlace.href = ENLACE_ESCRIBIR_RESEÑA_GOOGLE;
    }
  }

  aplicarEnlaceResenaDirecto();

  const resenas = [
    {
      autor: "Alvaro Zamora Perez",
      calificacion: 5,
      fecha: "Hace 5 meses",
      texto:
        "Recientemente acudí a una cita con Antonio y no pude quedar más contento. No suelo tener mucha idea acerca de qué corte de pelo hacerme, así que dejé que me aconsejara y el resultado fue excelente.",
    },
    {
      autor: "Romkillo",
      calificacion: 5,
      fecha: "Hace 4 meses",
      texto:
        "Increíble, todas las veces que he ido ha sido muy majo. Además siempre que quedo con alguna chica destaca el buen corte de Giant Barber. Repetiría sin duda. :)",
    },
    {
      autor: "Jose María Abad Cruz",
      calificacion: 5,
      fecha: "Hace un año",
      texto:
        "Espectacular. Siempre tardé un montón de tiempo en ir a cortarme el pelo y en otros sitios no acababa de encajar. Con Antonio el trato y el resultado son de diez.",
    },
  ];

  const root = document.querySelector("[data-carrusel-resenas]");
  const pista = root?.querySelector("[data-resenas-pista]");
  const btnPrev = root?.querySelector("[data-resena-prev]");
  const btnNext = root?.querySelector("[data-resena-next]");
  const puntosWrap = root?.querySelector("[data-resenas-puntos]");

  if (!root || !pista || !btnPrev || !btnNext || !puntosWrap) {
    return;
  }

  function estrellas(n) {
    return "★".repeat(n);
  }

  // SECURITY NOTE: innerHTML is used here with the `resenas` array which is
  // HARDCODED in this file (no external/user input). The data never originates
  // from user input, URL parameters, or external APIs, so XSS risk is contained.
  // If review data is ever loaded from an external source in the future, each
  // field (autor, texto, fecha) MUST be sanitized with giantSanitizeTexto()
  // from utilidades.js before being interpolated into innerHTML.
  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  resenas.forEach((r) => {
    const slide = document.createElement("article");
    slide.className = "resena-slide";
    slide.innerHTML = `
      <div class="resena-slide__estrellas" aria-label="${escHtml(r.calificacion)} de 5 estrellas">${estrellas(r.calificacion)}</div>
      <p class="resena-slide__texto">${escHtml(r.texto)}</p>
      <p class="resena-slide__autor">${escHtml(r.autor)}</p>
      <p class="resena-slide__fecha">${escHtml(r.fecha)}</p>
    `;
    pista.appendChild(slide);
  });

  const slides = pista.querySelectorAll(".resena-slide");
  let idx = 0;

  puntosWrap.innerHTML = "";
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "resenas-punto";
    b.setAttribute("aria-label", `Ver reseña ${i + 1} de ${slides.length}`);
    b.addEventListener("click", () => ir(i));
    puntosWrap.appendChild(b);
  });

  const puntos = () => puntosWrap.querySelectorAll(".resenas-punto");

  function actualizarPuntos() {
    puntos().forEach((p, i) => {
      p.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  }

  const paso = 100 / slides.length;

  function ir(i) {
    idx = (i + slides.length) % slides.length;
    pista.classList.add("resenas-pista--fade");
    setTimeout(() => {
      pista.style.transform = `translateX(-${paso * idx}%)`;
      actualizarPuntos();
      pista.classList.remove("resenas-pista--fade");
    }, 220);
  }

  pista.style.display = "flex";
  pista.style.width = `${slides.length * 100}%`;
  slides.forEach((s) => {
    s.style.flex = `0 0 ${paso}%`;
  });

  btnPrev.addEventListener("click", () => ir(idx - 1));
  btnNext.addEventListener("click", () => ir(idx + 1));

  actualizarPuntos();
})();
