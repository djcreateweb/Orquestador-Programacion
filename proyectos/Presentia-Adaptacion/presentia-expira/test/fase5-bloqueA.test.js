// fase5-bloqueA.test.js — Regresión FASE 5 · BLOQUE A (corrección de datos/jornadas y
// zona horaria). Un bloque de tests por hallazgo corregido:
//   K-01  jornada abierta de un día anterior ya NO se cierra con la hora de hoy
//   A-01/K-06/A-06  zona horaria única (config.zonaHoraria) en los helpers de frontend
//   A-02  editarMarca/anadirMarca rechazan orden cronológico inconsistente
//   A-04  crearJornadaCompleta permite registrar un día SIN ninguna marca previa
//   K-04  guardia anti-doble-toque en `fichar`
import test from 'node:test';
import assert from 'node:assert/strict';
import { kiosk, manager } from '../src/http/handlers.js';
import { nuevoModulo, ctx, ADMIN } from './_helpers.js';
import * as repos from '../src/services/repos.js';
import * as registros from '../src/services/registros.service.js';
import { normalizeConfig, DEFAULT_CONFIG } from '../src/ports.js';
import { tsAValorLocal, valorLocalATs, diferenciaDiasCalendario } from '../src/domain/time.js';

const H = 3600 * 1000;
const K = (body = {}) => ({ canal: 'kiosk', body });
const RANGO = { desde: '2026-01-01', hasta: '2026-12-31' };

// ===========================================================================
// K-01 — la jornada abierta de un día anterior no se cierra con la hora de hoy
// ===========================================================================

test('K-01 (a) · olvido de salida <24h: el fichaje del día siguiente NO cierra la jornada de ayer', () => {
  const inicio = Date.UTC(2026, 6, 13, 8, 0, 0); // lunes 13-jul-2026 08:00 UTC
  const { modulo, deps, env } = nuevoModulo({ now: inicio });

  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  assert.equal(f1.tipo, 'entrada');

  env.reloj.avanzar(23.5 * H); // martes 07:30 (< 24h, el bug original reutilizaba la jornada)

  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  // El kiosko debe considerar que hoy el empleado está FUERA (jornada de ayer no cuenta).
  assert.equal(en2.estado.dentro, false, 'no debe aparecer "dentro" arrastrando la jornada de ayer');
  assert.equal(en2.estado.siguienteTipo, 'entrada');

  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  assert.equal(f2.tipo, 'entrada', 'el fichaje del martes es una ENTRADA nueva, no una salida de ayer');
  assert.notEqual(f2.jornadaId, f1.jornadaId, 'no reutiliza la jornada del lunes');

  const jornadaLunes = repos.jornadaPorId(deps.db, f1.jornadaId);
  assert.equal(jornadaLunes.estado, 'abierta', 'la jornada del lunes sigue abierta (no se cerró con la hora de hoy)');
  assert.equal(jornadaLunes.requiere_correccion, 1, 'queda señalizada para corrección del admin');

  const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
  assert.equal(totalJornadas, 2, 'se crearon DOS jornadas (lunes abandonada + martes nueva), no una de 23.5h');

  const filas = registros.listarJornadas(deps, RANGO);
  const filaLunes = filas.find((f) => f.id === f1.jornadaId);
  assert.equal(filaLunes.requiereCorreccion, true, 'Registros expone requiereCorreccion para la UI');
  assert.equal(filaLunes.enCurso, true, 'sigue sin salida real');
});

test('K-01 (b) · turno de noche legítimo (22:00→06:00) sigue cerrando la MISMA jornada', () => {
  const inicio = Date.UTC(2026, 6, 13, 20, 0, 0); // 22:00 Madrid (verano, UTC+2) del 13-jul
  const { modulo, deps, env } = nuevoModulo({ now: inicio });

  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));
  assert.equal(f1.tipo, 'entrada');

  env.reloj.avanzar(8 * H); // 06:00 Madrid del día siguiente

  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.equal(en2.estado.dentro, true, 'el kiosko sigue viendo al empleado DENTRO tras medianoche');

  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  assert.equal(f2.tipo, 'salida');
  assert.equal(f2.jornadaId, f1.jornadaId, 'misma jornada: el turno de noche NO se rompe en dos');

  const jornada = repos.jornadaPorId(deps.db, f1.jornadaId);
  assert.equal(jornada.estado, 'cerrada');
  assert.equal(jornada.requiere_correccion, 0);

  const totalJornadas = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
  assert.equal(totalJornadas, 1, 'una única jornada para el turno de noche completo');
});

