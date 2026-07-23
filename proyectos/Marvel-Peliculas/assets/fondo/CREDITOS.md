# Créditos y procedencia — assets/fondo

Imágenes recopiladas para componer un fondo web con estética "Vengadores: Endgame"
(difuminado, tonos lila/púrpura + azul).

> **Uso**: showcase personal / no comercial. Varias imágenes son obras protegidas
> por copyright y/o marcas registradas de Marvel Studios / The Walt Disney Company.
> No aptas para uso comercial sin licencia. Las fotografías con licencia Creative
> Commons requieren atribución (y compartir-igual) si se redistribuyen.

---

## 1. `endgame-backdrop.jpg` — backdrop principal
- **Qué es**: arte promocional de *Avengers: Endgame* (Iron Man / Thor / Capitán
  América sobre fondo negro con violeta y azul intenso, rostro de Thanos en sombra).
- **Resolución**: 2560 × 1440 px · 894 KB · JPEG
- **Fuente**: The Movie Database (TMDB), película *Avengers: Endgame* (id 299534).
  - Página: https://www.themoviedb.org/movie/299534-avengers-endgame/images/backdrops
  - Archivo: https://image.tmdb.org/t/p/original/9wXPKruA6bWYk2co5ix6fH59Qr8.jpg
- **Derechos**: © Marvel Studios / Walt Disney Pictures. TMDB actúa solo como CDN.

## 2. `endgame-backdrop-2.jpg` — backdrop secundario
- **Qué es**: arte de *Avengers: Endgame* sobre nebulosa espacial azul/púrpura
  (reparto completo, tono más frío y "cósmico").
- **Resolución**: 3840 × 2160 px (4K) · 2,17 MB · JPEG
- **Fuente**: TMDB, misma película.
  - Archivo: https://image.tmdb.org/t/p/original/orjiB3oUIsyz60hoEqkiGpy5CeO.jpg
- **Derechos**: © Marvel Studios / Walt Disney Pictures.

## 3. `avengers-logo.svg` / `avengers-logo.png` — logotipo (la "A")
- **Qué es**: símbolo de Los Vengadores (la "A" con la flecha dentro del círculo).
- **`avengers-logo.svg`**: vector original, relleno negro, recolorable por CSS
  (191 × 223 nominal · 2,5 KB).
- **`avengers-logo.png`**: versión rasterizada y **recoloreada a blanco** con canal
  alfa transparente, lista para fondos oscuros (1920 × 2243 px · 88 KB).
- **Fuente**: Wikimedia Commons —
  https://commons.wikimedia.org/wiki/File:Symbol_from_Marvel%27s_The_Avengers_logo.svg
- **Licencia**: Dominio público en cuanto a copyright (logo por debajo del umbral de
  originalidad). **Es una marca registrada** de Marvel Studios / Walt Disney Pictures:
  el uso de marca sigue restringido a contextos no comerciales / editoriales.

## 4. `stark-tower.jpg` — Torre Stark (SUSTITUCIÓN)
- **Nota de sustitución**: la Torre de los Vengadores / Stark Tower es un edificio
  **ficticio**; no existe una foto real con licencia limpia. Se sustituye por un
  **skyline nocturno de Midtown Manhattan (Nueva York)**, que evoca el mismo entorno
  urbano nocturno y encaja como capa de profundidad.
- **Qué es**: skyline de Nueva York de noche (formato panorámico horizontal).
- **Resolución**: 3496 × 1223 px · 2,90 MB · JPEG · *Featured Picture* de Commons.
- **Fuente**: Wikimedia Commons —
  https://commons.wikimedia.org/wiki/File:New_York_Midtown_Skyline_at_night_-_Jan_2006_edit1.jpg
- **Autor / Licencia**: David Iliff (Diliff) · **CC BY-SA 3.0**.
  Atribución requerida: *"NYC Midtown skyline — David Iliff, CC BY-SA 3.0"*.

## 5. `energia.png` — rayo / energía (capa transparente)
- **Qué es**: rayo ramificado blanco-azul sobre cielo violeta, procesado a **PNG con
  transparencia**: el canal alfa se derivó de la luminancia del original, de modo que
  el cielo se vuelve transparente y solo queda el rayo + su resplandor. Compone
  directamente sobre cualquier fondo (o con `mix-blend-mode: screen`).
- **Resolución**: 1920 × 1493 px · RGBA · 3,14 MB.
- **Fuente (original)**: Wikimedia Commons / Flickr — foto "Irix Lightning" de *Kurayba* —
  https://commons.wikimedia.org/wiki/File:Irix_Lightning_-_Flickr_-_Kurayba.jpg
- **Autor / Licencia**: Kurayba (Flickr) · **CC BY-SA 2.0**.
  Atribución requerida y **share-alike** (obra derivada bajo la misma licencia):
  *"Rayo derivado de 'Irix Lightning' © Kurayba, CC BY-SA 2.0"*.

---

## Recomendación de uso por capas
1. **Base difuminada**: `endgame-backdrop.jpg` (más oscuro y contrastado) o
   `endgame-backdrop-2.jpg` (más azul/frío). Aplicar `filter: blur()` + oscurecido
   y un degradado púrpura encima para legibilidad del texto.
2. **Profundidad urbana**: `stark-tower.jpg` como banda inferior tenue (baja opacidad,
   `mix-blend-mode` o máscara de degradado hacia arriba).
3. **Acento de energía**: `energia.png` como capa superior puntual (`mix-blend-mode:
   screen` o `lighten`, opacidad parcial) para chispazos de luz.
4. **Marca de agua**: `avengers-logo.png` (blanco) o `avengers-logo.svg` (recoloreable
   a púrpura/blanco) como marca discreta en una esquina, baja opacidad.
