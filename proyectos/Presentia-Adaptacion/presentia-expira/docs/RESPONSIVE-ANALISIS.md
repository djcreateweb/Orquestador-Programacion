# RESPONSIVE · FASE 1 — Análisis

> Análisis del estado responsive del módulo Presentia (kiosko + Manager) **antes** de
> tocar código. Evidencia obtenida en navegador real (Chrome vía Playwright) sobre el
> arnés `dev-preview`, midiendo `scrollWidth`/`clientWidth` y el tamaño real de cada
> control, a 320 / 375 / 414 / 768 / 1024 / 1280 / 1440 / 1920 px, tema claro y oscuro.
> Capturas y `report.json` en el scratchpad de la sesión (no se versionan).

---

## 0. Resumen ejecutivo (qué está bien y qué no)

| Hallazgo | Estado actual | Veredicto |
|---|---|---|
| **Scroll horizontal del documento** | El módulo **no** desborda a ningún ancho (medido `moduleOverflow = 0` a 320 px). Las tablas ya viven dentro de `overflow-x:auto`. El único desborde a 320 px lo causaba la **barra del arnés** `dev-preview`, no el módulo. | ✅ Base sana |
| **Kiosko táctil** | Ya diseñado _touch-first_: botón de fichar enorme, teclado PIN grande, tarjetas de empleado grandes. **Único** control <44 px del módulo: `.pk-volver` (47×36). | 🟡 Casi perfecto |
| **Tablas de datos en móvil** | Se ven **cortadas**: en `Registros` a 320 px, las columnas `Estado` y los botones `Editar`/`Añadir marca` quedan **fuera de pantalla** (solo accesibles con scroll dentro del contenedor). Ningún dato se pierde, pero la acción es invisible. | 🔴 A mejorar (tarjetas) |
| **Objetivos táctiles del Manager** | Decenas de controles <44 px: pestañas (37 px), botones de fila `.px-btn--sm` (~24 px), toggles, ítems del índice legal, inputs de filtro. En `Registros` con un mes de datos: **~195 controles <44 px**. | 🔴 A corregir |
| **Inputs <16 px en móvil** | `.px-input/.px-select/.px-textarea` a 0,88 rem (~14 px) y los date-input del kiosko (`.pk-btn`, ~15 px) → **zoom automático de iOS** al enfocar. | 🔴 A corregir |
| **`vh` en vez de `dvh`** | 6 usos de `vh` en alturas máximas (modales, visores) → recorte bajo la barra del navegador móvil. | 🔴 A corregir |
| **Safe-area (notch / barra gestual)** | Ningún `env(safe-area-inset-*)`. Toasts y overlays pegados al borde. | 🟠 A añadir |
| **Tipografía fluida** | Todo en `rem` fijos; sin `clamp`. El reloj del kiosko (3,5 rem) y KPIs (2 rem) no escalan. | 🟠 A suavizar (sin superar el tamaño actual en escritorio) |
| **Dependencia de `hover`** | Los hover son **realce**, no la única vía: los botones de fila del Manager están **siempre visibles** (no aparecen al pasar el ratón). No hay acciones ocultas tras hover. | ✅ Sin bloqueo |
| **Tema claro/oscuro** | Ambos correctos en todos los anchos (redefinición de primitivas por `data-tema-efectivo`). | ✅ Se conserva |

**Conclusión:** no hay que rediseñar. Hay que (1) convertir las tablas de datos en tarjetas
apiladas en estrecho, (2) agrandar los objetivos táctiles del Manager en contextos táctiles,
(3) `dvh` + safe-area + inputs ≥16 px, y (4) tipografía fluida acotada. El kiosko apenas
necesita retoques. Cero dependencias, cero colores nuevos, un componente por pantalla.

---

## 1. Inventario de pantallas y elementos

