// fase5-bloqueB.test.js — Regresión FASE 5 · BLOQUE B (seguridad y permisos). Un
// bloque de tests por hallazgo corregido:
//   S-01  bloqueo/backoff de PIN indexado por empleado, no por `x-presentia-dispositivo`
//   S-07  hashSecret/verifySecret asíncronos (no bloquean el bucle de eventos)
//   S-02  ancla tamper-evidente detecta el truncamiento de cola de la auditoría
//   K-02  empleado inactivo bloqueado en TODAS las acciones del kiosko
//   K-03  nadie resuelve su propia solicitud (autoaprobación prohibida)
//   S-06  rate limit en crearSolicitud/misRegistros/exportar
//   S-03/K-07  token de sesión nunca en la URL; token de descarga de un solo uso
//   A-03  CSV de cliente neutraliza inyección de fórmulas (igual que el backend)
//   A-07  UPDATE de aprobar/rechazar exige estado='pendiente' (defensa en profundidad)
//   A-08  manager.* exige canal 'manager' (simétrico al kiosko)
//   A-09  ajustes inválidos se RECHAZAN (ver también auditoria.test.js, C4)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kiosk, manager } from '../src/http/handlers.js';
import { nuevoModulo, ctx, ADMIN, TECH } from './_helpers.js';
import { verificarIntegridad } from '../src/services/audit.service.js';
import * as solicitudes from '../src/services/solicitudes.service.js';

const H = 3600 * 1000;
const K = (body = {}) => ({ canal: 'kiosk', body });

// ===========================================================================
// S-01 — bloqueo/backoff de PIN indexado por empleado, no por dispositivo
// ===========================================================================

test('S-01 · rotar x-presentia-dispositivo YA NO anula el bloqueo por fuerza bruta de PIN', () => {
  const { modulo, deps } = nuevoModulo();
  const intento = (pin, dispositivo) =>
    kiosk.entrar(deps, { ...ctx(modulo, K({ empleadoId: 'e1', pin })), dispositivo });

  let bloqueado = false;
  let intentos = 0;
  for (let i = 0; i < 200 && !bloqueado; i++) {
    intentos++;
    try {
      intento('0000', `dispositivo-falso-${i}`); // rota en CADA intento, como un atacante
    } catch (e) {
      if (e.code === 'PIN_BLOQUEADO') bloqueado = true;
    }
  }
  assert.ok(bloqueado, `200 intentos rotando dispositivo deben acabar bloqueados (se hicieron ${intentos})`);

  // Una única fila de bloqueo para 'e1' (clave fija por empleado, no una por dispositivo).
  const filas = deps.db.prepare("SELECT COUNT(*) n FROM presentia_pin_intentos WHERE empleado_id='e1'").get().n;
  assert.equal(filas, 1, 'el contador de bloqueo es UNO por empleado, no uno por dispositivo');

  // El PIN correcto también queda bloqueado mientras dure el backoff.
  assert.throws(() => intento('4728', 'otro-dispositivo-mas'), (e) => e.code === 'PIN_BLOQUEADO');

  // El rate limiter de `entrar` también usa la identidad, no el dispositivo (S-01).
  const { modulo: m2, deps: d2 } = nuevoModulo();
  let rate429 = 0;
  for (let i = 0; i < 35; i++) {
    try {
      kiosk.entrar(d2, { ...ctx(m2, K({ empleadoId: 'e2', pin: '6410' })), dispositivo: `otro-dispositivo-${i}` });
    } catch (e) {
      if (e.code === 'RATE') rate429++;
    }
  }
  assert.ok(rate429 > 0, 'rotar dispositivo tampoco elude el rate limiter de entrar');
});

// ===========================================================================
// S-07 — hashSecret/verifySecret asíncronos (no bloquean el bucle de eventos)
// ===========================================================================

