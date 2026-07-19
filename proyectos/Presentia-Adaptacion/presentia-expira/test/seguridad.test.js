// seguridad.test.js — Pruebas de seguridad obligatorias (§ Fase 3.4). Cada test
// falla si se rompe la propiedad de seguridad.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kiosk, manager } from '../src/http/handlers.js';
import { verificarIntegridad } from '../src/services/audit.service.js';
import { clasificarPin } from '../src/security/pin-policy.js';
import { TABLAS } from '../src/db/schema.js';
import { nuevoModulo, ctx, ADMIN, TECH } from './_helpers.js';

test('fuerza bruta de PIN: bloqueo tras N intentos + auditado, sin PIN en el log', () => {
  const { modulo, deps, env } = nuevoModulo();
  const intento = (pin) => kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin } }));

  for (let i = 0; i < 3; i++) {
    assert.throws(() => intento('0000'), (e) => e.code === 'PIN_INCORRECTO');
  }
  // ahora bloqueado incluso con el PIN correcto
  assert.throws(() => intento('4728'), (e) => e.code === 'PIN_BLOQUEADO');

  // el intento fallido queda en auditoría, pero NUNCA el PIN
  const filas = deps.db.prepare('SELECT accion, detalle FROM presentia_auditoria').all();
  assert.ok(filas.some((f) => f.accion === 'pin_fallido'));
  for (const f of filas) assert.ok(!String(f.detalle || '').includes('0000'));

  // tras expirar el backoff, el PIN correcto funciona
  env.reloj.avanzar(31_000);
  const ok = intento('4728');
  assert.ok(ok.token);
});

test('IDOR: un empleado no puede crear una solicitud sobre la jornada de otro', () => {
  const { modulo, deps } = nuevoModulo();
  // e2 crea su jornada
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e2', pin: '6410' } }));
  const fe2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));

  // e1 intenta editar la marca de e2
  const en1 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  assert.throws(
    () => kiosk.crearSolicitud(deps, ctx(modulo, {
      canal: 'kiosk',
      body: { token: en1.token, cambio: { accion: 'editar', marcaId: fe2.marcaId, ts: Date.now() }, motivo: 'x' },
    })),
    (e) => e.code === 'PROHIBIDO'
  );
});

test('autorización por rol: empleado no accede al Manager; kiosko tampoco', () => {
  const { modulo, deps } = nuevoModulo();
  // empleado intentando el Manager
  assert.throws(
    () => manager.registros(deps, ctx(modulo, { actor: { empleadoId: 'e1', rol: 'empleado' }, query: {} })),
    (e) => e.code === 'PROHIBIDO'
  );
  // sin sesión (kiosko) intentando el Manager
  assert.throws(
    () => manager.hoy(deps, ctx(modulo, { actor: null })),
    (e) => e.code === 'NO_AUTENTICADO'
  );
  // local_admin no puede la verificación de integridad (sólo técnico)
  assert.throws(
    () => manager.auditoriaVerificar(deps, ctx(modulo, { actor: ADMIN })),
    (e) => e.code === 'PROHIBIDO'
  );
  // técnico sí
  const v = manager.auditoriaVerificar(deps, ctx(modulo, { actor: TECH }));
  assert.equal(v.ok, true);
});

test('ni PIN ni hashes ni tokens aparecen en las respuestas de la API', () => {
  const { modulo, deps } = nuevoModulo();
  const entrar = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const fichar = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: entrar.token } }));
  const emps = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));

  const s = JSON.stringify(entrar) + JSON.stringify(fichar) + JSON.stringify(emps);
  assert.ok(!s.includes('4728'), 'no aparece el PIN');
  assert.ok(!s.includes('scrypt$'), 'no aparece ningún hash');
});

test('auditoría inalterable: alterar una línea rompe la cadena de hashes', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));

  assert.equal(verificarIntegridad(deps.db).ok, true);
  // manipulación directa en BD
  deps.db.prepare("UPDATE presentia_auditoria SET detalle = '{\"x\":1}' WHERE id = (SELECT MIN(id) FROM presentia_auditoria)").run();
  const v = verificarIntegridad(deps.db);
  assert.equal(v.ok, false);
  assert.ok(v.rotoEn != null);
});

test('los registros de jornada no se pueden borrar por la API (no existe endpoint)', () => {
  const claves = [...Object.keys(kiosk), ...Object.keys(manager)];
  for (const k of claves) {
    assert.ok(!/eliminar|borrar|destroy|delete/i.test(k), `handler sospechoso: ${k}`);
  }
});

test('una copia robada de la BD del módulo no revela credenciales (no almacena PIN)', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  for (const t of TABLAS) {
    const filas = deps.db.prepare(`SELECT * FROM ${t}`).all();
    const dump = JSON.stringify(filas);
    assert.ok(!dump.includes('4728'), `PIN filtrado en ${t}`);
    assert.ok(!dump.includes('scrypt$'), `hash filtrado en ${t}`);
  }
});

test('política de PIN: rechaza triviales, acepta razonables', () => {
  assert.equal(clasificarPin('4728').valido, true);
  assert.equal(clasificarPin('0000').debil, true);
  assert.equal(clasificarPin('1234').debil, true);
  assert.equal(clasificarPin('1111').debil, true);
  assert.equal(clasificarPin('12').valido, false); // muy corto
});
