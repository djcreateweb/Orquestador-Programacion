// smoke-test.mjs — Comprobación rápida post-integración. Ejercita el CICLO ESENCIAL
// del módulo y FALLA RUIDOSAMENTE (exit 1) si algo no está. Por defecto usa el entorno
// de referencia (dev/test); para validar la integración REAL, adapta `construirDeps()`
// a los puertos reales de Expira (BD, empleados, pin, session) y ejecútalo contra ella.
//
//   node smoke-test.mjs        (o: npm run smoke)
import { crearReferenceEnv } from './src/dev/reference-env.js';
import { crearModulo } from './src/index.js';
import { kiosk, manager } from './src/http/handlers.js';
import { verificarIntegridad } from './src/services/audit.service.js';
import { esquemaCompleto } from './src/db/migrate.js';

let fallos = 0;
const ok = (cond, msg) => {
  if (cond) { console.log(`  ✓ ${msg}`); }
  else { console.error(`  ✗ FALLA: ${msg}`); fallos++; }
};
const ctx = (m, o = {}) => ({
  actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
  params: o.params ?? {}, dispositivo: 'smoke', rate: m.rate, kioskSessions: m.kioskSessions,
  formato: o.formato, now: m.deps.clock.now,
});

console.log('Presentia · smoke test');
try {
  // Entorno: 1 empleado real + 1 admin (sustituible por los puertos reales de Expira).
  const env = crearReferenceEnv({
    now: Date.UTC(2026, 6, 14, 6, 0),
    empleados: [
      { id: 'emp', nombre: 'Empleado Real', rol: 'empleado', pin: '4826', activo: true },
      { id: 'adm', nombre: 'Admin Real', rol: 'local_admin', pin: '9137', activo: true },
    ],
  });
  const m = crearModulo(env);
  const deps = m.deps;
  const ADM = { actor: { empleadoId: 'adm', rol: 'local_admin' } };
  const RANGO = { desde: '2026-07-01', hasta: '2026-07-31' };

  ok(esquemaCompleto(deps.db), 'migración aplicada (todas las tablas presentia_*)');

  const en = kiosk.entrar(deps, ctx(m, { canal: 'kiosk', body: { empleadoId: 'emp', pin: '4826' } }));
  ok(!!en.token, 'el kiosko autentica por PIN y emite token');

  const fE = kiosk.fichar(deps, ctx(m, { canal: 'kiosk', body: { token: en.token } }));
  ok(fE.tipo === 'entrada' && /^F-\d{4}-\d{4,}$/.test(fE.codigo), `fichaje de ENTRADA con código ${fE.codigo}`);

  env.reloj.avanzar(8 * 3600 * 1000); // +8h
  const en2 = kiosk.entrar(deps, ctx(m, { canal: 'kiosk', body: { empleadoId: 'emp', pin: '4826' } }));
  const fS = kiosk.fichar(deps, ctx(m, { canal: 'kiosk', body: { token: en2.token } }));
  ok(fS.tipo === 'salida' && fS.codigo === fE.codigo, 'fichaje de SALIDA cierra la misma jornada');

  const regs = manager.registros(deps, ctx(m, { ...ADM, query: RANGO }));
  ok(regs.length === 1 && regs[0].minutos === 480, `aparece en Registros con las horas correctas (${regs[0] && regs[0].minutos} min = 8 h)`);

  const inf = manager.informe(deps, ctx(m, { ...ADM, query: RANGO }));
  ok(inf.totalPeriodoTexto === '8 h 0 m', `el informe cuadra (${inf.totalPeriodoTexto})`);

  const emps = kiosk.empleados(deps, ctx(m, { canal: 'kiosk' }));
  ok(Array.isArray(emps) && emps.length >= 1, 'el kiosko carga la lista de empleados');

  ok(verificarIntegridad(deps.db).ok === true, 'la auditoría escribe y su cadena de hash es íntegra');
} catch (e) {
  console.error('  ✗ EXCEPCIÓN:', e && e.message);
  fallos++;
}

if (fallos > 0) { console.error(`\nSMOKE TEST: ${fallos} FALLO(S) — la integración NO es correcta.`); process.exit(1); }
console.log('\nSMOKE TEST: OK — el ciclo esencial funciona.');
