// tema.test.js — Tema claro/oscuro/auto: lógica pura, config, contraste AA de la
// paleta oscura y guard de "cero colores hardcodeados fuera de tokens.css".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { temaEfectivo, siguienteModo, esModoValido, MODOS } from '../shared/tema.js';
import { ratio } from '../shared/contraste.js';
import { normalizeConfig, DEFAULT_CONFIG, TEMAS_VALIDOS } from '../src/ports.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- lógica pura
test('TEMA · temaEfectivo resuelve claro/oscuro/auto', () => {
  assert.equal(temaEfectivo('claro', true), 'claro');
  assert.equal(temaEfectivo('oscuro', false), 'oscuro');
  assert.equal(temaEfectivo('auto', true), 'oscuro');   // sistema en oscuro
  assert.equal(temaEfectivo('auto', false), 'claro');   // sistema en claro
  assert.equal(temaEfectivo('basura', true), 'oscuro'); // inválido → auto
});

test('TEMA · siguienteModo cicla claro → oscuro → auto → claro', () => {
  assert.equal(siguienteModo('claro'), 'oscuro');
  assert.equal(siguienteModo('oscuro'), 'auto');
  assert.equal(siguienteModo('auto'), 'claro');
  assert.deepEqual(MODOS, ['claro', 'oscuro', 'auto']);
  assert.equal(esModoValido('auto'), true);
  assert.equal(esModoValido('x'), false);
});

// ---------------------------------------------------------------- config
test('TEMA · config: temaPorDefecto por defecto es auto y valida el enum', () => {
  assert.equal(DEFAULT_CONFIG.temaPorDefecto, 'auto');
  assert.deepEqual(TEMAS_VALIDOS, ['claro', 'oscuro', 'auto']);
  assert.equal(normalizeConfig({ temaPorDefecto: 'oscuro' }).temaPorDefecto, 'oscuro');
  assert.equal(normalizeConfig({ temaPorDefecto: 'claro' }).temaPorDefecto, 'claro');
  assert.equal(normalizeConfig({ temaPorDefecto: 'neón' }).temaPorDefecto, 'auto'); // inválido → defecto
});

// ---------------------------------------------------------------- contraste AA (paleta oscura)
// Pares (texto/fondo) de la paleta OSCURA con su umbral WCAG AA (4.5 normal, 3 UI/grande).
const PARES_OSCURO = [
  ['texto / superficie', '#f1f5f9', '#1e293b', 4.5],
  ['texto / superficie elevada', '#f1f5f9', '#273449', 4.5],
  ['texto atenuado / superficie', '#94a3b8', '#1e293b', 4.5],
  ['on-accent(oscuro) / azul acción', '#0f172a', '#4f83e3', 4.5],
  ['on-accent(oscuro) / verde acción', '#0f172a', '#22b86a', 4.5],
  ['on-accent(oscuro) / rojo acción', '#0f172a', '#ef4444', 4.5],
  ['éxito texto / fondo', '#4ade80', '#14532d', 4.5],
  ['aviso texto / fondo', '#fbbf24', '#422006', 4.5],
  ['info texto / fondo', '#93c5fd', '#16233d', 4.5],
  ['error texto / fondo', '#fca5a5', '#3b1717', 4.5],
  ['enlace / superficie', '#7ea6f0', '#1e293b', 4.5],
  ['enlace / superficie elevada', '#7ea6f0', '#273449', 4.5],
  ['foco (azul acción) / superficie [UI]', '#4f83e3', '#1e293b', 3],
];

test('TEMA · toda la paleta oscura cumple WCAG AA', () => {
  for (const [nombre, fg, bg, min] of PARES_OSCURO) {
    const r = ratio(fg, bg);
    assert.ok(r >= min, `${nombre}: ${r.toFixed(2)} < ${min}`);
  }
});

test('TEMA · los valores oscuros están definidos en tokens.css (bloque oscuro)', () => {
  const css = fs.readFileSync(path.join(RAIZ, 'shared', 'tokens.css'), 'utf8');
  const m = css.match(/\[data-tema-efectivo="oscuro"\]\s*\{([\s\S]*?)\}/);
  assert.ok(m, 'existe el bloque de tema oscuro');
  const bloque = m[1];
  for (const hex of ['#1e293b', '#273449', '#f1f5f9', '#4f83e3', '#22b86a', '#ef4444', '#7ea6f0']) {
    assert.ok(bloque.includes(hex), `tokens.css oscuro debe definir ${hex}`);
  }
});

// ---------------------------------------------------------------- guard anti-hardcode
test('TEMA · CERO colores hardcodeados fuera de tokens.css', () => {
  const CSS = [
    'shared/prosa.css', 'shared/aceptacion.css', 'shared/boton-tema.css',
    'shared/responsive.css',
    'manager/presentia.css', 'kiosk/kiosk.css',
  ];
  const patron = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
  const hallazgos = [];
  for (const rel of CSS) {
    const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); // sin comentarios
    texto.split('\n').forEach((linea, i) => {
      if (patron.test(linea)) hallazgos.push(`${rel}:${i + 1}  ${linea.trim()}`);
    });
  }
  assert.deepEqual(hallazgos, [], `colores hardcodeados fuera de tokens:\n${hallazgos.join('\n')}`);
});