### 1.1 Kiosko (`kiosk/`, prefijo `.pk-`) — pantalla táctil de cocina
| Pantalla / componente | Archivo | Elementos a vigilar |
|---|---|---|
| Tarjeta de menú «Fichar» | `FicharCard.jsx` | Tarjeta verde grande (`.pk-card`) — ya enorme |
| Aviso de tratamiento (RGPD) | `AvisoTratamiento.jsx` | Overlay `.pk-aviso-overlay` + modal `.pk-aviso` (`max-height:90vh`), «Ver más» desplegable (`.pk-aviso__mas` `45vh`) |
| Elegir empleado | `FicharScreen.jsx` (vista `empleados`) | Rejilla `.pk-empleados` (`minmax(8rem,1fr)`), enlace legal (`.pk-enlace-legal`) |
| Teclado PIN | `FicharScreen.jsx` (vista `pin`) | Puntos `.pk-pin-puntos`, teclado `.pk-teclado` (`max-width:18rem`), teclas `.pk-tecla`, `.pk-volver` |
| Panel de fichaje | `FicharScreen.jsx` (vista `panel`) | Avatar, **reloj `.pk-reloj` (3,5 rem)**, badge dentro/fuera, **botón enorme `.pk-boton-ficha` (1,9 rem)**, botonera `.pk-acciones` (`.pk-btn`) |
| Aceptación de términos | `shared/AceptacionTerminos.jsx` | Caja `.acepta__caja` (`min(56rem,100%)`), visor `.acepta__doc` (`46vh`), tabs, checkbox, acciones |
| Información legal | `InfoLegal.jsx` | Tabs `.pk-legal-tabs`, visor `.pk-legal-doc` (`60vh`) |
| **Mis registros** | `MisRegistros.jsx` | Filtros (date-inputs como `.pk-btn`), **tabla `.pk-tabla` (`min-width:30rem`)**, total `.pk-total`, toast |

### 1.2 Manager (`manager/`, prefijo `.px-`) — Electron / escritorio
| Pantalla / sub-pestaña | Archivo | Elementos a vigilar |
|---|---|---|
| Contenedor | `PresentiaSection.jsx` | Cabecera `.px-header`, insignia de modo, **6 pestañas `.px-tabs/.px-tab`** con contador |
| **Hoy** | `tabs/Hoy.jsx` | KPIs `.px-kpis` (3), **tabla `.px-tabla`** (Empleado·Tipo·Hora·Código), autorefresco 15 s |
| **Registros** | `tabs/Registros.jsx` | Filtros (Desde·Hasta·Empleado·Exportar), **tabla de 7 col.** (Empleado·Fecha·Entrada·Salida·Código·Estado·Acciones), **2 botones de fila** `.px-btn--sm`, **modales** Editar/Añadir marca |
| **Informe de horas** | `tabs/InformeHoras.jsx` | Filtros + Exportar CSV/PDF, **una tabla por empleado** (Fecha·Código·Entrada·Salida·Horas), caja `.px-info-box` (Total) |
| **Solicitudes** | `tabs/Solicitudes.jsx` | Sub-tabs (Pend./Aprob./Rech.), **lista `.px-solicitud`** (ya en fichas), botones Aprobar/Rechazar `.px-btn--sm`, **modal** Resolver |
| **Ajustes** | `tabs/Ajustes.jsx` | 2 inputs numéricos, **4 toggles `.px-toggle`** (48×27), acciones Descartar/Guardar |
| **Legal** | `tabs/Legal.jsx` | Rejilla `.px-legal` (aside índice + visor) — **ya tiene breakpoint 720 px**; ítems `.px-legal__item`, buscador, Imprimir/Descargar |
| Insignias, Toast, prosa (Markdown) | `components/`, `shared/prosa.css` | `.px-insignia`, `.px-toast-zona` (`bottom:1.25rem`), tablas de prosa (`.prosa__tabla` `min-width:34rem`) |

