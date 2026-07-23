# Changelog — MCU Tracker

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto no usa versionado semántico de paquete (no hay build/release
formal); las entradas se agrupan por fecha de sesión de trabajo.

## [Sin publicar]
### Pendiente
- Protocolo de exclusión mutua para ediciones concurrentes de `index.html`
- Revisar si `DISENO-SPEC.md` (paleta roja/dorada histórica) debe marcarse obsoleto
- Verificación visual en dispositivo real del layout `.item` en ≤560px
- Confirmar si `.stats` debe pasar a 1 columna en <380px (actualmente
  fija a `repeat(3,1fr)` en todos los breakpoints)
- Comprobar `scrollWidth ≤ innerWidth` a 320px en la fila compacta de
  `.item` con duración larga + nota puntuada (posible overflow horizontal)

---

## [2026-07-23] — Parte 7: Filtros de estantería, salto de fases y marcar-todo

### Añadido
- **Filtro Todos/Pendientes/Vistos en Resúmenes y Plataforma**
  (`.shelf-filter`): CSS-driven vía `data-mfilter` en la `.media-grid` +
  la clase `.is-done` que ya mantiene `updateItemUI` — se actualiza solo
  al marcar títulos.
- **Salto rápido de fases** en el checklist (`#phaseJump`): chips-ancla
  «Fase 1…6» hacia `#fase-N` (ids generados con `slugifyPhase`);
  carrusel horizontal en móvil.
- **Insignia «✓ Completada»** y barra de progreso en verde cuando una
  fase llega al 100% (`.phase.is-complete`, toggled en `updatePhaseUI`).
- **Botón «Marcar todo / Quitar todo» por fase** (`.phase-mark`): marca o
  desmarca la fase entera de una vez (toggle reversible); actualiza
  progreso, filtros y stats en el momento.
- **Micro-animación del tick** al marcar un título (`.item.pop`,
  `checkPop` con `--ease-bounce`): solo en interacción directa — ni al
  cargar ni con «Marcar todo».

---

## [2026-07-23] — Parte 6: Filtros, tiempo de maratón y mejoras de uso

### Añadido
- **Barra de filtros del checklist** (búsqueda con acentos normalizados +
  chips de tipo Película/Serie/Especial + estado Pendientes/Vistos).
  Filtro solo visual (`.is-filtered-out` en filas y fases vacías, mensaje
  de "sin resultados"); no toca `state`/`ratings` ni contadores. Se
  re-aplica al marcar títulos, importar o restablecer.
- **Tira de tiempo** bajo las stats: horas de metraje vistas vs.
  restantes con barra de progreso (suma de `m`, actualizada en
  `updateGlobalUI`).
- **Metraje total por fase** («⏱ ≈ N h») en la cabecera de cada fase.
- **Tu nota en las estanterías**: insignia «★ n» en las tarjetas de
  Resúmenes/Plataforma, sincronizada en vivo al puntuar
  (`syncMediaRating` desde `setRating`).
- **CTA del hero dinámico**: «Empezar recorrido» → «Continuar maratón» →
  «Multiverso completado» según progreso; al pulsarlo salta a la pestaña
  correcta, centra el primer título pendiente y lo destaca 2,4 s
  (`.is-flash`). Respeta `prefers-reduced-motion`.
- **Botón volver-arriba** flotante (aparece tras 700 px de scroll;
  z-index 39, elevado sobre la bottom nav en móvil).

---

## [2026-07-23] — Parte 5: Sincronizar dispositivos (exportar/importar)

### Añadido
- Botón «Sincronizar» en la toolbar del checklist (junto a «Restablecer
  progreso»; comparte estilos de píldora vía selector `.reset,.sync`).
- Modal `.sync-modal` (scrim propio, z-index 55/56, `body.modal-open`
  para bloquear scroll): «Tu código» (readonly + Copiar, con fallback a
  `execCommand` para `file://`) y «Pegar un código» + «Importar en este
  dispositivo».
- Formato del código: `MCU1.` + base64 de `{v:1,seen:[títulos],
  ratings:{}}` — base64 con `unescape/encodeURIComponent` para soportar
  acentos. Validación con mensajes claros (prefijo, código dañado).
- Importar SUSTITUYE el estado local previa confirmación, guarda en las
  keys existentes (`mcu_checklist_v3` / `mcu_ratings_v1`, sin cambios de
  contrato) y reconstruye la UI en orden: buildChecklist → buildXmen →
  buildResumenes → buildPlataforma → refreshAllUI.
