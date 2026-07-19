// tema.js — Estado del tema (claro / oscuro / auto) para Presentia.
// Modelo: `data-tema` en <html> = preferencia del usuario (claro|oscuro|auto);
// `data-tema-efectivo` = claro|oscuro resuelto (lo que usa el CSS). Así el CSS tiene
// UN solo bloque oscuro y `auto` reacciona al sistema sin duplicar media queries.
// La lógica pura (temaEfectivo/siguienteModo) es testeable sin navegador.

export const CLAVE = "presentia.tema";
export const MODOS = ["claro", "oscuro", "auto"];
export const esModoValido = (t) => MODOS.includes(t);

/** Resuelve la preferencia a claro|oscuro dado si el sistema prefiere oscuro. */
export function temaEfectivo(tema, sistemaOscuro) {
  const t = esModoValido(tema) ? tema : "auto";
  if (t === "claro" || t === "oscuro") return t;
  return sistemaOscuro ? "oscuro" : "claro";
}

/** Ciclo del botón: claro → oscuro → auto → claro. */
export function siguienteModo(tema) {
  const i = MODOS.indexOf(esModoValido(tema) ? tema : "auto");
  return MODOS[(i + 1) % MODOS.length];
}

/* ----------------------------- Integración con el navegador ----------------------------- */

function sistemaPrefiereOscuro() {
  try {
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch { return false; }
}

/** Lee la preferencia del dispositivo (localStorage); si no hay, devuelve `defecto`. */
export function leerTema(defecto = "auto") {
  try {
    const t = window.localStorage.getItem(CLAVE);
    return esModoValido(t) ? t : defecto;
  } catch { return defecto; }
}

/** Persiste la preferencia por dispositivo. */
export function guardarTema(tema) {
  try { if (esModoValido(tema)) window.localStorage.setItem(CLAVE, tema); } catch { /* sin storage */ }
}

/** Aplica el tema al <html>. Con `transicion`, activa el cross-fade temporal. */
export function aplicarTema(tema, { transicion = false } = {}) {
  if (typeof document === "undefined") return;
  const raiz = document.documentElement;
  const ef = temaEfectivo(tema, sistemaPrefiereOscuro());
  const cambia = raiz.getAttribute("data-tema-efectivo") !== ef;
  if (transicion && cambia) {
    raiz.classList.add("tema-cambiando");
    clearTimeout(aplicarTema._t);
    aplicarTema._t = setTimeout(() => raiz.classList.remove("tema-cambiando"), 200);
  }
  raiz.setAttribute("data-tema", esModoValido(tema) ? tema : "auto");
  raiz.setAttribute("data-tema-efectivo", ef);
}

/** Suscribe a cambios de `prefers-color-scheme`. Devuelve función para desuscribir. */
export function escucharSistema(cb) {
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => cb(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", h);
    else mq.addListener(h);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", h); else mq.removeListener(h); };
  } catch { return () => {}; }
}
