# DECISIONES.md — registro duda → decisión → motivo

> Bitácora de decisiones tomadas en modo autónomo (§0.2 del prompt maestro).
> Cada entrada: **Duda → Decisión → Motivo**. Revisión humana *a posteriori*.

---

## D-001 · ¿Está disponible el código real de Expira y el PDF funcional?
- **Duda:** El prompt define dos modos excluyentes (§1.2/§1.3) según si el código de Expira y el PDF están en el workspace.
- **Decisión:** Trabajar en **modo "Expira NO disponible"**. Se diseña contra una **interfaz de integración explícita** (`src/ports.js`), con migración aislada y aditiva, documentando supuestos en `INTEGRACION-EN-EXPIRA.md`.
- **Motivo:** Reconocimiento del sistema (2026-07-13): no existe ninguna carpeta `*xpira*` ni el PDF `Expira-Documentacion-Funcional-Presentia.pdf` en Desktop/Documents/Downloads. Los tokens de diseño (§1.1) y la funcionalidad (§3) vienen embebidos en el prompt, así que esa parte no depende del PDF.

## D-002 · Stack del módulo
- **Duda:** ¿Reproducir Laravel/MySQL o alinearse con Expira (Node/Fastify/SQLite/React/Electron)?
- **Decisión:** **Node + Fastify + SQLite + React/Vite (+ Electron para el Manager)**, como Expira. Se descarta todo PHP/Laravel/MySQL/Sanctum/axios/Leaflet.
- **Motivo:** El objetivo (§2) es que Presentia sea *un módulo dentro de Expira*, sin procesos ni BD nuevos. La fuente de verdad técnica es Expira, no el Laravel original (que sólo se usa como referencia de reglas de negocio).

## D-003 · Base de datos sin dependencias
- **Duda:** ¿Qué driver de SQLite usar sin añadir dependencias (§6.5: cero deps nuevas)?
- **Decisión:** Módulo **`node:sqlite`** integrado en Node ≥ 22 (aquí Node 24.13.1). Cero dependencias.
- **Motivo:** Evita `better-sqlite3`/`sqlite3` como dependencia nueva. En integración real, si Expira ya expone un handle SQLite, el módulo usa **ese** vía el puerto `db` (regla de oro §1.3: no crear BD nueva).

## D-004 · Migración aditiva e idempotente
- **Duda:** ¿Cómo crear el esquema sin violar la regla de oro (§1.3: prohibido drop/reset/fresh)?
- **Decisión:** Un único `src/db/migrate.js` con `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` sobre tablas con prefijo **`presentia_`**. Sin `DROP`, sin `migrate:fresh`, sin borrar ficheros `.db`. Ejecutar dos veces = no-op. Pruebas contra BD **en memoria** (`:memory:`) o copia.
- **Motivo:** Cumple §1.3 y §6.4 (nada preexistente se toca). El prefijo evita colisiones de nombres con tablas de Expira.

## D-005 · Hashing de credenciales (fallback)
- **Duda:** Argon2id no está en la stdlib de Node; ¿qué usar sin dependencias?
- **Decisión:** Delegar en el puerto `hash` de Expira si existe. Fallback propio: **`crypto.scrypt`** (memory-hard, con sal de 16 bytes, parámetros N=2^15) y **comparación en tiempo constante** (`crypto.timingSafeEqual`). Se documenta Argon2id como preferente si el host lo aporta.
- **Motivo:** `scrypt` es KDF lento y memory-hard incluido en `node:crypto` → cumple §6.1 sin dependencias. El módulo **no** almacena PIN/contraseñas en claro en ningún sitio.

## D-006 · HTTP agnóstico del framework
- **Duda:** Testear rutas Fastify exigiría Fastify como dependencia de test.
- **Decisión:** Lógica en **handlers puros** `(ctx) => resultado` (validación + autorización + servicio). Un adaptador fino `fastify-adapter.js` los registra en la instancia Fastify que aporta Expira. Los tests ejercitan los handlers con un `ctx` simulado.
- **Motivo:** Cero dependencias en test, y la autorización/validación queda en código portable y verificable.

