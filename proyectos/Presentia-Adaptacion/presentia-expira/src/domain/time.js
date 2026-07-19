// time.js — Utilidades de fecha/hora conscientes de la zona horaria del centro.
// Resuelve la inconsistencia UTC/local detectada en el análisis: la "fecha de
// jornada" SIEMPRE se calcula en la zona del centro (config.zonaHoraria), mientras
// que los timestamps se almacenan en UTC (epoch ms). Lógica pura: recibe `ts` como
// argumento (no usa el reloj del sistema) ⇒ determinista y testeable.

/**
 * Descompone un instante (epoch ms) en sus partes de calendario en una zona horaria.
 * @param {number} ts epoch ms
 * @param {string} tz p.ej. 'Europe/Madrid'
 * @returns {{year:number,month:number,day:number,hour:number,minute:number,second:number}}
 */
export function partesFecha(ts, tz) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const m = {};
  for (const p of dtf.formatToParts(new Date(ts))) {
    if (p.type !== 'literal') m[p.type] = p.value;
  }
  const hour = m.hour === '24' ? 0 : Number(m.hour); // algunos entornos emiten '24' a medianoche
  return {
    year: Number(m.year), month: Number(m.month), day: Number(m.day),
    hour, minute: Number(m.minute), second: Number(m.second),
  };
}

/** Fecha de jornada 'YYYY-MM-DD' en la zona del centro. */
export function fechaJornada(ts, tz) {
  const p = partesFecha(ts, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Año natural (en la zona del centro) — base del correlativo por año. */
export function anioDe(ts, tz) {
  return partesFecha(ts, tz).year;
}

/** Hora 'HH:MM' en la zona del centro (para tablas y tickets). */
export function formatearHora(ts, tz) {
  const p = partesFecha(ts, tz);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/** Fecha larga en español, p.ej. "lunes, 13 de julio de 2026" (kiosko). */
export function formatearFechaLarga(ts, tz) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(ts));
}

/** Fecha+hora 'DD/MM/YYYY HH:MM' en la zona del centro (exportaciones legibles). */
export function formatearFechaHora(ts, tz) {
  const p = partesFecha(ts, tz);
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year} ` +
    `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/** Primer día 'YYYY-MM-01' del mes de `ts` (rango por defecto del informe). */
export function primerDiaDelMes(ts, tz) {
  const p = partesFecha(ts, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-01`;
}

/** Último día 'YYYY-MM-DD' del mes de `ts`. */
export function ultimoDiaDelMes(ts, tz) {
  const p = partesFecha(ts, tz);
  const dias = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate(); // día 0 del mes+1 = último del mes
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(dias).padStart(2, '0')}`;
}
