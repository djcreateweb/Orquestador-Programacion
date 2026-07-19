// reference-env.js — Entorno de REFERENCIA para dev/test SOLAMENTE. Implementa los
// puertos que en producción aporta Expira (BD SQLite en memoria, empleados con PIN,
// sesión por cabecera, reloj controlable). NUNCA usar en producción: siembra PINs.
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_CONFIG } from '../ports.js';
import { defaultHashPort } from '../security/hash.js';

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
    empleadosById.set(e.id, { ...e, pinHash: e.pin ? defaultHashPort.hashSecret(e.pin) : null });
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
      return defaultHashPort.verifySecret(String(p ?? ''), e.pinHash);
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
