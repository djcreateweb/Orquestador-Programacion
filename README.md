# 🧠 Orquestador de Programación

Sistema de agentes IA especializados para desarrollo web profesional. Un orquestador central coordina 12 subagentes técnicos que trabajan sobre proyectos reales conviviendo en este mismo repo monolítico.

**Repo único:** [`djcreateweb/Orquestador-Programacion`](https://github.com/djcreateweb/Orquestador-Programacion) — todo (agentes + proyectos + documentación) se commitea y pushea aquí.

---

## 🎯 ¿Qué es esto?

Un sistema multi-agente donde cada `.md` en `.claude/agents/` define un especialista con su propio contexto, listado de repositorios GitHub de referencia y patrones de código. El **orquestador** es el único punto de entrada: analiza el proyecto, decide qué agentes invocar y coordina la entrega final.

```
Usuario → orquestador → [agente 1, agente 2, agente N] → documentacion-agent → push
```

---

## 📁 Estructura del repositorio

```
orquestador-programacion/
├── .claude/
│   └── agents/
│       ├── 00-orquestador/        ← orquestador.md (único punto de entrada)
│       ├── 01-frontend-react/     ← React 19 + Vite + Tailwind 4
│       ├── 02-frontend-vanilla/   ← HTML5 + CSS3 + GSAP + AOS + p5.js
│       ├── 03-backend-laravel/    ← Laravel 11 + PHP 8.2 + Sanctum
│       ├── 04-diseno/             ← UI/UX + design systems
│       ├── 05-seguridad/          ← OWASP + Laravel + React + Nginx
│       ├── 06-seo/                ← React SEO + sitemap + Schema
│       ├── 07-rendimiento/        ← Vite + React + Laravel + MySQL + Nginx
│       ├── 08-errores/            ← Debug React + Laravel + MySQL
│       ├── 09-marketing/          ← Copy + CRO + landing pages
│       ├── 10-documentacion/      ← Documenta cada sesión
│       ├── 11-github/             ← Git + commits semánticos + push
│       └── 12-deploy/             ← Contabo VPS + Nginx + Let's Encrypt
│
├── proyectos/
│   ├── dj-create-3d/              ← Web showcase agencia · HTML+CSS+JS vanilla
│   │   ├── index.html, css/, js/, legal/
│   │   ├── frames/                ← 121 .jpg del hero scroll-driven (~52 MB)
│   │   └── ESTRUCTURA.md          ← documentación técnica del proyecto
│   │
│   └── valosense/                 ← TFG · PHP MVC + MySQL + OAuth Google
│       ├── controller/, model/, view/, sql/, docs/
│       └── imagenes/              ← agentes y mapas Valorant (~32 MB)
│
├── ESTADO.md                      ← estado global de proyectos y agentes
├── DOCUMENTACION.md               ← histórico técnico de cada sesión
└── README.md                      ← este archivo
```

---

## 🛠️ Stack soportado

### SaaS / Apps full-stack
- **Frontend:** React 19 · Vite · Tailwind CSS 4 · JSX
- **Backend:** Laravel 11 · PHP 8.2+ · Sanctum · Eloquent ORM
- **Base de datos:** MySQL 8
- **Local dev:** XAMPP (127.0.0.1:3306, root, sin contraseña)
- **VPS:** Contabo · Nginx · Let's Encrypt
- **VCS:** GitHub

### Showcase sites
- **Frontend:** HTML5 · CSS3 · JavaScript ES6+ vanilla
- **Animaciones:** GSAP · AOS.js · p5.js · Canvas API · Three.js

### Proyectos legacy / TFG
- PHP MVC vanilla + MySQL + Apache (`.htaccess`) — solo se mantiene, no es stack objetivo

---

## 🚀 Cómo usar

1. Abre Claude Code en la raíz: `C:\Users\david\Desktop\orquestador-programacion`
2. Pide cualquier tarea — el `orquestador` se invoca automáticamente.
3. El orquestador:
   - Pregunta en qué proyecto trabajas (o lo deduce del mensaje)
   - Lee `proyectos/[nombre]/CLAUDE.md` y revisa `ESTADO.md`
   - Escanea la estructura real del proyecto
   - Define el plan y delega a los agentes correctos
   - Al finalizar, invoca al `documentacion-agent` para registrar lo hecho
   - Pregunta si quieres push a GitHub o deploy en VPS

---

## 📦 Proyectos activos

| Proyecto | Tipo | Stack | Estado |
|----------|------|-------|--------|
| **dj-create-3d** | Showcase web | HTML5 + CSS3 + JS vanilla + Canvas | 🟡 En desarrollo (hero Three.js pendiente) |
| **valosense** | TFG webapp | PHP MVC + MySQL + OAuth Google | 🟡 Clonado, pendiente análisis |

Detalle completo en `ESTADO.md`.

---

## 🌿 Workflow Git

Todo vive en un único repo (`Orquestador-Programacion`):

```bash
# desde la raíz del orquestador
git add <archivo>
git commit -m "feat(<proyecto>): descripción"
git push origin main
```

- ❌ **No** existen ya repos separados activos para los proyectos. Los antiguos `Djcreateweb3D` y `ValoSenseProyecto` quedan en GitHub solo como snapshot histórico congelado.
- ✅ Los commits llevan prefijo del proyecto cuando aplican: `feat(dj-create-3d): ...`, `fix(valosense): ...`, `chore: ...` para cambios de infraestructura del orquestador.

---

## 📚 Convenciones del orquestador

- ❌ Nunca escribir código sin leer el `CLAUDE.md` del proyecto
- ❌ Nunca delegar sin contexto completo del proyecto
- ❌ No usar rosa ni amarillo en paletas futuristas (regla de `dj-create-3d`)
- ✅ Siempre terminar invocando al `documentacion-agent`
- ✅ Siempre actualizar `ESTADO.md` al cerrar la sesión
- ✅ Siempre preguntar si subir a GitHub o desplegar al cerrar
- ✅ Tuteo informal en todas las respuestas
- ✅ Outputs copy-paste listos (sin preámbulos ni resúmenes innecesarios)

---

## 🔗 Repositorios de referencia

Cada agente tiene su propio listado de repositorios GitHub de los que aprende antes de cada tarea. El listado vive dentro de su `.md` bajo las secciones **"Protocolo de Auto-Mejora con GitHub"** y **"Repositorios base siempre disponibles"**.

Total aproximado: ~93 repositorios únicos referenciados entre los 12 agentes.

---

## 📊 Métricas del sistema

- **Agentes:** 13 (orquestador + 12 especialistas)
- **Proyectos activos:** 2 (`dj-create-3d`, `valosense`)
- **Tamaño del repo:** ~85 MB (incluye 121 frames JPG + imágenes Valorant)
- **Local dev backend:** http://localhost:8000
- **Local dev frontend:** http://localhost:5173
- **Local DB (XAMPP):** 127.0.0.1:3306 · root · sin contraseña

---

*Proyecto personal de DJ Create (David Alcaraz) — Murcia, España*
