# CLAUDE.md — MCU Tracker

## Qué es

Tracker de visionado del Universo Cinematográfico Marvel (MCU) + saga X-Men.
Aplicación estática sin build step: funciona en local con `localStorage` y,
cuando se configura Firebase, añade Google Sign-In y sincronización con
Cloud Firestore.

- HTML5 + CSS3 + JavaScript vanilla (ES2017, IIFE, `'use strict'`)
- Persistencia local en `localStorage`; Firebase es opcional y no debe impedir
  el funcionamiento local cuando la configuración está vacía
- Fuentes: Google Fonts (Anton, Oswald, Inter) vía `<link>` en `<head>`
- Repo git **anidado** dentro del monorepo del Orquestador — no hacer commits
  automáticos aquí salvo petición explícita del usuario

## Estructura de ficheros (reestructura 2026-07-23)

```
index.html                  SOLO markup + <script src> finales. Sin JS inline.
CLAUDE.md                   Este fichero (único .md en la raíz).
css/
  tokens.css                :root — paleta "Endgame" (lila/azul + acero),
                             tipografía, espaciado, sombras. Debe cargarse
                             antes que metal-title.css y styles.css.
  metal-title.css           Efecto metálico del <h1> del hero (.metal-title).
  styles.css                Layout y componentes. Estructura interna: capa
                             base (componentes) + capa final "MULTIVERSO 2.0"
                             (skin) al fondo del fichero — al tocar la capa
                             final, ojo con pisar reglas móviles de la base
                             (ver hechos durables, bottom nav).
  background.css            Fondo animado fijo (.bg-fx), independiente del
                             resto — no se toca desde styles.css.
js/
  images-posters.js         POSTERS_LOCAL (mapa título → ruta jpg) +
                             HERO_LOCAL. Se carga PRIMERO.
  data.js                   DATA (6 fases MCU), XMEN_DATA, PRESET_VISTO.
                             Se carga SEGUNDO.
  app.js                    Toda la lógica de la app (IIFE). Se carga TERCERO.
  firebase-config.js        Plantilla de configuración del proyecto.
  firebase.js               SDK modular bajo demanda: Google Auth + Firestore.
assets/posters/*.jpg        81 pósters TMDB (w500), uno por item.
assets/fondo/*.jpg           endgame-backdrop.jpg (hero), endgame-backdrop-2 y
                             stark-tower (capas ambientales de background.css).
docs/                       CHANGELOG.md · DOCUMENTACION.md · disney-links.md
                             FIREBASE-SETUP.md (configuración y despliegue).
firebase.json               Hosting + Firestore rules/indexes para Firebase CLI.
firestore.rules             Cada usuario solo puede leer/escribir su documento.
firestore.indexes.json      Índices explícitos (actualmente vacíos).
design/                     Specs y previews de diseño (histórico, no
                             autoritativo frente al código real):
                             PLAN-REDISENO-PRO.md, DISENO-*.md,
                             preview-fondo.html (sus <link> usan ../css/).
archivo/                    Legacy sin referencias: posters.data.js,
                             plataformas.data.js. No cargar desde index.html.
```

**Orden de carga obligatorio** en `index.html`:
`js/images-posters.js` → `js/data.js` → `js/firebase-config.js` → `js/app.js`
→ `js/firebase.js` (module). Los scripts clásicos declaran
`const` en el ámbito global del script clásico; `app.js` consume
`POSTERS_LOCAL`, `HERO_LOCAL`, `DATA`, `XMEN_DATA` y `PRESET_VISTO`.

No hay `package.json`, build tool ni tests automatizados.

## Datos: `DATA` y `XMEN_DATA` (js/data.js)

Ambos son arrays de fases (`{phase, years, items:[...]}`). Cada item tiene:

