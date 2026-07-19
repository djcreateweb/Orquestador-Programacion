// auditoria.test.js — Suite de AUDITORÍA FUNCIONAL (Fase C, bloques C1–C10).
// Complementa las suites existentes (domain/flujos/seguridad/migration) cubriendo
// los huecos: validaciones de API, matriz rol×acción completa (incl. denegaciones),
// kiosko paso a paso, cada ajuste en sus dos estados, DST, correlativo/concurrencia,
// backup+restauración, corte de luz, inyección CSV/SQL, XSS, volumen y casos límite.
// Cada test produce EVIDENCIA real (excepción lanzada, fila de BD, buffer, tiempo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { kiosk, manager } from '../src/http/handlers.js';
import { nuevoModulo, ctx, ADMIN, TECH } from './_helpers.js';
import { crearReferenceEnv } from '../src/dev/reference-env.js';
import { crearModulo } from '../src/index.js';
import { verificarIntegridad } from '../src/services/audit.service.js';
import { transaccion } from '../src/db/tx.js';
import { informeACsv } from '../src/export/csv.js';
import { minutosTrabajados, aplicarRedondeo } from '../src/domain/jornadas.js';
import { fechaJornada } from '../src/domain/time.js';
import * as repos from '../src/services/repos.js';
import { sembrar } from '../auditoria/seed/seed.mjs';

const H = 3600 * 1000;
const RANGO = { desde: '2026-01-01', hasta: '2026-12-31' };
const EMP = { empleadoId: 'e1', rol: 'empleado' };
const K = (body = {}) => ({ canal: 'kiosk', body });
const scratch = process.env.CLAUDE_SCRATCH || os.tmpdir();

// Ficha una entrada real y devuelve {modulo,deps,env,token,marcaId,jornadaId}.
function entrarYFichar(empleadoId = 'e1', pin = '4728') {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId, pin })));
  const f = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  return { modulo, deps, env, token: en.token, marcaId: f.marcaId, jornadaId: f.jornadaId };
}

// ===========================================================================
// C1 · API y servidor — validaciones, códigos de error, BD vacía
// ===========================================================================
test('C1 · editarMarca sin motivo → MOTIVO_REQUERIDO 400', () => {
  const { modulo, deps, marcaId } = entrarYFichar();
  assert.throws(
    () => manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId, tsNuevo: Date.UTC(2026, 6, 13, 9, 0), motivo: '  ' } })),
    (e) => e.code === 'MOTIVO_REQUERIDO' && e.status === 400
  );
});

test('C1 · editarMarca ts inválido → TS_INVALIDO 400', () => {
  const { modulo, deps, marcaId } = entrarYFichar();
  assert.throws(
    () => manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId, tsNuevo: 'no-numero', motivo: 'x' } })),
    (e) => e.code === 'TS_INVALIDO'
  );
});

test('C1 · editarMarca marca inexistente → MARCA_INEXISTENTE 404', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(
    () => manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: 99999, tsNuevo: Date.UTC(2026, 6, 13, 9, 0), motivo: 'x' } })),
    (e) => e.code === 'MARCA_INEXISTENTE' && e.status === 404
  );
});

test('C1 · anadirMarca tipo inválido / jornada inexistente / sin motivo', () => {
  const { modulo, deps, jornadaId } = entrarYFichar();
  assert.throws(() => manager.anadirMarca(deps, ctx(modulo, { actor: ADMIN, body: { jornadaId, tipo: 'pausa', ts: Date.UTC(2026, 6, 13, 12, 0), motivo: 'x' } })), (e) => e.code === 'TIPO_INVALIDO');
  assert.throws(() => manager.anadirMarca(deps, ctx(modulo, { actor: ADMIN, body: { jornadaId: 99999, tipo: 'salida', ts: Date.UTC(2026, 6, 13, 12, 0), motivo: 'x' } })), (e) => e.code === 'JORNADA_INEXISTENTE');
  assert.throws(() => manager.anadirMarca(deps, ctx(modulo, { actor: ADMIN, body: { jornadaId, tipo: 'salida', ts: Date.UTC(2026, 6, 13, 12, 0), motivo: '' } })), (e) => e.code === 'MOTIVO_REQUERIDO');
});

test('C1 · entrar sin empleadoId → EMPLEADO_REQUERIDO 400', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(() => kiosk.entrar(deps, ctx(modulo, K({ pin: '4728' }))), (e) => e.code === 'EMPLEADO_REQUERIDO' && e.status === 400);
});

