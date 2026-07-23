
# DISEÑO-FONDO-MARCA · MCU Tracker (Marvel-Peliculas)
Fondo global profesional + rediseño de logo/favicon — documento único para implementación en un solo pase.

Este documento **no modifica** `index.html`. Es la especificación (100% CSS + SVG inline, cero imágenes externas, cero JS nuevo) que debe aplicar el agente de frontend-vanilla sobre el archivo existente. Se apoya en la paleta y tokens ya definidos en `DISENO-SPEC.md` (no se inventan colores nuevos: todo sale de `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--border`, `--marvel-red`, `--marvel-red-deep`, `--marvel-gold`, `--marvel-gold-deep`).

Referencia de patrón aplicada (protocolo de auto-mejora): técnica de *fixed background layer div* (contenedor `position:fixed` con `z-index` negativo, primer hijo de `<body>`) documentada en el enfoque de capas del sistema `nicholasgasior/css-variables-design-system`, combinada con el patrón de *layered background-image fallback* ya usado en el hero de `DISENO-SPEC.md` §4 (gradientes en capas que nunca dejan un hueco vacío). La animación del haz de energía usa exclusivamente `transform` (técnica estándar de animación "compositor-only", sin repintado por frame) para minimizar coste, siguiendo el mismo criterio de rendimiento que ya aplica el proyecto en sus transiciones (`--dur-*` + `cubic-bezier`).

---

## 0. Resumen de decisiones

| Elemento | Decisión | Por qué |
|---|---|---|
| Fondo global | Contenedor `.bg-fx` fijo, primer hijo de `<body>`, `z-index:-1` | Queda detrás de topbar/hero/tarjetas sin tocar el DOM existente de esas secciones; no se mueve con el scroll (efecto "decorado de fondo fijo", 0 coste de scroll) |
| Interpretación "láseres" | Haces diagonales ultra finos (`repeating-linear-gradient`, alfa ≤5%), con una deriva de 50s casi imperceptible | Sugiere energía sin parecer un efecto de neón de los 2000 ni competir con el texto |
| Interpretación "martillo de Thor" | Silueta **facetada y geométrica** (no ilustrativa/caricaturesca) al 3.5% de opacidad, sangrando por la esquina superior derecha | Cumple el pedido explícito del cliente como marca de agua, sin caer en lo "recargado"; a esa opacidad es una textura, no un icono que compita con el contenido |
| Interpretación "torre Stark / skyline" | SVG de skyline anclado al pie del viewport, con una torre central más alta, remate y baliza dorada, difuminado (`blur(1.5px)`) y al 55% de opacidad | Da profundidad narrativa ("Nueva York al fondo") sin nunca superar en contraste a las tarjetas, que son opacas y están siempre por encima |
| Logo topbar | Nuevo emblema SVG: **escudo hexagonal + chispa de energía de 8 puntas**, gradiente rojo→dorado (`--brand-gradient`) | El cliente pidió explícitamente que NO fuera una "M"; el escudo alude a "Vengadores/protección" y la chispa a "energía/poder" sin ser una réplica de un logo oficial con derechos reservados |
| Favicon | Miniatura exacta del mismo emblema (escudo + chispa), SVG inline en `data:` URI | Coherencia total marca↔pestaña del navegador, cero peticiones de red, no se puede romper |
| Legibilidad | Todas las capas de color quedan ≤16% de alfa; el skyline usa tonos casi idénticos a `--surface`/`--border` (ya validados en `DISENO-SPEC.md` §1.2); nada oscurece jamás el texto (solo puede aclararlo mínimamente) | Las tarjetas (`--surface`) son opacas y no reciben ningún cambio; el texto "suelto" sobre el fondo (`.hint`, `.legend`, `.phase-head`, `footer`) se mantiene dentro del mismo rango de contraste ya verificado |

---

## 1. Capa de fondo global — HTML a insertar

Insertar como **primer hijo de `<body>`**, antes de `<div class="topbar">`:

