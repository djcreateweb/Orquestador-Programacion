// ajustes.service.js — Pestaña "Ajustes" (§3). Lee/persiste la configuración del
// módulo (presentia_ajustes) y mantiene viva la config en deps.config.
import { leerConfig, guardarConfig } from '../db/migrate.js';
import { validarAjustesEstricto } from '../ports.js';
import { err } from '../errors.js';
import * as audit from './audit.service.js';

export function obtener(deps) {
  return leerConfig(deps.db);
}

/**
 * Guarda un subconjunto de ajustes (claves desconocidas se ignoran; se valida).
 * fix A-09: un valor fuera de rango se RECHAZA con un error claro (400, campo + motivo)
 * en vez de acotarse/sustituirse en silencio; no se aplica NINGÚN cambio (ni siquiera
 * los campos válidos del mismo payload) si algún campo es inválido.
 * @param {object} deps
 * @param {object} parcial
 * @param {{actorId?:string, actorRol?:string}} ctx
 */
export function guardar(deps, parcial, { actorId, actorRol } = {}) {
  const { valido, errores } = validarAjustesEstricto(parcial);
  if (!valido) {
    const detalle = errores.map((e) => `${e.campo}: ${e.motivo}`).join(' ');
    throw err('AJUSTE_INVALIDO', 400, `ajustes inválidos: ${JSON.stringify(errores)}`, `Valor no válido — ${detalle}`);
  }
  const now = deps.clock.now();
  const nueva = guardarConfig(deps.db, parcial);
  Object.assign(deps.config, nueva); // fuente única viva para el resto de servicios
  audit.registrar(deps.db, {
    ts: now, actorId, actorRol, accion: 'ajustes_cambiados', entidad: 'ajustes',
    detalle: { cambios: parcial },
  });
  return nueva;
}
