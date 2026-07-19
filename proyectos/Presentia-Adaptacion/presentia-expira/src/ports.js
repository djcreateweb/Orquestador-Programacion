// ports.js — Interfaz de integración con Expira (§1.3, modo "Expira no disponible").
// El módulo NO asume el esquema ni los servicios de Expira: los recibe inyectados
// como "puertos". En integración real, Expira aporta implementaciones; en dev/test
// se usan las de referencia (src/dev/reference-env.js).
//
// Contrato de puertos (todos síncronos salvo indicación):
//
//  db          { exec(sql), prepare(sql) -> { run, get, all } }   // handle SQLite de Expira (node:sqlite compatible)
//  clock       { now() -> number }                                 // epoch ms; inyectable para tests
//  config      objeto de ajustes (ver DEFAULT_CONFIG); persistido por presentia_ajustes
//  employees   { getById(id) -> Empleado|null, list() -> Empleado[] }   // Expira posee los empleados
//  pin         { verify(empleadoId, pin) -> boolean }              // verificación en tiempo constante, del host
//  session     { resolve(req) -> { empleadoId, rol }|null }        // contexto autenticado del host (cero login propio)
//  correlatives{ next(serie, anio) -> string }  (opcional)         // si falta, se usa el contador propio atómico
//  printing    { printTicket(doc), renderPdf(report)->Buffer } (opcional)
//  hash        { hashSecret(s)->string, verifySecret(s,stored)->boolean } (opcional; fallback scrypt)
//
// @typedef {{id:string, nombre:string, rol:('empleado'|'local_admin'|'technician'),
//            activo:boolean, avatarUrl?:string}} Empleado

export const ROLES = Object.freeze({
  EMPLEADO: 'empleado',
  LOCAL_ADMIN: 'local_admin',
  TECHNICIAN: 'technician',
});

export const ROLES_VALIDOS = Object.freeze([ROLES.EMPLEADO, ROLES.LOCAL_ADMIN, ROLES.TECHNICIAN]);

/** Ajustes por defecto (§3). Persistidos en presentia_ajustes; overridables por Expira. */
export const DEFAULT_CONFIG = Object.freeze({
  zonaHoraria: 'Europe/Madrid',   // zona del centro para bucketizar la fecha de jornada (D-009)
  jornadaEstandarMin: 480,        // 8 h
  redondeoMin: 0,                 // redondeo del total por jornada (0 = sin redondeo)
  mostrarEnKiosko: true,          // muestra la tarjeta "Fichar" en el kiosko
  exigirPin: true,                // exige PIN para fichar
  variasMarcasDia: true,          // admite varias entradas/salidas al día (pausas)
  imprimirTicket: false,          // imprime ticket al fichar
  conservacionAnios: 4,           // conservación legal del registro de jornada (art. 34.9 ET)
  serieCorrelativo: 'F',          // prefijo del código F-AAAA-NNNN
  temaPorDefecto: 'auto',         // tema por defecto del panel: 'claro' | 'oscuro' | 'auto'
});

export const TEMAS_VALIDOS = Object.freeze(['claro', 'oscuro', 'auto']);

const CONFIG_BOOL = ['mostrarEnKiosko', 'exigirPin', 'variasMarcasDia', 'imprimirTicket'];
const CONFIG_INT = ['jornadaEstandarMin', 'redondeoMin', 'conservacionAnios'];

/**
 * Normaliza y valida un objeto de ajustes contra DEFAULT_CONFIG.
 * Ignora claves desconocidas; corrige tipos; acota rangos.
 * @param {object} raw
 * @returns {object}
 */
export function normalizeConfig(raw = {}) {
  const out = { ...DEFAULT_CONFIG };
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    if (!(key in raw) || raw[key] == null) continue;
    let v = raw[key];
    if (CONFIG_BOOL.includes(key)) v = v === true || v === 'true' || v === 1 || v === '1';
    else if (CONFIG_INT.includes(key)) { v = Math.trunc(Number(v)); if (!Number.isFinite(v) || v < 0) v = DEFAULT_CONFIG[key]; }
    else v = String(v);
    out[key] = v;
  }
  if (out.redondeoMin > 120) out.redondeoMin = 120;      // tope sensato
  if (out.jornadaEstandarMin > 1440) out.jornadaEstandarMin = 1440;
  if (out.conservacionAnios < 4) out.conservacionAnios = 4; // nunca por debajo del mínimo legal
  if (!TEMAS_VALIDOS.includes(out.temaPorDefecto)) out.temaPorDefecto = DEFAULT_CONFIG.temaPorDefecto;
  return out;
}

/**
 * Verifica que las dependencias mínimas están presentes; lanza con mensaje claro.
 * Las opcionales (correlatives, printing, hash) tienen fallback propio.
 * @param {object} deps
 */
export function assertDeps(deps) {
  if (!deps || typeof deps !== 'object') throw new Error('presentia: faltan dependencias (deps).');
  const req = {
    'db.exec': deps.db && typeof deps.db.exec === 'function',
    'db.prepare': deps.db && typeof deps.db.prepare === 'function',
    'clock.now': deps.clock && typeof deps.clock.now === 'function',
    'employees.getById': deps.employees && typeof deps.employees.getById === 'function',
    'employees.list': deps.employees && typeof deps.employees.list === 'function',
    'session.resolve': deps.session && typeof deps.session.resolve === 'function',
  };
  const faltan = Object.entries(req).filter(([, ok]) => !ok).map(([k]) => k);
  if (faltan.length) throw new Error(`presentia: puertos requeridos ausentes: ${faltan.join(', ')}`);
  if (deps.config?.exigirPin !== false && !(deps.pin && typeof deps.pin.verify === 'function')) {
    throw new Error('presentia: exigirPin activo pero falta el puerto pin.verify. Aporta pin o desactiva exigirPin.');
  }
}
