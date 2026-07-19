// api.js — Wrapper fetch del Manager de Presentia.
// Sin dependencias: usa `fetch` nativo. La sesión es la del host (Expira): las
// peticiones viajan con las cookies de sesión; el cliente NO maneja tokens.
// Todas las respuestas cumplen el sobre { ok:true, data } | { ok:false, error }.
//
// Zona horaria (fix A-01/K-06/A-06): fuente ÚNICA de verdad = `config.zonaHoraria`
// (GET /manager/ajustes). Se elimina el hardcode "Europe/Madrid": todas las funciones
// de formato/fecha de este módulo EXIGEN `tz` explícito (sin valor por defecto oculto),
// para que la tabla y los modales de edición usen SIEMPRE la misma zona. Se reexportan
// las utilidades de `src/domain/time.js` (la misma lógica que usa el backend para
// bucketizar la fecha de jornada) en vez de duplicar el cálculo en el navegador.
import {
  tsAValorLocal as tsAValorLocalTz,
  valorLocalATs as valorLocalATsTz,
  primerDiaDelMes,
  ultimoDiaDelMes,
} from "../src/domain/time.js";
// fix A-03: reutiliza la MISMA neutralización de inyección de fórmulas CSV (= + - @)
// que ya usa el exportador de backend (src/export/csv.js), en vez de un escapado propio
// que sólo entrecomillaba y dejaba pasar la fórmula cruda.
import { escaparCelda } from "../src/export/csv.js";

/** Error de API con código estable (para que la UI reaccione por código, no por texto). */
export class ApiError extends Error {
  constructor(code, mensaje) {
    super(mensaje || code);
    this.name = "ApiError";
    this.code = code;
    this.mensaje = mensaje || "Se ha producido un error.";
  }
}

async function pedir(base, ruta, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${base}${ruta}`, {
      method,
      credentials: "include",
      headers: body != null ? { "Content-Type": "application/json" } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("RED", "No se pudo conectar con el servidor. Revisa la conexión.");
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("RESPUESTA_INVALIDA", "El servidor devolvió una respuesta no válida.");
  }
  if (!res.ok || !json || json.ok !== true) {
    const e = (json && json.error) || {};
    throw new ApiError(e.code || "ERROR", e.mensaje || "Se ha producido un error.");
  }
  return json.data;
}

function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Crea el cliente de API del Manager.
 * @param {string} [base="/presentia"] prefijo de rutas del módulo.
 */
export function crearApiManager(base = "/presentia") {
  return {
    base,
    hoy: () => pedir(base, "/manager/hoy"),
    empleados: () => pedir(base, "/manager/empleados"),
    registros: (params = {}) => pedir(base, `/manager/registros${qs(params)}`),
    editarMarca: (payload) =>
      pedir(base, "/manager/registros/marca/editar", { method: "POST", body: payload }),
    anadirMarca: (payload) =>
      pedir(base, "/manager/registros/marca/anadir", { method: "POST", body: payload }),
    crearJornada: (payload) =>
      pedir(base, "/manager/registros/jornada", { method: "POST", body: payload }),
    informe: (params = {}) => pedir(base, `/manager/informe${qs(params)}`),
    solicitudes: (estado) => pedir(base, `/manager/solicitudes${qs(estado ? { estado } : {})}`),
    aprobar: (id, comentario) =>
      pedir(base, `/manager/solicitudes/${id}/aprobar`, { method: "POST", body: { comentario } }),
    rechazar: (id, comentario) =>
      pedir(base, `/manager/solicitudes/${id}/rechazar`, { method: "POST", body: { comentario } }),
    ajustesGet: () => pedir(base, "/manager/ajustes"),
    ajustesPut: (cambios) => pedir(base, "/manager/ajustes", { method: "PUT", body: cambios }),
    terminos: () => pedir(base, "/manager/terminos"),
    aceptarTerminos: () => pedir(base, "/manager/terminos/aceptar", { method: "POST", body: {} }),
    // URLs de descarga (misma sesión/cookies del host).
    urlInformeCsv: (params = {}) => `${base}/manager/informe.csv${qs(params)}`,
    urlInformePdf: (params = {}) => `${base}/manager/informe.pdf${qs(params)}`,
  };
}

/* --------------------------------------------------------------- Formato --- */

/**
 * Formatea un epoch ms como HH:MM (Intl es-ES). `tz` es OBLIGATORIO (config.zonaHoraria):
 * fix A-01: antes esta función se llamaba sin `tz` en Registros/Hoy/InformeHoras/
 * Solicitudes y caía silenciosamente en un "Europe/Madrid" hardcodeado, ignorando el
 * ajuste real del centro. Si no se pasa `tz` se usa la zona del navegador como último
 * recurso (mejor eso que asumir Madrid), pero cada llamador de esta app debe pasar
 * siempre `config.zonaHoraria`.
 */
export function fmtHora(ts, tz) {
  if (ts == null) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz || undefined,
  }).format(new Date(ts));
}

/** Fecha de jornada (YYYY-MM-DD) a texto corto legible. */
export function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const [a, m, d] = String(iso).split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

/** Primer día del mes de `ts` (epoch ms) en la zona `tz` — YYYY-MM-DD. */
export function primerDiaMes(ts, tz) {
  return primerDiaDelMes(ts, tz);
}

/** Último día del mes de `ts` (epoch ms) en la zona `tz` — YYYY-MM-DD. */
export function ultimoDiaMes(ts, tz) {
  return ultimoDiaDelMes(ts, tz);
}

/**
 * epoch ms -> valor para `<input type="datetime-local">` EN LA ZONA `tz` (fix A-01/K-06:
 * ya NO usa la hora local del navegador). Debe ser la MISMA zona que `fmtHora` para que
 * lo que se ve en la tabla coincida con lo que se precarga al editar.
 */
export function tsAInputLocal(ts, tz) {
  return tsAValorLocalTz(ts, tz);
}

/**
 * Valor de `<input type="datetime-local">` (interpretado en la zona `tz`) -> epoch ms
 * absoluto. Fix A-01/K-06: antes interpretaba el valor en la zona LOCAL del navegador,
 * lo que podía guardar una hora absoluta equivocada si el equipo del Manager no estaba
 * en la misma zona que `config.zonaHoraria`.
 */
export function inputLocalATs(valor, tz) {
  return valorLocalATsTz(valor, tz);
}

/** Dispara la descarga de una URL respetando la sesión (cookies) del host. */
export function descargar(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Descarga un CSV generado en cliente (sin endpoint dedicado). */
export function descargarCsvCliente(filas, filename) {
  const texto = filas.map((f) => f.map(escaparCelda).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  descargar(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
