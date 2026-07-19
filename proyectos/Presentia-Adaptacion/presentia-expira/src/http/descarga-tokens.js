// descarga-tokens.js — Tokens de DESCARGA de un solo uso y vida corta (fix S-03/K-07).
// El token de la MICRO-SESIÓN de kiosko (kiosk-session.js) nunca debe viajar en una URL
// (query string): puede quedar registrado en logs de acceso, en el historial del
// navegador de un kiosko compartido o en cachés de proxies intermedios (OWASP: no poner
// identificadores de sesión en la URL). Las descargas (CSV/PDF) del kiosko, al ser un
// `GET` con `<a href>`, necesitan viajar por query — así que en vez de reutilizar el
// token de sesión, el empleado autenticado pide primero un token de DESCARGA efímero y
// de un solo uso (emitido mediante el token de sesión, en el BODY de un POST, nunca en
// la URL); ese token de descarga —y sólo él— aparece en la query del `GET` real.
import crypto from 'node:crypto';

/**
 * @param {{now:Function, ttlMs?:number}} opts
 */
export function crearDescargaTokens({ now, ttlMs = 20_000 }) {
  const store = new Map(); // hash(token) -> { empleadoId, exp }
  const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

  return {
    emitir(empleadoId) {
      const token = crypto.randomBytes(32).toString('base64url');
      store.set(hash(token), { empleadoId, exp: now() + ttlMs });
      return token;
    },
    /**
     * Un solo uso: si el token es válido y vigente, lo CONSUME (lo borra) y devuelve el
     * empleadoId; si no, devuelve null. Se borra siempre (válido o caducado) para que un
     * token usado o robado no pueda reutilizarse ni siquiera dentro de su ventana de vida.
     */
    consumir(token) {
      if (!token) return null;
      const k = hash(token);
      const s = store.get(k);
      if (!s) return null;
      store.delete(k);
      if (s.exp < now()) return null;
      return s.empleadoId;
    },
    limpiar() { const t = now(); for (const [k, s] of store) if (s.exp < t) store.delete(k); },
    get tamano() { return store.size; },
  };
}
