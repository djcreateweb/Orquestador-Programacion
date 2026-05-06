# ESTADO.md — ValoSense

> Estado tras sesión larga de pulido, diseño, SEO y rendimiento (2026-04-20 · pase 4).

## ✅ Qué está terminado

**Funcionalidad core** completa: auth, matchmaker, lineups, training, team, chat, amistad (solicitudes + amigos), perfil, ajustes, admin.

**Base de datos** consolidada en un único `sql/valosense.sql` (192 KB, 11 tablas, 275 lineups, 45 videos, 123 meta, 19 usuarios, 17 mensajes demo).

**UX/Diseño**
- Navbar: Solicitudes + Amigos separados, línea activa al ras del texto, contadores cacheados (TTL 30 s).
- Post-login → matchmaker · logout → inicio.
- Cursor crosshair Valorant global (rojo sobre interactivos, kick al click, no se reinicia al cambiar pestaña).
- Hero-orbs estilo AimLab en cada página.
- Tilt 3D, count-up, botones magnéticos, back-to-top, tooltips didácticos.
- Buscadores tematizados por sección (rojo, verde, ámbar, cian) con relief común.
- Divisores `.section-divider` numerados entre zonas en home/lineup/matchmaker.
- Tarjetas de jugador con gradiente borde + mini-stats coloreadas (K/D cian, WR verde, HS ámbar).
- Flujo lineup: mapa → agent-picker → "Ver lineups" → resultados, con role-pills coloreadas por rol.

**Seguridad aplicada**
- Prepared statements, CSRF en todos los forms POST mutantes, `password_hash`/`password_verify`, `session_regenerate_id(true)`, whitelist de controladores, `safe_redirect()`, `safe_http_url()`, CSP endurecida (`frame-ancestors`, `form-action`, `base-uri`, `object-src`).
- **Confirms migrados a `data-confirm`** (CSP bloqueaba onclick/onsubmit inline — eliminar cuenta podía dispararse sin confirmación).
- `sql/_gen_descripciones.php` ya eliminado + `sql/.htaccess` deny.

**Rendimiento aplicado**
- `get_resumen_amigos` de 5 subqueries a 1 JOIN derivado.
- N+1 matchmaker resuelto con `get_relaciones_lote()`.
- Polling chat con `visibilitychange`.
- Contadores navbar cacheados en sesión.
- `.htaccess` con gzip + expires.
- Cache-busting en CSS/JS con `?v=<mtime>`.
- `will-change` on-demand (hover) en tilt-card.
- Hero-orbs no arranca rAF si reduced-motion + sin orbs.

**SEO**
- `page_meta()` en todos los controllers (incluidos home, explorar, usuario, perfil).
- Canonical dinámico por controller (lineup incluye filtros mapa/agente).
- robots.txt + sitemap.xml (con rewrite), incluye training + team + lastmod.
- JSON-LD `VideoObject` en listado de lineups (thumbnail válido, sin uploadDate falso).
- OpenGraph + Twitter Cards completos.

## 🟡 Pendientes opcionales (no críticos)
- **Imágenes de mapas**: 31 MB en PNG → convertir a WebP (→ ~3 MB).
- **`styles.css` ~138 KB**: split + critical-CSS inline.
- **CSP sin `unsafe-inline`** en `style-src`: requiere migrar `element.style = …` a clases.
- **Rate limiting** en login (5 intentos por IP).
- **Credenciales DB en `.env`** para despliegue fuera de XAMPP.
- **Testimonios / prueba social** en home.
- **URLs bonitas** por lineup individual (requiere nueva vista + rewrite).
- **Refactor JS**: cache de gradientes en hero-orbs (480 `createRadialGradient`/s actualmente).

## Referencias internas
- `DOCUMENTACION.md` — historial completo de sesiones.
- `sql/README.md` — BD y restauración.
- `README.md` — stack, credenciales, arquitectura.
