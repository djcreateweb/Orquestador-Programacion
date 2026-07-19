// hash.js — Hashing lento y con sal para PIN/contraseñas (§6.1).
// Fallback autónomo cuando Expira no inyecta su propio puerto `hash`.
// Algoritmo: scrypt (memory-hard, incluido en node:crypto → cero dependencias).
// Formato almacenado: "scrypt$N$r$p$saltB64$hashB64". NUNCA se guarda el secreto en claro.
import crypto from 'node:crypto';

const N = 1 << 15; // 32768
const R = 8;
const P = 1;
const KEYLEN = 32;
const SALT_BYTES = 16;
// scrypt necesita ~128*N*r bytes; para N=32768,r=8 ≈ 33.5 MB → subimos maxmem.
const MAXMEM = 96 * 1024 * 1024;

/**
 * Deriva y serializa el hash de un secreto (PIN o contraseña).
 * @param {string} secret
 * @returns {string} cadena autodescriptiva; segura para almacenar en BD.
 */
export function hashSecret(secret) {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('hashSecret: secreto vacío');
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = crypto.scryptSync(secret, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Verifica un secreto contra un hash almacenado, en tiempo constante.
 * @param {string} secret
 * @param {string} stored
 * @returns {boolean}
 */
export function verifySecret(secret, stored) {
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
    derived = crypto.scryptSync(secret, salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
  } catch {
    return false;
  }
  // timingSafeEqual exige misma longitud; expected.length garantiza igualdad.
  return crypto.timingSafeEqual(derived, expected);
}

/** Puerto `hash` por defecto (implementación de referencia). */
export const defaultHashPort = { hashSecret, verifySecret };
