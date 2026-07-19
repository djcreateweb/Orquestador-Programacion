// fichaje.service.js — Núcleo del fichaje (§3). Toggle entrada/salida con:
//  - verificación de PIN delegada al puerto de Expira (cero login propio),
//  - límite de intentos + backoff + bloqueo (compensa el PIN de 4 dígitos, §6.1),
//  - creación de jornada con correlativo F-AAAA-NNNN,
//  - auditoría encadenada. NUNCA se registra el PIN.
import { fechaJornada, anioDe, diferenciaDiasCalendario } from '../domain/time.js';
import { siguienteTipo, emparejarSegmentos } from '../domain/jornadas.js';
import { transaccion } from '../db/tx.js';
import * as repos from './repos.js';
import * as audit from './audit.service.js';
import { backoffMs } from '../security/pin-policy.js';
import { crearCorrelativosDb } from '../domain/correlativo.js';
import { err } from '../errors.js';
import { DEFAULT_CONFIG } from '../ports.js';

/**
 * Decide si una jornada ABIERTA reciente del empleado se puede REUTILIZAR para cerrarla
 * con el fichaje de `now` (turno que cruza medianoche), o si por el contrario quedó
 * ABANDONADA (olvido de salida) y no debe tocarse (fix K-01, causa raíz del cierre de
 * jornadas de días anteriores con la hora de hoy).
 *
 * Reutilizable SOLO si se cumplen AMBAS condiciones:
 *  - su entrada pertenece al día de jornada de hoy o al inmediatamente anterior (permite
 *    cruzar UNA medianoche: el turno de noche legítimo 22:00→06:00), Y
 *  - su antigüedad (now - ts de la entrada) es menor que `config.maxDuracionJornadaMin`
 *    (por defecto 16h: un turno de noche real dura horas, no ≥16h).
 *
 * Si no es reutilizable, se devuelve también la jornada `abandonada` para que `fichar`
 * la señalice como "requiere corrección" (nunca se cierra con la hora de la fichada
 * actual, que era exactamente el bug: una jornada de ayer terminando con la hora de hoy).
 * @returns {{ jornada: object|null, abandonada: object|null }}
 */
function evaluarJornadaAbierta(deps, empleadoId, fecha, now) {
  const db = deps.db;
  const config = deps.config;
  const abierta = repos.jornadaAbiertaReciente(db, empleadoId);
  if (!abierta) return { jornada: null, abandonada: null };
  const marcas = repos.marcasDeJornada(db, abierta.id);
  const ult = marcas[marcas.length - 1];
  if (!ult || ult.tipo !== 'entrada') return { jornada: null, abandonada: null }; // no debería darse con estado 'abierta'

  const tz = config.zonaHoraria;
  const maxMin = Number(config.maxDuracionJornadaMin) || DEFAULT_CONFIG.maxDuracionJornadaMin;
  const antiguedadMin = (now - ult.ts) / 60000;
  const fechaEntrada = fechaJornada(ult.ts, tz);
  const gapDias = diferenciaDiasCalendario(fechaEntrada, fecha);
  const reutilizable = gapDias <= 1 && antiguedadMin < maxMin;

  return reutilizable ? { jornada: abierta, abandonada: null } : { jornada: null, abandonada: abierta };
}

/**
 * Resuelve la jornada a la que pertenece un fichaje en `now` (lectura pura, SIN efectos
 * secundarios: no marca nada como abandonado). Úsala para consultar estado; `fichar`
 * usa `evaluarJornadaAbierta` directamente porque además debe señalizar la abandonada.
 * @returns {object|null} jornada existente o null si hay que crear una nueva.
 */
function jornadaObjetivo(deps, empleadoId, fecha, now) {
  const delDia = repos.jornadaDe(deps.db, empleadoId, fecha);
  if (delDia) return delDia;
  return evaluarJornadaAbierta(deps, empleadoId, fecha, now).jornada;
}

// fix S-01: el contador de bloqueo/backoff de PIN se indexa ÚNICAMENTE por la
// IDENTIDAD DEL EMPLEADO atacado, NUNCA por `dispositivo` — `dispositivo` proviene de
// una cabecera HTTP (`x-presentia-dispositivo`) 100% controlada por el cliente, sin
// validar; indexar el contador por ella permitía a un atacante reiniciar el bloqueo en
// cada intento con sólo rotar ese valor (confirmado con
// `revision/_scripts/06-bypass-backoff-dispositivo.mjs`: 200 intentos, 0 bloqueos).
// La columna `dispositivo` de `presentia_pin_intentos` se conserva en el esquema (no se
// puede alterar su PK de forma aditiva) pero la fila de bloqueo usa siempre esta clave
// fija; el dispositivo REAL que llega en cada intento se sigue registrando en el
// detalle de auditoría (trazabilidad forense), sólo deja de ser la clave del contador.
const CLAVE_BLOQUEO = '__bloqueo_por_empleado__';