### 1.3 Estados transversales (todos deben verse bien)
Cargando (`.px-estado`/`.pk-estado`), error (`.px-error`/`.pk-mensaje--error`), vacío (mensajes «No hay…»), toasts (`.px-toast`/`.pk-toast`).

---

## 2. Tabla de problemas (pantalla · ancho · problema · severidad)

> Severidad: 🔴 alta (rompe función/estándar) · 🟠 media (incomodidad real) · 🟡 baja (pulido).

| # | Pantalla | Ancho | Problema | Sev. |
|---|---|---|---|---|
| P1 | Manager · Registros | ≤ ~700 px | Tabla de 7 col. se corta: `Estado` y botones `Editar`/`Añadir marca` fuera de pantalla; solo con scroll dentro del contenedor. | 🔴 |
| P2 | Manager · Hoy / Informe | ≤ ~700 px | Tablas (`min-width:640px`) requieren scroll lateral dentro del contenedor; densas para el pulgar. | 🟠 |
| P3 | Kiosko · Mis registros | ≤ ~480 px | Tabla `min-width:30rem` con scroll interno; date-inputs pequeños. | 🟠 |
| P4 | Manager · todos | cualquiera con dedo | Pestañas 37 px de alto (<44). | 🔴 |
| P5 | Manager · Registros/Solicitudes/Informe/Legal | cualquiera con dedo | Botones de fila `.px-btn--sm` ~24 px de alto; en `Registros` con datos reales **~195** controles <44 px. | 🔴 |
| P6 | Manager · filtros | ≤ ~560 px | `Desde/Hasta/Empleado/Exportar` amontonados en una fila que envuelve de forma irregular. | 🟠 |
| P7 | Manager · inputs | móvil (iOS) | `font-size` 0,88 rem (<16 px) → zoom automático al enfocar. | 🔴 |
| P8 | Kiosko · Mis registros | móvil (iOS) | date-inputs con `.pk-btn` (~15 px) → zoom automático. | 🟠 |
| P9 | Manager · modales (Editar/Añadir/Resolver) | móvil | `max-height:90vh` (recorte con barra del navegador); en pantalla pequeña ocupan el centro con velo, no aprovechan el ancho; botón de acción puede quedar tras scroll. | 🔴 |
| P10 | Kiosko · avisos/visores | móvil | `90vh/60vh/45vh/46vh` con `vh` → recorte bajo la barra del navegador. | 🔴 |
| P11 | Todos · toasts/overlays | móvil con notch | Sin `env(safe-area-inset-*)`; toasts pegados al borde inferior/gestual. | 🟠 |
| P12 | Kiosko · panel | ≤ 360 px | Reloj `3,5 rem` casi toca los bordes; sin margen de respiración. | 🟡 |
| P13 | Kiosko · navegación | cualquiera con dedo | `.pk-volver` (← Volver/Salir) 47×36 (<44 de alto). | 🟡 |
| P14 | Manager · Ajustes | cualquiera con dedo | Toggle 48×27 (área de toque baja aunque el ancho basta). | 🟡 |
| P15 | Legal · prosa | móvil | Tablas Markdown arbitrarias (`min-width:34rem`) con scroll interno (inevitable: contenido variable). | 🟡 (aceptado) |

---

## 3. Anclajes rígidos encontrados en el CSS