test('K-01 · maxDuracionJornadaMin es configurable y respeta el límite acotado (1h–72h)', () => {
  assert.equal(normalizeConfig({ maxDuracionJornadaMin: 30 }).maxDuracionJornadaMin, 60, 'no baja de 60min');
  assert.equal(normalizeConfig({ maxDuracionJornadaMin: 999999 }).maxDuracionJornadaMin, 4320, 'no sube de 72h');
  assert.equal(normalizeConfig({}).maxDuracionJornadaMin, DEFAULT_CONFIG.maxDuracionJornadaMin);
});

// ===========================================================================
// A-01 / K-06 / A-06 — zona horaria única (config.zonaHoraria), sin hardcodes
// ===========================================================================

test('A-01/K-06 · GET /kiosk/config expone zonaHoraria sin PIN (fuente única para el kiosko)', () => {
  const { modulo, deps } = nuevoModulo({ config: { zonaHoraria: 'America/New_York' } });
  const c = kiosk.config(deps, ctx(modulo, { canal: 'kiosk' }));
  assert.deepEqual(c, { zonaHoraria: 'America/New_York' });
  assert.throws(() => kiosk.config(deps, ctx(modulo, { canal: 'manager' })), (e) => e.code === 'CANAL_INVALIDO');
});

test('A-04 · GET /manager/empleados lista también inactivos (para elegir empleado sin jornadas)', () => {
  const { modulo, deps } = nuevoModulo();
  const lista = manager.empleados(deps, ctx(modulo, { actor: ADMIN }));
  assert.ok(lista.some((e) => e.id === 'e1'));
  assert.ok(lista.every((e) => 'activo' in e));
  assert.throws(
    () => manager.empleados(deps, ctx(modulo, { actor: { empleadoId: 'e1', rol: 'empleado' } })),
    (e) => e.code === 'PROHIBIDO'
  );
});

test('A-01 · valorLocalATs/tsAValorLocal son coherentes en una zona ≠ Madrid (America/New_York)', () => {
  const TZ_NY = 'America/New_York';
  // 14:00 en Europe/Madrid (verano, UTC+2) del 13-jul-2026 == 12:00 UTC == 08:00 en NY (UTC-4)
  const ts = Date.UTC(2026, 6, 13, 12, 0, 0);

  // El admin ve la hora en SU zona (NY) si config.zonaHoraria = NY: 08:00, no 14:00.
  const valorInput = tsAValorLocal(ts, TZ_NY);
  assert.equal(valorInput, '2026-07-13T08:00', 'la tabla/el modal en NY deben mostrar 08:00, NO 14:00 (Madrid)');

  // Guarda el mismo valor -> debe devolver EXACTAMENTE el ts original (round-trip).
  const tsGuardado = valorLocalATs(valorInput, TZ_NY);
  assert.equal(tsGuardado, ts, 'round-trip: mostrar y luego guardar sin tocar nada conserva el instante absoluto');

  // Si el admin teclea "14:05" pensando en la convención de Madrid pero config.zonaHoraria
  // es NY, el sistema debe guardarlo como 14:05 EN NY (no en Madrid): comportamiento
  // consistente con lo que se le mostró, no con una zona oculta distinta.
  const tsNy1405 = valorLocalATs('2026-07-13T14:05', TZ_NY);
  const vueltaNy = tsAValorLocal(tsNy1405, TZ_NY);
  assert.equal(vueltaNy, '2026-07-13T14:05', 'lo que se guarda para NY se relee como 14:05 en NY (misma zona en ambos sentidos)');
});

test('A-01 · manager/api.js y kiosk/api.js exigen tz explícito (ya no caen en Europe/Madrid oculto)', async () => {
  const { fmtHora: fmtHoraManager, tsAInputLocal, inputLocalATs } = await import('../manager/api.js');
  const { fmtHora: fmtHoraKiosk } = await import('../kiosk/api.js');
  const TZ_NY = 'America/New_York';
  const ts = Date.UTC(2026, 6, 13, 12, 0, 0); // 14:00 Madrid == 08:00 NY

  assert.equal(fmtHoraManager(ts, 'Europe/Madrid'), '14:00');
  assert.equal(fmtHoraManager(ts, TZ_NY), '08:00', 'el Manager respeta la tz que se le pasa (no Madrid fijo)');
  assert.equal(fmtHoraKiosk(ts, TZ_NY), '08:00', 'el kiosko respeta la tz que se le pasa (no Madrid fijo)');

  // Lo que se ve en la tabla (fmtHora) y lo que se precarga en el modal (tsAInputLocal)
  // deben coincidir SIEMPRE que se les pase la MISMA zona (antes: Madrid vs. navegador).
  const horaTabla = fmtHoraManager(ts, TZ_NY);
  const valorModal = tsAInputLocal(ts, TZ_NY);
  assert.equal(valorModal, `2026-07-13T${horaTabla}`, 'tabla y modal coherentes en la misma zona');

  // Guardar sin cambios desde el modal reproduce el mismo instante absoluto.
  assert.equal(inputLocalATs(valorModal, TZ_NY), ts);
});

