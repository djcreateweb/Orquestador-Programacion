// fichaje.service.js — Núcleo del fichaje (§3). Toggle entrada/salida con:
//  - verificación de PIN delegada al puerto de Expira (cero login propio),
//  - límite de intentos + backoff + bloqueo (compensa el PIN de 4 dígitos, §6.1),
//  - creación de jornada con correlativo F-AAAA-NNNN,
//  - auditoría encadenada. NUNCA se registra el PIN.
import { fechaJornada, anioDe } from '../domain/time.js';
import { siguienteTipo, emparejarSegmentos } from '../domain/jornadas.js';
import { transaccion } from '../db/tx.js';
import * as repos from './repos.js';
import * as audit from './audit.service.js';
import { backoffMs } from '../security/pin-policy.js';
import { crearCorrelativosDb } from '../domain/correlativo.js';
import { err } from '../errors.js';

const DIA_MS = 24 * 3600 * 1000;

/**
 * Resuelve la jornada a la que pertenece un fichaje en `now`.
 * Regla (turnos que cruzan medianoche): si NO hay jornada del día local pero el
 * empleado tiene una jornada ABIERTA reciente (última entrada hace <24h), el fichaje
 * (la salida) cierra ESA jornada en lugar de crear una nueva del día siguiente.
 * Si la jornada abierta es de hace ≥24h (olvido de salida de días atrás), NO se reusa:
 * se empieza una jornada nueva hoy y la antigua queda para corrección del admin.
 * @returns {object|null} jornada existente o null si hay que crear una nueva.
 */
function jornadaObjetivo(deps, empleadoId, fecha, now) {
  const db = deps.db;
  const delDia = repos.jornadaDe(db, empleadoId, fecha);
  if (delDia) return delDia;
  const abierta = repos.jornadaAbiertaReciente(db, empleadoId);
  if (abierta) {
    const marcas = repos.marcasDeJornada(db, abierta.id);
    const ult = marcas[marcas.length - 1];
    if (ult && ult.tipo === 'entrada' && (now - ult.ts) < DIA_MS) return abierta;
  }
  return null;
}

function intentosRow(db, empleadoId, dispositivo) {
  return db.prepare('SELECT * FROM presentia_pin_intentos WHERE empleado_id = ? AND dispositivo = ?')
    .get(empleadoId, dispositivo) ?? null;
}

function registrarFallo(db, empleadoId, dispositivo, now) {
  const row = intentosRow(db, empleadoId, dispositivo);
  const fallos = (row?.fallos ?? 0) + 1;
  const bloqueadoHasta = now + backoffMs(fallos);
  db.prepare(
    `INSERT INTO presentia_pin_intentos (empleado_id, dispositivo, fallos, bloqueado_hasta, actualizado_ts)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(empleado_id, dispositivo) DO UPDATE SET
       fallos = excluded.fallos, bloqueado_hasta = excluded.bloqueado_hasta, actualizado_ts = excluded.actualizado_ts`
  ).run(empleadoId, dispositivo, fallos, bloqueadoHasta, now);
  return { fallos, bloqueadoHasta };
}

function limpiarIntentos(db, empleadoId, dispositivo) {
  db.prepare('DELETE FROM presentia_pin_intentos WHERE empleado_id = ? AND dispositivo = ?').run(empleadoId, dispositivo);
}

/**
 * Verifica el PIN aplicando bloqueo/backoff. Lanza ErrorPresentia genérico si falla.
 * Registra el intento fallido en auditoría (sin el PIN).
 */
