// generar-contenido.mjs — Convierte legal/*.md en legal/contenido.js (módulo JS
// embebible en el bundle del Manager/kiosko). Los .md siguen siendo la ÚNICA fuente;
// contenido.js se REGENERA (no editar a mano).
//
//   node legal/generar-contenido.mjs      (o: npm run legal:build)
//
// Cero dependencias: sólo node:fs. El markdown se incrusta como literal seguro.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

// Metadatos por archivo: título corto, categoría, orden y si se muestra al EMPLEADO
// (kiosko). Todos son visibles para el admin en el Manager.
const META = {
  'CLAUSULA-INFORMATIVA-EMPLEADOS.md': { id: 'clausula-informativa', titulo: 'Información para el personal', categoria: 'Protección de datos', orden: 1, empleado: true },
  'POLITICA-DE-PRIVACIDAD.md':          { id: 'privacidad',            titulo: 'Política de privacidad',      categoria: 'Protección de datos', orden: 2, empleado: true },
  'POLITICA-DE-CONSERVACION-Y-SUPRESION.md': { id: 'conservacion',     titulo: 'Conservación y supresión',    categoria: 'Protección de datos', orden: 3, empleado: false },
  'CONTRATO-ENCARGADO-TRATAMIENTO.md':  { id: 'encargo',               titulo: 'Contrato de encargo de tratamiento', categoria: 'Protección de datos', orden: 4, empleado: false },
  'REGISTRO-ACTIVIDADES-TRATAMIENTO.md':{ id: 'rat',                   titulo: 'Registro de actividades (RAT)', categoria: 'Protección de datos', orden: 5, empleado: false },
  'AVISO-LEGAL.md':                     { id: 'aviso-legal',           titulo: 'Aviso legal',                 categoria: 'Legales',            orden: 1, empleado: false },
  'TERMINOS-Y-CONDICIONES.md':          { id: 'terminos',              titulo: 'Términos y condiciones (EULA)', categoria: 'Legales',          orden: 2, empleado: false },
  'COOKIES-NO-APLICA.md':               { id: 'cookies',               titulo: 'Política de cookies',         categoria: 'Legales',            orden: 3, empleado: false },
  'PROTOCOLO-REGISTRO-DE-JORNADA.md':   { id: 'protocolo',             titulo: 'Protocolo de registro de jornada', categoria: 'Cumplimiento',     orden: 1, empleado: false },
  'CUMPLIMIENTO.md':                    { id: 'cumplimiento',          titulo: 'Tabla maestra de cumplimiento', categoria: 'Cumplimiento',      orden: 2, empleado: false },
};

export const ORDEN_CATEGORIAS = ['Protección de datos', 'Legales', 'Cumplimiento'];

/** Incrusta un texto como literal de plantilla seguro. */
function aTemplate(s) {
  return '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
}

export function generar() {
  const docs = [];
  for (const [archivo, meta] of Object.entries(META)) {
    const ruta = path.join(DIR, archivo);
    if (!fs.existsSync(ruta)) { console.warn('AVISO: falta', archivo); continue; }
    const markdown = fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n').trimEnd();
    docs.push({ ...meta, archivo, markdown });
  }
  docs.sort((a, b) =>
    ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria) || a.orden - b.orden);

  const cuerpo = docs.map((d) =>
    `  {\n` +
    `    id: ${JSON.stringify(d.id)},\n` +
    `    archivo: ${JSON.stringify(d.archivo)},\n` +
    `    titulo: ${JSON.stringify(d.titulo)},\n` +
    `    categoria: ${JSON.stringify(d.categoria)},\n` +
    `    empleado: ${d.empleado},\n` +
    `    markdown: ${aTemplate(d.markdown)},\n` +
    `  }`).join(',\n');

  const salida =
`// contenido.js — GENERADO por legal/generar-contenido.mjs. NO editar a mano.
// Fuente única: legal/*.md. Regenerar con: npm run legal:build
// Documentos legales del módulo, embebidos para renderizarse en el Manager y el kiosko.

export const ORDEN_CATEGORIAS = ${JSON.stringify(ORDEN_CATEGORIAS)};

export const DOCUMENTOS = [
${cuerpo}
];

/** Documento por id, o null. */
export function documentoPorId(id) {
  return DOCUMENTOS.find((d) => d.id === id) || null;
}

/** Documentos visibles para el empleado (kiosko). */
export function documentosEmpleado() {
  return DOCUMENTOS.filter((d) => d.empleado);
}

/** Documentos agrupados por categoría, respetando ORDEN_CATEGORIAS. */
export function documentosPorCategoria(soloEmpleado = false) {
  const lista = soloEmpleado ? documentosEmpleado() : DOCUMENTOS;
  return ORDEN_CATEGORIAS
    .map((cat) => ({ categoria: cat, documentos: lista.filter((d) => d.categoria === cat) }))
    .filter((g) => g.documentos.length > 0);
}
`;
  fs.writeFileSync(path.join(DIR, 'contenido.js'), salida, 'utf8');
  return docs.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = generar();
  console.log(`legal/contenido.js generado con ${n} documentos.`);
}
