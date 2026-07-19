// pdf.js — Exportación PDF sin dependencias (§5.3). Generador mínimo de PDF de
// texto (Helvetica, WinAnsiEncoding) con paginación. En integración real puede
// delegarse en el puerto printing.renderPdf de Expira; esto es el fallback autónomo.
import { formatearHora } from '../domain/time.js';

const W = 595, H = 842, MARGIN_X = 50, TOP = 800, LEAD = 14, POR_PAGINA = 50;

function escapePdf(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
}

/**
 * Genera un PDF de texto multipágina a partir de líneas.
 * @param {string} titulo
 * @param {string[]} lineas
 * @returns {Buffer}
 */
export function pdfDesdeLineas(titulo, lineas) {
  const contenido = [titulo, ''].concat(lineas);
  const paginas = [];
  for (let i = 0; i < contenido.length; i += POR_PAGINA) paginas.push(contenido.slice(i, i + POR_PAGINA));
  if (!paginas.length) paginas.push([titulo]);

  const CATALOG = 1, PAGES = 2, FONT = 3;
  const pageNums = [], contentNums = [];
  let n = 4;
  for (let i = 0; i < paginas.length; i++) { pageNums.push(n++); contentNums.push(n++); }
  const total = n - 1;

  const offsets = [];
  let out = Buffer.from('%PDF-1.4\n', 'latin1');
  const push = (num, body) => {
    offsets[num] = out.length;
    out = Buffer.concat([out, Buffer.from(`${num} 0 obj\n${body}\nendobj\n`, 'latin1')]);
  };

  push(CATALOG, `<< /Type /Catalog /Pages ${PAGES} 0 R >>`);
  push(PAGES, `<< /Type /Pages /Kids [${pageNums.map((p) => `${p} 0 R`).join(' ')}] /Count ${pageNums.length} >>`);
  push(FONT, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

  paginas.forEach((lns, i) => {
    let stream = `BT\n/F1 10 Tf\n${LEAD} TL\n${MARGIN_X} ${TOP} Td\n`;
    for (const ln of lns) stream += `(${escapePdf(ln)}) Tj\nT*\n`;
    stream += 'ET';
    const len = Buffer.byteLength(stream, 'latin1');
    push(contentNums[i], `<< /Length ${len} >>\nstream\n${stream}\nendstream`);
    push(pageNums[i],
      `<< /Type /Page /Parent ${PAGES} 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /Font << /F1 ${FONT} 0 R >> >> /Contents ${contentNums[i]} 0 R >>`);
  });

  const xrefStart = out.length;
  const size = total + 1;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let i = 1; i < size; i++) xref += String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n';
  xref += `trailer\n<< /Size ${size} /Root ${CATALOG} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.concat([out, Buffer.from(xref, 'latin1')]);
}

/** Informe de horas → PDF (para Inspección/RLT y trabajador). */
export function informeAPdf(informe, tz) {
  const lineas = [`Periodo: ${informe.desde} a ${informe.hasta}`, ''];
  for (const emp of informe.empleados) {
    lineas.push(`Empleado: ${emp.nombre}   ·   Total: ${emp.totalTexto}`);
    for (const j of emp.jornadas) {
      const ent = j.entrada != null ? formatearHora(j.entrada, tz) : '--:--';
      const sal = j.salida != null ? formatearHora(j.salida, tz) : (j.enCurso ? 'en curso' : '--:--');
      lineas.push(`   ${j.fecha}  ${j.codigo}  ${ent} - ${sal}  ${j.textoHoras}`);
    }
    lineas.push('');
  }
  lineas.push(`TOTAL DEL PERIODO: ${informe.totalPeriodoTexto}`);
  return pdfDesdeLineas('Informe de horas — Registro de jornada', lineas);
}
