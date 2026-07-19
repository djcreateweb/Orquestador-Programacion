// responsive.test.js — Guardarraíl de REGRESIÓN responsive (§ Fase 3), SIN dependencias.
// Análisis estático del CSS/JSX que verifica que siguen presentes las reglas que
// garantizan: objetivo táctil ≥44 px con dedo, inputs ≥16 px, tablas→tarjetas sin
// perder datos, alturas en dvh y modales alcanzables. La verificación EMPÍRICA en
// navegador real (scrollWidth y área táctil medidos) la hace el arnés de Playwright
// del scratchpad (ver docs/RESPONSIVE.md, D-015) — aquí se fija lo que no debe romperse.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

test('RESPONSIVE · responsive.css se importa en kiosko y Manager', () => {
  assert.match(leer('kiosk/kiosk.css'), /@import\s+["']\.\.\/shared\/responsive\.css["']/);
  assert.match(leer('manager/presentia.css'), /@import\s+["']\.\.\/shared\/responsive\.css["']/);
});

test('RESPONSIVE · objetivo táctil ≥44 px SOLO con dedo (any-pointer:coarse)', () => {
  const css = leer('shared/responsive.css');
  assert.match(css, /@media\s*\(any-pointer:\s*coarse\)/, 'debe existir el bloque de puntero grueso');
  assert.match(css, /min-height:\s*44px/, 'debe fijar 44 px de objetivo táctil');
  // El botón compacto de fila deja de ser diminuto en táctil.
  assert.match(css, /\.px-btn--sm\s*\{[^}]*min-height:\s*44px/s);
});

test('RESPONSIVE · inputs ≥16 px con dedo (evita el zoom de iOS)', () => {
  const css = leer('shared/responsive.css');
  assert.match(css, /font-size:\s*16px/, 'los inputs deben subir a 16 px en táctil');
});

test('RESPONSIVE · patrón tabla→tarjetas (≤640 px) con etiquetas, sin perder datos', () => {
  const css = leer('shared/responsive.css');
  assert.match(css, /@media\s*\(max-width:\s*640px\)/, 'umbral tabla↔tarjeta a 640 px');
  assert.match(css, /content:\s*attr\(data-label\)/, 'cada celda muestra su etiqueta en tarjeta');
  assert.match(css, /\.px-tabla[^{]*\{[^}]*display:\s*block/s, 'la tabla pasa a bloques en móvil');
});

test('RESPONSIVE · cada tabla de datos etiqueta sus celdas (data-label en JSX)', () => {
  const casos = [
    ['manager/tabs/Registros.jsx', 6],
    ['manager/tabs/Hoy.jsx', 4],
    ['manager/tabs/InformeHoras.jsx', 5],
    ['kiosk/MisRegistros.jsx', 5],
  ];
  for (const [rel, min] of casos) {
    const n = (leer(rel).match(/data-label=/g) || []).length;
    assert.ok(n >= min, `${rel}: se esperaban ≥${min} data-label y hay ${n}`);
  }
  // La celda de acciones de Registros se marca para el diseño de tarjeta.
  assert.match(leer('manager/tabs/Registros.jsx'), /className="px-cell-acciones"/);
});

test('RESPONSIVE · alturas completas en dvh (todo vh tiene su dvh de respaldo)', () => {
  const archivos = ['shared/responsive.css', 'shared/aceptacion.css', 'kiosk/kiosk.css', 'manager/presentia.css'];
  for (const rel of archivos) {
    const t = leer(rel);
    const vh = (t.match(/vh\b/g) || []).length;
    const dvh = (t.match(/dvh\b/g) || []).length;
    const soloVh = vh - dvh; // "vh" sueltos (sin la 'd' de dvh)
    assert.ok(soloVh <= dvh, `${rel}: hay ${soloVh} 'vh' sin 'dvh' de respaldo`);
  }
});

test('RESPONSIVE · las tablas con min-width viven en un contenedor con overflow-x', () => {
  assert.match(leer('manager/presentia.css'), /\.px-tabla-wrap\s*\{[^}]*overflow-x/s);
  assert.match(leer('kiosk/kiosk.css'), /\.pk-tabla-wrap\s*\{[^}]*overflow-x/s);
  assert.match(leer('shared/prosa.css'), /\.prosa__tabla-wrap\s*\{[^}]*overflow-x/s);
});

test('RESPONSIVE · modales como hoja inferior con acción fija y safe-area', () => {
  const css = leer('shared/responsive.css');
  assert.match(css, /\.px-modal__acciones\s*\{[^}]*position:\s*sticky/s, 'el pie de acción del modal queda fijo');
  assert.match(css, /env\(safe-area-inset-bottom\)/, 'respeta la safe-area inferior');
});

test('RESPONSIVE · filtros del Manager apilados a ancho completo en móvil', () => {
  assert.match(leer('shared/responsive.css'), /\.px-filtros\s*\{[^}]*flex-direction:\s*column/s);
});
