# 01 · INFORME DE AUDITORÍA FUNCIONAL — Presentia (módulo de registro de jornada)

**Fecha:** 2026-07-13 · **Auditor:** QA senior (autónomo) · **Entorno:** Node v24.13.1,
BD SQLite en memoria/fichero de pruebas (cero destrucción) · **Alcance:** módulo
`presentia-expira` completo (servidor, dominio, Manager, kiosko, seguridad, legal).

---

## Veredicto

> **APTO PARA PRODUCCIÓN — con salvedades de entorno.**
>
> El **núcleo funcional del módulo** (fichaje, cálculo de horas, correcciones
> versionadas, solicitudes, ajustes, seguridad, auditoría inalterable, exportaciones,
> migración y operación) está **verificado con ejecución real y pasa al 100 %**
> (78/78 casos). Se encontraron **2 defectos**, ambos **corregidos y protegidos con
> pruebas de regresión** (1 MAYOR de turnos de noche, 1 MENOR de inyección CSV).
>
> Quedan áreas que **no se pueden verificar en este entorno** y requieren la
> integración real con Expira y un kiosko/navegador reales (ver §Limitaciones). No
> son defectos; son límites del banco de pruebas. La decisión de "apto" final para el
> despliegue integrado exige cerrar esas verificaciones en el entorno de Expira.

---

## Cobertura

- **Casos ejecutados:** 78 / 78 del catálogo (0 en ⛔ NO VERIFICADO dentro del alcance ejecutable).
- **Nuevos casos de auditoría:** 50 (`test/auditoria.test.js`), sobre 28 previos.
- **Áreas cubiertas con ejecución real:** validaciones de API y códigos de error;
  matriz rol×acción completa **incluidas denegaciones**; kiosko paso a paso; cada
  ajuste en sus dos estados y su efecto real; cálculo de horas (normal, pausas,
  medianoche, **DST**); redondeo; correlativo (sin huecos/duplicados, reinicio anual,
  UNIQUE); zona horaria; migración idempotente y no destructiva; **backup + restauración**;
  **corte de luz** (rollback por SAVEPOINT); inyección CSV/SQL; XSS; auditoría
  encadenada (alteración y borrado); no-borrado de fichajes; conservación legal;
  volumen ≥5.000; nombres con tildes/ñ/emojis.
- **Verificación estática:** paleta/tokens/fuente Inter, cero colores hardcodeados,
  ausencia de biometría/geolocalización, no escucha en `0.0.0.0`, `npm audit` limpio,
  lint (`node --check`) y **build del frontend** correctos.

## Resultados por bloque

| Bloque | Resultado | Nota |
|---|---|---|
| C1 · API y servidor | ✅ 9/9 | validaciones y códigos HTTP correctos; BD vacía sin errores |
| C2 · Roles y permisos | ✅ 6/6 | matriz completa; denegaciones auditables; rol del cliente ignorado |
| C3 · Kiosko | ✅ 7/7 | PIN, inactivo, toggle, caducidad de sesión, sólo-lo-propio |
| C4 · Manager | ✅ 9/9 | KPIs, filtros, informe a mano, export, ajustes con efecto y persistencia |
| C5 · Reglas de negocio | ✅ 7/7 | DST, redondeo, correlativo, **turno de noche (corregido)** |
| C6 · Datos/migración/operación | ✅ 6/6 | idempotente, no destructiva, **backup+restauración**, rollback |
| C7 · Seguridad | ✅ 10/10 | CSV (corregido), SQL, XSS, fuerza bruta, auditoría, sin fugas |
| C8 · Legal | ✅ 4/4 | original conservado, quién/cuándo/por qué, acceso trabajador, 4 años |
| C9 · Diseño | ⚠️ estático | tokens/paleta/Inter OK; renderizado no verificable aquí |
| C10 · Robustez | ✅ 3/3 | volumen 5k, emojis/tildes, rango invertido |
| C11 · Regresión de Expira | ⛔ | Expira no disponible (ver §Limitaciones) |

## Defectos (detalle en `02-DEFECTOS.md`)

| ID | Severidad | Título | Estado |
|---|---|---|---|
| DEF-001 | MAYOR | Turnos de noche: salida tras medianoche no cerraba la jornada | ✅ CORREGIDO |
| DEF-002 | MENOR | Inyección de fórmulas en exportación CSV | ✅ CORREGIDO |

0 defectos BLOQUEANTE/CRÍTICO. 0 MAYOR abiertos. 0 MENOR abiertos.
Observaciones (no defectos): OBS-1..OBS-4 en `02-DEFECTOS.md`.

## Limitaciones — lo que NO se ha podido probar y por qué (honestidad)

1. **Regresión de Expira (C11): ⛔ no verificable.** El módulo se construyó contra una
   **interfaz de puertos** (`src/ports.js`) porque *"el código real de Expira no estaba
   disponible"* (ver README y `docs/INTEGRACION-EN-EXPIRA.md`). No existe aquí la app
   Expira ejecutable, así que no se puede comprobar que sus funciones previas
   (etiquetado, caducidades, licencia, Hub, backups, impresión) sigan intactas. **Debe
   verificarse en el entorno de integración real de Expira.**
2. **Capa HTTP Fastify real: ⚠️ parcial.** `fastify-adapter.js` recibe la instancia
   Fastify del host (no es dependencia del módulo). Se han probado directamente los
   **handlers** que el adaptador invoca (autorización, validación, datos, descargas),
   pero no un servidor Fastify levantado. El adaptador es fino (mapeo de errores y
   cabeceras); revisado por inspección.
3. **Diseño renderizado (C9): ⚠️ estático.** Se verificó la definición de tokens, la
   paleta exacta, la fuente Inter y la ausencia de colores hardcodeados, pero **no** el
   render en píxeles, el área táctil real, ni las insignias MODO ADMIN/TÉCNICO en
   pantalla. Requiere navegador/kiosko real (el `dev-preview` permite inspección visual manual).
4. **Electron (`contextIsolation`/`nodeIntegration`): 🚫 no aplica aquí.** El módulo es
   agnóstico de UI; no incluye shell Electron. Debe auditarse en el empaquetado de Expira.
5. **Hardware del kiosko / impresora / mini-PC / corte de red físico:** simulados a
   nivel lógico (rollback, best-effort de impresión, mensajes de error), no con hardware.

## Recomendaciones antes del despliegue integrado
- Ejecutar C11 (regresión de Expira) y la capa Fastify real en el entorno de Expira.
- Revisión visual del `dev-preview` contra las capturas del PDF de diseño.
- Decidir sobre OBS-1 (¿debe `jornadaEstandarMin` alimentar el informe de horas extra?).
