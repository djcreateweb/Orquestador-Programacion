// 06-ajustes.mjs — Verificación independiente de AJUSTES: cada ajuste en sus DOS
// estados con efecto real, persistencia tras "reinicio" (misma BD), valores
// inválidos, y bloqueo a un actor con rol 'empleado'.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import { leerConfig } from '../../src/db/migrate.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'script', rate: modulo.rate,
    kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };
const EMPLEADO = { empleadoId: 'e1', rol: 'empleado' };
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

// --- mostrarEnKiosko: true/false ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  let lista = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert(lista.length === 4, 'mostrarEnKiosko=true (defecto): la lista de empleados se muestra');
  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { mostrarEnKiosko: false } }));
  lista = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert(lista.length === 0, 'mostrarEnKiosko=false: la lista queda VACÍA (efecto real confirmado)');
  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { mostrarEnKiosko: true } }));
  lista = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert(lista.length === 4, 'mostrarEnKiosko=true de nuevo: la lista vuelve a mostrarse');
}

// --- exigirPin: true/false ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  let fallo = null;
  try { kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '0000' } })); }
  catch (e) { fallo = e.code; }
  assert(fallo === 'PIN_INCORRECTO', 'exigirPin=true (defecto): PIN erróneo -> PIN_INCORRECTO');

  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { exigirPin: false } }));
  const entrar = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '0000' } }));
  assert(!!entrar.token, 'exigirPin=false: se puede entrar con CUALQUIER pin (efecto real confirmado)');
}

// --- variasMarcasDia: true/false ---
{
  const env = crearReferenceEnv({ config: { variasMarcasDia: false } });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // entrada
  env.reloj.avanzar(3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } })); // salida
  env.reloj.avanzar(3600000);
  const en3 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  let fallo = null;
  try { kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en3.token } })); }
  catch (e) { fallo = e.code; }
  assert(fallo === 'JORNADA_CERRADA', 'variasMarcasDia=false: NO deja reabrir la jornada del día (efecto real)');

  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { variasMarcasDia: true } }));
  const en4 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const r4 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en4.token } }));
  assert(r4.tipo === 'entrada', 'variasMarcasDia=true: SÍ deja reabrir/añadir otra entrada el mismo día');
}

// --- imprimirTicket: true/false (puerto printing simulado) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  let llamadas = 0;
  deps.printing = { printTicket: () => { llamadas++; } };

  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  assert(llamadas === 0, 'imprimirTicket=false (defecto): NO se invoca printing.printTicket');

  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { imprimirTicket: true } }));
  env.reloj.avanzar(3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));
  assert(llamadas === 1, 'imprimirTicket=true: SÍ se invoca printing.printTicket exactamente 1 vez (efecto real)');
}

// --- redondeoMin: 0 vs 15 (efecto real ya cubierto en 04-informe.mjs; aquí solo el ajuste en sí) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const cfg0 = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  assert(cfg0.redondeoMin === 0, 'redondeoMin por defecto = 0 (sin redondeo)');
  const cfg15 = manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { redondeoMin: 15 } }));
  assert(cfg15.redondeoMin === 15, 'redondeoMin se persiste a 15 tras PUT');
}

// --- jornadaEstandarMin: ¿tiene EFECTO REAL en algún cálculo? ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  // 6 horas trabajadas, jornadaEstandarMin=480 (8h) por defecto
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  env.reloj.avanzar(6 * 3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));
  const infAntes = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));

  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { jornadaEstandarMin: 120 } })); // cambia de 8h a 2h "estándar"
  const infDespues = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));

  const cfgTrasCambio = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  assert(cfgTrasCambio.jornadaEstandarMin === 120, 'jornadaEstandarMin SE PERSISTE correctamente (120)');
  assert(
    JSON.stringify(infAntes.empleados) === JSON.stringify(infDespues.empleados),
    'HALLAZGO: jornadaEstandarMin (480->120, de 8h a 2h "estándar") NO cambia el informe en absoluto (mismos minutos/horas) — ajuste sin efecto real en ningún cálculo'
  );
}

// --- valor inválido: ¿se RECHAZA o se acota silenciosamente? (fix A-09: RE-EJECUTADO) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const antes = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  let codigo = null, publico = null;
  try {
    manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { redondeoMin: 999, jornadaEstandarMin: -50, conservacionAnios: 1, temaPorDefecto: 'invalido-xyz' } }));
  } catch (e) { codigo = e.code; publico = e.publico; }
  console.log('INFO: PUT con valores inválidos ahora lanza:', codigo, '-', publico);
  assert(codigo === 'AJUSTE_INVALIDO', 'valores inválidos se RECHAZAN con un código de error claro (antes: 200 OK silencioso)');
  const despues = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  assert(JSON.stringify(despues) === JSON.stringify(antes), 'rechazo ATÓMICO: ningún campo se acota/aplica en silencio, la config queda intacta');
}

// --- PERSISTENCIA tras "reinicio" del módulo (misma BD subyacente) ---
{
  const env = crearReferenceEnv();
  const modulo1 = crearModulo(env); // 1er arranque
  manager.ajustesPut(modulo1.deps, ctx(modulo1, { actor: ADMIN, body: { redondeoMin: 10, exigirPin: false, temaPorDefecto: 'oscuro' } }));

  // "Reinicio del servidor": se vuelve a llamar crearModulo() sobre la MISMA conexión
  // de BD (simula releer la config al arrancar de nuevo, sin perder lo persistido).
  const modulo2 = crearModulo(env);
  const cfgTrasReinicio = leerConfig(modulo2.deps.db);
  assert(cfgTrasReinicio.redondeoMin === 10, 'redondeoMin=10 persiste tras "reiniciar" el módulo (misma BD)');
  assert(cfgTrasReinicio.exigirPin === false, 'exigirPin=false persiste tras "reiniciar"');
  assert(cfgTrasReinicio.temaPorDefecto === 'oscuro', 'temaPorDefecto="oscuro" persiste tras "reiniciar"');

  // Y a través del handler normal del módulo "reiniciado":
  const cfgViaHandler = manager.ajustesGet(modulo2.deps, ctx(modulo2, { actor: ADMIN }));
  assert(cfgViaHandler.redondeoMin === 10 && cfgViaHandler.exigirPin === false, 'manager.ajustesGet() tras reinicio devuelve los valores persistidos, no los de fábrica');
}

// --- Un 'empleado' NO puede tocar ajustes (ni leer ni escribir) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  let falloGet = null, falloPut = null;
  try { manager.ajustesGet(deps, ctx(modulo, { actor: EMPLEADO })); } catch (e) { falloGet = e.code; }
  try { manager.ajustesPut(deps, ctx(modulo, { actor: EMPLEADO, body: { exigirPin: false } })); } catch (e) { falloPut = e.code; }
  assert(falloGet === 'PROHIBIDO', `empleado no puede LEER ajustes (obtenido ${falloGet})`);
  assert(falloPut === 'PROHIBIDO', `empleado no puede ESCRIBIR ajustes (obtenido ${falloPut})`);
  // Verificar que el ajuste efectivamente NO cambió
  const cfg = leerConfig(deps.db);
  assert(cfg.exigirPin === true, 'el intento del empleado no tuvo NINGÚN efecto sobre la config (sigue exigirPin=true)');
}

console.log('--- fin 06-ajustes.mjs ---');
