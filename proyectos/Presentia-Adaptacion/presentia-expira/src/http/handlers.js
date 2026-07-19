// handlers.js — Handlers agnósticos del framework (§D-006). Cada uno aplica su
// AUTORIZACIÓN por endpoint y devuelve datos (o {raw,...} para descargas) o lanza
// ErrorPresentia. El kiosko sólo alcanza rutas de kiosko; el Manager exige rol
// admin/técnico. IDOR imposible: el empleado sólo opera sobre su propia identidad
// (tomada del servidor: micro-sesión de kiosko), nunca de un id del cliente.
import * as fichaje from '../services/fichaje.service.js';
import * as registros from '../services/registros.service.js';
import * as informe from '../services/informe.service.js';
import * as solicitudes from '../services/solicitudes.service.js';
import * as ajustes from '../services/ajustes.service.js';
import * as hoyService from '../services/hoy.service.js';
import * as aceptacion from '../services/aceptacion.service.js';
import * as audit from '../services/audit.service.js';
import * as repos from '../services/repos.js';
import { informeACsv } from '../export/csv.js';
import { informeAPdf } from '../export/pdf.js';
import { requireRol, requireCanalKiosko } from './authz.js';
import { ROLES } from '../ports.js';
import { err } from '../errors.js';
import { primerDiaDelMes, ultimoDiaDelMes } from '../domain/time.js';

const ADMIN = [ROLES.LOCAL_ADMIN, ROLES.TECHNICIAN];

function empleadoPublico(deps, id) {
  const e = deps.employees.getById(id);
  if (!e) return null;
  return { id: e.id, nombre: e.nombre, avatarUrl: e.avatarUrl || null, rol: e.rol };
}

function rangoDefecto(deps, src = {}) {
  const tz = deps.config.zonaHoraria;
  const now = deps.clock.now();
  return {
    desde: (src && src.desde) || primerDiaDelMes(now, tz),
    hasta: (src && src.hasta) || ultimoDiaDelMes(now, tz),
  };
}

function empleadoDeSesion(ctx) {
  const empleadoId = ctx.kioskSessions.validar(ctx.body?.token || ctx.query?.token);
  if (!empleadoId) throw err('SESION_KIOSKO', 401, 'token de kiosko inválido/caducado', 'Sesión caducada. Introduce tu PIN de nuevo.');
  return empleadoId;
}

/** Verifica que la marca/jornada referida en la solicitud pertenece al empleado (anti-IDOR). */
function validarPropiedad(deps, empleadoId, cambio) {
  if (cambio?.accion === 'editar' && cambio.marcaId) {
    const m = repos.marcaPorId(deps.db, cambio.marcaId);
    const j = m ? repos.jornadaPorId(deps.db, m.jornada_id) : null;
    if (!j || j.empleado_id !== empleadoId) throw err('PROHIBIDO', 403, 'marca ajena', 'No autorizado.');
  } else if (cambio?.accion === 'anadir' && cambio.jornadaId) {
    const j = repos.jornadaPorId(deps.db, cambio.jornadaId);
    if (!j || j.empleado_id !== empleadoId) throw err('PROHIBIDO', 403, 'jornada ajena', 'No autorizado.');
  }
}

