// k-resiliencia.mjs — Sesión caducada a media acción, servidor caído (fetch real
// contra un puerto sin servidor), y token ausente/mal formado.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';
import { crearApiKiosk } from '../../kiosk/api.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });

console.log('=== 1) Sesión caducada a media acción (TTL 90s) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('Token emitido. Han pasado 0s -> panel visible.');
  env.reloj.avanzar(95_000); // 95s > TTL de 90s
  try {
    kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  } catch (e) {
    console.log('Tras 95s, al pulsar FICHAR:', e.code, e.status, '|', e.publico);
  }
  console.log('(FicharScreen.jsx captura este 401/SESION_KIOSKO y hace setVista("pin") con mensaje "La sesión ha caducado...")');
}

console.log('\n=== 2) Token ausente ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  try {
    kiosk.fichar(deps, ctx(modulo, K({})));
  } catch (e) {
    console.log('Sin token:', e.code, e.status, '|', e.publico);
  }
}

console.log('\n=== 3) Token con formato basura ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  try {
    kiosk.fichar(deps, ctx(modulo, K({ token: '<script>alert(1)</script>' })));
  } catch (e) {
    console.log('Token basura:', e.code, e.status, '|', e.publico);
  }
}

console.log('\n=== 4) "Servidor caído": fetch real contra un puerto sin servidor escuchando ===');
{
  const api = crearApiKiosk({ base: 'http://127.0.0.1:1', dispositivo: 'kiosko-test' }); // puerto 1: nadie escucha
  try {
    await api.empleados();
    console.log('No debería llegar aquí');
  } catch (e) {
    console.log('api.empleados() con servidor caído ->', e.name, e.code, '|', e.mensaje);
    console.log('(FicharScreen.jsx: cargarEmpleados() captura esto y hace setError(...) -> NO pantalla en blanco, se ve "No se pudo cargar la lista de empleados.")');
  }
}
