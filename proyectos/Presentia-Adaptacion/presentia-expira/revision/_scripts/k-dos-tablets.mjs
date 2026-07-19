// k-dos-tablets.mjs — Dos "tablets" (dos sesiones/tokens distintos) ficha casi
// simultánea para el MISMO empleado. ¿Se crean dos jornadas? ¿Qué pasa con el 2º toque?
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';
import * as repos from '../../src/services/repos.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo,
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body, dispositivo) => ({ canal: 'kiosk', body, dispositivo });

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

// Tablet A y Tablet B: el empleado se loguea en las dos casi a la vez (antes de fichar en ninguna).
const enA = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' }, 'tablet-A')));
const enB = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' }, 'tablet-B')));
console.log('Tablet A al loguear ve siguienteTipo =', enA.estado.siguienteTipo);
console.log('Tablet B al loguear ve siguienteTipo =', enB.estado.siguienteTipo);

// Ambas pulsan "fichar" casi a la vez (mismo "now", sin avanzar reloj entre medias).
const fA = kiosk.fichar(deps, ctx(modulo, K({ token: enA.token }, 'tablet-A')));
console.log('Tablet A ficha ->', JSON.stringify(fA));
const fB = kiosk.fichar(deps, ctx(modulo, K({ token: enB.token }, 'tablet-B')));
console.log('Tablet B ficha (inmediatamente después) ->', JSON.stringify(fB));

const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas WHERE empleado_id=?').get('e1').n;
console.log('Total de jornadas creadas para e1:', totalJornadas, '(esperado: 1 -> el esquema tiene UNIQUE(empleado_id,fecha))');

const marcas = repos.marcasDeJornada(deps.db, fA.jornadaId);
console.log('Marcas de esa jornada:', JSON.stringify(marcas.map(m => ({ tipo: m.tipo, ts: m.ts, dispositivo: m.dispositivo }))));

console.log('\n>>> DIAGNÓSTICO: no se duplica la jornada (protegido por UNIQUE + ejecución síncrona sin race real),');
console.log('    PERO el 2º toque (Tablet B), al no haber ninguna ventana anti-rebote en servidor,');
console.log('    se interpretó como SALIDA inmediata (0 min) en vez de avisar "ya se ha fichado hace un instante".');
