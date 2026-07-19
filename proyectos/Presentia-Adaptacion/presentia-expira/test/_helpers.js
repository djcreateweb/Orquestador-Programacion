// _helpers.js — Utilidades de test (entorno de referencia + contexto de handlers).
import { crearReferenceEnv } from '../src/dev/reference-env.js';
import { crearModulo } from '../src/index.js';

export function nuevoModulo(opts) {
  const env = crearReferenceEnv(opts);
  const modulo = crearModulo(env);
  return { env, modulo, deps: modulo.deps };
}

export function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null,
    canal: o.canal ?? 'manager',
    body: o.body ?? {},
    query: o.query ?? {},
    params: o.params ?? {},
    dispositivo: o.dispositivo ?? 'tablet-1',
    rate: modulo.rate,
    kioskSessions: modulo.kioskSessions,
    formato: o.formato,
    now: modulo.deps.clock.now,
  };
}

export const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };
export const TECH = { empleadoId: 't1', rol: 'technician' };