test('S-07 · hashSecret/verifySecret son asíncronos (crypto.scrypt, no scryptSync) y la verificación sigue siendo correcta', async () => {
  const { hashSecret, verifySecret } = await import('../src/security/hash.js');

  const promesaHash = hashSecret('4728');
  assert.ok(promesaHash instanceof Promise, 'hashSecret debe devolver una Promise (no bloquear en llamar)');
  const hash = await promesaHash;
  assert.match(hash, /^scrypt\$\d+\$\d+\$\d+\$/);

  const promesaVerify = verifySecret('4728', hash);
  assert.ok(promesaVerify instanceof Promise, 'verifySecret debe devolver una Promise');
  assert.equal(await promesaVerify, true, 'el PIN correcto sigue verificando OK');
  assert.equal(await verifySecret('0000', hash), false, 'el PIN incorrecto sigue rechazándose');
  assert.equal(await verifySecret('4728', 'no-es-un-hash-scrypt-valido'), false, 'un hash corrupto no revienta: devuelve false');

  // No bloquea el bucle de eventos: un temporizador paralelo SÍ puede "tickear" mientras
  // se resuelven varias verificaciones (a diferencia de scryptSync, revision/_scripts/08).
  let ticks = 0;
  const iv = setInterval(() => { ticks++; }, 5);
  await Promise.all(Array.from({ length: 10 }, () => verifySecret('0000', hash)));
  clearInterval(iv);
  assert.ok(ticks > 0, `el bucle de eventos debía seguir "vivo" durante las verificaciones async (ticks=${ticks})`);
});

// ===========================================================================
// S-02 — ancla tamper-evidente detecta el truncamiento de cola de la auditoría
// ===========================================================================

test('S-02 · borrar la ÚLTIMA fila de auditoría (truncamiento de cola) ahora SÍ se detecta', () => {
  const { modulo, deps, env } = nuevoModulo();
  for (let i = 0; i < 4; i++) {
    const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
    kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
    env.reloj.avanzar(H);
  }
  assert.equal(verificarIntegridad(deps.db).ok, true, 'la cadena está íntegra antes de manipular nada');

  const lastId = deps.db.prepare('SELECT MAX(id) id FROM presentia_auditoria').get().id;
  deps.db.prepare('DELETE FROM presentia_auditoria WHERE id = ?').run(lastId);

  const v = verificarIntegridad(deps.db);
  assert.equal(v.ok, false, 'el truncamiento de cola debe detectarse gracias al ancla (checkpoint)');
});

test('S-02 · el ancla también detecta borrar VARIAS filas finales de golpe', () => {
  const { modulo, deps, env } = nuevoModulo();
  for (let i = 0; i < 5; i++) {
    const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
    kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
    env.reloj.avanzar(H);
  }
  const total = deps.db.prepare('SELECT COUNT(*) n FROM presentia_auditoria').get().n;
  deps.db.prepare('DELETE FROM presentia_auditoria WHERE id > ?')
    .run(deps.db.prepare('SELECT MIN(id) id FROM presentia_auditoria').get().id + Math.floor(total / 2));
  assert.equal(verificarIntegridad(deps.db).ok, false);
});

// ===========================================================================
// K-02 — empleado inactivo bloqueado en TODAS las acciones del kiosko
// ===========================================================================

test('K-02 · empleado que causa baja DURANTE su sesión pierde el acceso a TODAS las acciones autenticadas', () => {
  const { modulo, deps, env } = nuevoModulo({
    empleados: [{ id: 'e9', nombre: 'Baja Reciente', rol: 'empleado', pin: '1357', activo: true }],
  });
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e9', pin: '1357' })));
  assert.ok(en.token, 'el token se emite mientras el empleado sigue activo');

  // Causa baja MIENTRAS el token de sesión (90s) sigue vigente (Expira marca activo=false
  // en su propio almacén de empleados; aquí se simula mutando el mismo Map de referencia).
  env.empleadosById.get('e9').activo = false;

  const ACCIONES = [
    ['estado', () => kiosk.estado(deps, ctx(modulo, K({ token: en.token })))],
    ['misRegistros', () => kiosk.misRegistros(deps, ctx(modulo, K({ token: en.token, desde: '2026-01-01', hasta: '2026-12-31' })))],
    ['solicitarDescarga', () => kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: en.token })))],
    ['crearSolicitud', () => kiosk.crearSolicitud(deps, ctx(modulo, K({ token: en.token, cambio: { accion: 'anadir' }, motivo: 'x' })))],
    ['aceptarTerminos', () => kiosk.aceptarTerminos(deps, ctx(modulo, K({ token: en.token })))],
    ['terminos', () => kiosk.terminos(deps, ctx(modulo, K({ token: en.token })))],
    ['fichar', () => kiosk.fichar(deps, ctx(modulo, K({ token: en.token })))],
  ];
  for (const [nombre, fn] of ACCIONES) {
    assert.throws(fn, (e) => e.code === 'EMPLEADO_INVALIDO' && e.status === 403, `${nombre} debería bloquear al empleado inactivo`);
  }
});

