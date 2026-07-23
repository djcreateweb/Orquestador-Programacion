
# DISEÑO-SPEC · MCU Tracker (Marvel-Peliculas)
Rediseño visual profesional — documento único para implementación en un solo pase.

Stack objetivo: **HTML5 + CSS3 puro + JS vanilla, single-file (`index.html`), sin build, solo Google Fonts** (Inter + Manrope, ya cargadas — no se añaden fuentes nuevas).

Este documento no modifica `index.html`. Es la especificación que debe implementar el agente de frontend-vanilla.

Referencias de patrón aplicadas (protocolo de auto-mejora): técnica de *layered background-image fallback* (capas de `background-image` que degradan con elegancia si una capa falla en cargar, sin depender de JS ni de `<img onerror>`) inspirada en el enfoque de sistemas de variables CSS de `nicholasgasior/css-variables-design-system`; microinteracciones de `hover`/lift tomadas del catálogo de patrones de `IanLunn/Hover` (transform + shadow, sin JS); estructura de tokens ampliada siguiendo la convención `--categoria-variante` del mismo repo de referencia.

---

## 0. Resumen de decisiones de diseño

| Aspecto | Decisión |
|---|---|
| Paleta base | Se mantiene el fondo cinematográfico oscuro (`#0b0d11`/`#13161c`) y toda la semántica de tipo existente (film=azul, serie=morado, especial=ámbar). |
| Acento nuevo | Rojo Marvel (`#e5283f` / `#ff4d5e`) + dorado (`#d4a72c`) combinados en `--brand-gradient`, usado como el "hilo conductor" del progreso (barra global, barra por fase, indicador de tab activo, anillo del hero). El azul (`--blue`) queda reservado para el tag "Película" y los enlaces, evitando que compita con el nuevo acento de marca. |
| Restricciones | Cero rosa, cero amarillo puro. El dorado (`#d4a72c`) y el ámbar existente (`#f59e0b`) son cálidos pero no amarillo puro (verificado — ver §1.2). |
| Tipografía | Sin cambios de familia: Manrope (display/headings) + Inter (cuerpo). Se añaden tokens de tamaño para el hero. |
| Hero | Full-bleed, imagen de Los Vengadores + gradiente oscuro en capas, texto siempre en la franja ≥86% de opacidad (contraste verificado incluso en el peor caso: píxel blanco de foto). Fallback 100% CSS, sin `<img>`, sin icono de imagen rota. |
| Tabs | 3 pestañas (Checklist / Resúmenes / Disney+) con indicador degradado rojo→dorado, patrón extensible documentado con ejemplo de 4ª pestaña. |
| Tarjeta de título | Póster 2:3 ("estirado" = proporción vertical real de cartel, **no** distorsión — se usa `object-fit:cover`), checkbox como badge circular superpuesto en la esquina del póster, barra de progreso por fase de 6px con degradado de marca. |
| CTAs de marca | YouTube y Disney+ con colores controlados y contraste AA verificado numéricamente (ver §7.3), estilo "ghost → fill" coherente con el resto del sistema. |

---

## 1. Fundamentos

### 1.1 Paleta completa (con roles)

```
Fondo/base           #0b0d11  --bg
Superficie           #13161c  --surface
Superficie 2         #191d25  --surface-2
Superficie 3 (nueva) #20242e  --surface-3   (glass/badges elevados)
Borde                #252b36  --border
Borde hover          #303845  --border-hover
Texto primario       #f3f5f9  --text
Texto secundario     #bac2cf  --text-2
Texto muted          #6d7685  --muted

Semántica de tipo (sin cambios):
Película  #3b82f6  --film
Serie     #a855f7  --serie
Especial  #f59e0b  --especial
Completado #10b981 --done

Acento de marca (NUEVO):
Rojo Marvel        #e5283f  --marvel-red        (texto grande / bordes / gradiente)
Rojo Marvel brillo #ff4d5e  --marvel-red-bright  (texto pequeño, focus-ring, hover)
Rojo Marvel profundo #7a1220 --marvel-red-deep   (viñetas, glows, gradientes de fondo)
Dorado Marvel      #d4a72c  --marvel-gold        (acento secundario, cifras clave)
Dorado profundo    #8a6b1e  --marvel-gold-deep   (bordes/gradientes)

Marcas externas controladas (NUEVO):
YouTube fill  #d0201a  --youtube-red
YouTube texto #ff5a5f  --youtube-red-text
Disney+ fill  #113ccf  --disney-blue
Disney+ texto #5b8def  --disney-blue-text
```

### 1.2 Verificación de contraste (WCAG 2.1 AA — cálculo de luminancia relativa)

Ratios calculados sobre fondo real de uso (no aproximados):

