# 📄 Documentación Técnica — MCU Tracker

---

## Sesión: 2026-07-23 (tarde) — Rediseño integral "Multiverso" (8 fases)

### 🎯 Objetivo
Ejecutar el rediseño visual y de layout completo del tracker acordado en
`design/PLAN-REDISENO-PRO.md` (brief cerrado de decisiones, no
implementa nada por sí mismo): refinar la paleta a la dirección
"Multiverso", sustituir el fondo collage por un fondo ambiental de 2
capas, reordenar la jerarquía tipográfica, aprovechar el escritorio con
2 columnas, rediseñar el móvil con bottom navigation y convertir la nota
0–10 en bottom sheet en móvil — todo ello **sin romper los contratos
técnicos** (`localStorage` `mcu_checklist_v3`/`mcu_ratings_v1`, identidad
`t`, orden de `TAB_IDS`, `buildXmen()` tras `buildChecklist()`, `.rating`
sin `overflow:hidden` en `.item`/`.grid`). Commit resultante: `9f3e507`
("feat: rediseño integral profesional 'Multiverso' (plan en 8 fases)").

### 👥 Agentes involucrados
- `diseno-agent` + `frontend-vanilla-agent` — Fase 0 (tokens)
- `frontend-vanilla-agent` — Fases 1 a 5 (fondo, tipografía, escritorio,
  móvil + bottom nav, bottom sheet de nota)
- `rendimiento-agent` + `errores-agent` — Fase 6 (a11y + rendimiento)
- `seo-agent`, `errores-agent`, `documentacion-agent` — Fase 7 (SEO, QA,
  documentación — esta entrada)

### 📁 Archivos modificados (ámbito del rediseño)
| Archivo | Líneas cambiadas (commit `9f3e507`) |
|---------|--------------------------------------|
| `css/tokens.css` | +205 / reescritas (paleta, tipografía, alias legacy) |
| `css/styles.css` | +515 / reescritas (fondo consumido, tipografía, layout escritorio/móvil, bottom sheet, a11y) |
| `css/background.css` | 364 líneas → sustituidas por versión de 2 capas (glows + grain) |
| `css/metal-title.css` | 6 líneas — halos `text-shadow` recoloreados a los nuevos acentos |
| `index.html` | +130 — `.bg-fx` de 2 capas, `<link>` de fuentes (5 pesos), iconos SVG en `.tab`, rama móvil de `openPopover`/`closePopover` (bottom sheet), meta SEO/OG/Twitter, favicon |
| `design/PLAN-REDISENO-PRO.md` | Nuevo (250 líneas) — brief de decisiones de todo el rediseño (referencia, no autoritativo frente al código) |

No se ha tocado `js/images-posters.js` ni el esquema de datos
(`DATA`/`XMEN_DATA`/`TRACKED_ITEMS`): el rediseño es 100% visual/layout.

### 📊 Tabla Fase → Agente → Cambios

