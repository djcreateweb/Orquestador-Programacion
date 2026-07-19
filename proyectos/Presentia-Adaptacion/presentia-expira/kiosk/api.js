// api.js — Wrapper fetch del kiosko de Presentia.
// Sin dependencias: `fetch` nativo. Cada petición envía la cabecera de dispositivo
// `x-presentia-dispositivo`. El token de micro-sesión vive en memoria de React (NO
// en localStorage) y se pasa en el body de cada llamada autenticada.

export const TZ_DEFECTO = "Europe/Madrid";

export class ApiError extends Error {
  constructor(code, mensaje, status) {
    super(mensaje || code);
    this.name = "ApiError";
    this.code = code;
    this.mensaje = mensaje || "Se ha producido un error.";
    this.status = status || 0;
  }
}

/**
 * Crea el cliente de API del kiosko.
 * @param {object} opts
 * @param {string} [opts.base="/presentia"]  prefijo de rutas.
 * @param {string} opts.dispositivo  identificador del dispositivo/kiosko.
 */
export function crearApiKiosk({ base = "/presentia", dispositivo }) {
  async function pedir(ruta, { method = "GET", body } = {}) {
    let res;
    try {
      res = await fetch(`${base}${ruta}`, {
        method,
        headers: {
          "x-presentia-dispositivo": dispositivo || "desconocido",
          ...(body != null ? { "Content-Type": "application/json" } : {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError("RED", "No hay conexión con el servidor. Inténtalo de nuevo.");
    }
    let json = null;
    try {
      json = await res.json();
    } catch {
      throw new ApiError("RESPUESTA_INVALIDA", "Respuesta no válida del servidor.", res.status);
    }
    if (!res.ok || !json || json.ok !== true) {
      const e = (json && json.error) || {};
      throw new ApiError(e.code || "ERROR", e.mensaje || "Se ha producido un error.", res.status);
    }
    return json.data;
  }

  function qs(params = {}) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  return {
    base,
    dispositivo,
    empleados: () => pedir("/kiosk/empleados"),
    entrar: (empleadoId, pin) => pedir("/kiosk/entrar", { method: "POST", body: { empleadoId, pin } }),
    estado: (token) => pedir("/kiosk/estado", { method: "POST", body: { token } }),
    fichar: (token) => pedir("/kiosk/fichar", { method: "POST", body: { token } }),
    misRegistros: (token, desde, hasta) =>
      pedir("/kiosk/mis-registros", { method: "POST", body: { token, desde, hasta } }),
    crearSolicitud: (payload) => pedir("/kiosk/solicitud", { method: "POST", body: payload }),
    aceptarTerminos: (token) => pedir("/kiosk/terminos/aceptar", { method: "POST", body: { token } }),
    urlMisHorasCsv: (token, desde, hasta) => `${base}/kiosk/mis-horas.csv${qs({ token, desde, hasta })}`,
    urlMisHorasPdf: (token, desde, hasta) => `${base}/kiosk/mis-horas.pdf${qs({ token, desde, hasta })}`,
  };
}

/* --------------------------------------------------------------- Formato --- */

export function fmtHora(ts, tz = TZ_DEFECTO) {
  if (ts == null) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(new Date(ts));
}

/** Reloj en vivo HH:MM:SS (24 h). */
export function fmtReloj(date, tz = TZ_DEFECTO) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
}

/** Fecha larga en español, p. ej. "lunes, 13 de julio de 2026". */
export function fmtFechaLarga(date, tz = TZ_DEFECTO) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(date);
}

export function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const [a, m, d] = String(iso).split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

const ISO = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export function primerDiaMes(ref = new Date()) { return ISO(new Date(ref.getFullYear(), ref.getMonth(), 1)); }
export function ultimoDiaMes(ref = new Date()) { return ISO(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)); }

/** Iniciales para el avatar de reserva (cuando no hay avatarUrl). */
export function iniciales(nombre) {
  return String(nombre || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();
}

export function descargar(url) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