test('A-06 · rango por defecto (primer/último día del mes) usa config.zonaHoraria, no la del navegador', async () => {
  const { primerDiaMes, ultimoDiaMes } = await import('../manager/api.js');
  const ts = Date.UTC(2026, 6, 31, 23, 30, 0); // 31-jul 23:30 UTC == 1-ago 01:30 Madrid (verano)
  assert.equal(primerDiaMes(ts, 'Europe/Madrid'), '2026-08-01', 'en Madrid ya es agosto');
  assert.equal(ultimoDiaMes(ts, 'Europe/Madrid'), '2026-08-31');
  // En UTC puro seguiría siendo julio: confirma que la zona SÍ cambia el resultado.
  assert.equal(primerDiaMes(ts, 'UTC'), '2026-07-01');
});

test('diferenciaDiasCalendario: base del criterio "mismo día/día anterior" de K-01', () => {
  assert.equal(diferenciaDiasCalendario('2026-07-13', '2026-07-13'), 0);
  assert.equal(diferenciaDiasCalendario('2026-07-13', '2026-07-14'), 1);
  assert.equal(diferenciaDiasCalendario('2026-07-10', '2026-07-14'), 4);
});

// ===========================================================================
// A-02 — editarMarca/anadirMarca rechazan orden cronológico inconsistente
// ===========================================================================

test('A-02 · editarMarca rechaza dejar la salida antes (o igual) que su entrada', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const fe = kiosk.fichar(deps, ctx(modulo, K({ token: en.token }))); // entrada
  env.reloj.avanzar(4 * H);
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const fs = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token }))); // salida (+4h)

  // Intenta mover la ENTRADA a después de la salida -> debe rechazarse.
  assert.throws(
    () => manager.editarMarca(deps, ctx(modulo, {
      actor: ADMIN, body: { marcaId: fe.marcaId, tsNuevo: fs.ts + H, motivo: 'intento inválido' },
    })),
    (e) => e.code === 'ORDEN_INVALIDO' && e.status === 400
  );
  // Igual/instante: tampoco vale.
  assert.throws(
    () => manager.editarMarca(deps, ctx(modulo, {
      actor: ADMIN, body: { marcaId: fe.marcaId, tsNuevo: fs.ts, motivo: 'igual a la salida' },
    })),
    (e) => e.code === 'ORDEN_INVALIDO'
  );
  // La marca NO debe haberse tocado.
  const marca = repos.marcaPorId(deps.db, fe.marcaId);
  assert.equal(marca.ts, fe.ts, 'la marca conserva su ts original tras el intento rechazado');
});

test('A-02 · anadirMarca rechaza una salida anterior (o igual) a la entrada existente', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const fe = kiosk.fichar(deps, ctx(modulo, K({ token: en.token }))); // sólo entrada

  assert.throws(
    () => manager.anadirMarca(deps, ctx(modulo, {
      actor: ADMIN, body: { jornadaId: fe.jornadaId, tipo: 'salida', ts: fe.ts - H, motivo: 'salida antes de entrar' },
    })),
    (e) => e.code === 'ORDEN_INVALIDO'
  );
  assert.equal(repos.marcasDeJornada(deps.db, fe.jornadaId).length, 1, 'no se añadió ninguna marca inválida');

  // Una salida posterior sí debe funcionar con normalidad (regresión negativa).
  const ok = manager.anadirMarca(deps, ctx(modulo, {
    actor: ADMIN, body: { jornadaId: fe.jornadaId, tipo: 'salida', ts: fe.ts + H, motivo: 'salida correcta' },
  }));
  assert.equal(ok.enCurso, false);
});

// ===========================================================================
// A-04 — crearJornadaCompleta: registrar un día SIN ninguna marca previa
// ===========================================================================

