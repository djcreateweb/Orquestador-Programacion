# RELEASE 02 · Limpieza y endurecimiento (Fase 2)

## Eliminado
- **Presentia original**: `backend/` (Laravel + MySQL + Sanctum) y `frontend/` (React/Vite)
  — 142 archivos. Archivado en el tag `presentia-original-preborrado` (recuperable).
  Verificado antes de borrar: `presentia-expira/` no los referenciaba (ni imports, ni
  assets, ni fuentes, ni config, ni scripts). Commit aislado para revertir con facilidad.
- Referencias a `backend/`/`frontend/` en el `README.md` y `.gitignore` de la raíz.

## Endurecido
- **`reference-env.js` y `auditoria/seed/seed.mjs`**: lanzan error con `NODE_ENV=production`.
  Imposible sembrar datos de demo o PINs contra una BD real. (Test lo verifica.)
- **Instalación limpia demostrada**: BD vacía + `migrate` → **cero** empleados, fichajes,
  solicitudes o aceptaciones; solo los 10 ajustes por defecto. Test `RELEASE · arranque limpio`.
- **Cero credenciales por defecto**: el módulo no crea usuarios ni PIN; la identidad y la
  verificación de PIN las aporta Expira por sus puertos. El primer acceso exige **aceptar
  términos** (por usuario) y, si `exigirPin`, un PIN verificado por el host.
- **Guardarraíl de release** (`test/release.test.js`): falla si en producción aparece
  `console.*`, `debugger`, `TODO/FIXME/HACK/XXX`, PIN/empleado de demo, datos ficticios,
  rutas absolutas del disco o `localhost`/IP.

## Se conservó (no es demo)
- Ajustes `fichaje.*` por defecto (instalación limpia), migraciones, tests + fixtures,
  `docs/`, `auditoria/`, `legal/`, tokens, los dos temas y el responsive.
- **`dev-preview/`** como **herramienta interna** de previsualización/compilación (el módulo
  se entrega como fuente que Expira empaqueta; no se sirve ni empaqueta en producción).
  Ver `DECISIONES.md` D-020.

## Estado del código de producción (verificado por grep + test)
- Sin `console.*`, sin `debugger`, sin `TODO/FIXME/HACK`.
- Sin rutas absolutas, sin `localhost`/IP quemadas.
- **Cero dependencias** en el módulo (`package.json` sin `dependencies`); solo `node:` builtins.
- `npm audit` (dev-preview): 0 vulnerabilidades.

## Versionado
- `version` → **1.0.0**; `CHANGELOG.md` y `LICENSE` (propietario, coherente con `legal/`) añadidos.
- Tag de entrega `v1.0.0` (Fase 5).
