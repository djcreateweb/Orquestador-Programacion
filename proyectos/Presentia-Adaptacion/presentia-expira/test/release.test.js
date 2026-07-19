// release.test.js — Guardarraíl de RELEASE: falla si el código de PRODUCCIÓN contiene
// datos de demostración, credenciales de ejemplo, ruido de desarrollo, rutas absolutas
// del disco o valores de entorno quemados. Ámbito: runtime del módulo (src sin src/dev,
// shared, manager, kiosk). Se EXCLUYEN a propósito: test/, dev-preview/, auditoria/,
// docs/, legal/, src/dev/ (dev/test), y este propio fichero.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Ficheros de código de producción (.js/.jsx), excluyendo dev/test. */
function ficherosProduccion() {
  const dirs = ['src', 'shared', 'manager', 'kiosk'];
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (p.replace(/\\/g, '/').endsWith('src/dev')) continue; // dev/test
        walk(p);
      } else if (/\.(js|jsx)$/.test(e.name)) {
        out.push(p);
      }
    }
  };
  for (const d of dirs) walk(path.join(RAIZ, d));
  return out;
}

const PROHIBIDOS = [
  { nombre: 'console.*', re: /console\.\w+\s*\(/ },
  { nombre: 'debugger', re: /\bdebugger\b/ },
  { nombre: 'marcador TODO/FIXME/HACK/XXX', re: /\b(TODO|FIXME|HACK|XXX)\b/ }, // mayúsculas (evita "Todo")
  { nombre: 'PIN/empleado de demo', re: /4728|6410|8391|5093|Ana Garc|Bruno Sanz|Laura Admin|Tec Root/ },
  { nombre: 'datos ficticios', re: /@example\.com|\bdummy\b|\blorem\b|Juan P[eé]rez|\bfoo\b|\bbar\b/i },
  { nombre: 'ruta absoluta del disco', re: /[A-Z]:\\\\?Users|\/home\/\w/ },
  { nombre: 'host/puerto quemado', re: /localhost|127\.0\.0\.1|0\.0\.0\.0/ },
];

test('RELEASE · el código de producción no contiene demo, credenciales ni ruido', () => {
  const hallazgos = [];
  for (const f of ficherosProduccion()) {
    const texto = fs.readFileSync(f, 'utf8');
    texto.split('\n').forEach((linea, i) => {
      for (const p of PROHIBIDOS) {
        if (p.re.test(linea)) {
          hallazgos.push(`${path.relative(RAIZ, f)}:${i + 1} [${p.nombre}]  ${linea.trim().slice(0, 80)}`);
        }
      }
    });
  }
  assert.deepEqual(hallazgos, [], `prohibidos en producción:\n${hallazgos.join('\n')}`);
});

test('RELEASE · versión 1.0.0 y sin dependencias de producción', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.0');
  assert.equal(pkg.dependencies, undefined, 'el módulo no debe traer dependencias nuevas');
});

test('RELEASE · un arranque limpio no crea datos de demostración (solo config)', async () => {
  const { crearReferenceEnv } = await import('../src/dev/reference-env.js');
  const { crearModulo } = await import('../src/index.js');
  const env = crearReferenceEnv({ empleados: [] }); // host SIN empleados
  const deps = crearModulo(env).deps;
  const cuenta = (t) => deps.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
  assert.equal(cuenta('presentia_jornadas'), 0, 'cero jornadas');
  assert.equal(cuenta('presentia_marcas'), 0, 'cero marcas');
  assert.equal(cuenta('presentia_solicitudes'), 0, 'cero solicitudes');
  assert.equal(cuenta('presentia_aceptaciones'), 0, 'cero aceptaciones');
  // Lo único sembrado: la config por defecto (instalación limpia). 12 claves: las 10
  // originales + `maxDuracionJornadaMin` (fix K-01) + `ventanaAntiRebotarFichajeSeg` (fix K-04).
  assert.equal(cuenta('presentia_ajustes'), 12, 'solo los 12 ajustes por defecto');
});
