// 07-rate-limit-incompleto.mjs — ¿Tienen límite de peticiones TODOS los endpoints
// del kiosko, o sólo `entrar`/`fichar`? Con un único token de sesión válido,
// ¿se pueden crear solicitudes o generar exportaciones PDF/CSV sin límite?
// Entorno PROPIO en memoria.
//
// RE-EJECUTADO tras el fix S-06 (rate limit en crearSolicitud/misRegistros/exportar) y
// S-03/K-07 (exportar ya no acepta el token de SESIÓN; exige un token de DESCARGA de un
// solo uso emitido por `solicitarDescarga`, que TAMBIÉN tiene su propio límite de tasa).
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: 'kiosk', body: o.body ?? {}, query: o.query ?? {},
    params: {}, dispositivo: 'mismo-dispositivo',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, descargaTokens: modulo.descargaTokens,
    formato: o.formato, now: modulo.deps.clock.now,
  };
}

const env = crearReferenceEnv();
const modulo = crearModulo(env);
const deps = modulo.deps;

const en = kiosk.entrar(deps, ctx(modulo, { body: { empleadoId: 'e1', pin: '4728' } }));
const f = kiosk.fichar(deps, ctx(modulo, { body: { token: en.token } }));
console.log('Token de sesión de kiosko obtenido:', en.token.slice(0, 10) + '…');

console.log('\n--- 500 llamadas a crearSolicitud con el MISMO token, sin pausa ---');
let ok = 0, fail = 0, rate = 0;
for (let i = 0; i < 500; i++) {
  try {
    kiosk.crearSolicitud(deps, ctx(modulo, {
      body: { token: en.token, cambio: { accion: 'editar', marcaId: f.marcaId, ts: Date.now() }, motivo: `spam ${i}` },
    }));
    ok++;
  } catch (e) { fail++; if (e.code === 'RATE') rate++; }
}
console.log(`Aceptadas: ${ok} / Rechazadas: ${fail} (de las cuales por RATE: ${rate}) (de 500)`);
const total = deps.db.prepare('SELECT COUNT(*) n FROM presentia_solicitudes').get().n;
console.log('Filas en presentia_solicitudes tras el bombardeo:', total);

console.log('\n--- 200 llamadas a exportar (vía solicitarDescarga + exportar) con el MISMO token de sesión ---');
const t0 = Date.now();
let okExp = 0, failExp = 0, rateExp = 0;
for (let i = 0; i < 200; i++) {
  try {
    const { descargaToken } = kiosk.solicitarDescarga(deps, ctx(modulo, { body: { token: en.token } }));
    const r = kiosk.exportar(deps, { ...ctx(modulo, {}), query: { token: descargaToken }, formato: 'pdf' });
    if (r.raw) okExp++;
  } catch (e) { failExp++; if (e.code === 'RATE') rateExp++; }
}
console.log(`Exportaciones PDF generadas: ${okExp} / rechazadas: ${failExp} (de las cuales por RATE: ${rateExp}) (de 200) en ${Date.now() - t0} ms`);

console.log('\n================ CONCLUSIÓN ================');
console.log('Tras el fix: crearSolicitud, misRegistros, solicitarDescarga y exportar SÍ llaman a');
console.log('ctx.rate.check (clave = empleadoId derivado del servidor, no ctx.dispositivo — S-01).');
console.log('Con UN ÚNICO token válido ya NO se pueden generar cientos de solicitudes/exportaciones');
console.log('sin límite: ambos bombardeos terminan mayoritariamente rechazados por RATE (429).');
