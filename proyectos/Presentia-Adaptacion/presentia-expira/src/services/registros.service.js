// registros.service.js — Pestaña "Registros" (§3): una fila por jornada, edición
// directa del admin (versionada + auditada, conserva el valor original) y "añadir marca".
import { resumenJornada, siguienteTipo, ordenCronologicoValido } from '../domain/jornadas.js';
import { fechaJornada, anioDe } from '../domain/time.js';
import { crearCorrelativosDb } from '../domain/correlativo.js';
import { transaccion } from '../db/tx.js';
import * as repos from './repos.js';
import * as audit from './audit.service.js';
import { err } from '../errors.js';

function nombreEmpleado(deps, id) {
  const e = deps.employees.getById(id);
  return e ? e.nombre : id;
}

function estadoDeMarcas(marcas) {
  return siguienteTipo(marcas) === 'salida' ? 'abierta' : 'cerrada';
}

/**
 * Valida el orden cronológico de la jornada TRAS aplicar un cambio propuesto (fix A-02),
 * antes de escribir nada en BD. Lanza un error claro si alguna entrada quedaría en el
 * mismo instante o después que su salida emparejada.
 * @param {Array} marcasSimuladas marcas de la jornada ya con el cambio aplicado (in-memory)
 */
function exigirOrdenCronologico(marcasSimuladas) {
  if (!ordenCronologicoValido(marcasSimuladas)) {
    throw err('ORDEN_INVALIDO', 400, 'entrada/salida en orden cronológico inconsistente',
      'La hora de salida debe ser posterior a la de entrada.');
  }
}

/** Convierte una fila de jornada + sus marcas en el resumen que consume la UI. */
export function componerJornada(deps, jornada) {
  const marcas = repos.marcasDeJornada(deps.db, jornada.id);
  const r = resumenJornada(marcas, deps.config);
  return {
    id: jornada.id,
    codigo: jornada.codigo,
    empleadoId: jornada.empleado_id,
    empleadoNombre: nombreEmpleado(deps, jornada.empleado_id),
    fecha: jornada.fecha,
    entrada: r.entrada,
    salida: r.salida,
    minutos: r.minutos,
    minutosRedondeados: r.minutosRedondeados,
    enCurso: r.enCurso,
    editado: jornada.editado === 1,
    requiereCorreccion: jornada.requiere_correccion === 1, // fix K-01: jornada abandonada, sin salida real
    marcas: marcas.map((m) => ({ id: m.id, tipo: m.tipo, ts: m.ts, editado: m.editado === 1 })),
  };
}

/** Lista de jornadas en un rango (Registros). */
export function listarJornadas(deps, { desde, hasta, empleadoId = null } = {}) {
  const filas = repos.jornadasEnRango(deps.db, { empleadoId, desde, hasta });
  return filas.map((j) => componerJornada(deps, j));
}

/** Edita el ts de una marca (acción de admin). Motivo obligatorio; conserva el original. */
export function editarMarca(deps, { marcaId, tsNuevo, motivo, actorId, actorRol, origen = 'manager' }) {
  if (!motivo || !String(motivo).trim()) throw err('MOTIVO_REQUERIDO', 400, 'motivo vacío', 'El motivo es obligatorio.');
  if (!Number.isFinite(tsNuevo)) throw err('TS_INVALIDO', 400, 'ts inválido', 'Fecha/hora no válida.');
  const marca = repos.marcaPorId(deps.db, marcaId);
  if (!marca) throw err('MARCA_INEXISTENTE', 404, 'marca inexistente', 'La marca no existe.');

  // fix A-02: simula el cambio ANTES de escribir nada y rechaza si deja un segmento con
  // la salida en el mismo instante o antes que su entrada (orden cronológico inconsistente).
  const marcasActuales = repos.marcasDeJornada(deps.db, marca.jornada_id);
  const marcasSimuladas = marcasActuales.map((m) => (m.id === marcaId ? { ...m, ts: tsNuevo } : m));
  exigirOrdenCronologico(marcasSimuladas);

  const now = deps.clock.now();
  return transaccion(deps.db, () => {
    const tsAnterior = marca.ts;
    repos.versionarMarcaTs(deps.db, { marcaId, tsNuevo, motivo, autorId: actorId, ts: now });
    const jornada = repos.jornadaPorId(deps.db, marca.jornada_id);
    repos.marcarJornadaEditada(deps.db, jornada.id, now);
    const marcas = repos.marcasDeJornada(deps.db, jornada.id);
    repos.actualizarEstadoJornada(deps.db, jornada.id, estadoDeMarcas(marcas), now);
    audit.registrar(deps.db, {
      ts: now, actorId, actorRol, accion: 'marca_editada', entidad: 'marca', entidadId: marcaId,
      origen, motivo, detalle: { tsAnterior, tsNuevo, jornadaId: jornada.id },
    });
    return componerJornada(deps, repos.jornadaPorId(deps.db, jornada.id));
  });
}