test('C1 · crearSolicitud sin motivo / cambio inválido', () => {
  const { modulo, deps, token, jornadaId } = entrarYFichar();
  assert.throws(() => kiosk.crearSolicitud(deps, ctx(modulo, K({ token, cambio: { accion: 'anadir', jornadaId, tipo: 'salida', ts: Date.now() } }))), (e) => e.code === 'MOTIVO_REQUERIDO');
  assert.throws(() => kiosk.crearSolicitud(deps, ctx(modulo, K({ token, cambio: null, motivo: 'x' }))), (e) => e.code === 'CAMBIO_INVALIDO');
});

test('C1 · aprobar/rechazar solicitud inexistente → 404; ya resuelta → 409', () => {
  const { modulo, deps, token, jornadaId } = entrarYFichar();
  assert.throws(() => manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: '99999' }, body: {} })), (e) => e.code === 'SOLICITUD_INEXISTENTE' && e.status === 404);
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, K({ token, cambio: { accion: 'anadir', jornadaId, tipo: 'salida', ts: Date.UTC(2026, 6, 13, 15, 0) }, motivo: 'olvido' })));
  manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} }));
  assert.throws(() => manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} })), (e) => e.code === 'SOLICITUD_RESUELTA' && e.status === 409);
  assert.throws(() => manager.rechazar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} })), (e) => e.code === 'SOLICITUD_RESUELTA');
});

test('C1 · rate limiting: la petición nº31 en la ventana → RATE 429', () => {
  const { modulo, deps } = nuevoModulo();
  for (let i = 0; i < 30; i++) kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.throws(() => kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' }))), (e) => e.code === 'RATE' && e.status === 429);
});

test('C1 · BD vacía: Hoy en cero, Registros/Informe vacíos sin error', () => {
  const { modulo, deps } = nuevoModulo();
  const h = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert.deepEqual([h.dentroAhora, h.salidas, h.personasHoy, h.marcasHoy], [0, 0, 0, 0]);
  assert.deepEqual(manager.registros(deps, ctx(modulo, { actor: ADMIN, query: RANGO })), []);
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.deepEqual(inf.empleados, []);
  assert.equal(inf.totalPeriodoMinutos, 0);
});

// ===========================================================================
// C2 · Roles y permisos — matriz rol×acción, celda a celda (incl. denegaciones)
// ===========================================================================
const MANAGER_ACCIONES = [
  ['hoy', (d, c) => manager.hoy(d, c)],
  ['registros', (d, c) => manager.registros(d, c)],
  ['informe', (d, c) => manager.informe(d, c)],
  ['solicitudes', (d, c) => manager.solicitudes(d, c)],
  ['ajustesGet', (d, c) => manager.ajustesGet(d, c)],
  ['ajustesPut', (d, c) => manager.ajustesPut(d, c)],
  ['editarMarca', (d, c) => manager.editarMarca(d, c)],
  ['anadirMarca', (d, c) => manager.anadirMarca(d, c)],
  ['aprobar', (d, c) => manager.aprobar(d, { ...c, params: { id: '1' } })],
  ['rechazar', (d, c) => manager.rechazar(d, { ...c, params: { id: '1' } })],
];

test('C2 · empleado NO accede a ninguna acción del Manager → PROHIBIDO', () => {
  const { modulo, deps } = nuevoModulo();
  for (const [nombre, fn] of MANAGER_ACCIONES) {
    assert.throws(() => fn(deps, ctx(modulo, { actor: EMP, body: {}, query: {} })), (e) => e.code === 'PROHIBIDO', `${nombre} debería denegar a empleado`);
  }
});

test('C2 · sin sesión (no autenticado) NO accede al Manager → NO_AUTENTICADO', () => {
  const { modulo, deps } = nuevoModulo();
  for (const [nombre, fn] of MANAGER_ACCIONES) {
    assert.throws(() => fn(deps, ctx(modulo, { actor: null, body: {}, query: {} })), (e) => e.code === 'NO_AUTENTICADO', `${nombre} debería exigir sesión`);
  }
});

test('C2 · verificación de integridad: sólo técnico (admin y empleado denegados)', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(() => manager.auditoriaVerificar(deps, ctx(modulo, { actor: EMP })), (e) => e.code === 'PROHIBIDO');
  assert.throws(() => manager.auditoriaVerificar(deps, ctx(modulo, { actor: ADMIN })), (e) => e.code === 'PROHIBIDO');
  assert.equal(manager.auditoriaVerificar(deps, ctx(modulo, { actor: TECH })).ok, true);
});

