// correlativo.js — Código correlativo por año F-AAAA-NNNN (§3).
// En integración real se delega en el puerto correlatives de Expira; aquí va el
// fallback atómico propio (contador por serie+año en presentia_correlativos).

/** Formatea 'F-2026-0001'. Crece a 5+ dígitos si se superan 9999. */
export function formatearCodigo(serie, anio, n) {
  const num = String(n).padStart(4, '0');
  return `${serie}-${anio}-${num}`;
}

/** Parsea 'F-2026-0001' -> {serie, anio, n} o null si no encaja. */
export function parsearCodigo(codigo) {
  const m = /^([A-Z]+)-(\d{4})-(\d{4,})$/.exec(String(codigo || ''));
  if (!m) return null;
  return { serie: m[1], anio: Number(m[2]), n: Number(m[3]) };
}

/**
 * Crea un generador de correlativos respaldado por la BD (atómico por serie+año).
 * Usa un upsert con RETURNING para incrementar y leer en una sola operación.
 * @param {{prepare:Function}} db
 * @returns {{ next(serie:string, anio:number): string }}
 */
export function crearCorrelativosDb(db) {
  const upsert = db.prepare(
    'INSERT INTO presentia_correlativos (serie, anio, ultimo) VALUES (?, ?, 1) ' +
    'ON CONFLICT(serie, anio) DO UPDATE SET ultimo = ultimo + 1 ' +
    'RETURNING ultimo'
  );
  return {
    next(serie, anio) {
      const row = upsert.get(serie, anio);
      return formatearCodigo(serie, anio, row.ultimo);
    },
  };
}
