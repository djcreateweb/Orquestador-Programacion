# PLAN DE REDISEÑO PRO — MCU Tracker

*Documento de decisiones. No implementa nada: es el brief cerrado para el equipo de agentes.*
*Fecha: 2026-07-23 · Ámbito: `index.html`, `css/tokens.css`, `css/styles.css`, `css/background.css`, `css/metal-title.css`, `js/images-posters.js` (sin tocar) · Restricción maestra: se conserva ESTRUCTURA y CONTRATOS técnicos.*

---

## 1. Resumen ejecutivo

El tracker ya tiene buen ADN (navy-violeta + acero Endgame) pero se lee "recargado y amateur" por tres motivos que este plan corrige sin romper nada:

1. **El fondo es un collage fotográfico de 7 capas** (backdrop borroso + skyline + rayo + logo + viñetas). En 2025-26 lo premium es lo contrario: **oscuro ambiental** (glows de gradiente + grano fino), con la foto reservada SOLO al hero. Pasamos de 7 capas a 2 → menos ruido, más caché, más "producto".
2. **La jerarquía tipográfica está aplanada**: Oswald se usa en h2, tabs, cifras y marca a la vez. Se reordena a un sistema de 3 roles claros con escala fluida `clamp()`, tracking correcto y `tabular-nums` en TODA cifra.
3. **El layout es móvil-encogido**: una sola columna a cualquier ancho y navegación por tabs superiores incómodas en el pulgar. Se rediseña **mobile-first** con **bottom navigation fija** y **la nota como bottom sheet**, y en escritorio (≥900px) se aprovecha el ancho con **listas a 2 columnas** y container de 1200px.

La paleta se **refina** (Dirección "Multiverso"): mismos violeta/azul, pero con superficies escalonadas por luminosidad, acentos aclarados para dark (violet-400/blue-400) y semánticos que cumplen AA. Migración = retocar tokens + sustituir rgba() hardcodeados, cero cambio de identidad. Resultado: salto perceptible de calidad con riesgo técnico bajo y todos los contratos de datos intactos.

---

## 2. Dirección visual + paleta (tokens)

**Elegida: A — "Multiverso" (evolución de la actual).** Conserva el capital visual (el violeta ya comunica "multiverso MCU"), la migración es a nivel de token, y cumple AA en todos los textos. **Descartadas:** *B "Sala de proyección"* (carbón cálido + oro Marvel; exige rehacer toda la temperatura de la UI y roza el amarillo prohibido por norma de paleta) y *C "Nebulosa"* (cian/magenta; se aleja de "Marvel", mete rosa/magenta vetados y tiende a verse "gamer").

### Tabla de tokens (`css/tokens.css` → bloque `:root`)