| Fase | Agente | Fichero(s) | Cambios concretos |
|---|---|---|---|
| **F0 · Tokens** | `diseno-agent` + `frontend-vanilla-agent` | `css/tokens.css` | Paleta "Multiverso": `--bg #0b0b14`, `--surface-1/2/3` escalonadas, `--border`/`--border-hover` con alpha (`rgb(165 165 220 / .12 / .22)`), `--accent #a78bfa` (violet-400), `--accent-fill #8b5cf6`, `--accent-2 #60a5fa` (blue-400), `--especial #e0a94f` (ámbar, no amarillo), `--container-max` 900→1200px. **Alias legacy conservados** (`--surface`, `--blue`, `--blue-hover`, `--brand-purple*`, `--brand-blue*`, `--glow-purple/blue`, `--fs-eyebrow/small/xs`) para que ningún selector de fases posteriores quede sin resolver mientras se migran uno a uno. |
| **F1 · Fondo** | `frontend-vanilla-agent` | `css/background.css`, `index.html` | `.bg-fx` pasa de 7 capas (backdrop+skyline+rayo+logo+viñetas) a **2**: `.bg-fx__glows` (2 radial-gradient fijos, sin animación) + `.bg-fx__grain` (SVG `feTurbulence` estático, `mix-blend-mode:overlay`, opacity .05). Scrim multicapa en `.hero-cinematic__media`. `assets/fondo/*` deja de usarse; `assets/hero-vengadores.jpg` (HERO_LOCAL) se mantiene solo en el hero. `background.css` pasa de 364 a ~60 líneas netas. |
| **F2 · Tipografía** | `frontend-vanilla-agent` | `index.html` (`<link>`), `css/tokens.css`, `css/styles.css`, `css/metal-title.css` | `<link>` de Google Fonts reducido a 5 pesos (`Anton` + `Oswald:500;600` + `Inter:400;500;600`). Escala fluida con `clamp()`: `--fs-hero/h2/title/body/meta/label/stat/micro`. Roles: Oswald 600 solo en h2 de fase y cifras de stats; Inter 600 en tabs/labels/marca/títulos de fila. `font-variant-numeric:tabular-nums` en toda cifra (stats, %, duraciones, años). |
| **F3 · Escritorio (≥900px)** | `frontend-vanilla-agent` | `css/styles.css` | `@media (min-width:900px)`: `.grid`/`.action-grid` a `grid-template-columns:repeat(auto-fill,minmax(440px,1fr))` (2 columnas), hero panorámico `min-height:clamp(460px,62vh,660px)`, stats `repeat(3,1fr)`. Hovers reales agrupados bajo `@media (hover:hover) and (pointer:fine)` (`.item:hover`, `.action-row:hover`, póster `scale(1.04)`, `.stat:hover`, etc.). |
| **F4 · Móvil + bottom nav** | `frontend-vanilla-agent` | `css/styles.css`, `index.html` | `<900px`: `.tabs-bar` (mismos 4 botones `.tab`, mismos `id`/`data-tab`/`aria-*`) pasa de pestañas superiores a **bottom navigation fija** (`position:fixed;bottom:0;z-index:40`, `--bottom-nav-h:56px + env(safe-area-inset-bottom)`), icono SVG + `.tab__label--short` visible / `.tab__label--full` oculta. `body{padding-bottom:calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+12px)}`. `<600px`: fila `.item` compacta en 2 filas vía `grid-template-areas` (póster+título arriba, duración·tag·nota debajo), `--poster-w:48px`, `title` con `-webkit-line-clamp:2`, `.date` con ellipsis. Área táctil del disparador de nota ampliada a ≥44px con `.rating__trigger::after{inset:-12px}` sin tocar el tamaño visual. |
| **F5 · Nota como bottom sheet (móvil)** | `frontend-vanilla-agent` | `index.html` (`<script>` de rating), `css/styles.css` | Única fase que toca JS. `isMobileSheet()` (`window.matchMedia('(max-width:899px)').matches`) se evalúa **en cada apertura** del popover (no cachea el resultado), así el sheet/popover no queda "congelado" si el viewport cruza el breakpoint. En móvil, `openPopover` añade `.rating__popover--sheet` + `body.sheet-open` + un `<div class="rating-scrim">` reutilizado; cierre por scrim/Escape con foco atrapado; `overscroll-behavior:contain`. En escritorio el popover anclado queda exactamente igual (reposición up/down intacta). `setRating`/`commitOption`/`currentValue`/KEY `mcu_ratings_v1` sin cambios. |
| **F6 · A11y + rendimiento** | `rendimiento-agent` + `errores-agent` | `index.html`, `css/*` | `<link rel="preload" as="image" href="assets/hero-vengadores.jpg" fetchpriority="high">` (LCP del hero); `img.decoding='async'` en pósteres; contraste AA corregido en textos pequeños (`.date`/`.duration` en móvil pasan a `--text-2`, no `--muted`, porque `--muted` solo cumple AA en ≥13px); `:focus-visible` global recoloreado a `--accent-2`; `@media (prefers-reduced-motion:reduce)` (transiciones/animaciones a `.001ms`, `scroll-behavior:auto`); `@media (forced-colors:active)` (`border-color:ButtonBorder` en `.item`/`.tab`/`.rating__trigger`, que de otro modo perderían el borde visible en alto contraste de Windows). |
| **F7 · SEO + QA + docs** | `seo-agent`, `errores-agent`, `documentacion-agent` | `index.html`, — | `<title>`/`<meta description>` reales, Open Graph (`og:type/title/description/image/locale`) + Twitter Card (`summary_large_image`), `<meta name="theme-color" content="#0b0b14">`. QA final del checklist de aceptación del plan (§9/§11) — ver bugs corregidos y pendientes más abajo. Esta entrada de `DOCUMENTACION.md` + actualización de `CLAUDE.md`/`CHANGELOG.md`/`ESTADO.md`. |