// ---------------------------------------------------------------------------
// KIOSKO (canal 'kiosk'; el empleado se identifica con su PIN)
// ---------------------------------------------------------------------------
export const kiosk = {
  empleados(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    if (deps.config.mostrarEnKiosko === false) return [];
    return deps.employees.list()
      .filter((e) => e.activo !== false)
      .map((e) => ({ id: e.id, nombre: e.nombre, avatarUrl: e.avatarUrl || null }));
  },

  entrar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const { empleadoId, pin } = ctx.body || {};
    if (!empleadoId) throw err('EMPLEADO_REQUERIDO', 400, 'falta empleadoId', 'Datos incompletos.');
    if (!ctx.rate.check(`entrar:${ctx.dispositivo}:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    fichaje.verificarPin(deps, { empleadoId, pin, dispositivo: ctx.dispositivo, origen: 'kiosk' });
    const token = ctx.kioskSessions.emitir(empleadoId);
    return {
      token,
      empleado: empleadoPublico(deps, empleadoId),
      estado: fichaje.estadoEmpleado(deps, empleadoId),
      aceptado: aceptacion.estado(deps, empleadoId).aceptado, // ¿ya aceptó los términos?
    };
  },

  terminos(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    return aceptacion.estado(deps, empleadoId);
  },

  aceptarTerminos(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    return aceptacion.aceptar(deps, { empleadoId, origen: 'kiosk' });
  },

  estado(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    return { empleado: empleadoPublico(deps, empleadoId), estado: fichaje.estadoEmpleado(deps, empleadoId) };
  },

  fichar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    if (!ctx.rate.check(`fichar:${ctx.dispositivo}:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    return fichaje.fichar(deps, { empleadoId, dispositivo: ctx.dispositivo, origen: 'kiosk', pinVerificado: true });
  },

  misRegistros(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    const { desde, hasta } = rangoDefecto(deps, ctx.body);
    return informe.informePorEmpleado(deps, { desde, hasta, empleadoId }); // sólo lo propio
  },

  exportar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    const inf = informe.informePorEmpleado(deps, { desde, hasta, empleadoId });
    const tz = deps.config.zonaHoraria;
    if (ctx.formato === 'pdf') return { raw: informeAPdf(inf, tz), contentType: 'application/pdf', filename: `mis-horas-${desde}_${hasta}.pdf` };
    return { raw: informeACsv(inf, tz), contentType: 'text/csv; charset=utf-8', filename: `mis-horas-${desde}_${hasta}.csv` };
  },

  crearSolicitud(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(ctx);
    const { cambio, motivo, jornadaId = null, marcaId = null } = ctx.body || {};
    validarPropiedad(deps, empleadoId, cambio);
    return solicitudes.crear(deps, { empleadoId, cambio, motivo, jornadaId, marcaId });
  },
};

// ---------------------------------------------------------------------------
// MANAGER (rol admin/técnico, del puerto session del host)
// ---------------------------------------------------------------------------
export const manager = {
  hoy(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return hoyService.hoy(deps);
  },

  registros(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    return registros.listarJornadas(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
  },

  editarMarca(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    const { marcaId, tsNuevo, motivo } = ctx.body || {};
    return registros.editarMarca(deps, {
      marcaId: Number(marcaId), tsNuevo: Number(tsNuevo), motivo,
      actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
    });
  },

  anadirMarca(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    const { jornadaId, tipo, ts, motivo } = ctx.body || {};
    return registros.anadirMarca(deps, {
      jornadaId: Number(jornadaId), tipo, ts: Number(ts), motivo,
      actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
    });
  },

  informe(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    return informe.informePorEmpleado(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
  },

  informeExport(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    const inf = informe.informePorEmpleado(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
    const tz = deps.config.zonaHoraria;
    if (ctx.formato === 'pdf') return { raw: informeAPdf(inf, tz), contentType: 'application/pdf', filename: `informe-${desde}_${hasta}.pdf` };
    return { raw: informeACsv(inf, tz), contentType: 'text/csv; charset=utf-8', filename: `informe-${desde}_${hasta}.csv` };
  },

  solicitudes(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.listar(deps, { estado: ctx.query?.estado || null });
  },

  aprobar(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.aprobar(deps, {
      solicitudId: Number(ctx.params.id), actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
      comentario: ctx.body?.comentario || null,
    });
  },

  rechazar(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.rechazar(deps, {
      solicitudId: Number(ctx.params.id), actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
      comentario: ctx.body?.comentario || null,
    });
  },

  ajustesGet(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return ajustes.obtener(deps);
  },

  ajustesPut(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return ajustes.guardar(deps, ctx.body || {}, { actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol });
  },

  // Sólo técnico: verificación de integridad de la auditoría (dato sensible).
  auditoriaVerificar(deps, ctx) {
    requireRol(ctx.actor, ROLES.TECHNICIAN);
    return audit.verificarIntegridad(deps.db);
  },

  // Aceptación de términos del admin/técnico (exigida en el primer acceso).
  terminos(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return aceptacion.estado(deps, ctx.actor.empleadoId);
  },

  aceptarTerminos(deps, ctx) {
    requireRol(ctx.actor, ...ADMIN);
    return aceptacion.aceptar(deps, { empleadoId: ctx.actor.empleadoId, actorRol: ctx.actor.rol, origen: 'manager' });
  },
};