- Pie actualizado: menciona «Sincronizar» para llevar el progreso a otro
  dispositivo.
- QA: ciclo completo exportar→importar verificado en headless (33 vistos
  reimportados, acentos intactos) en escritorio y móvil.

---

## [2026-07-23] — Parte 4: Hero descargado (4 bloques)

El hero pasa de 7 bloques apilados (kicker + eyebrow + titular +
subtítulo + chips + botones + badge) a 4: eyebrow único («Universo
Marvel · Orden de estreno · 2008—2026»), titular algo más contenido
(clamp 6rem máx.), subtítulo de una frase que absorbe el dato de los 81
títulos, y una sola fila de acciones con el anillo de progreso
integrado (en móvil, botones a ancho completo y anillo centrado).
`.hero-kicker` y `.hero-details` eliminados de markup y CSS; los IDs
`heroPct`/`heroCount`/`heroRingProgress` no cambian (JS intacto). El
titular ya no invade los rostros en ningún ancho (composición
texto-izquierda/reparto-derecha también en <600px, ver Parte 3).

---

## [2026-07-23] — Parte 3: Estantería de pósters, nota v3, hero Endgame y reestructura

Rediseño de las pestañas Resúmenes/Plataforma y del selector de nota,
fondo Endgame protagonista en el hero, y reestructura del proyecto en
carpetas. Contratos técnicos (KEYs de `localStorage`, identidad `t`,
`TAB_IDS`, orden `buildXmen()`/`buildChecklist()`) intactos.

### Añadido
- **Estantería de pósters** en Resúmenes y Plataforma: cada título es una
  tarjeta-póster (`.media-card`) donde toda la tarjeta es un único `<a>`
  (YouTube o Google según pestaña), con chip de acción siempre visible
  (`▶ Resumen` rojo / `🔍 Dónde verla` lila), velo con icono grande en
  hover/focus e insignia verde "ya vista" sincronizada con el checklist
  (`mediaRefs` en `updateItemUI`). Rejilla responsive: 3 columnas en
  móvil (<600px), `auto-fill minmax(150-164px)` en tablet/escritorio.
- **Nota v3**: cabecera contextual «Tu nota · [título]» dentro del
  popover/sheet; efecto "medidor" (`.is-fill`: las opciones hasta la
  señalada se encienden con gradiente lila→azul). Escritorio = escala
  0–10 en fila única; móvil = bottom sheet con rejilla de 4 columnas y
  botones ≥52px. «Sin nota» va visualmente al final (CSS `order`) pero
  sigue primera en el DOM (contrato de teclado del listbox intacto).
- `js/data.js` (DATA, XMEN_DATA, PRESET_VISTO) y `js/app.js` (toda la
  lógica): el `<script>` inline de `index.html` queda extraído; orden de
  carga obligatorio `images-posters.js → data.js → app.js`.
- Animación de entrada `heroDrift` (zoom lento 1.07→1) en el hero,
  neutralizada por `prefers-reduced-motion`.
- Carpetas `docs/` (CHANGELOG, DOCUMENTACION, disney-links) y `archivo/`
  (legacy); `design/` absorbe `DISENO-*.md` y `preview-fondo.html`
  (rutas CSS internas ajustadas a `../css/`).

### Cambiado
- Hero: velos mucho más ligeros (el backdrop de Endgame por fin se ve);
  en móvil un único gradiente vertical (imagen limpia arriba, oscurecido
  progresivo abajo, donde vive el texto).
- Textos de introducción de Resúmenes y Plataforma adaptados a la nueva
  interacción (toda la tarjeta es el enlace).

### Corregido
- **El hero salía sin fotografía**: una `url()` relativa dentro de una
  custom property (`--hero-img`) se resuelve contra la hoja que la
  consume (`css/styles.css`), no contra el documento → apuntaba a
  `css/assets/…` (inexistente). `setupHeroBg()` ahora inyecta la URL
  absoluta (`new URL(HERO_LOCAL, document.baseURI)`).
- **Bottom nav móvil pegada bajo la cabecera**: la regla tardía
  `.tabs-bar{top:var(--topbar-h)}` de la capa "Multiverso 2.0" pisaba el
  `top:auto` del bloque móvil; re-asertado `top:auto;bottom:0` en el
  `@media (max-width:899px)` de esa capa.
- «Sin nota» seleccionada ya no hereda el gradiente CTA de los números
  (tinte suave propio, override tras la regla `aria-selected`).

