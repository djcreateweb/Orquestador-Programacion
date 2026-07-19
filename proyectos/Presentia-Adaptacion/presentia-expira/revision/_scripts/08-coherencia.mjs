// 08-coherencia.mjs — Coherencia entre pantallas: kiosko -> Hoy; Registros -> Informe;
// Solicitudes (aprobar) -> fichaje real. Y el caso de corrupción de estado detectado
// en 03-registros-limites.mjs (inversión horaria) propagado entre pantallas.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {}, query: o.query ?? {},
    params: o.params ?? {}, dispositivo: o.dispositivo ?? 'script', rate: modulo.rate,
    kioskSessions: modulo.kioskSessions, formato: o.formato, now: modulo.deps.clock.now,
  };
}
const ADMIN = { empleadoId: 'a1', rol: 'local_admin' };
function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

// --- Lo fichado en kiosko aparece en Hoy ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  const hoy = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert(hoy.dentroAhora === 1, 'lo fichado (entrada) en kiosko se refleja al instante en Hoy (dentroAhora=1)');
  assert(hoy.marcas.some(m => m.codigo === f.codigo && m.tipo === 'entrada'), 'la marca exacta (código+tipo) aparece en la lista de Hoy');
}

// --- Lo corregido en Registros se refleja en Informe ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } }));
  env.reloj.avanzar(3 * 3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } }));

  const infAntes = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  assert(infAntes.empleados[0].totalMinutos === 180, 'informe ANTES de corregir: 3h = 180 min');

  // Corrección en Registros: mover la salida 2h más tarde (editarMarca)
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f2.marcaId, tsNuevo: f2.ts + 2 * 3600000, motivo: 'Corrección QA coherencia' } }));

  const infDespues = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  assert(infDespues.empleados[0].totalMinutos === 300, `el Informe refleja la corrección de Registros al instante: 5h = 300 min (obtenido ${infDespues.empleados[0].totalMinutos})`);
}

// --- Lo aprobado en Solicitudes cambia el fichaje (y se ve en Registros/Informe) ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // solo entrada
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, {
    canal: 'kiosk', body: { token: en.token, cambio: { accion: 'anadir', jornadaId: f1.jornadaId, tipo: 'salida', ts: deps.clock.now() + 4 * 3600000 }, motivo: 'Coherencia QA' },
  }));

  const regAntes = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  assert(regAntes[0].enCurso === true, 'Registros ANTES de aprobar: jornada en curso');

  manager.aprobar(deps, ctx(modulo, { actor: ADMIN, params: { id: String(sol.id) }, body: {} }));

  const regDespues = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  const infDespues = manager.informe(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  assert(regDespues[0].enCurso === false, 'Registros DESPUÉS de aprobar: ya NO está en curso');
  assert(regDespues[0].minutos === 240, `Registros refleja 4h=240min tras aprobar (obtenido ${regDespues[0].minutos})`);
  assert(infDespues.empleados[0].totalMinutos === 240, 'Informe coincide EXACTAMENTE con Registros tras la aprobación (240 min)');

  const hoyDespues = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert(hoyDespues.dentroAhora === 0 && hoyDespues.salidas === 1, 'Hoy también refleja el cambio: la persona ya no está "dentro", cuenta como salida');
}

// --- HALLAZGO: edición con inversión horaria produce INCOHERENCIA entre Hoy/Registros ---
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f1 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en.token } })); // entrada
  env.reloj.avanzar(4 * 3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, { canal: 'kiosk', body: { empleadoId: 'e1', pin: '4728' } }));
  const f2 = kiosk.fichar(deps, ctx(modulo, { canal: 'kiosk', body: { token: en2.token } })); // salida (persona YA se fue)

  let hoyAntes = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  assert(hoyAntes.dentroAhora === 0 && hoyAntes.salidas === 1, 'antes de la edición: la persona figura como "se ha ido" en Hoy (correcto)');

  // El admin edita la ENTRADA por error y la deja DESPUÉS de la salida real (typo de hora)
  manager.editarMarca(deps, ctx(modulo, { actor: ADMIN, body: { marcaId: f1.marcaId, tsNuevo: f2.ts + 3600000, motivo: 'QA: typo de hora' } }));

  const hoyDespues = manager.hoy(deps, ctx(modulo, { actor: ADMIN }));
  const regDespues = manager.registros(deps, ctx(modulo, { actor: ADMIN, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  console.log('INFO: tras editar la entrada con un ts POSTERIOR a la salida ->', JSON.stringify({ hoy: hoyDespues, registros: regDespues[0] }));

  // El sistema ahora considera a la persona "DENTRO" (dentroAhora=1) aunque en realidad
  // ya fichó su salida hace horas: la UI de Hoy mostraría a un empleado como presente
  // cuando físicamente no lo está, sin ninguna validación ni aviso al admin.
  assert(hoyDespues.dentroAhora === 1, `HALLAZGO CONFIRMADO: tras una edición con inversión horaria, Hoy pasa a mostrar dentroAhora=1 (persona "dentro") pese a que YA había fichado salida (obtenido dentroAhora=${hoyDespues.dentroAhora})`);
  assert(regDespues[0].enCurso === true, 'HALLAZGO CONFIRMADO: Registros también muestra la jornada como "en curso" (ámbar) tras la edición, aunque tiene 2 marcas (entrada+salida)');
  assert(regDespues[0].minutos === 0, 'y las horas computadas caen a 0 sin ningún aviso de inconsistencia al admin');
}

console.log('--- fin 08-coherencia.mjs ---');
