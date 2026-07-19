// 04-informe.mjs — Verificación independiente de INFORME DE HORAS: cálculo manual,
// redondeo, total del periodo, y exportaciones CSV/PDF (tildes, inyección de fórmulas, PIN/hash).
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import { formatearDuracion } from '../../src/domain/jornadas.js';
import { primerDiaDelMes, ultimoDiaDelMes } from '../../src/domain/time.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'script', rate: modulo.rate,
    kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

const RANGO = { desde: '2026-07-01', hasta: '2026-07-31' };

// --- Caso 1: horas verificadas A MANO (turno con pausa de comida) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;

  // e1: 08:00 entrada, 13:00 salida (comer), 14:00 vuelta, 17:30 salida => 5h + 3h30 = 8h30 = 510 min
  const tsBase = env.reloj.now();
  const marcas = [
    ['entrada', 0], ['salida', 5 * 3600000], ['entrada', 6 * 3600000], ['salida', 9.5 * 3600000],
  ];
  for (const [tipo, offset] of marcas) {
    env.reloj.set(tsBase + offset);
    const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
    const r = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
    assert(r.tipo === tipo, `marca esperada ${tipo} obtenida ${r.tipo} (offset ${offset})`);
  }

  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  const emp = inf.empleados.find(e => e.empleadoId === 'e1');
  const minutosEsperadosAMano = (5 * 60) + (3.5 * 60); // 300 + 210 = 510
  assert(emp.totalMinutos === minutosEsperadosAMano, `total minutos calculado a mano (${minutosEsperadosAMano}) === servicio (${emp.totalMinutos})`);
  assert(emp.jornadas[0].textoHoras === '8 h 30 m', `formato "168 h 30 m" -> obtenido "${emp.jornadas[0].textoHoras}" para 8h30m`);
  assert(inf.totalPeriodoMinutos === minutosEsperadosAMano, 'totalPeriodoMinutos coincide con la suma manual (único empleado)');
  assert(inf.totalPeriodoTexto === '8 h 30 m', `totalPeriodoTexto formateado correctamente (obtenido "${inf.totalPeriodoTexto}")`);
}

// --- Caso 2: redondeo (127 min con redondeo a 15 -> 120; verificar a mano) ---
{
  const env = crearReferenceEnv({ config: { redondeoMin: 15 } });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const tsBase = env.reloj.now();
  env.reloj.set(tsBase);
  let en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  env.reloj.set(tsBase + 127 * 60000); // 127 minutos después
  en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));

  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  const emp = inf.empleados.find(e => e.empleadoId === 'e1');
  assert(emp.jornadas[0].minutos === 127, `minutos SIN redondear = 127 (obtenido ${emp.jornadas[0].minutos})`);
  const esperadoRedondeo = Math.round(127 / 15) * 15; // 120
  assert(emp.jornadas[0].minutosRedondeados === esperadoRedondeo, `127 min con redondeo=15 -> ${esperadoRedondeo} (obtenido ${emp.jornadas[0].minutosRedondeados})`);
  assert(inf.totalPeriodoMinutos === esperadoRedondeo, 'el TOTAL del periodo usa el valor REDONDEADO, no el crudo');
}

// --- Caso 3: Total del periodo == SUMA DE FILAS (multi-empleado) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  function turno(id, pin, horas) {
    const en1 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: id, pin } }));
    kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en1.token } }));
    env.reloj.avanzar(horas * 3600000);
    const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: id, pin } }));
    kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));
  }
  turno('e1', '4728', 8);
  turno('e2', '6410', 6.5);
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  const sumaManual = inf.empleados.reduce((a, e) => a + e.totalMinutosRedondeados, 0);
  assert(inf.totalPeriodoMinutos === sumaManual, `total del periodo (${inf.totalPeriodoMinutos}) === suma manual de filas (${sumaManual})`);
}

// --- Caso 4: rango por defecto == el mes (comparado con cálculo independiente) ---
{
  const env = crearReferenceEnv(); // reloj fijo en 2026-07-13
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: {} })); // sin desde/hasta
  const esperadoDesde = primerDiaDelMes(env.reloj.now(), 'Europe/Madrid');
  const esperadoHasta = ultimoDiaDelMes(env.reloj.now(), 'Europe/Madrid');
  assert(inf.desde === esperadoDesde && inf.hasta === esperadoHasta,
    `rango por defecto = mes en curso (esperado ${esperadoDesde}..${esperadoHasta}, obtenido ${inf.desde}..${inf.hasta})`);
  assert(inf.desde === '2026-07-01' && inf.hasta === '2026-07-31', 'julio 2026 tiene 31 días, el rango por defecto los cubre completos');
}

// --- Caso 5: CSV — tildes, tipos con acentos, NO fórmulas, NO PIN/hash ---
{
  const env = crearReferenceEnv({ empleados: [
    { id: 'e1', nombre: '=1+2 Ñoño Muñíz', rol: 'empleado', pin: '4728', activo: true },
  ] });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  env.reloj.avanzar(3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));

  const csvRes = manager.informeExport(deps, ctx(modulo, { actor: ADMIN, query: RANGO, formato: 'csv' }));
  const texto = csvRes.raw; // string (informeACsv devuelve string, no Buffer)
  console.log('INFO: primera línea de datos del CSV:', texto.split('\r\n')[1]);
  assert(texto.startsWith('﻿'), 'CSV incluye BOM UTF-8 al inicio');
  assert(texto.includes('Muñíz'), 'CSV conserva tildes/ñ del nombre del empleado');
  assert(!/4728|scrypt\$|pinHash/.test(texto), 'CSV NO contiene PIN, hash ni pinHash');
  // el nombre empieza por "=" -> debe quedar neutralizado con apóstrofo inicial
  const celdaNombre = texto.split('\r\n')[1].split(';')[0];
  assert(celdaNombre.startsWith("'="), `celda con fórmula neutralizada con apóstrofo inicial (obtenido: ${celdaNombre})`);

  const pdfRes = manager.informeExport(deps, ctx(modulo, { actor: ADMIN, query: RANGO, formato: 'pdf' }));
  assert(Buffer.isBuffer(pdfRes.raw), 'PDF export es un Buffer');
  assert(pdfRes.raw.subarray(0, 5).toString('latin1') === '%PDF-', 'PDF empieza con cabecera %PDF-');
  const pdfTexto = pdfRes.raw.toString('latin1');
  assert(!/4728|scrypt\$/.test(pdfTexto), 'PDF NO contiene PIN ni hash en claro');
  // Comprobar que el nombre (con tilde) aparece codificado en WinAnsi/latin1 dentro del stream
  const nombreLatin1 = Buffer.from('Muñíz', 'latin1').toString('latin1');
  assert(pdfTexto.includes('Muñíz'.normalize()), 'PDF contiene el nombre con tildes preservadas (codificación WinAnsi/latin1)');
}

console.log('--- fin 04-informe.mjs ---');
