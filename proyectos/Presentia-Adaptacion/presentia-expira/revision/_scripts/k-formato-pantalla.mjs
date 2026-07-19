// k-formato-pantalla.mjs — Fecha larga en español, formato de hora, estado real.
import { fmtReloj, fmtFechaLarga, fmtHora, iniciales } from '../../kiosk/api.js';
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'kiosk', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, formato: o.formato,
    now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });

const fecha = new Date(Date.UTC(2026, 6, 13, 8, 5, 30)); // lunes 13 julio 2026, 10:05:30 Madrid (verano)
console.log('fmtReloj:', fmtReloj(fecha, 'Europe/Madrid'));
console.log('fmtFechaLarga:', fmtFechaLarga(fecha, 'Europe/Madrid'));
console.log('fmtHora(ts):', fmtHora(fecha.getTime(), 'Europe/Madrid'));
console.log('iniciales("Ana García"):', iniciales('Ana García'));
console.log('iniciales(undefined):', JSON.stringify(iniciales(undefined)));

console.log('\n=== Estado real "fuera" / "dentro desde HH:MM" ===');
{
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 8, 0, 0) });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('Antes de fichar: dentro=', en1.estado.dentro, ' siguienteTipo=', en1.estado.siguienteTipo, '(esperado: fuera / entrada)');
  kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  env.reloj.avanzar(2 * 3600 * 1000 + 15 * 60 * 1000); // +2h15m
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('Tras fichar y +2h15m: dentro=', en2.estado.dentro, ' desde=', fmtHora(en2.estado.desde, 'Europe/Madrid'), ' siguienteTipo=', en2.estado.siguienteTipo);
  console.log('(Panel mostraría: "Dentro desde ' + fmtHora(en2.estado.desde, 'Europe/Madrid') + '" y botón "FICHAR SALIDA" en rojo)');
}
