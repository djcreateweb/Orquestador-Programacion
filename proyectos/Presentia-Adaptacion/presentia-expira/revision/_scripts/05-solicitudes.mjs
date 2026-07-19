// 05-solicitudes.mjs — Verificación independiente de SOLICITUDES: filtros, aprobar/
// rechazar, doble-resolución, y simulación de concurrencia (dos "admins" a la vez).
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
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // solo entrada
const jid = f1.jornadaId;

// Solicitud A: anadir salida (pendiente)
const solA = kiosk.crearSolicitud(deps, ctx(modulo, {
  canal: 'kiosk', body: { token: en.token, cambio: { accion: 'anadir', jornadaId: jid, tipo: 'salida', ts: deps.clock.now() + 8 * 3600000 }, motivo: 'Olvidé fichar salida' },
}));
assert(solA.estado === 'pendiente', 'nueva solicitud queda pendiente');
assert(solA.motivo === 'Olvidé fichar salida', 'la solicitud conserva el motivo');
assert(solA.cambio.accion === 'anadir' && solA.cambio.tipo === 'salida', 'la solicitud conserva el cambio propuesto completo');

// --- Filtro por estado: pendiente ---
let pendientes = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: { estado: 'pendiente' } }));
assert(pendientes.length === 1 && pendientes[0].id === solA.id, 'filtro estado=pendiente devuelve la solicitud recién creada');

let aprobadas = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: { estado: 'aprobada' } }));
assert(aprobadas.length === 0, 'filtro estado=aprobada vacío antes de resolver nada');

let rechazadas = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: { estado: 'rechazada' } }));
assert(rechazadas.length === 0, 'filtro estado=rechazada vacío antes de resolver nada');

let sinFiltro = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: {} }));
assert(sinFiltro.length === 1, 'sin filtro (todas) devuelve la única solicitud existente');

// --- APROBAR aplica el cambio REAL ---
const marcasAntes = repos.marcasDeJornada(deps.db, jid).length;
const auditAntes = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
const ap = manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(solA.id) }, body: { comentario: 'Verificado' } }));
const marcasDespues = repos.marcasDeJornada(deps.db, jid).length;
const auditDespues = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
assert(ap.estado === 'aprobada', 'la solicitud queda aprobada');
assert(marcasDespues === marcasAntes + 1, 'aprobar "anadir" AÑADE efectivamente una marca real a la jornada');
assert(auditDespues === auditAntes + 1, 'aprobar genera exactamente 1 entrada de auditoría adicional');
const jornadaTrasAprobar = repos.jornadaPorId(deps.db, jid);
assert(jornadaTrasAprobar.estado === 'cerrada', 'la jornada queda cerrada tras aprobar la salida que faltaba');

// --- Una solicitud YA RESUELTA no se resuelve dos veces ---
let segundoIntento = null;
try {
  manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(solA.id) }, body: {} }));
} catch (e) { segundoIntento = e.code; }
assert(segundoIntento === 'SOLICITUD_RESUELTA', `segunda aprobación sobre la misma solicitud -> SOLICITUD_RESUELTA (obtenido ${segundoIntento})`);
const marcasTrasSegundoIntento = repos.marcasDeJornada(deps.db, jid).length;
assert(marcasTrasSegundoIntento === marcasDespues, 'el segundo intento de aprobar NO añade una marca duplicada');

let intentoRechazarYaAprobada = null;
try {
  manager.rechazar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(solA.id) }, body: {} }));
} catch (e) { intentoRechazarYaAprobada = e.code; }
assert(intentoRechazarYaAprobada === 'SOLICITUD_RESUELTA', 'rechazar una ya aprobada también falla con SOLICITUD_RESUELTA (no se puede "revertir" así)');