| Variable | Valor | Uso | Contraste s/`--bg` | Token viejo → nuevo |
|---|---|---|---|---|
| `--bg` | `#0b0b14` | Fondo raíz (subtono violáceo, nunca negro puro) | — | `#0a0a13` → `#0b0b14` |
| `--surface-1` | `#13131f` | Tarjetas base (`.item`, `.action-row`, `.stat`, `.count`) | — | `--surface #141420` → renombrar `--surface-1` |
| `--surface-2` | `#1a1a2b` | Hover de tarjeta, tracks, trigger de nota | — | `--surface-2 #1b1b2c` → `#1a1a2b` |
| `--surface-3` | `#232338` | Popover, chips activos, elevación modal | — | igual `#232338` |
| `--border` | `rgb(165 165 220 / .12)` | Bordes 1px con alpha (no gris sólido) | — | `--border #2c2c46` → alpha |
| `--border-hover` | `rgb(165 165 220 / .22)` | Borde en hover/focus | — | `--border-hover #38385a` → alpha |
| `--highlight` | `rgb(255 255 255 / .05)` | `inset 0 1px 0` luz cenital superior | — | *nuevo* |
| `--text` | `#f2f1f8` | Texto primario (velo lavanda) | ~18:1 | `#f2f1fa` → `#f2f1f8` |
| `--text-2` | `#a9a9c4` | Secundario, labels, subtítulos | ~8.1:1 | `#b7b2d4` → `#a9a9c4` |
| `--muted` | `#74748f` | Metadatos/fechas (solo ≥13px) | ~4.4:1 | `#7a76a0` → `#74748f` |
| `--accent` | `#a78bfa` | Acento texto/interacción (violet-400) | ~7.6:1 | `--brand-purple-bright` → `--accent` |
| `--accent-fill` | `#8b5cf6` | Relleno de barras/gradiente (no texto) | 4.7:1 (no-texto) | `--brand-purple` → `--accent-fill` |
| `--accent-2` | `#60a5fa` | Acento secundario + focus (blue-400) | ~7.1:1 | `--brand-blue-bright` → `--accent-2` |
| `--accent-deep` | `#4c2889` | Glows/gradientes profundos, scrims | — | `--brand-purple-deep` (igual) |
| `--brand-gradient` | `linear-gradient(90deg,#8b5cf6,#60a5fa)` | Progreso global/fase, tab/nav activo, anillo | — | igual, extremos aclarados |
| `--film` | `#60a5fa` | Tipo Película | ~7.1:1 | `#3b82f6` → `#60a5fa` |
| `--serie` | `#a78bfa` | Tipo Serie | ~7.6:1 | `#a855f7` → `#a78bfa` |
| `--especial` | `#e0a94f` | Tipo Especial (ámbar cálido, **no amarillo puro**) | ~8.9:1 | `#c17f3e` → `#e0a94f` |
| `--done` | `#34d399` | Visto / éxito | ~9.5:1 | `#10b981` → `#34d399` |
| `--film-tint` | `rgb(96 165 250 / .5)` | Tinte póster film | — | recalcular |
| `--serie-tint` | `rgb(167 139 250 / .5)` | Tinte póster serie | — | recalcular |
| `--especial-tint` | `rgb(224 169 79 / .45)` | Tinte póster especial | — | recalcular |
| `--shadow-sm` | `0 1px 2px rgb(0 0 0/.5)` | Sombra base 1 fuente | — | ajustar |
| `--shadow-md` | `0 1px 2px rgb(0 0 0/.5), 0 8px 24px rgb(0 0 0/.35)` | Flotantes (stat hover, chips) | — | ajustar |
| `--shadow-lg` | `0 1px 2px rgb(0 0 0/.5), 0 18px 48px -12px rgb(0 0 0/.55)` | Popover/bottom sheet | — | ajustar |
| `--glow-accent` | `0 0 20px rgb(139 92 246/.35)` | Glow de barras/tab activo | — | unifica `--glow-purple/blue` |
| `--focus-ring-color` | `var(--accent-2)` | Anillo de foco (3:1 componentes) | ~7.1:1 | igual mecanismo |
| `--container-max` | `1200px` | Ancho de contenido | — | `900px` → `1200px` |

**Acero (`--steel-1..5`, `--steel-sheen`): se conservan** (funcionan para el `.metal-title`); solo se actualizan los halos rgba del `text-shadow` a los nuevos acentos.

> **⚠️ Peligro de migración (crítico):** hay **rgba() hardcodeados con los valores viejos** repartidos por `styles.css`, `background.css` y `metal-title.css` — `rgba(139,92,246,x)`, `rgba(59,130,246,x)`, `rgba(168,85,247,x)`, `rgba(16,185,129,x)`, `rgba(96,165,255,x)`. Cambiar solo los hex del `:root` **NO** actualiza glows, sombras ni chips. Cada fase que toque un fichero debe sustituir esos literales por los nuevos valores o extraerlos a token. Auditar con `grep` antes de cerrar cada fase.

---

## 3. Sistema tipográfico

**Elegido: A refinada — Anton + Oswald + Inter (0 fuentes nuevas).** La selección no es el problema; lo es la ejecución. Se corrige reservando **Oswald solo a h2 de fase y cifras de stats** (su mejor uso cinematográfico), pasando **tabs/labels/títulos de fila a Inter 600** y aplicando escala fluida + `tabular-nums`. **Descartada B (Bebas Neue + Inter):** ahorra un archivo y da aire "tráiler", pero está muy vista, pierde legibilidad <20px y aún así obliga a re-tocar toda la jerarquía; el salto lo damos con dirección visual + sistema, no cambiando la fuente. **Descartada C (Space Grotesk + Space Mono):** 5 archivos y tono "tech/HUD" que aleja de "cartel Marvel".

