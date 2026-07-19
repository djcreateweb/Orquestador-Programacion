# RELEASE 01 · Inventario (Fase 1) — qué se va y qué se queda

Barrido con `grep -rn` sobre todo `presentia-expira/` + arranque en limpio. Fecha: 2026-07-14.
Regla: código de **producción** = `src/` (sin `src/dev/`), `shared/`, `manager/`, `kiosk/`.
Dev/test = `src/dev/`, `test/`, `dev-preview/`, `auditoria/seed/`.

## Hallazgo capital: la producción YA está limpia
- **Cero referencias** a `../backend` o `../frontend` desde `presentia-expira/` → se pueden borrar sin romper nada.
- **Cero ruido** en producción (`console.*`, `debugger`, `TODO`/`FIXME`/`HACK`). (El único match era la palabra española "Todo" en un comentario.)
- **Cero rutas absolutas / `localhost` / IP** quemadas en producción.
- **Cero dependencias** en el módulo (`package.json` sin `dependencies` ni `devDependencies`; solo `node:` builtins) → superficie de `npm audit` nula.
- `migrate.js` solo crea el **esquema** y siembra los **ajustes por defecto** (config de instalación limpia). **No** crea empleados, fichajes ni solicitudes.

## Tabla de clasificación

| Elemento | Ubicación | SE VA / SE QUEDA | Motivo |
|---|---|:--:|---|
| Empleados/PIN de demo (Ana 4728, Bruno 6410, admin 8391, tec 5093) | `src/dev/reference-env.js` | **SE QUEDA** (dev/test) | Entorno de referencia SOLO dev/test; producción usa los puertos de Expira. Se blinda contra `NODE_ENV=production`. |
| Semilla rica 5.000 registros | `auditoria/seed/seed.mjs` | **SE QUEDA** (dev/test) | Reproducibilidad de la auditoría; BD **en memoria** propia, nunca la real. Se blinda contra producción. |
| Harness de previsualización | `dev-preview/` | **SE QUEDA como herramienta interna** | Único medio para previsualizar/compilar el frontend (el módulo se entrega como fuente que Expira empaqueta). **No se sirve ni empaqueta en producción** (ver `DECISIONES.md` D-020). |
| Fixtures de tests | `test/*.test.js` | **SE QUEDA** | Los tests no son demo. Su semilla no puede correr en producción. |
| Blocklist de PINs débiles (`0000`,`1234`…) | `src/security/pin-policy.js` | **SE QUEDA** | Es la lista de PINs a **rechazar** (seguridad), no credenciales. |
| `secret` en `hash.js` | `src/security/hash.js` | **SE QUEDA** | Nombre de parámetro de la función de hash, no una credencial. |
| Ajustes `fichaje.*` por defecto | `src/ports.js` + `migrate.js` | **SE QUEDA** | Es la instalación limpia, no demo. |
| Migraciones, docs, auditoría, legal, tokens, 2 temas, responsive | varias | **SE QUEDA** | Producto y evidencia. |
| Correos `@example.com`, `127.0.0.1` | `legal/*.md` | **SE QUEDA** | Contenido legal (ejemplos AEPD y descripción de la arquitectura de seguridad), no código. |
| **Presentia original** (Laravel PHP + React) | `../backend/`, `../frontend/` | **SE VA** (Fase 2) | Referencia de solo lectura ya portada; riesgo de código muerto/credenciales/migraciones MySQL. Se archiva con tag y se borra en commit aislado. |

## Datos que se crean solos en un arranque limpio (BD vacía → `migrate`)
Solo las 10 filas de `presentia_ajustes` (config por defecto). **Cero** empleados, fichajes,
solicitudes o aceptaciones. La base parte vacía → es correcto.

## Acciones derivadas para la Fase 2
1. Blindar `reference-env.js` y `seed.mjs` para que **fallen** si `NODE_ENV=production`.
2. Tag `presentia-original-preborrado` + borrar `backend/` y `frontend/` (commit aislado).
3. `version` → `1.0.0`, `CHANGELOG.md`, `LICENSE`.
4. Test "grep de prohibidos" que falle si aparece demo/ruido en producción.