/** Añade una marca a una jornada (acción de admin). Motivo obligatorio; auditado. */
export function anadirMarca(deps, { jornadaId, tipo, ts, motivo, actorId, actorRol, origen = 'manager' }) {
  if (tipo !== 'entrada' && tipo !== 'salida') throw err('TIPO_INVALIDO', 400, 'tipo inválido', 'Tipo de marca no válido.');
  if (!Number.isFinite(ts)) throw err('TS_INVALIDO', 400, 'ts inválido', 'Fecha/hora no válida.');
  if (!motivo || !String(motivo).trim()) throw err('MOTIVO_REQUERIDO', 400, 'motivo vacío', 'El motivo es obligatorio.');
  const jornada = repos.jornadaPorId(deps.db, jornadaId);
  if (!jornada) throw err('JORNADA_INEXISTENTE', 404, 'jornada inexistente', 'La jornada no existe.');

  // fix A-02: idem editarMarca, pero simulando una marca NUEVA añadida a las existentes.
  const marcasActuales = repos.marcasDeJornada(deps.db, jornadaId);
  exigirOrdenCronologico([...marcasActuales, { tipo, ts }]);

  const now = deps.clock.now();
  return transaccion(deps.db, () => {
    const marca = repos.insertarMarca(deps.db, { jornadaId, tipo, ts, origen, dispositivo: null, editado: 1 });
    repos.marcarJornadaEditada(deps.db, jornadaId, now);
    const marcas = repos.marcasDeJornada(deps.db, jornadaId);
    repos.actualizarEstadoJornada(deps.db, jornadaId, estadoDeMarcas(marcas), now);
    audit.registrar(deps.db, {
      ts: now, actorId, actorRol, accion: 'marca_anadida', entidad: 'marca', entidadId: marca.id,
      origen, motivo, detalle: { tipo, ts, jornadaId },
    });
    return componerJornada(deps, repos.jornadaPorId(deps.db, jornadaId));
  });
}

/**
 * Crea una jornada COMPLETA (entrada + salida) desde cero para un empleado/fecha que no
 * tiene NINGUNA marca (fix A-04: día completamente olvidado). `anadirMarca` no sirve
 * aquí porque exige una `jornadaId` ya existente; esta función crea la jornada (con su
 * correlativo) y sus dos marcas en la misma transacción. Motivo obligatorio; auditado;
 * la jornada queda marcada como `editado` desde su creación (es 100% una corrección manual).
 */
export function crearJornadaCompleta(deps, { empleadoId, entrada, salida, motivo, actorId, actorRol, origen = 'manager' }) {
  if (!motivo || !String(motivo).trim()) throw err('MOTIVO_REQUERIDO', 400, 'motivo vacío', 'El motivo es obligatorio.');
  if (!empleadoId) throw err('EMPLEADO_REQUERIDO', 400, 'falta empleadoId', 'Falta el empleado.');
  if (!Number.isFinite(entrada) || !Number.isFinite(salida)) throw err('TS_INVALIDO', 400, 'ts inválido', 'Fecha/hora no válida.');
  exigirOrdenCronologico([{ tipo: 'entrada', ts: entrada }, { tipo: 'salida', ts: salida }]);

  const emp = deps.employees.getById(empleadoId);
  if (!emp) throw err('EMPLEADO_INVALIDO', 404, 'empleado inexistente', 'El empleado no existe.');

  // La fecha de jornada se DERIVA de la entrada (misma regla que `fichar`, fuente única
  // de verdad): el admin no puede introducir una fecha inconsistente con la hora que teclea.
  const fecha = fechaJornada(entrada, deps.config.zonaHoraria);
  const existente = repos.jornadaDe(deps.db, empleadoId, fecha);
  if (existente) {
    throw err('JORNADA_YA_EXISTE', 409, 'ya existe una jornada para ese empleado/fecha',
      'Ya existe una jornada ese día; usa «Añadir marca» sobre ella.');
  }

  const now = deps.clock.now();
  const correl = deps.correlatives || crearCorrelativosDb(deps.db);
  return transaccion(deps.db, () => {
    const codigo = correl.next(deps.config.serieCorrelativo, anioDe(entrada, deps.config.zonaHoraria));
    const jornada = repos.crearJornada(deps.db, { empleadoId, fecha, codigo, estado: 'cerrada', ts: now });
    const mEntrada = repos.insertarMarca(deps.db, { jornadaId: jornada.id, tipo: 'entrada', ts: entrada, origen, dispositivo: null, editado: 1 });
    const mSalida = repos.insertarMarca(deps.db, { jornadaId: jornada.id, tipo: 'salida', ts: salida, origen, dispositivo: null, editado: 1 });
    repos.marcarJornadaEditada(deps.db, jornada.id, now);
    audit.registrar(deps.db, {
      ts: now, actorId, actorRol, accion: 'jornada_creada_manual', entidad: 'jornada', entidadId: jornada.id,
      origen, motivo, detalle: { empleadoId, fecha, entrada, salida, marcaEntradaId: mEntrada.id, marcaSalidaId: mSalida.id },
    });
    return componerJornada(deps, repos.jornadaPorId(deps.db, jornada.id));
  });
}
