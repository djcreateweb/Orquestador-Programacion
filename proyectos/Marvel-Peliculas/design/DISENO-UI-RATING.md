
# DISEÑO-UI-RATING · MCU Tracker (Marvel-Peliculas)
Rediseño premium de los controles del Checklist (stats, toolbar, pista, tabs) + componente de nota 0–10 por título.

Este documento **no modifica `index.html`**. Es la especificación para el agente de frontend-vanilla. Se apoya en `DISENO-SPEC.md` (tokens base, paleta, tipografía, `.item`/`.tag`/`.poster` ya implementados) y lo **amplía**, no lo sustituye.

Patrón aplicado (protocolo de auto-mejora): el sistema de tokens de "superficie de cristal" (`--glass-*`) sigue la misma convención `--categoria-variante` de `nicholasgasior/css-variables-design-system` ya citada en `DISENO-SPEC.md`; el lift+sombra en `hover` de las tarjetas de stats reutiliza el catálogo de microinteracciones de `IanLunn/Hover`; el `<select>` de nota usa la técnica estándar `appearance:none` + chevron en `background-image` (SVG data-URI) — el mismo patrón que sistemas de componentes open-source (Primer CSS `.form-select`, Bootstrap `.form-select`) emplean para lograr un desplegable 100% nativo y accesible sin JS de terceros.

**Contexto clave — fondo texturizado**: otro agente añade un fondo oscuro texturizado (láseres/skyline/hammer) detrás de toda la página. `.stats`, `.toolbar` y `.hint` **no tienen hoy ningún panel de fondo propio** — flotan directamente sobre el `body`. Por tanto, en este documento se convierten en superficies de cristal (`--glass-bg`) semi-opacas con `backdrop-filter:blur`, verificadas en el **peor caso posible** (un píxel blanco puro de la textura debajo), igual que se hizo con el hero en `DISENO-SPEC.md §1.2`. `.item` (la tarjeta de título) queda **fuera de alcance** de este documento — su fondo (`var(--surface)`, opaco) no se toca; el chip de nota que se añade dentro usa un fondo propio opaco (`--surface-2`/`--surface-3`), por lo que su legibilidad **no depende** de si `.item` se vuelve translúcido en una pasada futura.

---

## 0. Resumen de decisiones

| Componente | Decisión |
|---|---|
| Stats (3 tarjetas) | Cristal oscuro (`--glass-bg`, 80% opacidad + blur) + barra de acento superior de color por métrica (verde/azul/dorado) + lift en hover. Tipografía de cifra sube a 28px. |
| Toolbar | Se funde leyenda + botón "Restablecer" en **una sola barra de cristal en píldora**, con separador vertical en desktop; en móvil se apila. |
| Pista (hint) | Pasa de texto suelto a **chip de cristal** con icono, evitando texto flotando directamente sobre la textura. |
| Tabs | Mismo esqueleto, cristal más opaco (88%, por ser `sticky`), hover con fondo sutil por pestaña, resto sin cambios de comportamiento. |
| Nota 0–10 | `<select>` nativo estilizado, sin escribir. Placeholder `"–"` (nunca `"0"`, para no confundir "sin puntuar" con "nota 0"). Estrella `★` decorativa junto al select; ambos se iluminan en dorado al puntuar. Chip situado como **último elemento** de `.item`, tras `.tag`. |
| Contraste | Verificado matemáticamente en el peor caso (bleed-through de un píxel blanco puro bajo el blur) para todos los textos nuevos sobre cristal — ver §1.2. |
| Accesibilidad | Se mantiene `:focus-visible` (`--marvel-red-bright`), `prefers-reduced-motion` existente; se añade fallback `@supports`/`prefers-reduced-transparency` para el cristal. |

---

## 1. Tokens nuevos (añadir al bloque `:root` existente — no reemplazar, solo agregar)