### Escala fluida (320→1240px)

| Rol | Familia / peso | `font-size` | `line-height` | `letter-spacing` |
|---|---|---|---|---|
| Hero | Anton 400, uppercase | `clamp(2.75rem, 1.5rem + 6vw, 5rem)` (44→80px) | `0.98` | `0.01em` |
| H2 sección/fase | Oswald 600, uppercase | `clamp(1.5rem, 1.2rem + 1.6vw, 2.25rem)` (24→36px) | `1.1` | `0.02em` |
| Título de fila | Inter 600 | `clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)` (17→20px) | `1.25` | `0` |
| Cuerpo | Inter 400 | `1rem` (16px fijo) | `1.5` | `0.01em` |
| Metadato / fecha | Inter 400 | `0.8125rem` (13px) | `1.4` | `0.01em` |
| Eyebrow / label / tab | Inter 600, uppercase | `0.75rem` (12px) | `1.2` | `0.10em` |
| Cifra stats / % | Oswald 600 + `tabular-nums` | `clamp(1.75rem, 1.3rem + 2.2vw, 2.75rem)` (28→44px) | `1.0` | `0` |
| Micro-texto | Inter 400 | `0.6875rem` (11px) | `1.35` | `0.02em` |

Reglas: `rem` siempre en `clamp()`; `font-variant-numeric: tabular-nums` (fallback `font-feature-settings:'tnum'`) en **toda** cifra (stats, %, contadores de fase, duraciones, años) para que no "bailen" al actualizar; ratio hero:cuerpo ≤5:1.

### Dark mode

- **Nunca blanco puro.** En superficies sólidas usar los hexes de token (`--text` / `--text-2` / `--muted`, jerarquía ~100/70/45%). Reservar `rgba(255,255,255, .92/.64/.40)` **solo para texto que va directo sobre la foto del hero** (backdrop variable): primario `.92`, subtítulo `.86`, badge label `.64`.
- Prohibir pesos ≤300; cuerpo 400, texto ≤13px en 500. No compensar con bold generalizado.
- `body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }` (justificado en dark).

### Carga (`<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Pasa de 8 pesos actuales a **5 archivos** (Anton + Oswald 500/600 + Inter 400/500/600). Migración de referencias: `.brand`, `.tab`, `.metal-title--sm` que hoy usan Oswald 700 pasan a **Oswald 600**; usos de Inter 700 pasan a **Inter 600**. (Fase futura opcional: autoalojar WOFF2 para CWV.)

---

## 4. Fondo de página (por capas)

**Elegido: ambiental de 2 capas** (glows + grain) reemplazando el collage de 7. La foto se conserva **solo dentro del hero** con scrim multicapa. Es el cambio individual que más sube la percepción "pro" y además reduce peso/repaint.

Nuevo markup de `.bg-fx` (primer hijo de `<body>`, sustituye a las 7 capas actuales):

```html
<div class="bg-fx" aria-hidden="true">
  <div class="bg-fx__glows"></div>
  <div class="bg-fx__grain"></div>
</div>
```

**Capa 1 — glows (`.bg-fx__glows`, `position:fixed; inset:0; z-index:-1`):**
```css
background:
  radial-gradient(60rem 40rem at 15% -10%, rgb(139 92 246 / .16), transparent 60%),
  radial-gradient(50rem 35rem at 85% 110%, rgb(96 165 250 / .10), transparent 60%),
  var(--bg);
```
Coste de pintado casi nulo, sin assets, tematizable por token. **Sin animación** (o "respiración" de `transform` a 40s+ solo ≥1024px y apagada en `reduced-motion`).

**Capa 2 — grain (`.bg-fx__grain`, `position:fixed; inset:0; z-index:-1; pointer-events:none`):** SVG `feTurbulence` en data-URI, `baseFrequency≈0.65`, `numOctaves=3`, `opacity:.05`, `background-size:180px`, `mix-blend-mode:overlay`. Imagen estática cacheada (impacto insignificante); **nunca animar**. Mata el banding de los glows y da acabado fílmico.

