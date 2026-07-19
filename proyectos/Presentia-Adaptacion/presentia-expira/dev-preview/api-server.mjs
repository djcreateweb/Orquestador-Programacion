// api-server.mjs — Servidor de API SOLO para previsualización local (dev).
// Usa el BACKEND REAL del módulo (mismos handlers y servicios) sobre el entorno de
// referencia (SQLite en memoria + empleados de demo con PIN). NO es producción:
// la sesión del Manager se resuelve a un admin fijo para poder ver la UI.
import http from 'node:http';
import { crearReferenceEnv } from '../src/dev/reference-env.js';
import { crearModulo } from '../src/index.js';
import { kiosk, manager } from '../src/http/handlers.js';
import * as fichaje from '../src/services/fichaje.service.js';
import * as solicitudes from '../src/services/solicitudes.service.js';
import * as repos from '../src/services/repos.js';
import { fechaJornada } from '../src/domain/time.js';

const PORT = 8787;

// Entorno con RELOJ REAL (para el reloj vivo del kiosko y KPIs "de hoy").
const env = crearReferenceEnv();
env.clock = { now: () => Date.now() };
const modulo = crearModulo(env);
const deps = modulo.deps;

// --- Datos de demostración: un MES completo para todos los empleados --------
function ficharEn(empleadoId, ts) {
  const d = { ...deps, clock: { now: () => ts } };
  return fichaje.fichar(d, { empleadoId, dispositivo: 'seed', origen: 'manager', pinVerificado: true });
}

const EMPLEADOS = ['e1', 'e2', 'a1', 't1'];