| Tipo | Ubicación | Detalle |
|---|---|---|
| `min-width` de tabla | `manager/presentia.css` `.px-tabla` | `min-width:640px` (fuerza scroll <640). |
| `min-width` de tabla | `kiosk/kiosk.css` `.pk-tabla` | `min-width:30rem`. |
| `min-width` de tabla | `shared/prosa.css` `.prosa__tabla` | `min-width:34rem` (contenido arbitrario). |
| `vh` (no `dvh`) | `presentia.css` `.px-modal` | `max-height:90vh`. |
| `vh` (no `dvh`) | `kiosk.css` `.pk-aviso`, `.pk-legal-doc`, `.pk-aviso__mas` | `90vh / 60vh / 45vh`. |
| `vh` (no `dvh`) | `shared/aceptacion.css` `.acepta__doc` | `46vh`. |
| Tamaños de fuente fijos <16 px en inputs | `presentia.css` inputs; `kiosk.css` `.pk-btn` usados como date-input | 0,88 rem / 0,95 rem. |
| Fuentes «display» fijas | `.pk-reloj` 3,5 rem · `.pk-boton-ficha` 1,9 rem · `.px-kpi__valor` 2 rem · `.pk-total__valor` / `.px-info-box__valor` | Candidatas a `clamp` (acotado). |
| Posiciones fijas sin safe-area | `.pk-toast-zona` `bottom:2rem`, `.px-toast-zona` `bottom:1.25rem`, overlays `inset:0` con `padding` fijo | Añadir `env(safe-area-inset-*)`. |

**No hay** `position:absolute` con píxeles críticos, ni anchos de layout fijos que no encojan
(los contenedores usan `max-width` + `margin:auto` o rejillas fluidas), ni lógica dependiente de `hover`.
`box-sizing:border-box` ya es global en ambos prefijos. **Un** breakpoint ya existe (`720px` en `.px-legal`).

---

## 4. Objetivos táctiles <44 px (inventario)

Medido con dedo (`hasTouch`) sobre datos reales. Excluye el chrome del arnés `dev-preview`.

| Control | Tamaño actual | Dónde | Acción |
|---|---|---|---|
| `.px-tab` | ~ancho×37 | 6 pestañas del Manager + sub-tabs de Solicitudes | `min-height:44px` en táctil |
| `.px-btn--sm` | ~24 alto | Registros (Editar/Añadir), Solicitudes (Aprobar/Rechazar), Legal (Imprimir/Descargar) | 44 px en táctil / tarjeta |
| `.px-btn` | ~30 alto | Botones normales del Manager | `min-height:44px` en táctil |
| `.px-toggle` | 48×27 | Ajustes (4) | Alto de área táctil a 44 (bola/box igual) |
| `.px-legal__item` | ~30 alto | Índice legal | `min-height:44px` en táctil |
| `.px-input/.px-select` | ~34 alto | Filtros | `min-height:44px` + ≥16 px en táctil |
| `.pk-volver` | 47×36 | Kiosko (← Volver/Salir) | `min-height:44px` |
| `.pk-btn` (como date-input) | ~36 alto | Kiosko · Mis registros | `min-height:44px` + ≥16 px |

Kiosko `.pk-tecla` (~57 alto), `.pk-boton-ficha` (~90 alto), `.pk-card`, `.pk-empleado` **ya ≥44**.

---

## 5. Estrategia por tabla (elegida y justificada)

| Tabla | Estrategia | Justificación |
|---|---|---|
| **Registros** (7 col. + 2 acciones) | **Tarjetas apiladas** ≤ 640 px: una ficha por jornada, campos etiquetados (`td[data-label]::before`), acciones a ancho completo. En ≥641 tabla normal. | Es la más recomendada por el brief; ninguna columna ni acción se pierde y las acciones dejan de quedar fuera de pantalla (P1). |
| **Hoy · Marcas del día** (4 col.) | **Tarjetas apiladas** ≤ 640 px (mismo patrón). | Coherencia visual y pulgar cómodo; 4 columnas caben pero la ficha lee mejor (P2). |
| **Informe de horas** (5 col., una tabla por empleado) | **Tarjetas apiladas** ≤ 640 px dentro de cada panel de empleado; la caja «Total» se mantiene. | Mismo patrón reutilizado; el total por empleado y del periodo se conservan (P2). |
| **Mis registros (kiosko)** (5 col.) | **Tarjetas apiladas** ≤ 560 px; en pantalla de kiosko grande, tabla normal. | El kiosko suele ser ≥10", pero si se incrusta estrecho no debe cortarse (P3). |
| **Solicitudes** | **Ya son fichas** (`.px-solicitud`): solo se ajusta el apilado de acciones y el truncado del motivo. | No es `<table>`; ya cumple. |
| **Prosa / Legal (Markdown)** | **Scroll horizontal contenido** (se mantiene `.prosa__tabla-wrap`), reduciendo `min-width`. | Contenido de tablas arbitrario (RAT, etc.): no se puede «tarjetizar» de forma genérica; scroll dentro del contenedor es la opción correcta (P15). |

