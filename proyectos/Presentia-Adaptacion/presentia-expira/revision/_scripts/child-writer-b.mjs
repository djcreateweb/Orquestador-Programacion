// child-writer-b.mjs — Proceso hijo B: espera un instante corto (para caer DENTRO
// de la ventana en la que A tiene el candado de escritura) y luego intenta escribir
// en el MISMO fichero sqlite. Con busy_timeout=0 (valor por defecto de node:sqlite
// si nadie lo configura) esto debe fallar EN EL ACTO con SQLITE_BUSY en vez de
// esperar/reintentar.
import { DatabaseSync } from 'node:sqlite';
const dbPath = process.argv[2];
const t0 = Date.now();
const fin = Date.now() + 150; // cae dentro de la ventana de 400ms de A
while (Date.now() < fin) { /* espera activa */ }
const db = new DatabaseSync(dbPath);
try {
  db.exec('BEGIN IMMEDIATE');
  db.prepare('INSERT INTO presentia_correlativos (serie, anio, ultimo) VALUES (?, ?, ?)').run('CONCTEST', 9002, 1);
  db.exec('COMMIT');
  console.log(`[B] commit OK a +${Date.now() - t0}ms (sin contención detectada)`);
} catch (e) {
  console.log(`[B] BLOQUEADO a +${Date.now() - t0}ms — ${e.code || ''} ${e.message}`);
} finally {
  db.close();
}
