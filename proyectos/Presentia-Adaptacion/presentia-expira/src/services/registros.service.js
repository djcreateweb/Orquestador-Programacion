// registros.service.js — Pestaña "Registros" (§3): una fila por jornada, edición
// directa del admin (versionada + auditada, conserva el valor original) y "añadir marca".
import { resumenJornada, siguienteTipo } from '../domain/jornadas.js';
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
