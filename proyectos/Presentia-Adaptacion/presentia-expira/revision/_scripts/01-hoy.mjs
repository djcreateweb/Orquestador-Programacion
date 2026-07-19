// 01-hoy.mjs — Verificación independiente de la pestaña HOY (KPIs vs SQL directo).
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'script', rate: modulo.rate,
    kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };

function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

// --- Caso 1: CERO marcas hoy ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const hoy = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert(hoy.dentroAhora === 0 && hoy.salidas === 0 && hoy.personasHoy === 0 && hoy.marcas.length === 0,
    `cero marcas -> KPIs en cero (obtenido: ${JSON.stringify(hoy)})`);
}

// --- Caso 2: KPIs cuadran con SQL directo tras fichajes variados ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;

  // e1: entra y sale (se ha ido)
  const en1 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en1.token } })); // entrada
  env.reloj.avanzar(3600 * 1000);
  const en1b = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en1b.token } })); // salida

  // e2: entra, sigue dentro
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e2', pin: '6410' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } })); // entrada

  // a1 (admin): entra, sigue dentro
  const ena = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'a1', pin: '8391' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: ena.token } }));

  const hoy = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));

  // Recomputación independiente por SQL directo sobre la MISMA bd en memoria
  const fecha = hoy.fecha;
  const jornadas = deps.db.prepare('SELECT * FROM presentia_jornadas WHERE fecha = ?').all(fecha);
  let dentro = 0, salidas = 0, marcasTotal = 0;
  const personas = new Set();
  for (const j of jornadas) {
    const marcas = deps.db.prepare('SELECT * FROM presentia_marcas WHERE jornada_id = ? ORDER BY ts ASC').all(j.id);
    marcasTotal += marcas.length;
    if (marcas.length) personas.add(j.empleado_id);
    const ultima = marcas[marcas.length - 1];
    if (ultima && ultima.tipo === 'entrada') dentro++;
    else if (marcas.length) salidas++;
  }
  assert(hoy.dentroAhora === dentro, `dentroAhora (${hoy.dentroAhora}) === SQL directo (${dentro})`);
  assert(hoy.salidas === salidas, `salidas (${hoy.salidas}) === SQL directo (${salidas})`);
  assert(hoy.personasHoy === personas.size, `personasHoy (${hoy.personasHoy}) === SQL directo (${personas.size})`);
  assert(hoy.marcasHoy === marcasTotal, `marcasHoy (${hoy.marcasHoy}) === SQL directo (${marcasTotal})`);
  assert(hoy.dentroAhora === 2 && hoy.salidas === 1 && hoy.personasHoy === 3, `valores esperados exactos: dentro=2 salidas=1 personas=3 (obtenido dentro=${hoy.dentroAhora} salidas=${hoy.salidas} personas=${hoy.personasHoy})`);

  // Insignia por marca: verificar que cada marca trae 'tipo' correcto (entrada/salida) para que la UI pinte la insignia correcta
  const tipos = new Set(hoy.marcas.map(m => m.tipo));
  assert([...tipos].every(t => t === 'entrada' || t === 'salida'), 'todas las marcas traen tipo entrada|salida para la insignia');
  assert(hoy.marcas.every(m => m.codigo && m.empleadoNombre), 'cada marca trae código y nombre de empleado (para pintar la fila)');

  // Orden de marcas: la UI las muestra tal cual llegan (sort por ts desc en el backend)
  const ordenado = hoy.marcas.every((m, i) => i === 0 || hoy.marcas[i - 1].ts >= m.ts);
  assert(ordenado, 'marcas del día ordenadas más reciente primero');
}

console.log('--- fin 01-hoy.mjs ---');
