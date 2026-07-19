// migrate.js — Migración aditiva e idempotente (regla de oro §1.3).
// Ejecutar dos veces = no-op: CREATE ... IF NOT EXISTS + INSERT OR IGNORE.
// Prohibido cualquier DROP/reset/fresh o borrado de ficheros .db.
import { SCHEMA_SQL, TABLAS } from './schema.js';
import { DEFAULT_CONFIG, normalizeConfig } from '../ports.js';

/**
 * Aplica el esquema y siembra los ajustes por defecto (sin sobrescribir los existentes).
 * @param {{exec:Function, prepare:Function}} db
 * @returns {{ok:boolean, tablas:string[]}}
 */
/**
 * Añade una columna si no existe (ADD COLUMN es la única forma aditiva de ampliar una
 * tabla ya creada en despliegues previos; `CREATE TABLE IF NOT EXISTS` no la tocaría).
 * Idempotente: comprueba `pragma_table_info` antes de intentar el ALTER.
 */
function ensureColumn(db, tabla, columna, ddl) {
  // `tabla` es siempre una constante interna (nunca entrada de usuario): interpolación segura.
  const existe = db.prepare(`SELECT 1 FROM pragma_table_info('${tabla}') WHERE name = ?`).get(columna);
  if (!existe) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${ddl}`);
}

/**
 * Siembra/repara el ancla tamper-evidente de auditoría (fix S-02, aditivo).
 * - Instalación limpia: fila semilla (0, 'GENESIS', 0), coherente con una tabla vacía.
 * - Instalación YA EXISTENTE (actualización de un despliegue anterior a este fix, con
 *   historial de auditoría previo): se hace un backfill ÚNICO del ancla a partir de la
 *   última fila real, para que `verificarIntegridad()` arranque en un estado consistente
 *   (no se puede detectar retroactivamente un truncamiento anterior al propio fix, pero
 *   sí se protege cualquier truncamiento a partir de este momento).
 */
function sembrarAnclaAuditoria(db) {
  db.exec("INSERT OR IGNORE INTO presentia_auditoria_ancla (id, ultima_id, ultimo_hash, recuento) VALUES (1, 0, 'GENESIS', 0)");
  const ancla = db.prepare('SELECT * FROM presentia_auditoria_ancla WHERE id = 1').get();
  if (ancla && ancla.recuento === 0 && ancla.ultima_id === 0) {
    const total = db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
    if (total > 0) {
      const ultima = db.prepare('SELECT id, hash FROM presentia_auditoria ORDER BY id DESC LIMIT 1').get();
      db.prepare('UPDATE presentia_auditoria_ancla SET ultima_id = ?, ultimo_hash = ?, recuento = ? WHERE id = 1')
        .run(ultima.id, ultima.hash, total);
    }
  }
}

export function migrate(db) {
  db.exec(SCHEMA_SQL);
  // Aditivo (fix K-01): marca la jornada que quedó abierta y ya NO se reutiliza (turno
  // demasiado antiguo/largo) para que Registros la muestre como "requiere corrección".
  ensureColumn(db, 'presentia_jornadas', 'requiere_correccion', 'requiere_correccion INTEGER NOT NULL DEFAULT 0');
  sembrarAnclaAuditoria(db);
  const insertAjuste = db.prepare('INSERT OR IGNORE INTO presentia_ajustes (clave, valor) VALUES (?, ?)');
  for (const [clave, valor] of Object.entries(DEFAULT_CONFIG)) {
    insertAjuste.run(clave, JSON.stringify(valor));
  }
  return { ok: true, tablas: [...TABLAS] };
}

/**
 * Lee todos los ajustes persistidos y los normaliza contra DEFAULT_CONFIG.
 * @param {{prepare:Function}} db
 * @returns {object} config normalizada
 */
export function leerConfig(db) {
  const filas = db.prepare('SELECT clave, valor FROM presentia_ajustes').all();
  const raw = {};
  for (const f of filas) {
    try { raw[f.clave] = JSON.parse(f.valor); } catch { raw[f.clave] = f.valor; }
  }
  return normalizeConfig(raw);
}

/**
 * Persiste un subconjunto de ajustes (upsert). Sólo claves conocidas (normalizeConfig filtra).
 * @param {{prepare:Function}} db
 * @param {object} parcial
 * @returns {object} config resultante normalizada
 */
export function guardarConfig(db, parcial) {
  const actual = leerConfig(db);
  const fusion = normalizeConfig({ ...actual, ...parcial });
  const upsert = db.prepare(
    'INSERT INTO presentia_ajustes (clave, valor) VALUES (?, ?) ' +
    'ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor'
  );
  for (const [clave, valor] of Object.entries(fusion)) {
    upsert.run(clave, JSON.stringify(valor));
  }
  return fusion;
}

/**
 * Comprueba que existen todas las tablas del módulo (para pruebas de migración).
 * @param {{prepare:Function}} db
 * @returns {boolean}
 */
export function esquemaCompleto(db) {
  const q = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
  return TABLAS.every((t) => !!q.get(t));
}
