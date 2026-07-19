// child-writer-a.mjs — Proceso hijo A: abre el FICHERO sqlite compartido, toma el
// candado de escritura (BEGIN IMMEDIATE) y lo retiene ~400ms (simula una operación
// de escritura larga: p.ej. fichar() + auditoría en un fichero con más carga de la
// habitual), para forzar una ventana de contención con el proceso B.
import { DatabaseSync } from 'node:sqlite';
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
const t0 = Date.now();
try {
  db.exec('BEGIN IMMEDIATE');
  console.log(`[A] candado de escritura tomado a +${Date.now() - t0}ms`);
  const fin = Date.now() + 400;
  while (Date.now() < fin) { /* espera activa: retiene el candado de escritura */ }
  db.prepare('INSERT INTO presentia_correlativos (serie, anio, ultimo) VALUES (?, ?, ?)').run('CONCTEST', 9001, 1);
  db.exec('COMMIT');
  console.log(`[A] commit OK a +${Date.now() - t0}ms`);
} catch (e) {
  console.log(`[A] ERROR: ${e.code || ''} ${e.message}`);
} finally {
  db.close();
}
