
# DISEÑO-RATING-V2 · MCU Tracker (Marvel-Peliculas)
Rediseño completo del componente de nota (0–10) por título — sustituye la implementación v1 (`<select>` nativo) documentada en `../DISENO-UI-RATING.md §6` y ya construida hoy en `index.html` (CSS ~L.434-462, JS `buildItemRow()` ~L.1143-1174).

Este documento **no modifica `index.html`**. Es la especificación para el agente de frontend-vanilla. Se apoya en los tokens base ya existentes en `index.html` (`--surface`, `--surface-2`, `--surface-3`, `--border`, `--border-hover`, `--text`, `--text-2`, `--muted`, `--r-*`, `--shadow-*`, `--dur-*`, `--ease-smooth`, `--font-display`, `--font-body`) y añade únicamente los tokens de acento de la **nueva paleta Endgame** (lila/púrpura + azul + plata metálico), pensados para vivir en `css/tokens.css` (otro agente) con nombres semánticos `--accent-purple`, `--accent-blue`, `--metal-*`.

**Motivo del rediseño**: el cliente indicó que el `<select>` nativo "no le gusta nada". Causa raíz (ya advertida como limitación conocida en `DISENO-UI-RATING.md §6.4`): la lista emergente de un `<select>` nativo se pinta con el tema del sistema operativo, no con el del sitio — en la mayoría de navegadores es imposible de restylear al 100% vía CSS. La solución aquí es un **control 100% propio** (botón disparador + popover), con paridad total de teclado con un `<select>`, pero premium y consistente en cualquier navegador/SO.

Patrón de referencia aplicado (protocolo de auto-mejora): el patrón ARIA es el **"Collapsible Dropdown Listbox" (Select-Only Combobox)** del *W3C ARIA Authoring Practices Guide* (`w3c/aria-practices`, patrón "Listbox" — botón `aria-haspopup="listbox"` + `role="listbox"` con `aria-activedescendant`, sin foco individual por opción), que es el reemplazo custom-accesible estándar de un `<select>` nativo. La convención de nombres de tokens (`--categoria-variante`) sigue el mismo criterio ya citado en `DISENO-SPEC.md` (`nicholasgasior/css-variables-design-system`). El *timing* de la micro-animación de apertura reutiliza el mismo criterio "solo `transform`+`opacity`, nunca propiedades de layout" del catálogo `IanLunn/Hover` ya citado en `DISENO-SPEC.md`/`DISENO-UI-RATING.md`.

---

## 0. Resumen de la decisión

| Aspecto | Decisión |
|---|---|
| Concepto | **Disparador compacto** (botón: ★ + valor + chevron) que abre un **popover con rejilla de chips 0–10** (más una fila superior "Sin nota" de ancho completo). Sigue siendo un "desplegable" (se abre/cierra, elige con un toque), pero 100% propio — cero UI del sistema operativo. |
| Por qué rejilla y no lista vertical | 11 valores + "sin nota" en vertical serían 12 filas de scroll dentro de una lista ya larga (62 filas) — pésimo en una fila estrecha. En rejilla de 6 columnas × 2 filas, el popover mide ~113px de alto (desktop) / ~96px (móvil): **selección de un vistazo, sin scroll**. |
| Paleta | Nueva paleta Endgame: `--accent-purple` (lila/púrpura), `--accent-blue` (azul eléctrico), `--metal-*` (plata metálica, para el texto degradado de la nota puntuada). Sin rojo ni dorado Marvel (quedan reservados al resto del sitio hasta que se migre). |
| Semántica de color | Púrpura = *estado* (nota guardada, fondo del chip). Azul = *interacción* (foco de teclado, chevron al abrir). Plata = *neutral/cromado* (texto por defecto, bordes, degradado metálico del número). |
| Accesibilidad | Patrón ARIA "Collapsible Dropdown Listbox": `button[aria-haspopup="listbox"][aria-expanded]` + `div[role="listbox"][aria-activedescendant]` + `div[role="option"][aria-selected]`. Teclado: `↓/↑/Enter/Espacio` abren; dentro, `←→` mueve ±1, `↑↓` mueve ±6 (fila), `Home/End` extremos, `Enter/Espacio` confirma, `Escape`/clic-fuera cierra sin cambios. |
| Persistencia | **Sin cambios de contrato**: mismas funciones `loadRatings()`, `saveRatings()`, `setRating(t,val)` y misma clave `localStorage` `mcu_ratings_v1` ya existentes en `index.html`. Solo cambia la capa visual que las invoca. |
| Borrar nota | Chip "Sin nota" (fila superior) **o** volver a pulsar el número ya seleccionado (toggle-off) → ambos llaman a `setRating(t,'')`. |
| Compacidad | Disparador ≈ 59px de ancho (desktop) / ≈ 48px (móvil) — igual o más compacto que el chip `★+<select>` v1 (≈54-58px / ≈52-58px). El presupuesto de ancho de `.item` a 375px **mejora ligeramente** (ver §7). |

---

## 1. Tokens nuevos — paleta Endgame

Estos tokens los define **otro agente en `css/tokens.css`**. Aquí se documentan los nombres exactos que este componente consume, con **valores de fallback vía `var(--token, fallback)`** en todo el CSS de abajo — el componente funciona igual de bien si `css/tokens.css` todavía no existe, y adopta automáticamente los valores reales en cuanto se cargue.

