// fastify-adapter.js — Registra los handlers en la instancia Fastify que aporta
// Expira. No importa Fastify (la recibe como argumento) ⇒ cero dependencia nueva.
// Errores → JSON genérico (§6.5); nunca se filtran datos sensibles a los logs.
import { kiosk, manager } from './handlers.js';
import { ErrorPresentia } from '../errors.js';

/**
 * @param {object} fastify instancia Fastify de Expira
 * @param {{deps:object, rate:object, kioskSessions:object}} modulo (de crearModulo)
 * @param {{prefix?:string}} [opts]
 */
export function registrarFastify(fastify, modulo, opts = {}) {
  const { deps, rate, kioskSessions, descargaTokens } = modulo;
  const base = opts.prefix || '/presentia';

  function construirCtx(req, canal, formato) {
    return {
      actor: deps.session.resolve(req) || null,
      canal,
      params: req.params || {},
      query: req.query || {},
      body: req.body || {},
      dispositivo: (req.headers && req.headers['x-presentia-dispositivo']) || 'desconocido',
      rate, kioskSessions, descargaTokens, formato,
      now: deps.clock.now,
    };
  }

  function run(handler, canal, formato) {
    return async (req, reply) => {
      try {
        const r = handler(deps, construirCtx(req, canal, formato));
        if (r && r.raw !== undefined) {
          reply.header('Content-Type', r.contentType);
          reply.header('Content-Disposition', `attachment; filename="${r.filename}"`);
          return reply.send(r.raw);
        }
        return reply.send({ ok: true, data: r });
      } catch (e) {
        const esApp = e instanceof ErrorPresentia;
        const status = esApp ? e.status : 500;
        const code = esApp ? e.code : 'ERROR';
        const mensaje = esApp ? e.publico : 'Error interno.';
        if (status >= 500 && req.log) req.log.error({ code, msg: e.message }, 'presentia error'); // sin PII
        return reply.code(status).send({ ok: false, error: { code, mensaje } });
      }
    };
  }

  // --- Kiosko ---
  fastify.get(`${base}/kiosk/empleados`, run(kiosk.empleados, 'kiosk'));
  fastify.get(`${base}/kiosk/config`, run(kiosk.config, 'kiosk'));
  fastify.post(`${base}/kiosk/entrar`, run(kiosk.entrar, 'kiosk'));
  fastify.post(`${base}/kiosk/estado`, run(kiosk.estado, 'kiosk'));
  fastify.post(`${base}/kiosk/fichar`, run(kiosk.fichar, 'kiosk'));
  fastify.post(`${base}/kiosk/mis-registros`, run(kiosk.misRegistros, 'kiosk'));
  // fix S-03/K-07: token de DESCARGA de un solo uso (nunca el token de sesión en la URL).
  fastify.post(`${base}/kiosk/mis-horas/token`, run(kiosk.solicitarDescarga, 'kiosk'));
  fastify.get(`${base}/kiosk/mis-horas.csv`, run(kiosk.exportar, 'kiosk', 'csv'));
  fastify.get(`${base}/kiosk/mis-horas.pdf`, run(kiosk.exportar, 'kiosk', 'pdf'));
  fastify.post(`${base}/kiosk/solicitud`, run(kiosk.crearSolicitud, 'kiosk'));
  fastify.post(`${base}/kiosk/terminos`, run(kiosk.terminos, 'kiosk'));
  fastify.post(`${base}/kiosk/terminos/aceptar`, run(kiosk.aceptarTerminos, 'kiosk'));

  // --- Manager ---
  fastify.get(`${base}/manager/hoy`, run(manager.hoy, 'manager'));
  fastify.get(`${base}/manager/empleados`, run(manager.empleados, 'manager'));
  fastify.get(`${base}/manager/registros`, run(manager.registros, 'manager'));
  fastify.post(`${base}/manager/registros/marca/editar`, run(manager.editarMarca, 'manager'));
  fastify.post(`${base}/manager/registros/marca/anadir`, run(manager.anadirMarca, 'manager'));
  fastify.post(`${base}/manager/registros/jornada`, run(manager.crearJornada, 'manager'));
  fastify.get(`${base}/manager/informe`, run(manager.informe, 'manager'));
  fastify.get(`${base}/manager/informe.csv`, run(manager.informeExport, 'manager', 'csv'));
  fastify.get(`${base}/manager/informe.pdf`, run(manager.informeExport, 'manager', 'pdf'));
  fastify.get(`${base}/manager/solicitudes`, run(manager.solicitudes, 'manager'));
  fastify.post(`${base}/manager/solicitudes/:id/aprobar`, run(manager.aprobar, 'manager'));
  fastify.post(`${base}/manager/solicitudes/:id/rechazar`, run(manager.rechazar, 'manager'));
  fastify.get(`${base}/manager/ajustes`, run(manager.ajustesGet, 'manager'));
  fastify.put(`${base}/manager/ajustes`, run(manager.ajustesPut, 'manager'));
  fastify.get(`${base}/manager/auditoria/verificar`, run(manager.auditoriaVerificar, 'manager'));
  fastify.get(`${base}/manager/terminos`, run(manager.terminos, 'manager'));
  fastify.post(`${base}/manager/terminos/aceptar`, run(manager.aceptarTerminos, 'manager'));
}
