// audit.service.js — Auditoría append-only encadenada por hash (§5.3, §6.4).
// Cada entrada: quién, qué, cuándo, desde dónde, por qué. hash = sha256(prev_hash +
// payload canónico). Alterar o borrar una línea rompe la cadena y lo detecta
// verificarIntegridad(). NUNCA se registran PIN, hashes ni tokens en `detalle`.
import crypto from 'node:crypto';

export const GENESIS = 'GENESIS';

/** Serialización canónica (claves ordenadas, recursiva) para hashing estable. */
function estable(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(estable).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + estable(v[k])).join(',') + '}';
}

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function construirPayload(f) {
  return {
    ts: f.ts,
    actor_id: f.actor_id ?? null,
    actor_rol: f.actor_rol ?? null,
    accion: f.accion,
    entidad: f.entidad ?? null,
    entidad_id: f.entidad_id != null ? String(f.entidad_id) : null,
    detalle: f.detalle ?? null,
    origen: f.origen ?? null,
    motivo: f.motivo ?? null,
  };
}

/** Hash de la última entrada, o GENESIS si la tabla está vacía. */
export function ultimoHash(db) {
  const row = db.prepare('SELECT hash FROM presentia_auditoria ORDER BY id DESC LIMIT 1').get();
  return row ? row.hash : GENESIS;
}

/**
 * Registra un evento de auditoría (append-only, encadenado).
 * @param {object} db
 * @param {{ts:number, actorId?:string, actorRol?:string, accion:string,
 *          entidad?:string, entidadId?:(string|number), detalle?:object,
 *          origen?:string, motivo?:string}} ev
 * @returns {string} hash de la entrada
 */
export function registrar(db, ev) {
  const prev = ultimoHash(db);
  const payload = construirPayload({
    ts: ev.ts, actor_id: ev.actorId, actor_rol: ev.actorRol, accion: ev.accion,
    entidad: ev.entidad, entidad_id: ev.entidadId, detalle: ev.detalle,
    origen: ev.origen, motivo: ev.motivo,
  });
  const hash = sha256(prev + estable(payload));
  const info = db.prepare(
    `INSERT INTO presentia_auditoria
     (ts, actor_id, actor_rol, accion, entidad, entidad_id, detalle, origen, motivo, prev_hash, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    payload.ts, payload.actor_id, payload.actor_rol, payload.accion, payload.entidad,
    payload.entidad_id, payload.detalle != null ? JSON.stringify(payload.detalle) : null,
    payload.origen, payload.motivo, prev, hash
  );
  // fix S-02: actualiza el ANCLA tamper-evidente (última fila real + su hash + recuento
  // contiguo) en cada alta — ver verificarIntegridad() para el porqué (detecta el
  // TRUNCAMIENTO DE COLA, que un hash-chain simple no puede detectar por sí solo).
  db.prepare(
    'UPDATE presentia_auditoria_ancla SET ultima_id = ?, ultimo_hash = ?, recuento = recuento + 1 WHERE id = 1'
  ).run(Number(info.lastInsertRowid), hash);
  return hash;
}

/**
 * Recalcula la cadena y detecta la primera línea alterada/borrada. Además comprueba el
 * ANCLA tamper-evidente (fix S-02) contra la última fila REAL: un hash-chain simple sólo
 * detecta manipulación "en el medio" (cualquier fila con al menos una fila posterior que
 * referencie su hash) pero NO el truncamiento de cola (borrar las últimas filas: no
 * queda ninguna fila posterior que lo delate). El ancla —actualizada en cada
 * `registrar()`— guarda el id/hash de la última fila y el recuento total; si la última
 * fila real o el recuento ya no coinciden con el ancla, se detecta la manipulación.
 * @param {object} db
 * @returns {{ok:boolean, rotoEn:(number|null), total:number}}
 */
export function verificarIntegridad(db) {
  const filas = db.prepare('SELECT * FROM presentia_auditoria ORDER BY id ASC').all();
  let prev = GENESIS;
  for (const f of filas) {
    const payload = construirPayload({
      ts: f.ts, actor_id: f.actor_id, actor_rol: f.actor_rol, accion: f.accion,
      entidad: f.entidad, entidad_id: f.entidad_id,
      detalle: f.detalle != null ? JSON.parse(f.detalle) : null,
      origen: f.origen, motivo: f.motivo,
    });
    const hash = sha256(prev + estable(payload));
    if (f.prev_hash !== prev || f.hash !== hash) {
      return { ok: false, rotoEn: f.id, total: filas.length };
    }
    prev = f.hash;
  }
  const ancla = db.prepare('SELECT * FROM presentia_auditoria_ancla WHERE id = 1').get();
  const ultimaFila = filas[filas.length - 1] || null;
  const ultimaIdReal = ultimaFila ? ultimaFila.id : 0;
  const ultimoHashReal = ultimaFila ? ultimaFila.hash : GENESIS;
  if (!ancla || ancla.ultima_id !== ultimaIdReal || ancla.ultimo_hash !== ultimoHashReal || ancla.recuento !== filas.length) {
    return { ok: false, rotoEn: null, total: filas.length };
  }
  return { ok: true, rotoEn: null, total: filas.length };
}
