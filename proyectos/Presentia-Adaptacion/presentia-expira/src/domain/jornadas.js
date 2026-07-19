// jornadas.js — Lógica pura de emparejado de marcas y cálculo de horas (§3).
// Reglas: una jornada = entrada + salida; se admiten varias parejas al día (pausas).
// Las horas = suma de segmentos cerrados (entrada→salida). Una salida posterior a
// medianoche pertenece a la jornada de su entrada (el segmento dura salida−entrada,
// aunque cruce el día). Sin dependencias, determinista.

/**
 * Empareja marcas ordenadas por ts en segmentos entrada→salida.
 * Marca dos entradas seguidas: la primera queda como segmento abierto (marca faltante).
 * Salida huérfana (sin entrada): segmento con entrada=null (hueco), no computa.
 * @param {Array<{tipo:string, ts:number, id?:number}>} marcas
 * @returns {Array<{entrada:(number|null), salida:(number|null), entradaId:(number|null), salidaId:(number|null)}>}
 */
export function emparejarSegmentos(marcas) {
  const orden = [...marcas].sort((a, b) => a.ts - b.ts);
  const segs = [];
  let abierta = null;
  for (const m of orden) {
    if (m.tipo === 'entrada') {
      if (abierta) {
        segs.push({ entrada: abierta.ts, salida: null, entradaId: abierta.id ?? null, salidaId: null });
      }
      abierta = m;
    } else { // salida
      if (abierta) {
        segs.push({ entrada: abierta.ts, salida: m.ts, entradaId: abierta.id ?? null, salidaId: m.id ?? null });
        abierta = null;
      } else {
        segs.push({ entrada: null, salida: m.ts, entradaId: null, salidaId: m.id ?? null });
      }
    }
  }
  if (abierta) segs.push({ entrada: abierta.ts, salida: null, entradaId: abierta.id ?? null, salidaId: null });
  return segs;
}

/** Minutos trabajados = suma de segmentos cerrados con salida > entrada. */
export function minutosTrabajados(marcas) {
  let ms = 0;
  for (const s of emparejarSegmentos(marcas)) {
    if (s.entrada != null && s.salida != null && s.salida > s.entrada) ms += s.salida - s.entrada;
  }
  return Math.round(ms / 60000);
}

/** Redondea `min` al múltiplo de `redondeoMin` más cercano (0 = sin redondeo). */
export function aplicarRedondeo(min, redondeoMin) {
  const r = Number(redondeoMin) || 0;
  if (r <= 0) return min;
  return Math.round(min / r) * r;
}

/**
 * Resumen de una jornada a partir de sus marcas.
 * @param {Array} marcas
 * @param {object} config (usa redondeoMin)
 * @returns {{entrada:(number|null), salida:(number|null), minutos:number,
 *            minutosRedondeados:number, enCurso:boolean, segmentos:Array}}
 */
export function resumenJornada(marcas, config = {}) {
  const segmentos = emparejarSegmentos(marcas);
  const enCurso = segmentos.some((s) => s.entrada != null && s.salida == null);
  const entradas = segmentos.map((s) => s.entrada).filter((v) => v != null);
  const salidas = segmentos.map((s) => s.salida).filter((v) => v != null);
  const minutos = minutosTrabajados(marcas);
  return {
    entrada: entradas.length ? Math.min(...entradas) : null,
    salida: enCurso ? null : (salidas.length ? Math.max(...salidas) : null),
    minutos,
    minutosRedondeados: aplicarRedondeo(minutos, config.redondeoMin),
    enCurso,
    segmentos,
  };
}

/** Formatea minutos como "168 h 30 m". */
export function formatearDuracion(min) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} m`;
}

/** ¿La próxima marca esperada es 'entrada' o 'salida'? (estado del empleado). */
export function siguienteTipo(marcas) {
  const abierta = emparejarSegmentos(marcas).some((s) => s.entrada != null && s.salida == null);
  return abierta ? 'salida' : 'entrada';
}

/**
 * Valida el orden cronológico de un conjunto de marcas (fix A-02). OJO: NO se apoya en
 * `emparejarSegmentos` porque esa función siempre re-empareja por orden cronológico y
 * "arregla" en silencio cualquier inversión (una entrada movida DESPUÉS de su salida deja
 * de estar emparejada con ella y pasa a ser un hueco + una jornada abierta, sin que
 * ningún segmento tenga entrada≥salida) — que es precisamente el bug que hay que
 * detectar. Aquí se valida la invariante real del toggle: ordenadas por `ts`, las marcas
 * deben alternar ESTRICTAMENTE entrada, salida, entrada, salida… (empezando por entrada)
 * con `ts` estrictamente creciente. Cualquier ruptura (dos entradas seguidas, una salida
 * igual o anterior a la entrada previa, etc.) se considera orden inconsistente.
 * @param {Array} marcas
 * @returns {boolean} true si el orden es consistente.
 */
export function ordenCronologicoValido(marcas) {
  const orden = [...marcas].sort((a, b) => a.ts - b.ts);
  let tipoEsperado = 'entrada';
  let tsAnterior = -Infinity;
  for (const m of orden) {
    if (m.ts <= tsAnterior) return false;
    if (m.tipo !== tipoEsperado) return false;
    tsAnterior = m.ts;
    tipoEsperado = tipoEsperado === 'entrada' ? 'salida' : 'entrada';
  }
  return true;
}
