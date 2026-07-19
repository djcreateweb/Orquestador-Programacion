// 01-audit-tamper.mjs — Repro de integridad de la auditoría encadenada por hash.
// Entorno PROPIO en memoria (no toca el 8787 compartido).
//
// Escenario A: UPDATE de una fila intermedia            -> ¿se detecta?
// Escenario B: DELETE de una fila intermedia             -> ¿se detecta?
// Escenario C: DELETE de la(s) fila(s) MÁS RECIENTE(S)   -> ¿se detecta? (truncamiento de cola)
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';
import { verificarIntegridad } from '../../src/services/audit.service.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-test',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}

function entornoConNFichajes(n) {
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const empleados = ['e1', 'e2'];
  const pins = { e1: '4728', e2: '6410' };
  for (let i = 0; i < n; i++) {
    const emp = empleados[i % 2];
    const en = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: emp, pin: pins[emp] } }));
    kiosk.fichar(deps, ctx(modulo, { body: { token: en.token } }));
    env.reloj.avanzar(3600 * 1000);
  }
  return { env, modulo, deps };
}

console.log('======================================================================');
console.log('ESCENARIO A: UPDATE directo de una fila INTERMEDIA de presentia_auditoria');
console.log('======================================================================');
{
  const { deps } = entornoConNFichajes(6);
  const filas = deps.db.prepare('SELECT id FROM presentia_auditoria ORDER BY id').all();
  console.log('Filas de auditoría generadas:', filas.map((f) => f.id));
  console.log('verificarIntegridad() ANTES:', verificarIntegridad(deps.db));
  const midId = filas[2].id; // claramente intermedia (hay filas después)
  deps.db.prepare("UPDATE presentia_auditoria SET detalle = '{\"manipulado\":true}' WHERE id = ?").run(midId);
  const v = verificarIntegridad(deps.db);
  console.log(`UPDATE en fila intermedia id=${midId} -> verificarIntegridad():`, v);
  console.log(v.ok === false && v.rotoEn === midId ? 'RESULTADO: DETECTADO correctamente.\n' : 'RESULTADO: FALLO, no detectado.\n');
}

console.log('======================================================================');
console.log('ESCENARIO B: DELETE directo de una fila INTERMEDIA de presentia_auditoria');
console.log('======================================================================');
{
  const { deps } = entornoConNFichajes(6);
  const filas = deps.db.prepare('SELECT id FROM presentia_auditoria ORDER BY id').all();
  console.log('Filas de auditoría generadas:', filas.map((f) => f.id));
  console.log('verificarIntegridad() ANTES:', verificarIntegridad(deps.db));
  const midId = filas[2].id; // claramente intermedia (hay filas después)
  deps.db.prepare('DELETE FROM presentia_auditoria WHERE id = ?').run(midId);
  const v = verificarIntegridad(deps.db);
  console.log(`DELETE de la fila intermedia id=${midId} -> verificarIntegridad():`, v);
  console.log(v.ok === false ? 'RESULTADO: DETECTADO correctamente (hueco en la cadena).\n' : 'RESULTADO: FALLO, no detectado.\n');
}

console.log('======================================================================');
console.log('ESCENARIO C: DELETE de la(s) fila(s) MÁS RECIENTE(S) (truncamiento de cola)');
console.log('======================================================================');
{
  const { deps } = entornoConNFichajes(6);
  const filas = deps.db.prepare('SELECT id FROM presentia_auditoria ORDER BY id').all();
  console.log('Filas de auditoría generadas:', filas.map((f) => f.id));
  console.log('verificarIntegridad() ANTES:', verificarIntegridad(deps.db));
  const lastId = filas[filas.length - 1].id;
  deps.db.prepare('DELETE FROM presentia_auditoria WHERE id = ?').run(lastId);
  const v = verificarIntegridad(deps.db);
  console.log(`DELETE de la ÚLTIMA fila (más reciente) id=${lastId} -> verificarIntegridad():`, v);
  console.log(v.ok === false ? 'RESULTADO: detectado.\n' : 'RESULTADO: NO DETECTADO — el borrado de la cola no rompe la cadena (limitación inherente del hash-chain sin ancla externa).\n');
}

console.log('CONCLUSIÓN: la cadena de hash detecta CUALQUIER alteración/borrado de una fila que');
console.log('tenga al menos una fila posterior (protege el histórico "en el medio" de la cadena).');
console.log('NO detecta el borrado de las N filas MÁS RECIENTES (truncamiento de cola), porque no');
console.log('hay ningún registro posterior cuyo prev_hash referencie el hash eliminado. Esto es una');
console.log('limitación estructural de un hash-chain sin ancla/checkpoint externo (p.ej. publicar');
console.log('periódicamente el último hash fuera del sistema, o comparar contra un id/rowid máximo');
console.log('conocido por un tercero).');