```css
:root{
  /* ── Superficies de cristal (NUEVO) ──
     Usadas por .stats, .toolbar, .hint, .tabs-bar: elementos que hoy
     flotan directamente sobre el body y pasarán a estar sobre la
     textura oscura del fondo. Base de color = --bg (más oscura que
     --surface), para poder usar menos opacidad y verse "más cristal"
     sin perder contraste incluso en el peor caso. */
  --glass-bg:            rgba(11,13,17,.80);   /* stats, toolbar, hint */
  --glass-bg-strong:     rgba(11,13,17,.88);   /* tabs-bar (sticky, más exigente) */
  --glass-border:        rgba(255,255,255,.08);
  --glass-border-strong: rgba(255,255,255,.16);
  --glass-blur:          blur(16px) saturate(150%);
  --glass-highlight:     inset 0 1px 0 rgba(255,255,255,.06);
}
```

### 1.2 Verificación de contraste (peor caso: píxel blanco puro `#fff` de la textura, difuminado bajo la superficie de cristal)

Mismo método que `DISENO-SPEC.md §1.2` (luminancia relativa WCAG 2.1), aplicado a los nuevos tokens de cristal:

| Superficie | Opacidad | Uso | Texto | Ratio (peor caso) | Umbral | Resultado |
|---|---|---|---|---|---|---|
| `--glass-bg` (base `--bg`) | .80 | `.stat`, `.toolbar`, `.hint` | `--text-2` (#bac2cf), texto pequeño | **6.0:1** | 4.5:1 | ✅ pasa con margen |
| `--glass-bg-strong` (base `--bg`) | .88 | `.tabs-bar` (sticky) | `--text-2`, texto pequeño (13.5px) | **8.0:1** | 4.5:1 | ✅ pasa con amplio margen |
| `--marvel-gold` sobre `--surface-2`/`--surface-3` (chip de nota, superficie opaca, no depende de la textura) | — | `.rating` puntuada | texto/estrella dorados | **7.5:1** | 4.5:1 | ✅ pasa |

Nota metodológica: a igual opacidad, partir de `--bg` (#0b0d11) en vez de `--surface` (#13161c) da ~2 puntos más de margen de contraste en el peor caso (el blend con blanco resulta más oscuro), por eso los tokens de cristal usan `--bg` como base aunque el resto del sistema use `--surface` para tarjetas opacas.

Referencia cruzada: si el nivel real de opacidad de la textura del otro agente resulta más clara de lo previsto, subir `--glass-bg`/`--glass-bg-strong` en pasos de `.04` (p. ej. `.84`/`.92`) mantiene el mismo patrón sin romper nada más.

### 1.3 Fallback sin `backdrop-filter` / transparencia reducida

```css
@supports not (backdrop-filter: blur(1px)){
  .stat, .toolbar, .hint, .tabs-bar{ background:var(--surface); }
}
@media (prefers-reduced-transparency: reduce){
  .stat, .toolbar, .hint, .tabs-bar{ background:var(--surface); backdrop-filter:none; -webkit-backdrop-filter:none; }
}
```

---

## 2. Tarjetas de STATS (Vistos / Pendientes / Total)

### 2.1 Markup (reemplaza el bloque actual, líneas ~493-497 de `index.html`)

Solo se añaden clases modificadoras (`stat--done/left/total`) a los `<div class="stat">` existentes. **IDs y clases internas (`val`, `g`, `b`, `lbl`) no cambian** — el JS que las referencia (`statDone`, `statLeft`, `statTotal`) sigue funcionando sin tocar el script.

```html
<div class="stats">
  <div class="stat stat--done">
    <div class="val g" id="statDone">0</div>
    <div class="lbl">Vistos</div>
  </div>
  <div class="stat stat--left">
    <div class="val b" id="statLeft">0</div>
    <div class="lbl">Pendientes</div>
  </div>
  <div class="stat stat--total">
    <div class="val" id="statTotal">0</div>
    <div class="lbl">Total</div>
  </div>
</div>
```

### 2.2 CSS (reemplaza `.stats`, `.stat`, `.stat .val*`, `.stat .lbl` actuales)

```css
.stats{
  display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
  margin:28px 0 14px;
}
.stat{
  position:relative; overflow:hidden;
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:var(--r-xl);
  padding:22px 14px 18px;
  text-align:center;
  backdrop-filter:var(--glass-blur);
  -webkit-backdrop-filter:var(--glass-blur);
  box-shadow:var(--shadow-md), var(--glass-highlight);
  transition:transform var(--dur-normal) var(--ease-smooth),
             border-color var(--dur-normal) var(--ease-smooth),
             box-shadow var(--dur-normal) var(--ease-smooth);
}
/* Barra de acento superior — mismo lenguaje visual que el indicador de tab activo */
.stat::before{
  content:""; position:absolute; top:0; left:16px; right:16px; height:3px;
  border-radius:0 0 var(--r-full) var(--r-full);
  background:var(--muted); opacity:.4;
}
.stat--done::before{ background:var(--done); opacity:1; box-shadow:0 0 12px rgba(16,185,129,.5); }
.stat--left::before{ background:var(--blue-hover); opacity:1; box-shadow:0 0 12px rgba(77,130,243,.45); }
.stat--total::before{ background:var(--brand-gradient); opacity:1; box-shadow:0 0 12px rgba(212,167,44,.4); }

.stat:hover{
  transform:translateY(-3px);
  border-color:var(--glass-border-strong);
  box-shadow:var(--shadow-lg), var(--glass-highlight);
}
.stat .val{
  font-family:var(--font-display); font-weight:800; font-size:28px;
  letter-spacing:-.6px; line-height:1.05;
}
.stat .val.g{ color:var(--done); }
.stat .val.b{ color:var(--blue-hover); } /* --blue-hover, no --blue: mejor contraste sobre cristal */
.stat .lbl{
  color:var(--text-2); font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:.09em; margin-top:6px;
}
```

Cambios de fondo respecto al original: `background:var(--surface)` → `var(--glass-bg)` + `backdrop-filter`; `.lbl` pasa de `var(--muted)` a `var(--text-2)` (el `--muted` actual, #6d7685, da solo **3.95:1** sobre superficies oscuras — no llega al 4.5:1 exigido para texto pequeño; se reserva `--muted` para textos grandes/decorativos). Cifra sube de 24px a 28px y gana mayúsculas+letter-spacing en el label para más jerarquía.

### 2.3 Responsive (≤560px, reemplaza el bloque actual dentro de `@media (max-width:560px)`)

```css
@media (max-width:560px){
  .stats{ gap:9px; }
  .stat{ padding:18px 10px 14px; border-radius:var(--r-lg); }
  .stat .val{ font-size:22px; }
  .stat .lbl{ font-size:10px; }
}
```

---

## 3. Toolbar (leyenda de tipos + "Restablecer progreso")

### 3.1 Markup (reemplaza el bloque actual, líneas ~499-505)

```html
<div class="toolbar">
  <div class="legend">
    <span class="legend__item"><i class="dot f" aria-hidden="true"></i>Película</span>
    <span class="legend__item"><i class="dot s" aria-hidden="true"></i>Serie</span>
    <span class="legend__item"><i class="dot e" aria-hidden="true"></i>Especial</span>
  </div>
  <span class="toolbar__divider" aria-hidden="true"></span>
  <button class="reset" id="resetBtn" type="button">
    <svg class="reset__icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>
    </svg>
    Restablecer progreso
  </button>
</div>
```

`id="resetBtn"` se mantiene intacto — el listener `document.getElementById('resetBtn').addEventListener('click', …)` (línea ~968 de `index.html`) sigue funcionando sin cambios; el SVG interno no se toca en JS.

### 3.2 CSS (reemplaza `.toolbar`, `.legend`, `.legend span`, `.dot`, `.reset`, `.reset:hover`)

```css
.toolbar{
  display:flex; align-items:center; justify-content:center; flex-wrap:wrap;
  gap:16px;
  margin:0 0 12px;
  padding:12px 22px;
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:var(--r-full);
  backdrop-filter:var(--glass-blur);
  -webkit-backdrop-filter:var(--glass-blur);
  box-shadow:var(--shadow-sm), var(--glass-highlight);
}
.legend{ display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
.legend__item{ display:inline-flex; align-items:center; gap:6px; color:var(--text-2); font-size:12px; font-weight:600; }
.dot{ width:9px; height:9px; border-radius:3px; flex-shrink:0; }
.dot.f{ background:var(--film);     box-shadow:0 0 6px rgba(59,130,246,.5); }
.dot.s{ background:var(--serie);    box-shadow:0 0 6px rgba(168,85,247,.5); }
.dot.e{ background:var(--especial); box-shadow:0 0 6px rgba(245,158,11,.5); }

.toolbar__divider{ width:1px; height:20px; background:var(--glass-border-strong); flex-shrink:0; }

.reset{
  display:inline-flex; align-items:center; gap:7px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--border-hover);
  color:var(--text-2);
  padding:8px 16px; border-radius:var(--r-full);
  cursor:pointer; font-size:12.5px; font-weight:600;
  font-family:var(--font-body);
  transition:border-color var(--dur-fast) var(--ease-smooth),
             color var(--dur-fast) var(--ease-smooth),
             background var(--dur-fast) var(--ease-smooth);
}
.reset:hover{
  border-color:var(--marvel-red-bright);
  color:var(--marvel-red-bright);
  background:rgba(229,40,63,.08);
}
.reset__icon{ flex-shrink:0; transition:transform var(--dur-slow) var(--ease-smooth); }
.reset:hover .reset__icon{ transform:rotate(-70deg); }
```

`--text-2` en `.legend__item` en vez del `--muted` original (12px, texto pequeño — mismo motivo de contraste que en §2.2).

### 3.3 Responsive (≤560px)

```css
@media (max-width:560px){
  .toolbar{ flex-direction:column; padding:14px 16px; border-radius:var(--r-xl); gap:12px; }
  .toolbar__divider{ display:none; }
  .reset{ width:100%; justify-content:center; }
}
```

---

## 4. Pista ("Pulsa el título para buscarlo en Google")

### 4.1 Markup (reemplaza el `<div class="hint">` actual, línea ~507)

```html
<div class="hint">
  <svg class="hint__icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>
  </svg>
  Pulsa el <b>título</b> para buscarlo en Google.
</div>
```

### 4.2 CSS (reemplaza `.hint`, `.hint b`)

```css
.hint{
  display:flex; align-items:center; gap:7px;
  width:fit-content; max-width:100%; margin:0 auto 4px;
  padding:7px 14px;
  color:var(--text-2); font-size:12px; font-weight:500;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  border-radius:var(--r-full);
  backdrop-filter:var(--glass-blur); -webkit-backdrop-filter:var(--glass-blur);
}
.hint b{ color:var(--text); font-weight:700; }
.hint__icon{ flex-shrink:0; color:var(--marvel-gold); opacity:.85; }
```

`display:flex` (bloque, no `inline-flex`) + `margin:0 auto` centra el chip horizontalmente sin necesitar un wrapper extra, igual que antes centraba el texto con `text-align:center`.

---

## 5. Barra de pestañas (Checklist / Resúmenes / Disney+)

El markup (§5 de `DISENO-SPEC.md`) **no cambia**. Solo estos valores de CSS:

```css
.tabs-bar{
  position:sticky; top:var(--topbar-h); z-index:9;
  background:var(--glass-bg-strong);          /* antes: rgba(11,13,17,.92) fijo */
  backdrop-filter:var(--glass-blur);
  -webkit-backdrop-filter:var(--glass-blur);
  border-bottom:1px solid var(--glass-border);
  box-shadow:var(--glass-highlight);
}
.tabs-inner{ display:flex; gap:2px; overflow-x:auto; scrollbar-width:none; }
.tabs-inner::-webkit-scrollbar{ display:none; }

.tab{
  position:relative;
  display:inline-flex; align-items:center; gap:8px;
  padding:14px 20px;
  font-family:var(--font-display); font-weight:700; font-size:13.5px; letter-spacing:.2px;
  color:var(--text-2); white-space:nowrap; cursor:pointer;
  background:none; border:none; border-radius:var(--r-sm) var(--r-sm) 0 0;
  transition:color var(--dur-fast) var(--ease-smooth), background var(--dur-fast) var(--ease-smooth);
}
.tab:hover{ color:var(--text); background:rgba(255,255,255,.04); }
.tab:focus-visible{ outline:2px solid var(--marvel-red-bright); outline-offset:-2px; }
.tab.active{ color:var(--text); }
.tab.active::after{
  content:""; position:absolute; left:16px; right:16px; bottom:-1px; height:2.5px;
  border-radius:var(--r-full); background:var(--brand-gradient);
  box-shadow:0 0 10px rgba(229,40,63,.55);
}
```

Cambios: `gap:4px→2px`, `padding:18px` horizontal (antes 18px, ahora 20px por respiro), `border-radius` en la pestaña para que el `:hover`/background tengan esquinas superiores redondeadas (efecto "segmented control" sutil), y el fondo del propio `.tabs-bar` pasa a los tokens de cristal `--glass-bg-strong` (88% de opacidad — el nivel más alto de los tres, por ser el único elemento `sticky` permanentemente visible mientras se hace scroll sobre la textura).

Responsive ≤560px: sin cambios respecto a `DISENO-SPEC.md §5.3` (`padding:12px 14px; font-size:12.5px`).

---

## 6. Componente de NOTA (0–10) por título

### 6.1 Decisiones de diseño

- **`<select>` nativo** (no custom-listbox con JS): 100% accesible por teclado/lector de pantalla desde el primer momento, sin necesidad de re-implementar navegación ARIA.
- Opción por defecto con texto **`"–"`** (guion, no `"0"`): evita el error clásico de confundir "sin puntuar" con "nota 0" (0 es una nota válida y distinta de "no puntuado").
- Acento visual: una **★ decorativa** (fuera del `<select>`, como `<span>` hermano) que se enciende en dorado (`--marvel-gold`) en cuanto hay nota, más el propio texto del `<select>` que cambia de `--text-2` a `--marvel-gold`. Esto cumple el pedido del cliente ("estrella ★ + número") sin depender de que cada navegador renderice igual el texto interno de un `<option>` en estado cerrado vs. abierto (limitación real de los `<select>` nativos que sí es consistente).
- El **chip de nota vive en superficie opaca propia** (`--surface-2`/`--surface-3`), independiente de si `.item` es opaco o se vuelve translúcido en el futuro — no requiere volver a verificar contraste si cambia el fondo de `.item`.
- Persistencia: **fuera de alcance de este documento** (la implementa el agente de frontend con una clave de `localStorage` nueva, independiente de `mcu_checklist_v3`). Se documenta solo el contrato de comportamiento visual en §6.7.

### 6.2 Colocación en la fila `.item`

Orden final de los hijos flex de `.item`: **`.poster` → `.meta` → `.tag` → `.rating`** (nuevo, último). Justificación:

1. `.meta` mantiene `flex:1; min-width:0` (ya existente) — absorbe el espacio sobrante; el título ya se envuelve en varias líneas si hace falta (no tiene `white-space:nowrap`), así que añadir un elemento más al final **no puede desbordar la fila**, solo puede hacer que el título ocupe una línea más en pantallas muy estrechas con títulos muy largos.
2. `.tag` (tipo) permanece pegado al título como hoy — es la lectura más importante tras el nombre.
3. `.rating` va al final, como una acción/dato del usuario, patrón habitual de "control de usuario al final de la fila" (coherente con cómo `.cta` cierra la fila en `.action-row`).
4. Cambio de código mínimo para el agente de frontend: `row.append(poster,meta,tag)` pasa a `row.append(poster,meta,tag,ratingEl)` — una sola línea.

### 6.3 Markup de referencia (dentro de `.item`, sustituye la línea `row.append(poster,meta,tag)` de `buildItemRow()`)

```html
<div class="item type-film" style="--type-tint:var(--film-tint); --type-border:var(--film)">
  <div class="poster" style="--poster-url:url('…')">
    <img src="…" alt="" loading="lazy">
    <div class="check" role="checkbox" aria-checked="false" tabindex="0" title="Marcar como vista">
      <svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>
    </div>
  </div>

  <div class="meta" title="Buscar en Google">
    <div class="title">Los Vengadores</div>
    <div class="date">Mayo 2012</div>
  </div>

  <span class="tag film">Película</span>

  <!-- NUEVO — componente de nota -->
  <div class="rating" data-rating="">
    <span class="rating__star" aria-hidden="true">★</span>
    <select class="rating__select" data-key="Los Vengadores"
            aria-label="Nota para «Los Vengadores», de 0 a 10">
      <option value="">–</option>
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
      <option value="9">9</option>
      <option value="10">10</option>
    </select>
  </div>
</div>
```

Notas de implementación:
- `data-key` identifica el título (mismo valor que ya se usa como clave del `Map itemRefs`, `it.t`) — permite al frontend guardar `{ [it.t]: valor }` en el nuevo `localStorage`, en paralelo al `state[it.t]` de "visto".
- No se marca ningún `<option selected>` en el HTML estático: el valor inicial lo asigna JS (`select.value = ratings[it.t] ?? ''`) tras leer el nuevo `localStorage`; si no hay nota guardada, el navegador muestra la primera opción (`"–"`) de forma nativa.
- El atributo `data-rating` del contenedor `.rating` (vacío por defecto) es el que el JS debe mantener sincronizado con `select.value` en cada `change` (`ratingEl.dataset.rating = select.value`) — es el hook que activa los estados visuales de §6.4.
- Recomendación defensiva (opcional, no obligatoria dado el árbol de eventos actual): añadir `select.addEventListener('click', e => e.stopPropagation())` por si en el futuro se añade un handler de click a nivel de `.item`; hoy no existe ninguno, así que no hay conflicto real con el `click` de `.meta` (abre Google) ni con `.check` (marca visto), al ser `.rating` un hermano fuera de ambos subárboles.

### 6.4 CSS del componente

```css
/* ── Chip de nota (0–10) ── */
.rating{
  display:inline-flex; align-items:center; gap:5px; flex-shrink:0;
  padding:4px 8px;
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:var(--r-full);
  transition:border-color var(--dur-fast) var(--ease-smooth),
             background var(--dur-fast) var(--ease-smooth),
             box-shadow var(--dur-fast) var(--ease-smooth);
}
.rating:hover{ border-color:var(--border-hover); background:var(--surface-3); }

.rating__star{
  font-size:11px; line-height:1; color:var(--muted);
  transition:color var(--dur-fast) var(--ease-smooth);
}

.rating__select{
  appearance:none; -webkit-appearance:none; -moz-appearance:none;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='9' height='9' fill='none' stroke='%236d7685' stroke-width='2.6'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right center / 9px 9px;
  border:none; outline:none; cursor:pointer;
  width:26px; padding:0 12px 0 0;
  font-family:var(--font-display); font-weight:700; font-size:12px; text-align:right;
  color:var(--text-2);
}
.rating__select option{ background:var(--surface-2); color:var(--text); font-weight:600; }

/* ── Estado: con nota (0–10 elegido) ── */
.rating[data-rating]:not([data-rating=""]){
  background:rgba(212,167,44,.08);
  border-color:rgba(212,167,44,.35);
}
.rating[data-rating]:not([data-rating=""]) .rating__star{ color:var(--marvel-gold); }
.rating[data-rating]:not([data-rating=""]) .rating__select{ color:var(--marvel-gold); }

/* ── Estado: visto (.item.done) pero aún sin nota → invitación sutil a puntuar ── */
.item.done .rating[data-rating=""]{
  border-color:rgba(212,167,44,.5);
  box-shadow:0 0 0 1px rgba(212,167,44,.15);
}
/* Nota: .rating NO hereda el opacity/grayscale que .item.done aplica a
   .poster/.title/.tag — es intencional: la nota es más relevante,
   no menos, justo cuando el título ya se marcó como visto. */
```

Foco de teclado: no se define ningún override de `outline` en `.rating__select` — hereda automáticamente la regla global `:focus-visible{outline:2px solid var(--marvel-red-bright);outline-offset:2px;border-radius:var(--r-xs)}` ya existente en `index.html` (línea 428), sin necesidad de tocarla ni duplicarla.

Limitación conocida y aceptada: la lista desplegable (el popup nativo que aparece al abrir el `<select>`) usa el tema del sistema operativo del usuario (a menudo claro) en la mayoría de navegadores — no es 100% estilizable vía CSS cross-browser. Es el trade-off consciente de elegir un `<select>` nativo (accesible, sin JS, sin escribir) frente a un listbox custom.

### 6.5 Estados — matriz visual

| Estado | Fondo/borde `.rating` | Color ★ + texto | Comentario |
|---|---|---|---|
| Sin nota, título no visto | `--surface-2` / `--border` | `--muted` | Estado por defecto |
| Sin nota, título **visto** | `--surface-2` / borde ámbar sutil | `--muted` | Nudge — invita a puntuar lo ya visto |
| **Con nota**, no visto | tinte dorado `rgba(212,167,44,.08)` / borde `rgba(212,167,44,.35)` | `--marvel-gold` | — |
| **Con nota**, visto | igual que la fila anterior | `--marvel-gold` | El estado "con nota" siempre prevalece sobre el nudge de "sin nota" |
| Hover | `--surface-3` / `--border-hover` | (color de estado se mantiene) | Aplica sobre cualquiera de los 4 estados anteriores |
| Foco de teclado | outline `--marvel-red-bright` 2px (regla global heredada) | — | Sin CSS adicional necesario |

### 6.6 Responsive (≤560px)

```css
@media (max-width:560px){
  .rating{ padding:3px 6px; gap:4px; }
  .rating__select{ width:20px; font-size:11px; padding-right:10px; background-size:8px 8px; }
  .rating__star{ font-size:10px; }
}
```

Presupuesto de ancho verificado a 375px de viewport (peor caso realista): `.wrap` deja ~335px de contenido; `.item` con padding móvil (`8px 10px 8px 8px`) deja ~317px para los hijos flex. Con `--poster-w-sm:46px`, `.tag` (~60px en el caso "Especial", el más largo) y `.rating` compacto (~54-58px) más 3 gaps de 12px (36px), quedan **~115px para `.meta`** (título + fecha). Es ajustado para los títulos más largos del dataset (p. ej. "Guardianes de la Galaxia: Especial Felices Fiestas"), pero **no rompe el layout**: `.title` ya envuelve en varias líneas de forma nativa (no tiene `white-space:nowrap` ni `text-overflow:ellipsis`), así que el único efecto es que la fila crece un poco de alto en esos casos concretos — nunca hay desbordamiento horizontal ni recorte de contenido. Si en QA visual en dispositivo real se ve demasiado apretado, alternativa de bajo riesgo (no incluida por defecto para no añadir complejidad): en `≤560px`, cambiar `.item` a `flex-wrap:wrap` y dar a `.rating` `flex-basis:100%; justify-content:flex-end; margin-top:6px` para que caiga a una segunda línea solo en móvil.

---

## 7. Accesibilidad — resumen de esta entrega

- Todo el texto nuevo usa `--text-2` o más claro en vez de `--muted` cuando el tamaño es <18px (§1.2/§2.2/§3.2 documentan por qué: `--muted` da 3.95:1 sobre fondos oscuros, insuficiente para texto normal AA).
- `:focus-visible` no se reimplementa: se hereda la regla global ya existente (`outline:2px solid var(--marvel-red-bright)`), válida para `.tab`, `.reset`, `.rating__select` y cualquier futuro control.
- `prefers-reduced-motion` ya existente en `index.html` (línea ~429) cubre automáticamente las nuevas transiciones (`.stat:hover`, `.reset__icon` rotate, `.rating` transitions) al ser reglas genéricas por duración, no por selector.
- Nuevo: fallback de cristal para `@supports not (backdrop-filter)` y `prefers-reduced-transparency` (§1.3).
- El `<select>` de nota es 100% navegable por teclado (Tab, flechas, Home/End, escritura de número para saltar a una opción — comportamiento nativo del SO, gratis).
- `aria-label` dinámico por fila en el `<select>` (`"Nota para «Título», de 0 a 10"`) — el texto visible corto ("–"/"8") no sería suficiente por sí solo para un lector de pantalla sin contexto del título.
- Objetivos táctiles: `.rating` con `padding:4px 8px` + contenido (★ 11px + select ~26px) da un área ≈ 38×26px; combinado con el `gap:14px`/`12px` respecto a `.tag` vecino, no genera solapes de toque. Es más pequeño que el mínimo de 44×44px recomendado por WCAG 2.5.8 en su nivel AAA, pero el propio `<select>` nativo expande su área de impacto real más allá de la caja visual en la mayoría de navegadores táctiles (comportamiento del SO, no controlable por CSS) — igual que ya ocurre con `.tag` en el diseño existente, que tampoco alcanza 44px y no ha sido objetivo de esta revisión.

---

## 8. Responsive — resumen por componente (añade a la tabla de `DISENO-SPEC.md §9`)

| Componente | Desktop | ≤560px |
|---|---|---|
| `.stat` | `padding:22px 14px 18px`, cifra 28px | `padding:18px 10px 14px`, cifra 22px |
| `.toolbar` | fila única, divisor visible | columna, sin divisor, botón 100% ancho |
| `.hint` | chip centrado, icono + texto | igual (ya compacto) |
| `.tabs-bar` | `padding:14px 20px` por tab | `padding:12px 14px` (sin cambios de `DISENO-SPEC.md`) |
| `.rating` | `padding:4px 8px`, select 26px | `padding:3px 6px`, select 20px |

---

## 9. Checklist final de QA visual

- [ ] Tokens `--glass-*` añadidos a `:root` sin duplicar los ya existentes.
- [ ] `.stats`, `.toolbar`, `.hint` usan `--glass-bg` + `backdrop-filter`; `.tabs-bar` usa `--glass-bg-strong`.
- [ ] Ningún texto nuevo usa `--muted` en tamaño <18px (usar `--text-2` o superior).
- [ ] Fallback `@supports`/`prefers-reduced-transparency` presente para los 4 elementos de cristal.
- [ ] `.rating` es el último hijo de `.item`, tras `.tag`; `row.append(poster,meta,tag,ratingEl)`.
- [ ] Placeholder de nota es `"–"`, nunca `"0"` ni vacío-sin-opción.
- [ ] Estado "con nota" tiñe ★ + select + fondo del chip en dorado; estado "visto sin nota" muestra el nudge ámbar sutil.
- [ ] `.rating` NO se ve afectado por `.item.done` (opacity/grayscale) — verificar visualmente que la nota se ve igual de nítida en filas marcadas como vistas.
- [ ] `:focus-visible` visible en `.rating__select`, `.reset`, `.tab` (heredado, sin CSS nuevo necesario).
- [ ] Responsive verificado a 560px y 375px: sin overflow horizontal en filas con títulos largos + nota + tag.
- [ ] Sin rosa, sin amarillo puro en ningún valor añadido (dorado `#d4a72c` ya verificado en `DISENO-SPEC.md`).
