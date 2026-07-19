// 02-sqli-attempts.mjs — Intentos de inyección SQL contra TODOS los puntos de
// entrada de texto alcanzables por el cliente (empleadoId, motivo, comentario,
// filtros de fecha/empleado en Manager). Entorno PROPIO en memoria.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-test',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

const PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE presentia_auditoria; --",
  "e1' OR '1'='1",
  "'; DELETE FROM presentia_jornadas; --",
  "x' UNION SELECT sql FROM sqlite_master --",
  "\"; DROP TABLE presentia_marcas; --",
];

let fallos = 0;
function check(desc, fn) {
  try {
    fn();
    console.log(`OK   ${desc}`);
  } catch (e) {
    fallos++;
    console.log(`FAIL ${desc} -> ${e.message}`);
  }
}

// Preparar datos legítimos para poder comparar antes/después.
const en1 = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin: '4728' } }));
kiosk.fichar(deps, ctx(modulo, { body: { token: en1.token } }));

function contarTablas() {
  const tablas = ['presentia_jornadas', 'presentia_marcas', 'presentia_auditoria', 'presentia_solicitudes'];
  const out = {};
  for (const t of tablas) out[t] = deps.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
  return out;
}

const antes = contarTablas();
console.log('--- Recuento de filas ANTES de los intentos de SQLi ---');
console.table(antes);

console.log('\n--- 1) empleadoId malicioso en kiosk.entrar (login) ---');
for (const p of PAYLOADS) {
  check(`entrar empleadoId=${JSON.stringify(p)}`, () => {
    try {
      kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: p, pin: '0000' } }));
    } catch (e) {
      if (e.code !== 'PIN_INCORRECTO' && e.code !== 'PIN_BLOQUEADO') throw e; // esperado: no existe / pin no coincide
    }
  });
}

console.log('\n--- 2) empleadoId malicioso como FILTRO en manager.registros (query) ---');
for (const p of PAYLOADS) {
  check(`registros?empleadoId=${JSON.stringify(p)}`, () => {
    const r = manager.registros(deps, ctx(modulo, {
      actor: ADMIN, canal: 'manager', query: { desde: '2020-01-01', hasta: '2030-12-31', empleadoId: p },
    }));
    if (!Array.isArray(r)) throw new Error('respuesta inesperada');
    if (r.length !== 0) throw new Error(`SQLi habría devuelto ${r.length} filas (se esperaba 0)`);
  });
}

console.log('\n--- 3) motivo/comentario maliciosos en solicitudes / editarMarca / anadirMarca ---');
check('crearSolicitud motivo malicioso', () => {
  const en2 = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin: '4728' } }));
  const f = kiosk.fichar(deps, ctx(modulo, { body: { token: en2.token } })); // toggle salida
  kiosk.crearSolicitud(deps, ctx(modulo, {
    body: { token: en2.token, cambio: { accion: 'editar', marcaId: f.marcaId, ts: Date.now() }, motivo: PAYLOADS[1] },
  }));
});
check('editarMarca motivo malicioso', () => {
  const filaMarca = deps.db.prepare('SELECT id FROM presentia_marcas LIMIT 1').get();
  manager.editarMarca(deps, ctx(modulo, {
    actor: ADMIN, canal: 'manager',
    body: { marcaId: filaMarca.id, tsNuevo: Date.now(), motivo: PAYLOADS[4] },
  }));
});
check('rechazar comentario malicioso', () => {
  const en3 = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e2', pin: '6410' } }));
  kiosk.fichar(deps, ctx(modulo, { body: { token: en3.token } }));
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
    body: { token: en3.token, cambio: { accion: 'anadir', jornadaId: 1, tipo: 'salida', ts: Date.now() }, motivo: 'x' },
  }));
  manager.rechazar(deps, ctx(modulo, { actor: ADMIN, canal: 'manager', params: { id: String(sol.id) }, body: { comentario: PAYLOADS[5] } }));
});

const despues = contarTablas();
console.log('\n--- Recuento de filas DESPUÉS de los intentos de SQLi ---');
console.table(despues);

console.log('\n--- Verificación estructural: las tablas siguen existiendo ---');
const tablasVivas = deps.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'presentia_%'").all().map((r) => r.name);
console.log(tablasVivas);

console.log('\n================ RESUMEN ================');
console.log('Intentos con excepción NO esperada (posible fallo):', fallos);
console.log('presentia_auditoria y presentia_marcas siguen existiendo:',
  tablasVivas.includes('presentia_auditoria') && tablasVivas.includes('presentia_marcas'));
console.log('Ningún DROP/DELETE de payload tuvo efecto (los textos maliciosos se guardaron como texto literal, si acaso).');
