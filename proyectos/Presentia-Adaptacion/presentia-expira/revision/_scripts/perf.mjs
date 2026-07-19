// perf.mjs — Script de medición DESECHABLE (Fase 4.3, agente rendimiento).
// NO toca el producto: sólo importa src/ y dev/reference-env.js con una BD SQLite
// TEMPORAL propia (fichero en revision/_scripts/, borrado al final). Uso:
//   node revision/_scripts/perf.mjs 5000
//   node revision/_scripts/perf.mjs 50000
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import * as fichaje from '../../src/services/fichaje.service.js';
import * as hoyService from '../../src/services/hoy.service.js';
import * as registros from '../../src/services/registros.service.js';
import * as informe from '../../src/services/informe.service.js';
import * as repos from '../../src/services/repos.js';
import { informeACsv } from '../../src/export/csv.js';
import { informeAPdf } from '../../src/export/pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NUM_JORNADAS = Number(process.argv[2] || 5000);
const EMP_COUNT = 40;
const DB_PATH = path.join(__dirname, `perf-test-${NUM_JORNADAS}.db`);

for (const ext of ['', '-journal', '-wal', '-shm']) {
  const p = DB_PATH + ext;
  if (fs.existsSync(p)) fs.rmSync(p);
}

function ms(n) { return `${n.toFixed(2)} ms`; }

// --- Empleados de prueba (propios, no tocan el seed de referencia) ---------
const empleados = [];
for (let i = 0; i < EMP_COUNT; i++) {
  empleados.push({ id: `emp${i}`, nombre: `Empleado ${i}`, rol: 'empleado', pin: '1234', activo: true });
}

const BASE_TS = Date.UTC(2020, 0, 6, 0, 0, 0); // lunes, 00:00 UTC (ancla del día; las marcas añaden su hora exacta)
const env = crearReferenceEnv({ dbPath: DB_PATH, empleados, now: BASE_TS });
const modulo = crearModulo(env);
const deps = modulo.deps;

// --- Contador de sentencias SQL preparadas (evidencia de N+1) --------------
let contadorPrepare = 0;
const prepareOriginal = deps.db.prepare.bind(deps.db);
function contarPrepare(activar) {
  if (activar) {
    deps.db.prepare = (sql) => { contadorPrepare++; return prepareOriginal(sql); };
  } else {
    deps.db.prepare = prepareOriginal;
  }
}

// ---------------------------------------------------------------------------
// 1) SIEMBRA — jornadasPerEmp jornadas x EMP_COUNT empleados, 4 marcas/jornada
//    (entrada, salida-comer, vuelta, salida), días laborables consecutivos.
//    Se agrupa en UNA transacción externa para no medir fsync x fila (sólo
//    queremos medir LECTURAS calientes; la latencia de escritura real se mide
//    aparte, fuera de la transacción masiva, más abajo).
// ---------------------------------------------------------------------------
const jornadasPorEmpleado = Math.ceil(NUM_JORNADAS / EMP_COUNT);
let diaOffset = 0;
function siguienteDiaLaborable() {
  for (;;) {
    const t = BASE_TS + diaOffset * 86400000;
    diaOffset++;
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) return t;
  }
}

const tSeedInicio = performance.now();
deps.db.exec('BEGIN');
let jornadasCreadas = 0;
diaOffset = 0;
const dias = [];
for (let d = 0; d < jornadasPorEmpleado; d++) dias.push(siguienteDiaLaborable());
for (const diaTs of dias) {
  for (const emp of empleados) {
    if (jornadasCreadas >= NUM_JORNADAS) break;
    const dClock = { now: () => 0 };
    const dRun = { ...deps, clock: dClock };
    const horas = [[8, 0], [13, 0], [14, 0], [17, 0]];
    for (const [h, m] of horas) {
      dClock.now = () => diaTs + h * 3600000 + m * 60000;
      fichaje.fichar(dRun, { empleadoId: emp.id, dispositivo: 'seed', origen: 'manager', pinVerificado: true });
    }
    jornadasCreadas++;
  }
  if (jornadasCreadas >= NUM_JORNADAS) break;
}
deps.db.exec('COMMIT');
const tSeedFin = performance.now();

const totalMarcas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_marcas').get().n;
const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;

console.log(`\n=== VOLUMEN: ${NUM_JORNADAS} jornadas objetivo ===`);
console.log(`Sembradas: ${totalJornadas} jornadas, ${totalMarcas} marcas (BD fichero temporal, 1 transacción externa)`);
console.log(`Tiempo de siembra (bulk, 1 sola transacción): ${ms(tSeedFin - tSeedInicio)}`);

// Fecha "hoy" simulada = el último día sembrado (para el endpoint Hoy).
const ultimoDiaTs = dias[dias.length - 1];
const deps_hoy = { ...deps, clock: { now: () => ultimoDiaTs + 20 * 3600000 } };

