
# DISEÑO-SISTEMA · MCU Tracker — "ENDGAME" (v2)
Nuevo sistema de diseño inspirado en la portada de **Vengadores: Endgame**. Reemplaza por completo la paleta roja/dorada descrita en `DISENO-SPEC.md`. Este documento no modifica `index.html`; es la especificación que debe aplicar el agente de frontend.

Entregables asociados:
- `css/tokens.css` — variables `:root` listas para usar.
- `css/metal-title.css` — clase `.metal-title` (efecto acero/plata) + variantes.

---

## 0. Dirección creativa

La portada de Endgame es una nebulosa lila-azul muy oscura, casi negra en los bordes, con los personajes en silueta y el logotipo **"AVENGERS: ENDGAME"** tratado en cromo/plata pulida con reflejos fríos (azulados/violetas del entorno). El nuevo sistema traduce eso a tokens de UI:

| Elemento de la portada | Traducción a UI |
|---|---|
| Nebulosa lila-azul muy oscura | `--bg` / `--surface*` — navy-violeta neutro y oscuro |
| Halo/energía lila | `--brand-purple*`, `--serie`, `--glow-purple` |
| Halo/energía azul eléctrico | `--brand-blue*`, `--film`, `--glow-blue` |
| Logotipo cromado con bisel | `.metal-title` — degradado `--steel-*` + bisel vía `text-shadow` |
| Reflejo frío del entorno sobre el cromo | `--steel-sheen` (gris-plata teñido de azul-violeta) |

Restricciones respetadas: **sin rosa, sin amarillo**. El único acento cálido (`--especial`, para el tipo "Especial") se resolvió como **bronce/cobre** (`#c17f3e`), un metal cálido que dialoga con el acero frío sin usar amarillo ni rosa.

---

## 1. Paleta final — hex + rol

### 1.1 Base / superficies

| Token | Hex | Rol |
|---|---|---|
| `--bg` | `#0a0a13` | Fondo global — "espacio profundo" |
| `--surface` | `#141420` | Superficie de tarjetas (`.item`, `.action-row`, `.plat-card`) |
| `--surface-2` | `#1b1b2c` | Hover de superficie, barra de progreso vacía |
| `--surface-3` | `#232338` | Superficie elevada (glass/badges) |
| `--border` | `#2c2c46` | Borde por defecto |
| `--border-hover` | `#38385a` | Borde en hover/focus suave |
| `--text` | `#f2f1fa` | Texto primario (blanco con velo lavanda) |
| `--text-2` | `#b7b2d4` | Texto secundario |
| `--muted` | `#7a76a0` | Texto terciario (fechas, metadatos) |

### 1.2 Acento de marca — Lila/Púrpura + Azul eléctrico

| Token | Hex | Rol |
|---|---|---|
| `--brand-purple` | `#8b5cf6` | Acento primario — texto grande, bordes, mitad del degradado de marca |
| `--brand-purple-bright` | `#b794ff` | Texto pequeño sobre lila, hover |
| `--brand-purple-deep` | `#4c2889` | Viñetas de fondo, glows amplios, gradientes oscuros |
| `--brand-blue` | `#3b82f6` | Acento secundario — texto grande, mitad del degradado de marca |
| `--brand-blue-bright` | `#60a5ff` | Focus-ring, hover, texto pequeño sobre azul |
| `--brand-blue-deep` | `#1b3a8a` | Viñetas de fondo, glows amplios |
| `--brand-gradient` | `linear-gradient(90deg, #8b5cf6, #3b82f6)` | Barra de progreso global/fase, indicador de tab activo, anillo del hero |

### 1.3 Metálico / acero (plata pulida — exclusivo de `.metal-title`)