## D-007 · Exportación PDF sin dependencias
- **Duda:** Generar PDF suele requerir librería (pdfkit).
- **Decisión:** Primario vía puerto `printing`/`report` de Expira. Fallback: **escritor PDF mínimo propio** (`src/export/pdf.js`, un solo objeto de texto, fuente Helvetica del core PDF) que produce un PDF válido sin dependencias.
- **Motivo:** Cumple exportación CSV **y PDF** (§5.3) manteniendo cero deps.

## D-008 · Autenticación: cero login propio
- **Duda:** ¿Cómo autenticar sin Sanctum ni usuarios nuevos?
- **Decisión:** El módulo **no** gestiona login. Recibe el contexto autenticado (`employeeId`, `role`) del middleware de sesión de Expira vía puerto `session`. El PIN del kiosko se verifica con el puerto `pin.verify(employeeId, pin)`. El módulo añade **rate-limit + bloqueo/backoff** como control compensatorio del PIN de 4 dígitos (§6.1).
- **Motivo:** §2 (reutilizar empleados y sus PIN, cero login propio, cero Sanctum) y §6.2.

## D-009 · Zona horaria y cruce de medianoche
- **Duda:** ¿Cómo calcular horas de jornadas que cruzan medianoche y con qué zona horaria?
- **Decisión:** Timestamps almacenados en **UTC (epoch ms)**; la fecha "de jornada" (`fecha`) se calcula en la **zona horaria del centro** (config `zonaHoraria`, por defecto `Europe/Madrid`) vía `Intl.DateTimeFormat`. Las horas = suma de intervalos entrada→salida emparejados; una salida posterior a medianoche pertenece a la jornada de su entrada. Redondeo configurable aplicado al total.
- **Motivo:** Evita errores de DST y de fecha local; cumple §3 (emparejar entrada/salida) y §8 (riesgos).

## D-010 · Auditoría encadenada por hash (append-only)
- **Duda:** ¿Cómo hacer la auditoría inalterable y verificable (§6.4)?
- **Decisión:** Tabla `presentia_auditoria` **append-only**; cada fila guarda `quien/que/cuando/desde/porque` y `hash = sha256(prev_hash + payload_canónico)`. Función `verificarIntegridad()` recomputa la cadena. Los registros de jornada **nunca** se borran ni sobrescriben: las correcciones crean **versiones nuevas** conservando el valor original (`presentia_marca_versiones`).
- **Motivo:** §5.3 + §6.4 (inalterabilidad, trazabilidad, detección de manipulación).

## D-011 · Cero biometría, cero geolocalización
- **Duda:** El Presentia original usa Leaflet/geolocalización.
- **Decisión:** **Eliminado**. El módulo no recoge ni almacena datos biométricos ni de geolocalización. Se documenta en la cláusula informativa y en CUMPLIMIENTO.
- **Motivo:** Criterio AEPD (biometría prohibida como sistema ordinario) y principio de minimización (§5.1.3). Un kiosko fijo de cocina no necesita geolocalización.

---

# Responsive (adaptación a todos los dispositivos)

## D-012 · Cómo cumplir «objetivo táctil 44 px en toda la app» sin perder densidad de escritorio
- **Duda:** Forzar 44 px de alto en todos los controles siempre inflaría las tablas densas del Manager con ratón (escritorio/Electron), contra el invariante «diseño de escritorio idéntico».
- **Decisión:** Los objetivos táctiles se agrandan a ≥44 px bajo **`@media (any-pointer: coarse)`** (hay dedo: kiosko, tablet, móvil, portátil táctil) y en los breakpoints de móvil, **conservando** la densidad con ratón fino (escritorio) intacta. El `.px-btn--sm` denso de las filas de tabla solo existe en escritorio-ratón; en táctil o en la vista de tarjeta pasa a 44 px.
- **Motivo:** 44 px es una guía **para dedos**; aplicarla condicionada al puntero cumple el objetivo donde importa sin romper el diseño de escritorio (§1.1) ni la densidad de información del Manager.

