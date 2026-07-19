// csv.js — Exportación CSV (§5.3). UTF-8 con BOM y separador ';' (Excel es-ES).
// Nunca incluye PIN/hash/token (§6.1): sólo datos de jornada.
import { formatearHora, formatearFechaHora } from '../domain/time.js';
import { formatearDuracion } from '../domain/jornadas.js';

// Neutraliza la inyección de fórmulas (CSV injection, OWASP): una celda que empieza
// por = + - @ (o TAB/CR) sería interpretada como fórmula por Excel/LibreOffice. Se
// antepone un apóstrofo para forzar su lectura como texto. (§6.5 defensa en profundidad.)
function neutralizarFormula(s) {
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function esc(v) {
  const s = neutralizarFormula(v == null ? '' : String(v));
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Construye un CSV a partir de cabeceras y filas (arrays). */
export function toCSV(headers, rows) {
  const lineas = [headers.map(esc).join(';')];
  for (const r of rows) lineas.push(r.map(esc).join(';'));
  return '﻿' + lineas.join('\r\n');
}

/** Informe de horas → CSV (una fila por jornada, con totales por empleado). */
export function informeACsv(informe, tz) {
  const headers = ['Empleado', 'Código', 'Fecha', 'Entrada', 'Salida', 'Horas'];
  const rows = [];
  for (const emp of informe.empleados) {
    for (const j of emp.jornadas) {
      rows.push([
        emp.nombre, j.codigo, j.fecha,
        j.entrada != null ? formatearHora(j.entrada, tz) : '',
        j.salida != null ? formatearHora(j.salida, tz) : (j.enCurso ? 'en curso' : ''),
        j.textoHoras,
      ]);
    }
    rows.push([`TOTAL ${emp.nombre}`, '', '', '', '', emp.totalTexto]);
  }
  rows.push(['TOTAL DEL PERIODO', '', '', '', '', informe.totalPeriodoTexto]);
  return toCSV(headers, rows);
}

/** Registros (jornadas) → CSV. */
export function registrosACsv(jornadas, tz) {
  const headers = ['Empleado', 'Fecha', 'Entrada', 'Salida', 'Código', 'Horas', 'Editado'];
  const rows = jornadas.map((j) => [
    j.empleadoNombre, j.fecha,
    j.entrada != null ? formatearHora(j.entrada, tz) : '',
    j.salida != null ? formatearHora(j.salida, tz) : (j.enCurso ? 'en curso' : ''),
    j.codigo, formatearDuracion(j.minutosRedondeados), j.editado ? 'sí' : '',
  ]);
  return toCSV(headers, rows);
}