### 🐛 Bugs corregidos en QA (Fase 7)
| # | Bug | Fichero | Corrección |
|---|-----|---------|------------|
| 1 | Favicon y emblema de marca (`.brand-mark`) con colores heredados de la paleta antigua, desalineados de los nuevos tokens | `index.html` (favicon `data:image/svg+xml`, `<svg>` de `.brand-mark` con `linearGradient#brandEmblemGrad`) | Recoloreados a los valores canónicos actuales `#8b5cf6` (`--accent-fill`) → `#60a5fa` (`--accent-2`), coherentes con `--brand-gradient` |
| 2 | Falta de verificación explícita de áreas táctiles ≥44px en controles pequeños de móvil (disparador de nota, opciones del bottom sheet) | `css/styles.css` | Verificado y reforzado: `.rating__trigger::after{inset:-12px}` (amplía el área sin tocar el tamaño visual), `.rating__popover--sheet .rating__grid{grid-template-columns:repeat(6,minmax(44px,1fr))}`, `.rating__option{min-height:44px}` en el sheet |
| 3 | El popover de nota (`z-index:30` interno) quedaba oculto bajo el topbar sticky (`z-index:11`) y la tabs-bar sticky de escritorio (`z-index:9`) al abrirse hacia arriba (`.rating__popover--up`) cerca de la parte superior del viewport | `css/styles.css` | `.item:has(.rating__popover:not([hidden]))` sube de `z-index:5` a **`z-index:12`**, por encima del topbar (11) y la tabs-bar (9) |
| 4 | Enlaces abiertos con `window.open(url,'_blank')` sin `noopener`, riesgo de *reverse tabnabbing* | `index.html` (CTA YouTube, CTA Google/"¿Dónde verla?", fila clicable de Plataforma) | `rel="noopener"` añadido a los 3 puntos donde se invoca `window.open(...,'_blank',...)` |

### ⏭️ Pendiente de validar en navegador real (no cerrado en esta sesión)
| # | Punto a validar | Detalle |
|---|---|---|
| 1 | **Stats a 1 columna en <380px** | `.stats` usa `grid-template-columns:repeat(3,1fr)` de forma fija en todos los breakpoints (incluido `@media (max-width:599px)`, que solo ajusta `gap`/padding/tamaños de fuente, no el número de columnas). El plan (§6) contemplaba "stats apiladas en 1 columna (o 3 compactas si caben ≥380px)"; falta confirmar en dispositivo real si 3 columnas a 320-379px quedan demasiado apretadas o si el ajuste de tamaños ya implementado es suficiente. |
| 2 | **Posible overflow horizontal de la fila compacta a 320px con duración larga + nota** | La fila compacta (`@media max-width:599px`) reparte fila 2 en `grid-template-areas:"poster duration tag rating ."` con `.duration`/`.tag`/`.rating__trigger` en línea; con una duración larga (p. ej. "≈ 2 h 45 min") y una nota ya puntuada (valor + estrella + chevron) simultáneamente, cabe la posibilidad de que el conjunto no quepa en 320px de ancho real y provoque scroll horizontal. Falta medición `scrollWidth ≤ innerWidth` en un dispositivo/emulador a 320px con datos reales (criterio de aceptación §9 punto 4 del plan, no verificado aún de forma instrumentada). |

### 📚 GitHub ref
No se ha consultado ningún repositorio externo en esta sesión de
documentación; el propio `design/PLAN-REDISENO-PRO.md` es la fuente de
verdad de las decisiones (§2 paleta, §3 tipografía, §4 fondo, §5-6
layout, §7 componente a componente, §9 a11y/perf, §10 fases, §11
riesgos/criterios).

---

## Sesión: 2026-07-23 — Duraciones totales, pestaña X-Men y revisión integral

### 🎯 Objetivo
Ampliar el tracker de visionado del MCU con (A) la duración total de cada
título y (B) una pestaña dedicada a la saga X-Men de Fox que sume al
progreso global, y (C) revisar de forma integral la integración de ambas
features en el HTML y el CSS tras detectarse sobrescrituras por edición
paralela.