### Eliminado
- `.action-row`, `.action-grid` y `.cta` (filas con CTA de Resúmenes/
  Plataforma), sustituidos por `.media-grid`/`.media-card`.
- `posters.data.js` y `plataformas.data.js` de la raíz → `archivo/`
  (legacy sin referencias desde `index.html`).

---

## [2026-07-23] — Parte 2: Rediseño integral "Multiverso"
Rediseño visual y de layout completo ejecutado en 8 fases según
`design/PLAN-REDISENO-PRO.md` (brief de decisiones). Commit `9f3e507`.
Contratos técnicos (KEYs de `localStorage`, identidad `t`, `TAB_IDS`,
orden `buildXmen()`/`buildChecklist()`) intactos.

### Añadido
- `design/PLAN-REDISENO-PRO.md`: plan de decisiones del rediseño (paleta,
  tipografía, fondo, layout escritorio/móvil, componente a componente,
  fases, riesgos y criterios de aceptación)
- Fondo ambiental `.bg-fx` de 2 capas: `.bg-fx__glows` (radial-gradients
  fijos) + `.bg-fx__grain` (SVG `feTurbulence` estático), sustituyendo el
  collage fotográfico de 7 capas anterior
- Escala tipográfica fluida con `clamp()` (`--fs-hero/h2/title/body/meta/
  label/stat/micro`) y `tabular-nums` en toda cifra (stats, %, duraciones,
  años) en `css/tokens.css`/`css/styles.css`
- Layout de 2 columnas en escritorio (`≥900px`): `.grid`/`.action-grid` a
  `grid-template-columns:repeat(auto-fill,minmax(440px,1fr))`, container
  1200px, hero panorámico, hovers reales bajo `@media (hover:hover) and
  (pointer:fine)`
- Bottom navigation fija en móvil (`<900px`, mismos 4 botones `.tab`),
  con iconos SVG + etiqueta corta, indicador de destino activo,
  `env(safe-area-inset-bottom)` y `body{padding-bottom:...}` para no
  tapar el último ítem
- Fila `.item` compacta de 2 filas en móvil (`<600px`) vía
  `grid-template-areas`, sin cambiar clases del HTML
- Nota 0–10 como **bottom sheet** en móvil (`.rating__popover--sheet`,
  `body.sheet-open`, `.rating-scrim`): scrim, foco atrapado, cierre por
  Escape, `overscroll-behavior:contain`; `isMobileSheet()` se evalúa en
  cada apertura del popover
- `<link rel="preload" as="image" ... fetchpriority="high">` del hero
  (LCP), `img.decoding='async'` en pósteres, `@media
  (prefers-reduced-motion:reduce)`, `@media (forced-colors:active)`
- Meta SEO/redes reales: `<title>`/`<meta description>`, Open Graph
  (`og:type/title/description/image/locale`), Twitter Card
  (`summary_large_image`), `<meta name="theme-color">`

### Modificado
- Paleta recolorida a la dirección "Multiverso" en `css/tokens.css`:
  `--bg #0b0b14`, `--surface-1/2/3` escalonadas, `--border`/
  `--border-hover` con alpha, `--accent #a78bfa` / `--accent-fill
  #8b5cf6` / `--accent-2 #60a5fa`, `--especial #e0a94f`,
  `--container-max` 900px → 1200px; alias legacy conservados
  (`--surface`, `--blue`, `--brand-purple*`, `--brand-blue*`,
  `--glow-purple/blue`, `--fs-eyebrow/small/xs`) para no dejar
  selectores sin resolver durante la migración por fases
- `<link>` de Google Fonts reducido de 8 a **5 pesos** (`Anton` +
  `Oswald:500;600` + `Inter:400;500;600`); Oswald reservado a h2 de fase
  y cifras de stats, Inter 600 en tabs/labels/marca/títulos de fila
- `css/background.css`: 364 líneas del collage de 7 capas sustituidas por
  la versión ambiental de 2 capas (~60 líneas netas)
- `css/metal-title.css`: halos `text-shadow` recoloreados a los nuevos
  acentos
- Popover de nota en escritorio restyleado a `--surface-3` + borde
  `--steel-2`; el mecanismo de reposición up/down se mantiene idéntico

### Corregido (QA de cierre, Fase 7)
- Colores heredados de la paleta antigua en el favicon y en el emblema
  SVG de la marca (`.brand-mark`), desalineados de los tokens nuevos:
  recoloreados a `#8b5cf6`/`#60a5fa` (`--accent-fill`/`--accent-2`)
