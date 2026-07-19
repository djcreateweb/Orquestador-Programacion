// authz.js — Autorización comprobada en el servidor en CADA endpoint (§6.2).
// Nunca se confía en el rol enviado por el cliente: el rol procede del puerto
// session.resolve del host. Ocultar un botón no es autorizar.
import { ROLES } from '../ports.js';
import { err } from '../errors.js';

export function requireAutenticado(actor) {
  if (!actor || !actor.empleadoId) throw err('NO_AUTENTICADO', 401, 'sin sesión', 'No autenticado.');
}

export function requireRol(actor, ...roles) {
  requireAutenticado(actor);
  if (roles.length && !roles.includes(actor.rol)) {
    throw err('PROHIBIDO', 403, `rol ${actor.rol} no autorizado`, 'No autorizado.');
  }
}

export function esAdmin(actor) {
  return !!actor && (actor.rol === ROLES.LOCAL_ADMIN || actor.rol === ROLES.TECHNICIAN);
}

/** El kiosko no puede alcanzar rutas de administración (§6.2). */
export function requireCanalKiosko(canal) {
  if (canal !== 'kiosk') throw err('CANAL_INVALIDO', 403, 'canal no kiosk', 'No autorizado.');
}

/**
 * fix A-08: cinturón de seguridad simétrico al del kiosko — el canal kiosko no debe
 * poder alcanzar rutas de Manager. Aunque el enrutado real (`fastify-adapter.js`) fija
 * `canal` en el servidor (nunca lo controla el cliente), añadir esta comprobación en
 * cada handler `manager.*` evita que un futuro wiring alternativo (otro adaptador,
 * pruebas, un proxy interno) reutilice `canal` de forma menos controlada.
 */
export function requireCanalManager(canal) {
  if (canal !== 'manager') throw err('CANAL_INVALIDO', 403, 'canal no manager', 'No autorizado.');
}

/** Rate limiter de ventana fija en memoria. `now` inyectado (clock) para tests. */
export function crearRateLimiter({ ventanaMs = 60000, max = 30, now }) {
  const buckets = new Map();
  return {
    check(key) {
      const t = now();
      let b = buckets.get(key);
      if (!b || t - b.inicio >= ventanaMs) { b = { inicio: t, n: 0 }; buckets.set(key, b); }
      b.n++;
      return b.n <= max;
    },
    reset() { buckets.clear(); },
  };
}
