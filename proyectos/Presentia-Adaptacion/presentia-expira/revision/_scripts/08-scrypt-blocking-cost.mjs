// 08-scrypt-blocking-cost.mjs — Mide el coste (ms) de UNA verificación de PIN
// (verifySecret, scrypt N=32768) y comprueba si BLOQUEA el bucle de eventos: mientras
// se ejecuta, ¿puede un temporizador paralelo (setInterval) seguir "tickeando"?
//
// RE-EJECUTADO tras el fix S-07: `verifySecret`/`hashSecret` (src/security/hash.js) ya
// NO usan `crypto.scryptSync`; usan `crypto.scrypt` (asíncrono, threadpool de libuv) y
// devuelven una Promise. Este script ahora `await`-ea cada llamada (como debe hacer
// cualquier consumidor real) para demostrar que el bucle de eventos queda LIBRE
// mientras se deriva la clave.
import { hashSecret, verifySecret } from '../../src/security/hash.js';

const hash = await hashSecret('4728');

// Mide 20 verificaciones para tener una media estable.
const N = 20;
let total = 0;
for (let i = 0; i < N; i++) {
  const t0 = process.hrtime.bigint();
  await verifySecret('0000', hash); // PIN incorrecto: sigue ejecutando el mismo coste (scrypt del candidato)
  const t1 = process.hrtime.bigint();
  total += Number(t1 - t0) / 1e6;
}
console.log(`Coste medio de UNA verificación de PIN (scrypt N=32768,r=8,p=1, ahora ASÍNCRONA): ${(total / N).toFixed(1)} ms`);

console.log('\n--- ¿Bloquea el bucle de eventos? (setInterval paralelo durante 30 verificaciones EN PARALELO) ---');
let ticks = 0;
const iv = setInterval(() => { ticks++; }, 5); // debería "tickear" ~cada 5ms si el loop está libre
const t0 = Date.now();
await Promise.all(Array.from({ length: 30 }, () => verifySecret('0000', hash)));
const ms = Date.now() - t0;
clearInterval(iv);
console.log(`30 verificaciones (en paralelo, vía Promise.all) tardaron ${ms} ms en total.`);
console.log(`Ticks de setInterval(5ms) registrados durante ese tiempo: ${ticks} (esperados si el loop estuviera libre: ~${Math.floor(ms / 5)})`);
console.log(ticks > 0
  ? '=> CONFIRMADO: el bucle de eventos siguió LIBRE (ticks > 0) durante las verificaciones — ya no bloquea (crypto.scrypt corre en el threadpool de libuv, no en el hilo principal de JS).'
  : '=> INESPERADO: el bucle de eventos no tuvo ninguna oportunidad de ejecutar otro código.');

console.log('\n================ CONCLUSIÓN ================');
console.log('Tras el fix S-07: verifySecret/hashSecret son asíncronos. El COSTE de CPU por');
console.log('verificación no cambia (sigue siendo memory-hard a propósito), pero YA NO bloquea el');
console.log('hilo principal de JS mientras se calcula: otras peticiones (kiosko/Manager) pueden');
console.log('seguir siendo atendidas por el mismo proceso durante la derivación de la clave.');
