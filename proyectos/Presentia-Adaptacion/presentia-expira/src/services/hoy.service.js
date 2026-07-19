// hoy.service.js — Pestaña "Hoy" (§3): KPIs Dentro ahora / Salidas (personas que ya
// se han ido) / Personas hoy + lista de marcas del día. Autorefresco en el Manager.
import { fechaJornada } from '../domain/time.js';
import { siguienteTipo } from '../domain/jornadas.js';
import * as repos from './repos.js';

export function hoy(deps) {
  const now = deps.clock.now();
  const fecha = fechaJornada(now, deps.config.zonaHoraria);
  const jornadas = repos.jornadasDelDia(deps.db, fecha);

  let dentroAhora = 0;
  let salidas = 0;      // personas que ya han terminado y se han ido (jornada cerrada)
  let marcasHoy = 0;
  const personas = new Set();
  const marcas = [];

  for (const j of jornadas) {
    const ms = repos.marcasDeJornada(deps.db, j.id);
    if (ms.length) personas.add(j.empleado_id);
    marcasHoy += ms.length;
    const dentro = siguienteTipo(ms) === 'salida';
    if (dentro) dentroAhora++;
    else if (ms.length) salidas++; // ya fichó hoy y no está dentro => se ha ido
    const e = deps.employees.getById(j.empleado_id);
    for (const m of ms) {
      marcas.push({
        empleadoId: j.empleado_id,
        empleadoNombre: e ? e.nombre : j.empleado_id,
        tipo: m.tipo,
        ts: m.ts,
        codigo: j.codigo,
      });
    }
  }
  marcas.sort((a, b) => b.ts - a.ts);
  return { fecha, dentroAhora, salidas, marcasHoy, personasHoy: personas.size, marcas };
}
