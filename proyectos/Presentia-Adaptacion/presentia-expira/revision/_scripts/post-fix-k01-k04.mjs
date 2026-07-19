// post-fix-k01-k04.mjs — Evidencia POST-FIX (Fase 5 · Bloque A) de K-01 y K-04.
// Reutiliza el patrón de los scripts de la Ronda 1 (k-noche-olvido.mjs,
// k-dos-tablets.mjs, k-fichar-doble-idor-autoaprobar.mjs) pero con try/catch para
// mostrar limpiamente el comportamiento CORREGIDO (los scripts originales de Ronda 1
// no capturaban la excepción nueva de K-04 y por eso ahora "crashean" con
// FICHAJE_DUPLICADO — eso es justo la prueba de que el fix funciona).
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import * as repos from '../../src/services/repos.js';

const H = 3600 * 1000;
let fallos = 0;
const ok = (cond, msg) => { if (cond) console.log('  OK:', msg); else { console.error('  FALLO:', msg); fallos++; } };

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };

console.log('=== K-01: olvido de salida (23.5h) YA NO cierra la jornada de ayer con la hora de hoy ===');
{
  const inicio = Date.UTC(2026, 6, 13, 8, 0, 0); // lunes 08:00
  const env = crearReferenceEnv({ now: inicio });
  const modulo = crearModulo(env);
  const deps = modulo.deps;

  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  env.reloj.avanzar(23.5 * H); // martes 07:30 (< 24h)
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));

  ok(f2.tipo === 'entrada', `el fichaje del martes es ENTRADA (no salida de ayer); tipo=${f2.tipo}`);
  ok(f2.jornadaId !== f1.jornadaId, 'se abrió una jornada NUEVA para el martes');
  const jornadaLunes = repos.jornadaPorId(deps.db, f1.jornadaId);
  ok(jornadaLunes.estado === 'abierta', 'la jornada del lunes sigue abierta (no se cerró con la hora de hoy)');
  ok(jornadaLunes.requiere_correccion === 1, 'la jornada del lunes queda marcada "requiere corrección"');
  const total = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
  ok(total === 2, `se crearon 2 jornadas (lunes abandonada + martes nueva); total=${total}`);

  const filas = manager.registros(deps, ctx(modulo, { actor: ADMIN, canal: 'manager', query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  const filaLunes = filas.find((f) => f.id === f1.jornadaId);
  ok(filaLunes.requiereCorreccion === true, 'Registros expone requiereCorreccion=true para que el admin la vea y corrija');
}

console.log('\n=== K-01 (control): turno de noche real (22:00->06:00) SIGUE cerrando la misma jornada ===');
{
  const inicio = Date.UTC(2026, 6, 13, 20, 0, 0); // 22:00 Madrid
  const env = crearReferenceEnv({ now: inicio });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  env.reloj.avanzar(8 * H);
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  ok(f2.tipo === 'salida' && f2.jornadaId === f1.jornadaId, 'el turno de noche sigue cerrando la MISMA jornada (sin regresión)');
}

console.log('\n=== K-04: doble pulsación casi simultánea (mismo empleado, dos tablets) SE RECHAZA ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const enA = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const enB = kiosk.entrar(deps, ctx(modulo, { ...K({ empleadoId: 'e1', pin: '4728' }), dispositivo: 'tablet-B' }));
  const fA = kiosk.fichar(deps, ctx(modulo, K({ token: enA.token })));
  ok(fA.tipo === 'entrada', 'tablet A ficha ENTRADA');
  try {
    kiosk.fichar(deps, ctx(modulo, { ...K({ token: enB.token }), dispositivo: 'tablet-B' }));
    ok(false, 'tablet B debería haber sido rechazada (FICHAJE_DUPLICADO) y no lo fue');
  } catch (e) {
    ok(e.code === 'FICHAJE_DUPLICADO', `tablet B rechazada con código ${e.code} (429): "${e.publico}"`);
  }
  const marcas = repos.marcasDeJornada(deps.db, fA.jornadaId);
  ok(marcas.length === 1, `sólo hay 1 marca (la de tablet A); no se creó un ciclo entrada+salida de 0 min (marcas=${marcas.length})`);
}

console.log('\n=== K-04 (control): fichadas espaciadas más de la ventana anti-rebote SÍ se procesan normal ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  env.reloj.avanzar(4000); // 4s > ventana (3s por defecto)
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  ok(f1.tipo === 'entrada' && f2.tipo === 'salida' && f2.jornadaId === f1.jornadaId, 'fichada espaciada (4s) NO se ve afectada por la guardia anti-rebote');
}

console.log(`\n${fallos === 0 ? 'TODAS LAS COMPROBACIONES OK' : `${fallos} FALLO(S)`}`);
process.exitCode = fallos === 0 ? 0 : 1;