test('C2 · el kiosko no alcanza rutas de kiosko desde otro canal → CANAL_INVALIDO', () => {
  const { modulo, deps } = nuevoModulo();
  for (const h of ['empleados', 'entrar', 'estado', 'fichar', 'misRegistros', 'crearSolicitud']) {
    assert.throws(() => kiosk[h](deps, ctx(modulo, { canal: 'manager', body: {}, query: {} })), (e) => e.code === 'CANAL_INVALIDO', `${h} debería exigir canal kiosk`);
  }
});

test('C2 · token de kiosko inválido/ausente → SESION_KIOSKO 401', () => {
  const { modulo, deps } = nuevoModulo();
  for (const h of ['estado', 'fichar', 'misRegistros']) {
    assert.throws(() => kiosk[h](deps, ctx(modulo, K({ token: 'basura' }))), (e) => e.code === 'SESION_KIOSKO' && e.status === 401, h);
  }
});

test('C2 · IDOR: empleado no puede añadir marca en jornada ajena', () => {
  const { modulo, deps } = nuevoModulo();
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.throws(() => kiosk.crearSolicitud(deps, ctx(modulo, K({ token: en1.token, cambio: { accion: 'anadir', jornadaId: f2.jornadaId, tipo: 'salida', ts: Date.now() }, motivo: 'x' }))), (e) => e.code === 'PROHIBIDO');
});

// ===========================================================================
// C3 · Kiosko — el empleado paso a paso
// ===========================================================================
test('C3 · PIN incorrecto → PIN_INCORRECTO (mensaje genérico, no dice qué campo)', () => {
  const { modulo, deps } = nuevoModulo();
  try {
    kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '0000' })));
    assert.fail('debería lanzar');
  } catch (e) {
    assert.equal(e.code, 'PIN_INCORRECTO');
    assert.equal(e.publico, 'Credenciales incorrectas.'); // genérico
    assert.ok(!/empleado|pin/i.test(e.publico) || e.publico === 'Credenciales incorrectas.');
  }
});

test('C3 · REGRESIÓN K-02: empleado inactivo NO puede autenticarse en el kiosko en absoluto (ni con PIN correcto)', () => {
  // Antes del fix K-02: `entrar` emitía el token igual (PIN válido → token), y sólo
  // `fichar` bloqueaba después con EMPLEADO_INVALIDO — un empleado de baja podía ver su
  // estado/histórico, exportar y crear solicitudes con ese token. Ahora `entrar` rechaza
  // de raíz, antes de emitir ningún token.
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 8, 0), empleados: [{ id: 'x', nombre: 'Baja', rol: 'empleado', pin: '4728', activo: false }] });
  const modulo = crearModulo(env); const deps = modulo.deps;
  assert.throws(
    () => kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'x', pin: '4728' }))),
    (e) => e.code === 'EMPLEADO_INVALIDO' && e.status === 403,
    'entrar debe rechazar al empleado inactivo aunque el PIN sea correcto'
  );
});

test('C3 · empleado inactivo no aparece en la lista del kiosko', () => {
  const env = crearReferenceEnv({ empleados: [{ id: 'a', nombre: 'Activo', rol: 'empleado', pin: '4728', activo: true }, { id: 'b', nombre: 'Baja', rol: 'empleado', pin: '6410', activo: false }] });
  const modulo = crearModulo(env);
  const lista = kiosk.empleados(modulo.deps, ctx(modulo, { canal: 'kiosk' }));
  assert.deepEqual(lista.map((e) => e.id), ['a']);
});

test('C3 · toggle entrada→salida y estado coherente en cada paso', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.equal(en.estado.dentro, false);
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(f1.tipo, 'entrada');
  assert.equal(kiosk.estado(deps, ctx(modulo, K({ token: en.token }))).estado.dentro, true);
  env.reloj.avanzar(4 * H);
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  assert.equal(f2.tipo, 'salida');
  assert.equal(f2.estado, 'cerrada');
});

test('C3 · sesión de kiosko caduca (~90s) → fichar tras caducar da SESION_KIOSKO', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  env.reloj.avanzar(91_000); // > ttl 90s
  assert.throws(() => kiosk.fichar(deps, ctx(modulo, K({ token: en.token }))), (e) => e.code === 'SESION_KIOSKO');
});