| Campo | Tipo | Significado |
|-------|------|--------------|
| `t` | string | **Identidad del título.** Ver contrato intocable abajo. |
| `d` | string | Fecha/rango de estreno mostrada en la UI. |
| `type` | `"film"` \| `"serie"` \| `"especial"` | Determina tag, color y tinte de póster. |
| `m` | number | Duración total en minutos (en series: suma de todos los episodios). |
| `est` | boolean (opcional) | `true` = duración estimada, se muestra con prefijo «≈». |
| `q` | string (opcional) | Término de búsqueda alternativo para Google/YouTube si `t` no basta. |

`DATA` = 6 fases del MCU (Fase 1 a Fase 6), 62 items.
`XMEN_DATA` = 1 fase ("Películas y series", 1992–2024), 19 items.
`TRACKED_ITEMS` = concatenación de todos los items de `DATA` + `XMEN_DATA`
(81 en total) y es la fuente única del progreso global (topbar, anillo del
hero, stats, y el orden de listado en Resúmenes/Plataforma).

## Contratos intocables

Estas reglas existen porque romperlas corrompe datos de usuario ya
guardados o rompe la navegación por pestañas. Cualquier cambio futuro debe
respetarlas o migrar explícitamente los datos existentes.

1. **`localStorage` keys**: `"mcu_checklist_v3"` (progreso de visto/no
   visto) y `"mcu_ratings_v1"` (notas 0–10). No renombrar ni versionar sin
   escribir una migración explícita — de lo contrario el usuario pierde
   todo su progreso guardado.
2. **Identidad = campo `t`**: el título (`it.t`) es la clave primaria en
   `state`, `ratings`, `POSTERS_LOCAL`, `itemRefs`, `mediaRefs` y
   `titleToPhase`. No renombrar el texto de un `t` ya publicado — eso
   desconecta el progreso guardado de ese título.
3. **`TAB_IDS` debe ir siempre en el mismo orden que los botones `.tab`
   del DOM.** Actualmente: `['checklist','xmen','resumenes','plataforma']`,
   igual que `#tab-checklist`, `#tab-xmen`, `#tab-resumenes`,
   `#tab-plataforma` en el HTML. El routing por hash (`tabNameFromHash`) y
   la navegación por teclado (flechas/Home/End) dependen de este orden.
4. **`buildXmen()` debe llamarse después de `buildChecklist()`** en el
   bootstrap final de `js/app.js`. `buildChecklist()` limpia (`.clear()`)
   `itemRefs` y `phaseRefs` antes de reconstruirlos. Análogamente,
   `buildResumenes()` limpia `mediaRefs` y debe ejecutarse antes de
   `buildPlataforma()` (ambas estanterías comparten ese mapa).
5. **`.rating` necesita `position:relative`** (ancla del popover
   absolutamente posicionado) **y ni `.item` ni `.grid` deben tener
   `overflow:hidden`** — el popover de nota se renderiza fuera de los
   límites de la fila. Excepción deliberada: `.media-card` SÍ lleva
   `overflow:hidden` (recorta el zoom del póster) porque dentro de una
   tarjeta de estantería no vive ningún popover.
6. **Opción «Sin nota» primera en el DOM del listbox de nota**: los
   índices de teclado (`optionEls`) asumen clear=0, números=1..11. Su
   posición visual (al final) se cambia SOLO con CSS `order`, nunca
   reordenando el DOM.

## Rediseño 2026-07-23 (parte 3) — hechos durables

- **Resúmenes/Plataforma = estantería de pósters**: `buildMediaCard(it,kind)`
  + `buildMediaShelf(containerId,kind)` en `js/app.js` generan tarjetas
  `<a class="media-card media-card--youtube|--google">` (toda la tarjeta es
  el enlace; no hay CTA separado). Contenedores `#resumenesList` y
  `#plataformaList` llevan clase `.media-grid`. `mediaRefs` (Map título →
  [tarjetas]) permite a `updateItemUI()` togglear `.is-done` (insignia
  verde "ya vista") sin reconstruir el DOM.