| Token | Hex | Rol |
|---|---|---|
| `--steel-1` | `#3a3d47` | Sombra profunda del bisel (banda oscura del degradado) |
| `--steel-2` | `#6b6f7c` | Acero medio-oscuro |
| `--steel-3` | `#9ba0ae` | Acero medio — también color sólido de fallback |
| `--steel-4` | `#cdd1db` | Acero claro |
| `--steel-5` | `#f5f6fa` | Brillo casi blanco (punto más luminoso del degradado) |
| `--steel-sheen` | `#c9d4ff` | Reflejo frío teñido de azul-violeta (segunda banda de brillo) |

### 1.4 Semántica de tipo (reinterpretada)

| Token | Hex | Rol | Cambio vs. sistema anterior |
|---|---|---|---|
| `--film` | `#3b82f6` | Tag "Película" | Sin cambio de valor — ahora además es uno de los dos colores de marca |
| `--serie` | `#a855f7` | Tag "Serie" | Sin cambio de valor — ya era lila, encaja perfecto en la nueva dirección |
| `--especial` | `#c17f3e` | Tag "Especial" | Antes ámbar `#f59e0b` (podía leerse como cálido/amarillento) → ahora **bronce/cobre**, metal cálido, cero amarillo |
| `--done` | `#10b981` | Estado "visto" | **Sin cambio** (petición explícita del cliente: mantener verde) |

### 1.5 Marcas externas controladas (sin cambio de valor)

| Token | Hex | Rol |
|---|---|---|
| `--youtube-red` / `--youtube-red-text` | `#d0201a` / `#ff5a5f` | CTA "Ver resumen" |
| `--disney-blue` / `--disney-blue-text` | `#113ccf` / `#5b8def` | Badge/CTA Disney+ |

Se mantienen intactos: son colores de marca real de terceros, fuera del alcance del rediseño, y ya funcionan bien sobre la nueva base oscura (ver §4).

### 1.6 Regla de exclusión verificada

- **Rosa**: ningún token usa hue de magenta/rosa (todos los lilas están en la familia violeta `#8b5cf6`/`#a855f7`, hue ≈ 258–271°, no ≈ 320–340° que sería rosa).
- **Amarillo**: ningún token usa amarillo puro. `--especial` (`#c17f3e`) tiene hue ≈ 28° (naranja-cobre), lejos del rango amarillo (≈ 45–65°).

---

## 2. Google Fonts — `<link>` a añadir

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Reemplaza el `<link>` actual de Inter+Manrope. Inter se mantiene (mismos pesos); Manrope se retira; se añaden Anton y Oswald.

### 2.1 Por qué esta tipografía

- **Anton** (`--font-hero`, un único peso 400 pero visualmente "black"/ultra-bold): trazo muy grueso y uniforme, con una x-height alta y letras condensadas mayúsculas. Es el lienzo ideal para el efecto metálico: cuanto más grueso el trazo, más superficie visible tiene el degradado de acero y más nítido se lee el bisel (`text-shadow` en capas). Un serif tipo Cinzel se descartó porque el logotipo real de Endgame es una sans-serif angulosa y moderna, no una épica romana con remates — Cinzel evocaría más "fantasía/Roma" que "ciencia-ficción/blockbuster".
- **Oswald** (`--font-display`, 400–700): condensada, recta, cinematográfica pero más contenida que Anton — perfecta para textos display de tamaño medio donde Anton ya resultaría demasiado grueso para leerse bien (h2 de fase, marca del topbar, tabs, cifras de UI). Sustituye a Manrope manteniendo el mismo rol en el sistema de tokens (`--font-display`).
- **Inter** (`--font-body`, 400–700): se mantiene sin cambios — ya cubre cuerpo de texto, fechas, badges y CTAs con excelente legibilidad a tamaños pequeños.

### 2.2 Jerarquía de 3 niveles

```
Anton   → SOLO hero-title / .metal-title grande (1 sola vez por vista, alto impacto)
Oswald  → h2 de fase, marca (topbar), tabs, cifras de stats/badge
Inter   → todo el resto: párrafos, fechas, tags, botones, CTAs
```

---

## 3. Escala tipográfica

