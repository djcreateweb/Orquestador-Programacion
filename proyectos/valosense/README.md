# ValoSense

Plataforma web para jugadores competitivos de **Valorant** que reúne en un único sitio las cuatro herramientas que más se usan a diario: encontrar equipo, consultar lineups, seguir rutinas de entrenamiento y recomendar composiciones por mapa.

Proyecto **TFG de DAW** desarrollado con PHP vanilla, MySQL/MariaDB y JavaScript sin frameworks.

---

## Índice

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Arquitectura](#arquitectura)
6. [Estructura de carpetas](#estructura-de-carpetas)
7. [Esquema de la base de datos](#esquema-de-la-base-de-datos)
8. [Rutas de la aplicación](#rutas-de-la-aplicación)
9. [Módulos](#módulos)
10. [Roles y permisos](#roles-y-permisos)
11. [Cómo se cargan los assets](#cómo-se-cargan-los-assets)
12. [Accesibilidad y progresividad](#accesibilidad-y-progresividad)
13. [Convenciones de código](#convenciones-de-código)

---

## Características

- **Landing pública** con hero, resumen de herramientas y CTAs de registro.
- **Registro e inicio de sesión** con contraseña hasheada (`password_hash`).
- **Matchmaker** — filtro por rango, agente y rol para encontrar compañeros.
- **Biblioteca de lineups** — videos de YouTube enviados por la comunidad y moderados por admins.
- **Entrenamiento** — rutinas predefinidas por rango y categoría (aim, movilidad, disparo, utilidad, game sense).
- **Composición de equipo** — recomendador por mapa: eliges mapa + agentes que ya tenéis, te sugiere cómo completar.
- **Panel de administración** para moderar lineups (aprobar/rechazar) y gestionar usuarios.
- **Vincular cuenta de Riot** (Riot ID + tag + región) como paso previo a la integración con la API oficial.
- **Navbar responsive** con menú hamburguesa y dropdown "Explorar".
- **Diseño oscuro** con tipografías Rajdhani + Inter + JetBrains Mono.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | PHP 8 (sin framework) |
| Base de datos | MySQL / MariaDB (XAMPP) via `mysqli` |
| Frontend | HTML5, CSS3, JavaScript ES6+ vanilla |
| Fuentes | Google Fonts (Rajdhani, Inter, JetBrains Mono) |
| Servidor de desarrollo | Apache (XAMPP) |

**Sin dependencias externas** — ni Composer, ni npm, ni frameworks JS, ni Bootstrap/Tailwind. Todo el CSS y JS está escrito a mano.

---

## Requisitos

- **XAMPP** o equivalente con:
  - Apache
  - PHP 8.0+
  - MySQL / MariaDB escuchando en **puerto 3307** (configurable en `model/conectar.php`)
- Navegador moderno (Chrome, Firefox, Edge)

---

## Instalación

1. **Clonar el proyecto** dentro de `htdocs`:
   ```
   C:\xampp\htdocs\ValoSense
   ```

2. **Importar la base de datos**:
   - Abrir phpMyAdmin (`http://localhost:8080/phpmyadmin` o similar).
   - Importar `sql/valosense.sql` (crea la base `valosense` y todas las tablas con datos iniciales).
   - Migraciones y seeds adicionales están también en `sql/` (ver `sql/README.md`).

3. **Revisar conexión** en `model/conectar.php`:
   ```php
   $host     = 'localhost';
   $user     = 'root';
   $pass     = '';
   $database = 'valosense';
   $port     = 3307;
   ```
   Ajusta usuario, contraseña y puerto si tu instalación es distinta.

4. **Arrancar Apache + MySQL** desde el panel de XAMPP.

5. **Abrir** `http://localhost/ValoSense/` en el navegador.

### Usuarios de prueba

En `sql/valosense.sql` hay usuarios precargados. El admin tiene `es_admin = 1` y puede entrar a las secciones de moderación y gestión de usuarios.

---

## Arquitectura

Arquitectura **MVC ligera** con un front controller:

```
                  ┌───────────────────┐
Navegador ──────▶ │   index.php       │  (HTML layout + head + scripts)
                  └────────┬──────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ front_controller.php │ (enruta ?controlador=X&action=Y)
                └────────┬─────────────┘
                         │
               ┌─────────┼─────────────┐
               ▼                       ▼
     ┌──────────────────┐     ┌──────────────────┐
     │ controller/*.php │     │   model/*.php    │ ──▶  MySQL
     └─────────┬────────┘     └──────────────────┘
               │
               ▼
       ┌──────────────┐
       │ view/*.php   │
       └──────────────┘
```

- **`index.php`** — plantilla HTML base con `<head>`, fuentes, CSS y scripts. Incluye `front_controller.php` dentro de `<body>`.
- **`front_controller.php`** — lee `?controlador=X&action=Y` de la URL, sanea con regex, incluye el controlador y llama a la función de la acción. Si algo falla, muestra `view/pronto_view.php`.
- **`controller/*_controller.php`** — funciones que cargan modelos, validan formularios y hacen `require_once` de la vista.
- **`model/*_model.php`** — clases con métodos que hablan con MySQL mediante prepared statements.
- **`view/*_view.php`** — HTML con PHP embebido. Todas las vistas incluyen `menu.php` arriba; el footer lo pone `index.php` globalmente.

### Por qué no hay `.htaccess` con URLs bonitas
Por simplicidad de TFG. Las URLs tipo `index.php?controlador=lineup&action=home` funcionan sobre cualquier Apache sin `mod_rewrite`.

---

## Estructura de carpetas

```
ValoSense/
├── index.php                   Plantilla base + carga de CSS/JS
├── README.md
│
├── sql/                        Esquema, migraciones y seeds de la BD
│   ├── valosense.sql           Script completo (tablas + datos iniciales)
│   ├── migracion_*.sql         Migraciones incrementales (aplicar tras valosense.sql)
│   └── seed_*.sql              Datos de prueba (usuarios, lineups)
│
├── controller/
│   ├── front_controller.php    Router
│   ├── home_controller.php     Landing pública
│   ├── usuario_controller.php  Login, registro, vincular Riot, gestión
│   ├── lineup_controller.php   Biblioteca, enviar, moderar
│   ├── matchmaker_controller.php  Búsqueda de compañeros
│   ├── training_controller.php    Rutinas por rango
│   └── team_controller.php        Composición por mapa
│
├── model/
│   ├── conectar.php            Singleton de conexión mysqli
│   ├── helpers.php             Funciones (ej: youtube_embed)
│   ├── usuario_model.php
│   ├── lineup_model.php
│   ├── matchmaker_model.php
│   ├── training_model.php
│   └── team_model.php
│
├── view/
│   ├── menu.php                Navbar (incluido en todas)
│   ├── footer.php              Pie de página (incluido desde index.php)
│   ├── home_view.php           Landing
│   ├── usuario_view.php        Login + registro (tabs)
│   ├── lineup_view.php         Biblioteca pública
│   ├── lineup_enviar_view.php  Form de envío (requiere login)
│   ├── gestiona_lineup_view.php   Moderación (admin)
│   ├── gestiona_usuario_view.php  Gestión usuarios (admin)
│   ├── matchmaker_view.php
│   ├── training_view.php
│   ├── team_view.php
│   ├── vincular_view.php       Vincular cuenta de Riot
│   ├── pronto_view.php         Placeholder para secciones no implementadas
│   └── html/                   Wireframes HTML estáticos de referencia
│
├── css/
│   ├── styles.css              Estilos globales (reset, variables, navbar, botones…)
│   ├── home.css                Landing
│   ├── auth.css                Login/registro
│   ├── lineup.css              Lineups
│   ├── matchmaker.css          Matchmaker
│   └── training.css            Training + team
│
├── js/
│   ├── main.js                 Global (navbar, dropdown Explorar, hamburguesa)
│   ├── home.js                 Landing (hero, contador, cascada)
│   ├── auth.js                 Tabs y validación login/registro
│   ├── lineup.js               Cascada, auto-submit filtros, confirmaciones
│   ├── matchmaker.js           Validación + animación respuesta bot
│   └── training.js             Entrenamiento + composición (auto-submit)
│
└── imagenes/
    ├── logo.png | logo.svg
    ├── favicon.svg
    ├── agentes/                Fotos circulares de cada agente
    ├── mapas/                  Imágenes de los 11 mapas
    └── rangos/                 Iconos de los 9 rangos
```

---

## Esquema de la base de datos

Siete tablas en InnoDB con `utf8mb4_unicode_ci`:

### `usuario`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INT PK auto | |
| username | VARCHAR(50) UNIQUE | |
| email | VARCHAR(100) UNIQUE | |
| password_hash | VARCHAR(255) | `password_hash()` de PHP |
| rango | ENUM 9 rangos de Valorant | Iron … Radiant |
| region | ENUM(EU, NA, LATAM, BR, AP, KR) | |
| es_admin | TINYINT(1) | 1 = administrador |
| riot_id / riot_tag / riot_region | Vinculación con Riot | opcional |
| google_id | VARCHAR(255) | OAuth (futuro) |
| creado_en | TIMESTAMP | |

### `agente`
Catálogo de agentes (id, nombre, rol). Rol ∈ Duelist · Initiator · Controller · Sentinel.

### `agente_favorito`
Relación N:M usuarios ↔ agentes preferidos.

### `lineup`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| usuario_id | FK usuario | SET NULL si se borra el autor |
| agente_id | FK agente | |
| mapa | ENUM 11 mapas | Ascent, Bind, Breeze… |
| titulo | VARCHAR(100) | |
| descripcion | TEXT | |
| video_url | VARCHAR(255) | URL de YouTube |
| aprobado | TINYINT(1) | 0 = pendiente moderación |

### `agente_mapa_meta`
Tier (S/A/B) y nota táctica por combinación agente+mapa. Usado por el recomendador de composición.

### `entrenamiento_opcion`
Catálogo de rutinas por `rango` y `categoria` (aim, movilidad, disparo, utilidad, game_sense). Incluye `titulo`, `contenido` y `video_url` opcional.

### `rutina`
Rutinas personalizadas guardadas por usuario (aún no expuestas en UI).

### `solicitud_equipo`
Solicitudes activas de matchmaking (rango mínimo/máximo, mensaje). Base para el matchmaker real.

---

## Rutas de la aplicación

Patrón: `index.php?controlador=<c>&action=<a>`

| Sección | Controlador | Acción | Acceso |
|---------|-------------|--------|--------|
| Landing | `home` | `home` | Público |
| Lineups (biblioteca) | `lineup` | `home` | Público |
| Enviar lineup | `lineup` | `enviar` | Usuario |
| Moderar lineups | `lineup` | `gestionar` | Admin |
| Matchmaker | `matchmaker` | `home` | Usuario |
| Entrenamiento | `training` | `home` | Usuario |
| Composición | `team` | `home` | Usuario |
| Login / Registro | `usuario` | `home` / `login` / `registro` | Público |
| Vincular Riot | `usuario` | `vincular` | Usuario |
| Gestionar usuarios | `usuario` | `gestionar` | Admin |
| Cerrar sesión | `usuario` | `desconectar` | Usuario |

Si el controlador o la acción no existen, se muestra `view/pronto_view.php` con un mensaje.

---

## Módulos

### 🏠 Home — landing pública (`home_controller.php` + `home_view.php`)
Primera página que ve un visitante. Incluye:
- **Hero** con titular, CTA principal y tira de stats animada (contador JS desde 0).
- **Cuatro feature cards** (una por herramienta), cada una con `id="feature-<key>"`, bullets de lo que ofrece y CTA contextual.
- **Cómo funciona en 3 pasos**.
- **Banner CTA** final de registro (solo si no hay sesión).

Los CTA y el comportamiento cambian según haya sesión:
- Invitado → la tarjeta muestra "🔒 Necesitas una cuenta" y el botón va al login.
- Usuario → el botón va directo a la herramienta.

El dropdown "Explorar" del navbar, cuando el usuario no está logueado, enlaza a `#feature-<key>` dentro de la home en vez de la herramienta protegida. `js/home.js` detecta el hash y hace scroll + resaltado de la tarjeta.

### 🔐 Usuario — auth (`usuario_controller.php`)
Login y registro conviven en la misma vista (`usuario_view.php`) con sistema de tabs (JS en `auth.js`).

- **Registro**: valida longitud usuario/contraseña en cliente y servidor. Email se genera como `username@valosense.local` porque el campo es obligatorio en BD pero no se recoge en el form.
- **Login**: `password_verify` contra `password_hash` guardado. Al hacer login se vuelca el usuario a `$_SESSION["usuario"]`.
- **Vincular Riot**: formulario separado para pegar `RiotID#TAG` + región. Valida regex y guarda en columnas `riot_*` del usuario. Preparado para cuando se active la API de Riot.
- **Gestionar usuarios** (admin): listado con botón "Borrar" por fila. No permite borrarse a sí mismo.

### 🎯 Matchmaker — buscar compañeros (`matchmaker_controller.php`)
Formulario con rango + agente + rol. **Actualmente devuelve un mensaje "en desarrollo"**, la búsqueda real contra `solicitud_equipo` está pendiente. La vista ya prevé tarjetas `.player-card` con stats.

### 🎬 Lineups — biblioteca + envío + moderación (`lineup_controller.php`)
- **Biblioteca (`home`)**: pública. Filtra por agente y mapa con un form GET que JS envía automáticamente al cambiar cualquier select. Cada lineup se renderiza como `.tarjeta-lineup` con iframe de YouTube (`model/helpers.php::youtube_embed` convierte URLs de `watch?v=` y `youtu.be` a `embed`).
- **Enviar (`enviar`)**: requiere login. Valida título, descripción mínima 10 caracteres, agente, mapa y URL de YouTube. Se guarda con `aprobado = 0`. JS añade contador de caracteres en vivo.
- **Moderar (`gestionar`)**: solo admin. Muestra pendientes con botones "Aprobar" (pone `aprobado=1`) y "Rechazar" (borra). Los botones de borrar piden confirmación con `window.confirm()`.

### 🏋️ Entrenamiento — rutinas por rango (`training_controller.php`)
Selector de rango + checkboxes de categorías (aim, movilidad, disparo, utilidad, game_sense). Al pulsar "Ver rutinas recomendadas" (`?buscar=1`), el modelo devuelve las `entrenamiento_opcion` que coinciden. La vista las agrupa por categoría con iframe de YouTube opcional.

JS añade:
- Cascada de entrada en las `.routine-card`
- Botón dinámico "Marcar/desmarcar todas las categorías"
- Lazy-load de iframes con `IntersectionObserver`
- Scroll suave al resultado tras enviar el form

### 🎮 Composición — recomendador por mapa (`team_controller.php`)
Dos pasos con un **flujo de auto-submit**:

1. **Paso 1**: el usuario pulsa un mapa. Recarga con `?mapa=X`.
2. **Paso 2**: marca agentes que ya jugaréis (máx. 4 agrupados por rol). **No hay botón de enviar**: cada cambio de checkbox programa un submit debounced a 400 ms, manda `?recomendar=1` y la página vuelve con las recomendaciones abajo.

El modelo aplica esta lógica:
- Si falta algún rol → sugiere agentes disponibles para ese rol ordenados por `tier` en ese mapa (S antes que A antes que B).
- Si el equipo ya cubre los 4 roles → sugiere opciones **flex** en el meta del mapa con su `nota` táctica.

La posición de scroll se guarda en `sessionStorage` antes del submit y se restaura al volver, para que el usuario no pierda el sitio.

Si JavaScript está desactivado, se muestra un botón fallback "Recomendar el resto del equipo" (oculto por JS cuando está activo).

---

## Roles y permisos

Dos roles simples determinados por `usuario.es_admin`:

| Acción | Invitado | Usuario | Admin |
|--------|----------|---------|-------|
| Ver landing | ✅ | ✅ | ✅ |
| Ver biblioteca de lineups | ✅ | ✅ | ✅ |
| Registrarse / iniciar sesión | ✅ | — | — |
| Enviar lineup | ❌ | ✅ | ✅ |
| Matchmaker, Training, Team | ❌ | ✅ | ✅ |
| Vincular cuenta Riot | ❌ | ✅ | ✅ |
| Moderar lineups | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

Los controladores protegidos hacen `header('Location: …login')` si no hay `$_SESSION["usuario"]`.

---

## Cómo se cargan los assets

`index.php` decide qué CSS y qué JS incluir según `?controlador=`:

```php
$c = $_GET['controlador'] ?? 'home';
if ($c === 'home')                        → css/home.css       + js/home.js
elseif ($c === 'usuario')                 → css/auth.css       + js/auth.js
elseif ($c === 'training' || 'team')      → css/training.css   + js/training.js
elseif ($c === 'matchmaker')              → css/matchmaker.css + js/matchmaker.js
elseif ($c === 'lineup')                  → css/lineup.css     + js/lineup.js
```

`css/styles.css` y `js/main.js` se cargan **siempre**, contienen el navbar, botones globales, tipografía y el dropdown "Explorar".

Los scripts van con `defer` en el `<body>`, así no bloquean el render y el DOM está listo cuando se ejecutan.

---

## Accesibilidad y progresividad

- **Skip link** (`<a class="skip-link" href="#main">`) al inicio de cada página.
- Atributos `aria-expanded`, `aria-haspopup`, `aria-controls`, `role="menu"` en el dropdown.
- Cierre del dropdown/menú hamburguesa con **tecla Escape**.
- `aria-live="polite"` en el estado de composición (`#comp-status`) para que los lectores anuncien cambios.
- **Fallback sin JS** en el formulario de composición: se muestra un botón de submit real cuando JS está desactivado.
- **Prepared statements** en todos los modelos — sin concatenación de SQL.
- **`htmlspecialchars`** en todo el output que venga de la BD o de formularios.

---

## Convenciones de código

### PHP
- Vistas con HTML + PHP embebido (sin template engine).
- Controladores como funciones sueltas (no clases) invocadas por `front_controller.php`.
- Modelos como clases con métodos que devuelven arrays/objetos simples.
- Nombres de funciones y columnas en `snake_case` y español/inglés mezclado (convención del equipo).

### JavaScript
- **Solo vanilla**, sin librerías.
- Todo dentro de `document.addEventListener('DOMContentLoaded', …)`.
- `const` / `let`, nunca `var`.
- Un archivo JS por sección; lógica global en `main.js`.
- Selección por clase/ID, uso de `classList` en vez de `.style` (salvo animaciones puntuales).
- Comentarios en español explicando qué hace cada bloque.

### CSS
- Variables CSS (`--accent-red`, `--text-muted`, `--font-mono`…).
- BEM ligero: `feature-card`, `feature-card-matchmaker`, `feature-card.is-highlighted`.
- Mobile-first con media queries mínimas.
- Corner decorations (`.corner-tl/tr/bl/br`) en bloques destacados como acento visual.

---

## Estado actual y próximos pasos

| Módulo | Estado |
|--------|--------|
| Home / Landing | ✅ Funcional |
| Login + Registro | ✅ Funcional |
| Vincular Riot (guardado local) | ✅ Funcional |
| Lineups (ver/enviar/moderar) | ✅ Funcional |
| Entrenamiento | ✅ Funcional |
| Composición (auto-submit) | ✅ Funcional |
| Matchmaker (búsqueda real) | ⏳ Pendiente — ahora muestra "en desarrollo" |
| Integración API Riot | ⏳ Campos ya existen, falta llamar a la API |
| Inicio de sesión con Google | ⏳ Tabla lista, falta OAuth |
| Rutinas personalizadas guardadas | ⏳ Tabla `rutina` sin UI |

---

## Licencia y aviso

Proyecto académico (TFG). No afiliado con Riot Games. **Valorant** es marca registrada de Riot Games, Inc.
