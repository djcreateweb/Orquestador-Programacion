// 04-idor-solicitud-metadata.mjs — Comprueba si los campos de nivel superior
// `jornadaId`/`marcaId` de kiosk.crearSolicitud (que NO forman parte de `cambio`,
// el único objeto validado por validarPropiedad) pueden rellenarse con
// identificadores de OTRO empleado sin que el servidor los valide.
// Entorno PROPIO en memoria.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-test',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

// e2 ficha primero (crea su propia jornada/marca).
const en2 = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e2', pin: '6410' } }));
const f2 = kiosk.fichar(deps, ctx(modulo, { body: { token: en2.token } }));
console.log('Jornada/marca de e2 (ajena a e1):', { jornadaId: f2.jornadaId, marcaId: f2.marcaId });

// e1 ficha para tener SU PROPIA marca válida (usada dentro de `cambio`, que sí se valida).
const en1 = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin: '4728' } }));
const f1 = kiosk.fichar(deps, ctx(modulo, { body: { token: en1.token } }));
console.log('Jornada/marca de e1 (propia):', { jornadaId: f1.jornadaId, marcaId: f1.marcaId });

console.log('\n--- e1 crea una solicitud: `cambio` referencia SU PROPIA marca (pasa validarPropiedad),');
console.log('    pero los campos de nivel superior jornadaId/marcaId apuntan a la jornada/marca de e2 ---');
const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
  body: {
    token: en1.token,
    // `cambio` (el único validado): referencia la marca PROPIA de e1.
    cambio: { accion: 'editar', marcaId: f1.marcaId, ts: Date.now() },
    motivo: 'prueba de metadatos no validados',
    // Campos de nivel superior (NO validados por validarPropiedad, van directos a la fila):
    jornadaId: f2.jornadaId,
    marcaId: f2.marcaId,
  },
}));

console.log('\nSolicitud creada (fila en presentia_solicitudes):');
const filaCruda = deps.db.prepare('SELECT id, empleado_id, jornada_id, marca_id, cambio FROM presentia_solicitudes WHERE id = ?').get(sol.id);
console.log(filaCruda);

console.log('\n¿jornada_id almacenado pertenece a e2 (ajeno)?', filaCruda.jornada_id === f2.jornadaId);
console.log('¿marca_id almacenado pertenece a e2 (ajeno)?', filaCruda.marca_id === f2.marcaId);
console.log('¿El objeto `cambio` (el que SÍ se aplica al aprobar) referencia la marca propia de e1?',
  JSON.parse(filaCruda.cambio).marcaId === f1.marcaId);

console.log('\n================ CONCLUSIÓN ================');
console.log('validarPropiedad() sólo valida los ids EMBEBIDOS en `cambio` (los que aplicarCambio usa');
console.log('realmente al aprobar). Los campos jornada_id/marca_id de nivel superior de la tabla');
console.log('presentia_solicitudes (usados sólo como metadato/visualización en el Manager) se guardan');
console.log('SIN comprobar que pertenezcan al empleado solicitante. No permite escribir/alterar datos');
console.log('ajenos (aplicarCambio ignora estos campos), pero sí permite a un empleado "etiquetar"');
console.log('su solicitud con la jornada/marca de OTRO empleado, lo que puede inducir a error al');
console.log('administrador que revisa la lista de Solicitudes.');