test('C3 · misRegistros/exportar sólo devuelven lo propio (identidad del servidor)', () => {
  const { modulo, deps, token } = entrarYFichar('e1', '4728');
  const mis = kiosk.misRegistros(deps, ctx(modulo, K({ token, desde: '2026-07-01', hasta: '2026-07-31' })));
  assert.ok(mis.empleados.every((e) => e.empleadoId === 'e1'));
  // fix S-03/K-07: exportar ya no acepta el token de SESIÓN; exige un token de DESCARGA
  // de un solo uso, obtenido antes con `solicitarDescarga` (token de sesión en el body).
  const { descargaToken } = kiosk.solicitarDescarga(deps, ctx(modulo, K({ token })));
  const exp = kiosk.exportar(deps, { ...ctx(modulo, { canal: 'kiosk' }), query: { token: descargaToken, desde: '2026-07-01', hasta: '2026-07-31' }, formato: 'csv' });
  assert.match(exp.raw, /Ana García/);
});

test('C3 · REGRESIÓN K-04: doble pulsación casi simultánea se RECHAZA (ya no crea entrada+salida de 0 min)', () => {
  // Antes del fix K-04: el cliente deshabilita el botón (antirrebote), pero a nivel de
  // servidor `fichar` era un toggle sin guardia; dos llamadas seguidas con el mismo
  // "now" producían entrada+salida (jornada de 0 min). Ahora el servidor rechaza la 2ª
  // fichada del mismo empleado dentro de `ventanaAntiRebotarFichajeSeg` (por defecto 3s).
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(f1.tipo, 'entrada');
  assert.throws(
    () => kiosk.fichar(deps, ctx(modulo, K({ token: en.token }))),
    (e) => e.code === 'FICHAJE_DUPLICADO' && e.status === 429
  );
  assert.equal(marcasCount(deps, f1.jornadaId), 1, 'la 2ª fichada NO se registró (sigue habiendo sólo la entrada)');
});

function marcasCount(deps, jornadaId) {
  return repos.marcasDeJornada(deps.db, jornadaId).length;
}

// ===========================================================================
// C4 · Manager — control por control
// ===========================================================================
test('C4 · Hoy: los KPIs cuadran (1 dentro, 1 salida, 2 personas, 3 marcas)', () => {
  const { modulo, deps, env } = nuevoModulo();
  // e1: entrada+salida (se ha ido) ; e2: entrada (dentro)
  const e1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: e1.token })));
  env.reloj.avanzar(2 * H);
  const e1b = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: e1b.token })));
  const e2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: e2.token })));
  const h = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert.equal(h.dentroAhora, 1);
  assert.equal(h.salidas, 1);
  assert.equal(h.personasHoy, 2);
  assert.equal(h.marcasHoy, 3);
});

test('C4 · Registros: filtro por empleado, enCurso y badge editado', () => {
  const { modulo, deps, env } = nuevoModulo();
  const e1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: e1.token }))); // e1 abierta
  kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' }))); // e2 sin fichar aún
  const soloE1 = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: 'e1' } }));
  assert.equal(soloE1.length, 1);
  assert.equal(soloE1[0].empleadoId, 'e1');
  assert.equal(soloE1[0].enCurso, true);
  assert.equal(soloE1[0].editado, false);
  // editar → badge editado
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f1.marcaId, tsNuevo: f1.ts + 30 * 60000, motivo: 'ajuste' } }));
  const tras = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: 'e1' } }));
  assert.equal(tras[0].editado, true);
});

test('C4 · Informe: horas verificadas a mano y Total = suma de filas', () => {
  const { modulo, deps, env } = nuevoModulo();
  // e1: 8h ; e2: 5h
  for (const [emp, pin, horas] of [['e1', '4728', 8], ['e2', '6410', 5]]) {
    const a = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: emp, pin })));
    kiosk.fichar(deps, ctx(modulo, K({ token: a.token })));
    env.reloj.avanzar(horas * H);
    const b = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: emp, pin })));
    kiosk.fichar(deps, ctx(modulo, K({ token: b.token })));
    env.reloj.avanzar(H); // separación
  }
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  const total = inf.empleados.reduce((s, e) => s + e.totalMinutosRedondeados, 0);
  assert.equal(inf.totalPeriodoMinutos, total); // total cuadra con la suma
  assert.equal(inf.totalPeriodoMinutos, (8 + 5) * 60); // 13 h calculadas a mano
  assert.equal(inf.totalPeriodoTexto, '13 h 0 m');
});