Se reutilizan los mismos nombres de tokens que el sistema anterior (para no romper el layout), sin cambiar sus valores clamp:

```css
--fs-eyebrow:   .72rem;                       /* micro-label uppercase sobre el hero */
--fs-hero:      clamp(1.75rem, 5.5vw, 2.75rem); /* h1 del hero — usa .metal-title */
--fs-hero-sub:  clamp(.875rem, 2vw, 1rem);
--fs-h2:        1.125rem;                      /* cabeceras de fase/panel — .metal-title--sm opcional */
--fs-body:      .875rem;
--fs-small:     .75rem;
--fs-xs:        .6875rem;
```

Pesos y tracking (nuevos, complementan la escala de tamaños):

```css
--fw-regular:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700; --fw-black:800;
--tracking-tight:-.02em;   /* .metal-title (hero) */
--tracking-normal:0;
--tracking-wide:.05em;     /* tabs, botones, .metal-title--sm */
--tracking-widest:.18em;   /* eyebrow uppercase */
```

Regla de uso: `.metal-title` (Anton) se reserva para texto ≥ `var(--fs-hero)` (~28–44px). Por debajo de ese tamaño se usa `.metal-title--sm` (Oswald bold + tinte de acero plano, sin degradado completo) — ver razón de legibilidad en §5.3.

---

## 4. Verificación de contraste (WCAG 2.1 AA)

Cálculo de luminancia relativa y ratio de contraste sobre los colores reales de uso (fondo `--bg` = `#0a0a13`, luminancia relativa ≈ 0.0033):