```html
<body>

  <div class="bg-fx" aria-hidden="true">
    <!-- Capa 1: viñeta / resplandor ambiental -->
    <div class="bg-fx__vignette"></div>

    <!-- Capa 2: haces de energía diagonales -->
    <div class="bg-fx__beams"></div>

    <!-- Capa 3: skyline + Torre Stark, al pie, difuminado -->
    <svg class="bg-fx__skyline" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice" focusable="false">
      <!-- Fila trasera: edificios lejanos (más transparentes, sugieren distancia) -->
      <g fill="#1a1e26" opacity=".45">
        <rect x="0"    y="270" width="90"  height="150"/>
        <rect x="105"  y="230" width="70"  height="190"/>
        <rect x="190"  y="300" width="110" height="120"/>
        <rect x="860"  y="290" width="100" height="130"/>
        <rect x="980"  y="250" width="80"  height="170"/>
        <rect x="1230" y="250" width="90"  height="170"/>
        <rect x="1330" y="290" width="120" height="130"/>
        <rect x="1460" y="240" width="80"  height="180"/>
        <rect x="1550" y="310" width="60"  height="110"/>
      </g>

      <!-- Fila delantera: edificios más cercanos (más opacos, más definidos) -->
      <g fill="#12151b" opacity=".75">
        <rect x="40"   y="320" width="60" height="100"/>
        <rect x="230"  y="260" width="85" height="160"/>
        <rect x="330"  y="330" width="55" height="90"/>
        <rect x="900"  y="330" width="70" height="90"/>
        <rect x="1040" y="270" width="90" height="150"/>
        <rect x="1140" y="340" width="65" height="80"/>
        <rect x="1420" y="300" width="80" height="120"/>
        <rect x="1520" y="345" width="60" height="75"/>
      </g>

      <!-- Torre Stark: la más alta, remate cónico y baliza superior -->
      <g>
        <rect x="740" y="70"  width="70" height="350" rx="3" fill="#20242e"/>
        <rect x="757" y="30"  width="36" height="45"  fill="#20242e"/>
        <rect x="770" y="8"   width="10" height="26"  fill="#2a2f3b"/>
        <circle cx="775" cy="8" r="4" fill="#d4a72c" opacity=".5"/>
        <rect x="752" y="130" width="56" height="2" fill="#3a4150" opacity=".4"/>
        <rect x="752" y="200" width="56" height="2" fill="#3a4150" opacity=".4"/>
        <rect x="752" y="270" width="56" height="2" fill="#3a4150" opacity=".4"/>
      </g>
    </svg>

    <!-- Capa 4: martillo de Thor, marca de agua geométrica de muy baja opacidad -->
    <svg class="bg-fx__emblem" viewBox="0 0 220 260" focusable="false">
      <defs>
        <linearGradient id="hammerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e5283f"/>
          <stop offset="100%" stop-color="#d4a72c"/>
        </linearGradient>
      </defs>
      <path d="M20 30 L200 30 L192 96 L28 96 Z" fill="url(#hammerGrad)"/>
      <rect x="20" y="30" width="180" height="14" fill="#ffffff" opacity=".08"/>
      <rect x="94" y="96" width="32" height="150" rx="6" fill="url(#hammerGrad)"/>
      <ellipse cx="110" cy="248" rx="22" ry="10" fill="none" stroke="url(#hammerGrad)" stroke-width="6"/>
    </svg>
  </div>

  <div class="topbar">
  ...
```

> Nota de ids: el gradiente `hammerGrad` es un `id` nuevo y no colisiona con `heroRingGrad` (ya usado en el SVG del hero) ni con `brandEmblemGrad` (logo, ver §3). Si en el futuro este bloque se duplicara en la misma página, renombrar el `id` del gradiente en cada copia (los `id` de SVG deben ser únicos por documento).

---

## 2. Capa de fondo global — CSS completo (comentado por capa)

