// tx.js — Transacción anidable vía SAVEPOINT. Segura incluso si Expira ya tiene
// una transacción abierta en el mismo handle (no usa BEGIN/COMMIT globales).
let contador = 0;

/**
 * Ejecuta `fn` dentro de un SAVEPOINT; hace ROLLBACK ante excepción.
 * @template T
 * @param {{exec:Function}} db
 * @param {() => T} fn
 * @returns {T}
 */
export function transaccion(db, fn) {
  const nombre = `presentia_sp_${++contador}`;
  db.exec(`SAVEPOINT ${nombre}`);
  try {
    const r = fn();
    db.exec(`RELEASE ${nombre}`);
    return r;
  } catch (e) {
    db.exec(`ROLLBACK TO ${nombre}`);
    db.exec(`RELEASE ${nombre}`);
    throw e;
  }
}
