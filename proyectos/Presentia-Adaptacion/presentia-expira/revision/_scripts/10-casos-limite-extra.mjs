// 10-casos-limite-extra.mjs — Rango invertido, BD vacía en Informe/Solicitudes, y
// solicitud tipo 'editar' conserva el original al aprobar (independiente de flujos.test.js).
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

// --- Rango invertido (desde > hasta) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-31', hasta: '2026-07-01' } }));
  assert(inf.empleados.length === 0, 'rango invertido (desde>hasta) -> informe vacío, SIN lanzar excepción');
  const regs = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-31', hasta: '2026-07-01' } }));
  assert(Array.isArray(regs) && regs.length === 0, 'rango invertido -> registros vacío, SIN lanzar excepción');
}

// --- BD completamente vacía (arranque limpio) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const hoy = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  const sols = manager.solicitudes(deps, ctx(modulo, { actor: ADMIN, query: {} }));
  assert(hoy.marcas.length === 0 && hoy.dentroAhora === 0, 'BD vacía: Hoy sin error, todo en cero');
  assert(inf.empleados.length === 0 && inf.totalPeriodoTexto === '0 h 0 m', `BD vacía: Informe vacío sin error (total="${inf.totalPeriodoTexto}")`);
  assert(Array.isArray(sols) && sols.length === 0, 'BD vacía: Solicitudes vacío sin error');
}

// --- Solicitud tipo 'editar' (no 'anadir'): aprobar conserva el ORIGINAL ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  const tsOriginal = f1.ts;
  const tsPropuesto = tsOriginal - 20 * 60000; // el empleado dice que fichó 20 min antes
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk', body: { token: en.token, cambio: { accion: 'editar', marcaId: f1.marcaId, ts: tsPropuesto }, motivo: 'Fiché antes, el kiosko iba lento' },
  }));
  assert(sol.tipo === 'correccion' && sol.cambio.accion === 'editar', 'solicitud tipo editar conserva accion=editar en el cambio');
  manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} }));
  const marca = repos.marcaPorId(deps.db, f1.marcaId);
  assert(marca.ts === tsPropuesto, 'tras aprobar "editar", la marca queda con el ts PROPUESTO');
  const versiones = repos.versionesDeMarca(deps.db, f1.marcaId);
  assert(versiones.length === 1 && Number(versiones[0].valor_anterior) === tsOriginal, 'el ORIGINAL queda conservado en marca_versiones tras aprobar una solicitud tipo editar');
}

console.log('--- fin 10-casos-limite-extra.mjs ---');