```css
/* ============================================================
   CAPA DE FONDO GLOBAL — .bg-fx
   Fondo fijo (position:fixed), primer hijo de <body>, detrás de
   todo el contenido real (z-index negativo). 100% CSS + SVG inline,
   sin imágenes externas, sin JS de posicionamiento, coste de
   pintado mínimo (no repinta con el scroll).
   ============================================================ */

.bg-fx{
  position:fixed;
  inset:0;
  z-index:-1;
  overflow:hidden;
  pointer-events:none;   /* puramente decorativo, nunca intercepta clics/touch */
  isolation:isolate;     /* aísla el mix-blend-mode de la capa 2 para que no
                            "sangre" hacia stacking contexts fuera de .bg-fx */
  background:var(--bg);  /* capa 0 · seguridad: mismo color que body,
                            nunca queda vacío aunque el resto falle */
}

/* ── Capa 1 · Viñeta y resplandor ambiental (profundidad) ──
   Dos glows muy tenues (rojo profundo arriba-centro, dorado profundo
   en la esquina inferior derecha) + una viñeta oscura hacia los bordes
   que refuerza el foco central. Nunca aclara más de un 16% de alfa;
   la viñeta oscura solo puede SUBIR el contraste del texto, no bajarlo. */
.bg-fx__vignette{
  position:absolute; inset:-10%;
  background:
    radial-gradient(60% 45% at 50% -8%,   rgba(122,18,32,.16), transparent 70%),
    radial-gradient(65% 50% at 105% 100%, rgba(138,107,30,.10), transparent 70%),
    radial-gradient(120% 90% at 50% 45%,  transparent 55%, rgba(0,0,0,.5) 100%);
}

/* ── Capa 2 · Haces de energía / láseres diagonales ──
   repeating-linear-gradient con líneas ultra finas (2px) muy espaciadas
   (cada 140-460px) y alfa muy bajo (.045-.05). mix-blend:screen para que
   sumen luz sobre la viñeta en vez de oscurecer. Única capa con
   movimiento: solo anima `transform` (compositor-only, sin repintado
   por frame), 50s de duración → deriva casi imperceptible. */
.bg-fx__beams{
  position:absolute; inset:-15% -25%;
  background-image:
    repeating-linear-gradient(112deg,
      transparent            0px,
      transparent            140px,
      rgba(229,40,63,.05)    140px,
      rgba(229,40,63,.05)    142px,
      transparent            142px,
      transparent            300px,
      rgba(212,167,44,.045)  300px,
      rgba(212,167,44,.045)  302px,
      transparent            302px,
      transparent            460px);
  mix-blend-mode:screen;
  animation:bgBeamsDrift 50s linear infinite;
  will-change:transform;
}
@keyframes bgBeamsDrift{
  from{ transform:translate3d(0,0,0); }
  to{   transform:translate3d(-120px,-70px,0); }
}

/* ── Capa 3 · Skyline con Torre Stark, al pie, difuminado ──
   El SVG (ver §1) ya trae su propia jerarquía de profundidad (fila
   trasera más transparente, fila delantera más opaca, torre central
   destacada). Aquí solo se posiciona, se difumina levemente y se
   atenúa en conjunto. */
.bg-fx__skyline{
  position:absolute; left:0; right:0; bottom:0;
  width:100%; height:min(40vh,420px); min-height:200px;
  filter:blur(1.5px);
  opacity:.55;
}

/* ── Capa 4 · Martillo de Thor, marca de agua geométrica ──
   Silueta facetada y minimalista (cabeza + mango + correa), NO
   ilustrativa/caricaturesca. 3.5% de opacidad, rotada y sangrando por
   la esquina superior derecha: es una textura de marca, no un icono
   que compita visualmente con el hero o el contenido. */
.bg-fx__emblem{
  position:absolute; top:-4%; right:-6%;
  width:min(30vw,320px); height:auto;
  opacity:.035;
  transform:rotate(18deg);
}

/* ── Responsive: menos capas y más discretas en móvil ──
   Prioriza legibilidad y batería/rendimiento en pantallas pequeñas,
   donde el ancho de viewport coincide con la columna de contenido
   (no hay "margen" donde diluir el efecto). */
@media (max-width:768px){
  .bg-fx__beams{   opacity:.5;  animation:none; }
  .bg-fx__emblem{  opacity:.02; width:min(45vw,220px); }
  .bg-fx__skyline{ height:min(26vh,260px); opacity:.4; }
}

/* ── Movimiento reducido: apaga la única animación existente ── */
@media (prefers-reduced-motion:reduce){
  .bg-fx__beams{ animation:none; }
}

/* ── Impresión: el fondo decorativo no debe imprimirse ── */
@media print{
  .bg-fx{ display:none; }
}
```

### 2.1 Por qué funciona sin tocar el resto del CSS existente