## D-013 · Estrategia de tablas: tarjetas apiladas por CSS + `data-label`
- **Duda:** ¿Tarjetas, columnas prioritarias o scroll contenido para cada tabla?
- **Decisión:** **Tarjetas apiladas** (≤640 px) para las tablas de datos propias (`Registros`, `Hoy`, `Informe`, `Mis registros` del kiosko), con CSS puro (`display:block` + `td[data-label]::before`) y solo el atributo `data-label` añadido en el JSX. Las tablas **Markdown** de `Legal/prosa` (contenido arbitrario) mantienen **scroll horizontal contenido**.
- **Motivo:** Ningún dato ni acción se pierde y se elimina el corte de columnas/acciones fuera de pantalla. Un solo componente con dos diseños (§5): no hay versión móvil aparte. Las tablas de prosa no son «tarjetizables» genéricamente.

## D-014 · Tipografía fluida acotada (nunca crece por encima del actual)
- **Duda:** `clamp` haría el reloj del kiosko y los KPIs **más grandes** en pantallas anchas, cambiando el diseño de escritorio.
- **Decisión:** `clamp(min, preferido-vw, max)` con **`max` = tamaño actual** de cada pieza. En escritorio queda idéntico; solo **encoge** en pantallas estrechas para no desbordar.
- **Motivo:** Cumple «escala sin romperse» (§Contenido) sin violar «modo claro idéntico en escritorio» (invariante §1.2).

## D-015 · Tests de regresión responsive sin dependencias
- **Duda:** Un test de `scrollWidth`/área táctil real necesita navegador; añadir Playwright/jsdom violaría «cero dependencias nuevas».
- **Decisión:** (a) **Guardarraíl versionado**: `test/responsive.test.js` de **análisis estático** del CSS (node:test, cero deps) — falla si reaparecen `vh` en alturas máximas, inputs <16 px en táctil, `min-width` de tabla fuera de un contenedor `overflow-x`, o faltan las reglas de 44 px. (b) **Verificación real** de Fase 3 con Playwright **cacheado por npx** + Chrome del sistema, ejecutado desde el **scratchpad** (no es dependencia del módulo).
- **Motivo:** Mantiene el entregable en cero dependencias (§Invariantes) y aun así deja un test que corre en `npm test` y una verificación empírica reproducible.

## D-016 · Conjunto de breakpoints
- **Duda:** El proyecto solo tenía `720px` (en `.px-legal`).
- **Decisión:** Breakpoints explícitos **480 / 640 / 1024 / 1440**; el umbral tabla↔tarjeta es **640**. El `720px` de `.px-legal` se reemplaza por **1024** (una columna hasta tablet apaisada), alineado con el resto.
- **Motivo:** Pocos y coherentes (§Layout); 640 es el punto natural donde una tabla de datos deja de caber cómodamente.

## D-017 · Filtros en móvil: apilados a ancho completo (no hoja colapsable)
- **Duda:** El brief sugiere «colapsados en un panel o una hoja».
- **Decisión:** En móvil los filtros se **apilan a ancho completo** en columna ordenada (no amontonados), sin introducir un panel colapsable con estado nuevo en cada pestaña.
- **Motivo:** Cumple «nunca amontonados» con cero lógica nueva y menor riesgo de regresión; un `<details>` por pestaña añadiría estructura repetida. Revisable si se pide el colapso explícito.

## D-018 · Modales como hoja inferior en móvil, con acción siempre alcanzable
- **Duda:** Los modales centrados con velo son incómodos en móvil y su botón de acción puede quedar tras scroll.
- **Decisión:** ≤640 px los modales (`.px-modal`, `.pk-aviso`, `.acepta__caja`) pasan a **hoja inferior** a ancho completo, alto máximo en `dvh`, esquinas superiores redondeadas y **pie de acciones fijo** (sticky) para que Guardar/Aceptar sea siempre alcanzable sin scroll infinito. Safe-area en el borde inferior.
- **Motivo:** Patrón móvil estándar; garantiza «modal se abre, se lee, se cierra y su acción se alcanza» (§Fase 3).