export function verificarPin(deps, { empleadoId, pin, dispositivo, origen }) {
  const { db, clock, config, pin: pinPort } = deps;
  if (config.exigirPin === false) return true;
  const now = clock.now();
  const disp = dispositivo || 'desconocido';

  const row = intentosRow(db, empleadoId, disp);
  if (row && row.bloqueado_hasta > now) {
    audit.registrar(db, {
      ts: now, actorId: empleadoId, accion: 'pin_bloqueado', entidad: 'empleado',
      entidadId: empleadoId, origen, detalle: { dispositivo: disp },
    });
    throw err('PIN_BLOQUEADO', 429, `bloqueado hasta ${row.bloqueado_hasta}`,
      'Demasiados intentos. Inténtalo de nuevo más tarde.');
  }

  const ok = !!(pinPort && pinPort.verify(empleadoId, pin));
  if (!ok) {
    const { fallos } = registrarFallo(db, empleadoId, disp, now);
    audit.registrar(db, {
      ts: now, actorId: empleadoId, accion: 'pin_fallido', entidad: 'empleado',
      entidadId: empleadoId, origen, detalle: { dispositivo: disp, fallos },
    });
    throw err('PIN_INCORRECTO', 401, 'pin incorrecto', 'Credenciales incorrectas.');
  }
  limpiarIntentos(db, empleadoId, disp);
  return true;
}

/**
 * Ficha (alterna entrada/salida) para el empleado.
 * @returns {{tipo:string, ts:number, codigo:string, estado:string, marcaId:number, jornadaId:number}}
 */
export function fichar(deps, { empleadoId, pin, dispositivo = null, origen = 'kiosk', pinVerificado = false }) {
  const { db, clock, config, employees, correlatives } = deps;
  const emp = employees.getById(empleadoId);
  if (!emp || emp.activo === false) {
    throw err('EMPLEADO_INVALIDO', 403, 'empleado inactivo o inexistente', 'Empleado no disponible.');
  }
  if (!pinVerificado) verificarPin(deps, { empleadoId, pin, dispositivo, origen });

  const now = clock.now();
  const tz = config.zonaHoraria;
  const fecha = fechaJornada(now, tz);
  const correl = correlatives || crearCorrelativosDb(db);

  return transaccion(db, () => {
    let jornada = jornadaObjetivo(deps, empleadoId, fecha, now);
    if (!jornada) {
      const codigo = correl.next(config.serieCorrelativo, anioDe(now, tz));
      jornada = repos.crearJornada(db, { empleadoId, fecha, codigo, estado: 'abierta', ts: now });
    }
    const marcas = repos.marcasDeJornada(db, jornada.id);
    const tipo = siguienteTipo(marcas);

    if (config.variasMarcasDia === false && tipo === 'entrada' &&
        marcas.some((m) => m.tipo === 'entrada')) {
      throw err('JORNADA_CERRADA', 409, 'jornada del día ya registrada (varias marcas desactivado)',
        'La jornada de hoy ya está registrada.');
    }

    const marca = repos.insertarMarca(db, { jornadaId: jornada.id, tipo, ts: now, origen, dispositivo });
    const estado = tipo === 'salida' ? 'cerrada' : 'abierta';
    repos.actualizarEstadoJornada(db, jornada.id, estado, now);

    audit.registrar(db, {
      ts: now, actorId: empleadoId, actorRol: emp.rol, accion: 'fichaje', entidad: 'marca',
      entidadId: marca.id, origen, detalle: { tipo, jornadaId: jornada.id, codigo: jornada.codigo },
    });

    if (config.imprimirTicket && deps.printing?.printTicket) {
      try { deps.printing.printTicket({ empleado: emp.nombre, tipo, ts: now, codigo: jornada.codigo }); } catch { /* impresión best-effort */ }
    }

    return { tipo, ts: now, codigo: jornada.codigo, estado, marcaId: marca.id, jornadaId: jornada.id };
  });
}

/** Estado actual del empleado para la pantalla de kiosko. */
export function estadoEmpleado(deps, empleadoId) {
  const { db, clock, config } = deps;
  const now = clock.now();
  const fecha = fechaJornada(now, config.zonaHoraria);
  const jornada = jornadaObjetivo(deps, empleadoId, fecha, now); // incluye turnos que cruzan medianoche
  const marcas = jornada ? repos.marcasDeJornada(db, jornada.id) : [];
  const tipo = siguienteTipo(marcas);
  const dentro = tipo === 'salida';
  let desde = null;
  if (dentro) {
    const abierto = emparejarSegmentos(marcas).find((s) => s.salida == null && s.entrada != null);
    desde = abierto ? abierto.entrada : null;
  }
  return { dentro, desde, siguienteTipo: tipo, codigo: jornada?.codigo ?? null, fecha };
}