Patrón de tarjeta = **CSS puro** con `td[data-label]` + `@media`: el mismo componente cambia de
`<table>` a bloques; se añade solo el atributo `data-label` en el JSX (sin lógica nueva, sin
componente móvil aparte → cumple §5 «un componente, varios diseños»).

---

## 6. Breakpoints propuestos (mobile-first, pocos y claros)

El proyecto solo tenía uno (`720px`). Se define un conjunto explícito y se **documenta**:

| Token | Ancho | Uso principal |
|---|---|---|
| _(base)_ | **≥ 320 px** | Estilo por defecto = **móvil**. Una columna, controles a ancho completo, tablas como **tarjetas**. |
| `--bp-sm` | **480 px** | Ajustes finos de móvil grande (rejillas de 2 col. donde quepan). |
| `--bp-md` | **640 px** | **Umbral tabla↔tarjeta.** ≥640 px las tablas vuelven a `<table>`; filtros en línea. |
| `--bp-lg` | **1024 px** | Tablet apaisada / escritorio compacto: `.px-legal` a 2 columnas (sustituye al 720 previo, alineado), densidades de escritorio. |
| `--bp-xl` | **1440 px** | Escritorio amplio: sin cambios de layout, solo holgura. |

**Contextos de entrada** (ortogonales al ancho):
- `@media (any-pointer: coarse)` → objetivos táctiles ≥44 px e inputs ≥16 px **siempre que haya dedo** (cubre kiosko, tablet, móvil y portátil táctil), preservando la densidad de escritorio con ratón.
- `@media (prefers-reduced-motion: reduce)` → ya respetado en tokens; se mantiene.
- `env(safe-area-inset-*)` en toasts, overlays y hojas inferiores.
- Alturas completas con **`dvh`** (no `vh`).

**Regla de la tipografía fluida:** `clamp(min, vw, max)` con **`max` = tamaño actual de escritorio**,
de modo que en escritorio queda **idéntico** al diseño actual y solo **encoge** en pantallas
pequeñas (nunca crece por encima) — respeta el invariante «modo claro idéntico en escritorio».

---

## 7. Plan de archivos (Fase 2)

1. `shared/tokens.css` — añadir tokens de breakpoint (documentales) y de tipografía fluida (`clamp`), sin alterar los existentes.
2. **`shared/responsive.css`** _(nuevo)_ — utilidades y reglas transversales mobile-first: objetivo táctil en `any-pointer:coarse`, inputs ≥16 px, safe-area de toasts, patrón genérico tabla→tarjeta. Importado por `kiosk.css` y `presentia.css`.
3. `manager/presentia.css` + tabs JSX — tarjetas en Registros/Hoy/Informe (`data-label`), filtros full-width, modales como hoja inferior, `dvh`.
4. `kiosk/kiosk.css` + JSX — reloj/botón con `clamp` acotado, `.pk-volver` 44 px, tabla de Mis registros a tarjetas, `dvh` + safe-area en avisos.
5. `shared/aceptacion.css` — `dvh`, botones de acción alcanzables, hoja inferior en móvil.
6. `test/responsive.test.js` _(nuevo, Fase 3)_ — análisis estático sin dependencias (guardarraíl de regresión).

Verificación (Fase 3): matriz real en Chrome (Playwright, script de scratchpad) a los 8 anchos ×
2 orientaciones × 2 temas + `npm test`/`lint` en verde.