const primerDia = '2020-01-06';
const ultimaFecha = new Date(ultimoDiaTs).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// 2) ENDPOINTS CALIENTES — tiempo (ms), varias muestras, mediana.
// ---------------------------------------------------------------------------
function medir(fn, muestras = 5) {
  const tiempos = [];
  let resultado;
  for (let i = 0; i < muestras; i++) {
    const t0 = performance.now();
    resultado = fn();
    tiempos.push(performance.now() - t0);
  }
  tiempos.sort((a, b) => a - b);
  return { medianaMs: tiempos[Math.floor(tiempos.length / 2)], minMs: tiempos[0], maxMs: tiempos[tiempos.length - 1], resultado };
}

const MUESTRAS_GRANDE = NUM_JORNADAS >= 20000 ? 3 : 5;
const MUESTRAS_EXPORT = NUM_JORNADAS >= 20000 ? 1 : 3;
console.log(`\n--- Tiempos de servicio (mediana de ${MUESTRAS_GRANDE} llamadas; export x${MUESTRAS_EXPORT}) ---`);

// Hoy
contarPrepare(true);
const rHoy = medir(() => hoyService.hoy(deps_hoy), MUESTRAS_GRANDE);
const prepHoy = Math.round(contadorPrepare / MUESTRAS_GRANDE); contarPrepare(false); contadorPrepare = 0;
console.log(`Hoy (deps.hoy):                         ${ms(rHoy.medianaMs)}  (min ${ms(rHoy.minMs)}, max ${ms(rHoy.maxMs)})  — marcasHoy=${rHoy.resultado.marcasHoy}, sentencias SQL/llamada=${prepHoy}`);

// Registros — 1 mes (rango estrecho, uso típico)
const desdeMes = ultimaFecha.slice(0, 8) + '01';
contarPrepare(true);
const rRegMes = medir(() => registros.listarJornadas(deps, { desde: desdeMes, hasta: ultimaFecha }), MUESTRAS_GRANDE);
const prepRegMes = Math.round(contadorPrepare / MUESTRAS_GRANDE); contarPrepare(false); contadorPrepare = 0;
console.log(`Registros (1 mes, ${rRegMes.resultado.length} filas):        ${ms(rRegMes.medianaMs)}  (min ${ms(rRegMes.minMs)}, max ${ms(rRegMes.maxMs)})  — sentencias SQL/llamada=${prepRegMes}`);

// Registros — TODO el rango (sin paginar; caso "admin sin filtro estrecho")
contarPrepare(true);
const rRegTodo = medir(() => registros.listarJornadas(deps, { desde: primerDia, hasta: ultimaFecha }), MUESTRAS_EXPORT);
const prepRegTodo = Math.round(contadorPrepare / MUESTRAS_EXPORT); contarPrepare(false); contadorPrepare = 0;
console.log(`Registros (TODO el rango, ${rRegTodo.resultado.length} filas): ${ms(rRegTodo.medianaMs)}  (min ${ms(rRegTodo.minMs)}, max ${ms(rRegTodo.maxMs)})  — sentencias SQL/llamada=${prepRegTodo}`);

// Informe — 1 mes
contarPrepare(true);
const rInfMes = medir(() => informe.informePorEmpleado(deps, { desde: desdeMes, hasta: ultimaFecha }), MUESTRAS_GRANDE);
const prepInfMes = Math.round(contadorPrepare / MUESTRAS_GRANDE); contarPrepare(false); contadorPrepare = 0;
console.log(`Informe (1 mes):                        ${ms(rInfMes.medianaMs)}  (min ${ms(rInfMes.minMs)}, max ${ms(rInfMes.maxMs)})  — sentencias SQL/llamada=${prepInfMes}`);

// Informe — TODO el rango
contarPrepare(true);
const rInfTodo = medir(() => informe.informePorEmpleado(deps, { desde: primerDia, hasta: ultimaFecha }), MUESTRAS_EXPORT);
const prepInfTodo = Math.round(contadorPrepare / MUESTRAS_EXPORT); contarPrepare(false); contadorPrepare = 0;
console.log(`Informe (TODO el rango):                ${ms(rInfTodo.medianaMs)}  (min ${ms(rInfTodo.minMs)}, max ${ms(rInfTodo.maxMs)})  — sentencias SQL/llamada=${prepInfTodo}`);

// Export CSV / PDF sobre el informe de TODO el rango (peor caso realista)
const infParaExport = rInfTodo.resultado;
const rCsv = medir(() => informeACsv(infParaExport, deps.config.zonaHoraria), MUESTRAS_EXPORT);
console.log(`Export CSV (informe TODO el rango):     ${ms(rCsv.medianaMs)}  (min ${ms(rCsv.minMs)}, max ${ms(rCsv.maxMs)})  — ${rCsv.resultado.length} bytes aprox`);

const rPdf = medir(() => informeAPdf(infParaExport, deps.config.zonaHoraria), MUESTRAS_EXPORT);
console.log(`Export PDF (informe TODO el rango):     ${ms(rPdf.medianaMs)}  (min ${ms(rPdf.minMs)}, max ${ms(rPdf.maxMs)})  — ${rPdf.resultado.length} bytes`);