### 👥 Agentes involucrados
- `frontend-vanilla-agent` — Bloques A y B (datos, helpers, markup del
  checklist y de la pestaña X-Men) y Fase 1 de la revisión (`index.html`)
- `diseno-agent` — Fase 2 de la revisión: layout y estilos de `.item` en
  grid, jerarquía visual del clúster duración·tag·nota (`css/styles.css`)

---

## BLOQUE A — Duraciones totales (feature)

### 📁 Archivos modificados
| Archivo | Cambios |
|---------|---------|
| `index.html` | Campo `m` (minutos totales) y `est:true` (estimada) añadidos a los 81 items de `DATA` y `XMEN_DATA`; helpers `durationLabel()` / `buildDurationEl()`; chip `.duration` insertado en `buildItemRow()` entre el título y el tag; nota aclaratoria añadida al `<footer>` |
| `css/styles.css` | Regla `.duration` (texto plano `muted`, icono reloj, `opacity:.55` cuando `.item.done`) |

### Detalle de implementación

En series, `m` es la **suma de todos los episodios** (p. ej. `WandaVision`
→ `m:360`; `X-Men: La Serie Animada` → `m:1670`). El flag `est:true` marca
títulos sin metraje oficial confirmado (todos los estrenos 2026 en
adelante: `Wonder Man`, `Daredevil: Born Again` T2, `Spider-Man: Brand New
Day`, `VisionQuest`, `Vengadores: Doomsday`).

```javascript
// index.html — helpers de duración
function durationLabel(it){
  if(!it.m) return '';
  const h=Math.floor(it.m/60), min=it.m%60;
  const txt = h===0 ? min+' min' : (min===0 ? h+' h' : h+' h '+min+' min');
  return (it.est?'≈ ':'')+txt;
}
function buildDurationEl(it){
  const dur=durationLabel(it);
  if(!dur) return null;
  const el=document.createElement('span');
  el.className='duration';
  el.title='Duración total'+(it.est?' (estimada)':'');
  el.innerHTML=CLOCK;
  el.appendChild(document.createTextNode(dur));
  return el;
}
```

El chip se inserta en `buildItemRow()` justo entre `meta` (título+fecha) y
`tag`:

```javascript
row.append(poster,meta);
const durEl=buildDurationEl(it);
if(durEl) row.append(durEl);
row.append(tag,buildRatingControl(it));
```

Nota añadida al footer (`index.html` línea 157):
> «Duraciones totales aproximadas (en series, suma de todos los
> episodios); «≈» indica una estimación para títulos sin metraje
> confirmado.»

### 🗃️ Datos — Cambios
Sin base de datos (localStorage puro). Cambio de esquema en los objetos
literales `DATA`/`XMEN_DATA` del script inline: los 81 items ganan `m`
(y 5 de ellos, `est:true`). No requiere migración de `localStorage`
porque `m`/`est` no se persisten — son metadatos estáticos del catálogo,
no estado del usuario.

---

## BLOQUE B — Pestaña X-Men (feature)

### 📁 Archivos creados
| Archivo | Descripción |
|---------|-------------|
| `assets/posters/x-men-*.jpg` (19 ficheros) | Pósters de la saga X-Men descargados de TMDB (w500) |

### ✏️ Archivos modificados
| Archivo | Cambios |
|---------|---------|
| `index.html` | `XMEN_DATA` (19 títulos, 13 películas + 6 series, orden de estreno 1992–2024); `TRACKED_ITEMS` = `DATA`+`XMEN_DATA` como fuente única del progreso global; botón/panel de pestaña `#tab-xmen`/`#panel-xmen`; `buildXmen()` reutilizando `buildPhase()`/`buildItemRow()` |
| `js/images-posters.js` | 19 entradas nuevas en `POSTERS_LOCAL` bajo el comentario `// Saga X-Men (pestaña "X-Men")` |
| `css/styles.css` | `#panel-xmen .panel-intro h2{ border-bottom:2px solid var(--especial); }` |

### Detalle: `XMEN_DATA`

```javascript
const XMEN_DATA=[
 {phase:"Películas y series",years:"1992 – 2024",items:[
  {t:"X-Men: La Serie Animada",d:"1992 – 1997",type:"serie",q:"X-Men serie animada 1992",m:1670},
  {t:"X-Men",d:"Agosto 2000",type:"film",q:"X-Men 2000 pelicula",m:104},
  // ... 17 items más, hasta:
  {t:"X-Men '97",d:"Marzo 2024",type:"serie",q:"X-Men 97 serie Disney+",m:290},
 ]},
];
```

