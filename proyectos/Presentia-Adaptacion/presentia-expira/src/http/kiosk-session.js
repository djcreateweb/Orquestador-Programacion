// kiosk-session.js — Micro-sesión de kiosko: token efímero emitido tras un PIN
// correcto, para no re-pedir el PIN entre "ver estado" y "fichar" (§6.2).
// Token aleatorio ≥32 bytes, almacenado SÓLO su hash, con caducidad corta.
import crypto from 'node:crypto';

/**
 * @param {{now:Function, ttlMs?:number}} opts
 */
export function crearKioskSessions({ now, ttlMs = 90_000 }) {
  const store = new Map(); // hash(token) -> { empleadoId, exp }
  const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

  return {
    emitir(empleadoId) {
      const token = crypto.randomBytes(32).toString('base64url');
      store.set(hash(token), { empleadoId, exp: now() + ttlMs });
      return token;
    },
    /** Devuelve empleadoId si el token es válido y vigente; si no, null. */
    validar(token) {
      if (!token) return null;
      const k = hash(token);
      const s = store.get(k);
      if (!s) return null;
      if (s.exp < now()) { store.delete(k); return null; }
      return s.empleadoId;
    },
    revocar(token) { if (token) store.delete(hash(token)); },
    limpiar() { const t = now(); for (const [k, s] of store) if (s.exp < t) store.delete(k); },
    get tamano() { return store.size; },
  };
}