// --- RECHAZAR no cambia nada ---
{
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e2', pin: '6410' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));
  const jid2 = f2.jornadaId;
  const marcasAntesR = repos.marcasDeJornada(deps.db, jid2).length;
  const jornadaAntesR = JSON.stringify(repos.jornadaPorId(deps.db, jid2));
  const solB = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk', body: { token: en2.token, cambio: { accion: 'anadir', jornadaId: jid2, tipo: 'salida', ts: deps.clock.now() + 3600000 }, motivo: 'prueba rechazo' },
  }));
  const rec = manager.rechazar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(solB.id) }, body: { comentario: 'no procede' } }));
  assert(rec.estado === 'rechazada', 'la solicitud queda rechazada');
  const marcasDespuesR = repos.marcasDeJornada(deps.db, jid2).length;
  const jornadaDespuesR = JSON.stringify(repos.jornadaPorId(deps.db, jid2));
  assert(marcasDespuesR === marcasAntesR, 'rechazar NO añade ninguna marca');
  assert(jornadaAntesR === jornadaDespuesR, 'rechazar NO modifica la fila de la jornada en absoluto');
}

// --- CONCURRENCIA: dos "admins" resolviendo la MISMA solicitud a la vez (simulado) ---
{
  // Empleado 't1', que no ha fichado antes en este script: evita reutilizar la jornada
  // ya cerrada de 'e1' (jornadaObjetivo devuelve la jornada del día si YA existe).
  const en3 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 't1', pin: '5093' } }));
  const f3 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en3.token } }));
  const jid3 = f3.jornadaId;
  const solC = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk', body: { token: en3.token, cambio: { accion: 'anadir', jornadaId: jid3, tipo: 'salida', ts: deps.clock.now() + 3600000 }, motivo: 'concurrencia' },
  }));
  // "Admin A" y "Admin B" disparan aprobar() casi a la vez. Como el runtime de Node es
  // monohilo y aprobar() es 100% síncrona (sin await intermedio entre el SELECT de
  // estado y el UPDATE), Promise.all no puede intercalar ambas ejecuciones: la 2ª
  // siempre ve el estado ya resuelto por la 1ª. Se deja constancia de esta garantía.
  let okCount = 0, errCount = 0;
  const intentar = (actor) => {
    try { manager.aprobar(deps, ctx(modulo, { actor, params: { id: String(solC.id) }, body: {} })); okCount++; }
    catch (e) { if (e.code === 'SOLICITUD_RESUELTA') errCount++; else throw e; }
  };
  await Promise.all([
    Promise.resolve().then(() => intentar(ADMIN)),
    Promise.resolve().then(() => intentar(TECH)),
  ]);
  assert(okCount === 1 && errCount === 1, `solo UNA de las dos resoluciones concurrentes tiene éxito (ok=${okCount} err=${errCount})`);
  const marcasFinal = repos.marcasDeJornada(deps.db, jid3).length;
  assert(marcasFinal === 2, `NO se duplica la marca añadida (esperado 2 [entrada+salida], obtenido ${marcasFinal})`);

  // NOTA (hallazgo de diseño, no explotable con la arquitectura actual): el guard de
  // "estado !== pendiente" se lee ANTES de entrar en la transacción/SAVEPOINT y el
  // UPDATE final no incluye "AND estado='pendiente'" en su WHERE. La protección real
  // depende de que Node sea monohilo y de que aprobar() no tenga puntos de suspensión
  // (await) entre la lectura y la escritura. Documentado como riesgo de defensa en
  // profundidad para services/solicitudes.service.js (aprobar/rechazar).
  console.log('INFO: verificado — la separación lectura/escritura en aprobar() no está protegida a nivel SQL (WHERE sin estado=pendiente), solo por monohilo síncrono de Node.');
}

// --- describirCambio en la UI: motivo siempre visible (verificado a nivel de datos) ---
{
  const listaCompleta = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: {} }));
  assert(listaCompleta.every(s => typeof s.motivo === 'string' && s.motivo.length > 0), 'TODAS las solicitudes traen motivo no vacío para la UI');
  assert(listaCompleta.every(s => s.cambio && typeof s.cambio === 'object'), 'TODAS las solicitudes traen el objeto "cambio" para describirCambio() en Solicitudes.jsx');
}

console.log('--- fin 05-solicitudes.mjs ---');
