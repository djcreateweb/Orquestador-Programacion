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
import { requireRol, requireCanalKiosko, requireCanalManager } from './authz.js';
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

function empleadoDeSesion(deps, ctx) {
  const empleadoId = ctx.kioskSessions.validar(ctx.body?.token || ctx.query?.token);
  if (!empleadoId) throw err('SESION_KIOSKO', 401, 'token de kiosko inválido/caducado', 'Sesión caducada. Introduce tu PIN de nuevo.');
  // fix K-02: un empleado dado de baja NO puede operar en el kiosko en absoluto, ni
  // siquiera con un token de sesión ya emitido antes de la baja (defensa en profundidad,
  // simétrica a la comprobación de `entrar`): cubre TODAS las acciones autenticadas
  // (ver estado/histórico, exportar, crear solicitud, aceptar términos, fichar).
  const emp = deps.employees.getById(empleadoId);
  if (!emp || emp.activo === false) {
    throw err('EMPLEADO_INVALIDO', 403, 'empleado inactivo o inexistente', 'Empleado no disponible.');
  }
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

  // fix A-01/K-06: única fuente de verdad de la zona horaria para el frontend del
  // kiosko (reloj en vivo, fecha larga, formateo de horas). Sin autenticación, igual
  // que `empleados` (dato no sensible, necesario ANTES de introducir el PIN).
  config(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    return { zonaHoraria: deps.config.zonaHoraria };
  },

  entrar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const { empleadoId, pin } = ctx.body || {};
    if (!empleadoId) throw err('EMPLEADO_REQUERIDO', 400, 'falta empleadoId', 'Datos incompletos.');
    // fix S-01: la clave del rate limiter es la IDENTIDAD DEL EMPLEADO atacado, NUNCA
    // `ctx.dispositivo` (cabecera controlada por el cliente, sin validar) — rotarla ya
    // no reinicia la ventana (ver también fichaje.verificarPin/registrarFallo).
    if (!ctx.rate.check(`entrar:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    // fix K-02: un empleado de baja no debe poder autenticarse en el kiosko en absoluto,
    // aunque el PIN sea correcto (antes sólo se bloqueaba en `fichar`).
    const emp = deps.employees.getById(empleadoId);
    if (!emp || emp.activo === false) {
      throw err('EMPLEADO_INVALIDO', 403, 'empleado inactivo o inexistente', 'Empleado no disponible.');
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
    const empleadoId = empleadoDeSesion(deps, ctx);
    return aceptacion.estado(deps, empleadoId);
  },

  aceptarTerminos(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    return aceptacion.aceptar(deps, { empleadoId, origen: 'kiosk' });
  },

  estado(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    return { empleado: empleadoPublico(deps, empleadoId), estado: fichaje.estadoEmpleado(deps, empleadoId) };
  },

  fichar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    // fix S-01: clave server-trusted (empleadoId derivado del token), no `ctx.dispositivo`.
    if (!ctx.rate.check(`fichar:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    return fichaje.fichar(deps, { empleadoId, dispositivo: ctx.dispositivo, origen: 'kiosk', pinVerificado: true });
  },

  misRegistros(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    // fix S-06: antes sin ningún límite de tasa (ver revision/_scripts/07-rate-limit-incompleto.mjs).
    if (!ctx.rate.check(`misRegistros:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    const { desde, hasta } = rangoDefecto(deps, ctx.body);
    return informe.informePorEmpleado(deps, { desde, hasta, empleadoId }); // sólo lo propio
  },

  // fix S-03/K-07: emite un token de DESCARGA de un solo uso y vida corta (distinto del
  // token de sesión), a partir del token de sesión enviado en el BODY de un POST (nunca
  // en la URL). Sólo ese token de descarga —efímero y de un solo uso— viaja en la query
  // del `GET` real de exportar().
  solicitarDescarga(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    if (!ctx.rate.check(`solicitarDescarga:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    return { descargaToken: ctx.descargaTokens.emitir(empleadoId) };
  },

  exportar(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    // fix S-03/K-07: ya NO acepta el token de SESIÓN en la query; exige un token de
    // DESCARGA de un solo uso (emitido por `solicitarDescarga`), consumido aquí mismo.
    const descargaToken = ctx.query?.token;
    const empleadoId = ctx.descargaTokens.consumir(descargaToken);
    if (!empleadoId) {
      throw err('DESCARGA_INVALIDA', 401, 'token de descarga inválido/caducado/ya usado',
        'El enlace de descarga ha caducado. Vuelve a intentarlo.');
    }
    if (!ctx.rate.check(`exportar:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    const inf = informe.informePorEmpleado(deps, { desde, hasta, empleadoId });
    const tz = deps.config.zonaHoraria;
    if (ctx.formato === 'pdf') return { raw: informeAPdf(inf, tz), contentType: 'application/pdf', filename: `mis-horas-${desde}_${hasta}.pdf` };
    return { raw: informeACsv(inf, tz), contentType: 'text/csv; charset=utf-8', filename: `mis-horas-${desde}_${hasta}.csv` };
  },

  crearSolicitud(deps, ctx) {
    requireCanalKiosko(ctx.canal);
    const empleadoId = empleadoDeSesion(deps, ctx);
    // fix S-06: antes sin ningún límite de tasa (500 solicitudes aceptadas en el repro).
    if (!ctx.rate.check(`crearSolicitud:${empleadoId}`)) {
      throw err('RATE', 429, 'rate', 'Demasiadas peticiones. Espera un momento.');
    }
    const { cambio, motivo } = ctx.body || {};
    validarPropiedad(deps, empleadoId, cambio);
    // fix S-04: los metadatos jornada_id/marca_id que se PERSISTEN se derivan del propio
    // `cambio` (el mismo objeto que `validarPropiedad` acaba de validar y que es el único
    // que de verdad se aplica al aprobar) — NUNCA de campos de nivel superior
    // independientes enviados por el cliente, que antes podían referenciar el id de OTRO
    // empleado sin que nada lo detectara (impacto acotado: sólo metadato mostrado al
    // admin, `aplicarCambio` nunca los usa; aun así, se cierra en la causa raíz).
    const jornadaId = cambio?.accion === 'anadir' ? (cambio.jornadaId ?? null) : null;
    const marcaId = cambio?.accion === 'editar' ? (cambio.marcaId ?? null) : null;
    return solicitudes.crear(deps, { empleadoId, cambio, motivo, jornadaId, marcaId });
  },
};

// ---------------------------------------------------------------------------
// MANAGER (rol admin/técnico, del puerto session del host)
// ---------------------------------------------------------------------------
export const manager = {
  hoy(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return hoyService.hoy(deps);
  },

  // fix A-04: el Manager necesita poder elegir un empleado SIN jornadas en el rango
  // (día completamente olvidado) para "Añadir jornada"; a diferencia de `kiosk.empleados`
  // incluye también inactivos (por si hay que corregir una jornada de alguien que ya causó baja).
  empleados(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return deps.employees.list()
      .map((e) => ({ id: e.id, nombre: e.nombre, activo: e.activo !== false }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },

  registros(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    return registros.listarJornadas(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
  },

  editarMarca(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { marcaId, tsNuevo, motivo } = ctx.body || {};
    return registros.editarMarca(deps, {
      marcaId: Number(marcaId), tsNuevo: Number(tsNuevo), motivo,
      actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
    });
  },

  anadirMarca(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { jornadaId, tipo, ts, motivo } = ctx.body || {};
    return registros.anadirMarca(deps, {
      jornadaId: Number(jornadaId), tipo, ts: Number(ts), motivo,
      actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
    });
  },

  // fix A-04: registrar un día SIN NINGUNA marca previa (olvido completo).
  crearJornada(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { empleadoId, entrada, salida, motivo } = ctx.body || {};
    return registros.crearJornadaCompleta(deps, {
      empleadoId, entrada: Number(entrada), salida: Number(salida), motivo,
      actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
    });
  },

  informe(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    return informe.informePorEmpleado(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
  },

  informeExport(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    const { desde, hasta } = rangoDefecto(deps, ctx.query);
    const inf = informe.informePorEmpleado(deps, { desde, hasta, empleadoId: ctx.query?.empleadoId || null });
    const tz = deps.config.zonaHoraria;
    if (ctx.formato === 'pdf') return { raw: informeAPdf(inf, tz), contentType: 'application/pdf', filename: `informe-${desde}_${hasta}.pdf` };
    return { raw: informeACsv(inf, tz), contentType: 'text/csv; charset=utf-8', filename: `informe-${desde}_${hasta}.csv` };
  },

  solicitudes(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.listar(deps, { estado: ctx.query?.estado || null });
  },

  aprobar(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.aprobar(deps, {
      solicitudId: Number(ctx.params.id), actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
      comentario: ctx.body?.comentario || null,
    });
  },

  rechazar(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return solicitudes.rechazar(deps, {
      solicitudId: Number(ctx.params.id), actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol,
      comentario: ctx.body?.comentario || null,
    });
  },

  ajustesGet(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return ajustes.obtener(deps);
  },

  ajustesPut(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return ajustes.guardar(deps, ctx.body || {}, { actorId: ctx.actor.empleadoId, actorRol: ctx.actor.rol });
  },

  // Sólo técnico: verificación de integridad de la auditoría (dato sensible).
  auditoriaVerificar(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ROLES.TECHNICIAN);
    return audit.verificarIntegridad(deps.db);
  },

  // Aceptación de términos del admin/técnico (exigida en el primer acceso).
  terminos(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return aceptacion.estado(deps, ctx.actor.empleadoId);
  },

  aceptarTerminos(deps, ctx) {
    requireCanalManager(ctx.canal); // fix A-08
    requireRol(ctx.actor, ...ADMIN);
    return aceptacion.aceptar(deps, { empleadoId: ctx.actor.empleadoId, actorRol: ctx.actor.rol, origen: 'manager' });
  },
};
