// markdown-parse.js — Parser Markdown MÍNIMO, puro y sin dependencias, para renderizar
// los documentos legales de forma SEGURA (sin dangerouslySetInnerHTML). Cubre el
// subconjunto que usan legal/*.md: encabezados (# ##), párrafos, listas (- / 1.),
// tablas (|), reglas (---), citas (>), y en línea: **negrita**, *cursiva*, `código`
// y URLs http(s). Lógica pura ⇒ testeable con node --test.

/** Divide una fila de tabla en celdas, quitando los bordes `|`. */
function celdas(fila) {
  let s = fila.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/** ¿Es la fila separadora de cabecera de una tabla? (|---|---|) */
function esSeparadorTabla(fila) {
  return /-/.test(fila) && /^\|?[\s:|-]+\|?$/.test(fila.trim());
}

function parsearTabla(filas) {
  if (filas.length < 2 || !esSeparadorTabla(filas[1])) return null;
  return {
    tipo: 'tabla',
    cabecera: celdas(filas[0]),
    filas: filas.slice(2).map(celdas),
  };
}

const esEspecial = (s) =>
  s === '' || /^#{1,4}\s/.test(s) || /^---+$/.test(s) || /^>\s?/.test(s) ||
  /^\|/.test(s) || /^[-*]\s+/.test(s) || /^\d+\.\s+/.test(s) || /^```/.test(s);

/**
 * Parsea un documento markdown en bloques.
 * @param {string} md
 * @returns {Array<object>} bloques: {tipo:'h1'|'h2'|'h3'|'h4'|'p'|'hr'|'cita'|'ul'|'ol'|'tabla', ...}
 */
export function parsearMarkdown(md) {
  const lineas = String(md ?? '').replace(/\r\n/g, '\n').split('\n');
  const bloques = [];
  let i = 0;
  while (i < lineas.length) {
    const t = lineas[i].trim();
    if (t === '') { i++; continue; }

    if (/^---+$/.test(t)) { bloques.push({ tipo: 'hr' }); i++; continue; }

    // Bloque de código cercado ```…```
    if (/^```/.test(t)) {
      i++; // salta la valla de apertura
      const code = [];
      while (i < lineas.length && !/^```/.test(lineas[i].trim())) { code.push(lineas[i]); i++; }
      if (i < lineas.length) i++; // salta la valla de cierre
      bloques.push({ tipo: 'codigo', texto: code.join('\n') });
      continue;
    }

    const h = /^(#{1,4})\s+(.*)$/.exec(t);
    if (h) { bloques.push({ tipo: 'h' + h[1].length, texto: h[2] }); i++; continue; }

    if (/^>\s?/.test(t)) {
      const lns = [];
      while (i < lineas.length && /^>\s?/.test(lineas[i].trim())) {
        lns.push(lineas[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      bloques.push({ tipo: 'cita', texto: lns.join('\n') });
      continue;
    }

    if (/^\|/.test(t)) {
      const filas = [];
      while (i < lineas.length && /^\s*\|/.test(lineas[i])) { filas.push(lineas[i]); i++; }
      const tabla = parsearTabla(filas);
      if (tabla) { bloques.push(tabla); continue; }
      bloques.push({ tipo: 'p', texto: filas.join(' ') });
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lineas.length && /^[-*]\s+/.test(lineas[i].trim())) {
        items.push(lineas[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      bloques.push({ tipo: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(t)) {
      const items = [];
      while (i < lineas.length && /^\d+\.\s+/.test(lineas[i].trim())) {
        items.push(lineas[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      bloques.push({ tipo: 'ol', items });
      continue;
    }

    const parr = [];
    while (i < lineas.length && !esEspecial(lineas[i].trim())) { parr.push(lineas[i].trim()); i++; }
    bloques.push({ tipo: 'p', texto: parr.join('\n') });
  }
  return bloques;
}

/**
 * Parsea el texto en línea en tokens seguros.
 * @param {string} text
 * @returns {Array<{t:'text'|'bold'|'italic'|'code'|'link', v:string, href?:string}>}
 */
export function parsearInline(text) {
  const s = String(text ?? '');
  const tokens = [];
  let buf = '';
  const flush = () => { if (buf) { tokens.push({ t: 'text', v: buf }); buf = ''; } };
  let i = 0;
  while (i < s.length) {
    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1);
      if (end > i) { flush(); tokens.push({ t: 'code', v: s.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2);
      if (end > i) { flush(); tokens.push({ t: 'bold', v: s.slice(i + 2, end) }); i = end + 2; continue; }
    }
    // Cursiva *texto*: conservadora — no abre con espacio ni forma parte de ** y el
    // cierre debe ser un '*' real con contenido no vacío (marcadores sueltos → texto).
    if (s[i] === '*' && s[i + 1] !== '*' && s[i + 1] !== ' ') {
      const end = s.indexOf('*', i + 1);
      if (end > i + 1 && s[end - 1] !== ' ' && s[end + 1] !== '*') {
        flush(); tokens.push({ t: 'italic', v: s.slice(i + 1, end) }); i = end + 1; continue;
      }
    }
    const m = /^https?:\/\/[^\s)]+/.exec(s.slice(i));
    if (m) {
      const url = m[0].replace(/[.,;]+$/, '');
      flush(); tokens.push({ t: 'link', v: url, href: url }); i += url.length; continue;
    }
    buf += s[i]; i++;
  }
  flush();
  return tokens;
}