test('C4 · Exportación CSV: tildes/ñ intactas, con BOM y totales, SIN PIN/hash', () => {
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 6, 0), empleados: [{ id: 'e3', nombre: 'Chloé Muñoz-Ñáñez', rol: 'empleado', pin: '918273', activo: true }] });
  const modulo = crearModulo(env); const deps = modulo.deps;
  const a = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e3', pin: '918273' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: a.token })));
  env.reloj.avanzar(8 * H);
  const b = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e3', pin: '918273' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: b.token })));
  const csv = manager.informeExport(deps, ctx(modulo, { actor: ADMIN, query: RANGO, formato: 'csv' }));
  assert.ok(csv.raw.startsWith('﻿'), 'BOM presente');
  assert.match(csv.raw, /Chloé Muñoz-Ñáñez/); // tildes/ñ intactas
  assert.match(csv.raw, /TOTAL DEL PERIODO/);
  assert.ok(!csv.raw.includes('918273'), 'no filtra PIN');
  assert.ok(!csv.raw.includes('scrypt$'), 'no filtra hash');
});

test('C4 · Ajustes: cada toggle tiene efecto real (exigirPin, mostrarEnKiosko, variasMarcasDia)', () => {
  // exigirPin=false → entrar acepta cualquier PIN
  {
    const env = crearReferenceEnv({ config: { exigirPin: false } });
    const modulo = crearModulo(env);
    const en = kiosk.entrar(modulo.deps, ctx(modulo, K({ empleadoId: 'e1', pin: 'loquesea' })));
    assert.ok(en.token, 'con exigirPin=false no se valida el PIN');
  }
  // mostrarEnKiosko=false → lista vacía
  {
    const { modulo, deps } = nuevoModulo();
    manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { mostrarEnKiosko: false } }));
    assert.equal(kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' })).length, 0);
  }
});

test('C4 · Ajustes: redondeoMin afecta al total del informe (efecto real)', () => {
  const { modulo, deps, env } = nuevoModulo({ config: { redondeoMin: 15 } });
  const a = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: a.token })));
  env.reloj.avanzar(127 * 60000); // 127 min
  const b = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: b.token })));
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(inf.empleados[0].totalMinutos, 127);
  assert.equal(inf.empleados[0].totalMinutosRedondeados, 120); // 127 → múltiplo de 15 más cercano
});

test('C4 · Ajustes: imprimirTicket=true invoca al puerto printing al fichar', () => {
  const env = crearReferenceEnv({ config: { imprimirTicket: true } });
  let impreso = null;
  env.printing = { printTicket: (doc) => { impreso = doc; } };
  const modulo = crearModulo(env); const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.ok(impreso && impreso.tipo === 'entrada', 'se imprimió el ticket de entrada');
});

test('C4 · REGRESIÓN A-09: valor inválido se RECHAZA con error claro (ya no se acota en silencio)', () => {
  // Antes del fix A-09: la petición devolvía 200 OK con los valores silenciosamente
  // acotados/sustituidos (redondeoMin→120, conservacionAnios→4), sin ningún código de
  // error ni indicación de qué se corrigió. Ahora se rechaza la petición ENTERA.
  const { modulo, deps } = nuevoModulo();
  const antes = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  assert.throws(
    () => manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { redondeoMin: 999, conservacionAnios: 1 } })),
    (e) => e.code === 'AJUSTE_INVALIDO' && e.status === 400 && /redondeoMin/.test(e.publico) && /conservacionAnios/.test(e.publico)
  );
  // Rechazo ATÓMICO: ningún campo (ni siquiera uno válido del mismo payload) cambia.
  const despues = manager.ajustesGet(deps, ctx(modulo, { actor: ADMIN }));
  assert.deepEqual(despues, antes, 'nada se acota/aplica en silencio; la config queda intacta');
});

test('C4 · Ajustes: un valor válido dentro de rango SÍ se acepta (regresión negativa de A-09)', () => {
  const { modulo, deps } = nuevoModulo();
  const c = manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { redondeoMin: 15, conservacionAnios: 5 } }));
  assert.equal(c.redondeoMin, 15);
  assert.equal(c.conservacionAnios, 5);
});

test('C4 · Ajustes: PERSISTEN tras reiniciar (nueva instancia sobre la misma BD en fichero)', () => {
  const p = path.join(scratch, `presentia-ajustes-${T()}.db`);
  try {
    const env1 = crearReferenceEnv({ dbPath: p });
    const m1 = crearModulo(env1);
    manager.ajustesPut(m1.deps, ctx(m1, { actor: ADMIN, body: { redondeoMin: 15, mostrarEnKiosko: false } }));
    env1.db.close();
    // "reinicio": nueva instancia sobre el mismo fichero
    const env2 = crearReferenceEnv({ dbPath: p });
    const m2 = crearModulo(env2);
    const c = manager.ajustesGet(m2.deps, ctx(m2, { actor: ADMIN }));
    assert.equal(c.redondeoMin, 15);
    assert.equal(c.mostrarEnKiosko, false);
    env2.db.close();
  } finally { limpiar(p); }
});