1. **Orden de pintado**: `.bg-fx` es hijo directo de `body` con `position:fixed; z-index:-1`. Como `body` no crea su propio *stacking context* posicionado, este elemento se pinta **encima** del `background-color` plano de `body`/`html` (el "canvas" del documento) pero **detrás** de cualquier contenido normal del flujo (`.topbar`, `.hero-cinematic`, `main`, `footer`), que se comportan como nivel `z-index:0` aunque no declaren la propiedad. Es el patrón estándar de "capa de fondo de página" — no requiere ningún cambio en los `z-index` ya existentes (`.topbar{z-index:11}`, `.tabs-bar{z-index:9}` siguen intactos y por encima).
2. **Convivencia con el hero**: `.hero-cinematic` ya pinta su propio fondo opaco en capas (degradado de `rgba(11,13,17,.12)` hasta `var(--bg)` sólido, más la foto de Los Vengadores) cubriendo el 100% de su caja. `.bg-fx` queda completamente tapado dentro del rectángulo del hero — no hay conflicto visual ni doble degradado compitiendo. El fondo global solo se "ve" en el espacio que hay antes, entre y después de las secciones (topbar, huecos del `.wrap`, márgenes entre `.item`/`.action-row`, pie de página).
3. **Convivencia con topbar/tabs**: ambas barras (`.topbar`, `.tabs-bar`) ya usan `background:rgba(11,13,17,.9x)` + `backdrop-filter:blur(10px)`. Antes, ese `blur` no tenía ningún efecto visible porque detrás solo había un color plano; ahora, al desplazarse la página, se verá un sutil "cristal esmerilado" con insinuaciones difuminadas de los haces/viñeta detrás — una mejora visual gratuita, sin tocar una sola línea de esas reglas.
4. **Nunca compite con el contenido**: todas las capas de color se mantienen ≤16% de alfa (excepto la propia viñeta oscura, que solo oscurece los bordes extremos, nunca aclara). Las tarjetas (`.item`, `.stat`, `.action-row`, `.card`) son opacas (`background:var(--surface)`) y quedan completamente intactas.

---

## 3. Logo del topbar — sustituir `.brand-mark`

### 3.1 HTML — reemplazo exacto

Actual (a sustituir por completo):
```html
<div class="brand"><div class="brand-mark">M</div>MCU Tracker</div>
```

Nuevo:
```html
<div class="brand">
  <span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="30" height="30" focusable="false">
      <defs>
        <linearGradient id="brandEmblemGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e5283f"/>
          <stop offset="100%" stop-color="#d4a72c"/>
        </linearGradient>
      </defs>
      <!-- Escudo hexagonal -->
      <path d="M16 1.4 L28.4 8.2 V21.8 L16 30.6 L3.6 21.8 V8.2 Z"
            fill="#20242e" stroke="url(#brandEmblemGrad)" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Chispa de energía (8 puntas) -->
      <path d="M16 8.2 L18.3 14.1 L24.2 16 L18.3 17.9 L16 23.8 L13.7 17.9 L7.8 16 L13.7 14.1 Z"
            fill="url(#brandEmblemGrad)"/>
    </svg>
  </span>
  <span class="brand-word"><b>MCU</b> Tracker</span>
</div>
```

`aria-hidden="true"` en el icono: el texto "MCU Tracker" que lo acompaña ya es el nombre accesible completo; el SVG es puramente decorativo desde el punto de vista de un lector de pantalla (mismo criterio que ya usan `.hero-badge__ring` y los iconos de `.check`/`.cta` en `DISENO-SPEC.md`).

### 3.2 CSS — reemplaza la regla `.brand-mark` actual

Actual (a sustituir):
```css
.brand-mark{
  width:26px;height:26px;border-radius:7px;background:var(--blue);
  display:grid;place-items:center;font-size:12px;color:#fff;
}
```

Nuevo:
```css
.brand-mark{
  width:30px; height:30px;
  display:grid; place-items:center;
  flex-shrink:0;
  filter:drop-shadow(0 0 5px rgba(229,40,63,.35));
}
.brand-mark svg{ display:block; }

.brand-word b{
  color:var(--marvel-gold);
  font-weight:800;
}
```

`.brand` no cambia (sigue `font-family:var(--font-display);font-weight:800;font-size:15px;display:flex;align-items:center;gap:10px;`).

### 3.3 Por qué NO se usa `background-clip:text` con el degradado en el texto