- Área táctil de controles pequeños en móvil verificada/reforzada a
  ≥44×44px (`.rating__trigger::after{inset:-12px}`, grid de 6 columnas
  del bottom sheet con `minmax(44px,1fr)`)
- `z-index` del popover de nota (`.item:has(.rating__popover:not(
  [hidden]))`) insuficiente frente al topbar sticky y la tabs-bar sticky
  de escritorio: subido de `5` a `12` (por encima de topbar `11` y
  tabs-bar `9`)
- Enlaces `window.open(url,'_blank')` sin `rel="noopener"` en los 3
  puntos donde se abren (CTA YouTube, CTA Google, fila clicable de
  Plataforma): añadido

### Pendiente de validar (no cerrado en esta sesión)
- `.stats` a 1 columna en <380px (actualmente fija a `repeat(3,1fr)` en
  todos los breakpoints móviles)
- Posible overflow horizontal de la fila compacta de `.item` a 320px con
  duración larga + nota puntuada (falta medición `scrollWidth ≤
  innerWidth` instrumentada)

---

## [2026-07-23]
### Añadido
- Campo `m` (duración total en minutos; en series, suma de todos los
  episodios) y `est:true` (duración estimada) en los 81 items de `DATA` y
  `XMEN_DATA`, en `index.html`
- Helpers `durationLabel()` y `buildDurationEl()`, y chip `.duration` (con
  icono de reloj) en cada fila del checklist, entre el título y el tag de
  tipo
- Nota aclaratoria sobre duraciones en el `<footer>`
- Pestaña **"Checklist X-Men"** (`#tab-xmen` / `#panel-xmen`) con
  `XMEN_DATA`: 19 títulos de la saga Fox en orden de estreno 1992–2024
  (13 películas + 6 series)
- 19 pósters de la saga X-Men descargados de TMDB (w500) en
  `assets/posters/` y mapeados en `POSTERS_LOCAL` (`js/images-posters.js`)
- `TRACKED_ITEMS` (concatenación de `DATA` + `XMEN_DATA`) como fuente única
  del progreso global (topbar, anillo del hero, stats): total de títulos
  62 → 81
- Separadores `.list-divider` ("Universo Marvel" / "Saga X-Men") en las
  pestañas Resúmenes y Plataforma, en el punto donde empieza la saga X-Men
- `CLAUDE.md`, `DOCUMENTACION.md` y este `CHANGELOG.md` (documentación del
  proyecto, antes inexistente)

### Modificado
- Pestañas renombradas a **"Checklist Marvel"** y **"Checklist X-Men"**, y
  reordenadas para quedar contiguas (orden del DOM y de `TAB_IDS`:
  `checklist, xmen, resumenes, plataforma`)
- Pestañas **Resúmenes** y **Plataforma**: ahora iteran `TRACKED_ITEMS`
  (MCU + X-Men) en vez de solo `DATA`
- `.item` (`css/styles.css`): de fila flex a **grid con
  `grid-template-areas`**; en `@media (max-width:560px)` pasa a 2 filas
  (póster+texto arriba, duración·tag·nota debajo) para descongestionar
  el móvil
- Ritmo vertical: gap de `.grid` 9px → 12px; margen superior de `.phase`
  36px → 48px
- `.duration` rediseñado como texto `muted` plano; la nota (`.rating`)
  queda como único acento de color del clúster derecho de cada fila
- Jerarquía visual título/fecha reforzada en `.item` y `.action-row`
- `.action-row` unificado visualmente con `.item` (mismos radios, hover y
  borde izquierdo de color por tipo)
- `.list-divider` estilizado: tipografía Oswald en mayúsculas + regla
  horizontal
- Tabs: más padding y subrayado activo de 2px
- `footer`: interlineado aumentado para mejorar legibilidad de la nota de
  duraciones

### Corregido
- Typo `wherToWatchUrl` → `whereToWatchUrl` (función y todas sus
  referencias) en el `<script>` inline de `index.html`

### Eliminado
- Array obsoleto `ALL_ITEMS` en `index.html` (sustituido por
  `TRACKED_ITEMS`)
- `.hint` deja de ser una "píldora" de cristal (fondo/borde eliminados;
  pasa a texto plano)

### Incidencias
- Dos sesiones de Claude editaron `index.html` en paralelo, produciendo
  sobrescrituras que descartaron temporalmente la feature de duraciones y
  la pestaña X-Men; ambas se restauraron. Ver detalle y recomendación en
  `DOCUMENTACION.md` (sesión 2026-07-23) y en `CLAUDE.md` § Notas de
  proceso.
