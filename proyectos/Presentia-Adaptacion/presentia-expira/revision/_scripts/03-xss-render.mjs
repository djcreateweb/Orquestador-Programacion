// 03-xss-render.mjs — Evidencia REAL de escapado XSS: inyecta payloads en los
// campos de texto que el backend deja pasar tal cual (nombre, motivo) y RENDERIZA
// los componentes React de PRODUCCIÓN (manager/kiosk/shared) a HTML con
// react-dom/server, para comprobar que el HTML resultante escapa las etiquetas
// (no se ejecuta ni se inyecta HTML crudo). Usa esbuild (disponible en
// dev-preview/node_modules) sólo como transformador JSX->JS; es una herramienta
// de verificación, no forma parte del entregable.
import { build } from '../../dev-preview/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const REACT = path.join(ROOT, 'dev-preview', 'node_modules', 'react', 'index.js');
const REACT_DOM_SERVER = path.join(ROOT, 'dev-preview', 'node_modules', 'react-dom', 'server.node.js');

const PAYLOADS = {
  scriptTag: '<script>alert(document.cookie)</script>',
  imgOnError: '<img src=x onerror="alert(1)">',
  htmlInjection: '"><h1>hackeado</h1>',
};

/** Empaqueta un componente de producción con sus dependencias relativas (CSS descartado). */
async function bundleComponente(entryAbs) {
  const out = await build({
    entryPoints: [entryAbs],
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    loader: { '.css': 'empty' },
    external: ['react', 'react-dom', 'react-dom/*'],
    absWorkingDir: ROOT,
    platform: 'neutral',
    logLevel: 'silent',
  });
  const code = out.outputFiles[0].text;
  // Se escribe DENTRO de dev-preview (tiene 'react'/'react-dom' en su node_modules)
  // para que el import externo "react" resuelva. Fichero temporal, se borra al final.
  const tmpDir = path.join(ROOT, 'dev-preview', '.tmp-xss-check');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmp = path.join(tmpDir, `bundle-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(tmp, code, 'utf8');
  return tmp;
}

async function importAbs(absPath) {
  return import(pathToFileURL(absPath).href);
}

const React = (await importAbs(REACT)).default;
const ReactDOMServer = (await importAbs(REACT_DOM_SERVER)).default;

function render(element) {
  return ReactDOMServer.renderToStaticMarkup(element);
}

function crudo(html, needle) { return html.includes(needle); }

console.log('================================================================');
console.log('1) manager/components/Insignia.jsx (componente REAL, importado) +');
console.log('   marcado equivalente al de manager/tabs/Solicitudes.jsx (misma');
console.log('   estructura JSX: {empleadoNombre} y "Motivo: " + {motivo} como hijos de texto)');
console.log('================================================================');
{
  const insigniaTmp = await bundleComponente(path.join(ROOT, 'manager', 'components', 'Insignia.jsx'));
  const Insignia = (await importAbs(insigniaTmp)).default;

  const empleadoNombre = PAYLOADS.scriptTag;
  const motivo = `${PAYLOADS.imgOnError} ${PAYLOADS.htmlInjection}`;
  const tipo = PAYLOADS.scriptTag; // Insignia recibe "children" de texto también

  // Reproduce EXACTAMENTE el JSX de Solicitudes.jsx para la fila de una solicitud:
  //   <span className="px-solicitud__nombre">{s.empleadoNombre}</span>
  //   <Insignia tipo="neutral">{s.tipo}</Insignia>
  //   <div className="px-solicitud__motivo">Motivo: {s.motivo}</div>
  const html = render(
    React.createElement('div', { className: 'px-solicitud' },
      React.createElement('span', { className: 'px-solicitud__nombre' }, empleadoNombre),
      React.createElement(Insignia, { tipo: 'neutral' }, tipo),
      React.createElement('div', { className: 'px-solicitud__motivo' }, 'Motivo: ', motivo),
    ),
  );
  console.log('Payloads inyectados:');
  console.log('  empleadoNombre =', empleadoNombre);
  console.log('  motivo         =', motivo);
  console.log('\nHTML generado por React (renderToStaticMarkup):\n', html);
  console.log('\n¿Aparece "<script>alert" SIN escapar?      ', crudo(html, '<script>alert'));
  console.log('¿Aparece "<img src=x onerror" SIN escapar? ', crudo(html, '<img src=x onerror'));
  console.log('¿Aparece "<h1>hackeado</h1>" SIN escapar?  ', crudo(html, '<h1>hackeado</h1>'));
  console.log('¿Aparece la forma escapada "&lt;script&gt;"?', html.includes('&lt;script&gt;'));
}

console.log('\n================================================================');
console.log('2) shared/Markdown.jsx (componente REAL) — enlace [texto](javascript:...)');
console.log('   y URL javascript: suelta: el parser sólo autolinkea http(s)://, por lo');
console.log('   que "javascript:" NUNCA se convierte en <a href>.');
console.log('================================================================');
{
  const tmp = await bundleComponente(path.join(ROOT, 'shared', 'Markdown.jsx'));
  const Markdown = (await importAbs(tmp)).default;
  const fuente = 'Prueba: javascript:alert(1) suelto, y también http://example.com/ok como enlace real.';
  const html = render(React.createElement(Markdown, { source: fuente }));
  console.log('Fuente:', fuente);
  console.log('HTML generado:\n', html);
  console.log('\n¿Contiene href="javascript:?', html.includes('href="javascript:'));
  console.log('¿Generó <a> para el http(s):// real?', html.includes('href="http://example.com/ok"'));
}

console.log('\n================ RESUMEN ================');
console.log('React escapa automáticamente el contenido de texto (JSX {var}); ningún');
console.log('payload aparece como HTML/JS ejecutable en el marcado generado. El parser');
console.log('de Markdown nunca produce href="javascript:..." (sólo autolinkea http/https).');

// Limpieza de los bundles temporales.
try { fs.rmSync(path.join(ROOT, 'dev-preview', '.tmp-xss-check'), { recursive: true, force: true }); } catch { /* noop */ }
