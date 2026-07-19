// api.js — Wrapper fetch del kiosko de Presentia.
// Sin dependencias: `fetch` nativo. Cada petición envía la cabecera de dispositivo
// `x-presentia-dispositivo`. El token de micro-sesión vive en memoria de React (NO
// en localStorage) y se pasa en el body de cada llamada autenticada.
//
// Zona horaria (fix A-01/K-06/A-06): fuente ÚNICA de verdad = `config.zonaHoraria`,
// obtenida de `GET /kiosk/config` (sin PIN: dato no sensible, necesario antes de que
// el empleado se identifique). Se elimina el hardcode "Europe/Madrid": `fmtHora`,
// `fmtReloj` y `fmtFechaLarga` EXIGEN `tz` explícito.
import { primerDiaDelMes, ultimoDiaDelMes } from "../src/domain/time.js";

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
    config: () => pedir("/kiosk/config"),
    entrar: (empleadoId, pin) => pedir("/kiosk/entrar", { method: "POST", body: { empleadoId, pin } }),
    estado: (token) => pedir("/kiosk/estado", { method: "POST", body: { token } }),
    fichar: (token) => pedir("/kiosk/fichar", { method: "POST", body: { token } }),
    misRegistros: (token, desde, hasta) =>
      pedir("/kiosk/mis-registros", { method: "POST", body: { token, desde, hasta } }),
    crearSolicitud: (payload) => pedir("/kiosk/solicitud", { method: "POST", body: payload }),
    aceptarTerminos: (token) => pedir("/kiosk/terminos/aceptar", { method: "POST", body: { token } }),
    // fix S-03/K-07: el token de SESIÓN ya nunca viaja en una URL. Para descargar, primero
    // se pide un token de DESCARGA de un solo uso y vida corta (enviado en el BODY de este
    // POST, con la sesión ya identificada) y SÓLO ÉSE se usa en la query de la descarga.
    solicitarDescarga: (token) => pedir("/kiosk/mis-horas/token", { method: "POST", body: { token } }),
    urlMisHorasCsv: (descargaToken, desde, hasta) => `${base}/kiosk/mis-horas.csv${qs({ token: descargaToken, desde, hasta })}`,
    urlMisHorasPdf: (descargaToken, desde, hasta) => `${base}/kiosk/mis-horas.pdf${qs({ token: descargaToken, desde, hasta })}`,
  };
}

/* --------------------------------------------------------------- Formato --- */

export function fmtHora(ts, tz) {
  if (ts == null) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz || undefined,
  }).format(new Date(ts));
}

/** Reloj en vivo HH:MM:SS (24 h). */
export function fmtReloj(date, tz) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz || undefined,
  }).format(date);
}

/** Fecha larga en español, p. ej. "lunes, 13 de julio de 2026". */
export function fmtFechaLarga(date, tz) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz || undefined,
  }).format(date);
}

export function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const [a, m, d] = String(iso).split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

/** Primer/último día del mes de `ts` (epoch ms) en la zona `tz` — YYYY-MM-DD (fix A-06). */
export function primerDiaMes(ts, tz) { return primerDiaDelMes(ts, tz); }
export function ultimoDiaMes(ts, tz) { return ultimoDiaDelMes(ts, tz); }

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