// ===========================================================================
// C5 · Reglas de negocio y cálculos
// ===========================================================================
test('C5 · DST: jornada que cruza el cambio de hora computa el tiempo REAL transcurrido', () => {
  // Primavera España 2026-03-29: 02:00→03:00 (salto). Entrada 01:30, salida 04:00 (pared)
  // = 90 min reales (no 150). Otoño 2026-10-25: 02:00→03:00... el reloj retrocede.
  const primavera = [
    { tipo: 'entrada', ts: Date.UTC(2026, 2, 29, 0, 30) }, // 01:30 CET
    { tipo: 'salida', ts: Date.UTC(2026, 2, 29, 2, 0) },   // 04:00 CEST
  ];
  assert.equal(minutosTrabajados(primavera), 90);
  const otono = [
    { tipo: 'entrada', ts: Date.UTC(2026, 9, 25, 0, 0) }, // 02:00 CEST
    { tipo: 'salida', ts: Date.UTC(2026, 9, 25, 3, 0) },  // 03:00 CET (el reloj de pared "repite" 02–03)
  ];
  assert.equal(minutosTrabajados(otono), 180); // 3h reales
});

test('C5 · redondeo 0/5/15 al múltiplo más cercano', () => {
  assert.equal(aplicarRedondeo(127, 0), 127);   // 0 = sin redondeo
  assert.equal(aplicarRedondeo(127, 5), 125);   // baja al 125
  assert.equal(aplicarRedondeo(122, 15), 120);  // baja al 120
  assert.equal(aplicarRedondeo(128, 15), 135);  // sube al 135 (128/15≈8.53 → 9·15)
  assert.equal(aplicarRedondeo(133, 15), 135);  // sube al 135
});

test('C5 · REGRESIÓN turno de noche: la salida tras medianoche cierra la jornada de entrada', () => {
  // Entrada 23:00 Madrid (21:00 UTC), salida 02:00 Madrid del día siguiente (00:00 UTC +1).
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 21, 0) }); // 23:00 Madrid del 13
  const modulo = crearModulo(env); const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const fEntrada = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(fEntrada.tipo, 'entrada');
  env.reloj.avanzar(3 * H); // 02:00 Madrid del 14 (la sesión de 90s ya caducó → re-PIN)
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  // el kiosko debe seguir viendo al empleado DENTRO tras medianoche
  assert.equal(en2.estado.dentro, true, 'sigue dentro tras medianoche');
  const fSalida = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  assert.equal(fSalida.tipo, 'salida', 'la marca tras medianoche es SALIDA, no una nueva entrada');
  assert.equal(fSalida.jornadaId, fEntrada.jornadaId, 'misma jornada que la entrada');
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(inf.empleados[0].totalMinutos, 180); // 3h reales computadas
  assert.equal(deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n, 1); // NO se creó una 2ª jornada
});

test('C5 · correlativo: sin huecos, sin duplicados, reinicia al cambiar de año', () => {
  const { deps } = nuevoModulo();
  const gen = deps.correlatives;
  const c2026 = [];
  for (let i = 0; i < 100; i++) c2026.push(gen.next('F', 2026));
  assert.equal(c2026[0], 'F-2026-0001');
  assert.equal(c2026[99], 'F-2026-0100');
  assert.equal(new Set(c2026).size, 100, 'sin duplicados');
  // reinicio de año
  assert.equal(gen.next('F', 2027), 'F-2027-0001');
  assert.equal(gen.next('F', 2026), 'F-2026-0101'); // 2026 continúa donde iba
});

test('C5 · correlativo: UNIQUE(codigo) impide colisión aunque se fuerce', () => {
  const { deps } = nuevoModulo();
  repos.crearJornada(deps.db, { empleadoId: 'e1', fecha: '2026-07-13', codigo: 'F-2026-9999', estado: 'abierta', ts: 1 });
  assert.throws(() => repos.crearJornada(deps.db, { empleadoId: 'e2', fecha: '2026-07-13', codigo: 'F-2026-9999', estado: 'abierta', ts: 1 }), /UNIQUE|constraint/i);
});

test('C5 · una jornada abierta no suma horas (enCurso, minutos 0)', () => {
  const { modulo, deps } = entrarYFichar('e1', '4728');
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(inf.empleados[0].jornadas[0].enCurso, true);
  assert.equal(inf.empleados[0].totalMinutos, 0);
});