Si `css/tokens.css` no existe todavía cuando se implemente este componente, añadir este bloque a `:root` (en `css/tokens.css` si ya lo crearon, si no, temporalmente en el `<style>` de `index.html`, sin duplicar nada de lo ya existente):

```css
:root{
  /* ── Acento Endgame — NUEVO (paleta lila/púrpura + azul + plata) ── */
  --accent-purple:        #8b5cf6;  /* estado: nota guardada — icono/borde/glow */
  --accent-purple-bright: #a78bfa;  /* hover / stop claro del degradado de texto */
  --accent-purple-deep:   #4c2f8c;  /* fondo sólido del chip seleccionado (con texto blanco) */
  --accent-blue:          #3aa8ff;  /* interacción: foco de teclado, chevron abierto */
  --accent-blue-bright:   #6cc4ff;  /* hover del foco/chevron */
  --accent-blue-deep:     #1e4d8f;  /* 2º stop del fondo sólido del chip seleccionado */
  --metal-100:            #eef1f6; /* plata clara — stop más claro del texto metálico */
  --metal-300:            #b9c1d1; /* plata media — texto/],icono neutro por defecto */
  --metal-500:             #7c8494; /* plata oscurecida — bordes del popover */
  --metal-700:            #454b58; /* gunmetal — sombra interior / divisores */

  --accent-gradient-text:  linear-gradient(180deg, var(--metal-100) 0%, var(--accent-purple-bright) 100%);
  --accent-gradient-solid: linear-gradient(135deg, var(--accent-purple-deep) 0%, var(--accent-blue-deep) 100%);
}
```

### 1.1 Verificación de contraste (WCAG 2.1 — luminancia relativa)