**Scrim del hero (`.hero-cinematic__media`, patrón Netflix):**
```css
background-image:
  linear-gradient(to top, #0b0b14 0%, rgb(11 11 20 / .6) 40%, transparent 75%),
  linear-gradient(90deg, #0b0b14 0%, transparent 50%),
  var(--hero-img, none);
```
La key-art "emerge" del fondo sin costura. **Evitar:** `backdrop-filter` en toda la página y gradientes animados de fondo. `@media print { .bg-fx{display:none} }`.

> Los assets de `assets/fondo/*` (backdrop, skyline, rayo, logo) dejan de usarse en el fondo global; `assets/hero-vengadores.jpg` (HERO_LOCAL) se mantiene.

---

## 5. Layout ESCRITORIO (≥900px)

- **Container:** `--container-max: 1200px` centrado para topbar, hero, stats, listas y footer; texto corrido limitado a 60-75ch (`.panel-intro p`, subtítulo).
- **Listas a 2 columnas:** `.grid` y `.action-grid` pasan de `flex column` a
  `display:grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap:14px;` (relleno row-major → conserva orden cronológico de lectura izquierda→derecha). **No** usar `columns` CSS. Los `.list-divider` ocupan `grid-column:1 / -1`. Mantener el contrato: ni `.grid` ni `.item` con `overflow:hidden` (el popover de nota debe desbordar).
- **Densidad de fila:** póster `--poster-w: 64px`, fila `min-height:64px`, duración + tag + nota inline visibles sin abrir nada. `padding:14px 18px`.
- **Hover states** (envueltos en `@media (hover:hover) and (pointer:fine)`): fila `translateY(-2px)`, borde a `--border-hover`, `box-shadow:var(--shadow-sm)`, póster `scale(1.04)`; transición `150ms` `--ease-smooth`. `:focus-visible` con el mismo realce.
- **Hero panorámico:** `min-height: clamp(460px, 62vh, 660px)`, tipografía fluida (Anton hasta 80px), badge de progreso a la derecha; scrim del §4. No es "más grande", es más ancho y con más aire.
- **Stats:** 3 columnas (`repeat(3,1fr)`), cifra Oswald 600 `tabular-nums` hasta 44px.

---

## 6. Layout MÓVIL (base, <900px) — pensado, no encogido

- **Bottom navigation fija** (4 destinos, reutiliza los mismos botones `.tab`): `position:fixed; bottom:0; left:0; right:0`, altura `56px + env(safe-area-inset-bottom)`, fondo con leve elevación/blur, borde superior 1px. Cada destino = **icono (SVG 22px) + etiqueta corta** (nunca solo icono), en columna. Destino activo con color `--accent` + indicador (barra o punto) y `aria-selected`. `main` recibe `padding-bottom: calc(56px + env(safe-area-inset-bottom) + 12px)` para no tapar el último ítem.
- **Topbar reducida y sticky:** solo marca + `%` global + mini-barra (se oculta el resto). `padding-top: env(safe-area-inset-top)`.
- **Fila compacta (2 filas, sin cambiar clases):** fila 1 = póster + título/fecha; fila 2 (bajo el texto) = duración · tag · nota. `min-height:64px`, touch targets ≥44px (ampliar área con `::after` inset negativo donde el visual sea menor, p. ej. la píldora de nota). Título `-webkit-line-clamp:2`, metadatos 1 línea con `text-overflow:ellipsis` (requiere `min-width:0` en el hijo flexible). Póster 2:3 de 48×72.
- **Nota como bottom sheet** (no popover): al abrir, panel `position:fixed` anclado abajo, ancho completo, scrim, 11 botones de ≥44px en grid + "Sin nota"; cierre por scrim/Escape/arrastre, foco atrapado, scroll del body bloqueado (`overscroll-behavior:contain`). Ver §7 y §10-Fase 5 (toca JS).
- **Stats apiladas** en 1 columna (o 3 compactas si caben ≥380px); cifra reducida vía `clamp`.
- **Tabs superiores actuales:** se ocultan en móvil (`display:none`), su rol lo asume la bottom nav; en escritorio la bottom nav se oculta y reaparecen los tabs. Un solo `role="tablist"` semántico se mantiene.

---

## 7. Componente a componente

