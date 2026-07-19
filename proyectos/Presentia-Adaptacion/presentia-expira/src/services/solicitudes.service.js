// solicitudes.service.js — Pestaña "Solicitudes" (§3). Los olvidos no se arreglan
// con edición libre del empleado: pasan por una solicitud que el admin aprueba o
// rechaza. Aprobar aplica el cambio (conservando el valor original); rechazar no
// cambia nada. Todo auditado.
import { transaccion } from '../db/tx.js';
import { siguienteTipo, ordenCronologicoValido } from '../domain/jornadas.js';
import * as repos from './repos.js';
import * as audit from './audit.service.js';
import { err } from '../errors.js';

function estadoDeMarcas(marcas) {
  return siguienteTipo(marcas) === 'salida' ? 'abierta' : 'cerrada';
}

/** fix A-02 (defensa en profundidad): una solicitud aprobada tampoco puede dejar la
 * jornada con la salida en el mismo instante o antes que su entrada. */
function exigirOrdenCronologico(marcasSimuladas) {
  if (!ordenCronologicoValido(marcasSimuladas)) {
    throw err('ORDEN_INVALIDO', 400, 'entrada/salida en orden cronológico inconsistente',
      'La hora de salida debe ser posterior a la de entrada.');
  }
}

function componer(deps, s) {
  let cambio = {};
  try { cambio = JSON.parse(s.cambio); } catch { /* dato antiguo */ }
  const e = deps.employees.getById(s.empleado_id);
  return {
    id: s.id, empleadoId: s.empleado_id, empleadoNombre: e ? e.nombre : s.empleado_id,
    tipo: s.tipo, jornadaId: s.jornada_id, marcaId: s.marca_id, cambio, motivo: s.motivo,
    estado: s.estado, resueltoPor: s.resuelto_por, resueltoTs: s.resuelto_ts,
    comentario: s.comentario, creadoTs: s.creado_ts,
  };
}

export function solicitudPorId(deps, id) {
  const s = deps.db.prepare('SELECT * FROM presentia_solicitudes WHERE id = ?').get(id);
  return s ? componer(deps, s) : null;
}

/** Crea una solicitud de corrección (empleado). */
export function crear(deps, { empleadoId, cambio, motivo, jornadaId = null, marcaId = null }) {
  if (!motivo || !String(motivo).trim()) throw err('MOTIVO_REQUERIDO', 400, 'motivo vacío', 'El motivo es obligatorio.');
  if (!cambio || typeof cambio !== 'object') throw err('CAMBIO_INVALIDO', 400, 'cambio inválido', 'Solicitud no válida.');
  const now = deps.clock.now();
  const info = deps.db.prepare(
    `INSERT INTO presentia_solicitudes (empleado_id, tipo, jornada_id, marca_id, cambio, motivo, estado, creado_ts)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`
  ).run(empleadoId, 'correccion', jornadaId, marcaId, JSON.stringify(cambio), motivo, now);
  const id = Number(info.lastInsertRowid);
  audit.registrar(deps.db, {
    ts: now, actorId: empleadoId, accion: 'solicitud_creada', entidad: 'solicitud',
    entidadId: id, motivo, detalle: { cambio },
  });
  return solicitudPorId(deps, id);
}

/** Lista solicitudes, opcionalmente filtradas por estado (pendiente/aprobada/rechazada). */
export function listar(deps, { estado = null } = {}) {
  const filas = estado
    ? deps.db.prepare('SELECT * FROM presentia_solicitudes WHERE estado = ? ORDER BY creado_ts DESC, id DESC').all(estado)
    : deps.db.prepare('SELECT * FROM presentia_solicitudes ORDER BY creado_ts DESC, id DESC').all();
  return filas.map((s) => componer(deps, s));
}

export function contarPendientes(deps) {
  return deps.db.prepare("SELECT COUNT(*) AS n FROM presentia_solicitudes WHERE estado = 'pendiente'").get().n;
}

function aplicarCambio(deps, { cambio, motivo, actorId, now, origen }) {
  if (cambio.accion === 'editar') {
    const marca = repos.marcaPorId(deps.db, cambio.marcaId);
    if (!marca) throw err('MARCA_INEXISTENTE', 404, 'marca inexistente', 'La marca no existe.');
    const marcasActuales = repos.marcasDeJornada(deps.db, marca.jornada_id);
    const marcasSimuladas = marcasActuales.map((m) => (m.id === cambio.marcaId ? { ...m, ts: cambio.ts } : m));
    exigirOrdenCronologico(marcasSimuladas);
    repos.versionarMarcaTs(deps.db, { marcaId: cambio.marcaId, tsNuevo: cambio.ts, motivo, autorId: actorId, ts: now });
    const jornada = repos.jornadaPorId(deps.db, marca.jornada_id);
    repos.marcarJornadaEditada(deps.db, jornada.id, now);
    repos.actualizarEstadoJornada(deps.db, jornada.id, estadoDeMarcas(repos.marcasDeJornada(deps.db, jornada.id)), now);
  } else if (cambio.accion === 'anadir') {
    const jornada = repos.jornadaPorId(deps.db, cambio.jornadaId);
    if (!jornada) throw err('JORNADA_INEXISTENTE', 404, 'jornada inexistente', 'La jornada no existe.');
    const marcasActuales = repos.marcasDeJornada(deps.db, cambio.jornadaId);
    exigirOrdenCronologico([...marcasActuales, { tipo: cambio.tipo, ts: cambio.ts }]);
    repos.insertarMarca(deps.db, { jornadaId: cambio.jornadaId, tipo: cambio.tipo, ts: cambio.ts, origen, editado: 1 });
    repos.marcarJornadaEditada(deps.db, cambio.jornadaId, now);
    repos.actualizarEstadoJornada(deps.db, cambio.jornadaId, estadoDeMarcas(repos.marcasDeJornada(deps.db, cambio.jornadaId)), now);
  } else {
    throw err('CAMBIO_INVALIDO', 400, 'acción desconocida', 'Solicitud no válida.');
  }
}