## D-012 · Aceptación de términos en el primer acceso (por usuario)
- **Duda:** ¿Cómo exigir la aceptación de términos solo la primera vez, por usuario y para ambos roles?
- **Decisión:** Tabla aditiva `presentia_aceptaciones` (empleado_id, versión, ts). El empleado la acepta tras el PIN antes del panel; el admin/técnico antes de las pestañas. Idempotente y **auditada** (prueba de consentimiento). Versión `TERMINOS_VERSION` para poder re-exigir si cambian. Persistencia por **usuario** en el backend (no por dispositivo), para que sobreviva entre dispositivos. El gate muestra **todos** los documentos legales (decisión del usuario).
- **Motivo:** Consentimiento informado trazable; "una sola vez por usuario nuevo".

## D-013 · Tema claro/oscuro/auto — modelo de dos atributos
- **Duda:** ¿Cómo soportar `auto` sin duplicar el bloque de tokens oscuros en un `@media`?
- **Decisión:** `<html>` lleva `data-tema` (preferencia: claro|oscuro|auto) y `data-tema-efectivo` (resuelto: claro|oscuro). El CSS solo mira `data-tema-efectivo` → **un único bloque oscuro**. El JS y el script anti-FOUC resuelven `auto` con `matchMedia` y escuchan sus cambios. Se redefinen **solo las primitivas** de tokens; los alias siguen por cascada.
- **Motivo:** Regla de oro (trabajo de tokens, no de parches); evita duplicar media queries y `if(oscuro)` en componentes.

## D-014 · Texto sobre botones y enlaces en tema oscuro
- **Duda:** Con acciones más luminosas en oscuro, el texto blanco sobre botones y el azul de enlace no llegan a AA.
- **Decisión:** En oscuro, `--color-text-on-accent` pasa a **oscuro** (`#0f172a`) → texto legible sobre botones claros (verde/azul/rojo), AA en los tres. Los **enlaces** usan un token propio `--color-enlace` = `#7ea6f0` (más luminoso, mismo tono) que cumple 4.5:1 sobre superficies. La **elevación** en oscuro se hace con superficie + borde (sombras redefinidas con `0 0 0 1px` de borde), no con sombra negra.
- **Motivo:** WCAG AA obligatorio; la sombra negra no se ve sobre fondo oscuro.

## D-015 · El kiosko sigue `auto`; el PDF exportado va siempre en claro
- **Duda:** ¿Debe el empleado poder cambiar el tema del kiosko?
- **Decisión:** El kiosko **no** lleva botón (dispositivo compartido de cocina): usa la preferencia del dispositivo si existe y, si no, **`auto`** (se oscurece de noche). El botón vive solo en el Manager. El **PDF exportado** se genera siempre en claro (es un documento, independiente del tema de la UI).
- **Motivo:** Menos fricción en un kiosko compartido; `auto` adapta día/noche sin intervención.

## D-019 · `dev-preview/` se conserva como herramienta interna (no producción)
- **Duda:** el prompt de release marca `dev-preview/` como andamiaje a eliminar.
- **Decisión:** se **conserva** como herramienta interna de previsualización y compilación. El módulo se entrega como **fuente** que Expira empaqueta; `dev-preview` es el único medio para previsualizar el frontend y validar el build/SSR sin el repo de Expira. **No se sirve ni se empaqueta en producción** (su `node_modules`/`dist` están ignorados; su `api-server` usa el entorno de referencia, blindado contra `NODE_ENV=production`).
- **Motivo:** conservar la capacidad de verificación sin introducir riesgo de producción (excepción explícita que el prompt permite).

## D-020 · Eliminación del Presentia original (Laravel + React)
- **Duda:** ¿borrar `backend/` y `frontend/` o conservarlos de referencia?
- **Decisión:** **eliminados** tras verificar que `presentia-expira/` no los referencia y que todo lo CONSERVAR/ADAPTAR ya estaba portado. Archivados en el tag `presentia-original-preborrado` (recuperable). Borrado en commit aislado y verificación completa en verde sin ellos.
- **Motivo:** riesgo real (código muerto, deps sin mantener, migraciones MySQL, credenciales antiguas, confusión). La referencia ya no aporta.

## D-021 · Nota de numeración de decisiones
- **Incidencia (menor):** las decisiones D-012…D-015 aparecen **duplicadas** (bloque responsive y bloque tema/aceptación) por dos tandas de trabajo. No se renumeran para no romper las referencias `D-0xx` citadas en `shared/responsive.css` y otros. Léanse por su título, que es inequívoco.