(function sembrar() {
  const ref = new Date();
  const Y = ref.getFullYear(), M = ref.getMonth(), HOY = ref.getDate();
  const diasEnMes = new Date(Y, M + 1, 0).getDate();
  const esLaborable = (dia) => { const w = new Date(Y, M, dia).getDay(); return w !== 0 && w !== 6; };
  const tsAt = (dia, hh, mm) => new Date(Y, M, dia, hh, mm, 0, 0).getTime();
  const iso = (dia) => `${Y}-${String(M + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  try {
    // Jornadas: cada día laborable (L-V), ~8 h con pausa de comida, para todos.
    for (let dia = 1; dia <= diasEnMes; dia++) {
      if (!esLaborable(dia)) continue;
      for (const emp of EMPLEADOS) {
        if (dia === HOY && emp === 'e2') { ficharEn(emp, tsAt(dia, 9, 30)); continue; } // hoy: Bruno "dentro"
        ficharEn(emp, tsAt(dia, 8, 0));   // entrada
        ficharEn(emp, tsAt(dia, 13, 0));  // salida a comer
        ficharEn(emp, tsAt(dia, 14, 0));  // vuelta
        ficharEn(emp, tsAt(dia, 17, 0));  // salida  => 5h + 3h = 8h
      }
    }

    // Solicitudes variadas (pendientes / aprobadas / rechazadas).
    const jorn = (emp, dia) => repos.jornadaDe(deps.db, emp, iso(dia));
    function crearSol(emp, dia, accion, motivo) {
      const j = jorn(emp, dia); if (!j) return null;
      let cambio;
      if (accion === 'anadir') cambio = { accion: 'anadir', jornadaId: j.id, tipo: 'entrada', ts: tsAt(dia, 18, 30) };
      else { const ms = repos.marcasDeJornada(deps.db, j.id); if (!ms.length) return null; cambio = { accion: 'editar', marcaId: ms[0].id, ts: ms[0].ts + 15 * 60000 }; }
      return solicitudes.crear(deps, { empleadoId: emp, jornadaId: j.id, cambio, motivo });
    }
    const aprobar = (s) => s && solicitudes.aprobar(deps, { solicitudId: s.id, actorId: 'a1', actorRol: 'local_admin', comentario: 'Verificado con el encargado' });
    const rechazar = (s) => s && solicitudes.rechazar(deps, { solicitudId: s.id, actorId: 'a1', actorRol: 'local_admin', comentario: 'No procede / sin justificación' });

    // días laborables disponibles para colgar solicitudes
    const labs = []; for (let d = 1; d <= diasEnMes; d++) if (esLaborable(d)) labs.push(d);
    let i = 0; const dia = () => labs[(i++) % labs.length];
    // pendientes (4)
    crearSol('e1', dia(), 'anadir', 'Olvidé fichar la salida');
    crearSol('e2', dia(), 'editar', 'La hora de entrada quedó mal');
    crearSol('a1', dia(), 'anadir', 'Entré tarde por una reunión externa');
    crearSol('t1', dia(), 'editar', 'Ajuste por desfase del reloj del kiosko');
    // aprobadas (3) -> 'editar' conserva el valor original y marca "editado"
    aprobar(crearSol('e1', dia(), 'editar', 'Corrección de la hora de salida'));
    aprobar(crearSol('e2', dia(), 'editar', 'Corrección validada por RRHH'));
    aprobar(crearSol('t1', dia(), 'editar', 'Ajuste aprobado')); // no 'a1': fix K-03, un admin no puede autoaprobarse
    // rechazadas (3)
    rechazar(crearSol('t1', dia(), 'anadir', 'Solicitud duplicada'));
    rechazar(crearSol('e1', dia(), 'anadir', 'Sin justificación suficiente'));
    rechazar(crearSol('e2', dia(), 'editar', 'Fuera de plazo'));
  } catch (e) { console.error('seed:', e.message); }
})();

// --- Enrutado (mismos handlers que el adaptador Fastify) --------------------
const RUTAS = [
  ['GET', '/kiosk/empleados', kiosk.empleados, 'kiosk'],
  ['GET', '/kiosk/config', kiosk.config, 'kiosk'],
  ['POST', '/kiosk/entrar', kiosk.entrar, 'kiosk'],
  ['POST', '/kiosk/estado', kiosk.estado, 'kiosk'],
  ['POST', '/kiosk/fichar', kiosk.fichar, 'kiosk'],
  ['POST', '/kiosk/mis-registros', kiosk.misRegistros, 'kiosk'],
  ['POST', '/kiosk/mis-horas/token', kiosk.solicitarDescarga, 'kiosk'],
  ['GET', '/kiosk/mis-horas.csv', kiosk.exportar, 'kiosk', 'csv'],
  ['GET', '/kiosk/mis-horas.pdf', kiosk.exportar, 'kiosk', 'pdf'],
  ['POST', '/kiosk/solicitud', kiosk.crearSolicitud, 'kiosk'],
  ['POST', '/kiosk/terminos', kiosk.terminos, 'kiosk'],
  ['POST', '/kiosk/terminos/aceptar', kiosk.aceptarTerminos, 'kiosk'],
  ['GET', '/manager/hoy', manager.hoy, 'manager'],
  ['GET', '/manager/empleados', manager.empleados, 'manager'],
  ['GET', '/manager/registros', manager.registros, 'manager'],
  ['POST', '/manager/registros/marca/editar', manager.editarMarca, 'manager'],
  ['POST', '/manager/registros/marca/anadir', manager.anadirMarca, 'manager'],
  ['POST', '/manager/registros/jornada', manager.crearJornada, 'manager'],
  ['GET', '/manager/informe', manager.informe, 'manager'],
  ['GET', '/manager/informe.csv', manager.informeExport, 'manager', 'csv'],
  ['GET', '/manager/informe.pdf', manager.informeExport, 'manager', 'pdf'],
  ['GET', '/manager/solicitudes', manager.solicitudes, 'manager'],
  ['GET', '/manager/ajustes', manager.ajustesGet, 'manager'],
  ['PUT', '/manager/ajustes', manager.ajustesPut, 'manager'],
  ['GET', '/manager/terminos', manager.terminos, 'manager'],
  ['POST', '/manager/terminos/aceptar', manager.aceptarTerminos, 'manager'],
];

function resolver(method, p) {
  for (const [m, seg, handler, canal, formato] of RUTAS) {
    if (m === method && seg === p) return { handler, canal, formato, params: {} };
  }
  let mm;
  if (method === 'POST' && (mm = p.match(/^\/manager\/solicitudes\/([^/]+)\/(aprobar|rechazar)$/))) {
    return { handler: mm[2] === 'aprobar' ? manager.aprobar : manager.rechazar, canal: 'manager', params: { id: mm[1] } };
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/presentia/')) { res.writeHead(404); res.end('not found'); return; }
  const p = url.pathname.slice('/presentia'.length);

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw) { try { body = JSON.parse(raw); } catch { body = {}; } }
  }
  const query = Object.fromEntries(url.searchParams.entries());
  const ruta = resolver(req.method, p);
  if (!ruta) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":{"code":"NO_RUTA","mensaje":"Ruta no encontrada"}}'); return; }

  // DEV: el Manager se autentica como admin fijo (o técnico si ?rol=technician).
  const actor = ruta.canal === 'manager'
    ? (query.rol === 'technician' ? { empleadoId: 't1', rol: 'technician' } : { empleadoId: 'a1', rol: 'local_admin' })
    : null;
  const ctx = {
    actor, canal: ruta.canal, body, query, params: ruta.params,
    dispositivo: req.headers['x-presentia-dispositivo'] || 'kiosko-demo-1',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, descargaTokens: modulo.descargaTokens,
    formato: ruta.formato, now: deps.clock.now,
  };
  try {
    const r = ruta.handler(deps, ctx);
    if (r && r.raw !== undefined) {
      res.writeHead(200, { 'Content-Type': r.contentType, 'Content-Disposition': `attachment; filename="${r.filename}"` });
      res.end(r.raw); return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, data: r }));
  } catch (e) {
    const status = e.status || 500;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: { code: e.code || 'ERROR', mensaje: e.publico || 'Error interno.' } }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[presentia] API de preview en http://127.0.0.1:${PORT}  (empleados demo: Ana/e1 PIN 4728, Bruno/e2 PIN 6410, Laura/a1 admin, Tec/t1)`);
});
