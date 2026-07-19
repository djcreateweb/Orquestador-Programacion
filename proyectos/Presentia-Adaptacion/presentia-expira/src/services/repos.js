// repos.js — Acceso a datos del módulo (jornadas, marcas, versiones). Consultas
// parametrizadas (cero SQL concatenado con entrada de usuario, §6.5).

export function jornadaDe(db, empleadoId, fecha) {
  return db.prepare('SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND fecha = ?').get(empleadoId, fecha) ?? null;
}

export function jornadaPorId(db, id) {
  return db.prepare('SELECT * FROM presentia_jornadas WHERE id = ?').get(id) ?? null;
}

export function jornadaPorCodigo(db, codigo) {
  return db.prepare('SELECT * FROM presentia_jornadas WHERE codigo = ?').get(codigo) ?? null;
}

export function marcasDeJornada(db, jornadaId) {
  return db.prepare('SELECT * FROM presentia_marcas WHERE jornada_id = ? ORDER BY ts ASC, id ASC').all(jornadaId);
}

export function marcaPorId(db, id) {
  return db.prepare('SELECT * FROM presentia_marcas WHERE id = ?').get(id) ?? null;
}

export function crearJornada(db, { empleadoId, fecha, codigo, estado = 'abierta', ts }) {
  const info = db.prepare(
    `INSERT INTO presentia_jornadas (empleado_id, fecha, codigo, estado, editado, creado_ts, actualizado_ts)
     VALUES (?, ?, ?, ?, 0, ?, ?)`
  ).run(empleadoId, fecha, codigo, estado, ts, ts);
  return jornadaPorId(db, Number(info.lastInsertRowid));
}

export function insertarMarca(db, { jornadaId, tipo, ts, origen = null, dispositivo = null, editado = 0 }) {
  const info = db.prepare(
    `INSERT INTO presentia_marcas (jornada_id, tipo, ts, origen, dispositivo, editado, creado_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(jornadaId, tipo, ts, origen, dispositivo, editado, ts);
  return marcaPorId(db, Number(info.lastInsertRowid));
}

export function actualizarEstadoJornada(db, jornadaId, estado, ts) {
  db.prepare('UPDATE presentia_jornadas SET estado = ?, actualizado_ts = ? WHERE id = ?').run(estado, ts, jornadaId);
}

export function marcarJornadaEditada(db, jornadaId, ts) {
  db.prepare('UPDATE presentia_jornadas SET editado = 1, actualizado_ts = ? WHERE id = ?').run(ts, jornadaId);
}

/**
 * Marca una jornada abierta como "requiere corrección" (fix K-01): se abandonó porque su
 * entrada es de un día de jornada distinto al actual o superó `maxDuracionJornadaMin`, así
 * que NO se cierra con la hora de la fichada actual. Queda 'abierta' (sigue faltando la
 * salida real) pero señalizada para que el admin la revise en Registros.
 */
export function marcarJornadaRequiereCorreccion(db, jornadaId, ts) {
  db.prepare('UPDATE presentia_jornadas SET requiere_correccion = 1, actualizado_ts = ? WHERE id = ?').run(ts, jornadaId);
}

/** Última marca (cualquier tipo/jornada) del empleado, para la guardia anti-doble-toque (K-04). */
export function ultimaMarcaEmpleado(db, empleadoId) {
  return db.prepare(
    `SELECT m.* FROM presentia_marcas m
     JOIN presentia_jornadas j ON j.id = m.jornada_id
     WHERE j.empleado_id = ?
     ORDER BY m.ts DESC, m.id DESC LIMIT 1`
  ).get(empleadoId) ?? null;
}

/**
 * Cambia el ts de una marca conservando el valor ORIGINAL en presentia_marca_versiones
 * (append-only). Nunca se pierde el dato anterior (§5.3, §6.4).
 */
export function versionarMarcaTs(db, { marcaId, tsNuevo, motivo, autorId, ts }) {
  const marca = marcaPorId(db, marcaId);
  if (!marca) throw new Error('marca inexistente');
  db.prepare(
    `INSERT INTO presentia_marca_versiones (marca_id, campo, valor_anterior, valor_nuevo, motivo, autor_id, ts)
     VALUES (?, 'ts', ?, ?, ?, ?, ?)`
  ).run(marcaId, String(marca.ts), String(tsNuevo), motivo, autorId, ts);
  db.prepare('UPDATE presentia_marcas SET ts = ?, editado = 1 WHERE id = ?').run(tsNuevo, marcaId);
  return marcaPorId(db, marcaId);
}

export function versionesDeMarca(db, marcaId) {
  return db.prepare('SELECT * FROM presentia_marca_versiones WHERE marca_id = ? ORDER BY id ASC').all(marcaId);
}

/** Jornadas en un rango de fechas (YYYY-MM-DD, inclusivo), opcionalmente por empleado. */
export function jornadasEnRango(db, { empleadoId = null, desde, hasta }) {
  if (empleadoId) {
    return db.prepare(
      'SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND fecha >= ? AND fecha <= ? ORDER BY fecha ASC, id ASC'
    ).all(empleadoId, desde, hasta);
  }
  return db.prepare(
    'SELECT * FROM presentia_jornadas WHERE fecha >= ? AND fecha <= ? ORDER BY fecha ASC, id ASC'
  ).all(desde, hasta);
}

export function jornadasDelDia(db, fecha) {
  return db.prepare('SELECT * FROM presentia_jornadas WHERE fecha = ? ORDER BY id ASC').all(fecha);
}

/**
 * Jornada ABIERTA más reciente del empleado (estado 'abierta' ⇒ última marca = entrada).
 * Base para cerrar correctamente turnos que cruzan medianoche (la salida llega otro día).
 */
export function jornadaAbiertaReciente(db, empleadoId) {
  return db.prepare(
    "SELECT * FROM presentia_jornadas WHERE empleado_id = ? AND estado = 'abierta' ORDER BY fecha DESC, id DESC LIMIT 1"
  ).get(empleadoId) ?? null;
}
