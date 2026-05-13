# Checklist de despliegue — Giant Barber Studio

## Antes de subir al hosting

- [ ] La carpeta `node_modules/` NO se sube (excluida por .gitignore)
- [ ] Carpetas que se suben: `Css/`, `Js/`, `Html/`, `Imagenes/`, `Videos/`, `Data/`, `Docs/`
- [ ] Archivos sueltos que se suben: `index.html`, `resena.html`, `robots.txt`, `sitemap.xml`, `.htaccess`, `web.config`, `README.md`, `.gitignore`

## Subida al hosting (FTP/Panel)

- [ ] Subir todos los archivos a la raíz del dominio
- [ ] Linux distingue mayúsculas: verificar que `Imagenes/` (I mayúscula) existe en el servidor
- [ ] Comprobar que `Css/`, `Js/`, `Html/` (primera letra mayúscula) están correctos
- [ ] Probar https://giantbarberstudio.es en navegador → debe cargar sin errores
- [ ] Probar https://giantbarberstudio.es/resena → debe redirigir a Google reviews
- [ ] DevTools Console → sin errores rojos
- [ ] DevTools Network → todas las requests 200, ninguna 404
- [ ] Probar en móvil real
- [ ] Probar en Chrome + Safari/Firefox

## Post-despliegue SEO

- [ ] Google Search Console → añadir/verificar propiedad giantbarberstudio.es
- [ ] Search Console → Sitemaps → enviar `https://giantbarberstudio.es/sitemap.xml`
- [ ] PageSpeed Insights: https://pagespeed.web.dev → objetivo 90+ móvil y desktop
- [ ] Rich Results Test: https://search.google.com/test/rich-results → validar Schema LocalBusiness
- [ ] Open Graph: https://metatags.io → verificar previsualización redes sociales
- [ ] Verificar QR de /resena escaneando con móvil real
- [ ] Google Business Profile → verificar que el enlace web apunta a https://giantbarberstudio.es

## Mantenimiento

- [ ] Responder reseñas Google semanalmente
- [ ] Subir fotos al perfil de Google Business cada 2 semanas
- [ ] Revisar Search Console mensualmente
- [ ] Actualizar servicios/precios en Data/ cuando cambien
