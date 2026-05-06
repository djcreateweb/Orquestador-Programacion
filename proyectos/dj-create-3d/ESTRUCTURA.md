# ESTRUCTURA DEL PROYECTO — DJ Create 3D

Documento de referencia técnica completa. Generado tras revisión exhaustiva de todos los archivos fuente.

---

## 1. Arbol de Carpetas y Descripcion de Archivos

```
DjCreate3D/
├── index.html                  Pagina principal del sitio (SPA scroll-driven)
├── video.mp4                   Video fuente original del que se extrajeron los frames
├── extract_frames.py           Script Python para extraer los frames del video
├── README.md                   Readme del repositorio
├── .gitignore                  Exclusiones de git
│
├── css/
│   ├── styles.css              Estilos principales: layout, componentes, animaciones
│   ├── intro.css               Estilos exclusivos de la pantalla de carga (#dj-intro)
│   └── cursor.css              Estilos del cursor personalizado neon (#c-dot, #c-canvas)
│
├── js/
│   ├── intro.js                Logica y secuencia animada de la intro (canvas + DOM)
│   ├── frames.js               Motor scroll-driven: carga y dibuja 114 frames en canvas
│   ├── main.js                 Logica principal: nav, reveals, parallax, form, cursor
│   ├── cookies.js              Gestor de consentimiento RGPD (banner + modal)
│   └── cursor.js               Cursor neon simplificado: punto + estela canvas
│
├── frames/
│   ├── frame_0000.jpg          Primer frame del video (inicio del hero)
│   ├── frame_0001.jpg ... frame_0120.jpg   121 frames JPG extraidos del video
│   └── frame_0108.jpg          Frame usado como imagen de banner en la intro legacy
│
├── legal/
│   ├── aviso-legal.html        Pagina de Aviso Legal (doc 01/03)
│   ├── politica-privacidad.html  Pagina de Politica de Privacidad (doc 02/03)
│   └── politica-cookies.html   Pagina de Politica de Cookies (doc 03/03)
│
└── assets/
    ├── fonts/                  Carpeta reservada para fuentes locales (vacia, .gitkeep)
    ├── icons/                  Carpeta reservada para iconos (vacia, .gitkeep)
    └── images/                 Carpeta reservada para imagenes (vacia, .gitkeep)
```

**Nota sobre los frames:** El proyecto usa 114 frames activos (frame_0000 a frame_0113). Los frames 0114 a 0120 existen en disco pero no son utilizados por el motor. El script `extract_frames.py` es la herramienta con la que se genero la secuencia desde `video.mp4`.

---

## 2. Flujo de Carga Completo

### Fase 1 — Carga del HTML y scripts (0 ms)
- El navegador carga `index.html`.
- `history.scrollRestoration = 'manual'` + `window.scrollTo(0,0)` en `main.js` garantizan que la pagina siempre arranca desde el tope.
- `intro.js` se ejecuta primero (es el primer `<script>`). Inserta `#dj-intro` en el DOM y bloquea el scroll con `html.intro-active` + `body.intro-active`.

### Fase 2 — Pantalla de intro animada (~0–11 segundos)
`intro.js` controla una secuencia temporal precisa:

| Tiempo | Evento |
|--------|--------|
| T+0    | `#dj-intro` en DOM, canvas arranca, particulas convergen |
| T+500ms | Anillos de reticle aparecen (fade-in de 900 ms) |
| T+1450ms | "DJ" aparece de abajo hacia arriba (`djc-dj-in`) |
| T+2300ms | "Create" desliza desde la derecha (`djc-create-in`) |
| T+2850ms | Shimmer/destello sobre el logotipo |
| T+3400ms | Lock-on: pulso en anillos, clase `is-lock` |
| T+3750ms | Linea divisora se dibuja |
| T+4300ms | Subtexto "Agencia de diseno web 3D · Murcia" aparece |
| T+4600ms | Loader (barra de progreso) aparece |
| T+5000ms | Barra de progreso se llena en 1.15 s |
| T+6400ms | Stage desvanece, anillos salen, HUD se apaga |
| T+7100ms | Clase `is-revealing`: intro empieza a abrirse |
| T+8300ms | Flash de luz blanca (`iflash`) |
| T+8900ms | `preparePageReveal()`: hero y nav se preparan para entrar con blur/translateY |
| T+9300ms | Clase `is-out`: wipe final (clip-path + blur + translateY) |
| T+11000ms | `#dj-intro` eliminado del DOM, clases `intro-active` removidas |

### Fase 3 — Carga de frames del hero (en paralelo con la intro)
- `frames.js` comienza la precarga de los 114 frames JPG en paralelo desde que el DOM esta listo.
- Al cargar el frame 0, dibuja inmediatamente en `#frameCanvas` y dispara el evento `hero:firstframe`.
- `main.js` escucha `hero:firstframe` para sincronizar la salida de la intro legacy (`brandIntro`).
- Mientras los frames cargan, `#heroLoader` muestra una barra de progreso.

### Fase 4 — Reveal del sitio y hero interactivo
- Al terminar la intro, hero y nav aparecen con transicion suave (opacity + blur + translateY).
- El scroll-driven comienza a funcionar: el usuario puede hacer scroll para avanzar los frames.
- Al llegar al frame 108 (scroll ~94.7%), `#heroContent` se vuelve visible con clase `visible`.
- Los elementos del hero-content aparecen con transiciones escalonadas (accent, tag, titulo, sub, botones, meta).

### Fase 5 — Navegacion en el sitio
- El usuario hace scroll por las secciones: Servicios → Portafolio → Nosotros → Contacto → Footer.
- Los reveals (IntersectionObserver) van activando animaciones de entrada.
- El banner de cookies aparece si no hay consentimiento guardado en `localStorage`.

---

## 3. Descripcion Detallada de Secciones de index.html

### SVG Gradient Defs (linea 19)
Un SVG invisible de 0x0 pixels que define el gradiente global `#djc-grad` (teal → blue → purple). Este gradiente es referenciado por el logo SVG en nav y footer mediante `url(#djc-grad)`. Esta separado de la intro para que siga activo incluso cuando la intro desaparece.

### Brand Intro Legacy (#brandIntro)
Elemento que en versiones anteriores era la pantalla de carga principal. En la version actual, `intro.css` lo oculta con `display: none !important`. Su logica en `main.js` verifica si esta visible antes de ejecutarse. Esta desactivado pero el HTML se conserva por compatibilidad.