function intentosRow(db, empleadoId) {
  return db.prepare('SELECT * FROM presentia_pin_intentos WHERE empleado_id = ? AND dispositivo = ?')
    .get(empleadoId, CLAVE_BLOQUEO) ?? null;
}

function registrarFallo(db, empleadoId, now) {
  const row = intentosRow(db, empleadoId);
  const fallos = (row?.fallos ?? 0) + 1;
  const bloqueadoHasta = now + backoffMs(fallos);
  db.prepare(
    `INSERT INTO presentia_pin_intentos (empleado_id, dispositivo, fallos, bloqueado_hasta, actualizado_ts)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(empleado_id, dispositivo) DO UPDATE SET
       fallos = excluded.fallos, bloqueado_hasta = excluded.bloqueado_hasta, actualizado_ts = excluded.actualizado_ts`
  ).run(empleadoId, CLAVE_BLOQUEO, fallos, bloqueadoHasta, now);
  return { fallos, bloqueadoHasta };
}

function limpiarIntentos(db, empleadoId) {
  db.prepare('DELETE FROM presentia_pin_intentos WHERE empleado_id = ? AND dispositivo = ?').run(empleadoId, CLAVE_BLOQUEO);
}

/**
 * Verifica el PIN aplicando bloqueo/backoff. Lanza ErrorPresentia genérico si falla.
 * Registra el intento fallido en auditoría (sin el PIN).
 */
export function verificarPin(deps, { empleadoId, pin, dispositivo, origen }) {
  const { db, clock, config, pin: pinPort } = deps;
  if (config.exigirPin === false) return true;
  const now = clock.now();
  const disp = dispositivo || 'desconocido'; // sólo informativo/auditoría (fix S-01)

  const row = intentosRow(db, empleadoId);
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
    const { fallos } = registrarFallo(db, empleadoId, now);
    audit.registrar(db, {
      ts: now, actorId: empleadoId, accion: 'pin_fallido', entidad: 'empleado',
      entidadId: empleadoId, origen, detalle: { dispositivo: disp, fallos },
    });
    throw err('PIN_INCORRECTO', 401, 'pin incorrecto', 'Credenciales incorrectas.');
  }
  limpiarIntentos(db, empleadoId);
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
    // Guardia anti-doble-toque (fix K-04): dos pulsaciones casi simultáneas del mismo
    // empleado (doble-click, red lenta que reintenta, dos tablets) no deben abrir+cerrar
    // un ciclo entrada/salida de 0 minutos. Se compara contra la ÚLTIMA marca del
    // empleado (cualquier jornada), no sólo la de la jornada objetivo.
    const ventanaMs = (Number(config.ventanaAntiRebotarFichajeSeg) || 0) * 1000;
    if (ventanaMs > 0) {
      const ultima = repos.ultimaMarcaEmpleado(db, empleadoId);
      if (ultima && now >= ultima.ts && (now - ultima.ts) < ventanaMs) {
        throw err('FICHAJE_DUPLICADO', 429, 'doble fichaje casi simultáneo',
          'Ya se ha registrado tu fichaje hace unos segundos. Espera un momento.');
      }
    }

    let jornada = repos.jornadaDe(db, empleadoId, fecha);
    if (!jornada) {
      const { jornada: reutilizable, abandonada } = evaluarJornadaAbierta(deps, empleadoId, fecha, now);
      if (reutilizable) {
        jornada = reutilizable;
      } else {
        // fix K-01: la jornada abierta de antes NO se cierra con la hora de hoy; se deja
        // señalizada para corrección y se abre una jornada nueva para la fichada actual.
        if (abandonada && abandonada.requiere_correccion !== 1) {
          repos.marcarJornadaRequiereCorreccion(db, abandonada.id, now);
          audit.registrar(db, {
            ts: now, actorId: empleadoId, actorRol: emp.rol, accion: 'jornada_abandonada', entidad: 'jornada',
            entidadId: abandonada.id, origen, detalle: { motivo: 'entrada_sin_salida_no_reutilizable' },
          });
        }
        const codigo = correl.next(config.serieCorrelativo, anioDe(now, tz));
        jornada = repos.crearJornada(db, { empleadoId, fecha, codigo, estado: 'abierta', ts: now });
      }
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
