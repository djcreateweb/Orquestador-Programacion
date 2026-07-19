// 07-permisos.mjs — Matriz de permisos rol×acción COMPLETA (incluidas denegaciones),
// forjado de rol, token caducado, sin token, IDOR con ID ajeno en la petición, y
// kiosko intentando alcanzar rutas de administración.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import * as repos from '../../src/services/repos.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'script', rate: modulo.rate,
    kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };
const TECH = { empleadoId: 't1', rol: 'technician' };
const EMPLEADO = { empleadoId: 'e1', rol: 'empleado' };
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

// Datos base para poder invocar acciones que necesitan un id real.
const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
const solPendiente = kiosk.crearSolicitud(deps, ctx(modulo, {
  canal: 'kiosk', body: { token: en.token, cambio: { accion: 'anadir', jornadaId: f1.jornadaId, tipo: 'salida', ts: deps.clock.now() + 3600000 }, motivo: 'matriz permisos' },
}));

// --- Matriz rol × acción para TODAS las acciones de manager ---
const ACCIONES = [
  ['hoy', (actor) => manager.hoy(deps, ctx(modulo, { actor }))],
  ['registros', (actor) => manager.registros(deps, ctx(modulo, { actor, query: {} }))],
  ['editarMarca', (actor) => manager.editarMarca(deps, ctx(modulo, { actor, body: { marcaId: f1.marcaId, tsNuevo: f1.ts, motivo: 'test' } }))],
  ['anadirMarca', (actor) => manager.anadirMarca(deps, ctx(modulo, { actor, body: { jornadaId: f1.jornadaId, tipo: 'entrada', ts: f1.ts, motivo: 'test' } }))],
  ['informe', (actor) => manager.informe(deps, ctx(modulo, { actor, query: {} }))],
  ['informeExport', (actor) => manager.informeExport(deps, ctx(modulo, { actor, query: {}, formato: 'csv' }))],
  ['solicitudes', (actor) => manager.solicitudes(deps, ctx(modulo, { actor, query: {} }))],
  ['ajustesGet', (actor) => manager.ajustesGet(deps, ctx(modulo, { actor }))],
  ['ajustesPut', (actor) => manager.ajustesPut(deps, ctx(modulo, { actor, body: {} }))],
  ['auditoriaVerificar', (actor) => manager.auditoriaVerificar(deps, ctx(modulo, { actor }))],
  ['terminos', (actor) => manager.terminos(deps, ctx(modulo, { actor }))],
];

const ROLES = [
  ['SIN_SESION(null)', null],
  ['empleado', EMPLEADO],
  ['local_admin', ADMIN],
  ['technician', TECH],
];

console.log('\n=== MATRIZ rol × acción (manager) ===');
for (const [nombreAccion, fn] of ACCIONES) {
  const fila = [];
  for (const [nombreRol, actor] of ROLES) {
    let resultado;
    try { fn(actor); resultado = 'OK'; }
    catch (e) { resultado = e.code || 'ERROR'; }
    fila.push(`${nombreRol}=${resultado}`);
  }
  console.log(`${nombreAccion.padEnd(18)} ${fila.join(' | ')}`);
}

// Aserciones puntuales sobre la matriz (las más sensibles):
function esperar(nombreAccion, fn, actor, esperado, msg) {
  let real;
  try { fn(actor); real = 'OK'; } catch (e) { real = e.code || 'ERROR'; }
  assert(real === esperado, `${nombreAccion} con ${msg} -> esperado ${esperado}, obtenido ${real}`);
}
for (const [nombreAccion, fn] of ACCIONES) {
  esperar(nombreAccion, fn, null, 'NO_AUTENTICADO', 'sin sesión');
  esperar(nombreAccion, fn, EMPLEADO, 'PROHIBIDO', 'rol empleado');
}
// auditoriaVerificar: solo técnico (admin también debe ser rechazado)
{
  let real; try { manager.auditoriaVerificar(deps, ctx(modulo, { actor: ADMIN })); real = 'OK'; } catch (e) { real = e.code; }
  assert(real === 'PROHIBIDO', `auditoriaVerificar con local_admin -> PROHIBIDO (obtenido ${real})`);
  let realTech; try { manager.auditoriaVerificar(deps, ctx(modulo, { actor: TECH })); realTech = 'OK'; } catch (e) { realTech = e.code; }
  assert(realTech === 'OK', `auditoriaVerificar con technician -> OK (obtenido ${realTech})`);
}

