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
export function migrate(db) {
  db.exec(SCHEMA_SQL);
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
