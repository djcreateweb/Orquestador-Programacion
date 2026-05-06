# DJ Create 3D

Web cinematográfica de la agencia **DJ Create** (Murcia · ES) — diseño dark editorial con hero scroll-driven sobre 121 frames de vídeo, animaciones cinematográficas y secciones diferenciadas estilo terminal-industries.

🌐 **Live**: arranca el servidor local (ver "Cómo correrlo" abajo)
🔗 **Repo**: https://github.com/djcreateweb/Djcreateweb3D

---

## Stack

- **HTML5** semántico
- **CSS3** moderno: variables, `@property`, `:has()`, `backdrop-filter`, `font-variation-settings`
- **JavaScript vanilla** — sin frameworks, sin librerías
- **Fonts**: Fraunces (variable serif, axes opsz/SOFT/WONK) · Geist · Geist Mono — vía Google Fonts
- **Python + OpenCV** solo para el preprocesado del vídeo a frames

Sin build step. Sin dependencias runtime. Servir archivos estáticos y ya.

---

## Estructura

```
DjCreate3D/
├── index.html              → Página completa
├── css/
│   └── styles.css          → Estilos (~1700 líneas)
├── js/
│   ├── frames.js           → Scroll-driven canvas + fadeout overlay
│   └── main.js             → Nav, smooth scroll, reveals, parallax,
│                             magnetic buttons, tilt 3D, contadores,
│                             split-text, form
├── extract_frames.py       → Extrae frames de video.mp4 → frames/
├── .gitignore              → Excluye frames/ y *.mp4 (pesados)
└── README.md
```

**No incluido en el repo** (regenerable con el script):
- `video.mp4` — vídeo fuente (~26 MB)
- `frames/` — 121 JPGs extraídos (~120 MB)

---

## Cómo correrlo en local

### 1. Clonar

```bash
git clone https://github.com/djcreateweb/Djcreateweb3D.git
cd Djcreateweb3D
```

### 2. Generar los frames

Pon tu vídeo como `video.mp4` en la raíz del proyecto y ejecuta:

```bash
pip install opencv-python
python extract_frames.py
```

El script crea `frames/frame_0000.jpg` … `frame_0120.jpg` (1 de cada 2 frames del vídeo original — ajusta `STEP` en el script si quieres más/menos).

### 3. Servidor estático

`file://` no funciona porque el canvas necesita CORS para los frames. Usa cualquier servidor:

```bash
# Python
python -m http.server 5500

# Node (si tienes npx)
npx serve

# VS Code: extensión "Live Server"
```

Abre http://localhost:5500.

---

## Configuración de los frames

Si cambias el número de frames, edita `js/frames.js`:

```js
const TOTAL_FRAMES = 121;        // Total de archivos en frames/
const FRAMES_PATH = "frames/";   // Ruta relativa a index.html
const FRAME_PREFIX = "frame_";
const FRAME_EXT = ".jpg";
const FRAME_DIGITS = 4;          // frame_0000.jpg

// Cuándo arranca el overlay que tapa el texto baked-in del vídeo
const FADE_START_FRAME = 102;
const FADE_END_FRAME = 110;
const REVEAL_FRAME = 108;        // Cuándo aparece el hero-content
```

---

## Diseño

### Paleta

| Variable | Valor | Uso |
|---|---|---|
| `--bg-tier-1` | `#04060F` | Fondo base (hero, proceso, nosotros, footer) |
| `--bg-tier-2` | `#07091A` | Fondo alterno (servicios, portafolio, contacto) |
| `--accent` | `#00F5D4` | Teal — links, eyebrows, hovers |
| `--accent2` | `#7C3AED` | Púrpura — gradientes |
| `--lime` | `#C8FF3D` | CTA del nav |

### Tipografía

- **Display**: Fraunces variable (axes `opsz`, `SOFT`, `WONK`) — palabras destacadas en italic + WONK on
- **Body**: Geist — moderno, neutro, métricas afinadas
- **Tech accents**: Geist Mono — eyebrows, precios, números, footer

### Secciones (alternancia bg + ancho + layout)

1. **Hero** (tier-1, full-bleed) — canvas scroll-driven sobre 121 frames + fadeout overlay sobre los últimos
2. **Servicios** (tier-2, 1280) — bento asimétrico: Plan Avanzado 2×2, Básico/3D 1×1, Plan Tienda full-row
3. **Proceso** (tier-1, 1480) — timeline horizontal con línea conectora teal→púrpura y dots iluminables
4. **Portafolio** (tier-2, 96vw) — grid editorial 6col, w2/w3/w4, tilt 3D al hover
5. **Nosotros** (tier-1, split 320/1fr) — sticky aside + "47" stroke gigante con parallax
6. **Contacto** (tier-2, split 60/40) — form ancho con floating labels + aside con info
7. **Footer** (tier-1) — créditos sobrios

Separadores entre secciones rotando 3 estilos: `divider-haze` (nebulosa), `divider-tech` (mono caps "+ 02 — proceso"), `divider-scanline` (línea con dot pulsante).

### Motion

- **Reveal on scroll** con variantes (`-up`, `-fade`, `-blur`, `-scale`, `-clip`) y stagger por hijo via CSS custom properties
- **Split-text**: walker recursivo que tokeniza palabras preservando `<br>` y `.grad` (background-clip:text intacto)
- **Contadores**: stats de "+50 / 5★ / 7 días" con easeOutCubic
- **Líneas que se dibujan**: timeline connector (1.6s scaleX), hairline `has-rule` bajo cada section-title
- **Parallax**: el "47" gigante de Nosotros con `data-parallax-speed="-0.18"` (un solo rAF compartido)
- **Magnetic buttons**: `.btn-main` y `.nav-cta` siguen al cursor en pointer fino
- **Tilt 3D**: portfolio cards con perspective 900px, rotate ±5°
- **Borde conic-gradient rotatorio** en plan destacado vía `@property --feature-angle`
- **Form floating labels** con `:has(input:focus)` + success state con check SVG

Todo respeta `prefers-reduced-motion`.

---

## Performance

- Sin build, sin frameworks → ~80 KB de código (HTML + CSS + JS) sin contar fonts
- Canvas pinta con `devicePixelRatio` y `object-fit: cover` calculado en JS
- Frames se precargan con barra de progreso visible
- Easing rAF en el scroll para que el frame "alcance" el target sin saltos
- Un solo listener `scroll` para el parallax (rAF gated)

---

## Contacto

📧 [djcreateweb@gmail.com](mailto:djcreateweb@gmail.com)
📍 Murcia, España

---

## Licencia

Código del proyecto: uso interno DJ Create. Fonts vía Google Fonts (OFL). Vídeo y frames propiedad del cliente — no se incluyen en el repo público.