El progreso global ahora suma `DATA` (62 items) + `XMEN_DATA` (19 items) =
**81 items** (antes 62), vía:

```javascript
const ALL_PHASES = DATA.concat(XMEN_DATA);
const TRACKED_ITEMS = ALL_PHASES.reduce((acc,ph)=>acc.concat(ph.items),[]);
```

`buildXmen()` reutiliza `buildPhase()` y por tanto `buildItemRow()` — misma
fila con tick, póster, duración, tag y control de nota que en el checklist
MCU:

```javascript
function buildXmen(){
  const cont=document.getElementById('xmenList');
  cont.innerHTML='';
  XMEN_DATA.forEach(ph=>cont.appendChild(buildPhase(ph)));
}
```

### 🗃️ Datos — Cambios
81 pósters (62 MCU + 19 X-Men) verificados en disco en
`assets/posters/*.jpg`; todos mapeados por título exacto en
`js/images-posters.js` → `POSTERS_LOCAL`.

---

## BLOQUE C — Revisión integral (plan del orquestador, 2 fases)

### Fase 1 — `frontend-vanilla-agent` (`index.html`)
- Pestañas renombradas: **"Checklist Marvel"** y **"Checklist X-Men"**,
  colocadas de forma contigua tanto en el DOM (orden de botones `.tab` y
  paneles `.tab-panel`) como en `TAB_IDS`:
  `['checklist','xmen','resumenes','plataforma']`.
- Paneles reordenados para que `#panel-xmen` siga inmediatamente a
  `#panel-checklist`.
- **Resúmenes** y **Plataforma** dejan de listar solo `DATA`: ahora iteran
  `TRACKED_ITEMS` completo (MCU primero, X-Men al final), insertando un
  separador `.list-divider` («Universo Marvel» / «Saga X-Men») en el punto
  de transición:

  ```javascript
  function buildResumenes(){
    const cont=document.getElementById('resumenesList');
    cont.innerHTML='';
    const firstXmenTitle=XMEN_DATA[0].items[0].t;
    TRACKED_ITEMS.forEach((it,idx)=>{
      if(idx===0){ /* ...append divider "Universo Marvel"... */ }
      if(it.t===firstXmenTitle){ /* ...append divider "Saga X-Men"... */ }
      cont.appendChild(buildActionRow(it));
    });
  }
  ```
  (Mismo patrón en `buildPlataforma()`.)
- Limpieza de JS: eliminado el array obsoleto `ALL_ITEMS` (sustituido por
  `TRACKED_ITEMS`); `wherToWatchUrl` renombrada a `whereToWatchUrl` (typo
  corregido, y actualizadas todas sus referencias); comentario obsoleto de
  cabecera compactado.

### Fase 2 — `diseno-agent` (`css/styles.css`)
- `.item` pasa de fila flex a **grid con `grid-template-areas`**
  (`"poster meta duration tag rating"` en escritorio). En `@media
  (max-width:560px)` se reorganiza a 2 filas —
  `"poster meta meta meta meta"` / `"poster duration tag rating ."` —
  descongestionando el móvil (póster+texto arriba, duración·tag·nota
  debajo, sin tocar ninguna clase del HTML):

  ```css
  .item{
    display:grid;
    grid-template-columns:var(--poster-w) 1fr auto auto auto;
    grid-template-areas:"poster meta duration tag rating";
    ...
  }
  @media (max-width:560px){
    .item{
      grid-template-columns:var(--poster-w) auto auto auto 1fr;
      grid-template-areas:
        "poster meta     meta  meta   meta"
        "poster duration tag   rating .";
      row-gap:8px; column-gap:10px;
    }
  }
  ```
- Ritmo vertical ajustado: gap de `.grid` 9→12px, margen superior de
  `.phase` 36→48px.
- `.duration` rediseñado como **texto muted plano** (ya no compite
  visualmente); la nota (`.rating`) queda como único acento de color del
  clúster derecho.
- Jerarquía título/fecha reforzada (`.title` en negrita, `.date` en
  `--muted`).
