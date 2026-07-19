// migration.test.js — La migración es aditiva e idempotente y NO destruye nada
// (regla de oro §1.3): ejecutarla dos veces no rompe ni duplica.
import test from 'node:test';
import assert from 'node:assert/strict';
import { crearReferenceEnv } from '../src/dev/reference-env.js';
import { migrate, esquemaCompleto, leerConfig, guardarConfig } from '../src/db/migrate.js';
import { TABLAS } from '../src/db/schema.js';

test('migrar dos veces es idempotente', () => {
  const env = crearReferenceEnv();
  migrate(env.db);
  assert.ok(esquemaCompleto(env.db), 'todas las tablas existen');
  const c1 = leerConfig(env.db);
  const n1 = env.db.prepare('SELECT COUNT(*) AS n FROM presentia_ajustes').get().n;

  migrate(env.db); // segunda vez
  assert.ok(esquemaCompleto(env.db));
  const c2 = leerConfig(env.db);
  const n2 = env.db.prepare('SELECT COUNT(*) AS n FROM presentia_ajustes').get().n;

  assert.deepEqual(c1, c2);
  assert.equal(n1, n2, 'no se duplican los ajustes');
});

test('migración no borra datos preexistentes', () => {
  const env = crearReferenceEnv();
  migrate(env.db);
  env.db.prepare(
    "INSERT INTO presentia_jornadas (empleado_id, fecha, codigo, estado, creado_ts, actualizado_ts) VALUES ('e1','2026-07-13','F-2026-0001','abierta',0,0)"
  ).run();
  migrate(env.db); // re-migrar no debe tocar la fila
  const n = env.db.prepare('SELECT COUNT(*) AS n FROM presentia_jornadas').get().n;
  assert.equal(n, 1);
});

test('todas las tablas del módulo llevan prefijo presentia_', () => {
  for (const t of TABLAS) assert.ok(t.startsWith('presentia_'), t);
});

test('conservacionAnios nunca baja del mínimo legal (4 años)', () => {
  const env = crearReferenceEnv();
  migrate(env.db);
  const c = guardarConfig(env.db, { conservacionAnios: 1, jornadaEstandarMin: 400 });
  assert.equal(c.conservacionAnios, 4);
  assert.equal(c.jornadaEstandarMin, 400);
});
