// informe.service.js — Pestaña "Informe de horas" (§3): jornadas y horas por
// empleado en un rango (por defecto el mes), con Total del periodo.
import { resumenJornada, formatearDuracion } from '../domain/jornadas.js';
import * as repos from './repos.js';

function nombreEmpleado(deps, id) {
  const e = deps.employees.getById(id);
  return e ? e.nombre : id;
}

/**
 * Informe por empleado en el rango [desde, hasta] (YYYY-MM-DD inclusive).
 * @returns {{desde, hasta, empleados:Array, totalPeriodoMinutos:number, totalPeriodoTexto:string}}
 */
export function informePorEmpleado(deps, { desde, hasta, empleadoId = null } = {}) {
  const jornadas = repos.jornadasEnRango(deps.db, { empleadoId, desde, hasta });
  const porEmp = new Map();
  for (const j of jornadas) {
    const marcas = repos.marcasDeJornada(deps.db, j.id);
    const r = resumenJornada(marcas, deps.config);
    if (!porEmp.has(j.empleado_id)) {
      porEmp.set(j.empleado_id, {
        empleadoId: j.empleado_id, nombre: nombreEmpleado(deps, j.empleado_id),
        jornadas: [], totalMinutos: 0, totalMinutosRedondeados: 0,
      });
    }
    const g = porEmp.get(j.empleado_id);
    g.jornadas.push({
      codigo: j.codigo, fecha: j.fecha, entrada: r.entrada, salida: r.salida,
      minutos: r.minutos, minutosRedondeados: r.minutosRedondeados,
      textoHoras: formatearDuracion(r.minutosRedondeados), enCurso: r.enCurso,
    });
    g.totalMinutos += r.minutos;
    g.totalMinutosRedondeados += r.minutosRedondeados;
  }
  const empleados = [...porEmp.values()]
    .map((g) => ({ ...g, totalTexto: formatearDuracion(g.totalMinutosRedondeados) }))
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
  const totalPeriodoMinutos = empleados.reduce((a, e) => a + e.totalMinutosRedondeados, 0);
  return {
    desde, hasta, empleados,
    totalPeriodoMinutos,
    totalPeriodoTexto: formatearDuracion(totalPeriodoMinutos),
  };
}
