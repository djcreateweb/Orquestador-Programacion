// aceptacion.test.js — Aceptación de términos exigida en el PRIMER acceso, una vez
// por usuario (empleado en el kiosko y admin/técnico en el Manager). Verifica que la
// segunda vez NO se vuelve a pedir, que es por-usuario, idempotente y auditada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kiosk, manager } from '../src/http/handlers.js';
import { verificarIntegridad } from '../src/services/audit.service.js';
import { TERMINOS_VERSION } from '../src/services/aceptacion.service.js';
import { nuevoModulo, ctx, ADMIN, TECH } from './_helpers.js';

const K = (body = {}) => ({ canal: 'kiosk', body });

test('ACEPTA · kiosko: la 1ª vez entrar devuelve aceptado=false; tras aceptar, true', () => {
  const { modulo, deps } = nuevoModulo();
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.equal(en1.aceptado, false, 'primer acceso: aún no ha aceptado');

  const r = kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en1.token })));
  assert.equal(r.aceptado, true);
  assert.equal(r.version, TERMINOS_VERSION);

  // segundo acceso (nueva sesión): ya no se le pide
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.equal(en2.aceptado, true, 'segundo acceso: no se vuelve a pedir');
});

test('ACEPTA · kiosko: consultar estado con token refleja la aceptación', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  assert.equal(kiosk.terminos(deps, ctx(modulo, K({ token: en.token }))).aceptado, false);
  kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en.token })));
  assert.equal(kiosk.terminos(deps, ctx(modulo, K({ token: en.token }))).aceptado, true);
});

test('ACEPTA · es POR-USUARIO: que e1 acepte no marca a e2 como aceptado', () => {
  const { modulo, deps } = nuevoModulo();
  const e1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: e1.token })));
  const e2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  assert.equal(e2.aceptado, false, 'e2 sigue teniendo que aceptar');
});

test('ACEPTA · Manager: admin debe aceptar la 1ª vez; después no', () => {
  const { modulo, deps } = nuevoModulo();
  assert.equal(manager.terminos(deps, ctx(modulo, { actor: ADMIN })).aceptado, false);
  const r = manager.aceptarTerminos(deps, ctx(modulo, { actor: ADMIN }));
  assert.equal(r.aceptado, true);
  assert.equal(manager.terminos(deps, ctx(modulo, { actor: ADMIN })).aceptado, true);
});

test('ACEPTA · Manager: admin y técnico se registran por separado', () => {
  const { modulo, deps } = nuevoModulo();
  manager.aceptarTerminos(deps, ctx(modulo, { actor: ADMIN }));
  assert.equal(manager.terminos(deps, ctx(modulo, { actor: ADMIN })).aceptado, true);
  assert.equal(manager.terminos(deps, ctx(modulo, { actor: TECH })).aceptado, false, 'el técnico acepta aparte');
});

test('ACEPTA · Manager: exige autenticación y rol (empleado/no-auth denegados)', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(() => manager.terminos(deps, ctx(modulo, { actor: null })), (e) => e.code === 'NO_AUTENTICADO');
  assert.throws(() => manager.aceptarTerminos(deps, ctx(modulo, { actor: { empleadoId: 'e1', rol: 'empleado' } })), (e) => e.code === 'PROHIBIDO');
});

test('ACEPTA · idempotente: aceptar dos veces no duplica fila ni auditoría', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en.token })));
  kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en.token })));
  const filas = deps.db.prepare("SELECT COUNT(*) n FROM presentia_aceptaciones WHERE empleado_id='e1'").get().n;
  assert.equal(filas, 1, 'una sola fila de aceptación');
  const aud = deps.db.prepare("SELECT COUNT(*) n FROM presentia_auditoria WHERE accion='terminos_aceptados'").get().n;
  assert.equal(aud, 1, 'una sola entrada de auditoría');
});

test('ACEPTA · queda auditada (quién/cuándo/versión) sin romper la cadena', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en.token })));
  const fila = deps.db.prepare("SELECT * FROM presentia_auditoria WHERE accion='terminos_aceptados'").get();
  assert.equal(fila.actor_id, 'e1');
  assert.ok(fila.ts);
  assert.match(String(fila.detalle), new RegExp(TERMINOS_VERSION));
  assert.equal(verificarIntegridad(deps.db).ok, true);
});

test('ACEPTA · token de kiosko inválido no permite aceptar', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(() => kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: 'basura' }))), (e) => e.code === 'SESION_KIOSKO');
});
