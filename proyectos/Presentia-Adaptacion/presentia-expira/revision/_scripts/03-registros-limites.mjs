// 03-registros-limites.mjs — Casos límite de Registros: orden cronológico tras editar,
// y rendimiento con miles de jornadas.
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

// --- Caso: editar la ENTRADA para que quede DESPUÉS de la salida (admin se equivoca) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // entrada
  env.reloj.avanzar(4 * 3600 * 1000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } })); // salida (4h después)

  // Editar la ENTRADA para que quede 1h DESPUÉS de la salida real (inversión horaria)
  const tsInvertido = f2.ts + 3600000;
  const resultado = manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f1.marcaId, tsNuevo: tsInvertido, motivo: 'QA: forzar inversión' } }));
  console.log('INFO: jornada tras inversión horaria (entrada > salida):', JSON.stringify({ entrada: resultado.entrada, salida: resultado.salida, minutos: resultado.minutos, enCurso: resultado.enCurso }));
  // La lógica de dominio (minutosTrabajados) descarta el segmento si salida <= entrada (no resta, pero tampoco sobra)
  assert(resultado.minutos === 0, `minutos=0 cuando la entrada editada queda DESPUÉS de la salida (obtenido ${resultado.minutos}) — no hay validación de coherencia cronológica al editar`);
  assert(!(resultado.minutos < 0), 'nunca da minutos NEGATIVOS (el dominio filtra salida>entrada), aunque el admin no recibe ningún aviso de incoherencia');
}

// --- Rendimiento: ~5000 jornadas (miles de registros) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const N = 5000;
  const t0 = Date.now();
  const insertJornada = deps.db.prepare(
    `INSERT INTO presentia_jornadas (empleado_id, fecha, codigo, estado, editado, creado_ts, actualizado_ts)
     VALUES (?, ?, ?, 'cerrada', 0, ?, ?)`
  );
  const insertMarca = deps.db.prepare(
    `INSERT INTO presentia_marcas (jornada_id, tipo, ts, origen, dispositivo, editado, creado_ts)
     VALUES (?, ?, ?, 'seed', NULL, 0, ?)`
  );
  const empleados = ['e1', 'e2', 'a1', 't1'];
  const base = Date.UTC(2020, 0, 1, 8, 0, 0);
  for (let i = 0; i < N; i++) {
    const dia = new Date(base + i * 86400000);
    const fecha = dia.toISOString().slice(0, 10);
    const emp = empleados[i % empleados.length];
    const codigo = `F-TEST-${String(i).padStart(6, '0')}`;
    const tsEntrada = dia.getTime();
    const tsSalida = tsEntrada + 8 * 3600 * 1000;
    const info = insertJornada.run(emp, fecha, codigo, tsEntrada, tsEntrada);
    const jid = Number(info.lastInsertRowid);
    insertMarca.run(jid, 'entrada', tsEntrada, tsEntrada);
    insertMarca.run(jid, 'salida', tsSalida, tsSalida);
  }
  const t1 = Date.now();
  console.log(`INFO: seed de ${N} jornadas en ${t1 - t0} ms`);

  const tR0 = Date.now();
  const filas = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2020-01-01', hasta: '2033-12-31' } }));
  const tR1 = Date.now();
  console.log(`INFO: manager.registros() sobre ${filas.length} jornadas tardó ${tR1 - tR0} ms`);
  assert(filas.length === N, `todas las ${N} jornadas se listan correctamente (obtenido ${filas.length})`);
  assert((tR1 - tR0) < 5000, `tiempo de respuesta razonable (<5s) con ${N} jornadas (obtenido ${tR1 - tR0} ms)`);

  const tI0 = Date.now();
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2020-01-01', hasta: '2033-12-31' } }));
  const tI1 = Date.now();
  console.log(`INFO: manager.informe() sobre ${N} jornadas tardó ${tI1 - tI0} ms; total=${inf.totalPeriodoTexto}`);
  assert((tI1 - tI0) < 8000, `informe con ${N} jornadas responde en tiempo razonable (obtenido ${tI1 - tI0} ms)`);
}

console.log('--- fin 03-registros-limites.mjs ---');