- **Nota v3**: popover con cabecera `.rating__head` («Tu nota · título»,
  `aria-hidden`), escala 0–10 en fila única en escritorio y bottom sheet
  con rejilla de 4 columnas en <900px. `setActiveOption()` aplica
  `.is-fill` a las opciones numéricas hasta la activa (efecto "medidor").
  El salto vertical de teclado se calcula en el keydown según el modo:
  sheet → COLS=4, popover escritorio → COLS=1.
- **`--hero-img` debe ser URL ABSOLUTA**: una `url()` relativa dentro de
  una custom property se resuelve contra la hoja de estilos que la
  consume (`css/styles.css`), no contra el documento → `setupHeroBg()`
  usa `new URL(HERO_LOCAL, document.baseURI).href`. Si se cambia el hero,
  mantener esa conversión (bug real: el hero estuvo meses sin fotografía).
- **Hero**: velos ligeros (la foto se ve; la legibilidad la dan el
  gradiente inferior y los text-shadow) + animación `heroDrift` (16s,
  scale 1.07→1.005). Composición "texto izquierda / reparto derecha" en
  TODOS los anchos: la imagen va con zoom y ancla izquierda
  (escritorio `max(100%,240vh)` + position X=0; tablet `auto 118%`;
  móvil `auto 118%` + position X=28% para arrancar en la zona oscura de
  Thanos). El titular fuerza 2 líneas (`display:block` en
  `.metal-title/-accent`) para no invadir los rostros.
- **Bottom nav (<900px)**: la capa "MULTIVERSO 2.0" define
  `.tabs-bar{top:var(--topbar-h)}` para el sticky de escritorio; su
  bloque `@media (max-width:899px)` re-aserta `top:auto;bottom:0` — si se
  elimina esa re-aserción, la nav vuelve a quedarse pegada bajo la
  cabecera en móvil (bug corregido en esta sesión).
- **Breakpoints**: `<600px` fila `.item` compacta de 2 filas y
  `.media-grid` a 3 columnas; `<900px` bottom nav fija + sheet de nota;
  `≥900px` 2 columnas de lista, estantería `minmax(164px,1fr)`, hovers
  reales (`@media (hover:hover) and (pointer:fine)`).
- **Jerarquía de `z-index`** (sin cambios): sheet de nota abierto → 50 ·
  `.rating-scrim` → 45 · `.tabs-bar` bottom nav fija → 40 · fila con
  popover abierto → 12 · `.topbar` sticky → 11 · `.tabs-bar` sticky de
  escritorio → 9.
- **`body.sheet-open`** y **`isMobileSheet()`** (evaluado en cada
  apertura, nunca cacheado): igual que en la v2 — `closePopover()` debe
  retirar siempre clase/scrim.
- **`css/tokens.css` mantiene alias legacy** (`--surface`, `--blue`,
  `--brand-purple*`, etc.) — no eliminarlos sin migrar cada selector.
- **Filtros del checklist** (`.filterbar`: búsqueda + tipo + estado + nota):
  SOLO visuales — ocultan filas/fases con `.is-filtered-out` sin tocar
  `state`/`ratings` ni contadores. `#filterRating` permite cualquier nota,
  con nota, sin nota o umbrales 5+/7+/8+/9+. Solo aplican a las fases de
  `DATA` (X-Men sin filtros). `applyFilters()` se llama desde `refreshAllUI()`
  y `toggleItem()` para mantener coherencia; `phaseRefs` guarda ahora
  también `sec` (el nodo de la fase) para poder ocultar fases vacías.
- **Tira de tiempo** (`#timeSeen/#timeLeft/#timeFill`) y **CTA dinámico
  del hero** (`#heroCta`: Empezar/Continuar/Completado) se actualizan en
  `updateGlobalUI()`. «Continuar maratón» (`#heroContinue`,
  `setupContinue()`) salta al primer item de `TRACKED_ITEMS` sin marcar
  (pestaña correcta incluida) y le aplica `.is-flash` 2,4s.
