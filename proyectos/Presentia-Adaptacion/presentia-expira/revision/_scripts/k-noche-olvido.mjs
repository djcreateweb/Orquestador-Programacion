// k-noche-olvido.mjs — Prueba AISLADA (entorno propio en memoria) del caso:
// "olvidar la salida un día y fichar la mañana siguiente NO puede cerrar la
// jornada de ayer con la hora de hoy".
// No toca el servidor compartido 8787 ni ningún .db real. BD en memoria.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import * as repos from '../../src/services/repos.js';

const H = 3600 * 1000;

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };

console.log('=== CASO K-NOCHE-01: entrada 08:00 lunes, SIN salida (olvido). Martes 07:30 ficha de nuevo (23.5h despues) ===');
{
  const inicio = Date.UTC(2026, 6, 13, 8, 0, 0); // lunes 13 jul 2026, 08:00 UTC (verano Madrid = 10:00 local, da igual)
  const env = crearReferenceEnv({ now: inicio });
  const modulo = crearModulo(env);
  const deps = modulo.deps;

  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  console.log('Lunes 08:00 -> ficha', f1.tipo, 'jornadaId=', f1.jornadaId, 'codigo=', f1.codigo);

  // El empleado se olvida de fichar la salida el lunes. Avanza el reloj 23h30m (martes 07:30).
  env.reloj.avanzar(23.5 * H);

  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('Martes 07:30 -> re-login. estado.siguienteTipo =', en2.estado.siguienteTipo, ' dentro=', en2.estado.dentro, ' desde=', en2.estado.desde ? new Date(en2.estado.desde).toISOString() : null);
  console.log('  (El botón del kiosko mostrará: "FICHAR ' + en2.estado.siguienteTipo.toUpperCase() + '")');

  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  console.log('Martes 07:30 -> el empleado pulsa el único botón disponible. Resultado: tipo=', f2.tipo, ' jornadaId=', f2.jornadaId, ' codigo=', f2.codigo);

  const jornadaLunes = repos.jornadaPorId(deps.db, f1.jornadaId);
  const marcas = repos.marcasDeJornada(deps.db, f1.jornadaId);
  console.log('Jornada del LUNES tras el "fichaje" del martes:', JSON.stringify(jornadaLunes));
  console.log('Marcas de esa jornada:', JSON.stringify(marcas.map(m => ({ tipo: m.tipo, ts: new Date(m.ts).toISOString() }))));

  const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
  console.log('Total de jornadas en BD tras el incidente:', totalJornadas);

  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  console.log('Informe de horas de e1:', JSON.stringify(inf.empleados[0], null, 2));

  console.log('\n>>> DIAGNÓSTICO:');
  if (f2.tipo === 'salida' && f2.jornadaId === f1.jornadaId) {
    console.log('  BUG CONFIRMADO: el fichaje del MARTES 07:30 se registró como SALIDA de la jornada del LUNES.');
    console.log('  La jornada del lunes quedó con', (marcas[marcas.length-1].ts - marcas[0].ts) / H, 'horas (¡debería ser un día laborable normal!).');
    console.log('  Además, el empleado NO tiene ninguna entrada registrada para el MARTES: su jornada de hoy no existe hasta que vuelva a fichar.');
  } else {
    console.log('  No reproducido en este escenario: el sistema creó una jornada nueva para el martes.');
  }
}

console.log('\n\n=== CASO K-NOCHE-02 (control, turno de noche real): entrada 22:00, salida 06:00 al día siguiente (8h después) ===');
{
  const inicio = Date.UTC(2026, 6, 13, 20, 0, 0); // 22:00 Madrid (verano, UTC+2)
  const env = crearReferenceEnv({ now: inicio });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  console.log('22:00 -> ficha', f1.tipo, 'jornadaId=', f1.jornadaId);
  env.reloj.avanzar(8 * H); // 06:00 siguiente
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  console.log('06:00 (+8h) -> ficha', f2.tipo, 'jornadaId=', f2.jornadaId, '(misma jornada?', f2.jornadaId === f1.jornadaId, ')');
  const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
  console.log('Total de jornadas en BD:', totalJornadas, '(esperado: 1, turno de noche correcto)');
}

console.log('\n\n=== CASO K-NOCHE-03 (frontera): olvido y regreso EXACTAMENTE 24h después ===');
{
  const inicio = Date.UTC(2026, 6, 13, 8, 0, 0);
  const env = crearReferenceEnv({ now: inicio });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  env.reloj.avanzar(24 * H); // exactamente 24h después
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('24h después -> siguienteTipo =', en2.estado.siguienteTipo, '(si es "entrada", el sistema SÍ trata esto como día nuevo)');
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  console.log('Resultado: tipo=', f2.tipo, 'misma jornada que ayer?', f2.jornadaId === f1.jornadaId);
}
