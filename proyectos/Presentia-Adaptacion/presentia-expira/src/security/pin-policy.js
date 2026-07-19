// pin-policy.js — Política de PIN y backoff (§6.1).
// El PIN de 4 dígitos = 10.000 combinaciones ⇒ débil por sí solo. Se compensa con:
//  - rechazo de PIN triviales,
//  - recomendación de 6 dígitos,
//  - límite de intentos + backoff exponencial + bloqueo temporal (aplicado en fichaje.service).
// Este módulo es lógica pura y testeable; no toca BD ni red.

export const PIN_MIN_LEN = 4;
export const PIN_RECOMMENDED_LEN = 6;
export const PIN_MAX_LEN = 8;

// Umbral de fallos consecutivos antes de empezar a bloquear.
export const LOCK_THRESHOLD = 3;
// Backoff exponencial (ms) a partir del umbral; se satura al último valor.
export const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 900_000]; // 30s→1m→2m→5m→15m

const COMMON_WEAK = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '1212', '2121', '1004', '2000', '2001', '1010', '0007',
  '000000', '123456', '654321', '111111', '121212', '112233', '696969', '123123',
]);

/** ¿Sólo dígitos y longitud admisible? */
export function tieneFormatoValido(pin) {
  return typeof pin === 'string' && new RegExp(`^\\d{${PIN_MIN_LEN},${PIN_MAX_LEN}}$`).test(pin);
}

/** Secuencia estrictamente creciente o decreciente (1234, 4321, ...). */
function esSecuencia(pin) {
  let asc = true, desc = true;
  for (let i = 1; i < pin.length; i++) {
    const d = pin.charCodeAt(i) - pin.charCodeAt(i - 1);
    if (d !== 1) asc = false;
    if (d !== -1) desc = false;
  }
  return asc || desc;
}

/** Todos los dígitos iguales (0000, 7777). */
function esRepetido(pin) {
  return /^(\d)\1+$/.test(pin);
}

/**
 * Clasifica un PIN.
 * @returns {{valido:boolean, debil:boolean, motivo:(string|null)}}
 */
export function clasificarPin(pin) {
  if (!tieneFormatoValido(pin)) {
    return { valido: false, debil: true, motivo: `El PIN debe tener entre ${PIN_MIN_LEN} y ${PIN_MAX_LEN} dígitos.` };
  }
  if (esRepetido(pin)) return { valido: false, debil: true, motivo: 'PIN trivial: dígitos repetidos.' };
  if (esSecuencia(pin)) return { valido: false, debil: true, motivo: 'PIN trivial: secuencia de dígitos.' };
  if (COMMON_WEAK.has(pin)) return { valido: false, debil: true, motivo: 'PIN demasiado común.' };
  return { valido: true, debil: false, motivo: null };
}

/** ¿Es débil (o inválido)? Azúcar sobre clasificarPin. */
export function esDebil(pin) {
  return clasificarPin(pin).debil;
}

/**
 * Duración del bloqueo (ms) tras `fallos` intentos consecutivos.
 * 0 mientras no se alcanza el umbral.
 * @param {number} fallos
 * @returns {number} ms
 */
export function backoffMs(fallos) {
  if (fallos < LOCK_THRESHOLD) return 0;
  const idx = Math.min(fallos - LOCK_THRESHOLD, BACKOFF_MS.length - 1);
  return BACKOFF_MS[idx];
}
