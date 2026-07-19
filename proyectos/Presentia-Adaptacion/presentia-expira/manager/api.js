// api.js — Wrapper fetch del Manager de Presentia.
// Sin dependencias: usa `fetch` nativo. La sesión es la del host (Expira): las
// peticiones viajan con las cookies de sesión; el cliente NO maneja tokens.
// Todas las respuestas cumplen el sobre { ok:true, data } | { ok:false, error }.

export const TZ_DEFECTO = "Europe/Madrid";

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
    registros: (params = {}) => pedir(base, `/manager/registros${qs(params)}`),
    editarMarca: (payload) =>
      pedir(base, "/manager/registros/marca/editar", { method: "POST", body: payload }),
    anadirMarca: (payload) =>
      pedir(base, "/manager/registros/marca/anadir", { method: "POST", body: payload }),
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

/** Formatea un epoch ms como HH:MM (Intl es-ES, zona del centro). */
export function fmtHora(ts, tz = TZ_DEFECTO) {
  if (ts == null) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(new Date(ts));
}

/** Fecha de jornada (YYYY-MM-DD) a texto corto legible. */
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

/** Primer día del mes en curso (YYYY-MM-DD, hora local del navegador). */
export function primerDiaMes(ref = new Date()) {
  return ISO(new Date(ref.getFullYear(), ref.getMonth(), 1));
}

/** Último día del mes en curso (YYYY-MM-DD). */
export function ultimoDiaMes(ref = new Date()) {
  return ISO(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
}

/** epoch ms -> valor para <input type="datetime-local"> (hora local del navegador). */
export function tsAInputLocal(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** valor de <input type="datetime-local"> -> epoch ms (hora local del navegador). */
export function inputLocalATs(valor) {
  const t = new Date(valor).getTime();
  return Number.isFinite(t) ? t : null;
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
  const escapar = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const texto = filas.map((f) => f.map(escapar).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  descargar(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