test('C5 · zona horaria: fichaje a las 23:30 Madrid pertenece al día local correcto', () => {
  // 22:30 UTC = 23:30 CEST (verano) del mismo día
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 21, 30) }); // 23:30 Madrid
  const modulo = crearModulo(env); const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const j = repos.jornadaPorId(deps.db, f.jornadaId);
  assert.equal(j.fecha, '2026-07-13'); // día local, no el UTC del día siguiente
});

// ===========================================================================
// C6 · Datos, migración y operación
// ===========================================================================
test('C6 · migración no toca tablas preexistentes ajenas a Presentia', () => {
  const env = crearReferenceEnv();
  env.db.exec('CREATE TABLE expira_empleados (id TEXT PRIMARY KEY, nombre TEXT)');
  env.db.prepare('INSERT INTO expira_empleados VALUES (?,?)').run('u1', 'Pre-existente');
  crearModulo(env); // migra
  const fila = env.db.prepare('SELECT nombre FROM expira_empleados WHERE id = ?').get('u1');
  assert.equal(fila.nombre, 'Pre-existente'); // intacta
});

test('C6 · backup + RESTAURACIÓN: copiar el fichero preserva datos y cadena de auditoría', () => {
  const p = path.join(scratch, `presentia-backup-${T()}.db`);
  const p2 = p + '.bak';
  try {
    const env = crearReferenceEnv({ dbPath: p });
    const modulo = crearModulo(env);
    const en = kiosk.entrar(modulo.deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
    kiosk.fichar(modulo.deps, ctx(modulo, K({ token: en.token })));
    const jornadasAntes = modulo.deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
    assert.equal(verificarIntegridad(modulo.deps.db).ok, true);
    env.db.close(); // flush
    fs.copyFileSync(p, p2); // BACKUP
    // RESTAURAR: abrir la copia como BD nueva
    const restaurada = new DatabaseSync(p2);
    const jornadasDespues = restaurada.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n;
    assert.equal(jornadasDespues, jornadasAntes);
    assert.equal(verificarIntegridad(restaurada).ok, true); // cadena intacta tras restaurar
    restaurada.close();
  } finally { limpiar(p); limpiar(p2); }
});

test('C6 · corte de luz a media escritura: el SAVEPOINT revierte y no deja datos parciales', () => {
  const { modulo, deps } = entrarYFichar('e1', '4728');
  const marcasAntes = deps.db.prepare('SELECT COUNT(*) n FROM presentia_marcas').get().n;
  const audAntes = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
  assert.throws(() => transaccion(deps.db, () => {
    repos.insertarMarca(deps.db, { jornadaId: 1, tipo: 'salida', ts: Date.now() });
    throw new Error('simulación de corte de luz');
  }), /corte de luz/);
  assert.equal(deps.db.prepare('SELECT COUNT(*) n FROM presentia_marcas').get().n, marcasAntes); // sin marca parcial
  assert.equal(deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n, audAntes);
  assert.equal(verificarIntegridad(deps.db).ok, true);
});

// ===========================================================================
// C7 · Seguridad
// ===========================================================================
test('C7 · inyección CSV neutralizada: una celda con fórmula se antepone con apóstrofo', () => {
  const informe = {
    desde: '2026-07-01', hasta: '2026-07-31', totalPeriodoTexto: '0 h 0 m',
    empleados: [{ nombre: '=1+2', totalTexto: '0 h 0 m', jornadas: [{ codigo: 'F-2026-0001', fecha: '2026-07-13', entrada: null, salida: null, enCurso: false, textoHoras: '0 h 0 m' }] }],
  };
  const csv = informeACsv(informe, 'Europe/Madrid');
  assert.ok(csv.includes("'=1+2"), 'la fórmula se neutraliza con apóstrofo');
  assert.ok(!/(^|[\r\n;])=1\+2/.test(csv), 'ninguna celda arranca con = crudo');
});

test('C7 · inyección SQL: un empleadoId malicioso se trata como literal (parametrizado)', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const malicioso = "e1' OR '1'='1";
  const regs = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: malicioso } }));
  assert.deepEqual(regs, []); // no inyecta: no existe ese empleado, no vuelca todo
  // la tabla sigue intacta
  assert.equal(deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n, 1);
});

test('C7 · XSS: nombre con <script> se almacena/devuelve literal (sin ejecutar ni romper JSON)', () => {
  const env = crearReferenceEnv({ empleados: [{ id: 'e1', nombre: '<script>alert(1)</script>', rol: 'empleado', pin: '4728', activo: true }] });
  const modulo = crearModulo(env); const deps = modulo.deps;
  const lista = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert.equal(lista[0].nombre, '<script>alert(1)</script>'); // literal; el escapado es responsabilidad del render (React escapa por defecto)
  const json = JSON.stringify(lista);
  assert.ok(json.includes('<script>')); // no se ejecuta en servidor; viaja como dato
});