Se evaluó pintar "MCU" con `--brand-gradient` (rojo→dorado) recortado al texto (`background-clip:text`), pero a `font-size:15px` el texto queda por debajo del umbral de "texto grande" de WCAG (18.66px en negrita), y la porción roja del degradado (`--marvel-red` #e5283f) da **4.36:1** sobre `--bg` — insuficiente para el umbral de 4.5:1 de texto normal. Por eso "MCU" usa el color sólido `--marvel-gold` (**8.67:1**, verificado en `DISENO-SPEC.md` §1.2), manteniendo el mismo lenguaje cromático de marca sin arriesgar el contraste. El degradado sí se reserva para el icono (donde no aplican las reglas de contraste de texto).

---

## 4. Favicon — `<link>` listo para pegar en `<head>`

Insertar en cualquier punto de `<head>` (recomendado: justo debajo del `<meta name="description">` existente, antes de los `<link rel="preconnect">` de Google Fonts):

```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23e5283f'/%3E%3Cstop offset='100%25' stop-color='%23d4a72c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M16 1.4 L28.4 8.2 V21.8 L16 30.6 L3.6 21.8 V8.2 Z' fill='%230b0d11' stroke='url(%23g)' stroke-width='1.8'/%3E%3Cpath d='M16 8.2 L18.3 14.1 L24.2 16 L18.3 17.9 L16 23.8 L13.7 17.9 L7.8 16 L13.7 14.1 Z' fill='url(%23g)'/%3E%3C/svg%3E">
```

Notas:
- Es exactamente la misma geometría que el logo del topbar (§3), a escala de favicon: escudo hexagonal (fondo `#0b0d11`, trazo en gradiente) + chispa de energía de 8 puntas rellena en gradiente. Coherencia total marca↔pestaña.
- Codificación mínima necesaria dentro del `data:` URI: `<`→`%3C`, `>`→`%3E`, `#`→`%23` (tanto en los valores hex `#e5283f`/`#d4a72c`/`#0b0d11` como en las referencias internas `url(#g)`, porque un `#` sin codificar cortaría la URI en un identificador de fragmento) y `%`→`%25` (por los `0%`/`100%` de los `offset` del degradado). El resto de caracteres (comillas simples, espacios, `:`, `/`) se dejan literales — es la práctica estándar para favicons SVG inline y funciona en todos los navegadores modernos (Chrome, Firefox, Edge, Safari 16+).
- Cero peticiones de red adicionales, cero archivos `.ico`/`.svg` externos que puedan faltar o 404.
- Si en el futuro se quiere además un `apple-touch-icon` (iOS no soporta SVG en ese rol), se puede añadir un `<link rel="mask-icon" href="data:image/svg+xml,...un-solo-color..." color="#e5283f">` como mejora opcional no bloqueante; no es necesario para el alcance de este encargo.

---

## 5. Notas de rendimiento

- **Cero imágenes externas**: toda la capa de fondo y el logo son gradientes CSS + SVG inline. Nada puede romperse por una URL caída, y no hay peticiones de red adicionales (el favicon tampoco añade ninguna).
- **Un solo elemento fijo, sin recálculo por scroll**: `.bg-fx` es `position:fixed`, por lo que el navegador lo asigna a su propia capa de composición una sola vez; no se repinta ni se recalcula al hacer scroll (a diferencia de un efecto de *parallax* atado a `scroll`/`requestAnimationFrame`, que sí tendría coste continuo). Esto es deliberado: el fondo actúa como un "decorado fijo" de escenario, y el contenido se desplaza por encima — cinematográfico y gratuito en rendimiento.
- **La única animación anima solo `transform`**: `bgBeamsDrift` mueve `.bg-fx__beams` con `translate3d()`, nunca `background-position` ni ninguna propiedad que dispare *layout* o *repaint*. El navegador puede ejecutarla enteramente en el hilo compositor (GPU), con coste prácticamente nulo incluso en dispositivos modestos. Duración de 50s → deriva de ~2.4px/s, imperceptible como movimiento, perceptible solo como "vida" ambiental a muy largo plazo.
- **Blur controlado**: `filter:blur(1.5px)` se aplica sobre formas vectoriales simples (rectángulos), no sobre una fotografía — el coste de rasterizar ese blur una vez y componer es mínimo, muy por debajo de un `backdrop-filter` sobre contenido complejo.
- **Menos capas en móvil**: la media query `≤768px` apaga la animación, reduce opacidades y recorta la altura del skyline — menos píxeles que componer y una GPU menos exigida en los dispositivos donde más importa la batería.
- **`@media print`**: oculta `.bg-fx` por completo; no consume tinta ni ralentiza la generación del PDF/impresión.

## 6. Notas de accesibilidad y legibilidad

- **Decorativo y no interactivo**: `.bg-fx` lleva `aria-hidden="true"` y `pointer-events:none` — queda completamente fuera del árbol de accesibilidad y nunca intercepta clics/toques, sin importar su `z-index`. El icono del logo también lleva `aria-hidden="true"`, dejando que el texto "MCU Tracker" sea el único nombre accesible (ningún lector de pantalla anunciará el SVG duplicado).
- **`isolation:isolate` en `.bg-fx`**: evita que el `mix-blend-mode:screen` de la capa de haces "sangre" hacia elementos fuera del contenedor de fondo — el mezclado queda estrictamente contenido dentro de `.bg-fx`, sin ningún efecto sobre el texto o las tarjetas.
- **Contraste — regla general verificada**: ninguna capa de color supera el 16% de alfa (salvo la viñeta oscura, que solo *aumenta* contraste al oscurecer bordes, nunca lo reduce). El skyline usa los tonos `#12151b` / `#1a1e26` / `#20242e`, prácticamente idénticos a `--bg` (#0b0d11), `--surface` (#13161c) y `--surface-3` (#20242e) ya validados en `DISENO-SPEC.md` §1.2 como fondo seguro para `--text`, `--text-2` y `--muted`. Cualquier texto "suelto" que no esté dentro de una tarjeta (`.hint`, `.legend`, `.phase-head`, `footer`) y que llegue a coincidir visualmente con el skyline o la viñeta mantiene, en la práctica, el mismo rango de contraste ya verificado para esos colores de texto sobre superficies oscuras equivalentes — no se introduce ningún fondo más claro que pueda comprometer el 4.5:1 mínimo.
- **Las tarjetas no cambian**: `.item`, `.stat`, `.action-row` siguen siendo opacas (`background:var(--surface)`) — quedan 100% por encima de `.bg-fx` visualmente y no reciben ninguna alteración de contraste.
- **`prefers-reduced-motion`**: la única animación (`bgBeamsDrift`) se desactiva explícitamente bajo esta preferencia, además de quedar cubierta por la regla global ya existente en `DISENO-SPEC.md` §8.3 (`animation-duration:.001ms!important`) — doble seguro.
- **Objetivos táctiles**: no aplica — `.bg-fx` no es interactivo (`pointer-events:none`) y el logo no es un control (no es un `<button>`/`<a>`), es un elemento de marca estático idéntico en rol al `.brand-mark` anterior.

---

## 7. Checklist final de QA visual

- [ ] `.bg-fx` insertado como primer hijo de `<body>`, antes de `.topbar`.
- [ ] `.bg-fx{position:fixed;z-index:-1}` — verificar que queda detrás de topbar (z:11), tabs (z:9) y todo el contenido, y que NO se ve por encima del hero (el hero lo tapa por completo con su propio fondo).
- [ ] Los 4 SVG/divs de capas (`vignette`, `beams`, `skyline`, `emblem`) presentes y con las clases exactas.
- [ ] `.brand-mark` reemplazado (HTML + CSS) — ya no queda ninguna "M" en una caja de color plano.
- [ ] `.brand-word b` en `--marvel-gold`, NO en degradado recortado a texto (motivo: contraste, ver §3.3).
- [ ] `<link rel="icon" type="image/svg+xml" ...>` añadido en `<head>`; comprobar en pestaña del navegador que se ve el escudo+chispa (no un icono roto).
- [ ] `prefers-reduced-motion:reduce` detiene `bgBeamsDrift`.
- [ ] `≤768px`: beams sin animación y más tenues, emblem al 2%, skyline más bajo.
- [ ] `@media print`: `.bg-fx{display:none}`.
- [ ] Contraste de `.hint`, `.legend`, `.phase-head`, `footer` verificado visualmente sin regresión (deben verse exactamente igual de legibles que antes).
- [ ] Sin imágenes externas nuevas, sin peticiones de red nuevas (excepto ninguna — favicon y fondo son 100% inline).
- [ ] Sin rosa, sin amarillo puro en ningún valor añadido (todos los hex usados: `#e5283f`, `#ff4d5e`, `#7a1220`, `#d4a72c`, `#8a6b1e`, más los grises `#12151b`/`#1a1e26`/`#20242e`/`#2a2f3b`/`#3a4150`, ya coherentes con la paleta existente).