| Combinación | Uso | Ratio | Umbral | Resultado |
|---|---|---|---|---|
| `--marvel-red` (#e5283f) sobre `--bg` | H1 span (texto grande ≥28px/800) | 4.36:1 | 3:1 (texto grande) | ✅ pasa con margen |
| `--marvel-red-bright` (#ff4d5e) sobre `--bg`/`--surface` | texto pequeño, focus ring | 5.99:1 | 4.5:1 | ✅ pasa |
| `--marvel-gold` (#d4a72c) sobre `--bg` | cifras, badges | 8.67:1 | 4.5:1 | ✅ pasa (casi AAA) |
| `--youtube-red-text` (#ff5a5f) sobre `--surface` | CTA reposo | 5.93:1 | 4.5:1 | ✅ pasa |
| blanco sobre `--youtube-red` (#d0201a) | CTA hover/fill | 5.38:1 | 4.5:1 | ✅ pasa |
| `--disney-blue-text` (#5b8def) sobre `--surface` | CTA reposo | 5.61:1 | 4.5:1 | ✅ pasa |
| blanco sobre `--disney-blue` (#113ccf) | CTA hover/fill | 8.17:1 | 4.5:1 | ✅ pasa (AAA) |
| texto blanco sobre overlay hero al 86% opacidad, **peor caso** (píxel de foto blanco puro) | H1/subtítulo en hero | 13.4:1 | 4.5:1 | ✅ pasa incluso en el peor caso posible |
| texto blanco sobre overlay hero al 55% (zona intermedia) | — | 4.30:1 | 4.5:1 | ⚠️ falla en el peor caso → **por eso el texto NUNCA se sitúa en la zona del 55%, solo desde el 66% de altura hacia abajo** (ver §4) |

Nota sobre `#f59e0b` (especial) y `#d4a72c` (dorado marca): ambos son ámbar/dorado saturado, **no** amarillo puro (`#ffeb3b`/`#ffff00`). Se mantienen dentro de la restricción de paleta.

### 1.3 Tipografía (sin cambios de familia)

```
--font-display: 'Manrope', sans-serif;   /* headings, cifras, marca */
--font-body:    'Inter', system-ui, sans-serif; /* cuerpo, UI */
```

Google Fonts `<link>` existente se mantiene tal cual (no se añaden pesos nuevos; los pesos 700/800 de Manrope y 400/500/600/700 de Inter ya cubren todo lo especificado aquí).

---

## 2. Tokens `:root` completos (listos para pegar — reemplazan el bloque `:root` actual)

```css
:root{
  /* ── Base (existente, sin cambios) ── */
  --bg:#0b0d11;
  --surface:#13161c;
  --surface-2:#191d25;
  --surface-3:#20242e;
  --border:#252b36;
  --border-hover:#303845;
  --text:#f3f5f9;
  --text-2:#bac2cf;
  --muted:#6d7685;

  /* ── Semántica de tipo (existente, sin cambios) ── */
  --film:#3b82f6;
  --serie:#a855f7;
  --especial:#f59e0b;
  --done:#10b981;

  /* ── Utilidad UI (existente) ── */
  --blue:#2563eb;
  --blue-hover:#4d82f3;

  /* ── Acento de marca Marvel (NUEVO) ── */
  --marvel-red:#e5283f;
  --marvel-red-bright:#ff4d5e;
  --marvel-red-deep:#7a1220;
  --marvel-gold:#d4a72c;
  --marvel-gold-deep:#8a6b1e;
  --brand-gradient:linear-gradient(90deg,var(--marvel-red) 0%,var(--marvel-gold) 100%);
  --brand-gradient-diag:linear-gradient(135deg,var(--marvel-red) 0%,var(--marvel-gold) 100%);

  /* ── Marcas externas controladas (NUEVO) ── */
  --youtube-red:#d0201a;
  --youtube-red-text:#ff5a5f;
  --disney-blue:#113ccf;
  --disney-blue-text:#5b8def;

  /* ── Tintes de tipo para placeholders de póster (NUEVO) ── */
  --film-tint:rgba(59,130,246,.55);
  --serie-tint:rgba(168,85,247,.5);
  --especial-tint:rgba(245,158,11,.5);

  /* ── Tipografía ── */
  --font-display:'Manrope',sans-serif;
  --font-body:'Inter',system-ui,sans-serif;
  --fs-eyebrow:.72rem;
  --fs-hero:clamp(1.75rem,5.5vw,2.75rem);
  --fs-hero-sub:clamp(.875rem,2vw,1rem);
  --fs-h2:1.125rem;
  --fs-body:.875rem;
  --fs-small:.75rem;
  --fs-xs:.6875rem;

  /* ── Espaciado (px, coherente con el resto del archivo) ── */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px; --sp-6:24px;
  --sp-8:32px; --sp-10:40px; --sp-12:48px; --sp-16:64px; --sp-20:80px; --sp-24:96px;

  /* ── Radios ── */
  --r-xs:6px; --r-sm:8px; --r-md:9px; --r-lg:11px; --r-xl:16px; --r-full:9999px;

  /* ── Sombras / glow ── */
  --shadow-sm:0 1px 3px rgba(0,0,0,.35);
  --shadow-md:0 6px 16px -4px rgba(0,0,0,.45);
  --shadow-lg:0 16px 40px -12px rgba(0,0,0,.55);
  --glow-red:0 0 20px rgba(229,40,63,.35);
  --glow-gold:0 0 20px rgba(212,167,44,.3);

  /* ── Movimiento ── */
  --ease-smooth:cubic-bezier(.4,0,.2,1);
  --ease-bounce:cubic-bezier(.34,1.56,.64,1);
  --dur-fast:120ms; --dur-normal:200ms; --dur-slow:400ms; --dur-slower:600ms;

  /* ── Layout ── */
  --container-max:900px;
  --topbar-h:56px;
  --poster-w:54px;
  --poster-w-sm:46px;
  --poster-ratio:2/3;
}
```

> Nota de refactor opcional (no bloqueante): sustituir los `max-width:900px` repetidos en `.topbar-inner`, `.hero`, `.wrap`, `footer` por `var(--container-max)`.

---

## 3. Topbar (ajustes menores, se mantiene la estructura)

Cambios respecto al actual:

```css
.mini-fill{
  height:100%; width:0;
  background:var(--brand-gradient); /* antes: var(--blue) */
  border-radius:var(--r-full);
  transition:width var(--dur-slower) var(--ease-smooth);
}
```

Razón: el progreso global ahora usa el acento de marca (rojo→dorado), reservando `--blue` para el tag "Película" y los enlaces de título. El resto del topbar (`.brand`, `.brand-mark`, `.topbar-progress`) no cambia. `--topbar-h:56px` documenta la altura real actual (14px padding × 2 + 26px logo + 1px borde ≈ 55–56px) y se usa como referencia de offset para el sticky de las tabs (§5).

---

## 4. Hero cinematográfico (reemplaza por completo `.hero` actual)

### 4.1 Estructura HTML de referencia

```html
<section class="hero-cinematic">
  <div class="hero-cinematic__media" style="--hero-img:url('URL_AVENGERS_AQUI')"></div>
  <div class="hero-cinematic__content wrap">
    <p class="hero-eyebrow">Universo Cinematográfico Marvel</p>
    <h1 class="hero-title">Guía de visionado <span>hasta Doomsday</span></h1>
    <p class="hero-subtitle">Las tres sagas del Universo Cinematográfico de Marvel en orden de estreno. Marca lo visto y abre cualquier título en Google con un toque.</p>
    <div class="hero-badge">
      <svg class="hero-badge__ring" viewBox="0 0 48 48" width="46" height="46">
        <circle cx="24" cy="24" r="20" stroke="var(--border)" stroke-width="4" fill="none"/>
        <circle cx="24" cy="24" r="20" stroke="url(#heroRingGrad)" stroke-width="4" fill="none"
                stroke-linecap="round" stroke-dasharray="125.7" stroke-dashoffset="125.7"
                transform="rotate(-90 24 24)" id="heroRingProgress"/>
        <defs>
          <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--marvel-red)"/>
            <stop offset="100%" stop-color="var(--marvel-gold)"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="hero-badge__text">
        <span class="hero-badge__pct" id="heroPct">0%</span>
        <span class="hero-badge__label">Completado</span>
        <span class="hero-badge__count" id="heroCount">0 / 0 títulos</span>
      </div>
    </div>
  </div>
</section>
```

`stroke-dashoffset` se calcula igual que el resto del progreso: `circunferencia * (1 - pct/100)`, con `circunferencia = 2 * π * 20 = 125.66 ≈ 125.7`. La imagen del Avenger va como **custom property inline** (`--hero-img`), no como `background-image` directo, para poder usarla dentro del `background-image` en capas de abajo.

### 4.2 CSS

```css
.hero-cinematic{
  position:relative;
  isolation:isolate;
  min-height:clamp(420px,60vh,620px);
  display:flex;
  align-items:flex-end;
  overflow:hidden;
  background:var(--surface-2); /* fondo de seguridad, nunca visible salvo error extremo */
}
.hero-cinematic__media{
  position:absolute; inset:0; z-index:0;
  background-image:
    linear-gradient(180deg,
      rgba(11,13,17,.12) 0%,
      rgba(11,13,17,.55) 42%,
      rgba(11,13,17,.88) 66%,
      var(--bg) 100%),
    radial-gradient(85% 60% at 50% 105%, rgba(122,18,32,.32), transparent 70%),
    var(--hero-img, none);
  background-size:cover;
  background-position:center 22%;
  background-repeat:no-repeat;
}
.hero-cinematic__content{
  position:relative; z-index:1;
  padding-bottom:var(--sp-10);
  padding-top:var(--sp-16); /* asegura que el texto empiece ya dentro de la franja oscura */
}
.hero-eyebrow{
  font-family:var(--font-body); font-weight:700; font-size:var(--fs-eyebrow);
  text-transform:uppercase; letter-spacing:.18em; color:var(--marvel-gold);
  margin-bottom:var(--sp-2);
  text-shadow:0 1px 6px rgba(0,0,0,.6);
}
.hero-title{
  font-family:var(--font-display); font-weight:800; font-size:var(--fs-hero);
  letter-spacing:-.8px; line-height:1.1; color:var(--text);
  text-shadow:0 3px 20px rgba(0,0,0,.55), 0 1px 4px rgba(0,0,0,.7);
}
.hero-title span{ color:var(--marvel-red-bright); }
.hero-subtitle{
  font-size:var(--fs-hero-sub); color:rgba(255,255,255,.86);
  max-width:56ch; margin-top:var(--sp-3); line-height:1.6;
  text-shadow:0 2px 10px rgba(0,0,0,.55);
}
.hero-badge{
  display:inline-flex; align-items:center; gap:var(--sp-4);
  margin-top:var(--sp-6);
  padding:10px 20px 10px 10px;
  background:rgba(19,22,28,.55);
  border:1px solid rgba(255,255,255,.14);
  border-radius:var(--r-full);
  backdrop-filter:blur(14px) saturate(150%);
  -webkit-backdrop-filter:blur(14px) saturate(150%);
  box-shadow:var(--shadow-md);
}
.hero-badge__text{ display:flex; flex-direction:column; line-height:1.15; }
.hero-badge__pct{ font-family:var(--font-display); font-weight:800; font-size:19px; color:var(--text); }
.hero-badge__label{ font-size:10.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:.06em; font-weight:600; }
.hero-badge__count{ font-size:11px; color:var(--muted); margin-top:1px; }
#heroRingProgress{ transition:stroke-dashoffset var(--dur-slower) var(--ease-smooth); }
```

### 4.3 Tratamiento de capas y contraste (obligatorio)

1. La imagen (`--hero-img`) es la **última** capa del `background-image`, detrás de los dos degradados. Así, si la URL falla o no llega, esas capas simplemente no pintan nada y **los degradados siguen mostrándose intactos** — el hero nunca queda vacío ni con icono de imagen rota, porque no hay ningún `<img>` en el DOM.
2. Fallback en cascada: sin imagen → se ve un degradado oscuro con viñeta roja de marca (`radial-gradient` en `--marvel-red-deep` al 32%) sobre `--surface-2`. Visualmente parece intencional, no un error.
3. **Zona segura de texto**: todo el contenido (`.hero-cinematic__content`) debe quedar dentro de la franja donde la opacidad del degradado ya es ≥66% (verificado: al 86% de opacidad el contraste en el peor caso —píxel blanco puro de la foto— es 13.4:1; al 55% cae a 4.30:1 y **falla** AA para texto normal). Por eso `align-items:flex-end` + `padding-top:var(--sp-16)` empujan el bloque de texto hacia el tercio inferior del hero, nunca hacia la mitad superior.
4. `text-shadow` en eyebrow/título/subtítulo es una capa de seguridad adicional (no sustituye al degradado, lo refuerza).
5. Object-position sugerido `center 22%` asume una imagen de grupo (Los Vengadores) con las caras en el tercio superior del encuadre; ajustar el porcentaje vertical según el recorte real que aporte el otro agente, manteniendo siempre `object-fit`/`background-size:cover` (nunca deformar la imagen).

### 4.4 Aclaración sobre "póster estirado"

Se interpreta como: **usar la proporción vertical real de un cartel de cine (2:3)**, no una miniatura cuadrada — no como "deformar/estirar" el archivo de imagen. Ver §6 para el tratamiento exacto del póster en la tarjeta de título (donde sí aplica el término "estirada").

---

## 5. Navegación por pestañas (Checklist / Resúmenes / Disney+)

### 5.1 Estructura de referencia

```html
<div class="tabs-bar">
  <div class="tabs-inner wrap" role="tablist" aria-label="Secciones">
    <button class="tab active" role="tab" aria-selected="true" aria-controls="panel-checklist" id="tab-checklist">
      Checklist
    </button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="panel-resumenes" id="tab-resumenes">
      Resúmenes
    </button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="panel-disney" id="tab-disney">
      Disney+
    </button>
    <!-- HUECO EXTENSIBLE: para añadir una 4ª pestaña, duplicar este bloque.
         No requiere cambios de CSS ni de layout; .tabs-inner ya soporta overflow-x. -->
  </div>
</div>

<section id="panel-checklist" role="tabpanel" aria-labelledby="tab-checklist" class="tab-panel active">…</section>
<section id="panel-resumenes" role="tabpanel" aria-labelledby="tab-resumenes" class="tab-panel" hidden>…</section>
<section id="panel-disney" role="tabpanel" aria-labelledby="tab-disney" class="tab-panel" hidden>…</section>
```

Ejemplo concreto de una 4ª pestaña futura (patrón a replicar sin más cambios):

```html
<button class="tab" role="tab" aria-selected="false" aria-controls="panel-curiosidades" id="tab-curiosidades">
  Curiosidades
</button>
```

### 5.2 CSS

```css
.tabs-bar{
  position:sticky; top:var(--topbar-h); z-index:9;
  background:rgba(11,13,17,.92);
  backdrop-filter:blur(10px);
  border-bottom:1px solid var(--border);
}
.tabs-inner{
  display:flex; gap:4px;
  overflow-x:auto; scrollbar-width:none;
}
.tabs-inner::-webkit-scrollbar{ display:none; }

.tab{
  position:relative;
  display:inline-flex; align-items:center; gap:8px;
  padding:14px 18px;
  font-family:var(--font-display); font-weight:700; font-size:13.5px; letter-spacing:.2px;
  color:var(--text-2); white-space:nowrap; cursor:pointer;
  background:none; border:none;
  transition:color var(--dur-fast) var(--ease-smooth);
}
.tab:hover{ color:var(--text); }
.tab:focus-visible{
  outline:2px solid var(--marvel-red-bright); outline-offset:-2px; border-radius:var(--r-xs) var(--r-xs) 0 0;
}
.tab.active{ color:var(--text); }
.tab.active::after{
  content:""; position:absolute; left:14px; right:14px; bottom:-1px; height:2.5px;
  border-radius:var(--r-full);
  background:var(--brand-gradient);
  box-shadow:0 0 10px rgba(229,40,63,.5);
}
.tab .tab-icon{ width:16px; height:16px; opacity:.85; }

.tab-panel{ display:none; }
.tab-panel.active{ display:block; animation:tabFadeIn var(--dur-normal) var(--ease-smooth); }
@keyframes tabFadeIn{ from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:none; } }
```

### 5.3 Comportamiento responsive

- `≤560px`: `.tab{ padding:12px 14px; font-size:12.5px; }`, `.tab .tab-icon{ width:14px; height:14px; }`. `.tabs-inner` mantiene `overflow-x:auto` con scroll táctil libre (no hace falta `scroll-snap` con solo 3 pestañas, pero es seguro añadirlo si la lista crece: `scroll-snap-type:x proximity` en `.tabs-inner` + `scroll-snap-align:start` en `.tab`).
- Área táctil: `14px` de padding vertical + line-height ≈ 45px de alto total → cumple el mínimo de 44×44px en la pestaña activa/objetivo de toque.
- Teclado: `role="tablist"`/`role="tab"` + flechas izquierda/derecha para moverse entre tabs (comportamiento estándar ARIA tabs — implementarlo en JS); `Home`/`End` opcional.

---

## 6. Tarjeta de título (Checklist) + barra de progreso por fase

### 6.1 Estructura de referencia (por item)

```html
<div class="item type-film" style="--type-tint:var(--film-tint); --type-border:var(--film)">
  <div class="poster" style="--poster-url:url('URL_POSTER_AQUI')">
    <div class="check" role="checkbox" aria-checked="false" tabindex="0" title="Marcar como vista">
      <svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>
    </div>
  </div>
  <div class="meta" title="Buscar en Google">
    <div class="title">Los Vengadores</div>
    <div class="date">Mayo 2012</div>
  </div>
  <span class="tag film">Película</span>
</div>
```

### 6.2 CSS — tarjeta

```css
.item{
  display:flex; align-items:center; gap:14px;
  background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg);
  border-left:3px solid var(--type-border);
  padding:10px 15px 10px 10px;
  transition:background var(--dur-fast) var(--ease-smooth),
             border-color var(--dur-fast) var(--ease-smooth),
             transform var(--dur-fast) var(--ease-smooth),
             box-shadow var(--dur-fast) var(--ease-smooth);
}
.item:hover{
  background:var(--surface-2); border-color:var(--border-hover);
  transform:translateY(-1px); box-shadow:var(--shadow-sm);
}

/* ── Póster ── */
.poster{
  position:relative; flex-shrink:0;
  width:var(--poster-w); aspect-ratio:var(--poster-ratio);
  border-radius:var(--r-sm); overflow:hidden;
  background-color:var(--surface-2);
  background-image: linear-gradient(155deg, var(--type-tint) 0%, transparent 60%), var(--poster-url, none);
  background-size:cover; background-position:center;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
  transition:transform var(--dur-normal) var(--ease-smooth);
}
.item:hover .poster{ transform:scale(1.04); }

/* Checkbox superpuesto en la esquina del póster */
.check{
  position:absolute; right:-4px; bottom:-4px; z-index:2;
  width:24px; height:24px; border-radius:50%;
  background:var(--surface); border:2px solid var(--bg);
  display:grid; place-items:center; cursor:pointer;
  transition:background var(--dur-fast) var(--ease-smooth),
             border-color var(--dur-fast) var(--ease-smooth);
}
.check::before{ content:""; position:absolute; inset:-6px; } /* amplía el área táctil a ~36x36 */
.check:hover{ border-color:var(--done); }
.check:focus-visible{ outline:2px solid var(--marvel-red-bright); outline-offset:2px; }
.item.done .check{ background:var(--done); border-color:var(--bg); }
.check svg{ width:13px; height:13px; stroke:var(--bg); stroke-width:3.4; fill:none; opacity:0; transition:opacity var(--dur-fast); }
.item.done .check svg{ opacity:1; }

/* Estado "visto" en el póster: atenuado + tinte oscuro */
.item.done .poster{ filter:grayscale(.7) brightness(.55); }

/* ── Meta (título + fecha) ── */
.meta{ flex:1; min-width:0; cursor:pointer; }
.title{ font-weight:600; font-size:14px; line-height:1.35; transition:color var(--dur-fast); }
.meta:hover .title{ color:var(--blue-hover); }
.date{ color:var(--muted); font-size:12px; margin-top:2px; font-weight:500; }
.item.done .title{ color:var(--muted); text-decoration:line-through; text-decoration-color:rgba(16,185,129,.55); text-decoration-thickness:1.5px; }
.item.done .date{ color:#586170; }

/* ── Tag de tipo (sin cambios de valores, solo posición confirmada a la derecha) ── */
.tag{ font-size:10.5px; font-weight:700; letter-spacing:.4px; padding:4px 10px; border-radius:var(--r-xs); flex-shrink:0; }
.tag.film{ background:rgba(59,130,246,.13); color:var(--film); }
.tag.serie{ background:rgba(168,85,247,.13); color:var(--serie); }
.tag.especial{ background:rgba(245,158,11,.13); color:var(--especial); }
.item.done .tag{ opacity:.55; }
```

Placeholder cuando `--poster-url` no carga o no existe: como el póster no usa `<img>` sino `background-image` en capas (tinte de tipo primero, foto después), si la foto falla la capa de tinte (`--type-tint`) sigue visible sobre `--surface-2` — placeholder coherente por color de tipo, sin iconos rotos, igual que el hero.

### 6.3 Barra de progreso por fase (nuevo, reemplaza el badge de solo texto)

```html
<div class="phase-head">
  <h2>Fase 1</h2>
  <span class="years">2008 – 2012</span>
  <span class="phase-pct">67%</span>
  <span class="count"><b>4</b> / 6</span>
</div>
<div class="phase-progress-track">
  <div class="phase-progress-fill" style="width:67%"></div>
</div>
```

```css
.phase-head{ display:flex; align-items:baseline; gap:11px; margin-bottom:8px; }
.phase-pct{ margin-left:auto; font-family:var(--font-display); font-weight:800; font-size:13px; color:var(--text); }
.count{ font-size:12px; font-weight:600; color:var(--text-2); background:var(--surface); border:1px solid var(--border); border-radius:var(--r-xs); padding:4px 11px; }
.count b{ color:var(--done); }

.phase-progress-track{
  width:100%; height:6px; border-radius:var(--r-full);
  background:var(--surface-2); border:1px solid var(--border);
  overflow:hidden; margin:0 0 16px;
}
.phase-progress-fill{
  height:100%; border-radius:var(--r-full);
  background:var(--brand-gradient);
  width:0%;
  box-shadow:0 0 8px rgba(229,40,63,.4);
  transition:width var(--dur-slower) var(--ease-smooth);
}
```

**Valores exactos**: alto `6px`, color `var(--brand-gradient)` (rojo `#e5283f` → dorado `#d4a72c`, 90°), transición `width 600ms cubic-bezier(.4,0,.2,1)`. El porcentaje (`.phase-pct`) y el conteo `X/Y` (`.count`) conviven en la cabecera; la barra ocupa una fila propia justo debajo, ancho completo.

### 6.4 Responsive (≤560px)

```css
@media (max-width:560px){
  :root{ --poster-w:var(--poster-w-sm); } /* 46px, aspect-ratio 2/3 → 69px alto */
  .item{ padding:8px 10px 8px 8px; gap:12px; }
  .tag{ font-size:10px; padding:3px 8px; }
  .title{ font-size:13.5px; }
  .date{ font-size:11.5px; }
}
```

---

## 7. Apartados "Resúmenes" (YouTube) y "Disney+" — patrón de fila con CTA

### 7.1 Estructura de referencia (compartida por ambos apartados)

```html
<!-- Resúmenes -->
<div class="action-row" style="--type-tint:var(--film-tint)">
  <div class="poster" style="--poster-url:url('URL_POSTER_AQUI')"></div>
  <div class="action-row__meta">
    <div class="action-row__title">Vengadores: Endgame</div>
    <div class="action-row__date">Abril 2019</div>
  </div>
  <a class="cta cta--youtube" href="https://youtube.com/watch?v=…" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    Ver resumen
  </a>
</div>

<!-- Disney+ -->
<div class="action-row" style="--type-tint:var(--film-tint)">
  <div class="poster" style="--poster-url:url('URL_POSTER_AQUI')"></div>
  <div class="action-row__meta">
    <div class="action-row__title">Vengadores: Endgame</div>
    <div class="action-row__date">Abril 2019</div>
  </div>
  <a class="cta cta--disney" href="https://www.disneyplus.com/…" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>
    Ver en Disney+
  </a>
</div>
```

Nota de marca: los iconos anteriores son genéricos (play / "+" en badge redondeado), **no** los logotipos oficiales con derechos reservados de YouTube o Disney+. Es coherencia cromática de marca, no reproducción de logo.

Estado sin enlace disponible (dato no cargado todavía):

```html
<span class="chip-soon">Aún sin resumen</span>
<!-- o -->
<span class="chip-soon">Próximamente en Disney+</span>
```

### 7.2 CSS

```css
.action-row{
  display:grid; grid-template-columns:var(--poster-w) 1fr auto; align-items:center; gap:14px;
  background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg);
  padding:10px 14px;
  transition:background var(--dur-fast) var(--ease-smooth), border-color var(--dur-fast) var(--ease-smooth);
}
.action-row:hover{ background:var(--surface-2); border-color:var(--border-hover); }
.action-row__title{ font-weight:600; font-size:14px; }
.action-row__date{ color:var(--muted); font-size:12px; margin-top:2px; }

.cta{
  display:inline-flex; align-items:center; gap:7px;
  padding:8px 14px; border-radius:var(--r-md);
  font-family:var(--font-body); font-weight:600; font-size:12.5px;
  border:1px solid transparent; white-space:nowrap;
  transition:background var(--dur-normal) var(--ease-smooth),
             color var(--dur-normal) var(--ease-smooth),
             border-color var(--dur-normal) var(--ease-smooth),
             box-shadow var(--dur-normal) var(--ease-smooth),
             transform var(--dur-normal) var(--ease-smooth);
}
.cta svg{ flex-shrink:0; }

.cta--youtube{
  background:rgba(208,32,26,.10); border-color:rgba(208,32,26,.4); color:var(--youtube-red-text);
}
.cta--youtube:hover{
  background:var(--youtube-red); border-color:var(--youtube-red); color:#fff;
  box-shadow:0 4px 14px rgba(208,32,26,.35); transform:translateY(-1px);
}

.cta--disney{
  background:rgba(17,60,207,.10); border-color:rgba(17,60,207,.4); color:var(--disney-blue-text);
}
.cta--disney:hover{
  background:var(--disney-blue); border-color:var(--disney-blue); color:#fff;
  box-shadow:0 4px 14px rgba(17,60,207,.35); transform:translateY(-1px);
}

.chip-soon{
  font-size:10.5px; font-weight:700; color:var(--muted);
  border:1px dashed var(--border); padding:5px 10px; border-radius:var(--r-xs);
  white-space:nowrap;
}

.panel-intro{ margin:20px 0 18px; }
.panel-intro h2{ font-family:var(--font-display); font-weight:700; font-size:var(--fs-h2); padding-bottom:8px; display:inline-block; }
#panel-resumenes .panel-intro h2{ border-bottom:2px solid var(--youtube-red); }
#panel-disney .panel-intro h2{ border-bottom:2px solid var(--disney-blue); }
.panel-intro p{ color:var(--text-2); font-size:13px; margin-top:6px; max-width:56ch; }
```

### 7.3 Justificación de contraste (colores de marca controlados)

Ver tabla de §1.2. Resumen: en reposo, el texto/icono de la CTA usa una variante **clara** del color de marca (`--youtube-red-text` / `--disney-blue-text`) sobre `--surface`, ambas ≥4.5:1. En hover, el fill sólido usa una variante **más oscura y saturada** del color de marca con texto blanco, ambas ≥4.5:1 (Disney+ llega a 8.17:1). Esto evita el error común de usar el rojo/azul "de catálogo oficial" (`#FF0000` puro da solo 4.0:1 con blanco — insuficiente) sin perder el reconocimiento de marca.

### 7.4 Responsive (≤560px)

```css
@media (max-width:560px){
  .action-row{ grid-template-columns:var(--poster-w-sm) 1fr; row-gap:10px; }
  .action-row .cta,
  .action-row .chip-soon{ grid-column:1 / -1; width:100%; justify-content:center; margin-top:2px; }
}
```

---

## 8. Microinteracciones globales y accesibilidad

### 8.1 Microinteracciones sutiles (nuevas)

- Lift + sombra en hover: `.item`, `.action-row`, `.cta`, `.poster` (scale 1.04) — todas con `transform` + `box-shadow`, `--dur-fast`/`--dur-normal`, `--ease-smooth`.
- Indicador de tab activo con `box-shadow` de glow rojo sutil (`0 0 10px rgba(229,40,63,.5)`).
- Barras de progreso (global, hero ring, por fase) animan `width`/`stroke-dashoffset` en `--dur-slower` (600ms) con `--ease-smooth` — nunca instantáneas, nunca más lentas de 600ms.
- Fade-in de panel de tab (`tabFadeIn`, 200ms, translateY 4px→0).

### 8.2 `:focus-visible` (se mantiene el mecanismo, se recolorea al acento de marca)

```css
:focus-visible{
  outline:2px solid var(--marvel-red-bright);
  outline-offset:2px;
  border-radius:var(--r-xs);
}
```

Razón del cambio de color (de `--blue` a `--marvel-red-bright`): `--blue` queda reservado para la semántica de "Película"/enlaces; el foco de teclado ahora refuerza la identidad de marca del rediseño. Contraste verificado 5.99:1 sobre `--bg`/`--surface` (§1.2) — cumple SC 1.4.11 (contraste de componentes de UI, mínimo 3:1) con amplio margen.

### 8.3 `prefers-reduced-motion` (se endurece, ya no es solo `transition:none`)

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    transition-duration:.001ms !important;
    animation-duration:.001ms !important;
    animation-iteration-count:1 !important;
    scroll-behavior:auto !important;
  }
}
```

Mejora respecto al original (`*{transition:none!important}`): se neutralizan también `animation` (necesario ahora por `tabFadeIn` y cualquier futura animación) y `scroll-behavior` (el `html{scroll-behavior:smooth}` existente debe respetar esta preferencia). Usar duración casi-cero en vez de `none` evita romper JS que dependa de eventos `transitionend`/`animationend` si se añaden en el futuro.

### 8.4 Objetivos táctiles

- `.check` (checkbox del póster): círculo visual 24×24px cumple el mínimo AA de WCAG 2.5.8 (24×24 CSS px) por sí solo. `.check::before{ inset:-6px }` amplía el área interactiva real a ~36×36px como margen de confort adicional, sin invadir la fila contigua (separación entre items de 9–10px permite esta expansión sin solapes).
- `.tab`: alto total ≈45px (padding 14px×2 + line-height) — cumple 44px.
- `.cta`: padding 8px 14px + icono 15px + texto ⇒ alto ≈34px en desktop; en mobile pasa a `width:100%` con el mismo padding, área de toque generosa por el ancho completo.

### 8.5 Contraste texto-sobre-foto (regla general, no solo hero)

Cualquier texto colocado directamente sobre una fotografía (hero, y en el futuro cualquier otra sección con imagen de fondo) debe:
1. Situarse sobre una zona con overlay oscuro de **opacidad efectiva ≥80%**, o
2. Llevar su propio scrim local (`background` sólido/degradado detrás del bloque de texto) que garantice el mismo efecto.
Nunca confiar en el contraste "medio" de la imagen sin verificar el peor caso (píxel más claro posible del área). Ver cálculo completo en §1.2 y §4.3.

---

## 9. Responsive — resumen por componente

| Componente | Desktop | ≤560px |
|---|---|---|
| Hero | `min-height:clamp(420px,60vh,620px)` | mismo clamp, se ajusta solo con el viewport (ya contempla mobile) |
| Hero badge | `padding:10px 20px 10px 10px`, ring 46px | opcional reducir a `padding:8px 16px 8px 8px`, ring 40px, `.hero-badge__pct{font-size:17px}` si el espacio es muy ajustado |
| Tabs | `padding:14px 18px`, `font-size:13.5px` | `padding:12px 14px`, `font-size:12.5px` |
| Póster (Checklist/Resúmenes/Disney+) | `--poster-w:54px` (81px alto) | `--poster-w-sm:46px` (69px alto) |
| `.item` | `padding:10px 15px 10px 10px` | `padding:8px 10px 8px 8px`, `gap:12px` |
| `.action-row` | grid `54px 1fr auto` | grid `46px 1fr`, CTA pasa a fila completa debajo |
| `.stats` | `grid-template-columns:repeat(3,1fr)` (sin cambio) | igual, gap `9px`, `.stat{padding:14px 8px}` (ya existente, se mantiene) |

---

## 10. Contrato de datos (para el agente de frontend — no es CSS, es referencia)

Cada item de `DATA[].items[]` necesita, además de los campos actuales (`t`,`d`,`type`,`q`), estos campos opcionales para poder pintar los nuevos componentes:

```js
{
  t:"Los Vengadores", d:"Mayo 2012", type:"film",
  poster:"https://…/poster.jpg",   // 2:3, min. 300×450px recomendado
  yt:"https://youtube.com/watch?v=…", // opcional — si falta, mostrar .chip-soon "Aún sin resumen"
  dp:"https://www.disneyplus.com/…"   // opcional — si falta, mostrar .chip-soon "Próximamente en Disney+"
}
```

`poster` se inyecta como `style="--poster-url:url('…')"` en `.poster`. Si el campo falta o la URL 404, el fallback de tinte de tipo (§6.2) se activa automáticamente sin intervención JS adicional.

---

## 11. Checklist final de QA visual

- [ ] Tokens `:root` de §2 pegados y sin duplicados con los antiguos.
- [ ] Hero sin `<img>`; imagen solo vía `--hero-img` en `background-image` (capa final).
- [ ] Texto del hero siempre dentro de la franja ≥66% del degradado (verificar visualmente con una imagen de prueba muy clara).
- [ ] Tabs con `role="tablist"/"tab"/"tabpanel"` y navegación por teclado (flechas).
- [ ] Póster 2:3, `object-fit`/`background-size:cover` — nunca deformado.
- [ ] Checkbox superpuesto en la esquina del póster, mínimo 24×24px visual.
- [ ] Barra de progreso por fase: 6px alto, `--brand-gradient`, transición 600ms.
- [ ] CTAs YouTube/Disney+ con colores de §1.2 (no usar `#FF0000` puro con texto blanco).
- [ ] `:focus-visible` recoloreado a `--marvel-red-bright`, visible en todos los elementos interactivos nuevos (tabs, check, cta).
- [ ] `prefers-reduced-motion` actualizado (incluye `animation` y `scroll-behavior`).
- [ ] Sin rosa, sin amarillo puro en ningún valor añadido.
- [ ] Responsive verificado a 560px y a 375px (poster 46px, cta en fila completa).
