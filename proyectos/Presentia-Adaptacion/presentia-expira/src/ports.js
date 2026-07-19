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
  maxDuracionJornadaMin: 960,     // 16h: por encima, una jornada abierta NO se reutiliza (fix K-01)
  ventanaAntiRebotarFichajeSeg: 3, // ventana anti doble-toque en `fichar` (fix K-04)
});

export const TEMAS_VALIDOS = Object.freeze(['claro', 'oscuro', 'auto']);

const CONFIG_BOOL = ['mostrarEnKiosko', 'exigirPin', 'variasMarcasDia', 'imprimirTicket'];
const CONFIG_INT = [
  'jornadaEstandarMin', 'redondeoMin', 'conservacionAnios',
  'maxDuracionJornadaMin', 'ventanaAntiRebotarFichajeSeg',
];

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
  // maxDuracionJornadaMin: entre 1h y 72h (fuera de ese rango no protege nada / bloquea turnos válidos).
  if (out.maxDuracionJornadaMin < 60) out.maxDuracionJornadaMin = 60;
  if (out.maxDuracionJornadaMin > 4320) out.maxDuracionJornadaMin = 4320;
  // ventanaAntiRebotarFichajeSeg: entre 0 (desactivada) y 60s.
  if (out.ventanaAntiRebotarFichajeSeg > 60) out.ventanaAntiRebotarFichajeSeg = 60;
  if (!TEMAS_VALIDOS.includes(out.temaPorDefecto)) out.temaPorDefecto = DEFAULT_CONFIG.temaPorDefecto;
  return out;
}

// fix A-09: rangos válidos por ajuste numérico, IDÉNTICOS a los límites que
// normalizeConfig ya aplicaba en silencio (misma semántica, ahora rechazada en vez de
// recortada al escribir).
const RANGOS_INT = {
  redondeoMin: [0, 120],
  jornadaEstandarMin: [0, 1440],
  conservacionAnios: [4, Infinity],
  maxDuracionJornadaMin: [60, 4320],
  ventanaAntiRebotarFichajeSeg: [0, 60],
};

/**
 * Valida ESTRICTAMENTE un subconjunto de ajustes ANTES de escribirlos (fix A-09).
 * A diferencia de `normalizeConfig` (tolerante: se usa para LEER config ya persistida —
 * y para la fusión con lo que aporte Expira al arrancar — y NUNCA debe reventar el
 * arranque del módulo por un valor histórico raro), esta función es para la ESCRITURA
 * (`PUT /manager/ajustes`): si algún valor no es válido, se debe rechazar la petición
 * ENTERA con un error claro (campo + motivo), en vez de acotarlo/sustituirlo en
 * silencio como ocurría antes.
 * @param {object} [parcial]
 * @returns {{valido:boolean, errores:{campo:string, motivo:string}[]}}
 */
export function validarAjustesEstricto(parcial = {}) {
  const errores = [];
  for (const key of Object.keys(parcial)) {
    if (!(key in DEFAULT_CONFIG)) continue; // clave desconocida: se ignora, sin riesgo
    const v = parcial[key];
    if (v == null) continue; // null/undefined: no cambia el valor actual
    if (CONFIG_BOOL.includes(key)) {
      if (typeof v !== 'boolean') errores.push({ campo: key, motivo: 'debe ser verdadero o falso.' });
    } else if (CONFIG_INT.includes(key)) {
      const n = Number(v);
      const [min, max] = RANGOS_INT[key] || [0, Infinity];
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
        errores.push({ campo: key, motivo: `debe ser un número entero entre ${min} y ${max === Infinity ? '∞' : max}.` });
      }
    } else if (key === 'temaPorDefecto') {
      if (!TEMAS_VALIDOS.includes(v)) {
        errores.push({ campo: key, motivo: `debe ser uno de: ${TEMAS_VALIDOS.join(', ')}.` });
      }
    } else if (typeof v !== 'string' || !v.trim()) {
      errores.push({ campo: key, motivo: 'debe ser un texto no vacío.' });
    }
  }
  return { valido: errores.length === 0, errores };
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