- **Nota en las estanterías**: `buildMediaCard` pinta `.media-card__nota`
  («★ n») si hay nota, y `setRating()` llama a `syncMediaRating(t)` para
  crearla/actualizarla/retirarla en vivo vía `mediaRefs`.
- **Filtro de estado en las estanterías** (`.shelf-filter` en Resúmenes y
  Plataforma): CSS-driven — el chip fija `data-mfilter` en la
  `.media-grid` y las reglas ocultan `.media-card` según `.is-done`
  (mantenida por `updateItemUI`), así el filtro sigue correcto al marcar
  títulos sin JS adicional.
- **Salto de fases** (`#phaseJump`, `buildPhaseJump()`): chips-ancla a
  `#fase-N`; `buildPhase` asigna `sec.id=slugifyPhase(ph.phase)`. Un hash
  `#fase-N` no está en `TAB_IDS` → `tabNameFromHash()` cae a 'checklist'
  (comportamiento deseado: activa la pestaña y el navegador desplaza).
- **Fase completada + marcar todo**: `updatePhaseUI` togglea
  `.is-complete` en la sección (insignia `.phase-complete` + barra verde)
  y alterna el texto del botón `.phase-mark` («Marcar todo»/«Quitar
  todo»), que marca/desmarca la fase entera de una vez (toggle
  reversible, sin confirm). `phaseRefs` guarda `sec` y `markBtn`.
- **`.item.pop`**: micro-animación del tick — la añade SOLO `toggleItem`
  (interacción directa); ni el bootstrap ni «Marcar todo» la disparan.
- **`.to-top`** (volver arriba): fijo, z-index 39 (bajo la bottom nav 40),
  aparece con `scrollY>700`; en <900px se eleva sobre la bottom nav.
- **Sincronizar dispositivos** (botón `.sync` en la toolbar del
  checklist): exporta/importa progreso+notas sin servidor. Formato del
  código: `MCU1.` + base64 de JSON `{v:1,seen:[títulos],ratings:{}}`
  (base64 vía `unescape/encodeURIComponent` por los acentos). Importar
  SUSTITUYE el estado local (con `confirm`) y reconstruye la UI en el
  orden de contratos. Modal `.sync-modal` con scrim propio (z-index
  55/56, por encima del sheet de nota) y clase `body.modal-open` para el
  bloqueo de scroll (independiente de `body.sheet-open`). Ver
  `setupSync()` en `js/app.js`.
- **Firebase opcional**: `js/firebase.js` carga el SDK modular desde el CDN
  solo si `js/firebase-config.js` contiene la configuración real. Google
  Sign-In usa popup en escritorio y redirect en móvil. El documento
  `users/{uid}` guarda `seen`, `ratings`, perfil y `updatedAt`; las reglas en
  `firestore.rules` limitan el acceso al usuario autenticado. El modo Firebase
  requiere servir la app por HTTP/Hosting, no abrirla con `file://`. Ver
  `docs/FIREBASE-SETUP.md`.

## Notas de proceso

- Cuando se trabaje en `index.html`/`js/app.js`, usar **una sola
  sesión/agente a la vez**. Editar el mismo fichero en paralelo desde dos
  sesiones produce sobrescrituras silenciosas (ver incidencia registrada
  en `docs/DOCUMENTACION.md`, sesión 2026-07-23).
- Tras cualquier edición de `js/data.js` o `js/app.js`, verificar con
  `grep`/lectura que `DATA`, `XMEN_DATA`, `TAB_IDS` y las funciones
  `build*` siguen presentes y completas, y que `index.html` conserva el
  orden de carga de imágenes → datos → configuración → app → Firebase.
- QA visual sin navegador interactivo: Edge headless
  (`msedge --headless=new --screenshot=... file:///...`). Ojo: en Windows
  el ancho mínimo real de ventana es ~500px — para probar viewports
  móviles usar una página envoltorio con un `<iframe>` de 390px; y
  `--virtual-time-budget` ejecuta timers pero no espera imágenes lazy.
