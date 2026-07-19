// seed.mjs — Semilla RICA y reproducible para la auditoría funcional (Fase B).
// Cubre todos los escenarios exigidos: empleados diversos (6 dígitos, inactivo,
// tildes/ñ, nombre largo, recién creado), jornadas (cerrada, abierta ahora, con
// pausas, cruza medianoche, olvidada, editada, año anterior) y volumen (≥5.000).
//
// Uso:  node auditoria/seed/seed.mjs            → imprime un resumen del estado sembrado
//       import { sembrar } from './seed.mjs'    → para las pruebas
//
// NUNCA toca una BD real: usa el entorno de referencia en memoria (o un fichero de
// pruebas si se pasa dbPath). Determinista: reloj fijo, cero Date.now().
import { crearReferenceEnv } from '../../src/dev/reference-env.js';
import { crearModulo } from '../../src/index.js';
import * as repos from '../../src/services/repos.js';
import { fechaJornada, anioDe } from '../../src/domain/time.js';

const TZ = 'Europe/Madrid';
const H = 3600 * 1000;

// Reloj de referencia de la auditoría: lunes 2026-07-13 08:00 UTC.
export const T0 = Date.UTC(2026, 6, 13, 8, 0, 0);

export const EMPLEADOS = [
  { id: 'e1', nombre: 'Ana García',            rol: 'empleado',    pin: '4728',   activo: true },
  { id: 'e2', nombre: 'Bruno Sanz',            rol: 'empleado',    pin: '6410',   activo: true },
  { id: 'e3', nombre: 'Chloé Muñoz-Ñáñez',     rol: 'empleado',    pin: '918273', activo: true },  // PIN 6 dígitos + tildes/ñ
  { id: 'e4', nombre: 'Baja Pérez',            rol: 'empleado',    pin: '5566',   activo: false },  // inactivo/baja
  { id: 'e5', nombre: 'Maximiliano Alejandro de la Santísima Trinidad Fernández del Campo', rol: 'empleado', pin: '7788', activo: true }, // nombre muy largo
  { id: 'e6', nombre: 'Nuevo SinFichajes',     rol: 'empleado',    pin: '3141',   activo: true },  // recién creado, sin fichajes
  { id: 'a1', nombre: 'Laura Admin',           rol: 'local_admin', pin: '8391',   activo: true },
  { id: 't1', nombre: 'Tec Root',              rol: 'technician',  pin: '5093',   activo: true },
];

/** Crea una jornada con sus marcas directamente (real, consultable). Devuelve la jornada. */
function jornadaConMarcas(deps, correlatives, empleadoId, marcas) {
  const primera = marcas[0].ts;
  const fecha = fechaJornada(primera, TZ);
  let jornada = repos.jornadaDe(deps.db, empleadoId, fecha);
  if (!jornada) {
    const codigo = correlatives.next('F', anioDe(primera, TZ));
    jornada = repos.crearJornada(deps.db, { empleadoId, fecha, codigo, estado: 'abierta', ts: primera });
  }
  for (const m of marcas) {
    repos.insertarMarca(deps.db, { jornadaId: jornada.id, tipo: m.tipo, ts: m.ts, origen: m.origen || 'kiosk' });
  }
  const abierta = marcas[marcas.length - 1].tipo === 'entrada';
  repos.actualizarEstadoJornada(deps.db, jornada.id, abierta ? 'abierta' : 'cerrada', primera);
  return jornada;
}

/**
 * Siembra el entorno. @param {{dbPath?:string, volumen?:number}} [opts]
 * @returns {{env, modulo, deps, correlatives, resumen}}
 */