| Componente | Cambios concretos |
|---|---|
| **Topbar** | Sticky, fondo `rgb(11 11 20 / .82)` + `backdrop-filter:blur(12px)`, borde `--border`. Marca en Inter 600 (icono rombo intacto). Progreso: `.pct` en `tabular-nums`, `.mini-bar` 6px `--brand-gradient` + `--glow-accent`. `env(safe-area-inset-top)`. |
| **Hero** | `min-height:clamp(460px,62vh,660px)`. Eyebrow Inter 600 uppercase `--accent-2`. `.metal-title` (Anton) se mantiene, halos rgba al nuevo acento. Subtítulo `rgba(255,255,255,.86)` máx 56ch. Badge de progreso: cristal `rgb(20 20 34 / .55)`, anillo SVG con `--brand-gradient`, `%` y count en `tabular-nums`. Scrim del §4. |
| **Tabs / Bottom-nav** | Mismos 4 botones `.tab` (IDs, `data-tab`, aria intactos). Se añade `<svg>` icono + `<span class="tab__label">` dentro de cada uno (JS-safe). Escritorio: barra de pestañas centrada sticky bajo topbar, activa con subrayado `--brand-gradient` + glow. Móvil: bottom nav (§6). |
| **Stats** | Tarjetas `--surface-1`, borde `--border`, `--highlight` inset, radio `--r-xl`. Barra superior de color por tipo (done/left/total). Cifra Oswald 600 `tabular-nums`; label Inter 600 uppercase `.10em`. Hover `translateY(-3px)` solo desktop. |
| **Cabecera de fase** | H2 Oswald 600 uppercase (escala §3), años en `--muted`, `%` y count `tabular-nums` alineados a la derecha. Track de progreso 6px `--surface-2` + fill `--brand-gradient` con `--glow-accent`; transición `width` `--dur-slower`. |
| **Fila checklist (`.item`)** | Grid `poster · meta · duration · tag · rating` (desktop) / 2 filas (móvil). Borde izq 3px por tipo. Póster con `inset` highlight; `.done` → scrim `rgb(11 11 20 / .6)` + título `line-through` `--done` alpha. Check 24px, área táctil ≥36-44px. Hover del §5. |
| **Fila acción (`.action-row`)** | Póster · meta · CTA. CTA YouTube (roja de marca) y Google/"¿Dónde verla?" (`--brand-gradient` en hover). Fila `--clickable` en Plataforma abre Google. Móvil: CTA a ancho completo (`grid-column:1/-1`). |
| **List-divider** | Etiqueta Inter 600 uppercase `.10em` `--muted` + regla `flex:1` 1px `--border`. `:first-child` sin margen extra. |
| **Popover / bottom sheet de nota** | Desktop: popover anclado actual (reposición up/down por JS) restyleado a `--surface-3` + borde `--steel-2`. Móvil: bottom sheet (§6). Estado con nota → estrella `--accent` + valor con clip metálico; grid 6 col; `is-active` con anillo `--accent-2`. |
| **Footer** | `--container-max`, borde superior `--border`, texto `--text-2` `13px` lh 1.75. Margen inferior extra en móvil para no chocar con la bottom nav. |

---

## 8. Interacción y micro-animaciones

- **Hover** (`@media (hover:hover) and (pointer:fine)` siempre): `translateY(-2px)` + borde `.22` alpha, `transition:150ms var(--ease-smooth)`.
- **Active:** `scale(.98)` a 80ms (feedback táctil <100ms). `-webkit-tap-highlight-color: transparent` + estados `:active` propios.
- **Focus:** anillo doble capa `box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent-2)` (o el `outline` global de tokens), mínimo 2px, contraste ≥3:1, en TODO control (teclado).
- **Transiciones tokenizadas:** progreso `--dur-slower`; hover `--dur-fast`; popover/sheet `--dur-normal`.
- **Reduced-motion** (`prefers-reduced-motion:reduce`): sin parallax de hero, sin drift de glows, sin sweep metálico, animaciones de barras a `.001ms`, `scroll-behavior:auto`.

---

## 9. Accesibilidad y rendimiento

