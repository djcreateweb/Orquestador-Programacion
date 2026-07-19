// k-inactivo-alcance.mjs — ¿Hasta dónde llega un empleado INACTIVO (baja) con su PIN?
//
// RE-EJECUTADO tras el fix K-02: `entrar` ahora comprueba `activo` de raíz (antes de
// emitir ningún token) y `empleadoDeSesion` (usada por estado/terminos/aceptarTerminos/
// misRegistros/crearSolicitud/fichar/exportar) también lo comprueba, para el caso de que
// la baja ocurra DESPUÉS de emitido un token, dentro de los 90s de vida de la sesión.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, descargaTokens: modulo.descargaTokens,
    formato: o.formato, now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });

console.log('=== CASO 1: el empleado YA estaba inactivo antes de intentar entrar ===');
{
  const env = crearReferenceEnv({
    empleados: [{ id: 'e9', nombre: 'Baja Reciente', rol: 'empleado', pin: '1357', activo: false }],
  });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  try {
    const entrar = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e9', pin: '1357' })));
    console.log('kiosk.entrar (INESPERADO, debería haber lanzado):', JSON.stringify(entrar));
  } catch (e) {
    console.log('kiosk.entrar RECHAZADO de raíz (ya no se emite ningún token):', e.code, e.status, e.publico);
  }
}

console.log('\n=== CASO 2: el empleado causa baja DURANTE una sesión ya emitida (dentro de los 90s) ===');
{
  const env = crearReferenceEnv({
    empleados: [{ id: 'e9', nombre: 'Baja Reciente', rol: 'empleado', pin: '1357', activo: true }],
  });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const entrar = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e9', pin: '1357' })));
  console.log('kiosk.entrar mientras estaba activo: token emitido =', !!entrar.token);

  env.empleadosById.get('e9').activo = false; // Expira marca la baja en su propio almacén
  console.log('(la baja ocurre ahora; el token de sesión sigue "vivo" durante 90s más)');

  for (const [nombre, fn] of [
    ['estado', () => kiosk.estado(deps, ctx(modulo, K({ token: entrar.token })))],
    ['terminos', () => kiosk.terminos(deps, ctx(modulo, K({ token: entrar.token })))],
    ['aceptarTerminos', () => kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: entrar.token })))],
    ['misRegistros', () => kiosk.misRegistros(deps, ctx(modulo, K({ token: entrar.token, desde: '2026-01-01', hasta: '2026-12-31' })))],
    ['solicitarDescarga', () => kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: entrar.token })))],
    ['crearSolicitud', () => kiosk.crearSolicitud(deps, ctx(modulo, K({ token: entrar.token, cambio: { accion: 'anadir' }, motivo: 'prueba baja' })))],
    ['fichar', () => kiosk.fichar(deps, ctx(modulo, K({ token: entrar.token })))],
  ]) {
    try {
      const r = fn();
      console.log(`${nombre}: INESPERADO, no debería permitirse ->`, JSON.stringify(r));
    } catch (e) {
      console.log(`${nombre}: RECHAZADO ->`, e.code, e.status, e.publico);
    }
  }
}

console.log('\n>>> RESUMEN: tras el fix K-02, un empleado inactivo NO puede autenticarse en el kiosko');
console.log('    (entrar rechaza de raíz), y si la baja ocurre a mitad de una sesión ya emitida,');
console.log('    TODAS las acciones autenticadas quedan bloqueadas, no sólo "fichar".');
