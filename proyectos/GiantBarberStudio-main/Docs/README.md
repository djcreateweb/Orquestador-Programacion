# Giant Barber Studio

Web estática de la barbería premium en **Murcia** (Calle Paloma 3).

## Contenido

- Hero con tijeras interactivas (imagen + JavaScript)
- Servicios, equipo, galería (manifiesto JSON), reseñas, horario, contacto y mapa
- SEO: metadatos, Open Graph, Twitter Card, JSON-LD (`HairSalon`), `robots.txt`, `sitemap.xml`
- Apache: `.htaccess` (compresión, caché, cabeceras, HTTPS). IIS: `web.config`

## GitHub Pages

Repositorio: [github.com/djcreateweb/GiantBarberStudio](https://github.com/djcreateweb/GiantBarberStudio).

Tras publicar en la rama `main`, la web quedará en:

**https://djcreateweb.github.io/GiantBarberStudio/**

En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama **`main`**, carpeta **`/` (root)**, y guardar.

Las rutas del sitio son relativas (sin `/` al inicio), así que encajan en esa URL base.

## Puesta en marcha local

```bash
npm start
```

O: `npx serve .`

## Antes de publicar

1. Sustituye la URL canónica y `og:url` si tu dominio no es `giantbarberstudio.es`.
2. Añade la meta **Google Search Console** en `index.html` cuando la verifiques.
3. Sustituye los placeholders en **`Imagenes/Marca/favicon.png`** y **`Imagenes/Marca/apple-touch-icon.png`** por los iconos definitivos.
4. Sustituye **`Imagenes/Marca/og-image.png`** (1200×630) por un diseño profesional.
5. En local sin HTTPS, comenta la regla de redirección en `.htaccess` / `web.config` si te impide probar.
6. Consulta `Docs/DEPLOYMENT.md` para el detalle completo del despliegue.

## Contacto del negocio

- Teléfono / WhatsApp: +34 640 117 415  
- Instagram: @giantbarberstudio  
- Reservas: enlace en la web a reserva-ya.com  

© Giant Barber Studio.
