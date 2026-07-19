// k-fichar-doble-idor-autoaprobar.mjs — Doble pulsación, IDOR en exportación/consulta,
// auto-aprobación de solicitudes, y export CSV sin PIN/hash.
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import { kiosk, manager } from '../../src/http/handlers.js';
import * as repos from '../../src/services/repos.js';

function ctx(modulo, o = {}) {
  return {
    actor: o.actor ?? null, canal: o.canal ?? 'manager', body: o.body ?? {},
    query: o.query ?? {}, params: o.params ?? {}, dispositivo: o.dispositivo ?? 'kiosko-A',
    rate: modulo.rate, kioskSessions: modulo.kioskSessions, descargaTokens: modulo.descargaTokens,
    formato: o.formato, now: modulo.deps.clock.now,
  };
}
const K = (body) => ({ canal: 'kiosk', body });

console.log('=== A) DOBLE PULSACIÓN: mismo token, dos llamadas a fichar() en sucesión inmediata, mismo "now" ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  console.log('Estado inicial: siguienteTipo =', en.estado.siguienteTipo);

  // Simula doble-click: dos peticiones "fichar" seguidas con el MISMO token, SIN avanzar el reloj,
  // como si el usuario tocara el botón dos veces antes de que la app deshabilite el botón.
  const f1 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  console.log('Primera llamada (click 1):', JSON.stringify(f1));
  console.log('Segunda llamada (click 2, mismo instante, mismo token):', JSON.stringify(f2));
  const marcas = repos.marcasDeJornada(deps.db, f1.jornadaId);
  console.log('Marcas resultantes en la jornada:', JSON.stringify(marcas.map(m => ({ tipo: m.tipo, ts: m.ts }))));
  if (f1.tipo === 'entrada' && f2.tipo === 'salida') {
    console.log('>>> El servidor NO protege frente al doble toque: el 2º toque se registró como SALIDA');
    console.log('    inmediata (0 minutos trabajados), abriendo y cerrando la jornada en el mismo instante.');
    console.log('    La única protección es del lado cliente (deshabilitar el botón mientras "enviando").');
  }
}

console.log('\n=== B) Exactamente el mismo timestamp en ambas marcas (jornada de 0 minutos) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const f2 = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
  const inf = manager.informe(deps, ctx(modulo, { actor: { empleadoId: 'a1', rol: 'local_admin' }, query: { desde: '2026-07-01', hasta: '2026-07-31' } }));
  console.log('Informe tras el doble toque:', JSON.stringify(inf.empleados[0].jornadas));
}

console.log('\n=== C) IDOR: intento de leer "mis-registros" de OTRO empleado inyectando empleadoId en el body ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  // e2 ficha unas horas
  const enE2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e2', pin: '6410' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: enE2.token })));

  // e1 inicia sesión (su propio token) pero intenta inyectar empleadoId:'e2' en el body
  const enE1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  const registros = kiosk.misRegistros(deps, ctx(modulo, K({
    token: enE1.token, empleadoId: 'e2', // <-- inyección IDOR
    desde: '2026-07-01', hasta: '2026-07-31',
  })));
  console.log('Respuesta a "mis-registros" de e1 inyectando empleadoId=e2:', JSON.stringify(registros));
  const contieneE2 = JSON.stringify(registros).includes('Bruno');
  console.log('¿Aparecen datos de Bruno (e2) en la respuesta de e1?', contieneE2, contieneE2 ? '>>> IDOR CONFIRMADO' : '(protegido: el empleadoId se ignora, se usa el del token)');
}

console.log('\n=== D) Exportación CSV: contenido no debe incluir PIN/hash/token (fix S-03/K-07: exige token de DESCARGA) ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));

  // El token de SESIÓN ya NO sirve en la query de exportar.
  try {
    kiosk.exportar(deps, ctx(modulo, { canal: 'kiosk', query: { token: en.token, desde: '2026-07-01', hasta: '2026-07-31' } }));
    console.log('(INESPERADO) exportar aceptó el token de sesión en la query');
  } catch (e) {
    console.log('exportar con el TOKEN DE SESIÓN en la query -> RECHAZADO:', e.code, e.publico);
  }

  const { descargaToken } = kiosk.solicitarDescarga(deps, ctx(modulo, K({ token: en.token })));
  const exportado = kiosk.exportar(deps, ctx(modulo, { canal: 'kiosk', query: { token: descargaToken, desde: '2026-07-01', hasta: '2026-07-31' } }));
  const texto = exportado.raw.toString('utf8');
  console.log('CSV exportado (con token de DESCARGA, un solo uso):\n' + texto);
  const sospechoso = /4728|scrypt\$|pinHash|token/i.test(texto);
  console.log('¿Contiene PIN/hash/token?', sospechoso);
}

console.log('\n=== E) Un admin NO debe poder aprobar/rechazar su PROPIA solicitud ===');
{
  const env = crearReferenceEnv();
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  // a1 (admin) también es "empleado" en el kiosko: ficha y crea una solicitud de corrección sobre sí mismo.
  const enA1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'a1', pin: '8391' })));
  const fA1 = kiosk.fichar(deps, ctx(modulo, K({ token: enA1.token })));
  const sol = kiosk.crearSolicitud(deps, ctx(modulo, K({
    token: enA1.token,
    cambio: { accion: 'editar', marcaId: fA1.marcaId, ts: fA1.ts + 15 * 60000 },
    motivo: 'Ajuste de mi propia entrada',
  })));
  console.log('Solicitud creada por a1 sobre sí mismo:', JSON.stringify(sol));

  try {
    const ap = manager.aprobar(deps, ctx(modulo, {
      actor: { empleadoId: 'a1', rol: 'local_admin' }, // el mismo a1, ahora como "manager"
      params: { id: String(sol.id) }, body: { comentario: 'Me lo autoapruebo' },
    }));
    console.log('>>> RESULTADO: a1 pudo APROBAR SU PROPIA solicitud:', JSON.stringify(ap));
    console.log('    Esto es un fallo de separación de funciones (self-approval) si no hay ningún control.');
  } catch (e) {
    console.log('La aprobación de la propia solicitud fue RECHAZADA:', e.code, e.publico);
  }
}

console.log('\n=== F) multi-marca DESACTIVADO: mensaje claro al intentar una 2ª entrada el mismo día ===');
{
  const env = crearReferenceEnv({ config: { variasMarcasDia: false } });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const en1 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en1.token }))); // entrada
  env.reloj.avanzar(3600000);
  const en2 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  kiosk.fichar(deps, ctx(modulo, K({ token: en2.token }))); // salida -> jornada cerrada
  env.reloj.avanzar(3600000);
  const en3 = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
  try {
    kiosk.fichar(deps, ctx(modulo, K({ token: en3.token })));
  } catch (e) {
    console.log('Mensaje mostrado al empleado:', e.code, '|', e.publico);
  }
}

console.log('\n=== G) multi-marca ACTIVADO (por defecto): permite pausas (varias parejas el mismo día) ===');
{
  const env = crearReferenceEnv(); // variasMarcasDia: true por defecto
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const pasos = [];
  for (let i = 0; i < 4; i++) {
    const en = kiosk.entrar(deps, ctx(modulo, K({ empleadoId: 'e1', pin: '4728' })));
    const f = kiosk.fichar(deps, ctx(modulo, K({ token: en.token })));
    pasos.push(f.tipo);
    env.reloj.avanzar(3600000);
  }
  console.log('Secuencia de fichajes (entrada, salida a comer, vuelta, salida):', pasos);
}