**Accesibilidad:** contraste AA en todo texto (tabla §2; `--muted` solo ≥13px); `:focus-visible` en tabs, check, trigger de nota, CTAs y filas; roles `tablist/tab/aria-selected` conservados aunque sea bottom nav; bottom sheet con foco atrapado, `Escape` y scrim; `aria-checked` en los checks; iconos decorativos `aria-hidden`.

**Rendimiento:** fuentes `display=swap`, 5 pesos, preconnect (§3); pósteres bajo el fold `loading="lazy" decoding="async"`; hero/LCP `fetchpriority="high"` sin `lazy`; `aspect-ratio:2/3` en todo póster → CLS 0; grain como imagen estática cacheada; fondo de 7→2 capas (menos repaint); `contain:paint` en `.bg-fx`.

**Checklist de funcionamiento perfecto (verificable):**
1. `<meta viewport ... viewport-fit=cover>`; `env(safe-area-inset-bottom)` en bottom nav y `-top` en topbar (probar iPhone con notch).
2. Todo `input/select/textarea` con `font-size ≥16px` (evita auto-zoom iOS).
3. `-webkit-tap-highlight-color:transparent` + `:active` propios (<100ms).
4. Sin scroll horizontal: `scrollWidth ≤ innerWidth` en 320/375/768px.
5. Sticky correcto: `scroll-margin-top` en secciones; `main` con `padding-bottom` = altura nav + safe-area.
6. `prefers-reduced-motion`: parallax/barras/transiciones largas desactivadas.
7. Imágenes: lazy bajo el fold; LCP eager + `fetchpriority=high`; `aspect-ratio` o `width/height` en todas.
8. Touch targets ≥44×44px (11 botones de nota, tabs de la bottom nav, check).
9. Bottom sheet: cierre por scrim + Escape, foco atrapado, `overscroll-behavior:contain`, sin salto de layout.
10. Hover condicionado a `@media (hover:hover)`; ninguna función solo por hover; `:focus-visible` en todos los controles.

---

## 10. Plan de implementación por fases

> **Regla transversal (el riesgo nº1):** el `<script>` inline de `index.html` **genera** las filas (`buildItemRow`, `buildActionRow`, `buildPlatformRow`, `buildPhase`, `buildRatingControl`). Restilizar con las **clases existentes** = CSS puro, sin tocar JS. Pero **añadir/reordenar elementos dentro de una fila, o añadir hijos a los `.tab`, o convertir la nota en sheet = tocar el JS**. Contratos intocables (KEY `mcu_checklist_v3`/`mcu_ratings_v1`, identidad `t`, orden de `TAB_IDS`, `buildXmen()` tras `buildChecklist()`, `.rating` con `position:relative` y sin `overflow:hidden` en `.item`/`.grid`) se respetan en TODAS las fases.