// --- Forjar el rol en la petición: actor.rol='local_admin' pero empleadoId real es 'e1' (empleado) ---
// El backend NO valida contra deps.employees.getById(actor.empleadoId).rol: confía ciegamente
// en lo que trae ctx.actor (que en producción viene de session.resolve, no del cliente).
{
  const forjado = { empleadoId: 'e1', rol: 'local_admin' }; // e1 es realmente 'empleado' en employees
  let resultado;
  try { manager.hoy(deps, ctx(modulo, { actor: forjado })); resultado = 'OK'; } catch (e) { resultado = e.code; }
  console.log(`INFO: actor forjado {empleadoId:'e1', rol:'local_admin'} (e1 es realmente 'empleado') -> manager.hoy() = ${resultado}`);
  assert(resultado === 'OK', 'CONFIRMADO: si algo entre el cliente y el handler permitiera forjar ctx.actor.rol, el handler lo aceptaría sin volver a comprobar el rol real del empleado en employees.getById() — la seguridad recae 100% en que session.resolve(req) del host sea infalible');
}

// --- Token de kiosko CADUCADO ---
{
  const envCaducidad = crearReferenceEnv();
  const moduloCad = crearModulo(envCaducidad);
  const depsCad = moduloCad.deps;
  const entrada = kiosk.entrar(depsCad, ctx(moduloCad, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  envCaducidad.reloj.avanzar(91_000); // TTL de sesión kiosko = 90s
  let resultado;
  try { kiosk.fichar(depsCad, ctx(moduloCad, { canal: 'kiosk', body: { token: entrada.token } })); resultado = 'OK'; }
  catch (e) { resultado = e.code; }
  assert(resultado === 'SESION_KIOSKO', `token de kiosko caducado (>90s) -> SESION_KIOSKO (obtenido ${resultado})`);
}

// --- SIN token en absoluto ---
{
  let resultado;
  try { kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: {} })); resultado = 'OK'; }
  catch (e) { resultado = e.code; }
  assert(resultado === 'SESION_KIOSKO', `fichar SIN token -> SESION_KIOSKO (obtenido ${resultado})`);
}
{
  let resultado;
  try { kiosk.misRegistros(deps, ctx(modulo, { canal: 'kiosk', body: {} })); resultado = 'OK'; }
  catch (e) { resultado = e.code; }
  assert(resultado === 'SESION_KIOSKO', `misRegistros SIN token -> SESION_KIOSKO (obtenido ${resultado})`);
}

// --- IDOR: cambiar un ID ajeno en la petición (empleado e1 opera sobre marca de e2) ---
{
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e2', pin: '6410' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));
  let resultado;
  try {
    kiosk.crearSolicitud(deps, ctx(modulo, {
      canal: 'kiosk',
      body: { token: en.token /* token de e1 */, cambio: { accion: 'editar', marcaId: f2.marcaId /* marca de e2 */, ts: deps.clock.now() }, motivo: 'IDOR' },
    }));
    resultado = 'OK';
  } catch (e) { resultado = e.code; }
  assert(resultado === 'PROHIBIDO', `IDOR (e1 intenta editar marca de e2 vía solicitud) -> PROHIBIDO (obtenido ${resultado})`);

  // IDOR variante: 'anadir' con jornadaId ajena
  let resultado2;
  try {
    kiosk.crearSolicitud(deps, ctx(modulo, {
      canal: 'kiosk',
      body: { token: en.token, cambio: { accion: 'anadir', jornadaId: f2.jornadaId, tipo: 'salida', ts: deps.clock.now() }, motivo: 'IDOR2' },
    }));
    resultado2 = 'OK';
  } catch (e) { resultado2 = e.code; }
  assert(resultado2 === 'PROHIBIDO', `IDOR (e1 intenta anadir marca en jornada de e2) -> PROHIBIDO (obtenido ${resultado2})`);
}

// --- Desde el kiosko no debe alcanzarse NINGUNA ruta de administración ---
{
  const ACCIONES_KIOSK_CANAL = Object.entries(manager);
  for (const [nombre, fn] of ACCIONES_KIOSK_CANAL) {
    let resultado;
    try { fn(deps, ctx(modulo, { canal: 'kiosk', actor: ADMIN, body: {}, query: {}, params: { id: '1' } })); resultado = 'OK'; }
    catch (e) { resultado = e.code; }
    // Los handlers de manager NO comprueban ctx.canal (solo ctx.actor.rol) -> si actor=ADMIN, pasan igual con canal='kiosk'.
    console.log(`INFO: manager.${nombre}() invocado con canal='kiosk' pero actor=ADMIN -> ${resultado}`);
  }
}

console.log('--- fin 07-permisos.mjs ---');