/** fix K-03: nadie resuelve su propia solicitud (separación de funciones). Un admin
 * también puede ser "empleado" en el kiosko (ficha, puede pedir correcciones); si la
 * solicitud es suya, debe resolverla OTRO admin/técnico. */
function exigirNoAutoaprobacion(s, actorId) {
  if (s.empleado_id === actorId) {
    throw err('AUTOAPROBACION_PROHIBIDA', 403, 'un actor no puede resolver su propia solicitud',
      'No puedes aprobar ni rechazar tu propia solicitud.');
  }
}

/** Aprueba: aplica el cambio propuesto y marca la solicitud como aprobada. */
export function aprobar(deps, { solicitudId, actorId, actorRol, comentario = null, origen = 'manager' }) {
  const now = deps.clock.now();
  const s = deps.db.prepare('SELECT * FROM presentia_solicitudes WHERE id = ?').get(solicitudId);
  if (!s) throw err('SOLICITUD_INEXISTENTE', 404, 'inexistente', 'La solicitud no existe.');
  if (s.estado !== 'pendiente') throw err('SOLICITUD_RESUELTA', 409, 'ya resuelta', 'La solicitud ya está resuelta.');
  exigirNoAutoaprobacion(s, actorId);
  let cambio = {};
  try { cambio = JSON.parse(s.cambio); } catch { /* */ }
  return transaccion(deps.db, () => {
    aplicarCambio(deps, { cambio, motivo: s.motivo, actorId, now, origen });
    // fix A-07: el UPDATE exige `estado = 'pendiente'` (defensa en profundidad contra una
    // doble resolución concurrente: si otra petición ya la resolvió entre el SELECT de
    // arriba y este UPDATE, `changes` sale a 0 y se rechaza en vez de aplicar el cambio
    // dos veces silenciosamente).
    const upd = deps.db.prepare(
      "UPDATE presentia_solicitudes SET estado = 'aprobada', resuelto_por = ?, resuelto_ts = ?, comentario = ? WHERE id = ? AND estado = 'pendiente'"
    ).run(actorId, now, comentario, solicitudId);
    if (upd.changes === 0) throw err('SOLICITUD_RESUELTA', 409, 'ya resuelta (concurrencia)', 'La solicitud ya está resuelta.');
    audit.registrar(deps.db, {
      ts: now, actorId, actorRol, accion: 'solicitud_aprobada', entidad: 'solicitud',
      entidadId: solicitudId, motivo: s.motivo, detalle: { cambio, comentario },
    });
    return solicitudPorId(deps, solicitudId);
  });
}

/** Rechaza: no cambia ningún registro; sólo marca la solicitud como rechazada. */
export function rechazar(deps, { solicitudId, actorId, actorRol, comentario = null }) {
  const now = deps.clock.now();
  const s = deps.db.prepare('SELECT * FROM presentia_solicitudes WHERE id = ?').get(solicitudId);
  if (!s) throw err('SOLICITUD_INEXISTENTE', 404, 'inexistente', 'La solicitud no existe.');
  if (s.estado !== 'pendiente') throw err('SOLICITUD_RESUELTA', 409, 'ya resuelta', 'La solicitud ya está resuelta.');
  exigirNoAutoaprobacion(s, actorId);
  // fix A-07: mismo cinturón de seguridad a nivel SQL que en aprobar().
  const upd = deps.db.prepare(
    "UPDATE presentia_solicitudes SET estado = 'rechazada', resuelto_por = ?, resuelto_ts = ?, comentario = ? WHERE id = ? AND estado = 'pendiente'"
  ).run(actorId, now, comentario, solicitudId);
  if (upd.changes === 0) throw err('SOLICITUD_RESUELTA', 409, 'ya resuelta (concurrencia)', 'La solicitud ya está resuelta.');
  audit.registrar(deps.db, {
    ts: now, actorId, actorRol, accion: 'solicitud_rechazada', entidad: 'solicitud',
    entidadId: solicitudId, detalle: { comentario },
  });
  return solicitudPorId(deps, solicitudId);
}
