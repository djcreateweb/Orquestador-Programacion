// k-acceso.mjs — ACCESO: PIN correcto/incorrecto, genérico, empleado inactivo,
// PIN vacío/letras/demasiados dígitos, fuerza bruta + auditoría.
// Entorno propio en memoria (no toca el servidor compartido 8787).
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body, dispositivo) => ({ canal: 'kiosk', body, dispositivo });

function intentar(deps, modulo, empleadoId, pin, dispositivo = 'kiosko-A') {
  try {
    const r = kiosk.entrar(deps, ctx(modulo, K({ empleadoId, pin }, dispositivo)));
    return { ok: true, r };
  } catch (e) {
    return { ok: false, code: e.code, status: e.status, publico: e.publico, mensajeInterno: e.message };
  }
}

console.log('=== 1) PIN correcto entra ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', '4728');
  console.log(JSON.stringify(r));
  console.assert(r.ok === true, 'FALLO: PIN correcto debería entrar');
}

console.log('\n=== 2) PIN incorrecto NO entra, mensaje GENÉRICO (no dice qué campo falló) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', '0000');
  console.log(JSON.stringify(r));
  console.assert(r.ok === false && r.status === 401, 'FALLO: debería rechazar con 401');
  console.assert(r.publico === 'Credenciales incorrectas.', 'FALLO: mensaje público debería ser genérico');
}

console.log('\n=== 2b) empleadoId inexistente -> ¿mismo mensaje que PIN incorrecto? (no debe filtrar si el empleado existe o no) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'no-existe-999', '4728');
  console.log(JSON.stringify(r));
}

console.log('\n=== 3) Empleado inactivo/baja NO entra (aunque el PIN sea correcto) ===');
{
  const env = crearReferenceEnv({
    empleados: [
      { id: 'e9', nombre: 'Baja Reciente', rol: 'empleado', pin: '1357', activo: false },
    ],
  });
  const modulo = crearModulo(env);
  // entrar() no comprueba "activo" -> verifica si el PIN pasa y genera token igualmente.
  const r = intentar(env, modulo, 'e9', '1357');
  console.log('kiosk.entrar con empleado INACTIVO:', JSON.stringify(r));
  if (r.ok) {
    console.log('  -> entrar() concedió token pese a activo:false. Probamos si "fichar" lo bloquea después...');
    const deps = modulo.deps;
    try {
      const f = kiosk.fichar(deps, ctx(modulo, K({ token: r.r.token })));
      console.log('  FICHAR con empleado inactivo:', JSON.stringify(f));
      console.log('  >>> Si esto tuvo éxito, es un fallo: un empleado dado de baja pudo fichar.');
    } catch (e) {
      console.log('  fichar() rechazó al empleado inactivo:', e.code, e.publico);
    }
    // ¿Y la lista de empleados del kiosko? ¿lo sigue mostrando?
    const lista = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
    console.log('  ¿Aparece en la lista de empleados del kiosko?', lista.some(e => e.id === 'e9'));
  }
}

console.log('\n=== 4) PIN vacío ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', '');
  console.log(JSON.stringify(r));
}

console.log('\n=== 5) PIN con letras ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', 'abcd');
  console.log(JSON.stringify(r));
}

console.log('\n=== 6) PIN con más dígitos de los normales (10 dígitos) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', '4728472847');
  console.log(JSON.stringify(r));
}

console.log('\n=== 6b) PIN null/undefined directamente (sin campo) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const r = intentar(env, modulo, 'e1', undefined);
  console.log(JSON.stringify(r));
}

console.log('\n=== 7) FUERZA BRUTA: intentos repetidos se bloquean con backoff, quedan AUDITADOS, sin PIN en el log ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = env;
  const resultados = [];
  for (let i = 1; i <= 5; i++) {
    const r = intentar(env, modulo, 'e1', '9999', 'kiosko-BF');
    resultados.push({ intento: i, ...r });
  }
  console.log('Intentos 1-5 (PIN incorrecto):', JSON.stringify(resultados, null, 2));

  const filaIntentos = deps.db.prepare('SELECT * FROM presentia_pin_intentos WHERE empleado_id = ? AND dispositivo = ?').get('e1', 'kiosko-BF');
  console.log('Fila presentia_pin_intentos:', JSON.stringify(filaIntentos));
  console.assert(filaIntentos && filaIntentos.fallos >= 3, 'FALLO: debería haber acumulado fallos');
  console.assert(filaIntentos && filaIntentos.bloqueado_hasta > deps.clock.now(), 'FALLO: debería estar bloqueado tras 3+ fallos');

  // Intento 6, aunque pusiera el PIN CORRECTO, debe seguir bloqueado.
  const r6 = intentar(env, modulo, 'e1', '4728', 'kiosko-BF');
  console.log('Intento 6 CON PIN CORRECTO estando bloqueado:', JSON.stringify(r6));
  console.assert(r6.ok === false && r6.code === 'PIN_BLOQUEADO', 'FALLO: debería seguir bloqueado aunque el PIN sea correcto');

  // Auditoría: buscar los eventos pin_fallido / pin_bloqueado y confirmar que NO contienen el PIN.
  const filasAudit = deps.db.prepare("SELECT * FROM presentia_auditoria WHERE actor_id = 'e1' AND accion IN ('pin_fallido','pin_bloqueado') ORDER BY id ASC").all();
  console.log('Eventos de auditoría (pin_fallido/pin_bloqueado):', JSON.stringify(filasAudit, null, 2));
  const contienePin = filasAudit.some(f => JSON.stringify(f).includes('9999') || JSON.stringify(f).includes('4728'));
  console.log('¿Algún registro de auditoría contiene el valor del PIN (9999 o 4728)?', contienePin);
  console.assert(!contienePin, 'FALLO DE SEGURIDAD: el PIN aparece en la auditoría');

  // Otro dispositivo, mismo empleado: ¿el bloqueo es por (empleado, dispositivo) y no bloquea a otros kioskos?
  const rOtroDispositivo = intentar(env, modulo, 'e1', '4728', 'kiosko-OTRO');
  console.log('Mismo empleado, PIN correcto, OTRO dispositivo (no bloqueado):', JSON.stringify(rOtroDispositivo));
}

console.log('\n=== 8) Tras un PIN correcto se limpian los intentos previos (no bloqueo residual) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  intentar(env, modulo, 'e2', '0000', 'kiosko-C'); // 1 fallo
  intentar(env, modulo, 'e2', '0000', 'kiosko-C'); // 2 fallos
  const rOk = intentar(env, modulo, 'e2', '6410', 'kiosko-C'); // correcto antes del umbral (3)
  console.log('Login correcto tras 2 fallos (antes del umbral):', JSON.stringify(rOk));
  const fila = env.db.prepare('SELECT * FROM presentia_pin_intentos WHERE empleado_id=? AND dispositivo=?').get('e2', 'kiosko-C');
  console.log('Fila de intentos tras login correcto (debería no existir / fallos=0):', JSON.stringify(fila));
}
