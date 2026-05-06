import cv2
import os

# ── CONFIGURACIÓN ──────────────────────────────────────────
VIDEO_PATH = "video.mp4"       # Pon aquí el nombre de tu vídeo
OUTPUT_DIR = "frames"          # Carpeta donde se guardarán los frames
FRAME_FORMAT = "frame_{:04d}.jpg"  # Nombre de cada frame: frame_0001.jpg
QUALITY = 95                   # Calidad JPG (0-100), 95 es óptimo
STEP = 2                       # Guarda 1 de cada N frames (2 = la mitad)
# ───────────────────────────────────────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)

print(f"📹 Vídeo: {VIDEO_PATH}")
print(f"🎞️  Total frames: {total_frames}")
print(f"⚡ FPS: {fps}")
print(f"⏱️  Duración: {total_frames/fps:.2f} segundos")
print(f"📁 Guardando en: {OUTPUT_DIR}/")
print("─" * 40)

count = 0      # frames leídos del vídeo
saved = 0      # frames guardados a disco
while True:
    ret, frame = cap.read()
    if not ret:
        break
    if count % STEP == 0:
        filename = os.path.join(OUTPUT_DIR, FRAME_FORMAT.format(saved))
        cv2.imwrite(filename, frame, [cv2.IMWRITE_JPEG_QUALITY, QUALITY])
        saved += 1
        if saved % 10 == 0:
            print(f"✅ Frame {saved} (leídos {count}/{total_frames})")
    count += 1

cap.release()
print("─" * 40)
print(f"✅ Completado: {saved} frames extraídos en /{OUTPUT_DIR} (1 de cada {STEP})")
