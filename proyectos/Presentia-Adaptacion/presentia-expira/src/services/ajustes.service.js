// ajustes.service.js — Pestaña "Ajustes" (§3). Lee/persiste la configuración del
// módulo (presentia_ajustes) y mantiene viva la config en deps.config.
import { leerConfig, guardarConfig } from '../db/migrate.js';
import * as audit from './audit.service.js';

export function obtener(deps) {
  return leerConfig(deps.db);
}

/**
 * Guarda un subconjunto de ajustes (claves desconocidas se ignoran; se normaliza).
 * @param {object} deps
 * @param {object} parcial
 * @param {{actorId?:string, actorRol?:string}} ctx
 */
export function guardar(deps, parcial, { actorId, actorRol } = {}) {
  const now = deps.clock.now();
  const nueva = guardarConfig(deps.db, parcial);
  Object.assign(deps.config, nueva); // fuente única viva para el resto de servicios
  audit.registrar(deps.db, {
    ts: now, actorId, actorRol, accion: 'ajustes_cambiados', entidad: 'ajustes',
    detalle: { cambios: parcial },
  });
  return nueva;
}
