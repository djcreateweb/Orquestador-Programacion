// reference-env.js — Entorno de REFERENCIA para dev/test SOLAMENTE. Implementa los
// puertos que en producción aporta Expira (BD SQLite en memoria, empleados con PIN,
// sesión por cabecera, reloj controlable). NUNCA usar en producción: siembra PINs.
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { DEFAULT_CONFIG } from '../ports.js';
import { defaultHashPort } from '../security/hash.js';

// fix S-07 (nota de alcance): `src/security/hash.js` expone ahora `hashSecret`/
// `verifySecret` ASÍNCRONOS (`crypto.scrypt`, no bloqueante) — la implementación
// correcta para cualquier integración real que use el puerto opcional `hash`. Este
// entorno de REFERENCIA (dev/test, NUNCA producción — ver blindaje más abajo) sigue
// resolviendo el puerto `pin.verify` de forma SÍNCRONA porque así lo exige su propio
// contrato (`ports.js`: "pin.verify(empleadoId, pin) -> boolean"): cambiarlo aquí
// obligaría a propagar `async`/`await` a través de `fichaje.verificarPin`,
// `kiosk.entrar` y las ~70 llamadas síncronas de la suite de tests existente — un
// cambio desproporcionado para un entorno que, por diseño, NUNCA corre en producción
// (ver el `throw` de blindaje debajo). Se usa un helper local minúsculo con LOS MISMOS
// parámetros de coste/sal/comparación en tiempo constante que `hash.js`, sólo que con
// la variante SÍNCRONA de scrypt (aceptable aquí: sirve fichajes de prueba, no tráfico
// real de kioskos concurrentes).
const REF_N = 1 << 15, REF_R = 8, REF_P = 1, REF_KEYLEN = 32, REF_SALT_BYTES = 16;
const REF_MAXMEM = 96 * 1024 * 1024;

function hashPinSincrono(secret) {
  const salt = crypto.randomBytes(REF_SALT_BYTES);
  const derived = crypto.scryptSync(secret, salt, REF_KEYLEN, { N: REF_N, r: REF_R, p: REF_P, maxmem: REF_MAXMEM });
  return `scrypt$${REF_N}$${REF_R}$${REF_P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

function verificarPinSincrono(secret, stored) {
  if (typeof secret !== 'string' || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  let salt, expected;
  try { salt = Buffer.from(parts[4], 'base64'); expected = Buffer.from(parts[5], 'base64'); } catch { return false; }
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  let derived;
  try { derived = crypto.scryptSync(secret, salt, expected.length, { N: n, r, p, maxmem: REF_MAXMEM }); } catch { return false; }
  return crypto.timingSafeEqual(derived, expected);
}

/** Reloj controlable: fijo por defecto para tests deterministas. */
export function crearReloj(inicial) {
  let t = typeof inicial === 'number' ? inicial : Date.UTC(2026, 6, 13, 8, 0, 0); // 2026-07-13 08:00 UTC
  return {
    now: () => t,
    set: (v) => { t = v; },
    avanzar: (ms) => { t += ms; return t; },
  };
}

const SEED_POR_DEFECTO = [
  { id: 'e1', nombre: 'Ana García', rol: 'empleado', pin: '4728', activo: true },
  { id: 'e2', nombre: 'Bruno Sanz', rol: 'empleado', pin: '6410', activo: true },
  { id: 'a1', nombre: 'Laura Admin', rol: 'local_admin', pin: '8391', activo: true },
  { id: 't1', nombre: 'Tec Root', rol: 'technician', pin: '5093', activo: true },
];

/**
 * @param {{dbPath?:string, now?:number, config?:object, empleados?:Array}} [opts]
 * @returns deps + utilidades de test (reloj, empleadosById)
 */
export function crearReferenceEnv(opts = {}) {
  // BLINDAJE: este entorno siembra PINs de demostración. JAMÁS en producción.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('reference-env: entorno de dev/test; prohibido con NODE_ENV=production. Usa los puertos reales de Expira.');
  }
  const db = new DatabaseSync(opts.dbPath || ':memory:');
  const reloj = crearReloj(opts.now);
  const seed = opts.empleados || SEED_POR_DEFECTO;

  const empleadosById = new Map();
  for (const e of seed) {
    empleadosById.set(e.id, { ...e, pinHash: e.pin ? hashPinSincrono(e.pin) : null });
  }
  const publico = (e) => { const { pin, pinHash, ...pub } = e; return pub; };

  const employees = {
    getById: (id) => { const e = empleadosById.get(id); return e ? publico(e) : null; },
    list: () => [...empleadosById.values()].map(publico),
  };

  const pin = {
    verify(id, p) {
      const e = empleadosById.get(id);
      if (!e || !e.pinHash) return false;
      return verificarPinSincrono(String(p ?? ''), e.pinHash);
    },
  };

  // Sesión de referencia: lee la cabecera 'x-presentia-actor' = JSON {empleadoId, rol}.
  const session = {
    resolve(req) {
      const h = req?.headers?.['x-presentia-actor'];
      if (!h) return null;
      try { const a = JSON.parse(h); return a?.empleadoId ? { empleadoId: a.empleadoId, rol: a.rol } : null; }
      catch { return null; }
    },
  };

  return {
    db,
    clock: { now: reloj.now },
    config: { ...DEFAULT_CONFIG, ...(opts.config || {}) },
    employees,
    pin,
    session,
    hash: defaultHashPort,
    // utilidades de test:
    reloj,
    empleadosById,
  };
}
