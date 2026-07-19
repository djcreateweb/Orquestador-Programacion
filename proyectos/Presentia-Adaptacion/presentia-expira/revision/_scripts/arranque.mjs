// arranque.mjs — Mide el tiempo de arranque del módulo (import + crearModulo,
// que incluye la migración idempotente del esquema) y una aproximación del
// consumo de memoria en reposo del proceso Node que alojaría el módulo.
// Método: process.memoryUsage() antes/después de inicializar; performance.now()
// para el tiempo de import+migrate. CPU en reposo: no hay temporizadores propios
// del módulo (se confirma por lectura de código, ver informe), así que el
// consumo de CPU en reposo del propio módulo es ~0 (sin polling); el resto del
// consumo en reposo de un mini-PC vendría del proceso Node/Fastify/SO en general,
// fuera del alcance de este módulo.
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'perf-arranque.db');
for (const ext of ['', '-journal', '-wal', '-shm']) { const p = DB_PATH + ext; if (fs.existsSync(p)) fs.rmSync(p); }

const tImportInicio = performance.now();
const { crearReferenceEnv } = await import('../../src/dev/reference-env.js');
const { crearModulo } = await import('../../src/index.js');
const tImportFin = performance.now();

if (global.gc) global.gc();
const memAntes = process.memoryUsage();

// OJO: crearReferenceEnv() es SÓLO de dev/test y siembra 4 PIN con scrypt (KDF
// lenta a propósito, §6.1) — coste que en producción NO existe (Expira aporta
// sus propios empleados/PIN ya gestionados). Se mide POR SEPARADO para no
// atribuir ese coste de siembra de dev al arranque real del módulo.
const tEnvInicio = performance.now();
const env = crearReferenceEnv({ dbPath: DB_PATH });
const tEnvFin = performance.now();

const tInitInicio = performance.now();
const modulo = crearModulo(env); // esto SÍ es producción: migrate() (CREATE TABLE IF NOT EXISTS x9 + índices + seed ajustes)
const tInitFin = performance.now();

if (global.gc) global.gc();
const memDespues = process.memoryUsage();

console.log('=== Arranque del módulo Presentia ===');
console.log(`Tiempo de import (ESM, en frío):          ${(tImportFin - tImportInicio).toFixed(2)} ms`);
console.log(`Tiempo crearReferenceEnv (SOLO DEV, 4 PIN scrypt — no existe en producción): ${(tEnvFin - tEnvInicio).toFixed(2)} ms`);
console.log(`Tiempo de crearModulo() (real, incl. migrate): ${(tInitFin - tInitInicio).toFixed(2)} ms`);
console.log(`Tiempo total arranque PRODUCCIÓN (import + crearModulo, sin el coste de dev-env): ${(tImportFin - tImportInicio + tInitFin - tInitInicio).toFixed(2)} ms`);
console.log('\n--- Memoria del proceso (aprox., process.memoryUsage) ---');
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
console.log(`Antes  — rss=${mb(memAntes.rss)} heapUsed=${mb(memAntes.heapUsed)} heapTotal=${mb(memAntes.heapTotal)} external=${mb(memAntes.external)}`);
console.log(`Después— rss=${mb(memDespues.rss)} heapUsed=${mb(memDespues.heapUsed)} heapTotal=${mb(memDespues.heapTotal)} external=${mb(memDespues.external)}`);
console.log(`Delta heapUsed por crearModulo(): ${mb(memDespues.heapUsed - memAntes.heapUsed)}`);

// Repetimos migrate() para confirmar idempotencia y medir el coste de una
// migración "no-op" (Expira podría llamarla en cada arranque del host).
const { migrate } = await import('../../src/db/migrate.js');
const t2 = performance.now();
migrate(env.db);
const t3 = performance.now();
console.log(`\nSegunda llamada a migrate() (no-op, ya migrado): ${(t3 - t2).toFixed(2)} ms`);

env.db.close();
for (const ext of ['', '-journal', '-wal', '-shm']) { const p = DB_PATH + ext; if (fs.existsSync(p)) fs.rmSync(p); }
console.log('\n(BD temporal de arranque borrada)');