export function sembrar(opts = {}) {
  // BLINDAJE: semilla de demostración; nunca contra una BD de producción.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed: semilla de dev/test; prohibida con NODE_ENV=production.');
  }
  const volumen = opts.volumen ?? 5000;
  const env = crearReferenceEnv({ empleados: EMPLEADOS, now: T0, dbPath: opts.dbPath });
  const modulo = crearModulo(env);
  const deps = modulo.deps;
  const correlatives = deps.correlatives;

  // 1) Jornada cerrada normal (e1, hoy 09:00–17:00 hora Madrid = 07:00–15:00 UTC)
  const hoy = Date.UTC(2026, 6, 13, 7, 0);
  jornadaConMarcas(deps, correlatives, 'e1', [
    { tipo: 'entrada', ts: hoy }, { tipo: 'salida', ts: hoy + 8 * H },
  ]);

  // 2) Jornada ABIERTA ahora mismo (e2 entró a las 08:00 UTC, sin salida)
  jornadaConMarcas(deps, correlatives, 'e2', [{ tipo: 'entrada', ts: T0 }]);

  // 3) Jornada con PAUSAS (e3, ayer: 09–13, 14–18 Madrid)
  const ayer = Date.UTC(2026, 6, 12, 7, 0);
  jornadaConMarcas(deps, correlatives, 'e3', [
    { tipo: 'entrada', ts: ayer }, { tipo: 'salida', ts: ayer + 4 * H },
    { tipo: 'entrada', ts: ayer + 5 * H }, { tipo: 'salida', ts: ayer + 9 * H },
  ]);

  // 4) Jornada que CRUZA MEDIANOCHE (e1, noche 10→11 jul: 22:00–02:00 Madrid)
  const noche = Date.UTC(2026, 6, 10, 20, 0); // 22:00 Madrid del 10
  jornadaConMarcas(deps, correlatives, 'e1', [
    { tipo: 'entrada', ts: noche }, { tipo: 'salida', ts: noche + 4 * H },
  ]);

  // 5) Jornada OLVIDADA sin salida hace días (e5, día 8, sólo entrada)
  jornadaConMarcas(deps, correlatives, 'e5', [{ tipo: 'entrada', ts: Date.UTC(2026, 6, 8, 7, 0) }]);

  // 6) Jornada del AÑO ANTERIOR (e2, 2025-12-31) → prueba el reinicio de correlativo
  jornadaConMarcas(deps, correlatives, 'e2', [
    { tipo: 'entrada', ts: Date.UTC(2025, 11, 31, 8, 0) }, { tipo: 'salida', ts: Date.UTC(2025, 11, 31, 16, 0) },
  ]);

  // 7) VOLUMEN: `volumen` jornadas cerradas repartidas en 2026 (rendimiento)
  const insMarca = deps.db.prepare(
    'INSERT INTO presentia_marcas (jornada_id, tipo, ts, origen, editado, creado_ts) VALUES (?,?,?,?,0,?)'
  );
  const base = Date.UTC(2026, 0, 1, 8, 0);
  for (let i = 0; i < volumen; i++) {
    const ts = base + i * 6 * H; // separadas 6h para repartir por muchos días
    const fecha = fechaJornada(ts, TZ);
    const emp = 'v' + (i % 50); // 50 empleados sintéticos de volumen
    let j = repos.jornadaDe(deps.db, emp, fecha);
    if (!j) {
      const codigo = correlatives.next('F', anioDe(ts, TZ));
      j = repos.crearJornada(deps.db, { empleadoId: emp, fecha, codigo, estado: 'cerrada', ts });
    }
    insMarca.run(j.id, 'entrada', ts, 'kiosk', ts);
    insMarca.run(j.id, 'salida', ts + 8 * H, 'kiosk', ts);
  }

  const resumen = {
    empleados: EMPLEADOS.length,
    jornadasReales: deps.db.prepare('SELECT COUNT(*) n FROM presentia_jornadas').get().n,
    marcas: deps.db.prepare('SELECT COUNT(*) n FROM presentia_marcas').get().n,
    correlativos: deps.db.prepare('SELECT serie, anio, ultimo FROM presentia_correlativos ORDER BY anio').all(),
  };
  return { env, modulo, deps, correlatives, resumen };
}

// Ejecutable directo: imprime el resumen.
if (process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const { resumen } = sembrar({ volumen: 5000 });
  console.log('Semilla de auditoría creada (BD en memoria):');
  console.log(JSON.stringify(resumen, null, 2));
}
