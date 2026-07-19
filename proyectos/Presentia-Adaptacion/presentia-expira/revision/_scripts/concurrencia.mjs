// concurrencia.mjs — Prueba de concurrencia DESECHABLE (Fase 4.3).
// 1) "Varias tablets fichando casi a la vez" DENTRO del mismo proceso Node: como
//    node:sqlite es síncrono, demuestra que las peticiones se SERIALIZAN en el
//    hilo único (no hay carrera de datos, pero tampoco paralelismo real).
// 2) Contención REAL entre DOS PROCESOS distintos escribiendo al MISMO fichero
//    sqlite (simula, p.ej., el Manager y un proceso de mantenimiento, o varios
//    workers) para comprobar si hay busy_timeout configurado.
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import * as fichaje from '../../src/services/fichaje.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'perf-concurrencia.db');
for (const ext of ['', '-journal', '-wal', '-shm']) { const p = DB_PATH + ext; if (fs.existsSync(p)) fs.rmSync(p); }

const empleados = [];
for (let i = 0; i < 10; i++) empleados.push({ id: `emp${i}`, nombre: `Empleado ${i}`, rol: 'empleado', pin: '1234', activo: true });

const NOW0 = Date.UTC(2020, 0, 6, 8, 0, 0);
const env = crearReferenceEnv({ dbPath: DB_PATH, empleados, now: NOW0 });
const modulo = crearModulo(env);
const deps = modulo.deps;

console.log('=== 1) "Tablets" simultáneas dentro del MISMO proceso (10 empleados fichando "a la vez") ===');
const t0 = performance.now();
const promesas = empleados.map((e, i) => new Promise((resolve) => {
  setImmediate(() => {
    const tA = performance.now();
    const d = { ...deps, clock: { now: () => NOW0 + i } }; // ts ligeramente distintos, mismo instante lógico
    let error = null;
    try { fichaje.fichar(d, { empleadoId: e.id, dispositivo: `tablet-${i}`, origen: 'kiosk', pinVerificado: true }); }
    catch (err) { error = err.message; }
    resolve({ empleado: e.id, ms: performance.now() - tA, error });
  });
}));
const resultados = await Promise.all(promesas);
const tTotal = performance.now() - t0;
for (const r of resultados) console.log(`  ${r.empleado}: ${r.ms.toFixed(2)} ms ${r.error ? '(ERROR: ' + r.error + ')' : ''}`);
console.log(`  Tiempo TOTAL de las 10 "simultáneas": ${tTotal.toFixed(2)} ms   (suma individual: ${resultados.reduce((a, r) => a + r.ms, 0).toFixed(2)} ms)`);
console.log('  Interpretación: node:sqlite (DatabaseSync) es SÍNCRONO y bloqueante; en un único proceso Node');
console.log('  las peticiones "simultáneas" en realidad se SERIALIZAN en el hilo del event loop (sin carrera de');
console.log('  datos, pero cada escritura bloquea el hilo — y por tanto a las demás peticiones — mientras dura).');

deps.db.close();

console.log('\n=== 2) Contención REAL entre DOS PROCESOS sobre el MISMO fichero SQLite ===');
const jm = new DatabaseSync(DB_PATH);
console.log(`PRAGMA busy_timeout por defecto: ${jm.prepare('PRAGMA busy_timeout').get().timeout} ms  (0 = sin espera; SQLITE_BUSY inmediato si hay candado)`);
console.log(`PRAGMA journal_mode: ${jm.prepare('PRAGMA journal_mode').get().journal_mode}  (no es WAL; el escritor bloquea a otros lectores/escritores)`);
jm.close();

function lanzar(script, args) {
  return new Promise((resolve) => {
    const out = [];
    const p = spawn(process.execPath, [script, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', (d) => out.push(d.toString()));
    p.stderr.on('data', (d) => out.push('[stderr] ' + d.toString()));
    p.on('close', () => resolve(out.join('')));
  });
}

const [outA, outB] = await Promise.all([
  lanzar(path.join(__dirname, 'child-writer-a.mjs'), [DB_PATH]),
  lanzar(path.join(__dirname, 'child-writer-b.mjs'), [DB_PATH]),
]);
console.log(outA.trim());
console.log(outB.trim());

for (const ext of ['', '-journal', '-wal', '-shm']) { const p = DB_PATH + ext; if (fs.existsSync(p)) fs.rmSync(p); }
console.log('\n(BD temporal de concurrencia borrada)');