| Combinación | Uso | Ratio | Umbral | Resultado |
|---|---|---|---|---|
| `--accent-blue` (#3aa8ff) sobre `--surface-2` (#191d25) | anillo de `:focus-visible` del disparador (no-texto, SC 1.4.11) | **6.6:1** | 3:1 | ✅ pasa con amplio margen |
| `--accent-purple` (#8b5cf6) sobre `--surface-2`/`--surface-3` | icono ★ y borde del chip "con nota" (no-texto) | **~4.0:1** | 3:1 | ✅ pasa (uso decorativo/borde, no texto pequeño) |
| Degradado de texto `--accent-gradient-text` (stop más oscuro: `--accent-purple-bright` #a78bfa) sobre `--surface-2` | número puntuado en el disparador | **6.2:1** | 4.5:1 | ✅ pasa — **por eso el degradado de texto NUNCA usa `--accent-purple` puro como stop** (ese, en solitario, da solo 4.0:1 — insuficiente para texto pequeño en negrita) |
| Blanco sobre `--accent-gradient-solid` (peor stop: `--accent-purple-deep` #4c2f8c) | número dentro del chip seleccionado en la rejilla | **10.0:1** | 4.5:1 | ✅ pasa con amplio margen |
| `--text-2` (#bac2cf) sobre `--surface` (#13161c) | texto de las opciones no seleccionadas de la rejilla | **10.1:1** | 4.5:1 | ✅ pasa (ya verificado en el resto del sitio) |

Nota metodológica: el degradado de texto (`--accent-gradient-text`, decorativo, para el número visible en el disparador cuando ya hay nota) usa **plata → púrpura claro**, nunca el púrpura "vivo" (`--accent-purple`) como stop porque ese tono, evaluado en solitario sobre superficies oscuras, cae a 4.0:1 (insuficiente para texto <18.66px en negrita). El púrpura vivo se reserva para usos con umbral 3:1 (bordes, iconos, glows) o como **fondo sólido** con texto blanco encima (`--accent-gradient-solid`, que usa las variantes *deep*, ambas ≥10:1 con blanco).

---

## 2. Markup (estructura HTML que genera el JS)

Reemplaza el bloque `★ + <select>` actual dentro de `buildItemRow()`. Un ejemplo estático de referencia (con `n` = índice incremental por fila, ver §4.1 sobre por qué un contador y no un slug del título):

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

  <!-- NUEVO — componente de nota v2 (disparador + popover) -->
  <div class="rating" data-rating="" data-key="Los Vengadores">

    <button type="button"
            class="rating__trigger"
            id="rating-trigger-7"
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls="rating-listbox-7"
            aria-label="Nota para «Los Vengadores»: sin nota. Abrir selector de 0 a 10.">
      <svg class="rating__star" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" focusable="false">
        <path d="M12 2.6 14.9 8.9 21.8 9.7 16.6 14.4 18.1 21.2 12 17.6 5.9 21.2 7.4 14.4 2.2 9.7 9.1 8.9Z"
              fill="currentColor"/>
      </svg>
      <span class="rating__value">–</span>
      <svg class="rating__chevron" viewBox="0 0 24 24" width="9" height="9" aria-hidden="true" focusable="false">
        <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor"
                  stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="rating__popover"
         role="listbox"
         id="rating-listbox-7"
         tabindex="-1"
         aria-label="Nota para «Los Vengadores», de 0 a 10"
         aria-activedescendant=""
         hidden>
      <div class="rating__grid">
        <div class="rating__option rating__option--clear" role="option"
             id="rating-opt-7-clear" data-value="" aria-selected="true">
          <span aria-hidden="true">–</span> Sin nota
        </div>
        <div class="rating__option" role="option" id="rating-opt-7-0"  data-value="0"  aria-selected="false">0</div>
        <div class="rating__option" role="option" id="rating-opt-7-1"  data-value="1"  aria-selected="false">1</div>
        <div class="rating__option" role="option" id="rating-opt-7-2"  data-value="2"  aria-selected="false">2</div>
        <div class="rating__option" role="option" id="rating-opt-7-3"  data-value="3"  aria-selected="false">3</div>
        <div class="rating__option" role="option" id="rating-opt-7-4"  data-value="4"  aria-selected="false">4</div>
        <div class="rating__option" role="option" id="rating-opt-7-5"  data-value="5"  aria-selected="false">5</div>
        <div class="rating__option" role="option" id="rating-opt-7-6"  data-value="6"  aria-selected="false">6</div>
        <div class="rating__option" role="option" id="rating-opt-7-7"  data-value="7"  aria-selected="false">7</div>
        <div class="rating__option" role="option" id="rating-opt-7-8"  data-value="8"  aria-selected="false">8</div>
        <div class="rating__option" role="option" id="rating-opt-7-9"  data-value="9"  aria-selected="false">9</div>
        <div class="rating__option" role="option" id="rating-opt-7-10" data-value="10" aria-selected="false">10</div>
      </div>
    </div>
  </div>
</div>
```

Notas de estructura:
- `.rating` sigue siendo el **último hijo** de `.item` (mismo orden que v1: `poster → meta → tag → rating`) — `row.append(poster,meta,tag,ratingEl)` no cambia.
- `.rating__option--clear` ocupa **todo el ancho de la rejilla** (`grid-column:1/-1`) y va primero — es la fila "Sin nota", separada visualmente de los números por un pequeño margen (§3).
- Los 11 números (0–10) más la opción "Sin nota" = **12 opciones**, `role="option"` cada una, exactamente una con `aria-selected="true"` en todo momento (igual que un `<select>` nativo siempre tiene una opción "seleccionada").
- El disparador **es el único elemento realmente tabulable** del control (`role="listbox"` no recibe `Tab`, solo foco programático vía `.focus()` cuando se abre — patrón "Collapsible Dropdown Listbox" del WAI-ARIA APG). Esto da paridad exacta con un `<select>` nativo: un solo parón de tabulación por fila.
- `aria-label` del botón se regenera en cada cambio de valor (ver §4.4) — el texto visible corto ("–" / "8") no basta por sí solo para un lector de pantalla sin el contexto del título y del rango 0–10.

---

## 3. CSS completo (listo para pegar)

```css
/* ================================================
   RATING V2 — disparador + popover (rejilla 0–10)
   Paleta Endgame: --accent-purple / --accent-blue / --metal-*
   Sustituye por completo el bloque ".rating"/".rating__select" v1
   ================================================ */

.rating{
  position:relative; /* ancla del popover */
  display:inline-flex; flex-shrink:0;
}

/* ── Disparador ── */
.rating__trigger{
  appearance:none; -webkit-appearance:none;
  font:inherit; font-family:var(--font-display);
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 8px;
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:var(--r-full);
  color:var(--metal-300, var(--muted));
  cursor:pointer;
  transition:border-color var(--dur-fast) var(--ease-smooth),
             background var(--dur-fast) var(--ease-smooth),
             box-shadow var(--dur-fast) var(--ease-smooth),
             color var(--dur-fast) var(--ease-smooth);
}
.rating__trigger:hover{ border-color:var(--border-hover); background:var(--surface-3); }

.rating__star{ flex-shrink:0; color:inherit; transition:color var(--dur-fast) var(--ease-smooth), filter var(--dur-fast) var(--ease-smooth); }
.rating__chevron{ flex-shrink:0; color:var(--muted); transition:transform var(--dur-normal) var(--ease-smooth), color var(--dur-fast) var(--ease-smooth); }
.rating__value{
  min-width:14px; text-align:center;
  font-weight:700; font-size:12px; line-height:1;
  color:inherit;
}

/* ── Estado: disparador abierto ── */
.rating__trigger[aria-expanded="true"]{
  border-color:var(--accent-blue, #3aa8ff);
  background:var(--surface-3);
  box-shadow:0 0 0 3px rgba(58,168,255,.16);
}
.rating__trigger[aria-expanded="true"] .rating__chevron{ transform:rotate(180deg); color:var(--accent-blue, #3aa8ff); }

/* ── Estado: con nota (0–10 elegido) ── */
.rating[data-rating]:not([data-rating=""]) .rating__trigger{
  background:rgba(139,92,246,.10);
  border-color:rgba(139,92,246,.4);
}
.rating[data-rating]:not([data-rating=""]) .rating__star{
  color:var(--accent-purple, #8b5cf6);
  filter:drop-shadow(0 0 4px rgba(139,92,246,.5));
}
.rating[data-rating]:not([data-rating=""]) .rating__value{
  background:var(--accent-gradient-text, linear-gradient(180deg,#eef1f6,#a78bfa));
  -webkit-background-clip:text; background-clip:text; color:transparent;
  font-weight:800;
}
.rating[data-rating]:not([data-rating=""]) .rating__trigger:hover{ border-color:rgba(139,92,246,.6); }

/* ── Estado: visto (.item.done) pero aún sin nota → invitación sutil a puntuar ── */
.item.done .rating[data-rating=""] .rating__trigger{
  border-color:rgba(58,168,255,.4);
  box-shadow:0 0 0 1px rgba(58,168,255,.15);
}
/* Nota: igual que en v1, el chip de nota NO hereda el opacity/grayscale de .item.done
   — la nota importa más, no menos, una vez el título ya está marcado como visto. */

/* ── Foco de teclado (propio de este componente — no se hereda el global) ── */
.rating__trigger:focus-visible{
  outline:2px solid var(--accent-blue, #3aa8ff);
  outline-offset:2px;
}
/* El foco "real" del DOM, mientras el popover está abierto, vive en .rating__popover
   (contenedor programáticamente enfocado). Su indicador visual equivalente es el
   anillo de .is-active sobre la opción resaltada (ver abajo) — por eso aquí se
   suprime el outline por defecto del navegador sobre el propio popover: */
.rating__popover:focus{ outline:none; }

/* ── Popover ── */
.rating__popover{
  position:absolute; z-index:30;
  right:0; top:calc(100% + 8px);
  width:max-content; max-width:calc(100vw - 16px);
  padding:8px;
  background:linear-gradient(160deg, var(--surface-3) 0%, var(--surface-2) 100%);
  border:1px solid var(--metal-500, #7c8494);
  border-radius:var(--r-lg);
  box-shadow:var(--shadow-lg), 0 0 0 1px rgba(139,92,246,.15), inset 0 1px 0 rgba(255,255,255,.06);
  transform-origin:top right;
  opacity:0; transform:scale(.94) translateY(-4px);
  transition:opacity var(--dur-fast) var(--ease-smooth), transform var(--dur-fast) var(--ease-smooth);
}
.rating__popover.is-open{ opacity:1; transform:scale(1) translateY(0); }
.rating__popover[hidden]{ display:none; } /* refuerzo explícito del atributo hidden */

/* Variante "hacia arriba" — se aplica en JS cuando no cabe debajo (ver §4.2) */
.rating__popover--up{ top:auto; bottom:calc(100% + 8px); transform-origin:bottom right; }
.rating__popover--up{ transform:scale(.94) translateY(4px); }
.rating__popover--up.is-open{ transform:scale(1) translateY(0); }

.rating__grid{
  display:grid; grid-template-columns:repeat(6, 1fr); gap:4px;
}

/* ── Opción "Sin nota" — fila superior de ancho completo ── */
.rating__option--clear{
  grid-column:1 / -1;
  display:flex; align-items:center; justify-content:center; gap:6px;
  height:26px; margin-bottom:5px; padding-bottom:5px;
  border-bottom:1px solid var(--metal-700, #454b58);
  font-family:var(--font-body); font-size:11.5px; font-weight:600;
  color:var(--metal-300, var(--muted));
}

/* ── Opciones numéricas 0–10 ── */
.rating__option{
  display:flex; align-items:center; justify-content:center;
  width:26px; height:26px;
  border-radius:var(--r-md);
  font-family:var(--font-display); font-weight:700; font-size:12px;
  color:var(--text-2);
  cursor:pointer; user-select:none;
  transition:background var(--dur-fast) var(--ease-smooth),
             color var(--dur-fast) var(--ease-smooth),
             box-shadow var(--dur-fast) var(--ease-smooth),
             transform var(--dur-fast) var(--ease-smooth);
}
.rating__option:hover{ background:var(--surface); color:var(--text); }
.rating__option--clear:hover{ background:var(--surface); color:var(--text); border-radius:var(--r-md); }
.rating__option:active{ transform:scale(.92); }

/* Opción actualmente GUARDADA (aria-selected=true) — fondo sólido, texto blanco, contraste ≥10:1 (ver §1.1) */
.rating__option[aria-selected="true"]{
  background:var(--accent-gradient-solid, linear-gradient(135deg,#4c2f8c,#1e4d8f));
  color:#fff;
  box-shadow:0 2px 10px rgba(139,92,246,.4);
}
.rating__option--clear[aria-selected="true"]{
  background:none; color:var(--text); border-bottom-color:var(--accent-purple, #8b5cf6);
}

/* Opción actualmente RESALTADA por teclado/hover (independiente de si está guardada) */
.rating__option.is-active{
  box-shadow:0 0 0 2px var(--accent-blue, #3aa8ff), inset 0 0 0 1px rgba(255,255,255,.15);
}
.rating__option[aria-selected="true"].is-active{
  box-shadow:0 0 0 2px var(--accent-blue, #3aa8ff), 0 2px 10px rgba(139,92,246,.4);
}

/* ── Elevar el z-index de la fila con el popover abierto por encima de sus vecinas ──
   (.item:hover ya crea su propio contexto de apilamiento vía `transform`; sin esto,
   una fila vecina en :hover podría quedar por encima del popover abierto).
   Degradación aceptada: en un navegador sin soporte de :has(), el único efecto
   visual perdido es ese solape puntual entre dos filas adyacentes con hover
   simultáneo — coherencia funcional del propio control no se ve afectada. */
.item:has(.rating__popover:not([hidden])){ position:relative; z-index:5; }
```

### 3.1 Responsive (≤560px)

```css
@media (max-width:560px){
  .rating__trigger{ padding:3px 6px; gap:4px; }
  .rating__star{ width:9px; height:9px; }
  .rating__chevron{ width:7px; height:7px; }
  .rating__value{ font-size:11px; min-width:12px; }

  .rating__popover{ padding:7px; }
  .rating__grid{ gap:3px; }
  .rating__option{ width:24px; height:24px; font-size:11px; }
  .rating__option--clear{ height:24px; font-size:11px; }
}
```

24×24px sigue cumpliendo el mínimo AA de WCAG 2.5.8 (objetivos táctiles, 24×24px CSS). No se usa aquí el truco de `::before{inset:-Npx}` que sí usa `.check` (ampliar el área táctil invisible): con 12 celdas empaquetadas en una rejilla de solo 3-4px de separación, ampliar el área de toque de cada una solaparía con la de sus vecinas, generando una zona ambigua de varios píxeles donde no está claro qué celda recibe el toque — a diferencia de `.check`, que es un círculo aislado con espacio de sobra alrededor. Se prioriza la precisión de toque entre celdas adyacentes sobre ganar 2-3px de área táctil individual.

---

## 4. Comportamiento / interacción — contrato para el frontend

### 4.1 Construcción (`buildRatingControl(it)`, sustituye el bloque `★+<select>` dentro de `buildItemRow()`)

```js
/* Iconos como constantes reutilizables, mismo patrón que la constante TICK ya
   existente en index.html (check.innerHTML = TICK) */
const STAR_ICON = '<path d="M12 2.6 14.9 8.9 21.8 9.7 16.6 14.4 18.1 21.2 12 17.6 5.9 21.2 7.4 14.4 2.2 9.7 9.1 8.9Z" fill="currentColor"/>';
const CHEVRON_ICON = '<polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

let ratingSeq = 0;          // contador incremental → IDs únicos (rating-trigger-N, rating-listbox-N, rating-opt-N-*)
let activeRatingCtx = null; // única instancia de popover abierta a la vez (singleton)

function buildRatingControl(it){
  const seq = ratingSeq++;
  const currentValue = ratings[it.t] != null ? String(ratings[it.t]) : '';

  const wrapperEl = document.createElement('div');
  wrapperEl.className = 'rating';
  wrapperEl.dataset.rating = currentValue;
  wrapperEl.dataset.key = it.t;

  const triggerEl = document.createElement('button');
  triggerEl.type = 'button';
  triggerEl.className = 'rating__trigger';
  triggerEl.id = `rating-trigger-${seq}`;
  triggerEl.setAttribute('aria-haspopup','listbox');
  triggerEl.setAttribute('aria-expanded','false');
  triggerEl.setAttribute('aria-controls', `rating-listbox-${seq}`);

  const starEl = document.createElementNS('http://www.w3.org/2000/svg','svg');
  // (o, más simple y consistente con el resto del archivo: crear un <span> contenedor
  //  y asignar innerHTML = `<svg class="rating__star" viewBox="0 0 24 24" width="11" height="11"
  //  aria-hidden="true" focusable="false">${STAR_ICON}</svg>` — evita la verbosidad del namespace SVG.)

  const valueEl = document.createElement('span');
  valueEl.className = 'rating__value';
  valueEl.textContent = currentValue === '' ? '–' : currentValue;

  // ... ensamblar triggerEl.append(starWrap, valueEl, chevronWrap)

  const popoverEl = document.createElement('div');
  popoverEl.className = 'rating__popover';
  popoverEl.setAttribute('role','listbox');
  popoverEl.id = `rating-listbox-${seq}`;
  popoverEl.tabIndex = -1;
  popoverEl.setAttribute('aria-label', `Nota para «${it.t}», de 0 a 10`);
  popoverEl.setAttribute('aria-activedescendant','');
  popoverEl.hidden = true;

  const gridEl = document.createElement('div');
  gridEl.className = 'rating__grid';

  // opción "Sin nota" (índice 0) + 11 opciones numéricas (índices 1..11 → valores '0'..'10')
  const optionEls = [];
  const clearEl = document.createElement('div');
  clearEl.className = 'rating__option rating__option--clear';
  clearEl.setAttribute('role','option');
  clearEl.id = `rating-opt-${seq}-clear`;
  clearEl.dataset.value = '';
  clearEl.innerHTML = '<span aria-hidden="true">–</span> Sin nota';
  gridEl.appendChild(clearEl); optionEls.push(clearEl);

  for(let n=0;n<=10;n++){
    const optEl = document.createElement('div');
    optEl.className = 'rating__option';
    optEl.setAttribute('role','option');
    optEl.id = `rating-opt-${seq}-${n}`;
    optEl.dataset.value = String(n);
    optEl.textContent = String(n);
    gridEl.appendChild(optEl); optionEls.push(optEl);
  }
  optionEls.forEach(o => o.setAttribute('aria-selected', String(o.dataset.value === currentValue)));

  popoverEl.appendChild(gridEl);
  wrapperEl.append(triggerEl, popoverEl);

  const ctx = { it, seq, wrapperEl, triggerEl, valueEl, popoverEl, optionEls, currentValue, activeIndex:0, onOutside:null };
  triggerEl.setAttribute('aria-label', triggerAriaLabel(it.t, currentValue));
  wireRatingEvents(ctx);           // ver §4.2-4.3
  return wrapperEl;
}
```

En `buildItemRow()`, la línea `row.append(poster,meta,tag,ratingEl)` pasa a `row.append(poster,meta,tag, buildRatingControl(it))` — cambio de una sola línea, igual que en v1.

### 4.2 Apertura / cierre

```js
function triggerAriaLabel(title, val){
  return `Nota para «${title}»: ${val===''?'sin nota':val+' sobre 10'}. Abrir selector de 0 a 10.`;
}

function currentSelectedIndex(ctx){
  const i = ctx.optionEls.findIndex(o => o.dataset.value === ctx.currentValue);
  return i === -1 ? 0 : i;
}

function setActiveOption(ctx, idx){
  idx = Math.max(0, Math.min(ctx.optionEls.length - 1, idx)); // clamp, sin wrap — coherente con una rejilla 2D
  ctx.activeIndex = idx;
  ctx.optionEls.forEach((o,i) => o.classList.toggle('is-active', i === idx));
  ctx.popoverEl.setAttribute('aria-activedescendant', ctx.optionEls[idx].id);
}

function openPopover(ctx){
  if(activeRatingCtx && activeRatingCtx !== ctx) closePopover(activeRatingCtx, {restoreFocus:false});

  ctx.popoverEl.classList.remove('rating__popover--up'); // reset antes de medir
  ctx.popoverEl.hidden = false;

  const trigRect = ctx.triggerEl.getBoundingClientRect();
  const popRect  = ctx.popoverEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - trigRect.bottom;
  if(spaceBelow < popRect.height + 12){
    ctx.popoverEl.classList.add('rating__popover--up'); // no cabe debajo → abre hacia arriba
  }

  ctx.triggerEl.setAttribute('aria-expanded','true');
  setActiveOption(ctx, currentSelectedIndex(ctx));
  requestAnimationFrame(() => ctx.popoverEl.classList.add('is-open'));
  ctx.popoverEl.focus({preventScroll:true});

  ctx.onOutside = (e) => { if(!ctx.wrapperEl.contains(e.target)) closePopover(ctx, {restoreFocus:false}); };
  document.addEventListener('pointerdown', ctx.onOutside);
  activeRatingCtx = ctx;
}

function closePopover(ctx, {restoreFocus = true} = {}){
  ctx.popoverEl.classList.remove('is-open');
  ctx.popoverEl.hidden = true;
  ctx.triggerEl.setAttribute('aria-expanded','false');
  if(ctx.onOutside){ document.removeEventListener('pointerdown', ctx.onOutside); ctx.onOutside = null; }
  if(activeRatingCtx === ctx) activeRatingCtx = null;
  if(restoreFocus) ctx.triggerEl.focus();
}
```

Por qué **no** hace falta reposicionar en `scroll`: el popover es `position:absolute` respecto a `.rating` (ancestro en flujo normal del documento), así que se desplaza junto con toda la fila al hacer scroll de la página — nunca necesita recalcular su posición salvo en la apertura inicial (decisión arriba/abajo). Esto es una simplificación deliberada frente a un popover con `position:fixed`/portal a `<body>` (que sí requeriría recalcular en cada `scroll`/`resize`); no hace falta, aquí no hay ningún contenedor con scroll interno propio entre `.item` y `.body` (verificado: no hay `overflow:hidden`/`overflow:auto` en `.grid`, `.phase`, `.tab-panel` ni `.wrap`).

### 4.3 Selección — commit, toggle-off, teclado, ratón

```js
function commitOption(ctx, idx){
  const optEl  = ctx.optionEls[idx];
  const rawVal = optEl.dataset.value;                              // '' o '0'..'10'
  const newVal = (rawVal === ctx.currentValue && rawVal !== '') ? '' : rawVal; // reelegir el mismo número = borrar (toggle-off)

  setRating(ctx.it.t, newVal);           // función YA EXISTENTE en index.html — sin cambios de firma
  ctx.currentValue = newVal;
  ctx.wrapperEl.dataset.rating = newVal;
  ctx.optionEls.forEach(o => o.setAttribute('aria-selected', String(o.dataset.value === newVal)));
  ctx.valueEl.textContent = newVal === '' ? '–' : newVal;
  ctx.triggerEl.setAttribute('aria-label', triggerAriaLabel(ctx.it.t, newVal));

  closePopover(ctx, {restoreFocus:true});
}

function wireRatingEvents(ctx){
  ctx.wrapperEl.addEventListener('click', e => e.stopPropagation()); // defensivo, mismo criterio que v1

  ctx.triggerEl.addEventListener('click', () => {
    ctx.popoverEl.hidden ? openPopover(ctx) : closePopover(ctx, {restoreFocus:false});
  });
  ctx.triggerEl.addEventListener('keydown', e => {
    if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key) && ctx.popoverEl.hidden){
      e.preventDefault(); openPopover(ctx);
    }
  });

  ctx.optionEls.forEach((optEl, idx) => {
    optEl.addEventListener('pointerenter', () => setActiveOption(ctx, idx)); // preview visual, NO confirma
    optEl.addEventListener('click', () => commitOption(ctx, idx));           // un toque = confirma y cierra
  });

  const COLS = 6;
  ctx.popoverEl.addEventListener('keydown', e => {
    const last = ctx.optionEls.length - 1;
    switch(e.key){
      case 'ArrowRight': e.preventDefault(); setActiveOption(ctx, ctx.activeIndex + 1); break;
      case 'ArrowLeft':  e.preventDefault(); setActiveOption(ctx, ctx.activeIndex - 1); break;
      case 'ArrowDown':  e.preventDefault(); setActiveOption(ctx, ctx.activeIndex + COLS); break;
      case 'ArrowUp':    e.preventDefault(); setActiveOption(ctx, ctx.activeIndex - COLS); break;
      case 'Home':       e.preventDefault(); setActiveOption(ctx, 0); break;
      case 'End':        e.preventDefault(); setActiveOption(ctx, last); break;
      case 'Enter':
      case ' ':          e.preventDefault(); commitOption(ctx, ctx.activeIndex); break;
      case 'Escape':     e.preventDefault(); closePopover(ctx, {restoreFocus:true}); break;
      case 'Tab':        closePopover(ctx, {restoreFocus:false}); break; // sin preventDefault: el tab sigue su curso normal
    }
  });
}
```

Notas de comportamiento:
- **Borrar nota** (requisito del cliente): dos caminos, ambos llaman a `setRating(it.t,'')` → (a) elegir explícitamente el chip "Sin nota"; (b) volver a pulsar/confirmar el número que ya estaba guardado (toggle-off). Ambos casos están cubiertos por la misma función `commitOption`.
- **Flechas mueven, Enter/Espacio confirman** (tal y como pide el encargo): mover el resaltado con flechas **no** guarda nada todavía — solo cambia `aria-activedescendant` + la clase visual `.is-active`. Solo `commitOption()` (clic, o `Enter`/`Espacio` sobre la opción resaltada) persiste el valor. Esto evita guardar una nota por error solo por navegar con las flechas y cerrar sin querer.
- **Clic** sobre cualquier chip confirma inmediatamente (sin paso intermedio) — cumple "seleccionables con un toque".
- **Un único popover abierto a la vez**: abrir uno cierra automáticamente cualquier otro que estuviera abierto (variable de módulo `activeRatingCtx`).
- El listener de "clic fuera" (`pointerdown` en `document`) se añade **solo mientras el popover está abierto** y se retira al cerrar — con 62 filas, evita tener 62 listeners globales permanentes; como máximo hay 1 activo en cualquier momento.
- Nada cambia en `loadRatings()` / `saveRatings()` / `setRating()` / la clave `mcu_ratings_v1` — el contrato de datos es idéntico a v1.

### 4.4 Mejora opcional (no bloqueante): typeahead numérico

Al estar el foco DOM en `.rating__popover`, se puede añadir un pequeño buffer de tecleo (reinicia tras ~500ms sin pulsar) que interprete los dígitos escritos como número objetivo (p. ej. escribir "1" luego "0" en menos de 500ms selecciona la opción "10"; escribir solo "8" selecciona "8" de inmediato) y llame a `setActiveOption` con el índice correspondiente — mismo comportamiento de "salto directo" que ya ofrece gratis un `<select>` nativo al teclear. No es obligatorio para el cumplimiento de accesibilidad (las flechas + Home/End ya cubren la navegación completa), pero cierra la paridad funcional con el `<select>` que se sustituye.

---

## 5. Accesibilidad — resumen

- **Patrón ARIA**: "Collapsible Dropdown Listbox" (W3C ARIA Authoring Practices Guide, patrón Listbox) — `button[aria-haspopup="listbox"][aria-expanded]` controla `div[role="listbox"][aria-activedescendant]` con hijos `div[role="option"][aria-selected]`. Exactamente una opción tiene `aria-selected="true"` en todo momento (igual que un `<select>` nativo siempre tiene una opción seleccionada — aquí puede ser la opción "Sin nota").
- **Teclado completo**: `Tab` llega al disparador (único punto de parada por fila, igual que hoy). `↓ / ↑ / Enter / Espacio` con el disparador enfocado abren el popover. Dentro: `← →` mueven ±1, `↑ ↓` mueven ±6 (una fila de la rejilla), `Home`/`End` saltan a los extremos, `Enter`/`Espacio` confirman la opción resaltada y cierran, `Escape` cierra sin cambiar nada y devuelve el foco al disparador, `Tab` cierra sin cambios y dejar que el foco continúe su recorrido normal (no atrapa el foco dentro del popover).
- **Cierre al clic fuera**: `pointerdown` en `document` fuera de `.rating` cierra sin aplicar cambios (igual que `Escape`).
- **Foco visible**: el disparador tiene su propio `:focus-visible` en `--accent-blue` (2px, offset 2px — contraste 6.6:1 verificado en §1.1, ver también fallback de compatibilidad más abajo). Mientras el popover está abierto, el foco DOM real vive en el propio `.rating__popover` (sin contorno visible propio — `outline:none` deliberado) y su indicador visual equivalente es el anillo `.is-active` sobre la opción resaltada, que se mueve junto con `aria-activedescendant`; es el mismo patrón que usa cualquier combobox/listbox accesible bien construido (el foco del navegador y el "resaltado" visual no tienen por qué coincidir pixel a pixel, siempre que exista un indicador visible equivalente — aquí lo hay).
- **Nombre accesible dinámico**: el `aria-label` del disparador se regenera en cada cambio de nota (`"Nota para «Título»: 8 sobre 10. Abrir selector de 0 a 10."` / `"...: sin nota..."`) — necesario porque el contenido visible corto ("8"/"–") no da contexto suficiente fuera de la fila.
- **`prefers-reduced-motion`**: no se añade ninguna regla nueva — la regla global ya existente en `index.html` (~L.644, `*,*::before,*::after{ transition-duration:.001ms!important; ... }`) alcanza automáticamente las transiciones nuevas de `.rating__popover`/`.rating__chevron` por ser una regla universal por duración, no por selector (mismo criterio que documentó `DISENO-UI-RATING.md §7`).
- **Objetivos táctiles**: disparador ≈ 40×26px (menor que 44×44 AAA, igual límite ya aceptado por `.tag`/v1 en el resto del sitio); celdas de la rejilla 26×26px desktop / 24×24px móvil — **cumplen el mínimo AA 24×24px** de WCAG 2.5.8 sin necesidad de ampliar el área táctil invisible (ver razonamiento en §3.1: con celdas muy juntas, ampliar el hit-area de cada una generaría solapes ambiguos entre vecinas).
- **Compatibilidad `:has()`**: la regla que eleva el `z-index` de la fila con el popover abierto (§3, final) usa el selector `:has()`. Soportado por Chrome/Edge/Safari desde 2022-2023 y Firefox desde la 121 (dic-2023) — cobertura amplia a fecha de este documento. Si el navegador no lo soporta, la única degradación es puramente cosmética (un solape puntual si dos filas vecinas están en `:hover`+popover-abierto a la vez); el control sigue siendo 100% funcional.

---

## 6. Migración desde v1 — checklist para el agente de frontend

- [ ] Borrar de `index.html` el bloque CSS `.rating`, `.rating:hover`, `.rating__star`, `.rating__select`, `.rating__select option`, `.rating[data-rating]...`, `.item.done .rating[data-rating=""]` (líneas ~434-462) y sustituir por el CSS de §3 de este documento.
- [ ] En `buildItemRow()`, sustituir el bloque que crea `star`/`select`/listeners `change` (líneas ~1143-1174) por una llamada a `buildRatingControl(it)` (§4.1), manteniendo `row.append(poster,meta,tag, buildRatingControl(it))`.
- [ ] `loadRatings()`, `saveRatings()`, `setRating()`, `RATINGS_KEY = "mcu_ratings_v1"` — **no tocar**, ya son compatibles.
- [ ] Añadir a `:root` (en `css/tokens.css` si ya existe; si no, temporalmente en el `<style>` de `index.html`) el bloque de tokens del §1, sin duplicar los tokens de marca Marvel (`--marvel-*`) que siguen usándose en el resto del sitio hasta su propia migración.
- [ ] Verificar visualmente a 900px (desktop, ancho máx. de `.wrap`) y a 375px (peor caso móvil) que el popover no se corta en el borde derecho del viewport en la última fila de cada fase (comprobar también la fase final, más próxima al `footer`, para el flip-hacia-arriba).
- [ ] Confirmar que solo un popover permanece abierto a la vez al abrir varias filas seguidas sin cerrar la anterior.
- [ ] Confirmar navegación completa por teclado sin ratón: `Tab` hasta un disparador, `Enter` abre, flechas recorren la rejilla, `Enter` confirma, valor persiste tras recargar la página (localStorage).

---

## 7. Responsive — presupuesto de ancho a 375px (recalculado)

Mismo método que `DISENO-UI-RATING.md §6.6`. A 375px de viewport, `.item` con padding móvil deja ≈317px para sus 4 hijos flex. Con `--poster-w-sm:46px`, `.tag` "Especial" (el más largo, ≈60px), 3 gaps de 12px (36px) y el nuevo disparador compacto (§0: ≈48px en móvil, **igual o algo menor** que los ≈52-58px del chip v1):

```
317 − 46 (poster) − 60 (tag) − 48 (rating v2) − 36 (3 gaps) = 127px para .meta
```

Frente a los ≈115px que dejaba v1 — **+12px libres para el título** en el peor caso. `.title` sigue sin `white-space:nowrap`, así que un título muy largo simplemente ocupa una línea más de alto, nunca desborda horizontalmente.

| Componente | Desktop | ≤560px |
|---|---|---|
| `.rating__trigger` | `padding:4px 8px`, ★11px, valor 12px, chevron 9px (~59px ancho total) | `padding:3px 6px`, ★9px, valor 11px, chevron 7px (~48px ancho total) |
| `.rating__popover` | celdas 26×26px, `padding:8px` (~180-190px ancho, ~113px alto) | celdas 24×24px, `padding:7px` (~170-180px ancho, ~96px alto) |

---

## 8. Checklist final de QA visual

- [ ] Tokens `--accent-purple/-bright/-deep`, `--accent-blue/-bright/-deep`, `--metal-100/300/500/700`, `--accent-gradient-text/-solid` añadidos sin duplicar nombres ya existentes.
- [ ] Cero `<select>` nativo en el componente de nota; el disparador es un `<button>` propio, el popover es un `<div role="listbox">` propio.
- [ ] Exactamente una opción con `aria-selected="true"` en todo momento (incluida "Sin nota" cuando no hay valor).
- [ ] Estado "con nota": disparador con fondo lila tenue, ★ en púrpura con glow sutil, número en degradado metálico-lila (texto, `background-clip:text`).
- [ ] Estado "visto sin nota": anillo azul sutil de invitación en el disparador (nudge), sin afectar el opacity/grayscale que sí aplica `.item.done` al resto de la fila.
- [ ] `:focus-visible` visible en el disparador (anillo azul, 2px, offset 2px); anillo `.is-active` visible sobre la opción resaltada del popover mientras se navega con flechas.
- [ ] `Escape` y clic-fuera cierran sin persistir cambios; `Enter`/`Espacio`/clic sobre una opción sí persiste y cierra.
- [ ] Reelegir el número ya guardado lo borra (toggle-off); el chip "Sin nota" también lo borra.
- [ ] Un único popover abierto a la vez en toda la página.
- [ ] `localStorage['mcu_ratings_v1']` sigue guardando `{ "Título": number }` exactamente igual que antes — verificar en DevTools que el formato no cambió tras la migración.
- [ ] Responsive verificado a 900px, 560px y 375px sin overflow horizontal ni recorte del popover en ninguna fila (incluida la última fila de la última fase).
- [ ] Sin rosa, sin amarillo en ningún valor añadido — paleta limitada a lila/púrpura, azul y plata metálica.
