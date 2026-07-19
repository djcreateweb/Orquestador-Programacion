// index.js — Punto de entrada del módulo Presentia dentro de Expira.
// Expira llama crearModulo(deps) con sus puertos; el módulo migra (aditivo), carga
// su config y devuelve el objeto a registrar en el servidor Fastify del host.
import { assertDeps, normalizeConfig } from './ports.js';
import { migrate, leerConfig } from './db/migrate.js';
import { crearCorrelativosDb } from './domain/correlativo.js';
import { crearRateLimiter } from './http/authz.js';
import { crearKioskSessions } from './http/kiosk-session.js';

/**
 * Inicializa el módulo: migración idempotente + wiring de servicios.
 * @param {object} deps puertos inyectados por Expira (ver ports.js)
 * @returns {{deps:object, rate:object, kioskSessions:object}}
 */
export function crearModulo(deps) {
  if (!deps?.db?.exec || !deps?.db?.prepare) throw new Error('presentia: falta el puerto db (SQLite).');
  if (!deps?.clock?.now) throw new Error('presentia: falta el puerto clock.now.');

  migrate(deps.db); // aditivo e idempotente (regla de oro §1.3)

  const config = normalizeConfig({ ...leerConfig(deps.db), ...(deps.config || {}) });
  const full = {
    ...deps,
    config,
    correlatives: deps.correlatives || crearCorrelativosDb(deps.db),
  };
  assertDeps(full);

  const rate = crearRateLimiter({ now: deps.clock.now, ventanaMs: 60_000, max: 30 });
  const kioskSessions = crearKioskSessions({ now: deps.clock.now });
  return { deps: full, rate, kioskSessions };
}

export { registrarFastify } from './http/fastify-adapter.js';
export * as handlers from './http/handlers.js';
export { verificarIntegridad } from './services/audit.service.js';
