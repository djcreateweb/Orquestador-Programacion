// ── CONFIGURACIÓN ─────────────────────────────────────────
const TOTAL_FRAMES = 114;        // Frames 0000–0113 — los frames 114–120 no se usan
const FRAMES_PATH = "frames/";   // Ruta a la carpeta de frames (relativa a index.html)
const FRAME_PREFIX = "frame_";   // Prefijo del nombre de cada frame
const FRAME_EXT = ".jpg";        // Extensión de los frames
const FRAME_DIGITS = 4;          // Dígitos del número: frame_0001.jpg
// ──────────────────────────────────────────────────────────

const canvas = document.getElementById("frameCanvas");
const ctx = canvas.getContext("2d");
const hero = document.getElementById("hero");
const heroContent = document.getElementById("heroContent");
const heroLoader = document.getElementById("heroLoader");
const heroProgress = document.getElementById("heroProgress");
const heroFadeout = document.getElementById("heroFadeout");

const frames = [];
let loadedCount = 0;
let firstFrameDrawn = false;

function padNumber(n, digits) {
  return String(n).padStart(digits, "0");
}

function getFramePath(index) {
  return `${FRAMES_PATH}${FRAME_PREFIX}${padNumber(index, FRAME_DIGITS)}${FRAME_EXT}`;
}

function preloadFrames() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
      loadedCount++;
      const pct = (loadedCount / TOTAL_FRAMES) * 100;
      if (heroProgress) heroProgress.style.width = pct + "%";

      if (!firstFrameDrawn && i === 0) {
        resizeCanvas();
        drawFrame(0);
        firstFrameDrawn = true;
        window.dispatchEvent(new CustomEvent('hero:firstframe'));
      }

      if (loadedCount === TOTAL_FRAMES && heroLoader) {
        heroLoader.classList.add("hidden");
      }
    };
    frames[i] = img;
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}

function drawFrame(index) {
  const i = Math.min(Math.max(index, 0), TOTAL_FRAMES - 1);
  const img = frames[i];
  if (!img || !img.complete || !img.naturalWidth) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cover — equivalente a CSS object-fit: cover
  const scale = Math.max(
    canvas.width / img.naturalWidth,
    canvas.height / img.naturalHeight
  );
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

// ── SCROLL DRIVEN ──────────────────────────────────────────
let targetFrame = 0;
let currentFrame = 0;
let rafId = null;

// Frame en el que arranca el tapado y frame en el que ya está completo.
// El texto baked-in del vídeo aparece a partir del frame 102, por eso
// el overlay debe estar 100% opaco a tiempo para taparlo.
const FADE_START_FRAME = 102;
const FADE_END_FRAME = 110;
const REVEAL_FRAME = 108; // cuándo aparece el hero-content
const FADE_START_PROG = FADE_START_FRAME / (TOTAL_FRAMES - 1);
const FADE_END_PROG   = FADE_END_FRAME / (TOTAL_FRAMES - 1);
const REVEAL_PROG     = REVEAL_FRAME / (TOTAL_FRAMES - 1);

function onScroll() {
  const scrollTop = window.scrollY;
  const heroHeight = hero.offsetHeight - window.innerHeight;
  const progress = Math.min(Math.max(scrollTop / heroHeight, 0), 1);

  targetFrame = progress * (TOTAL_FRAMES - 1);

  if (progress > REVEAL_PROG) {
    heroContent.classList.add("visible");
  } else {
    heroContent.classList.remove("visible");
  }

  // Fadeout que tapa el texto baked-in del vídeo.
  // Empieza en el frame 102, queda totalmente opaco en el frame 110.
  if (heroFadeout) {
    const fade = Math.min(Math.max((progress - FADE_START_PROG) / (FADE_END_PROG - FADE_START_PROG), 0), 1);
    heroFadeout.style.opacity = fade.toFixed(3);
  }

  if (!rafId) rafId = requestAnimationFrame(animate);
}

function animate() {
  // Easing suave hacia el frame objetivo
  currentFrame += (targetFrame - currentFrame) * 0.18;
  drawFrame(Math.round(currentFrame));

  if (Math.abs(targetFrame - currentFrame) > 0.05) {
    rafId = requestAnimationFrame(animate);
  } else {
    currentFrame = targetFrame;
    drawFrame(Math.round(currentFrame));
    rafId = null;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  drawFrame(Math.round(currentFrame));
});

preloadFrames();
