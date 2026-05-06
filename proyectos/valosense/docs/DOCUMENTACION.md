# DOCUMENTACION.md — ValoSense

Registro de sesiones de trabajo. Sesiones más recientes arriba.

## Índice
- [2026-04-20 (4) — Pase largo: diseño, SEO, rendimiento, efectos 3D](#s-2026-04-20-4)
- [2026-04-20 (3) — Consolidación SQL a un único dump](#s-2026-04-20-3)
- [2026-04-20 (2) — Aplicación de fixes de la auditoría](#s-2026-04-20-2)
- [2026-04-20 — Chat enriquecido, navbar, seeds y auditoría](#s-2026-04-20)

---

## Sesión: 2026-04-20 (4) — Pase largo: diseño, SEO, rendimiento, efectos 3D {#s-2026-04-20-4}

### Objetivo
Sesión extensa de pulido con auditoría paralela (6 agentes) + aplicación de arreglos críticos, UX, SEO y rendimiento.

### Nuevas funcionalidades
**Interacción / efectos**
- **Cursor crosshair de Valorant** (`js/main.js` + `css/styles.css`): mira compacta (5 px líneas + gap 4 px + punto 2 px) con color cian, rojo sobre elementos interactivos, "kick" al pulsar (scale 1.6× del dot + líneas se separan 5 px). No se reinicia al cambiar de pestaña. Respeta `prefers-reduced-motion` y touch.
- **Hero-orbs estilo AimLab** (`js/hero-orbs.js` + canvas por hero): 8 orbs cian/rojo que rebotan, se rompen al click con partículas. Pausan con `visibilitychange`. Con reduced-motion + sin orbs restantes, el rAF ni arranca.
- **Tilt 3D** en `.tilt-card` con `--rx/--ry` por pointer. `will-change` solo en `:hover` (evita GPU layers permanentes en listas largas).
- **Botones magnéticos** `.btn-magnetic` (hero CTAs).
- **Count-up** en hero stats via `data-count-up` + IntersectionObserver.
- **Back-to-top** flotante tras 400 px.

**Diseño**
- **`.section-divider`**: nuevo componente con línea HUD cian→rojo + píldora eyebrow numerada (`// 01 · MAPA`, `// 02 · AGENTE`, `// 03 · RESULTADOS`). Aplicado en home, lineup y matchmaker.
- **Tarjeta de jugador** reforzada: gradiente cian→rojo en top border, hover con sombra roja + cyan inset, mini-stats K/D (cian) · WR (verde) · HS (ámbar) con glow.
- **Buscador matchmaker tematizado**: esquinas HUD, bullets `▸` coloreados por filtro (rojo/cian/ámbar), botón con shimmer diagonal, halo rojo en focus.
- **Buscadores por sección con tema fijo** (amistad verde, vincular ámbar, training cian, enviar rojo+ámbar) — relief común con inset shadows.
- **Agentes favoritos** (perfil): ligeramente más grandes (avatar 82 px), role-color variable por rol, glow del rol al hover.
- **Role-pills en lineup** (Duelista / Iniciador / Controlador / Centinela) que se iluminan con el color del rol al hover o seleccionar un agente.

**Flujo lineup**
- Click mapa → baja a `#agent-picker`.
- Click agente → `data-keep-scroll` mantiene posición exacta.
- Botón CTA "Ver lineups" → baja suave a `#resultados` con contador de lineups filtrados.

**Amistad**
- Navbar dividido: "Solicitudes" (home, con badge) y "Amigos" (amigos, nueva vista `amistad_amigos_view.php` con CTA "Mensaje").

### Arreglos críticos y altos
**🔴 Crítico**
- Confirms `onclick`/`onsubmit` en `ajustes_view.php` eliminados (los bloqueaba CSP `script-src 'self'`): eliminar amigo + eliminar cuenta migrados a `data-confirm="..."` gestionado por `js/main.js`. Antes, "eliminar cuenta" disparaba sin confirmación.

**🟠 Alto**
- Breadcrumb y empty-state de `chat_view.php` apuntaban a `amistad&action=home` como "Amigos" → actualizado a `action=amigos`.
- Hero CTAs rotos: `matchmaker#how-it-works` (inexistente) → `#search`; `lineup#search` (solo existe con filtros) → `#agent-picker`.
- `.htaccess` con rewrite `sitemap.xml` → controlador, antes el `robots.txt` declaraba `/sitemap.xml` pero daba 404.
- Lineup canonical ahora incluye filtros (mapa/agente_id) — cada combinación tiene su propia URL indexable.
- Sitemap amplía training + team + `<lastmod>` + detección HTTPS correcta.
- JSON-LD `VideoObject` del listado: elimina `uploadDate=date('c')` (Google lo marcaba inválido), `continue;` cuando no hay video_id (thumbnailUrl válido), usa `creado_en` si existe.
- `page_meta()` añadido a: home (canonical estable), explorar, usuario.home/login/registro/gestionar/vincular/ajustes, perfil.ver (todos con `robots: noindex,nofollow` excepto home/explorar/lineup/training/team).
- `twitter:image` añadido en index.php head.

**🟡 Medio**
- `.hero::before` y `.hero::after` (dos blobs decorativos blur 40 px) eliminados (generaban "dos círculos blancos" al scrollear sobre el hero).
- `.ripple` (círculo blanco en click de botones) eliminado — se confundía con estela.
- `mix-blend-mode: screen` del crosshair removido (halos sobre canvas).
- `.hero::after` cursor-glow removido (estela al bajar el ratón).
- Ripple, cursor-glow y sus keyframes borrados del CSS.

### Archivos relevantes
- Creados: `js/hero-orbs.js`, `view/amistad_amigos_view.php`, `controller/sitemap_controller.php`, `robots.txt`, `.htaccess` (con gzip + expires + rewrite), `sql/valosense.sql` (dump único).
- Cache-busting `?v=<filemtime>` aplicado en `index.php` a `styles.css` y `main.js`.
- Marcador `<!--VS_HEAD_MARKER-->` sustituido al final del buffer con title/description/canonical/OG/Twitter/JSON-LD.
- Divisores `.section-divider` aplicados en home (3), lineup (3), matchmaker (2).

### Pendientes opcionales (quedaron documentados pero no aplicados)
- Convertir PNGs de `imagenes/mapas/` a WebP (31 MB → ~3 MB).
- Split/critical-CSS de `styles.css` (138 KB).
- CSP sin `'unsafe-inline'` en `style-src` (requiere mover `element.style = …` de main.js a clases).
- Rate limiting en login (5 intentos/IP).
- Testimonios/social proof en home.
- Credenciales DB en `.env` para despliegue fuera de XAMPP.

### Verificación
- `php -l` sobre todos los archivos modificados → clean.
- Todos los controllers ahora emiten `page_meta()` explícito.
- Runtime smoke tests en rutas principales → sin warnings ni notices.

---

## Sesión: 2026-04-20 (3) — Consolidación SQL a un único dump {#s-2026-04-20-3}

### Objetivo
Reducir la carpeta `sql/` a un solo archivo consolidado y eliminar redundancia.

### Regla permanente añadida (memoria del orquestador)
- `feedback_db_autoapply.md` ampliado: **todo `.sql` nuevo se crea siempre en `ValoSense/sql/`**, nunca en la raíz ni en otras subcarpetas. Si aparece uno fuera, moverlo.

### Movimientos antes de consolidar
3 `.sql` detectados en la raíz del proyecto (aplicados ya a la BD real) → movidos a `sql/`:
- `agente_mapa_meta_v2.sql` (reconstrucción de 123 filas de `agente_mapa_meta`).
- `migracion_riot_visible.sql` (columna `usuario.riot_id_visible`).
- `seed_chat_ejemplo.sql` (17 mensajes demo entre usuarios 20↔8).

### Consolidación
`mysqldump` de la BD real `valosense` (MySQL 3307) con `--add-drop-table --single-transaction --skip-dump-date --skip-comments --routines --triggers`. Salida a `sql/valosense.sql` (192 KB, 11 tablas, 9 INSERT masivos). Cabecera manual prependida con `CREATE DATABASE IF NOT EXISTS valosense ...` + `USE valosense`.

### Archivos eliminados (redundantes, ya contenidos en `valosense.sql`)
- `agente_mapa_meta_v2.sql`
- `backup_entrenamiento_video_mojibake.sql` (histórico con mojibake)
- `migracion_descripciones.sql`
- `migracion_presencia.sql`
- `migracion_riot_id_mensaje.sql`
- `migracion_riot_visible.sql`
- `migracion_videos.sql`
- `seed_chat_ejemplo.sql`
- `seed_lineups.sql`
- `seed_lineups_v2.sql`
- `seed_users.sql`
- `_gen_descripciones.php` (generador ya no relevante con dump consolidado)

### Estado final `sql/`
```
sql/
├── README.md        (cómo restaurar + cómo regenerar el dump)
└── valosense.sql    (esquema + datos completos)
```

### Contenido verificado en el dump
- 11 tablas (agente, agente_favorito, agente_mapa_meta, amistad, entrenamiento_opcion, entrenamiento_video, lineup, mensaje, rutina, solicitud_equipo, usuario).
- 275 lineups con descripciones únicas.
- 123 filas de `agente_mapa_meta` con tiers S/A/B.
- 45 vídeos de entrenamiento.
- 19 usuarios de prueba.
- 17 mensajes demo (tipos `text`, `discord_link`, `discord_id`, `riot_id`, `valorant_code`).
- ENUM `mensaje.tipo` con `riot_id`. Columnas `riot_id_visible` y `estado_presencia` presentes en `usuario`.

### Cómo restaurar
```bash
"C:/xampp/mysql/bin/mysql.exe" -h 127.0.0.1 -P 3307 -u root < sql/valosense.sql
```

---

## Sesión: 2026-04-20 (2) — Aplicación de fixes de la auditoría {#s-2026-04-20-2}

### Objetivo
Resolver en una tanda todos los hallazgos de la auditoría por orden de prioridad (crítico → alto → medio → bajo).

### Archivos creados
| Archivo | Propósito |
|---|---|
| `.htaccess` (raíz) | gzip + cache expires + bloqueo de .env/.sql/.bak/dotfiles |
| `sql/.htaccess` | `Require all denied` sobre la carpeta de scripts SQL |
| `robots.txt` | Bloquea `/sql/` y referencia `sitemap.xml` |
| `controller/sitemap_controller.php` | Endpoint dinámico `?controlador=sitemap&action=xml` |

### Fixes aplicados (por prioridad)

**🔴 Crítico**
- `sql/_gen_descripciones.php` ahora aborta con `404` si no se ejecuta por CLI. Además `sql/.htaccess` bloquea toda la carpeta.

**🟠 Alto**
- Nuevo helper `safe_redirect($url, $fallback)` en `model/helpers.php` que exige rutas relativas a `index.php`. Aplicado en `amistad_controller::invitar()` y `_amistad_cambiar_estado()`.
- `view/menu.php`: `nav_active()` con `if(!function_exists(...))` para evitar redeclaración si menu.php se incluye dos veces.
- `view/chat_view.php`: el `(int)end($mensajes)['id']` extraído a variable `$ultimo_msg_id`.
- `js/chat.js::renderMessage()`: timestamp sólo se añade si `m.creado_en` existe y `new Date()` no devuelve NaN.
- `model/usuario_model.php::comprobar_unicidad()` devuelve `['campo'=>'username'|'email']` o `false` — el controller lo lee correctamente.
- `controller/chat_controller.php::enviar()` valida `$_POST['tipo']` contra whitelist antes de autodetect.
- `js/auth.js`: validación cliente de contraseña elevada a ≥8 chars.
- `js/training.js`: guard `if(!btn) return` antes de `classList.add`.
- `controller/usuario_controller.php::flash()` normaliza aliases (`error`→`err`, `success`→`ok`…).
- `view/lineup_view.php:205-206` y `view/training_view.php:163`: `video_url` pasa por `safe_http_url()`.
- Stack traces: `RuntimeException($e->getMessage())` reemplazado por `error_log($e->getMessage())` + mensaje genérico, en `usuario_model.php`, `matchmaker_model.php`, `conectar.php`.
- `index.php` CSP endurecido con `frame-ancestors 'self'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`, `connect-src 'self'`. Se amplía `img-src` con `https://img.youtube.com` para los thumbnails de JSON-LD.
- `js/chat.js`: `setInterval` envuelto en `visibilitychange` — pausa cuando la pestaña no está visible.
- `controller/matchmaker_controller.php`: sustituido el loop N+1 de `get_relacion` por `Amistad_model::get_relaciones_lote($me, $ids)` — una sola query con `IN (...)`.
- `model/chat_model.php::get_resumen_amigos`: 5 subqueries correlacionadas → 1 join a subconsulta derivada (`GROUP BY otro_id` sobre `MAX(id)`) + 1 LEFT JOIN al count de unread.
- **SEO**: `page_meta([...])` + `current_url()` + `site_base_url()` en helpers. `index.php` renderiza el `<head>` vía marcador `<!--VS_HEAD_MARKER-->` que se sustituye al final del buffer con título/description/canonical/robots/OG/Twitter/JSON-LD. Aplicado en `home`, `lineup`, `matchmaker` (noindex), `training`, `team`, `chat` (noindex), `amistad` (noindex). `lineup_controller` inyecta `VideoObject` JSON-LD por cada lineup visible. `robots.txt` + `sitemap_controller.php` activos (router actualizado con `sitemap => ['xml']`).

**🟡 Medio**
- `.htaccess` raíz: `mod_deflate` para text/css/js/svg/json/xml + `mod_expires` con 30d/7d/365d + bloqueo de `.bak`, `.backup`, `.sql`, `.env`, `.log` y dotfiles.
- `css/styles.css.backup` borrado del repo.
- `view/menu.php`: contadores (ping + pendientes + no-leidos) cacheados en `$_SESSION['nav_counters']` con TTL 30s. Se invalida (`$_SESSION['nav_counters_dirty']=true`) en `amistad_controller::invitar()`, `_amistad_cambiar_estado()` y `chat_controller::enviar()`.
- Stats coherentes: `usuario_view.php` muestra 12.4K / 275 / 45 (alineado con BD real).
- CTA "Entrar" → "Entrar al matchmaker" en `usuario_view.php`.
- Placeholder "nombre de invocador" → "Tu nick o Riot ID" / "Elige tu nick in-game" (jerga correcta de Valorant).
- Select de rango en registro: `selected` Gold eliminado; ahora arranca con placeholder "Selecciona tu rango" disabled.

**🟢 Bajo**
- `view/team_view.php`: `loading="lazy" decoding="async"` en los 4 `<img>`.
- `view/pronto_view.php`: CTA condicional a login (matchmaker/lineups) + nuevo titular "Próximamente en ValoSense". Inline `style=` removido y reemplazado por `.pronto-title` en `styles.css`.

### No tocado (postponed)
- Optimización imágenes PNG → WebP (31 MB de `imagenes/mapas/`): requiere cwebp/Imagick, queda como paso manual.
- URLs bonitas para detalle de lineup (requiere nueva ruta + rewrite).
- CSP sin `unsafe-inline` (main.js tiene `element.style=…`; migración invasiva).
- Cookie `SameSite=Strict` en endpoints destructivos específicos (matcha el flujo; `Lax` sigue aceptable).
- Microcopy "gratis" repetido — ajuste estilístico menor.
- Testimonios / prueba social en home.

### Verificación
- `php -l` sobre archivos tocados → sin errores de sintaxis.
- `Chat_model::get_resumen_amigos` ejecutado sobre la BD real: devuelve 4 amigos para user 20 con tipos correctos (riot_id, valorant_code, discord_id, text) y contador `unread` OK.

---

## Sesión: 2026-04-20 — Chat enriquecido, navbar, seeds y auditoría {#s-2026-04-20}

### Objetivo
Pulir UX de la navbar, ampliar detección de tipos en el chat, sincronizar esquema y seeds con la BD real, reorganizar SQL, cambiar landing de post-login y correr auditoría full.

### Cambios de código

**Navbar (`view/menu.php`, `css/styles.css`)**
- "Enviar lineup" ya no marca "Lineups" como activo: se computa `$a_actual` y se separan los dos estados.
- Amigos/Mensajes: quitada la clase `nav-link-compact` (provocaba padding menor y línea activa más corta que el resto).
- `.nav-item-push-right` (Amigos) perdió `align-items: center` → vuelve a `stretch` como los demás; antes dejaba el link y su `::after` a otra altura.
- `.nav-link::after` y `.nav-dropdown-toggle::after` anclados a `bottom: calc(50% - 0.95em)` en vez de `bottom: 0`. La navbar es de 80px; antes la línea roja salía ~30px por debajo del texto.
- `.nav-badge`: sustituido `margin-left:6px + vertical-align:middle` por `flex: 0 0 auto` (el gap del flex ya separa). Añadido box-shadow oscuro al badge rojo cuando el link está activo para que no se confunda con el fondo.

**Preservación de scroll en búsquedas (`js/main.js`)**
- El usuario introdujo su propia implementación (IIFE "keepScroll") para `form method="get"` con opt-out `data-no-keep-scroll`. Guarda `scrollY` en `sessionStorage` con clave `keepScroll:<pathname>:<id>` y restaura en `DOMContentLoaded` si hay querystring.

**Chat — detección de tipos (model/helpers.php, chat_model.php, chat_controller.php, chat_view.php, chat.js, chat.css)**
- `detectar_tipo_mensaje()` amplía los 4 tipos por mensaje completo:
  1. `discord_link` — invitación Discord con o sin `https://`.
  2. `discord_id` — snowflake 17–19 dígitos.
  3. `riot_id` — **nuevo** tipo: `Nombre#TAG` (name 3–16, tag 2–5).
  4. `valorant_code` — `#CODE`, `code: CODE` o bare 5–8 alfa-num mayúsculas con letra+dígito.
- Añadido `riot_id` a `$tipos_validos` del modelo, al selector del composer, al renderizado (badge y `<code>`), y estilos (badge y borde ámbar `#FFB446`).
- BD: ENUM `mensaje.tipo` ampliado a `('text','valorant_code','discord_link','discord_id','riot_id')`.

**Post-login/logout (`controller/usuario_controller.php`)**
- Tras login exitoso → `matchmaker&action=home` (antes `lineup`).
- `home()` y `gestionar()` (bounce no-admin) también apuntan a matchmaker.
- `desconectar()` → `index.php` (página de inicio de invitados).

**Descripciones de vídeo (BD + `sql/migracion_descripciones.sql`)**
- 225 lineups con plantilla "Vídeo recomendado… Pulsa play…" reescritos con generador determinista (`sql/_gen_descripciones.php`): 15 plantillas × abilities concretas por agente × hooks por mapa.
- 13 entrenamiento_video que abrían con "Skill Capped" reescritos con 13 openers distintos.
- Verificado: 275/275 lineup descripciones únicas, 45/45 entrenamiento_video únicas.

### Cambios en el repositorio SQL
- Nueva carpeta `sql/` con los 8 .sql del proyecto + `README.md` del orden/idempotencia.
- `sql/migracion_riot_id_mensaje.sql` — ALTER del ENUM.
- `sql/migracion_descripciones.sql` — 225+45 UPDATEs idempotentes.
- `sql/_gen_descripciones.php` — generador (no parte del ciclo de vida normal).
- `README.md` actualizado con la nueva ruta.

### Cambios aplicados a la BD real (MySQL 3307 `valosense`)
- `ALTER TABLE mensaje MODIFY tipo ENUM(..., 'riot_id')`.
- 225 UPDATE lineup + 13 UPDATE entrenamiento_video (descripciones variadas).
- Autorización permanente para seguir aplicando `.sql` directamente (guardado en memoria del orquestador; excepción: operaciones destructivas).

### Archivos creados
| Archivo | Descripción |
|---|---|
| `sql/README.md` | Orden de ejecución, idempotencia y destructividad |
| `sql/migracion_riot_id_mensaje.sql` | Añade `riot_id` al ENUM |
| `sql/migracion_descripciones.sql` | 270 UPDATE de descripciones |
| `sql/_gen_descripciones.php` | Generador PHP reutilizable |
| `DOCUMENTACION.md` | Este archivo |
| `ESTADO.md` | Estado actual y pendientes |

### Auditoría — hallazgos (no se aplicaron fixes; quedan en backlog)

**Seguridad**
- **CRÍTICO** `sql/_gen_descripciones.php` accesible por HTTP como `root`. → Mover fuera de `htdocs` o `if (PHP_SAPI !== 'cli') exit;` al inicio.
- **ALTO** Open redirect en `controller/amistad_controller.php:34,44,53,75,86` por `$_POST['redirect']` sin validar. → Exigir prefijo `index.php?`.
- **ALTO** Credenciales DB hardcodeadas (`model/conectar.php:7-11`). Aceptable en local; usar `.env` en producción.
- **MEDIO** `video_url` renderizado como `<a href>` sin volver a validar protocolo en `view/lineup_view.php:206`, `view/training_view.php:163`.
- **MEDIO** `RuntimeException(..., $e->getMessage())` filtra detalles (`usuario_model.php:24,49,67`, `matchmaker_model.php:55,85`).
- **BAJO** CSP con `style-src 'unsafe-inline'` (`index.php:15`), cookie sesión `SameSite=Lax` (OK, Strict sería más defensivo).
- **POSITIVO** Prepared statements en todas las queries dinámicas, CSRF en forms POST, whitelist de controladores, `password_hash`/`password_verify`, `session_regenerate_id(true)`, `safe_discord_link`/`youtube_embed` devuelven `about:blank` ante `javascript:`.

**Bugs funcionales**
- `controller/usuario_controller.php:377` usa `$duplicado['campo']` pero el modelo devuelve `bool`.
- `controller/chat_controller.php:48` no valida `tipo` contra whitelist antes de tratar "auto".
- `view/menu.php:35` define `nav_active()` global — incluir menu.php dos veces dispara `Cannot redeclare`. → `if(!function_exists(...))`.
- `view/chat_view.php:128` — `(int)end($mensajes)['id']` mal parenthesizado (precedencia PHP 8). → extraer a variable.
- `js/chat.js:106` — `m.creado_en.replace(' ','T')` peta si `creado_en` es null.
- `js/auth.js:72` exige `pswd<6`, servidor exige ≥8. Inconsistencia.
- `flash('error', …)` vs `flash('err', …)` inconsistentemente en usuario_controller.

**Rendimiento**
- **ALTO** 11 PNGs en `imagenes/mapas/` suman ~31 MB (Breeze 7 MB). Convertir a WebP.
- **ALTO** `js/chat.js:189` `setInterval(pollOnce, 3000)` se ejecuta siempre, aunque no haya conversación abierta ni la pestaña visible.
- **ALTO** `chat_model::get_resumen_amigos` hace 5 subqueries correlacionadas por fila. Consolidar con subquery derivada del último `id` por par.
- **ALTO** N+1 en `controller/matchmaker_controller.php:47` (`get_relacion` por jugador). Una sola query con `IN`.
- **MEDIO** Falta `.htaccess` con `mod_deflate` + `mod_expires`. Versionar assets con `?v=mtime`.
- **MEDIO** `css/styles.css` ~115 KB siempre cargado; borrar `styles.css.backup` expuesto.
- **MEDIO** Navbar ejecuta `ping` + `count_pendientes_recibidas` + `count_no_leidos_total` en cada request. Cachear en sesión con TTL.

**SEO**
- **ALTO** `<title>ValoSense</title>` y sin `<meta description>` — únicos para todo el sitio (`index.php:41`).
- **ALTO** URLs con querystring sin rewrites; fichas de lineup sin URL propia (`view/lineup_view.php:195`).
- **ALTO** Sin `<link rel="canonical">` → duplicados con filtros `?mapa=&agente_id=`.
- **ALTO** Sin `robots.txt` ni `sitemap.xml`.
- **ALTO** Sin JSON-LD `VideoObject` ni `BreadcrumbList`.
- **MEDIO** Sin OpenGraph / Twitter Cards.
- **POSITIVO** `lang="es"`, `charset`, viewport, skip-link, alt de imágenes y anchor text descriptivo OK.

**Marketing / CRO**
- Stats incoherentes entre páginas (`usuario_view.php:45-47` "12K jugadores" vs `matchmaker_view.php:34-49` "12.4K · 847 online" vs `home_view.php $stats`).
- CTA "Entrar" genérico; cambiar a "Entrar al matchmaker" ahora que el destino post-login es matchmaker.
- Registro: rango por defecto Gold — fuerza a iron/bronce a cambiarlo.
- Placeholder "nombre de invocador" (terminología LoL, no Valorant). Cambiar a "Riot ID".
- "Crear cuenta gratis" repetido 5+ veces; variar.
- `pronto_view.php` pasivo; reescribir con CTA al módulo que SÍ funciona.
- `explorar_view.php:134-139` dos CTAs al mismo destino — simplificar.

### Próximos pasos
Ver `ESTADO.md`.
