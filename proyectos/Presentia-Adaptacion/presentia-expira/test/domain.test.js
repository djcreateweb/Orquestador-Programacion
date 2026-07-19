// domain.test.js — Lógica pura de dominio (§ Fase 3: cálculo de horas, redondeo,
// medianoche, correlativo, zona horaria).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emparejarSegmentos, minutosTrabajados, aplicarRedondeo,
  resumenJornada, siguienteTipo, formatearDuracion,
} from '../src/domain/jornadas.js';
import { formatearCodigo, parsearCodigo } from '../src/domain/correlativo.js';
import { fechaJornada, anioDe, primerDiaDelMes, ultimoDiaDelMes } from '../src/domain/time.js';

const TZ = 'Europe/Madrid';

test('horas: una jornada con pausa suma los dos segmentos', () => {
  const marcas = [
    { tipo: 'entrada', ts: Date.UTC(2026, 0, 1, 8, 0) },
    { tipo: 'salida', ts: Date.UTC(2026, 0, 1, 12, 0) },
    { tipo: 'entrada', ts: Date.UTC(2026, 0, 1, 13, 0) },
    { tipo: 'salida', ts: Date.UTC(2026, 0, 1, 17, 0) },
  ];
  assert.equal(minutosTrabajados(marcas), 480); // 4h + 4h
  assert.equal(emparejarSegmentos(marcas).length, 2);
});

test('horas: jornada que cruza medianoche se computa correctamente', () => {
  const marcas = [
    { tipo: 'entrada', ts: Date.UTC(2026, 0, 1, 22, 0) },
    { tipo: 'salida', ts: Date.UTC(2026, 0, 2, 0, 0) },
  ];
  assert.equal(minutosTrabajados(marcas), 120); // 2h
});

test('redondeo: al múltiplo más cercano, 0 = sin redondeo', () => {
  assert.equal(aplicarRedondeo(130, 15), 135);
  assert.equal(aplicarRedondeo(130, 0), 130);
  assert.equal(aplicarRedondeo(127, 5), 125);
});

test('estado: en curso cuando falta la salida', () => {
  const abierta = [{ tipo: 'entrada', ts: Date.UTC(2026, 0, 1, 9, 0) }];
  const r = resumenJornada(abierta, { redondeoMin: 0 });
  assert.equal(r.enCurso, true);
  assert.equal(r.salida, null);
  assert.equal(siguienteTipo(abierta), 'salida');
  assert.equal(siguienteTipo([]), 'entrada');
});

test('formatearDuracion', () => {
  assert.equal(formatearDuracion(510), '8 h 30 m');
  assert.equal(formatearDuracion(480), '8 h 0 m');
});

test('correlativo: formato y parseo F-AAAA-NNNN', () => {
  assert.equal(formatearCodigo('F', 2026, 1), 'F-2026-0001');
  assert.equal(formatearCodigo('F', 2026, 12345), 'F-2026-12345');
  assert.deepEqual(parsearCodigo('F-2026-0007'), { serie: 'F', anio: 2026, n: 7 });
  assert.equal(parsearCodigo('no-valido'), null);
});

test('zona horaria: fecha de jornada bucketiza en la zona del centro (no UTC)', () => {
  // 23:30 UTC del 1 de enero = 00:30 del 2 de enero en Madrid (UTC+1)
  const ts = Date.UTC(2026, 0, 1, 23, 30);
  assert.equal(fechaJornada(ts, TZ), '2026-01-02');
  assert.equal(anioDe(ts, TZ), 2026);
});

test('rango por defecto: primer y último día del mes', () => {
  const ts = Date.UTC(2026, 6, 13, 10, 0); // julio
  assert.equal(primerDiaDelMes(ts, TZ), '2026-07-01');
  assert.equal(ultimoDiaDelMes(ts, TZ), '2026-07-31');
});