- `.hint` deja de ser una "píldora" de cristal — pasa a texto plano
  centrado, sin fondo ni borde (`background:none;border:none;`).
- `.action-row` unificado visualmente con `.item` (mismos radios, mismo
  hover con `translateY(-1px)` + `box-shadow`, mismo borde izquierdo de
  color por tipo).
- `.list-divider` con tipografía Oswald uppercase + regla horizontal
  (`::after{ flex:1 1 auto; height:1px; background:var(--border); }`).
- Tabs con más padding (`14px 22px`) y subrayado activo de 2px
  (`.tab.active::after`).
- `footer` con mejor interlineado (`line-height:1.75`) para la nota de
  duraciones añadida en el Bloque A.
- **Paleta y tipografías intactas**: `css/tokens.css` sin cambios en esta
  fase.

---

## 🐛 Incidencia — Edición paralela de `index.html`

**Qué pasó**: durante la jornada del 2026-07-23, dos sesiones de Claude
distintas editaron `index.html` en paralelo (sin coordinación entre
ellas). Una sesión sobrescribió a la otra, perdiendo temporalmente tanto
la feature de duraciones (Bloque A) como la pestaña X-Men (Bloque B), que
tuvieron que restaurarse.

**Causa raíz**: no hay bloqueo de fichero ni coordinación entre sesiones
de agente que editan el mismo `index.html` de forma concurrente; la
última sesión en guardar gana y descarta los cambios de la otra.

**Solución aplicada**: se restauraron manualmente ambas features
(duraciones + pestaña X-Men) en `index.html`.

**Recomendación** (ver también `CLAUDE.md` § Notas de proceso):
1. Una sola sesión/agente trabajando sobre `index.html` a la vez.
2. Tras cada edición, verificar con `grep`/lectura completa que las
   piezas clave (`DATA`, `XMEN_DATA`, `TAB_IDS`, funciones `build*`)
   siguen presentes antes de cerrar la tarea.

---

## ✅ Verificaciones realizadas (estado al cierre de la sesión)

| Verificación | Resultado |
|---|---|
| `node --check` del `<script>` inline extraído de `index.html` | OK — sin errores de sintaxis |
| Llaves `{`/`}` de `css/styles.css` | Balanceadas — 192 aperturas / 192 cierres |
| Pósters de los 81 items mapeados en `POSTERS_LOCAL` | Los 81 ficheros existen en `assets/posters/` |
| Orden de pestañas en el DOM (`.tab`) vs. `TAB_IDS` | Coinciden: `checklist, xmen, resumenes, plataforma` |

---

## 📚 Referencias de diseño internas
- `design/DISENO-SISTEMA-ENDGAME.md` — paleta "Endgame" (lila/azul/acero) y
  tabla de migración de tokens (base de `css/tokens.css`)
- `design/DISENO-RATING-V2.md` — patrón ARIA "Collapsible Dropdown
  Listbox" del control de nota 0–10 (`.rating`)

## ⏭️ Próxima sesión — Pendiente
- [ ] Definir protocolo de exclusión mutua (o al menos un checklist de
      verificación post-edición) para evitar nuevas sobrescrituras de
      `index.html` en trabajos paralelos.
- [ ] Revisar si `DISENO-SPEC.md` (paleta "Marvel clásica" roja/dorada,
      histórica) debe marcarse como obsoleto ahora que `tokens.css` usa
      la paleta "Endgame".
- [ ] Confirmar visualmente en dispositivo real el layout de `.item` en
      ≤560px (Bloque C, Fase 2) tras el cambio a grid de 2 filas.

---
*Documentado por: documentacion-agent · 2026-07-23*

---

# Sesión 2026-07-23 (parte 3) — Estantería, nota v3, hero Endgame y reestructura

## 🎯 Objetivo (petición del usuario)
Rediseñar las pestañas **Resúmenes** y **Plataforma**, rediseñar **la forma
de dar nota**, poner **el fondo de Endgame en el comienzo** (hero), que todo
funcione **perfecto en móvil**, y **reestructurar el proyecto** para que la
mayoría de ficheros esté en carpetas.

## 📁 Reestructura (git mv, sin commit)
- `docs/` ← CHANGELOG.md, DOCUMENTACION.md, disney-links.md
- `design/` ← DISENO-FONDO-MARCA.md, DISENO-SPEC.md, DISENO-UI-RATING.md,
  preview-fondo.html (sus `<link>` pasan a `../css/`)
