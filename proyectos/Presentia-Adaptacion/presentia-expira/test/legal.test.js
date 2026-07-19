// legal.test.js — Parser Markdown (puro) + integración de los documentos legales.
// Verifica que el renderer recibe un árbol correcto y que TODOS los documentos de
// legal/ se cargan y parsean sin romperse (los usa el Manager y el kiosko).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearMarkdown, parsearInline } from '../shared/markdown-parse.js';
import { DOCUMENTOS, documentosEmpleado, documentoPorId, documentosPorCategoria } from '../legal/contenido.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));

// ---- Parser: bloques ----
test('LEGAL · encabezados # y ## → h1/h2', () => {
  const b = parsearMarkdown('# Título\n\n## Sección');
  assert.equal(b[0].tipo, 'h1');
  assert.equal(b[0].texto, 'Título');
  assert.equal(b[1].tipo, 'h2');
});

test('LEGAL · párrafo conserva saltos suaves; línea en blanco separa bloques', () => {
  const b = parsearMarkdown('uno\ndos\n\ntres');
  assert.equal(b.length, 2);
  assert.equal(b[0].tipo, 'p');
  assert.equal(b[0].texto, 'uno\ndos'); // salto suave preservado (se renderiza como <br/>)
  assert.equal(b[1].texto, 'tres');
});

test('LEGAL · bloque de código cercado se extrae como bloque codigo', () => {
  const b = parsearMarkdown('texto\n\n```\nF-AAAA-NNNN\n```\n\nmás');
  const cod = b.find((x) => x.tipo === 'codigo');
  assert.ok(cod, 'hay bloque de código');
  assert.equal(cod.texto, 'F-AAAA-NNNN');
});

test('LEGAL · el protocolo contiene el bloque de código del formato F-AAAA-NNNN', () => {
  const b = parsearMarkdown(documentoPorId('protocolo').markdown);
  const cod = b.find((x) => x.tipo === 'codigo');
  assert.ok(cod && cod.texto.includes('F-AAAA-NNNN'), 'el formato de código se muestra como bloque de código');
});

test('LEGAL · lista con viñetas y lista numerada', () => {
  const ul = parsearMarkdown('- a\n- b');
  assert.equal(ul[0].tipo, 'ul');
  assert.deepEqual(ul[0].items, ['a', 'b']);
  const ol = parsearMarkdown('1. uno\n2. dos');
  assert.equal(ol[0].tipo, 'ol');
  assert.equal(ol[0].items.length, 2);
});

test('LEGAL · tabla con cabecera y filas', () => {
  const b = parsearMarkdown('| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |');
  assert.equal(b[0].tipo, 'tabla');
  assert.deepEqual(b[0].cabecera, ['A', 'B']);
  assert.equal(b[0].filas.length, 2);
  assert.deepEqual(b[0].filas[0], ['1', '2']);
});

test('LEGAL · regla horizontal y cita', () => {
  assert.equal(parsearMarkdown('---')[0].tipo, 'hr');
  const cita = parsearMarkdown('> aviso importante');
  assert.equal(cita[0].tipo, 'cita');
  assert.equal(cita[0].texto, 'aviso importante');
});

// ---- Parser: en línea ----
test('LEGAL · en línea: negrita, cursiva, código, enlace', () => {
  const t = parsearInline('Ver **esto**, *eso*, `código` y https://aepd.es aquí');
  assert.ok(t.some((x) => x.t === 'bold' && x.v === 'esto'));
  assert.ok(t.some((x) => x.t === 'italic' && x.v === 'eso'));
  assert.ok(t.some((x) => x.t === 'code' && x.v === 'código'));
  const link = t.find((x) => x.t === 'link');
  assert.equal(link.href, 'https://aepd.es');
});

test('LEGAL · en línea seguro: marcadores sin cerrar no rompen (se tratan como texto)', () => {
  const t = parsearInline('un * suelto y ** también');
  assert.equal(t.map((x) => x.v).join(''), 'un * suelto y ** también');
  assert.ok(t.every((x) => x.t === 'text'));
});

// ---- Integración con los documentos reales ----
test('LEGAL · se cargan los 10 documentos con id, título y markdown', () => {
  assert.equal(DOCUMENTOS.length, 10);
  for (const d of DOCUMENTOS) {
    assert.ok(d.id && d.titulo && d.categoria, `metadatos de ${d.archivo}`);
    assert.ok(d.markdown.length > 200, `markdown de ${d.id}`);
  }
});

test('LEGAL · exactamente 2 documentos visibles para el empleado (kiosko)', () => {
  const emp = documentosEmpleado().map((d) => d.id).sort();
  assert.deepEqual(emp, ['clausula-informativa', 'privacidad']);
});

test('LEGAL · TODOS los documentos parsean a bloques sin lanzar', () => {
  for (const d of DOCUMENTOS) {
    const bloques = parsearMarkdown(d.markdown);
    assert.ok(bloques.length > 3, `${d.id} produce bloques`);
    assert.equal(bloques[0].tipo, 'h1', `${d.id} empieza por título`);
    // cada bloque de texto debe poder tokenizarse en línea sin romper
    for (const b of bloques) {
      if (b.texto) assert.ok(Array.isArray(parsearInline(b.texto)));
      if (b.items) b.items.forEach((it) => assert.ok(Array.isArray(parsearInline(it))));
    }
  }
});

test('LEGAL · la tabla maestra de cumplimiento se parsea como tabla (6 columnas)', () => {
  const cumpl = documentoPorId('cumplimiento');
  const bloques = parsearMarkdown(cumpl.markdown);
  const tabla = bloques.find((b) => b.tipo === 'tabla');
  assert.ok(tabla, 'hay una tabla');
  assert.equal(tabla.cabecera.length, 6);
});

test('LEGAL · contenido.js está SINCRONIZADO con legal/*.md (fuente única)', () => {
  // El markdown embebido debe coincidir con el .md en disco (normalizado).
  for (const d of DOCUMENTOS) {
    const disco = fs.readFileSync(path.join(DIR, '..', 'legal', d.archivo), 'utf8').replace(/\r\n/g, '\n').trimEnd();
    assert.equal(d.markdown, disco, `${d.archivo} desincronizado — ejecuta npm run legal:build`);
  }
});

test('LEGAL · agrupación por categoría cubre los 3 grupos', () => {
  const grupos = documentosPorCategoria();
  assert.deepEqual(grupos.map((g) => g.categoria), ['Protección de datos', 'Legales', 'Cumplimiento']);
  assert.equal(grupos.reduce((n, g) => n + g.documentos.length, 0), 10);
});