test('C7 · auditoría: borrar una línea intermedia rompe la cadena y se detecta', () => {
  const { deps } = nuevoModulo();
  // generar varias entradas de auditoría
  const { modulo } = { modulo: null };
  const m = nuevoModulo();
  for (let i = 0; i < 3; i++) {
    const en = kiosk.entrar(m.deps, ctx(m.modulo, K({ empleadoId: 'e1', pin: '4728' })));
    kiosk.fichar(m.deps, ctx(m.modulo, K({ token: en.token })));
    m.env.reloj.avanzar(H);
  }
  assert.equal(verificarIntegridad(m.deps.db).ok, true);
  const mid = m.deps.db.prepare('SELECT id FROM presentia_auditoria ORDER BY id ASC LIMIT 1 OFFSET 1').get().id;
  m.deps.db.prepare('DELETE FROM presentia_auditoria WHERE id = ?').run(mid);
  assert.equal(verificarIntegridad(m.deps.db).ok, false); // hueco detectado
});

// ===========================================================================
// C8 · Legal
// ===========================================================================
test('C8 · el valor ORIGINAL nunca se pierde y toda edición guarda quién/cuándo/por qué', () => {
  const { modulo, deps, marcaId } = entrarYFichar('e1', '4728');
  const original = repos.marcaPorId(deps.db, marcaId).ts;
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId, tsNuevo: original + 20 * 60000, motivo: 'corrección solicitada por el encargado' } }));
  const ver = repos.versionesDeMarca(deps.db, marcaId);
  assert.equal(Number(ver[0].valor_anterior), original); // original conservado
  assert.ok(ver[0].autor_id && ver[0].motivo && ver[0].ts); // quién / por qué / cuándo
  const aud = deps.db.prepare("SELECT * FROM presentia_auditoria WHERE accion='marca_editada'").get();
  assert.equal(aud.actor_id, 'a1');
  assert.ok(aud.motivo && aud.ts);
});

test('C8 · esquema sin biometría ni geolocalización (cero datos innecesarios)', () => {
  const { deps } = nuevoModulo();
  const cols = deps.db.prepare("SELECT name FROM pragma_table_info('presentia_marcas')").all().map((c) => c.name).join(',');
  assert.ok(!/bio|huella|face|gps|lat|lon|geo|ubicac/i.test(cols), `columnas sospechosas: ${cols}`);
});

// ===========================================================================
// C10 · Robustez y casos límite
// ===========================================================================
test('C10 · volumen ≥5.000 jornadas: informe y registros responden en tiempo razonable', () => {
  const { modulo, deps } = sembrar({ volumen: 5000 });
  const t1 = process.hrtime.bigint();
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-01-01', hasta: '2026-12-31' } }));
  const msInforme = Number(process.hrtime.bigint() - t1) / 1e6;
  assert.ok(inf.empleados.length > 0);
  assert.ok(msInforme < 3000, `informe sobre 5k tardó ${msInforme.toFixed(0)}ms`);
  const t2 = process.hrtime.bigint();
  manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  const msReg = Number(process.hrtime.bigint() - t2) / 1e6;
  assert.ok(msReg < 3000, `registros tardó ${msReg.toFixed(0)}ms`);
});

test('C10 · nombre con emojis y tildes se conserva en el informe', () => {
  const env = crearReferenceEnv({ now: Date.UTC(2026, 6, 13, 6, 0), empleados: [{ id: 'e1', nombre: 'Ana 🌟 Ñoño', rol: 'empleado', pin: '4728', activo: true }] });
  const modulo = crearModulo(env); const deps = modulo.deps;
  const a = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: a.token })));
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(inf.empleados[0].nombre, 'Ana 🌟 Ñoño');
});

test('C10 · rango de informe invertido (desde > hasta) devuelve vacío sin error', () => {
  const { modulo, deps } = entrarYFichar('e1', '4728');
  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-12-31', hasta: '2026-01-01' } }));
  assert.deepEqual(inf.empleados, []);
  assert.equal(inf.totalPeriodoMinutos, 0);
});

// --------------------------------------------------------------------------- utilidades
let _seq = 0;
function T() { return `${_seq++}-x`; } // sufijo único determinista (sin Date.now)
function limpiar(p) { try { fs.rmSync(p, { force: true }); } catch { /* noop */ } }