// ===========================================================================
// K-03 — nadie resuelve su propia solicitud (autoaprobación prohibida)
// ===========================================================================

test('K-03 · un admin NO puede aprobar ni rechazar su propia solicitud (autoaprobación)', () => {
  const { modulo, deps } = nuevoModulo();
  const enA1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'a1', pin: '8391' })));
  const fA1 = kiosk.fichar(deps, ctx(modulo, K({ token: enA1.token })));
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, K({
    token: enA1.token,
    cambio: { accion: 'editar', marcaId: fA1.marcaId, ts: fA1.ts + 15 * 60000 },
    motivo: 'Ajuste de mi propia entrada',
  })));

  assert.throws(
    () => manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} })),
    (e) => e.code === 'AUTOAPROBACION_PROHIBIDA' && e.status === 403
  );
  assert.throws(
    () => manager.rechazar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} })),
    (e) => e.code === 'AUTOAPROBACION_PROHIBIDA'
  );

  // Regresión negativa: OTRO admin/técnico SÍ puede resolverla con normalidad.
  const ap = manager.aprobar(deps, ctx(modulo, { actor: TECH, params: { id: String(sol.id) }, body: {} }));
  assert.equal(ap.estado, 'aprobada');
});

// ===========================================================================
// S-06 — rate limit en crearSolicitud/misRegistros/exportar
// ===========================================================================

test('S-06 · crearSolicitud/misRegistros/solicitarDescarga ahora tienen límite de tasa', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));

  let rateSolicitud = 0;
  for (let i = 0; i < 40; i++) {
    try {
      kiosk.crearSolicitud(deps, ctx(modulo, K({
        token: en.token, cambio: { accion: 'editar', marcaId: f.marcaId, ts: f.ts + i }, motivo: `spam ${i}`,
      })));
    } catch (e) { if (e.code === 'RATE') rateSolicitud++; }
  }
  assert.ok(rateSolicitud > 0, 'crearSolicitud debe limitar tasa (antes: 500/500 aceptadas sin límite)');

  let rateRegistros = 0;
  for (let i = 0; i < 40; i++) {
    try { kiosk.misRegistros(deps, ctx(modulo, K({ token: en.token, desde: '2026-01-01', hasta: '2026-12-31' }))); }
    catch (e) { if (e.code === 'RATE') rateRegistros++; }
  }
  assert.ok(rateRegistros > 0, 'misRegistros debe limitar tasa');

  let rateDescarga = 0;
  for (let i = 0; i < 40; i++) {
    try { kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: en.token }))); }
    catch (e) { if (e.code === 'RATE') rateDescarga++; }
  }
  assert.ok(rateDescarga > 0, 'solicitarDescarga (necesaria para exportar) debe limitar tasa');
});

// ===========================================================================
// S-03 / K-07 — token de sesión nunca en la URL; token de descarga de un solo uso
// ===========================================================================

test('S-03/K-07 · el token de SESIÓN ya no sirve en la query de exportar; se exige un token de DESCARGA de un solo uso', () => {
  const { modulo, deps, env } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));

  const exportarConToken = (token) => kiosk.exportar(deps, {
    ...ctx(modulo, { canal: 'kiosk' }),
    query: { token, desde: '2026-01-01', hasta: '2026-12-31' },
    formato: 'csv',
  });

  // El token de SESIÓN en la query debe ser rechazado (ya no es válido para descargar).
  assert.throws(() => exportarConToken(en.token), (e) => e.code === 'DESCARGA_INVALIDA');

  const { descargaToken } = kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: en.token })));
  const primera = exportarConToken(descargaToken);
  assert.ok(primera.raw, 'con un token de descarga válido, la exportación funciona');

  // Un solo uso: la 2ª vez con el MISMO token de descarga falla.
  assert.throws(() => exportarConToken(descargaToken), (e) => e.code === 'DESCARGA_INVALIDA',
    'el mismo token de descarga no puede reutilizarse (un solo uso)');

  // Vida corta: caduca mucho antes que la sesión de kiosko (90s).
  const { descargaToken: t2 } = kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: en.token })));
  env.reloj.avanzar(21_000);
  assert.throws(() => exportarConToken(t2), (e) => e.code === 'DESCARGA_INVALIDA',
    'el token de descarga caduca en segundos, no en los 90s de la sesión');
});

