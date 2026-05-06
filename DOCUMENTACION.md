# 📄 DOCUMENTACION.md — Orquestador de Programación
> Registro global de todas las sesiones de trabajo a través de todos los proyectos.
> Generado y actualizado automáticamente por el `documentacion-agent`.

---

<!--
INSTRUCCIONES PARA EL documentacion-agent:
- Cada proyecto tiene su propio DOCUMENTACION.md dentro de /proyectos/[nombre]/
- Este archivo es el ÍNDICE GLOBAL — registra qué se hizo, en qué proyecto y cuándo
- Añadir cada sesión al INICIO (las más recientes primero)
- Nunca borrar entradas anteriores
-->

## Índice global de sesiones

| Fecha | Proyecto | Tarea | Agentes involucrados |
|-------|----------|-------|---------------------|
| 2026-05-06 | dj-create-3d | git pull desde GitHub (Djcreateweb3D.git) — ya up to date | orquestador, github-agent |
| 2025-05-06 | _sistema_ | Configuración inicial del orquestador | orquestador |

---

## Sesión: 2026-05-06 — Sincronización del repo dj-create-3d desde GitHub

### Objetivo
Hacer pull del repositorio remoto `https://github.com/djcreateweb/Djcreateweb3D.git` sobre la carpeta local existente `C:\Users\david\Desktop\orquestador-programacion\dj create 3d` (que ya estaba inicializada como repo Git).

### Verificaciones previas
- Remote `origin` correcto -> `https://github.com/djcreateweb/Djcreateweb3D.git`
- Branch local: `main` (tracking `origin/main`)
- `git status`: working tree clean (sin cambios locales que pudieran perderse)
- No se ejecutó `git clone` para no destruir el repo existente

### Operación
- `git fetch origin` -> sin novedades
- `git pull origin main` -> `Already up to date.`
- HEAD actual: `9a63d64 feat: telon DIAGONAL — corte de TL a BR con triangulos a esquinas` (DJ Create, hace 7 h)

### Resultado
- Sin archivos modificados, sin conflictos
- El repo local ya estaba sincronizado con el remoto
- Working tree limpio tras la operación

### Agentes
- orquestador (verificación previa, lectura del config remote)
- github-agent (ejecución del pull)

---

## Sesión: 2025-05-06 — Configuración inicial del sistema de agentes

### 🎯 Objetivo
Configurar la estructura completa del orquestador de programación: 12 agentes especializados + plantilla de proyectos + 2 proyectos activos (dj-create-3d y valosense).

### 👥 Agentes configurados
| # | Agente | Especialidad |
|---|--------|-------------|
| 00 | orquestador | Coordinación central del equipo |
| 01 | frontend-react-agent | React 19 · Vite · Tailwind CSS 4 |
| 02 | frontend-vanilla-agent | HTML5 · CSS3 · GSAP · AOS · p5.js · Three.js |
| 03 | backend-laravel-agent | Laravel 11 · PHP 8.2 · Sanctum |
| 04 | diseno-agent | UI/UX · design systems · paletas |
| 05 | seguridad-agent | OWASP · Laravel · React · Nginx |
| 06 | seo-agent | SEO técnico · Schema · Core Web Vitals |
| 07 | rendimiento-agent | Vite · Laravel · MySQL · Nginx caché |
| 08 | errores-agent | Debug React · Laravel · MySQL |
| 09 | marketing-agent | Copy · CRO · landing pages |
| 10 | documentacion-agent | Documenta cada sesión |
| 11 | github-agent | Git · commits semánticos · push |
| 12 | deploy-agent | Contabo VPS · Nginx · Let's Encrypt |

### 📁 Proyectos activos
| Proyecto | Tipo | Stack | Estado |
|----------|------|-------|--------|
| dj-create-3d | Showcase 3D agencia | HTML5 + CSS3 + Three.js + GSAP | En desarrollo |
| valosense | Por definir | Pendiente sesión inicial | Sin iniciar |

### 📚 Repositorios GitHub configurados por agente
- **orquestador:** 8 repos (Laravel, Vite, React, Tailwind, Sanctum, multi-tenant, etc.)
- **frontend-react:** 11 repos (React, Vite, Tailwind, shadcn/ui, TanStack Query, etc.)
- **frontend-vanilla:** 11 repos (GSAP, AOS, p5.js, Three.js, locomotive-scroll, etc.)
- **backend-laravel:** 11 repos (Laravel, Sanctum, Spatie multi-tenancy, Telescope, etc.)
- **diseno:** 7 repos (normalize.css, animate.css, hover.css, design systems)
- **seguridad:** 6 repos (OWASP, Spatie CSP, Laravel security)
- **seo:** 6 repos (react-helmet-async, Spatie sitemap, web-vitals)
- **rendimiento:** 6 repos (vite-bundle-visualizer, web-vitals, server-configs-nginx)
- **errores:** 5 repos (whoops, react-error-boundary, Vite/React issues)
- **marketing:** 5 repos (awesome-copywriting, marketing-skills, frameworks)
- **documentacion:** 6 repos (keep-a-changelog, jsdoc, PHPDoc PSR-5)
- **github:** 6 repos (gitignore, conventional-commits, commitizen)
- **deploy:** 5 repos (server-configs-nginx, certbot-nginx, deploy scripts)

### ⚙️ Convenciones globales del sistema
- Local dev: XAMPP (127.0.0.1:3306, root, sin contraseña)
- Stack SaaS: React 19 + Vite + Tailwind 4 + Laravel 11 + Sanctum + MySQL 8
- Stack showcase: HTML5 + CSS3 + JS vanilla + GSAP + AOS + p5.js + Three.js
- Infra producción: Contabo VPS + Nginx + Let's Encrypt
- VCS: GitHub con Conventional Commits
- Tuteo informal en todas las respuestas
- ❌ NO rosa ni amarillo en paletas futuristas (dj-create-3d)

### ⏭️ Próxima sesión
- [ ] **Valosense** — sesión de planificación: qué es, público, stack
- [ ] **DJ Create 3D** — hero Three.js con iluminación neón azul

---

*Documentación mantenida por: documentacion-agent · sistema iniciado 2025-05-06*