test('A-04 · crearJornadaCompleta registra un día totalmente olvidado (0 marcas previas)', () => {
  const { modulo, deps } = nuevoModulo({ now: Date.UTC(2026, 6, 13, 6, 0) });
  // e1 no tiene NINGUNA jornada/marca para el 2026-07-10.
  assert.equal(repos.jornadaDe(deps.db, 'e1', '2026-07-10'), null);

  const entrada = Date.UTC(2026, 6, 10, 7, 0);
  const salida = Date.UTC(2026, 6, 10, 15, 0);
  const jornada = manager.crearJornada(deps, ctx(modulo, {
    actor: ADMIN, body: { empleadoId: 'e1', entrada, salida, motivo: 'Día completo olvidado, confirmado con el encargado' },
  }));

  assert.equal(jornada.empleadoId, 'e1');
  assert.equal(jornada.fecha, '2026-07-10');
  assert.equal(jornada.minutos, 480);
  assert.equal(jornada.enCurso, false);
  assert.equal(jornada.editado, true);
  assert.match(jornada.codigo, /^F-\d{4}-\d{4,}$/);

  const filas = registros.listarJornadas(deps, { desde: '2026-07-01', hasta: '2026-07-31' });
  assert.equal(filas.filter((f) => f.fecha === '2026-07-10').length, 1);

  // Repetir para el mismo empleado/día ya existente -> error claro, no duplica.
  assert.throws(
    () => manager.crearJornada(deps, ctx(modulo, {
      actor: ADMIN, body: { empleadoId: 'e1', entrada, salida, motivo: 'repetido' },
    })),
    (e) => e.code === 'JORNADA_YA_EXISTE'
  );
});

test('A-04 · crearJornadaCompleta exige motivo y orden cronológico válido', () => {
  const { modulo, deps } = nuevoModulo();
  const entrada = Date.UTC(2026, 6, 10, 7, 0);
  const salida = Date.UTC(2026, 6, 10, 15, 0);
  assert.throws(
    () => manager.crearJornada(deps, ctx(modulo, { actor: ADMIN, body: { empleadoId: 'e1', entrada, salida, motivo: '  ' } })),
    (e) => e.code === 'MOTIVO_REQUERIDO'
  );
  assert.throws(
    () => manager.crearJornada(deps, ctx(modulo, { actor: ADMIN, body: { empleadoId: 'e1', entrada: salida, salida: entrada, motivo: 'orden invertido' } })),
    (e) => e.code === 'ORDEN_INVALIDO'
  );
});

// ===========================================================================
// K-04 — guardia anti-doble-toque en `fichar`
// ===========================================================================

test('K-04 · dos fichadas casi simultáneas (mismo empleado) se rechazan; el 2º intento no crea marca', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(f1.tipo, 'entrada');

  assert.throws(
    () => kiosk.fichar(deps, ctx(modulo, K({ token: en.token }))),
    (e) => e.code === 'FICHAJE_DUPLICADO' && e.status === 429
  );
  assert.equal(repos.marcasDeJornada(deps.db, f1.jornadaId).length, 1);
});

test('K-04 · dos "tablets" fichando casi a la vez para el mismo empleado: el 2º toque se rechaza', () => {
  const { modulo, deps } = nuevoModulo();
  const enA = kiosk.entrar(deps, ctx(modulo, { ...K({ empleadoId: 'e1', pin: '4728' }), dispositivo: 'tablet-A' }));
  const enB = kiosk.entrar(deps, ctx(modulo, { ...K({ empleadoId: 'e1', pin: '4728' }), dispositivo: 'tablet-B' }));
  const fA = kiosk.fichar(deps, ctx(modulo, { ...K({ token: enA.token }), dispositivo: 'tablet-A' }));
  assert.equal(fA.tipo, 'entrada');
  assert.throws(
    () => kiosk.fichar(deps, ctx(modulo, { ...K({ token: enB.token }), dispositivo: 'tablet-B' })),
    (e) => e.code === 'FICHAJE_DUPLICADO'
  );
  const total = deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas WHERE empleado_id=?').get('e1').n;
  assert.equal(total, 1);
});

test('K-04 · fichadas espaciadas (> ventana) NO se ven afectadas', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  env.reloj.avanzar(4000); // 4s > ventana por defecto (3s)
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  assert.equal(f2.tipo, 'salida');
  assert.equal(f2.jornadaId, f1.jornadaId);
});

test('K-04 · empleados DISTINTOS no se bloquean entre sí aunque fichen en el mismo instante', () => {
  const { modulo, deps } = nuevoModulo();
  const enA = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const enB = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  const fA = kiosk.fichar(deps, ctx(modulo, K({ token: enA.token })));
  const fB = kiosk.fichar(deps, ctx(modulo, K({ token: enB.token })));
  assert.equal(fA.tipo, 'entrada');
  assert.equal(fB.tipo, 'entrada');
});

test('K-04 · ventanaAntiRebotarFichajeSeg = 0 desactiva la guardia (config explícito)', () => {
  const { modulo, deps } = nuevoModulo({ config: { ventanaAntiRebotarFichajeSeg: 0 } });
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(f1.tipo, 'entrada');
  assert.equal(f2.tipo, 'salida', 'con la guardia desactivada se conserva el comportamiento previo (toggle)');
});
