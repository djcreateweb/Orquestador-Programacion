# Publicación — Giant Barber Studio

Sitio **100 % estático** (HTML + CSS + JS vanilla). No hay paso de build obligatorio.

## Requisitos del hosting

- Servidor **Apache** (aplica `.htaccess`) o **IIS** (aplica `web.config`).
- HTTPS con certificado válido (Let's Encrypt u otro).
- Dominio `giantbarberstudio.es` apuntando al servidor.

## Estructura del despliegue

```
/ (raíz del sitio)
├── index.html                 ← página principal (OBLIGATORIO en raíz)
├── robots.txt                 ← OBLIGATORIO en raíz (crawlers)
├── .htaccess                  ← Apache (OBLIGATORIO en raíz)
├── web.config                 ← IIS (OBLIGATORIO en raíz)
├── .gitignore                 ← Git (OBLIGATORIO en raíz)
├── package.json               ← npm dev (OBLIGATORIO en raíz)
├── Html/                      ← páginas legales (RGPD)
│   ├── aviso-legal.html
│   ├── politica-privacidad.html
│   └── cookies.html
├── Css/                       ← 16 hojas
├── Js/                        ← scripts (con vendor/p5.min.js)
├── Imagenes/
│   ├── Marca/                 (logo, favicon, og-image)
│   ├── Hero/                  (imagen LCP)
│   ├── Equipo/
│   ├── Galeria/
│   ├── Iconos/
│   ├── Servicios/
│   └── _Originales/           (backup local — NO subir a producción)
├── Data/
│   ├── manifest-galeria.json
│   ├── sitemap.xml            (declarado en robots.txt)
│   └── site.webmanifest       (referenciado desde <link rel="manifest">)
└── Docs/                      (README + DEPLOYMENT — NO subir a producción)
```

**Nota:** Los archivos de raíz (`index.html`, `robots.txt`, `.htaccess`, `web.config`, `.gitignore`, `package.json`) son los únicos que no pueden moverse: los servidores y motores de búsqueda los buscan SOLO en la raíz por estándar. Si alguien pide /sitemap.xml o /site.webmanifest (URLs antiguas), hay redirects 301 configurados.

## Archivos que NO se suben a producción

- `Docs/` (README, DEPLOYMENT)
- `Imagenes/_Originales/` (PNGs pesados de backup)
- `package.json` (solo útil para dev con `npx serve`)
- `.gitignore`

Están bloqueados por `hiddenSegments` en `web.config` y por `FilesMatch` en `.htaccess`, pero ahorra ~8 MB subirlos.

## Pasos

1. **Subir archivos** al hosting (`public_html/`, `wwwroot/`, etc.) manteniendo rutas.
2. **Verificar** que `index.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.htaccess`/`web.config` están en la raíz.
3. **DNS**: registros A (o CNAME) al servidor. Registros `www` → redirigir al apex (ya hay regla de reescritura en ambos servidores).
4. **Search Console**: añadir dominio, descomentar `<meta name="google-site-verification">` en `index.html` con el código, enviar `sitemap.xml`.
5. **Smoke test en producción**:
   - WhatsApp → `https://wa.me/34640117415` abre bien.
   - Botón "Reservar" → `reserva-ya.com` accesible.
   - Mapa Google se carga tras aceptar cookies (banner debería aparecer la primera visita).
   - Galería carga vía `Data/manifest-galeria.json`.
   - Consola del navegador sin errores.

## Verificaciones post-despliegue

- **PageSpeed Insights**: https://pagespeed.web.dev/ (objetivo Performance ≥90, LCP <2.5s).
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
- **Security Headers**: https://securityheaders.com/ (objetivo A+).
- **SSL Labs**: https://www.ssllabs.com/ssltest/ (objetivo A+).
- **Schema Validator**: https://validator.schema.org/ — pegar URL, debe detectar `HairSalon` con geo, openingHours, telephone, priceRange.
- **Rich Results Test**: https://search.google.com/test/rich-results

## CSP y cabeceras

Las cabeceras de seguridad (CSP, HSTS, Referrer-Policy, Permissions-Policy, COOP, CORP, X-Frame-Options, X-Content-Type-Options) se sirven **desde el servidor**, no desde el HTML. Están en:

- `web.config` (IIS): sección `<httpProtocol><customHeaders>`
- `.htaccess` (Apache): sección `<IfModule mod_headers.c>`

Si cambias recursos externos (nuevos CDNs, APIs, iframes), actualiza la CSP en AMBOS archivos:

- Scripts externos → `script-src`
- Estilos externos → `style-src`
- Iframes → `frame-src`
- Fetch/XHR → `connect-src`
- Imágenes → `img-src`

## Pendientes antes de publicar

- [ ] Sustituir `Imagenes/Marca/favicon.png` y `apple-touch-icon.png` (son placeholders generados desde el logo; si tienes diseño propio, reemplázalos manteniendo los nombres).
- [ ] Sustituir `Imagenes/Marca/og-image.png` por un diseño de 1200×630 profesional (actual es placeholder).
- [ ] Convertir `Imagenes/Equipo/barbero-antonio.png` a WebP (ahora 1.26 MB PNG → esperado ~120 KB WebP) con `cwebp` o similar.
- [ ] Convertir `Imagenes/Servicios/*.png` a WebP si son pesadas (servicio-corte-pelo.png = 2 MB).
- [ ] Código de Google Search Console en `index.html`.
- [ ] Correo de contacto real en las 3 páginas legales (actualmente placeholder `contacto@giantbarberstudio.es`).

## Comandos útiles en local

```bash
# Servidor de desarrollo
npx --yes serve . -l 8000

# Convertir PNGs a WebP (requiere cwebp instalado)
cwebp -q 82 Imagenes/Equipo/barbero-antonio.png -o Imagenes/Equipo/barbero-antonio.webp
```