// ===========================================================================
// A-03 — CSV de cliente neutraliza inyección de fórmulas (igual que el backend)
// ===========================================================================

test('A-03 · escaparCelda neutraliza inyección de fórmulas CSV (= + - @)', async () => {
  const { escaparCelda } = await import('../src/export/csv.js');
  for (const payload of ["=cmd|'/c calc'!A1", '+1+1', '-2+3', '@SUM(A1:A2)', '\tmalicioso']) {
    const celda = escaparCelda(payload);
    assert.ok(celda.startsWith("'"), `"${payload}" debe neutralizarse con apóstrofo inicial`);
  }
  assert.equal(escaparCelda('Ana García'), 'Ana García', 'un valor normal no se toca');
});

test('A-03 · manager/api.js (CSV de cliente) reutiliza escaparCelda de src/export/csv.js, no un escapado propio', () => {
  const src = fs.readFileSync(new URL('../manager/api.js', import.meta.url), 'utf8');
  assert.match(src, /escaparCelda/, 'debe importar/usar escaparCelda');
  assert.match(src, /src\/export\/csv\.js/, 'debe reutilizar la lógica del CSV de backend, no duplicarla');
});

// ===========================================================================
// A-07 — UPDATE de aprobar/rechazar exige estado='pendiente'
// ===========================================================================

test('A-07 · el UPDATE de aprobar exige estado=pendiente: una lectura obsoleta no aplica el cambio dos veces', () => {
  const { modulo, deps } = nuevoModulo();
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  const f = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, K({
    token: en.token, cambio: { accion: 'editar', marcaId: f.marcaId, ts: f.ts + 60000 }, motivo: 'x',
  })));

  // La solicitud YA fue resuelta de verdad en la BD (rechazada)...
  deps.db.prepare("UPDATE presentia_solicitudes SET estado='rechazada', resuelto_por='a1', resuelto_ts=1 WHERE id=?").run(sol.id);

  // ...pero simulamos que el SELECT inicial de aprobar() ve una lectura OBSOLETA que aún
  // dice 'pendiente' (p.ej. una réplica/caché desincronizada por una fracción de segundo).
  const dbReal = deps.db;
  let usado = false;
  const SQL_OBJETIVO = 'SELECT * FROM presentia_solicitudes WHERE id = ?';
  const dbConLecturaObsoleta = {
    exec: (...a) => dbReal.exec(...a),
    prepare(sql) {
      const stmt = dbReal.prepare(sql);
      if (sql.includes(SQL_OBJETIVO) && !usado) {
        usado = true;
        return {
          get: () => ({ id: sol.id, empleado_id: 'e2', estado: 'pendiente', cambio: JSON.stringify(sol.cambio), motivo: sol.motivo }),
          run: (...a) => stmt.run(...a),
          all: (...a) => stmt.all(...a),
        };
      }
      return stmt;
    },
  };

  assert.throws(
    () => solicitudes.aprobar({ ...deps, db: dbConLecturaObsoleta }, { solicitudId: sol.id, actorId: 'a1', actorRol: 'local_admin' }),
    (e) => e.code === 'SOLICITUD_RESUELTA' && e.status === 409,
    'aunque la LECTURA diga "pendiente", el UPDATE con WHERE estado=pendiente debe fallar (0 filas) y traducirse en SOLICITUD_RESUELTA'
  );

  // El estado real sigue siendo 'rechazada' (no se corrompió aplicando un 2º cambio).
  const final = deps.db.prepare('SELECT estado FROM presentia_solicitudes WHERE id=?').get(sol.id);
  assert.equal(final.estado, 'rechazada');
  // La marca tampoco se tocó (aplicarCambio se revirtió junto con el resto de la transacción).
  const marca = deps.db.prepare('SELECT ts FROM presentia_marcas WHERE id=?').get(f.marcaId);
  assert.equal(marca.ts, f.ts, 'el cambio propuesto NO se aplicó (rollback de la transacción)');
});

// ===========================================================================
// S-04 — los metadatos jornada_id/marca_id de crearSolicitud se DERIVAN de `cambio`
// ===========================================================================