### Navegacion (#nav .nav-pill)
- **Tipo:** `position: fixed`, centrado con `left: 50%; transform: translateX(-50%)`.
- **Ancho:** `min(960px, calc(100% - 2.4rem))`.
- **Efecto al scroll:** Al superar 60px de scroll vertical, agrega clase `scrolled` que aumenta el blur del fondo y reduce el `top` de 1.4rem a 0.85rem.
- **Logo:** SVG inline con dos circulos y gradiente. El circulo exterior rota continuamente (`nav-mark-spin`, 24 segundos).
- **Links:** 5 anclas con smooth scroll (data-scroll). Tienen underline animado en hover (scaleX).
- **CTA:** Boton azul (`var(--blue)`) estilo pill con fuente mono.
- **Responsive:** En movil los links desaparecen (solo logo y CTA).

### Hero (#hero)
- **Altura total:** 600vh (6 alturas de viewport) — da "recorrido" al scroll.
- **Canvas sticky:** `#scrollCanvas` con `position: sticky; top: 0; height: 100vh`. El canvas `#frameCanvas` dentro dibuja los frames a modo de video.
- **Overlay de desvanecimiento (#heroFadeout):** Overlay negro encima del canvas que se va haciendo opaco del frame 102 al 110 para tapar el texto "baked-in" que tiene el video original.
- **Loader:** `#heroLoader` visible mientras se precargan los frames. Se oculta al cargar el ultimo.
- **Hero Content:** Panel central con glassmorphism (blur + radial gradients + border). Aparece cuando el progreso de scroll supera el frame 108 (~94.7% del recorrido del hero). Contiene: linea de acento, tag "Agencia de diseno web · Murcia", titulo H1, subtitulo, dos botones (principal + ghost), pie de datos.
- **Scroll Hint:** Icono de reticle SVG + etiqueta "Scroll" + barra animada. En desktop sigue al cursor dentro del hero con interpolacion (LERP 0.22). Se oculta cuando el scroll supera 80px.

### Dividers entre secciones
Tres tipos de separadores visuales:
- **divider-haze:** 180px de altura, radial gradient teal/purple + hairline horizontal.
- **divider-scanline:** 1px con gradiente horizontal + punto central pulsante (`.divider-dot`).
- **divider-tech:** 80px con texto monospaced (ej. "03 — estudio") y linea lateral.

### Seccion Servicios (#servicios)
- **Eyebrow:** "01 / Servicios" en fuente mono color accent.
- **Titulo:** "Planes a medida para cada vision." con `.split-words` y `.has-rule`.
- **Layout:** Lista vertical de filas (`.plans-list`) con 4 planes.
- **Cada plan-row:** Grid 3 columnas (28% / 45% / 27%): izquierda (numero + precio), centro (descripcion + lista de features), derecha (CTA).
- **Interactividad:** En hover, borde izquierdo azul aparece (scaleY), numero fantasma en fondo se ilumina, precio desplaza a la derecha.
- **Plan destacado (02 Avanzado):** Clase `plan-row--featured` con badge "Mas popular" y CTA solido.
- **Precios:** 300€ / 400€ / 500€ / desde 800€.

### Seccion Portafolio (#portafolio)
- **Eyebrow:** "02 / Portafolio".
- **Grid editorial:** `.portfolio-grid--editorial` con soporte para tarjetas de ancho variable (w2, w3, w4, w6).
- **Estado actual:** Solo contiene placeholders (`.portfolio-card--placeholder`) con esqueleto "Proximamente" y una tarjeta CTA final.
- **Tarjeta plantilla (comentada):** Incluye una plantilla HTML comentada para agregar proyectos reales con video MP4 y barra de navegador simulada.
- **Efecto tilt 3D:** En desktop, al pasar el raton sobre las tarjetas reales, aplica `perspective(900px) rotateY/rotateX` hasta 5 grados.
- **Videos:** Los videos en tarjetas se reproducen automaticamente al entrar al viewport (IntersectionObserver) y se pausan al salir.

### Seccion Nosotros (#nosotros)
- **Tier:** `section--tier-1` (fondo ligeramente distinto).
- **Numero gigante "47":** `.nosotros-bignum` posicionado absolutamente con parallax negativo (`data-parallax-speed="-0.18"`). Representa los 47 proyectos o el "take 47" cinematico.
- **Grid:** Layout split: aside izquierdo (eyebrow + titulo) + bloque de texto derecho.
- **Stats animados:** 3 elementos con `data-counter`: "+50 proyectos", "5★ satisfaccion", "7 dias entrega". Los contadores animan de 0 al valor final con easing `easeOutCubic` en 1400ms cuando entran al viewport.
- **Contenido:** Descripcion del estudio, filosofia de trabajo artesanal.

### Seccion Contacto (#contacto)
- **Tier:** `section--tier-2`.
- **Layout asimetrico 60/40:** Grid con formulario (izquierda) + aside de info de contacto (derecha).
- **Formulario (#contactForm):** Campos: nombre, email, plan (select), mensaje. Validacion JS client-side (campos vacios, regex de email). Al enviar con exito, el boton agrega clase `is-success` durante 2.4 segundos.
- **Labels flotantes:** Los campos usan clase `has-value` para el estado "con valor" que activa el label flotante via CSS.
- **Info de contacto:** Email, WhatsApp, ubicacion (Murcia, ES), horario (L-V 9h-19h).

### Footer
- **Tres columnas:** Logo (izquierda), links de navegacion (centro), redes sociales (derecha).
- **Legales:** Aviso legal, Privacidad, Cookies, "Configurar cookies" (abre el modal).
- **Ano dinamico:** `<span id="year">` se rellena con JS (`new Date().getFullYear()`).

### Cookie Banner y Modal
- **Banner (#cookieBanner):** Aparece si no hay consentimiento en `localStorage`. Tres acciones: Aceptar todas / Rechazar / Configurar.
- **Modal (#cookieModal):** Permite configuracion granular por categoria (necesarias siempre on + no desactivables, analitica, marketing). Backdrop clickable para cerrar, tecla Escape tambien cierra.

### Carga de Scripts (al final del body)
```html
<script src="js/intro.js"></script>    <!-- 1o: inyecta #dj-intro, bloquea scroll -->
<script src="js/frames.js"></script>    <!-- 2o: arranca precarga de frames -->
<script src="js/main.js"></script>      <!-- 3o: nav, reveals, form, cursor, parallax -->
<script src="js/cookies.js"></script>   <!-- 4o: banner de cookies -->
<script src="js/cursor.js"></script>    <!-- 5o: cursor neon con estela -->
```

---

## 4. Archivos JavaScript — Funciones Principales

### js/intro.js
Pantalla de carga cinematica "Targeting Sequence". Se ejecuta inmediatamente, construye el DOM de la intro, anima un canvas con particulas/anillos, y orquesta la secuencia de aparicion del logotipo.

**Funciones y bloques clave:**

- **Construccion del DOM:** `document.createElement('div')` con id `#dj-intro`. Inserta canvas, esquinas HUD, barra HUD superior/inferior, ticks laterales, y el escenario central con: `#idjw` (texto DJ), `#icrw` (texto Create), shimmer, linea, subtexto, loader y barra de progreso.
- **`resize()`:** Adapta el canvas al viewport con `devicePixelRatio`. Reinicia las particulas.
- **`initPts()`:** Crea 55 particulas con posicion aleatoria exterior y objetivo interior aleatorio (convergen hacia el centro).
- **`frame(ts)`:** Loop de animacion principal (rAF). Dibuja particulas en transicion, arcos de orbita (`ring()`, `arc()`), marcas de reloj (`ticks()`). Las particulas desaparecen gradualmente despues de ~3.2 segundos.
- **`ring(r, lw, color, dash, angle)`:** Dibuja un circulo completo en canvas.
- **`arc(r, lw, color, startA, endA, angle)`:** Dibuja un arco parcial en canvas.
- **`ticks(r, n, color, angle)`:** Dibuja marcas de graduacion alrededor de un radio.
- **`fadeIn(target, from, to, duration)`:** Animacion de fade lineal via rAF para el proxy del anillo.
- **`preparePageReveal()`:** Antes de que la intro salga, prepara el hero y nav con `opacity:0 + blur + translateY`, luego en el siguiente frame los anima a su estado natural, creando la ilusion de que el sitio "emerge" por debajo de la intro.
- **`clearPageReveal()`:** Limpia los estilos inline aplicados por `preparePageReveal()` tras la animacion.
- **Secuencia temporal:** Serie de `setTimeout` que disparan las clases de animacion CSS en el orden correcto (ver tabla en seccion 2).

### js/frames.js
Motor de video-scroll cinematico. Precarga 114 frames JPG y los muestra en canvas sincronizados con el scroll.

**Variables de configuracion:**
```js
TOTAL_FRAMES = 114       // Frames 0000-0113
FRAMES_PATH  = "frames/"
FRAME_PREFIX = "frame_"
FRAME_EXT    = ".jpg"
FRAME_DIGITS = 4
FADE_START_FRAME = 102   // Empieza el fade del overlay
FADE_END_FRAME   = 110   // Overlay completamente opaco
REVEAL_FRAME     = 108   // Cuando aparece el hero-content
```

**Funciones:**
- **`getFramePath(index)`:** Construye la ruta `frames/frame_XXXX.jpg`.
- **`preloadFrames()`:** Crea 114 objetos `Image`, asigna `src`, rastrea `loadedCount`. Al cargar el frame 0, lo dibuja y emite `hero:firstframe`. Al cargar el ultimo, oculta el `#heroLoader`.
- **`resizeCanvas()`:** Ajusta canvas a `window.innerWidth/Height * devicePixelRatio`.
- **`drawFrame(index)`:** Dibuja el frame con logica `object-fit: cover` manual: calcula `scale = max(canvasW/imgW, canvasH/imgH)` y centra la imagen.
- **`onScroll()`:** Calcula `progress = scrollY / (heroHeight - vh)`. Determina `targetFrame`. Activa/desactiva clase `visible` en `#heroContent` segun `REVEAL_PROG`. Calcula y aplica la opacidad del overlay `#heroFadeout`.
- **`animate()`:** Loop rAF de interpolacion: `currentFrame += (targetFrame - currentFrame) * 0.18`. Produce el efecto de "inercia" al hacer scroll.

### js/main.js
Logica general del sitio. Contiene el handler legacy de `brandIntro`, navegacion, reveals y el "Cinematic Motion Layer".

**Bloques principales:**

**Brand Intro legacy (IIFE `brandIntro`):**
- Solo se ejecuta si `#brandIntro` esta visible (no lo esta en la version actual).
- Timers: MIN_DURATION (1400ms), READY_HOLD (2500ms), HARD_EXIT (4700ms).
- Escucha el evento `hero:firstframe` para sincronizar la salida.

**Nav scrolled:**
- `window.addEventListener('scroll', ...)`: Togglea clase `scrolled` en `#nav` cuando `scrollY > 60`.

**Smooth scroll:**
- Todos los `<a data-scroll>` usan `scrollIntoView({ behavior: 'smooth', block: 'start' })` en lugar de CSS `scroll-behavior`.

**RevealObserver (base):**
- IntersectionObserver con `threshold: 0.12` y `rootMargin: '0px 0px -60px 0px'`.
- Al entrar al viewport, agrega clase `in` a elementos `.reveal`.

**Ano en footer:** `document.getElementById('year').textContent = new Date().getFullYear()`.

**Formulario:**
- Validacion: nombre vacio, email vacio, mensaje vacio, regex de email.
- Muestra feedback en `#formFeedback` con clase `error` si falla.
- Mensaje de exito: "¡Mensaje enviado! Responderemos en menos de 24h." + `form.reset()`.

**Cinematic Motion Layer (IIFE anonima):**
Detecta `prefers-reduced-motion` y `pointer: fine` para activar o no las animaciones costosas.

1. **Reveal Variants (variantIO):** IntersectionObserver para `.reveal-up`, `.reveal-fade`, `.reveal-blur`, `.reveal-scale`, `.reveal-clip`. Agrega clase `in` al entrar.

2. **Stagger (staggerIO):** Padres con `[data-reveal-stagger]` reciben un delay CSS `--stagger-delay` por hijo antes de que los hijos sean observados.

3. **Split Words:** Funcion `splitWords(el)` que envuelve cada palabra en `<span class="tw">` con `--i` para calcular el delay individual. Un IntersectionObserver (splitIO) agrega clase `split-in` al entrar al viewport.

4. **Contadores numericos:** Detecta `[data-counter]`. Pre-rellena a 0. Al entrar al viewport, anima con `easeOutCubic` durante `data-counter-duration` ms (default 1400ms). Soporta `data-counter-prefix`, `data-counter-suffix`, `data-counter-decimals`.

5. **Lineas dibujadas + Timeline:** IntersectionObserver para `.steps--timeline` y `.section-title.has-rule`. Agrega clase `drawn` y activa `.timeline-dot` con delays escalonados.

6. **Parallax ligero:** Elementos con `[data-parallax-speed]` (valor positivo/negativo). Calcula offset basado en scroll y viewport, clampea entre -300/300px. Usa `requestAnimationFrame` con flag `pTicking` para no sobrecargar.

7. **Light Cursor (cursor luminoso de alta calidad):** Solo activo si existe `.light-cursor` en el DOM y `pointer: fine`. Usa interpolacion LERP (0.34) para el seguimiento suave. Detecta si el cursor esta sobre elemento interactivo o de texto para cambiar la escala/forma. Crea 7 trails con CSS variables `--trail-size` y `--trail-opacity`. Este sistema es la alternativa de alta calidad al cursor neon basico de `cursor.js`.

8. **Magnetic Buttons:** `.btn-main` y `.nav-cta` se desplazan magneticamente hasta STRENGTH 0.22 dentro de RADIUS 90px.

9. **Tilt 3D en Portfolio:** Tarjetas `.portfolio-card` (no-CTA) rotan en perspectiva hasta 5 grados segun posicion del raton.

10. **Scroll Hint + cursor follow:** El `.scroll-hint` se oculta al superar 80px de scroll. En desktop sigue al cursor dentro del hero con LERP 0.22, anclandose al punto del cursor.

11. **Form has-value:** Detecta input/textarea/select con valor para agegar clase `has-value` al contenedor `.field` (activa el label flotante CSS).

12. **Portfolio Videos:** IntersectionObserver con umbrales multiples. Reproduce video al 25%+ visible, pausa al salir.

13. **Submit success state:** Al enviar el formulario con exito, el boton agrega clase `is-success` y se deshabilita 2.4 segundos.

### js/cookies.js
Gestor RGPD. IIFE con API publica `window.DjcCookies`.

**Funciones:**
- **`loadConsent()`:** Lee `djc_cookie_consent_v1` de `localStorage`. Retorna null si no existe o si la version no coincide.
- **`saveConsent(partial)`:** Guarda objeto con `{version, necessary, analytics, marketing, ts}`. Dispara evento `djc:consent` en `document`.
- **`clearConsent()`:** Elimina la clave de `localStorage`.
- **`show(el)` / `hide(el)`:** Muestra/oculta elementos con clases CSS + `hidden` attribute. El hide tiene delay de 480ms para la animacion de salida.
- **`syncModal(modal)`:** Sincroniza los checkboxes del modal con el estado actual guardado.
- **Listeners del banner:** Aceptar todas → `{necessary:true, analytics:true, marketing:true}`. Rechazar → `{necessary:true, analytics:false, marketing:false}`. Configurar → oculta banner, abre modal.
- **Listeners del modal:** Guardar seleccion lee los checkboxes. Aceptar todas, Cerrar, backdrop click, Escape.
- **Reabrir modal:** Cualquier `[data-cookie-open]` abre el modal de configuracion.

### js/cursor.js
Cursor neon basico y ligero. IIFE vanilla sin dependencias.

**Funcionamiento:**
- Crea `#c-dot` (punto neon blanco con box-shadow teal) y `#c-canvas` (canvas full-screen para la estela).
- Al primer `mousemove`, el punto se hace visible (`opacity: 1`).
- En cada `mousemove`, mueve el punto y guarda la posicion con timestamp en array `pts` (max 300 puntos).
- Loop `draw()` via rAF: limpia canvas, filtra puntos con mas de 420ms (`LIFE`). Dibuja cada segmento de la estela con:
  - Grosor variable: `ratio * 2.5 + 0.4` px para la linea brillante.
  - Grosor de glow: `ratio * 14 + 2` px semitransparente.
  - Color interpolado: teal `(0, 245, 212)` en la cabeza → purple `(124, 58, 237)` en la cola.
  - Alpha cuadratico: `ratio * ratio` para caida suave.

---

## 5. Archivos CSS — Bloques Principales

### css/styles.css (~1300 lineas)
Archivo CSS principal organizado en secciones claramente delimitadas:

**@property:**
- `--feature-angle`: propiedad CSS animable de tipo `<angle>` para el gradiente cónico del borde.

**:root — Variables globales:**
- Paleta: `--bg` (#020812), `--bg-tier-1`, `--bg-tier-2`, `--bg-card`, etc. Escalado de oscuro a menos oscuro.
- Acentos: `--accent` (#00F5D4 teal), `--accent2` (#7C3AED purple), `--blue` (#3D9DFF), `--lime` (#C8FF3D).
- Gradientes: `--gradient` (teal → purple), `--gradient-soft`, `--gradient-border` (conico animable).
- Tipografia: `--font-display` (Fraunces), `--font-body` (Geist), `--font-mono` (Geist Mono).
- Type scale: de `--fs-xs` (0.72rem) a `--fs-display-lg` (clamp 3.4–8.4rem).
- Espaciado: escala de 4px base (--space-1 a --space-section-y).
- Radii, sombras con glow coloreado, easings cinematicos, duraciones.

**Base:**
- Reset box-sizing universal.
- Scrollbar personalizada: gradiente teal/purple, borde doble.
- Body: fondo negro profundo, fuente Geist, antialiasing, overflow-x hidden.
- **Grain filmico global:** `body::after` con SVG feTurbulence incrustado como data URI, `opacity: 0.035`, `mix-blend-mode: overlay`, `position: fixed`. Simula grano de pelicula de forma muy discreta.

**Tipografia:**
- H1-H4: Fraunces, font-variation-settings variables.
- `.grad`: texto con gradiente teal-purple mediante `background-clip: text`, en italica con WONK=1.

**Nav Pill (.nav-pill):**
- Fixed, centrado, glassmorphism (backdrop-filter blur 22px + saturate 140%).
- Estado `.scrolled`: fondo mas opaco, posicion mas alta.
- Logo con SVG en rotacion infinita 24s.
- Links con underline que crece de izquierda (scaleX).
- CTA azul con glow.

**Hero:**
- `#hero`: 600vh de altura para el recorrido scroll.
- `#scrollCanvas`: sticky, 100vh, z-index 1, con overlay de gradiente oscurecedor.
- `#heroFadeout`: overlay negro sticky que se vuelve opaco via JS para tapar texto del video.
- `.hero-overlay`: sticky, centrado, z-index 2, pointer-events none.
- `.hero-content`: absolutamente centrado, opacity 0 por defecto, glassmorphism con pseudo-elementos ::before (backdrop blur + gradientes de color) y ::after (lineas finas decorativas).
- `.hero-content.visible`: opacity 1, transform none. Cada elemento interior tiene su propia transicion con delay escalonado.
- Animacion `heroPulse` para el punto del tag.
- `.hero-loader`: fixed, fondo solido, barra de progreso.

**Botones (.btn-main, .btn-ghost):**
- `btn-main`: gradiente teal-purple, color oscuro, pill, shimmer en ::before al hover.
- `btn-ghost`: transparente, borde sutil, fondo teal muy tenue en hover.

**Scroll Hint:**
- Fixed abajo/centro. Con `.scroll-hint--following` cambia a `position: fixed; top: 0; left: 0` y es movido por JS via `transform`.
- Animaciones SVG: `shc-breathe`, `shc-rotate` (anillo punteado), `shc-scan` (linea horizontal).
- `scroll-bar`: barra de 1px que "gotea" con animacion `drip`.

**Custom Cursor (Light Cursor):**
- `.light-cursor`: fixed, 92px x 92px, `mix-blend-mode: screen`, fuera de pantalla por defecto.
- `.light-cursor__aura`: gradiente radial difuso.
- `.light-cursor__halo`: circulo de 46px con glow y animacion `cursor-pulse`.
- `.light-cursor__ring`: anillo de 30px en orbita (`cursor-orbit`, 3.2s).
- `.light-cursor__core`: punto blanco central con glow multicapa.
- `.light-cursor__ray`: lineas cruzadas horizontal y vertical.
- Estados `is-interactive`, `is-text`, `is-pressing`: cambian escala y colores.
- `.light-trail`: 7 puntos de estela con tamano y opacidad decrecientes via CSS variables.

**Secciones base:**
- `.section`: padding vertical clamp, padding inline, isolation.
- `.section--tier-1` / `.section--tier-2`: fondos ligeramente distintos.
- `.section-inner`: max-width 1280px centrado. Variantes: narrow (720px), wide (1480px), bleed (96vw).
- `.section-head`: max 720px, flex column, margen inferior.
- `.section-eyebrow`: mono, uppercase, accent, con linea de 28px antes (::before).
- `.section-title`: Fraunces, display-md size.
- `.section-lead`: texto secundario, tamano lg, max 56ch.

**Sistema Reveal (CSS):**
- `.reveal`: opacity 0, translateY(44px), transicion 0.95s.
- `.reveal.in`: opacity 1, transform none.
- `.reveal-up`: translateY(56px).
- `.reveal-blur`: blur(10px) + translateY(24px).
- `.reveal-scale`: scale(0.94).
- `.reveal-clip`: clip-path inset(100%) + translateY(28px).
- Todas con `transition-delay: var(--stagger-delay, 0ms)` para el efecto escalonado.

**Split Text:**
- `.split-words .tw`: inline-block, opacity 0, translateY(0.55em), blur(6px), delay `calc(var(--i) * 42ms)`.
- `.split-words.split-in .tw`: opacity 1, transform none, blur 0.

**Hairline bajo titulos:**
- `.section-title.has-rule::after`: linea de 88px que crece con scaleX al agregar clase `drawn` (IntersectionObserver).

**Dividers:**
- `divider-haze`: gradiente radial morado/teal + hairline.
- `divider-scanline`: 1px con punto central pulsante.
- `divider-tech`: texto mono + linea lateral.

**Servicios / Planes:**
- Decoracion de fondo: radial gradient morado y grid de puntos con mask radial.
- `.plans-list`: flex columna con border-top.
- `.plan-row`: grid 3 columnas con transiciones. Ghost number en ::after (22vw de tamano, transparente con stroke), borde izquierdo en ::before (scaleY en hover).
- Precio en Fraunces italic gigante.
- `.plan-row--featured`: sin estilos adicionales en el CSS visible (diferenciacion por HTML).
- `.plan-row__cta--solid`: variante solida del CTA.

**Portfolio:**
(resto del CSS cubre portfolio-grid, contacto, nosotros, footer, cookies, y paginas legales)

### css/intro.css (~1298 lineas)
Estilos exclusivos de la pantalla de carga `#dj-intro`. Contiene multiples "pasadas" de refinamiento apiladas al final del archivo (el CSS de intro fue iterado varias veces y cada iteracion agrega bloques que sobreescriben los anteriores).

**Regla clave al inicio:**
```css
#brandIntro { display: none !important; }
#siteIntro  { display: none !important; }
```
Desactiva los sistemas de intro anteriores.

**Estructura de estilos de #dj-intro:**
- Fondo: radial gradients azul profundo + lineal oscuro.
- `::before`: grano filmico SVG feTurbulence.
- `::after`: grid de lineas azules tenues + linea diagonal + mask radial (redefinido en cada pasada).
- `.ic` (canvas): absolute, inset 0.
- `.if` (frame/HUD): absolute, inset clamp.
- `.ico` (esquinas): Animacion `djc-corner-in` que aparecen desde translateY(-10px) scale(.78).
- `.ib` (barras HUD): grid 3 columnas, fuente Geist Mono, color rgba(214,245,255,.52). Animacion `djc-hud-in`.
- `.itag` (textos HUD): mono, uppercase, muy pequeno (0.68rem max).
- `.iprog` / `.iprog-f` (barra de progreso): 2px altura, gradiente teal-blue-purple con glow.
- `.is` (stage central): absolute centrado, grid 2 columnas (DJ | Create) alineadas al fondo.
- `.idj-w` / `.icr-w` (wrappers de texto): overflow hidden, clip-path y blur para las animaciones de entrada.
- `.idj` (texto "DJ"): Syne 800, ~9.6rem, gradiente blanco-teal.
- `.icr` (texto "Create"): Fraunces italic ~10.8rem, gradiente blanco-teal-blue-purple.
- `.ishm` (shimmer): linea que se desvanece.
- `.isub` (subtexto): Geist Mono uppercase, opacity 0 → 1.
- `.iload` (loader): grid centrado con texto + barra de progreso.
- `.ireveal` (rayo de revelacion): diagonal, mix-blend-mode screen, anima `djc-page-beam`.

**Animaciones @keyframes definidas:**
- `djc-corner-in`: esquinas aparecen desde escala pequeña.
- `djc-hud-in`: HUD desde translateY(8px) opacity 0.
- `djc-dj-in`: DJ sube desde abajo con blur y clip-path.
- `djc-create-in`: Create desde la derecha con blur y clip-path.
- `djc-shimmer`: linea de brillo pasa de izquierda a derecha.
- `djc-line-in`: linea divisora crece (scaleX).
- `djc-sub-in`: subtexto aparece desde abajo.
- `djc-lock`: stage pulsa ligeramente en scale.
- `djc-sweep`: barrido interior de la pill.
- `djc-flash`: flash blanco breve.
- `djc-reveal-bloom`: saturate+brightness durante la revelacion.
- `djc-grid-dissolve`: el grid se desvanece.
- `djc-canvas-out`: canvas se va con blur+scale.
- `djc-hud-soft-out`: HUD se apaga.
- `djc-open-page`: salida final con clip-path poligonal (wipe diagonal).
- `djc-brand-aurora`: aurora del halo de fondo oscila.
- `djc-page-beam`: rayo diagonal sube.

**Estados de la intro:**
- `.is-lock`: pulso del stage al "lock-on".
- `.imsk.is-on` / `.ipll.is-exp` / `.ipll.is-full`: sistema de pill expandible (desactivado en la version final con `display: none !important`).
- `.is-revealing`: bloom + dissolve del grid.
- `.is-out` / `.fade-out`: wipe poligonal de salida.

### css/cursor.css
Archivo muy conciso (55 lineas). Define tres elementos:

- **`html, body, *, a, button { cursor: none !important }`:** Oculta el cursor nativo en TODOS los elementos.
- **`#c-dot`:** Punto fijo de 9px, blanco, con box-shadow en capas: anillo de contacto teal (0px spread), tubo neon (10px blur), halo exterior (50px blur). `z-index: 99999`. Empieza con `opacity: 0`.
- **`#c-canvas`:** Canvas fixed, full-screen, `z-index: 99997`, no intercepta eventos.
- **`#c-spotlight`:** Overlay fixed con radial gradient centrado en `var(--cx) var(--cy)`. Activo con clase `.on`. (Definido en CSS pero el JS actual no parece usarlo activamente.)
- **`section.c-active`:** Box-shadow interior teal muy sutil cuando la seccion esta "activa" (tambien sin uso activo en el JS actual).

---

## 6. Sistema de Animaciones y Scroll Reveals

### IntersectionObservers activos (5 instancias en main.js)

| Observer | Selector | Threshold | rootMargin | Accion |
|----------|----------|-----------|-----------|--------|
| `revealObserver` | `.reveal` | 0.12 | 0px 0px -60px 0px | Agrega clase `in` |
| `variantIO` | `.reveal-up`, `.reveal-fade`, etc. | 0.14 | 0px 0px -80px 0px | Agrega clase `in` |
| `staggerIO` | `[data-reveal-stagger]` | 0.08 | 0px 0px -40px 0px | Asigna `--stagger-delay` a hijos |
| `splitIO` | `.split-words` | 0.2 | 0px 0px -40px 0px | Agrega clase `split-in` |
| `counterIO` | `[data-counter]` | 0.4 | (ninguno) | Lanza animacion de contador |
| `drawIO` | `.steps--timeline`, `.section-title.has-rule` | 0.3 | (ninguno) | Agrega clase `drawn` |
| `videoIO` | `.portfolio-card video` | [0, 0.25, 0.5, 0.75] | (ninguno) | play/pause segun visibilidad |

### Variantes de reveal

| Clase CSS | Efecto inicial | Resuelve a |
|-----------|---------------|-----------|
| `.reveal` | opacity 0 + translateY(44px) | opacity 1 + none |
| `.reveal-up` | opacity 0 + translateY(56px) | opacity 1 + none |
| `.reveal-fade` | opacity 0 | opacity 1 |
| `.reveal-blur` | opacity 0 + blur(10px) + translateY(24px) | opacity 1 + none |
| `.reveal-scale` | opacity 0 + scale(.94) | opacity 1 + none |
| `.reveal-clip` | opacity 0 + clip-path inset(100%) + translateY(28px) | opacity 1 + inset(0) |

### Split Text
Las palabras se envuelven en `<span class="tw">` con indice CSS `--i`. El delay de cada palabra es `i * 42ms`. En movil o con `prefers-reduced-motion: reduce` este efecto se puede desactivar.

### Parallax
Solo el numero "47" en la seccion Nosotros usa `data-parallax-speed="-0.18"`. El valor negativo significa que se mueve en direccion contraria al scroll (efecto "float hacia atras"). El calculo usa la posicion relativa al viewport y clampea entre -300 y 300px.

---

## 7. Sistema de Cursor Personalizado

El proyecto tiene DOS sistemas de cursor en paralelo, pero con responsabilidades distintas:

### Sistema 1: cursor.js (neon basico)
- Cursor neon como punto blanco (`#c-dot`) con glow teal.
- Estela en canvas (`#c-canvas`) que interpola teal → purple en 420ms.
- Implementacion minimalista, siempre activa en dispositivos con mouse.
- `cursor.css` oculta el cursor nativo con `cursor: none !important`.

### Sistema 2: Light Cursor en main.js (alta calidad)
- Solo se activa si existe `.light-cursor` en el DOM. En `index.html` no hay `.light-cursor`, por lo tanto este sistema NO esta activo actualmente.
- Esta documentado en el codigo como un cursor "luminoso" de mayor calidad con halo, anillo en orbita, rayos cruzados y 7 trails.
- Detecta contextos interactivos (links, botones, cards) y de texto (inputs, textarea) para cambiar su apariencia.

### Diferencia de z-index
- `#c-canvas`: z-index 99997
- `#c-dot`: z-index 99999
- El light cursor (si estuviera activo): z-index 10000
- Los trails del light cursor: z-index 9999

### Comportamiento en movil
`cursor.css` aplica `cursor: none` universalmente. En dispositivos tactiles esto no tiene efecto practico ya que no hay cursor de sistema operativo.

---

## 8. Sistema de Intro / Loading Screen

### Arquitectura
El sistema de intro usa un enfoque de "canvas + DOM sincronizados":
- Un `<canvas>` de pantalla completa para las particulas y anillos geometricos.
- Elementos HTML sobre el canvas para el logotipo, HUD y barra de progreso.
- Ambas capas se animan de forma independiente pero coordinada por la secuencia de `setTimeout`.

### Canvas de la intro
El canvas dibuja en cada frame:
1. **Particulas (N=55):** Nacen en posiciones aleatorias fuera del centro y convergen hacia posiciones interiores aleatorias. Visibles durante los primeros ~4 segundos con fade-out gradual.
2. **Arcos orbitales:** Dos arcos parciales rotan en sentidos contrarios, con opacidad pulsante controlada por `lockPulse`.
3. **Glow ring:** Anillo completo que pulsa cuando `lockPulse > 0` (evento lock-on).

### Logotipo en la intro
La intro usa dos fuentes diferentes segun la "pasada" final del CSS:
- `#dj-intro .idj`: "DJ" en **Syne 800**, tamano gigante (~9.6rem), gradiente blanco-teal.
- `#dj-intro .icr`: "Create" en **Fraunces italic**, tamano gigante (~10.8rem), gradiente blanco-teal-blue-purple.

Ambos se colocan side-by-side en grid (`grid-template-columns: auto auto; align-items: end`).

### HUD decorativo
La intro simula una interfaz HUD con:
- 4 esquinas SVG (angulos en L) que aparecen con animacion spring.
- Barra superior: "SYS.ACQUIRE · v2.4" / coordenadas GPS Murcia / contador de tiempo.
- Barra inferior: "WEB.DESIGN.3D.STUDIO" / "EST.2024".
- Ticks laterales izquierdo y derecho.
- (En la version final, las barras HUD estan ocultas: `display: none !important`)

### Estados CSS de la intro
La transicion de la intro al sitio usa CSS clip-path poligonal:
```css
/* is-out / fade-out */
0%:   clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)   /* pantalla completa */
38%:  clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%)     /* esquina inferior izq sube */
100%: clip-path: polygon(0 0, 100% 0, 100% 0, 0 16%)        /* wipe hacia arriba */
```

---

## 9. Navegacion y Comportamiento Responsivo

### Navegacion principal
- Todas las anclas con `data-scroll` usan smooth scroll via JS.
- El nav tiene `pointer-events: auto` en todos los elementos.
- En scroll > 60px: fondo mas opaco, posicion mas alta (0.85rem vs 1.4rem).

### Breakpoints responsivos identificados

**css/intro.css (breakpoint 760px):**
- HUD bars: columnas reducidas, ocultar tags secundarios.
- `.idj` y `.icr`: tamanos reducidos con clamp diferente.
- `.is` (stage): cambia de grid 2 columnas a 1 columna centrada.

**css/styles.css:**
El archivo usa `clamp()` extensivamente en lugar de media queries para tipografia y espaciado. Las media queries especificas para el nav, hero content y secciones estan en la parte inferior del archivo (no leida completamente, pero es el patron del proyecto).

### Flujo responsive del nav
En movil (`max-width` aprox. 640px):
- `.nav-links` se oculta (deducido del patron de diseno).
- Solo logo + CTA permanecen visibles.

---

## 10. Paginas Legales

Las tres paginas legales comparten estructura identica. Ninguna usa `intro.js` ni `frames.js`.

### Estructura comun

```html
<head>
  <!-- Mismas fuentes Google que index.html (sin Syne/Bebas Neue) -->
  <!-- Solo css/cursor.css + css/styles.css (sin css/intro.css) -->
</head>
<body>
  <!-- Barra de progreso de lectura -->
  <div class="read-progress">
    <div class="read-progress__bar" id="readProgress"></div>
  </div>

  <!-- Hero legal -->
  <section class="legal-hero">
    <!-- Eyebrow, H1, descripcion, meta (fecha, version, lectura, marco) -->
    <!-- Numero grande decorativo (01, 02, 03) -->
  </section>

  <!-- Cuerpo del documento -->
  <section class="legal-body">
    <div class="legal-body__inner">
      <!-- TOC sticky lateral (indice numerado) -->
      <aside class="legal-toc">...</aside>
      <!-- Contenido del documento -->
      <article class="legal-content">
        <!-- Secciones con § 01, § 02... -->
      </article>
    </div>
  </section>

  <!-- Boton volver -->
  <a href="../index.html" class="legal-back">← Volver al inicio</a>

  <!-- Footer identico al de index.html -->
  <!-- Cookie Banner + Modal (misma logica) -->

  <script src="js/cookies.js"></script>
  <script>/* Ano + barra de progreso + TOC activo */</script>
  <script src="js/cursor.js"></script>
</body>
```

### Barra de progreso de lectura
Script inline al final de cada pagina legal:
- `updateProgress()`: calcula `scrollTop / (scrollHeight - clientHeight)` → ancho de `#readProgress`.
- `updateActive()`: compara `offsetTop` de cada `.legal-section` con `scrollY + 140` para marcar el enlace activo del TOC con clase `is-active`.
- Optimizado con flag `ticking` para no llamar a los updates mas de una vez por frame.

### Detalles de cada documento

**aviso-legal.html (01/03):**
- 8 secciones: Identificacion, Objeto, Acceso, Propiedad intelectual, Enlaces, Responsabilidad, Modificaciones, Legislacion.
- Contiene tarjeta de identificacion (`.legal-id-card`) con campos que tienen `<span class="legal-placeholder">` para datos pendientes de completar (NIF, direccion postal, telefono).
- `meta robots: noindex,follow`.

**politica-privacidad.html (02/03):**
- 11 secciones segun RGPD: Responsable, Datos, Finalidades, Base juridica, Destinatarios, Transferencias, Conservacion, Derechos (8 derechos RGPD), Como ejercerlos, Seguridad, Cambios.
- Incluye callout sobre datos de menores.
- Menciona AEPD con enlace.
- `meta robots: noindex,follow`.

**politica-cookies.html (03/03):**
- 8 secciones: Que son, Tipos, Cookies usadas, Terceros, Consentimiento, Como gestionarlas, Por navegador, Cambios.
- Tabla de cookies con columnas: Identificador, Categoria, Finalidad, Titular, Duracion.
- 4 cookies documentadas: `djc_cookie_consent_v1` (necesaria), localStorage sesion UI (necesaria), `_ga` (analitica, condicional), `_fbp` (marketing, condicional).
- Boton inline `data-cookie-open` para abrir el modal de configuracion directamente desde la pagina.
- Links a documentacion de Google Analytics, Meta Pixel y los 5 navegadores principales.
- `meta robots: noindex,follow`.

---

## 11. Dependencias Externas (Fonts y CDN)

### Google Fonts (2 llamadas en index.html)

**Llamada 1 — Fuentes principales:**
```
Fraunces: ital, opsz 9..144, wght 300..900, SOFT 0..100, WONK 0..1
Geist Mono: wght 400, 500, 600
Geist: wght 300, 400, 500, 600, 700
Syne: wght 800
```
`display=swap` para rendimiento.

**Llamada 2 — Fuentes de la intro:**
```
Bebas Neue (sin peso variable)
Space Grotesk: wght 700
```

**En paginas legales:** Solo la primera llamada (sin Syne ni Space Grotesk/Bebas Neue).

### Descripcion de cada fuente

| Fuente | Tipo | Uso en el proyecto |
|--------|------|-------------------|
| **Fraunces** | Variable display serif | Titulos H1-H4 en todo el sitio, texto "Create" en la intro, precios, `.grad` |
| **Geist** | Sans-serif | Texto de cuerpo, subtitulos, formularios, navegacion |
| **Geist Mono** | Monospace | Eyebrows, tags, metadata, codigo, precio moneda |
| **Syne 800** | Display sans | "DJ" en la intro (texto grande) |
| **Space Grotesk 700** | Display sans | Usado como fallback/alternativa en la intro |
| **Bebas Neue** | Display condensada | Declarada pero uso residual (probablemente de una version anterior) |

### Librerias JavaScript
**Ninguna.** El proyecto no usa jQuery, GSAP, Three.js, ni ninguna libreria externa. Todo es vanilla JS con Canvas API, IntersectionObserver, requestAnimationFrame y Web Animations API.

### Dependencias de produccion / backend
**Ninguna declarada.** El formulario de contacto actualmente solo tiene validacion client-side y muestra un mensaje de exito sin enviar datos a ningun servidor. Para produccion habria que conectarlo a un backend PHP/Node o un servicio como Formspree/EmailJS.

---

## 12. Detalles Tecnicos Adicionales

### Patron de diseño visual
El proyecto sigue una estetica "dark cinematic editorial":
- Fondo casi negro (`#020812`) con variantes de azul muy oscuro.
- Gradiente caracteristico teal (#00F5D4) → blue (#3D9DFF) → purple (#7C3AED).
- Grano filmico simulado (SVG feTurbulence incrustado).
- Tipografia editorial con Fraunces (variable font con ejes opsz, SOFT, WONK).
- Numeros gigantes en fondo como decoracion.

### prefers-reduced-motion
El codigo en `main.js` detecta `window.matchMedia('(prefers-reduced-motion: reduce)')`:
- Si es `true`: no se crean los trail del cursor, los contadores no animan (muestran valor final directamente), el parallax no se activa, el tilt 3D no se activa, los magnetic buttons no se activan.
- Las animaciones CSS tienen `@media (prefers-reduced-motion: reduce)` que desactiva algunas.

### pointer: fine
El codigo detecta `window.matchMedia('(pointer: fine)').matches` para activar:
- El cursor luminoso de alta calidad.
- Los magnetic buttons.
- El tilt 3D en tarjetas.
- El cursor follow en el hero.

### Evento personalizado hero:firstframe
```js
window.dispatchEvent(new CustomEvent('hero:firstframe'))
```
Disparado por `frames.js` cuando el primer frame se carga y dibuja. Escuchado por `main.js` en el handler del `brandIntro` legacy para sincronizar la salida.

### localStorage — djc_cookie_consent_v1
Objeto JSON almacenado:
```json
{
  "version": 1,
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "ts": "2026-01-01T00:00:00.000Z"
}
```
Caduca al limpiar datos del navegador. No tiene TTL propio — el CSS/JS no fuerza expiracion. La politica de cookies dice que dura 12 meses (compromiso legal, no tecnico).

### Evento djc:consent
```js
document.dispatchEvent(new CustomEvent('djc:consent', { detail: payload }))
```
Disparado cada vez que se guarda el consentimiento. Permite que scripts externos (Google Analytics, Meta Pixel) escuchen este evento y se inicialicen solo si tienen permiso.

### API publica window.DjcCookies
```js
window.DjcCookies = {
  load: loadConsent,    // Lee el consentimiento actual
  save: saveConsent,    // Guarda nuevo consentimiento
  clear: clearConsent,  // Borra el consentimiento
  VERSION: 1            // Version actual del esquema
}
```

### Git
El proyecto tiene repositorio git con remote `origin/main`.

### Archivos pendientes de completar (placeholders)
En las paginas legales hay varios campos con clase `.legal-placeholder` que indican datos reales pendientes:
- Nombre completo del titular.
- NIF/CIF.
- Direccion postal completa.
- Numero de telefono real.

---

## 13. Guia Rapida para Desarrolladores

### Agregar un proyecto al portafolio
1. Copiar la plantilla comentada en `index.html` (seccion `#portafolio`).
2. Agregar el archivo MP4 en `assets/portfolio/<slug>.mp4`.
3. Cambiar `href`, `data-url`, `src` del video, tag, titulo y descripcion.
4. Elegir clase de ancho: `portfolio-card--w2` (estrecho), `--w3` (normal), `--w4` (ancho).
5. Borrar los `.portfolio-card--placeholder` cuando haya al menos un proyecto real.

### Cambiar precios de los planes
Editar los `<span>` dentro de `.plan-row__price` en `index.html` (lineas 175-249).

### Conectar el formulario de contacto
El handler esta en `main.js` lineas 118-145. Actualmente hace `form.reset()` y muestra mensaje de exito. Para conectarlo a un backend: dentro del `if (!name || !email || !message)` pasado → hacer `fetch()` al endpoint y manejar la respuesta.

### Cambiar el video del hero
1. Exportar el nuevo video a frames JPG con `extract_frames.py` o equivalente.
2. Nombrar los frames `frame_0000.jpg` ... `frame_XXXX.jpg` en la carpeta `frames/`.
3. Actualizar `TOTAL_FRAMES` en `frames.js`.
4. Ajustar `FADE_START_FRAME`, `FADE_END_FRAME`, `REVEAL_FRAME` segun el nuevo video.

### Activar el cursor luminoso de alta calidad
En `index.html`, agregar justo despues del `<body>`:
```html
<div class="light-cursor">
  <div class="light-cursor__aura"></div>
  <div class="light-cursor__halo"></div>
  <div class="light-cursor__ring"></div>
  <div class="light-cursor__core"></div>
  <div class="light-cursor__ray light-cursor__ray--x"></div>
  <div class="light-cursor__ray light-cursor__ray--y"></div>
</div>
```
El CSS ya esta en `styles.css` y la logica JS en `main.js`.

### Activar Google Analytics
Escuchar el evento `djc:consent` y cargar el script de GA solo si `detail.analytics === true`.
