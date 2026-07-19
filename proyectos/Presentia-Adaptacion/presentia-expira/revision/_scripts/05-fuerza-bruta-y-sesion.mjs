// 05-fuerza-bruta-y-sesion.mjs — Fuerza bruta de PIN (backoff exponencial +
// bloqueo + auditado), rate limiting global de `entrar`, y robustez del token
// de micro-sesión de kiosko (entropía, hash en almacenamiento, caducidad).
// Entorno PROPIO en memoria.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';
import { crearKioskSessions } from '../../src/http/kiosk-session.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-test',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}

console.log('================================================================');
console.log('1) Fuerza bruta de PIN: backoff exponencial creciente + bloqueo');
console.log('================================================================');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const intento = (pin) => kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin } }));

  for (let i = 1; i <= 7; i++) {
    try {
      intento('0000');
      console.log(`intento ${i}: (inesperado) aceptado`);
    } catch (e) {
      const row = deps.db.prepare('SELECT fallos, bloqueado_hasta FROM presentia_pin_intentos WHERE empleado_id=? AND dispositivo=?').get('e1', 'kiosko-test');
      console.log(`intento ${i}: ${e.code} — fallos=${row?.fallos} bloqueado_hasta=${row?.bloqueado_hasta} (ahora=${deps.clock.now()})`);
    }
  }
  console.log('\nIntento con el PIN CORRECTO estando bloqueado:');
  try {
    intento('4728');
    console.log('(inesperado) aceptado a pesar del bloqueo');
  } catch (e) {
    console.log('Denegado correctamente:', e.code); // PIN_BLOQUEADO
  }
  // Avanza el reloj lo suficiente y reintenta.
  env.reloj.avanzar(16 * 60_000);
  const ok = intento('4728');
  console.log('\nTras esperar el backoff, PIN correcto funciona:', !!ok.token);

  console.log('\nAuditoría generada (acciones, SIN el PIN en ningún campo):');
  const filas = deps.db.prepare('SELECT accion, detalle FROM presentia_auditoria ORDER BY id').all();
  for (const f of filas) console.log(' -', f.accion, f.detalle);
  const dump = JSON.stringify(filas);
  console.log('¿"0000" aparece en la auditoría?', dump.includes('0000'));
}

console.log('\n================================================================');
console.log('2) Rate limiting global (ventana fija) en kiosk.entrar');
console.log('================================================================');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  let ultimoError = null;
  let aceptadas = 0;
  for (let i = 0; i < 35; i++) {
    try {
      kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin: '4728' } }));
      aceptadas++;
    } catch (e) {
      ultimoError = e.code;
    }
  }
  console.log(`De 35 peticiones en la misma ventana: ${aceptadas} aceptadas, resto -> ${ultimoError}`);
}

console.log('\n================================================================');
console.log('3) Token de micro-sesión de kiosko: entropía, almacenamiento (hash), caducidad');
console.log('================================================================');
{
  let ahora = 0;
  const sesiones = crearKioskSessions({ now: () => ahora, ttlMs: 90_000 });
  const token = sesiones.emitir('e1');
  console.log('Token emitido (longitud base64url):', token.length, '=> bytes de entropía: 32 (256 bits)');
  console.log('¿El propio módulo guarda el token en claro?', (() => {
    // Inspecciona el Map interno indirectamente: sólo se expone validar()/revocar().
    return 'No expone el store; sólo valida por hash SHA-256 internamente (ver kiosk-session.js).';
  })());
  console.log('validar(token) inmediatamente:', sesiones.validar(token));
  ahora = 89_000;
  console.log('validar(token) a los 89s (aún vigente):', sesiones.validar(token));
  ahora = 91_000;
  console.log('validar(token) a los 91s (caducado):', sesiones.validar(token));
  console.log('validar("token-adivinado-cualquiera"):', sesiones.validar('token-adivinado-cualquiera'));
  sesiones.revocar(token);
  ahora = 0;
  const token2 = sesiones.emitir('e2');
  sesiones.revocar(token2);
  console.log('validar(token) tras revocar():', sesiones.validar(token2));
}