test('S-04 · jornada_id/marca_id almacenados se derivan de `cambio` (validado), no de campos de nivel superior inyectados', () => {
  const { modulo, deps } = nuevoModulo();
  // e2 ficha (jornada/marca AJENAS a e1).
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en2.token })));
  // e1 ficha (su PROPIA jornada/marca).
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en1.token })));

  // e1 crea una solicitud: `cambio` referencia SU PROPIA marca (válido), pero intenta
  // inyectar jornadaId/marcaId de NIVEL SUPERIOR apuntando a la jornada/marca de e2.
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, K({
    token: en1.token,
    cambio: { accion: 'editar', marcaId: f1.marcaId, ts: Date.now() },
    motivo: 'prueba de metadatos',
    jornadaId: f2.jornadaId, // inyección: ajeno
    marcaId: f2.marcaId,     // inyección: ajeno
  })));

  const fila = deps.db.prepare('SELECT jornada_id, marca_id FROM presentia_solicitudes WHERE id = ?').get(sol.id);
  assert.notEqual(fila.jornada_id, f2.jornadaId, 'jornada_id NO debe quedar contaminado con la jornada ajena inyectada');
  assert.notEqual(fila.marca_id, f2.marcaId, 'marca_id NO debe quedar contaminado con la marca ajena inyectada');
  assert.equal(fila.marca_id, f1.marcaId, 'marca_id almacenado coincide con el de `cambio` (el propio, validado)');
});

// ===========================================================================
// A-08 — manager.* exige canal 'manager' (simétrico al kiosko)
// ===========================================================================

test('A-08 · manager.* rechaza CANAL_INVALIDO si el canal no es "manager" (simétrico a requireCanalKiosko)', () => {
  const { modulo, deps } = nuevoModulo();
  const ACCIONES = [
    ['hoy', (d, c) => manager.hoy(d, c)],
    ['empleados', (d, c) => manager.empleados(d, c)],
    ['registros', (d, c) => manager.registros(d, c)],
    ['editarMarca', (d, c) => manager.editarMarca(d, c)],
    ['anadirMarca', (d, c) => manager.anadirMarca(d, c)],
    ['crearJornada', (d, c) => manager.crearJornada(d, c)],
    ['informe', (d, c) => manager.informe(d, c)],
    ['informeExport', (d, c) => manager.informeExport(d, c)],
    ['solicitudes', (d, c) => manager.solicitudes(d, c)],
    ['aprobar', (d, c) => manager.aprobar(d, { ...c, params: { id: '1' } })],
    ['rechazar', (d, c) => manager.rechazar(d, { ...c, params: { id: '1' } })],
    ['ajustesGet', (d, c) => manager.ajustesGet(d, c)],
    ['ajustesPut', (d, c) => manager.ajustesPut(d, c)],
    ['auditoriaVerificar', (d, c) => manager.auditoriaVerificar(d, c)],
    ['terminos', (d, c) => manager.terminos(d, c)],
    ['aceptarTerminos', (d, c) => manager.aceptarTerminos(d, c)],
  ];
  for (const [nombre, fn] of ACCIONES) {
    assert.throws(
      () => fn(deps, ctx(modulo, { canal: 'kiosk', actor: TECH, body: {}, query: {} })),
      (e) => e.code === 'CANAL_INVALIDO',
      `${nombre} debería exigir canal 'manager' (recibió canal 'kiosk')`
    );
  }
  // Regresión negativa: con canal 'manager' (el real) y rol admin, sigue funcionando.
  assert.equal(manager.hoy(deps, ctx(modulo, { canal: 'manager', actor: ADMIN })).dentroAhora, 0);
});

// ===========================================================================
// A-09 — ajustes inválidos se RECHAZAN (más casos; ver también auditoria.test.js, C4)
// ===========================================================================

test('A-09 · ajustesPut rechaza tipos/enums inválidos con AJUSTE_INVALIDO (400), no los acota', () => {
  const { modulo, deps } = nuevoModulo();
  assert.throws(
    () => manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { temaPorDefecto: 'invalido-xyz' } })),
    (e) => e.code === 'AJUSTE_INVALIDO' && e.status === 400
  );
  assert.throws(
    () => manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { jornadaEstandarMin: -50 } })),
    (e) => e.code === 'AJUSTE_INVALIDO'
  );
  assert.throws(
    () => manager.ajustesPut(deps, ctx(modulo, { actor: ADMIN, body: { exigirPin: 'si-por-favor' } })),
    (e) => e.code === 'AJUSTE_INVALIDO', 'un booleano debe ser boolean de verdad, no una cadena'
  );
});
