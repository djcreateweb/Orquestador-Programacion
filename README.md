# 🧠 Orquestador de Programación

Sistema de agentes IA especializados para el desarrollo web profesional. Un orquestador central coordina 12 subagentes técnicos que trabajan sobre proyectos individuales con memoria persistente.

---

## 🎯 ¿Qué es esto?

Un sistema multi-agente donde cada `.md` define un especialista con su propio contexto, búsquedas en GitHub específicas y patrones de código. El **orquestador** es el único punto de entrada — analiza el proyecto, decide qué agentes invocar y coordina la entrega final.

```
Usuario → orquestador → [agente 1, agente 2, agente N] → documentación → entregable
```

---

## 📁 Estructura del repositorio

```
orquestador-programacion/
├── .claude/
│   └── agents/
│       ├── 00-orquestador/        ← orquestador.md (punto de entrada)
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
└── proyectos/
    ├── _plantilla/                ← Plantilla para proyectos nuevos
    ├── dj-create-3d/              ← Web 3D agencia (Three.js + GSAP)
    └── valosense/                 ← Pendiente de sesión inicial
```

---

## 🛠️ Stack soportado

### SaaS / Apps
- **Frontend:** React 19 · Vite · Tailwind CSS 4 · JSX
- **Backend:** Laravel 11 · PHP 8.2+ · Sanctum · Eloquent ORM
- **Base de datos:** MySQL 8
- **Local dev:** XAMPP (127.0.0.1:3306, root, sin contraseña)
- **VPS:** Contabo · Nginx · Let's Encrypt
- **VCS:** GitHub

### Showcase sites
- **Frontend:** HTML5 · CSS3 · JavaScript ES6+ vanilla
- **Animaciones:** GSAP · AOS.js · p5.js · Canvas API · Three.js

---

## 🚀 Cómo usar

1. Abre Claude Code en la raíz del proyecto.
2. Pide cualquier tarea — el `orquestador` se invoca automáticamente.
3. El orquestador:
   - Pregunta en qué proyecto trabajas (o lo deduce del mensaje)
   - Lee `proyectos/[nombre]/CLAUDE.md` y `ESTADO.md`
   - Escanea la estructura real del proyecto
   - Define el plan y delega a los agentes correctos
   - Al finalizar, invoca al `documentacion-agent`
   - Pregunta si quieres push a GitHub o deploy en VPS

---

## 📋 Crear un proyecto nuevo

1. Copia `proyectos/_plantilla/` → `proyectos/mi-proyecto/`
2. Edita `CLAUDE.md`, `ESTADO.md` y `.env.example` con la info real
3. Pide al orquestador: "trabajamos en mi-proyecto"

---

## 📚 Convenciones del orquestador

- ❌ Nunca escribir código sin leer el `CLAUDE.md`
- ❌ Nunca delegar sin contexto completo del proyecto
- ❌ No usar rosa ni amarillo en paletas futuristas (dj-create-3d)
- ✅ Siempre terminar invocando al `documentacion-agent`
- ✅ Siempre actualizar `CLAUDE.md` y `ESTADO.md`
- ✅ Siempre preguntar si subir a GitHub o desplegar al cerrar
- ✅ Tuteo informal en todas las respuestas
- ✅ Outputs copy-paste listos (sin preámbulos)

---

## 🔗 Repositorios de referencia

Cada agente tiene su propio listado de repositorios GitHub que consulta antes de cada tarea. El listado vive dentro de cada `.md` bajo "Protocolo de Auto-Mejora con GitHub" y "Repositorios base siempre disponibles".

---

*Proyecto personal de DJ Create (David Alcaraz) — Murcia, España*
