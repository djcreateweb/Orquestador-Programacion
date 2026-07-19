// flujos.test.js — Flujos de negocio de extremo a extremo vía handlers (§ Fase 3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { kiosk, manager } from '../src/http/handlers.js';
import { nuevoModulo, ctx, ADMIN } from './_helpers.js';
import { versionesDeMarca, marcasDeJornada } from '../src/services/repos.js';

const RANGO = { desde: '2026-07-01', hasta: '2026-07-31' };

test('flujo (a): entrada → dentro en Hoy → salida → Registros con horas', () => {
  const { modulo, deps, env } = nuevoModulo();

  const entrar = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  assert.ok(entrar.token);
  assert.equal(entrar.estado.dentro, false);

  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: entrar.token } }));
  assert.equal(f1.tipo, 'entrada');
  assert.equal(f1.codigo, 'F-2026-0001');

  const hoy = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert.equal(hoy.dentroAhora, 1);
  assert.equal(hoy.personasHoy, 1);

  env.reloj.avanzar(4 * 3600 * 1000); // +4h
  const entrar2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: entrar2.token } }));
  assert.equal(f2.tipo, 'salida');
  assert.equal(f2.codigo, 'F-2026-0001'); // misma jornada, mismo código

  const hoy2 = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert.equal(hoy2.dentroAhora, 0);
  assert.equal(hoy2.salidas, 1); // ya fichó salida => se ha ido

  const regs = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(regs.length, 1);
  assert.equal(regs[0].enCurso, false);
  assert.equal(regs[0].minutos, 240);
  assert.equal(regs[0].editado, false);
});

test('flujo (b): olvido → solicitud → aprobación → corregido, editado y original conservado', () => {
  const { modulo, deps, env } = nuevoModulo();

  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e2', pin: '6410' } }));
  const fe = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // sólo entrada
  const jid = fe.jornadaId;

  const salidaTs = deps.clock.now() + 8 * 3600 * 1000;
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk',
    body: { token: en.token, cambio: { accion: 'anadir', jornadaId: jid, tipo: 'salida', ts: salidaTs }, motivo: 'Olvidé fichar la salida' },
  }));
  assert.equal(sol.estado, 'pendiente');

  const ap = manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: { comentario: 'Verificado con encargado' } }));
  assert.equal(ap.estado, 'aprobada');

  const regs = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { ...RANGO, empleadoId: 'e2' } }));
  assert.equal(regs[0].enCurso, false);
  assert.equal(regs[0].editado, true);
  assert.equal(regs[0].minutos, 480);
});

test('flujo (b2): edición directa del admin conserva el valor ORIGINAL', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const fe = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  const marcaId = fe.marcaId;
  const tsOriginal = fe.ts;

  const tsNuevo = tsOriginal + 30 * 60 * 1000;
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId, tsNuevo, motivo: 'Ajuste de reloj del kiosko' } }));

  const versiones = versionesDeMarca(deps.db, marcaId);
  assert.equal(versiones.length, 1);
  assert.equal(Number(versiones[0].valor_anterior), tsOriginal); // original preservado
  assert.equal(Number(versiones[0].valor_nuevo), tsNuevo);
  assert.equal(versiones[0].motivo, 'Ajuste de reloj del kiosko');
});

test('flujo (c): rechazo no cambia nada', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const fe = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  const jid = fe.jornadaId;
  const marcasAntes = marcasDeJornada(deps.db, jid).length;

  const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk',
    body: { token: en.token, cambio: { accion: 'anadir', jornadaId: jid, tipo: 'salida', ts: deps.clock.now() + 3600000 }, motivo: 'prueba' },
  }));
  const rj = manager.rechazar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} }));
  assert.equal(rj.estado, 'rechazada');
  assert.equal(marcasDeJornada(deps.db, jid).length, marcasAntes); // sin cambios
});

test('flujo (d): "mostrar en kiosko" desactivado oculta la lista de empleados', () => {
  const { modulo, deps } = nuevoModulo();
  let emps = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert.ok(emps.length > 0);
  manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { mostrarEnKiosko: false } }));
  emps = kiosk.empleados(deps, ctx(modulo, { canal: 'kiosk' }));
  assert.equal(emps.length, 0);
});

test('informe: total del periodo y exportaciones CSV/PDF', () => {
  const { modulo, deps, env } = nuevoModulo();
  // jornada de 8h para e1
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  env.reloj.avanzar(8 * 3600 * 1000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));

  const inf = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: RANGO }));
  assert.equal(inf.totalPeriodoTexto, '8 h 0 m');

  const csv = manager.informeExport(deps, ctx(modulo, { actor: ADMIN, query: RANGO, formato: 'csv' }));
  assert.ok(csv.raw.startsWith('﻿'));
  assert.match(csv.raw, /TOTAL DEL PERIODO/);

  const pdf = manager.informeExport(deps, ctx(modulo, { actor: ADMIN, query: RANGO, formato: 'pdf' }));
  assert.ok(Buffer.isBuffer(pdf.raw));
  assert.equal(pdf.raw.subarray(0, 5).toString('latin1'), '%PDF-');
});

test('varias marcas/día desactivado impide reabrir jornada', () => {
  const { modulo, deps, env } = nuevoModulo({ config: { variasMarcasDia: false } });
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // entrada
  env.reloj.avanzar(3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } })); // salida -> cerrada
  env.reloj.avanzar(3600000);
  const en3 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  assert.throws(
    () => kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en3.token } })),
    (e) => e.code === 'JORNADA_CERRADA'
  );
});
