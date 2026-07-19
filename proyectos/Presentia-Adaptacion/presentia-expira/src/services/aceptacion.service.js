// aceptacion.service.js — Aceptación de términos y condiciones por usuario, exigida
// en el PRIMER acceso (empleado en el kiosko y admin/técnico en el Manager). Una vez
// aceptada la versión vigente, no se vuelve a pedir. Queda registrada (quién, cuándo,
// versión) como prueba de consentimiento informado, y auditada en la cadena de hash.
import * as audit from './audit.service.js';

// Versión vigente de los términos. Si en el futuro cambian sustancialmente, súbela
// (p. ej. 'v2') para exigir de nuevo la aceptación a todos.
export const TERMINOS_VERSION = 'v1';

/** ¿Ha aceptado el usuario la versión vigente? */
export function estado(deps, empleadoId) {
  const row = deps.db
    .prepare('SELECT ts FROM presentia_aceptaciones WHERE empleado_id = ? AND version = ?')
    .get(empleadoId, TERMINOS_VERSION);
  return { aceptado: !!row, version: TERMINOS_VERSION, ts: row ? row.ts : null };
}

/** Registra la aceptación (idempotente: si ya estaba, no duplica ni re-audita). */
export function aceptar(deps, { empleadoId, actorRol = null, origen = null }) {
  const previo = estado(deps, empleadoId);
  if (previo.aceptado) return previo;
  const now = deps.clock.now();
  deps.db
    .prepare('INSERT OR IGNORE INTO presentia_aceptaciones (empleado_id, version, ts, origen) VALUES (?, ?, ?, ?)')
    .run(empleadoId, TERMINOS_VERSION, now, origen);
  audit.registrar(deps.db, {
    ts: now, actorId: empleadoId, actorRol, accion: 'terminos_aceptados', entidad: 'aceptacion',
    entidadId: empleadoId, origen, detalle: { version: TERMINOS_VERSION },
  });
  return estado(deps, empleadoId);
}