- `archivo/` ← posters.data.js, plataformas.data.js (legacy, sin referencias)
- Raíz: solo `index.html` + `CLAUDE.md`
- **Extracción del JS inline**: `index.html` queda solo con markup;
  nuevos `js/data.js` (DATA/XMEN_DATA/PRESET_VISTO, copiados literalmente,
  ningún `t` tocado) y `js/app.js` (lógica IIFE). Orden de carga:
  `images-posters.js → data.js → app.js`.

## 🎨 Rediseños aplicados
1. **Resúmenes/Plataforma → estantería de pósters** (`.media-grid` /
   `.media-card`): tarjeta-póster donde todo el `<a>` es el enlace; chip de
   acción siempre visible (▶ Resumen rojo YouTube / 🔍 Dónde verla lila),
   velo con icono grande en hover/focus, insignia verde de "ya vista"
   sincronizada vía `mediaRefs` en `updateItemUI()`. 3 columnas en <600px,
   `auto-fill` 150–164px en adelante. Se eliminaron `.action-row`,
   `.action-grid` y `.cta`.
2. **Nota v3**: cabecera «Tu nota · título» en popover y sheet; efecto
   "medidor" `.is-fill` (relleno lila→azul hasta la opción señalada);
   escritorio = fila única 0–10 (30×32px), móvil = sheet de 4 columnas con
   botones ≥52px; «Sin nota» visualmente al final vía CSS `order` (sigue
   primera en el DOM: índices de teclado intactos); COLS de teclado
   dinámico (sheet 4 / escritorio 1).
3. **Hero Endgame**: velos rebajados (90deg .86→.05 y 0deg .6→0 en
   escritorio; un solo gradiente vertical en ≤599px) + `heroDrift`
   (scale 1.07→1.005, 16s, anulada por `prefers-reduced-motion`).

## 🐛 Bugs reales encontrados y corregidos
| Bug | Causa raíz | Fix |
|---|---|---|
| El hero nunca mostraba la fotografía (también en producción previa) | `url()` relativa dentro de la custom property `--hero-img` se resuelve contra la hoja consumidora (`css/styles.css`) → `css/assets/…` inexistente; al estar la variable definida, el fallback de `var()` no aplicaba | `setupHeroBg()` inyecta URL absoluta: `new URL(HERO_LOCAL, document.baseURI).href` |
| Bottom nav móvil pegada bajo la cabecera | Regla tardía `.tabs-bar{top:var(--topbar-h)}` (capa MULTIVERSO, sin media query) pisaba `top:auto` del bloque `<900px`; con `height` definida, `bottom:0` se ignora | Re-aserción `top:auto;bottom:0` dentro del `@media (max-width:899px)` de la capa final |
| «Sin nota» seleccionada con gradiente CTA | `.rating__option[aria-selected="true"]` de la capa final (misma especificidad, posterior) pisaba el estilo de la opción clear | Override explícito `.rating__option--clear[aria-selected="true"]` tras esa regla |

## ✅ QA (Edge headless, `file://`)
| Verificación | Resultado |
|---|---|
| Escritorio 1440px: hero con backdrop Endgame + texto legible | OK (captura) |
| Resúmenes escritorio: estantería 6 col, chips, ticks, dividers | OK (captura) |
| Plataforma escritorio: chips lila, pósters, tarjeta-enlace | OK (captura) |
| Móvil real 390px (iframe): sin overflow horizontal, bottom nav abajo, hero legible | OK (captura) |
| Sheet de nota móvil: cabecera + 4 col + «Sin nota» al final | OK (captura) |
| Popover de nota escritorio: fila única 0–10 + cabecera | OK (captura) |
| `DATA`/`XMEN_DATA`/`TAB_IDS`/`build*` presentes tras extracción | OK (grep, ver cierre de sesión) |

Notas de QA headless (documentadas en CLAUDE.md § Notas de proceso):
ancho mínimo de ventana ~500px en Windows (usar iframe de 390px para
móvil); `--virtual-time-budget` ejecuta timers pero no espera imágenes
lazy (pósters "vacíos" en capturas = artefacto, no bug).

---
*Documentado por: sesión Claude 2026-07-23 (parte 3)*
