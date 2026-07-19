// 02-registros.mjs — Verificación independiente de la pestaña REGISTROS.
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
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

const RANGO = { desde: '2026-07-01', hasta: '2026-07-31' };

// --- Setup: e1 y e2 fichan varios días ---
const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

function ficharComo(id, pin) {
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: id, pin } }));
  return kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
}

// Día 1 (13 jul): e1 entra+sale (jornada cerrada), e2 solo entra (jornada abierta)
const f1 = ficharComo('e1', '4728'); // entrada
env.reloj.avanzar(4 * 3600 * 1000);
const f2 = ficharComo('e1', '4728'); // salida
const f3 = ficharComo('e2', '6410'); // entrada (queda abierta)

// --- Filtro por rango (ambos empleados) ---
const todos = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
assert(todos.length === 2, `registros sin filtro empleado: 2 jornadas (obtenido ${todos.length})`);

// --- Filtro por empleado ---
const soloE1 = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: 'e1' } }));
assert(soloE1.length === 1 && soloE1[0].empleadoId === 'e1', 'filtro por empleado devuelve solo sus jornadas');

const soloE2 = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: 'e2' } }));
assert(soloE2.length === 1 && soloE2[0].enCurso === true, 'e2 sigue "en curso" (sin salida) -> UI pinta ámbar');
assert(soloE2[0].salida === null, 'jornada en curso: salida=null (para que la UI muestre insignia en vez de hora)');

// --- Filtro por rango que NO cubre nada ---
const fuera = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-01-01', hasta: '2026-01-31', empleadoId: 'e1' } }));
assert(fuera.length === 0, 'rango sin jornadas -> lista vacía sin error');

// --- Filtro combinado (empleado + rango que sí cubre) ---
const combinado = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-13', hasta: '2026-07-13', empleadoId: 'e1' } }));
assert(combinado.length === 1, 'filtro combinado (empleado+rango exacto del día) funciona');

// --- Badge "editado" solo donde toca ---
assert(todos.every(j => j.editado === false), 'antes de editar, ninguna jornada trae editado=true');

// --- EDITAR: valida motivo obligatorio ---
let fallo400 = false;
try {
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f1.marcaId, tsNuevo: f1.ts + 60000, motivo: '   ' } }));
} catch (e) { fallo400 = e.code === 'MOTIVO_REQUERIDO'; }
assert(fallo400, 'editarMarca sin motivo (solo espacios) -> MOTIVO_REQUERIDO');

// --- EDITAR: guarda, audita, conserva el ORIGINAL ---
const tsOriginal = f1.ts;
const tsNuevo = tsOriginal + 15 * 60 * 1000;
const auditoriaAntes = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
const resultado = manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f1.marcaId, tsNuevo, motivo: 'Ajuste de prueba QA' } }));
const auditoriaDespues = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
assert(auditoriaDespues === auditoriaAntes + 1, 'editarMarca añade EXACTAMENTE 1 fila de auditoría');
const ultimaAuditoria = deps.db.prepare('SELECT * FROM presentia_auditoria ORDER BY id DESC LIMIT 1').get();
assert(ultimaAuditoria.accion === 'marca_editada' && ultimaAuditoria.actor_id === 'a1', 'auditoría refleja accion=marca_editada, actor=a1');
const detalle = JSON.parse(ultimaAuditoria.detalle);
assert(detalle.tsAnterior === tsOriginal && detalle.tsNuevo === tsNuevo, 'auditoría.detalle conserva tsAnterior y tsNuevo correctos');

const versiones = repos.versionesDeMarca(deps.db, f1.marcaId);
assert(versiones.length === 1, 'exactamente 1 versión registrada en marca_versiones');
assert(Number(versiones[0].valor_anterior) === tsOriginal, `marca_versiones.valor_anterior === ts original (${tsOriginal})`);
assert(Number(versiones[0].valor_nuevo) === tsNuevo, 'marca_versiones.valor_nuevo === ts nuevo enviado');
assert(versiones[0].motivo === 'Ajuste de prueba QA', 'marca_versiones conserva el motivo');

const marcaActual = repos.marcaPorId(deps.db, f1.marcaId);
assert(marcaActual.ts === tsNuevo, 'la marca actual refleja el NUEVO valor tras la edición');
assert(marcaActual.editado === 1, 'la marca queda marcada editado=1');

const jornadaEditada = repos.jornadaPorId(deps.db, resultado.id);
assert(jornadaEditada.editado === 1, 'la jornada queda marcada editado=1 tras editar una de sus marcas');

// Verificar que el resto de jornadas SIN editar siguen con editado=false (badge solo donde toca)
const listaTrasEditar = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
const jE2 = listaTrasEditar.find(j => j.empleadoId === 'e2');
assert(jE2.editado === false, 'la jornada de e2 (no tocada) NO lleva badge editado');
const jE1 = listaTrasEditar.find(j => j.empleadoId === 'e1');
assert(jE1.editado === true, 'la jornada de e1 (editada) SÍ lleva badge editado');

// --- ANADIR MARCA: sobre jornada existente (cierra la jornada abierta de e2) ---
const jornadaE2 = repos.jornadaDe(deps.db, 'e2', '2026-07-13');
const tsSalidaE2 = deps.clock.now() + 3600000;
const anadida = manager.anadirMarca(deps, ctx(modulo, { actor: ADMIN, body: { jornadaId: jornadaE2.id, tipo: 'salida', ts: tsSalidaE2, motivo: 'Se olvidó fichar salida' } }));
assert(anadida.enCurso === false, 'anadirMarca(salida) cierra la jornada -> enCurso=false');
assert(anadida.editado === true, 'jornada con marca añadida por admin queda editado=true');
const auditoriaAnadir = deps.db.prepare("SELECT * FROM presentia_auditoria WHERE accion = 'marca_anadida' ORDER BY id DESC LIMIT 1").get();
assert(!!auditoriaAnadir, 'anadirMarca genera entrada de auditoría accion=marca_anadida');

// --- CASO LÍMITE: ¿anadirMarca puede crear una jornada NUEVA (día sin ninguna marca)? ---
let creoJornadaNueva = null;
try {
  // 'jornadaId' inventado / inexistente, simulando "empleado que NUNCA fichó ese día"
  manager.anadirMarca(deps, ctx(modulo, { actor: ADMIN, body: { jornadaId: 999999, tipo: 'entrada', ts: deps.clock.now(), motivo: 'Día completo olvidado' } }));
  creoJornadaNueva = true;
} catch (e) {
  creoJornadaNueva = false;
  console.log('INFO: anadirMarca con jornadaId inexistente lanza:', e.code, '-', e.mensaje || e.message);
}
assert(creoJornadaNueva === false, 'anadirMarca NO crea una jornada nueva desde cero (requiere jornadaId EXISTENTE) — ver hallazgo de gap funcional');

// --- Orden por defecto ---
const ordenPorFecha = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
const ordenadoAsc = ordenPorFecha.every((j, i) => i === 0 || ordenPorFecha[i - 1].fecha <= j.fecha);
assert(ordenadoAsc, 'registros.listarJornadas devuelve orden ascendente por fecha (repos.jornadasEnRango ORDER BY fecha ASC)');

console.log('--- fin 02-registros.mjs ---');
