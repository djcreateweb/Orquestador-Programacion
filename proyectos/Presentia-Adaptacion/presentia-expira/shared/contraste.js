// contraste.js — Cálculo de contraste WCAG 2.x (puro, sin dependencias). Se usa para
// validar la paleta (clara y oscura) en los tests y para documentar los ratios.

/** '#rrggbb' | '#rgb' → [r,g,b] 0..255. */
export function hexARgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminancia relativa WCAG de un color. */
export function luminancia(hex) {
  const [r, g, b] = hexARgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste entre dos colores (1..21). */
export function ratio(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Redondea a 2 decimales (para tablas). */
export function ratioRedondeado(a, b) {
  return Math.round(ratio(a, b) * 100) / 100;
}

/** ¿Cumple AA? nivel 'normal' (4.5) | 'grande' (3) | 'ui' (3). */
export function cumpleAA(a, b, nivel = 'normal') {
  return ratio(a, b) >= (nivel === 'normal' ? 4.5 : 3);
}