| Combinación | Uso | Ratio | Umbral | Resultado |
|---|---|---|---|---|
| `--text` (#f2f1fa) sobre `--bg` | cuerpo de texto | 17.6:1 | 4.5:1 | ✅ AAA |
| `--text-2` (#b7b2d4) sobre `--bg` | texto secundario | 9.7:1 | 4.5:1 | ✅ AAA |
| `--muted` (#7a76a0) sobre `--bg` | fechas, metadatos (texto normal 12px) | 4.6:1 | 4.5:1 | ✅ AA (ajustado desde un gris-violeta más oscuro que fallaba en 3.9:1) |
| `--brand-purple` (#8b5cf6) sobre `--bg` | eyebrow, acentos grandes | 4.7:1 | 3:1 (texto grande) / 4.5:1 (texto normal) | ✅ pasa incluso como texto normal |
| `--brand-purple-bright` (#b794ff) sobre `--bg` | texto pequeño, hover | 8.2:1 | 4.5:1 | ✅ AAA |
| `--brand-blue` (#3b82f6) sobre `--bg` | tag "Película", enlaces | 5.4:1 | 4.5:1 | ✅ pasa |
| `--brand-blue-bright` (#60a5ff) sobre `--bg` | focus-ring, hover | 7.9:1 | 4.5:1 (texto) / 3:1 (UI) | ✅ pasa ambos umbrales con margen |
| `--serie` (#a855f7) sobre `--bg` | tag "Serie" | 5.0:1 | 4.5:1 | ✅ pasa |
| `--especial` (#c17f3e) sobre `--bg` | tag "Especial" | 6.0:1 | 4.5:1 | ✅ pasa |
| `--done` (#10b981) sobre `--bg` | estado "visto" | 7.8:1 | 4.5:1 | ✅ pasa |
| `--youtube-red-text` (#ff5a5f) sobre `--surface` | CTA reposo | ≈5.9:1 | 4.5:1 | ✅ pasa (ratio heredado, base oscura equivalente) |
| `--disney-blue-text` (#5b8def) sobre `--surface` | CTA reposo | ≈5.6:1 | 4.5:1 | ✅ pasa (ratio heredado) |

**`.metal-title` (texto grande, Anton ≥ 28px, siempre en la franja del hero con overlay oscuro ≥66–88% de opacidad):** la banda intermedia del degradado (`--steel-2`, `#6b6f7c`) da 3.95:1 sobre `--bg` — supera el umbral de 3:1 exigido para texto grande/negrita. Las bandas más oscuras del degradado (`--steel-1`) son intencionalmente de bajo contraste: representan la zona "en sombra" del bisel (igual que un logotipo cromado real tiene zonas recogidas más oscuras), mientras que la mayoría de la superficie de cada letra (bandas `--steel-4`/`--steel-5`/`--steel-sheen`) tiene contraste alto. Refuerzos aplicados para garantizar legibilidad real:
1. `.metal-title` solo se usa sobre la franja del hero con scrim ≥66% de opacidad (mismo criterio que el sistema anterior para el hero-title).
2. `text-shadow` en capas (bisel + halo) añade un borde de sombra oscura alrededor de cada glifo, independiente del degradado.
3. `-webkit-text-stroke` fino define el contorno del glifo con un tono oscuro traslúcido.
4. `@media (prefers-contrast: more)` y `@media (forced-colors: active)` eliminan el degradado y usan color sólido claro + sombra reforzada (ver `css/metal-title.css`).
5. Para tamaños medios se usa `.metal-title--sm` (color sólido `--steel-4`, 8.4:1 aprox. sobre `--bg`), evitando el degradado donde perdería legibilidad.

Nota sobre `--especial` (#c17f3e) y la restricción "sin amarillo": su hue (~28°) es naranja-cobre, no amarillo (~45–65°); se verifica visualmente como "bronce/metal cálido", coherente con el tema metálico del sistema y sin infringir la restricción de paleta.

---

## 5. La técnica del efecto metálico (`.metal-title`)

Fichero: `css/metal-title.css`. Resumen de la técnica (clase base):

```css
.metal-title{
  font-family: var(--font-hero);           /* Anton */
  text-transform: uppercase;
  letter-spacing: var(--tracking-tight);
  color: var(--steel-3);                   /* fallback sólido */

  background-image: linear-gradient(180deg,
    #ffffff        0%,
    var(--steel-5) 12%,
    var(--steel-4) 30%,
    var(--steel-2) 48%,
    var(--steel-sheen) 64%,
    var(--steel-3) 80%,
    var(--steel-1) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  text-shadow:
    0 1px 0    rgba(255,255,255,.5),   /* filo superior iluminado */
    0 -1px 1px rgba(0,0,0,.55),        /* filo inferior en sombra */
    0 3px 6px  rgba(0,0,0,.55),        /* profundidad */
    0 0 22px   rgba(139,92,246,.35),   /* halo lila */
    0 0 38px   rgba(59,130,246,.25);   /* halo azul, más amplio */

  -webkit-text-stroke: .6px rgba(20,18,38,.5);
  filter: drop-shadow(0 6px 14px rgba(5,4,14,.5));
}
```

### 5.1 Cómo funciona, paso a paso

1. **Degradado de acero (`background-image` + `background-clip:text`)**: el texto actúa como máscara de recorte de un degradado vertical de 7 paradas. Las paradas no son un simple blanco→gris→negro lineal: alternan dos bandas claras (12% y 64%) con tres bandas oscuras/medias (30%, 48%, 100%). Esa alternancia doble simula el reflejo que produce una letra con sección biselada o redondeada (como el metal cromado real) — un único degradado lineal se leería plano, casi 2D; con dos "golpes de luz" se percibe volumen.
2. **`--steel-sheen` (#c9d4ff)** ocupa la segunda banda de brillo (64%): en vez de blanco puro, es un gris-plata con un ligero tinte azul-violeta — es el detalle que ata el efecto metálico a la paleta del sistema (el acero "refleja" el ambiente lila/azul de la nebulosa de fondo, igual que en la portada real).
3. **`-webkit-text-fill-color: transparent`** dejar el relleno del glifo transparente para que se vea el degradado recortado (el `color` normal queda como fallback si el navegador no soporta `background-clip:text`).
4. **`text-shadow` en 5 capas** — esto es clave: **el `text-shadow` se sigue pintando aunque el relleno del texto sea transparente**, porque usa la silueta del glifo, no su color de relleno. Se usan las capas para tres funciones distintas: bisel (capas 1–2, luz arriba/sombra abajo, 1px de desplazamiento), profundidad (capa 3, blur más ancho) y halo ambiental de marca (capas 4–5, blur grande en lila y azul) — esto último es lo que conecta visualmente el título con el resto de acentos de color de la interfaz.
5. **`-webkit-text-stroke`** añade un contorno de 0.6px muy sutil y oscuro-translúcido: define el borde del glifo con precisión cuando el título se solapa con zonas más claras del fondo (por ejemplo, una explosión brillante en la imagen del hero), sin verse como un "outline" duro.
6. **`filter: drop-shadow(...)`** en el bloque completo (no por letra) da una sombra de caída suave que separa el conjunto del fondo, reforzando que el título "flota" delante de la imagen.

### 5.2 Variantes incluidas

- `.metal-title--sm`: versión plana (sin degradado) para tamaños medios — un solo color sólido (`--steel-4`) + sombra ligera. Se usa en h2 de fase, marca del topbar, tabs.
- `.metal-title-accent`: para la palabra de énfasis dentro de un `.metal-title` (equivalente al antiguo `<span>` rojo) — color sólido `--brand-blue-bright`, NO metálico, con halo lila+azul, para máximo contraste frente al acero circundante.
- `.metal-title--shine`: modificador opcional con barrido de luz lento (8s, `background-position` vertical) — desactivado automáticamente bajo `prefers-reduced-motion: reduce`.

### 5.3 Por qué el efecto se reserva a títulos grandes

El degradado usa bandas de hasta 6px de gris oscuro (`--steel-1`, contraste bajo) que en un trazo grueso (Anton, tamaño hero) ocupan una fracción pequeña de la altura total del glifo — el ojo percibe el conjunto como "brillante con sombra", no como "oscuro". En tamaños pequeños (por debajo de ~1.5rem) esa misma banda oscura ocupa una fracción mucho mayor de la x-height, y el trazo más fino de fuentes no-Anton agrava la pérdida de contraste — por eso `.metal-title--sm` usa color plano en vez de degradado completo.

### 5.4 Degradación / fallback (ver `css/metal-title.css` para el código completo)

1. `@supports not (background-clip: text)` → color sólido `--steel-3` + sombra, sin degradado.
2. `@media (prefers-contrast: more)` → se retira degradado y stroke, queda `--steel-4` sólido + sombra reforzada.
3. `@media (forced-colors: active)` → respeta el modo de alto contraste del SO (`CanvasText`, sin sombras ni degradado).
4. `@media (prefers-reduced-motion: reduce)` → anula la animación de `.metal-title--shine`.

---

## 6. Tabla de migración de tokens (para el agente de frontend)

| Token anterior (rojo/dorado) | Token nuevo (Endgame) | Nota |
|---|---|---|
| `--marvel-red` | `--brand-purple` | Texto grande, bordes |
| `--marvel-red-bright` | `--brand-blue-bright` | Focus-ring, hover pequeño (se cambia de familia: antes rojo brillante, ahora azul eléctrico) |
| `--marvel-red-deep` | `--brand-purple-deep` | Viñetas, glows |
| `--marvel-gold` | `--brand-blue` | Cifras clave, acento secundario |
| `--marvel-gold-deep` | `--brand-blue-deep` | Bordes/gradientes de fondo |
| `--brand-gradient` | `--brand-gradient` (mismo nombre) | Ahora `linear-gradient(90deg, var(--brand-purple), var(--brand-blue))` |
| `--brand-gradient-diag` | `--brand-gradient-diag` (mismo nombre) | Ídem, 135° |
| `--glow-red` | `--glow-purple` | |
| `--glow-gold` | `--glow-blue` | |
| `--especial` (#f59e0b, ámbar) | `--especial` (#c17f3e, bronce) | Mismo rol/uso, valor reinterpretado (sin amarillo) |
| `--especial-tint` | `--especial-tint` (mismo nombre) | rgba recalculado sobre el nuevo hex |
| `--font-display` ('Manrope') | `--font-display` ('Oswald') | Mismo rol de token, familia distinta |
| — (no existía) | `--font-hero` ('Anton') | Nuevo — exclusivo de `.metal-title` |
| `--film`, `--serie`, `--done` | sin cambio de valor | Ya encajaban en la nueva dirección |

### 6.1 Elementos fuera de CSS que requerirán actualización manual (no son tokens)

El favicon inline y los SVG del emblema/martillo en `index.html` usan hexes **codificados directamente** en el SVG (`stop-color="#e5283f"` / `"#d4a72c"`), no variables CSS — no se tocan en esta entrega (no se edita `index.html`), pero cuando el agente de frontend aplique este sistema deberá sustituir esos hexes fijos por `--brand-purple` (`#8b5cf6`) y `--brand-blue` (`#3b82f6`) para mantener coherencia visual con el resto de la interfaz.

Del mismo modo, `.bg-fx__vignette` usa `rgba(122,18,32,.16)` (rojo) y `rgba(138,107,30,.10)` (dorado) como radiales de fondo — el equivalente coherente con la nueva paleta sería `rgba(76,40,137,.16)` (`--brand-purple-deep`) y `rgba(27,58,138,.12)` (`--brand-blue-deep`).

---

## 7. Accesibilidad — notas adicionales

- **Focus visible**: recoloreado a `--focus-ring-color` (`--brand-blue-bright`, 7.9:1 sobre `--bg`/`--surface`) — cumple SC 1.4.11 (contraste de componentes UI, mínimo 3:1) con amplio margen, igual que la lógica del sistema anterior pero con la nueva familia de color.
- **`prefers-reduced-motion`**: se mantiene el mismo mecanismo endurecido del sistema anterior (neutraliza `transition`, `animation` y `scroll-behavior`); se añade además la desactivación específica de `.metal-title--shine` en `metal-title.css`.
- **`forced-colors` / alto contraste del SO**: nuevo respecto al sistema anterior — `.metal-title` degrada a `CanvasText` sin perder legibilidad (ver §5.4).
- **Objetivos táctiles, `role="tablist"`, estructura de tarjetas, etc.**: no cambian — este documento es solo el sistema visual/tokens; toda la lógica de accesibilidad estructural ya definida en `DISENO-SPEC.md` (§8) sigue vigente y es compatible con esta paleta.
- **Sin `px` en tipografía**: la escala reutiliza `rem`/`clamp()` ya existentes, sin introducir tamaños en `px`.

---

## 8. Checklist de aplicación

- [ ] `css/tokens.css` enlazado o pegado, **reemplazando por completo** el bloque `:root` rojo/dorado.
- [ ] `css/metal-title.css` enlazado **después** de `tokens.css`.
- [ ] `<link>` de Google Fonts actualizado (Anton + Oswald + Inter; se retira Manrope).
- [ ] `.hero-title` usa `.metal-title` (+ `.metal-title-accent` en el `<span>` de énfasis).
- [ ] H2 de fase / marca del topbar / tabs migrados a `--font-display` (Oswald) — opcionalmente `.metal-title--sm` en h2 de fase si se busca más carácter metálico.
- [ ] Todas las referencias a `--marvel-*` / `--glow-red` / `--glow-gold` sustituidas según la tabla de migración (§6).
- [ ] Hexes fijos en SVG inline (favicon, emblema, martillo, viñeta `.bg-fx`) actualizados a la nueva paleta (§6.1) — pendiente de aplicación manual por el agente de frontend, fuera del alcance de esta entrega.
- [ ] Verificado visualmente: sin rosa, sin amarillo en ningún elemento nuevo.
- [ ] `.metal-title` probado sobre el hero real (imagen + scrim) — legible en escritorio y móvil.
