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

/**
 * Diferencia en DÍAS DE CALENDARIO entre dos fechas 'YYYY-MM-DD' (fechaB - fechaA).
 * Ambas ya deben estar bucketizadas en la MISMA zona horaria (p.ej. con `fechaJornada`);
 * la resta es sobre las partes de calendario, no sobre instantes UTC (evita el ruido de
 * DST). Positivo si fechaB es posterior a fechaA.
 */
export function diferenciaDiasCalendario(fechaA, fechaB) {
  const [ya, ma, da] = String(fechaA).split('-').map(Number);
  const [yb, mb, db] = String(fechaB).split('-').map(Number);
  const a = Date.UTC(ya, ma - 1, da);
  const b = Date.UTC(yb, mb - 1, db);
  return Math.round((b - a) / (24 * 3600 * 1000));
}

/**
 * Desfase (ms) de la zona `tz` respecto a UTC en el instante `ts`: la hora de pared en
 * `tz` equivale a `ts + offset` expresado como si fuera UTC. Útil para convertir en
 * ambos sentidos entre epoch ms y "hora de pared" de una zona arbitraria.
 */
function offsetTz(ts, tz) {
  const p = partesFecha(ts, tz);
  const comoUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return comoUtc - ts;
}

/**
 * epoch ms -> valor para `<input type="datetime-local">` EN LA ZONA DADA (nunca la del
 * navegador). Fuente única de verdad para "qué hora ve el admin", igual en la tabla y
 * en el modal de edición (fix A-01/K-06/A-06: se elimina el hardcode Europe/Madrid y la
 * dependencia de la zona local del proceso/navegador).
 */
export function tsAValorLocal(ts, tz) {
  const p = partesFecha(ts, tz);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Valor de `<input type="datetime-local">` (interpretado como hora de pared EN LA ZONA
 * `tz`, NO en la zona local del navegador) -> epoch ms absoluto. Inversa de
 * `tsAValorLocal`. Devuelve `null` si el valor no tiene el formato esperado.
 * Algoritmo: se toma el valor como si fuese UTC, se mide el desfase real de `tz` en ese
 * instante y se corrige; se repite una vez más por si el primer ajuste cruza un cambio
 * de hora (DST) — converge siempre en ≤2 iteraciones para este caso de uso.
 */
export function valorLocalATs(valor, tz) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(valor ?? ''));
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
  let real = guess - offsetTz(guess, tz);
  real = guess - offsetTz(real, tz); // refina cerca de un cambio de hora
  return real;
}