| Fase | Agente | Ficheros | Qué hace | Qué NO puede romper |
|---|---|---|---|---|
| **0 · Tokens** | diseno-agent + frontend-vanilla | `css/tokens.css` | Reescribir `:root` con la paleta §2 (renombres + alpha + `--container-max:1200`). | No renombrar sin mantener alias temporales; auditar que ningún selector quede sin variable. Solo valores CSS. |
| **1 · Fondo** | frontend-vanilla | `css/background.css`, `index.html` (`.bg-fx`) | Sustituir 7 capas por glows+grain (§4) y el scrim del hero. | `.bg-fx` sigue `pointer-events:none` `z-index:-1`; `setupHeroBg` (#heroMedia) intacto; no tocar el `<script>`. |
| **2 · Tipografía** | frontend-vanilla + rendimiento | `index.html` (`<link>`), `css/tokens.css`, `css/styles.css`, `css/metal-title.css` | Nuevo `<link>` (5 pesos), escala fluida §3, roles (Oswald→h2/cifras, Inter 600→tabs/labels/títulos), `tabular-nums`. | No cambiar textos ni estructura; migrar refs a Oswald 700/Inter 700 → 600. |
| **3 · Escritorio** | frontend-vanilla | `css/styles.css` | Container 1200, `.grid`/`.action-grid` a 2 col ≥900px, densidad, hover, hero panorámico, stats. | Sin `overflow:hidden` en `.item`/`.grid`; `list-divider` a ancho completo; popover sigue desbordando. |
| **4 · Móvil + bottom nav** | frontend-vanilla | `css/styles.css`, `index.html` (iconos+label en `.tab`, `padding-bottom` de `main`) | Bottom navigation fija (§6), topbar reducida, fila compacta 2 filas, stats apiladas, safe-areas. | Añadir hijos a `.tab` NO altera `data-tab`/IDs/aria que lee `setupTabs`; `TAB_IDS` en orden; nav accesible por teclado. |
| **5 · Nota bottom sheet (móvil)** | frontend-vanilla | `index.html` (`<script>` rating), `css/styles.css` | Rama móvil en `openPopover`/`closePopover`: si `matchMedia('(max-width:899px)')` → render como sheet (fixed bottom, scrim, foco atrapado, Escape), sin la reposición up/down. | **Máximo riesgo:** conservar `setRating`/`commitOption`/`currentValue` y la KEY `mcu_ratings_v1`; en desktop, popover idéntico al actual. Una sola sesión editando `index.html`. |
| **6 · A11y + perf** | rendimiento + errores | `index.html`, `css/*` | Lazy/fetchpriority, focus rings doble capa, `reduced-motion`, `aspect-ratio`, checklist §9. | No degradar contraste AA ni contratos. |
| **7 · SEO + QA + docs** | seo-agent, errores-agent, documentacion-agent | `index.html` (meta), — | Meta/OG revisados, QA del checklist §9 en 320/375/768/1200, documentar sesión. | Cerrar solo si `DATA`/`XMEN_DATA`/`TAB_IDS`/`build*` siguen íntegros (grep). |

**Orden y estimación:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Fases 0-3 son de bajo riesgo (CSS + markup de fondo); 4 introduce markup en tabs (JS-safe); **5 es la única que toca lógica JS** y debe ir sola. Estimación: **7 fases + 1 de cierre**, secuenciales; nunca dos agentes sobre `index.html` a la vez.

---

## 11. Riesgos y criterios de aceptación

**Riesgos y mitigación:**

| Riesgo | Mitigación |
|---|---|
| rgba() hardcodeados no migran con el token | `grep` de `139,92,246` / `59,130,246` / `168,85,247` / `16,185,129` antes de cerrar cada fase (§2). |
| 2 col + popover recortado | Ni `.grid` ni `.item` con `overflow:hidden`; `max-width:calc(100vw-16px)` en popover; verificar en columna derecha. |
| Iconos en `.tab` rompen `setupTabs` | `setupTabs` lee `data-tab` y togglea clases, no `textContent`: seguro. Verificar tras editar. |
| Bottom sheet corrompe `mcu_ratings_v1` | No tocar `setRating`/firma; test: poner nota 7 en móvil y recargar → persiste; misma nota en desktop. |
| Edición concurrente de `index.html` | Una sesión/agente por vez; grep de integridad de `DATA`/`TAB_IDS`/`build*` al cerrar. |
| `--container-max` 900→1200 desborda en pantallas medias | `minmax(440px,1fr)` con `auto-fill` cae solo a 1 col; probar 900/1024/1440. |

**Criterios de aceptación verificables:**

1. Todo texto cumple **AA** (medir `--text`/`--text-2`/`--muted` sobre superficies).
2. `localStorage` conserva progreso y notas **antes/después** del rediseño (KEYs y `t` intactos).
3. Las 4 pestañas navegan por click, hash, teclado y bottom nav; `TAB_IDS` en orden del DOM.
4. Bottom nav visible <900px con safe-area; tabs superiores ≥900px; sin solaparse.
5. Nota: popover anclado en desktop, bottom sheet en móvil; cierre por scrim/Escape; foco atrapado.
6. Listas a 2 col ≥900px, 1 col <900px; popover/sheet nunca recortado.
7. Sin scroll horizontal en 320/375/768; touch targets ≥44px; `reduced-motion` respetado.
8. `DATA` (62) + `XMEN_DATA` (19) = 81 títulos; progreso global y anillo del hero cuadran.
9. Fondo = glows + grain (2 capas); foto solo en hero; sin `backdrop-filter` global.
10. 5 pesos de fuente cargados; `tabular-nums` en toda cifra; sin CLS de póster.