// Informe + su propio export end-to-end (como lo vería el endpoint real)
const rInfCsvE2E = medir(() => {
  const inf = informe.informePorEmpleado(deps, { desde: primerDia, hasta: ultimaFecha });
  return informeACsv(inf, deps.config.zonaHoraria);
}, MUESTRAS_EXPORT);
console.log(`Informe+CSV extremo a extremo (TODO):   ${ms(rInfCsvE2E.medianaMs)}`);

const rInfPdfE2E = medir(() => {
  const inf = informe.informePorEmpleado(deps, { desde: primerDia, hasta: ultimaFecha });
  return informeAPdf(inf, deps.config.zonaHoraria);
}, MUESTRAS_EXPORT);
console.log(`Informe+PDF extremo a extremo (TODO):   ${ms(rInfPdfE2E.medianaMs)}`);

// ---------------------------------------------------------------------------
// 3) EXPLAIN QUERY PLAN — consultas calientes de repos.js
// ---------------------------------------------------------------------------
console.log('\n--- EXPLAIN QUERY PLAN (consultas calientes) ---');
function explain(etiqueta, sql, params = []) {
  const filas = deps.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params);
  const plan = filas.map((f) => f.detail).join(' | ');
  const scan = /SCAN TABLE/i.test(plan) && !/SCAN TABLE .* USING (COVERING )?INDEX/i.test(plan);
  console.log(`${etiqueta}\n  SQL: ${sql}\n  PLAN: ${plan}${scan ? '  <== FULL TABLE SCAN' : ''}`);
}
explain('jornadasDelDia(fecha)', 'SELECT * FROM presentia_jornadas WHERE fecha = ?', [ultimaFecha]);
explain('marcasDeJornada(jornada_id)', 'SELECT * FROM presentia_marcas WHERE jornada_id = ? ORDER BY ts ASC, id ASC', [1]);
explain('jornadasEnRango CON empleadoId', 'SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND fecha >= ? AND fecha <= ? ORDER BY fecha ASC, id ASC', ['emp0', primerDia, ultimaFecha]);
explain('jornadasEnRango SIN empleadoId', 'SELECT * FROM presentia_jornadas WHERE fecha >= ? AND fecha <= ? ORDER BY fecha ASC, id ASC', [primerDia, ultimaFecha]);
explain('jornadaAbiertaReciente(empleado_id)', "SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND estado = 'abierta' ORDER BY fecha DESC, id DESC LIMIT 1", ['emp0']);
explain('jornadaDe(empleado_id, fecha)', 'SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND fecha = ?', ['emp0', ultimaFecha]);
explain('marcaPorId(id)', 'SELECT * FROM presentia_marcas WHERE id = ?', [1]);

// ---------------------------------------------------------------------------
// 4) LATENCIA DE UN FICHAJE AISLADO (fuera de la transacción masiva; refleja
//    el coste real de fsync/commit de SQLite en fichero con la PRAGMA por
//    defecto, tal y como ocurriría en producción, 1 request = 1 commit).
// ---------------------------------------------------------------------------
console.log('\n--- Latencia de un fichaje aislado (autocommit, fsync real de fichero) ---');
const jm = deps.db.prepare('PRAGMA journal_mode').get();
const sy = deps.db.prepare('PRAGMA synchronous').get();
const bt = deps.db.prepare('PRAGMA busy_timeout').get();
console.log(`PRAGMA journal_mode=${jm.journal_mode}  synchronous=${sy.synchronous}  busy_timeout=${bt.timeout}`);

const empNuevo = 'empLatencia';
const empleadosMapExtra = env.empleadosById;
empleadosMapExtra.set(empNuevo, { id: empNuevo, nombre: 'Latencia Test', rol: 'empleado', activo: true, pinHash: null });

const muestrasFichaje = [];
for (let i = 0; i < 10; i++) {
  const t = ultimoDiaTs + 5 * 86400000 + i * 3600000 * 24; // días futuros distintos, evita colisión de jornada
  const dRun = { ...deps, clock: { now: () => t } };
  const t0 = performance.now();
  fichaje.fichar(dRun, { empleadoId: empNuevo, dispositivo: 'latencia', origen: 'kiosk', pinVerificado: true });
  muestrasFichaje.push(performance.now() - t0);
}
muestrasFichaje.sort((a, b) => a - b);
console.log(`fichar() individual x10 — mediana: ${ms(muestrasFichaje[5])}  min: ${ms(muestrasFichaje[0])}  max: ${ms(muestrasFichaje[muestrasFichaje.length - 1])}`);
console.log(`todas las muestras (ms): ${muestrasFichaje.map((x) => x.toFixed(2)).join(', ')}`);

// ---------------------------------------------------------------------------
// 5) Limpieza — se borra el fichero temporal.
// ---------------------------------------------------------------------------
deps.db.close();
for (const ext of ['', '-journal', '-wal', '-shm']) {
  const p = DB_PATH + ext;
  if (fs.existsSync(p)) fs.rmSync(p);
}
console.log('\n(BD temporal borrada)');
