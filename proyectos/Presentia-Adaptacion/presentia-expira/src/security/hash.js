// hash.js — Hashing lento y con sal para PIN/contraseñas (§6.1).
// Fallback autónomo cuando Expira no inyecta su propio puerto `hash`.
// Algoritmo: scrypt (memory-hard, incluido en node:crypto → cero dependencias).
// Formato almacenado: "scrypt$N$r$p$saltB64$hashB64". NUNCA se guarda el secreto en claro.
//
// fix S-07: `crypto.scryptSync` es SÍNCRONO — mientras deriva la clave (~150 ms con estos
// parámetros) bloquea POR COMPLETO el bucle de eventos de Node; con tráfico de login
// moderado esto degrada el proceso ENTERO (kiosko y Manager comparten el mismo proceso),
// confirmado y medido en `revision/_scripts/08-scrypt-blocking-cost.mjs` (0 de ~892 ticks
// de un temporizador paralelo se ejecutaron durante 30 verificaciones consecutivas).
// Se sustituye por `crypto.scrypt` (variante asíncrona, ejecutada en el threadpool de
// libuv): el hilo principal de JS queda libre para atender otras peticiones mientras se
// deriva la clave. Se conservan sal aleatoria, los mismos parámetros de coste (N/r/p) y
// la comparación en tiempo constante (`crypto.timingSafeEqual`).
import crypto from 'node:crypto';

const N = 1 << 15; // 32768
const R = 8;
const P = 1;
const KEYLEN = 32;
const SALT_BYTES = 16;
// scrypt necesita ~128*N*r bytes; para N=32768,r=8 ≈ 33.5 MB → subimos maxmem.
const MAXMEM = 96 * 1024 * 1024;

/** Envuelve `crypto.scrypt` (callback, no bloqueante) en una promesa. */
function scryptAsync(secret, salt, keylen, opts) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(secret, salt, keylen, opts, (error, derivedKey) => {
      if (error) reject(error); else resolve(derivedKey);
    });
  });
}

/**
 * Deriva y serializa el hash de un secreto (PIN o contraseña). ASÍNCRONA (fix S-07):
 * no bloquea el bucle de eventos mientras deriva la clave.
 * @param {string} secret
 * @returns {Promise<string>} cadena autodescriptiva; segura para almacenar en BD.
 */
export async function hashSecret(secret) {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('hashSecret: secreto vacío');
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await scryptAsync(secret, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Verifica un secreto contra un hash almacenado, en tiempo constante. ASÍNCRONA (fix
 * S-07): usa `crypto.scrypt` (threadpool de libuv) en vez de `crypto.scryptSync`, de
 * modo que verificar un PIN ya no bloquea el bucle de eventos del proceso.
 * @param {string} secret
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifySecret(secret, stored) {
  if (typeof secret !== 'string' || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  let salt, expected;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return false;
  }
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  let derived;
  try {
    derived = await scryptAsync(secret, salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
  } catch {
    return false;
  }
  // timingSafeEqual exige misma longitud; expected.length garantiza igualdad.
  return crypto.timingSafeEqual(derived, expected);
}

/** Puerto `hash` por defecto (implementación de referencia, asíncrona/no bloqueante). */
export const defaultHashPort = { hashSecret, verifySecret };
