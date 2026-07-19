# Integración en Expira — procedimiento

Pasos numerados para montar el módulo **Presentia** dentro de Expira. Sigue el orden;
**verifica cada paso antes de pasar al siguiente**. El módulo se diseñó contra una
**interfaz de puertos** (`src/ports.js`) que Expira implementa con sus utilidades reales.

> ⚠️ **Haz una copia de seguridad de la base de datos de Expira ANTES del paso 4 (migración).**
> La migración es aditiva e idempotente, pero la copia de seguridad no es opcional.

## Requisitos previos
- **Node ≥ 22.5** (usa `node:sqlite`). Verifica: `node -v`.
- Handle **SQLite** de Expira accesible (`{ exec, prepare }`, compatible con `node:sqlite`).
- Servidor **Fastify** de Expira disponible para registrar rutas.
- **Copia de seguridad** de la BD hecha y verificada.
- Roles de Expira mapeables a: `empleado`, `local_admin`, `technician` (no hay supervisor/superadmin).

## Paso 1 — Copiar el módulo
Copia la carpeta `presentia-expira/` dentro del repo de Expira (p. ej. `modules/presentia`).
No trae dependencias nuevas (solo `node:` builtins).
**Verifica:** `cd presentia-expira && npm test` → todo en verde.

## Paso 2 — Registrar el backend (una llamada)
```js
import { crearModulo, registrarFastify } from './modules/presentia/src/index.js';

const modulo = crearModulo({
  db:        expira.sqliteHandle,                 // { exec, prepare }
  clock:     { now: () => Date.now() },
  employees: { getById: (id) => expira.empleados.buscar(id),   // -> {id,nombre,rol,activo,avatarUrl}
               list:    () => expira.empleados.activos() },
  pin:       { verify: (id, pin) => expira.pin.verificar(id, pin) },  // tiempo constante
  session:   { resolve: (req) => expira.sesion.actor(req) },          // -> {empleadoId, rol} | null
  correlatives: expira.correlativos && { next: (s, a) => expira.correlativos.siguiente(s, a) }, // opcional
  printing:  expira.impresion && { printTicket: (d) => expira.impresion.ticket(d), renderPdf: expira.impresion.pdf }, // opcional
});
registrarFastify(expira.fastify, modulo, { prefix: '/presentia' });
```
**Verifica:** el servidor arranca sin errores; `GET /presentia/kiosk/empleados` responde `{ ok: true, ... }`.

## Paso 3 — Puertos que Expira debe aportar (contrato)
| Puerto | Obligatorio | Interfaz esperada | Fallback del módulo |
|---|:--:|---|---|
| `db` | **Sí** | `{ exec(sql), prepare(sql) }` (node:sqlite) | — |
| `clock.now` | **Sí** | `() => epoch_ms` | — |
| `employees` | **Sí** | `getById(id)`, `list()` | — |
| `session.resolve` | **Sí** | `(req) => {empleadoId, rol}\|null` | — |
| `pin.verify` | Sí si `exigirPin` | `(id, pin) => boolean` (tiempo constante) | — |
| `correlatives.next` | No | `(serie, anio) => 'F-AAAA-NNNN'` | contador atómico propio |
| `printing` | No | `printTicket(doc)`, `renderPdf(report)` | PDF de texto propio |
| `hash` | No | `hashSecret`, `verifySecret` | scrypt propio |

Si en Expira estas utilidades se llaman distinto, **adapta el objeto del paso 2** (es el único punto de acoplamiento).
**Verifica:** `crearModulo` no lanza (si falta un puerto obligatorio, avisa con mensaje claro).

## Paso 4 — Migración (aditiva e idempotente) — TRAS la copia de seguridad
`crearModulo` ejecuta `migrate(db)` al arrancar: `CREATE TABLE IF NOT EXISTS` de las tablas
`presentia_*`. **Nunca** borra ni altera nada preexistente. Ejecutarla dos veces es no-op.
Tablas: `ajustes, jornadas, marcas, marca_versiones, solicitudes, auditoria, correlativos, pin_intentos, aceptaciones`.
**Verifica:** las 9 tablas existen (`esquemaCompleto(db)`), y las tablas previas de Expira intactas.

## Paso 5 — Manager (React)
Añade la entrada **«Presentia»** al sidebar del Manager y monta:
```jsx
<PresentiaSection rol={rolActual} apiBase="/presentia" />
```
(desde `manager/PresentiaSection.jsx`). El primer acceso exige **aceptar términos**.
**Verifica:** aparece «Presentia» en el sidebar; al abrir, se ve la pantalla de aceptación y, tras aceptar, las 6 pestañas.

## Paso 6 — Kiosko (React en tablets)
Añade la tarjeta **«Fichar»** (verde) al menú del kiosko y la pantalla:
```jsx
<FicharScreen api={apiKiosk} />
```
(desde `kiosk/FicharCard.jsx` y `kiosk/FicharScreen.jsx`).
**Verifica:** la tarjeta «Fichar» aparece en verde; abre, pide PIN y permite fichar.

## Paso 7 — Tema (anti-FOUC)
Incluye en el `<head>` del host el script anti-FOUC de `docs/TEMA-OSCURO.md` (fija el tema
antes del primer render). El botón de tema vive en la cabecera del Manager.
**Verifica:** al cargar en modo oscuro no hay fogonazo blanco; el botón cambia claro/oscuro/auto.

## Paso 8 — Smoke test
```bash
npm run smoke
```
Ejercita el ciclo esencial (migración, PIN, entrada, salida, Registros, horas, informe,
kiosko, auditoría) y **falla ruidosamente** si algo no está. Adáptalo a los puertos reales
para validar la integración real (ver cabecera de `smoke-test.mjs`).
**Verifica:** imprime `SMOKE TEST: OK`.

## Plan de reversión (si algo sale mal)
1. **Quita el registro** del módulo: elimina la llamada `registrarFastify(...)` del paso 2 y el
   montaje de `<PresentiaSection>`/`<FicharScreen>`. Expira vuelve a funcionar sin Presentia.
2. Las tablas `presentia_*` son **aditivas**: pueden quedarse (no afectan a Expira) o
   eliminarse manualmente si se desea (`DROP TABLE presentia_*`) — **solo** sobre la copia/entorno
   correcto, nunca a ciegas en producción.
3. **Restaura la copia de seguridad** del paso previo si la migración se aplicó en un entorno equivocado.
4. Nada de Presentia modifica datos de Expira, así que revertir es quitar el enganche.

## TODO-INTEGRACIÓN (solo cerrables contra el repo real de Expira)
- [ ] **Regresión C11**: comprobar que las funciones previas de Expira (etiquetado, caducidades,
      licencia, Hub, backups, impresión) siguen intactas. Quedó pendiente en la auditoría.
- [ ] Cifrado en reposo de la BD (SQLCipher/disco) y **backups cifrados**.
- [ ] Servidor en **127.0.0.1**; **TLS + auth de dispositivo** si las tablets acceden por red; validar cert. del Hub.
- [ ] **CSP** estricta y cabeceras de seguridad en Manager y kiosko; sin CDNs externas.
- [ ] Electron: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`, sin devtools.
- [ ] **NTP** en el mini-PC (fiabilidad legal del sello temporal).
- [ ] **Empaquetar Inter** (`@font-face`, `shared/fonts.css`) para cumplir la tipografía offline.
- [ ] Validación visual en hardware real (kiosko/tablet/Electron), claro y oscuro.
- [ ] **TODO-LEGAL**: revisar `legal/` con abogado/DPD, sustituir marcadores `[…]`, reverificar el
      estado del RD de registro de jornada en el BOE.
