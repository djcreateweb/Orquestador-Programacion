# 01 · ANÁLISIS (Fase 1)

Análisis completo de las dos piezas, el marco legal y los riesgos, y decisión de qué sobrevive.
Fecha: 2026-07-13. Modo: **Expira NO disponible** en el workspace (ver [DECISIONES.md](DECISIONES.md) D-001).

---

## 0. Hallazgo dominante: Presentia contiene DOS aplicaciones

| | **World A — VIVA** | **World B — DORMIDA/incompleta** |
|---|---|---|
| Entrada | `main.jsx` → `App` (`App.jsx` líneas **2467–5704**) | `AppRuntime.jsx` (no lo importa nadie) + backend Laravel |
| Persistencia | 100% `localStorage` | MySQL + Sanctum |
| Modelo de datos | **Jornada** (entrada+salida) → coincide con el objetivo | Event-log (`tipo`=entrada/salida/pausa) |
| Multi-tenant | ligero | SaaS completo (tenants, subdominios, superadmin, impersonación) |

- **`App.jsx` líneas 1–2465 son un comentario muerto** (`/* BLOQUE DUPLICADO (AUTO-GENERADO) — IGNORAR … */`) con 6 copias de una App antigua. No se ejecuta.
- `AppRuntime.jsx` está huérfano y además importa funciones (`getMe`, `getToken`, `cambiarPassword`) que `auth.service.js` no exporta.
- **Conclusión:** la reducción es, sobre todo, un trabajo de **borrado**. La lógica objetivo está en World A (~3.240 líneas).

---

## 1. Inventario (resumen)

**Frontend (`frontend/src`, ~8.600 líneas / 22 archivos):** `App.jsx` (monolito, live ≈3.240), `AppRuntime.jsx` (huérfano), servicios `storage/records/solicitudes` (localStorage, se adaptan) y `api/fichajes/empleados/empresas` (axios, se eliminan), `utils/formatters` (cálculo de horas, se conserva la lógica), `utils/crypto` (PBKDF2 cliente), `components/maps/MapaFichajes` (Leaflet, se elimina), `components/charts/*` (uno huérfano), `programador/*` (panel SaaS + impersonación, se elimina).

**Backend (`backend`, Laravel + Sanctum + MySQL, ~2.260 líneas / 27 PHP + 20 migraciones):** controladores de fichaje/solicitud/auditoría (se adaptan/conservan reglas), autenticación Sanctum (se sustituye por sesión de Expira), empresas/tenants/superadmin/impersonación/ausencias/geo/vistas phpMyAdmin (se eliminan).

**Dependencias externas eliminadas al reducir:** `axios` (sólo World B) y `leaflet` (mapas).

---

## 2. Mapa de decisión (agresivo) — CONSERVAR / ADAPTAR / ELIMINAR

| Funcionalidad | Decisión | Motivo (1 línea) |
|---|---|---|
| Reglas de negocio de jornada (fichaje, records, cálculo de horas) | **ADAPTAR** | Es el objetivo; se reescribe limpio en Node/SQLite. |
| Flujo de solicitudes de corrección + auditoría con valor original | **CONSERVAR/ADAPTAR** | Requisito §3 y legal. |
| Informe/resumen de horas | **ADAPTAR** | Pasa a "Informe de horas" con rango, total y PDF. |
| Comentario muerto `App.jsx` 1–2465, `AppRuntime.jsx` | **ELIMINAR** | Código muerto/huérfano. |
| Multi-tenant, superadmin, panel Programador + impersonación | **ELIMINAR** | Expira es el host único; fuera de alcance. |
| Empresas CRUD | **ELIMINAR** | El host posee la organización. |
| Leaflet / mapas / geolocalización / consentimiento geo | **ELIMINAR** | No está en §3; ilegal/desproporcionado (§legal). |
| Gráficos (`DailyTimeline`, `AttendanceBarChart`) | **ELIMINAR** | No pedidos; uno ya huérfano. |
| Sanctum / login propio / axios | **ELIMINAR** | Cero login propio: identidad y PIN vía puertos de Expira. |
| Roles admin/supervisor/superior/superadmin | **ADAPTAR** | Se colapsan a `empleado` / `local_admin` / `technician`. |

**Estimación de reducción:** frontend ~8.600 → ~2.700–3.300 líneas (**~65%**); backend Laravel → **sustituido** por un módulo Node de ~20 archivos + migración aditiva. Se eliminan 2 dependencias (axios, leaflet).

---

## 3. Sistema de diseño (tokens)

`App.css` es boilerplate de Vite (se ignora). El sistema real vive en `index.css` (`@theme`) + clases Tailwind. Hallazgos: los tríos **azul (admin/técnico)** y **verde (empleado)** ya coinciden **exactamente** con la paleta mandada; **no hay fuentes prohibidas** (Hanken Grotesk/Unbounded/JetBrains Mono) ni violeta para el técnico; los colores rojo/estado no estaban tokenizados; **Inter se referencia pero nunca se carga** (no hay `@font-face`). Se consolidó todo en [`shared/tokens.css`](../shared/tokens.css) (paleta literal §1.1 + Inter + monoespaciada del sistema + escalas de radio/sombra/duración). Pendiente de integración: empaquetar Inter (`fonts.css`).

---

## 4. Auditoría de seguridad del Presentia actual (hallazgos que NO sobreviven)

| Severidad | Hallazgo | Neutralización en el módulo |
|---|---|---|
| **CRÍTICO** | `GET /api/estado` público vuelca admin, empleados y últimos 100 fichajes con **GPS/IP** | Sin endpoints públicos; cada endpoint autoriza; cero geo/IP en respuestas. |
| **CRÍTICO** | Autenticación en el cliente; hash+salt en `localStorage`; comparación en JS | Cero auth en cliente; verificación de PIN 100% en servidor vía puerto; token en memoria. |
| **ALTO** | IDOR en fichajes (lectura/escritura) y solicitudes | Autorización por endpoint + identidad del servidor; el empleado sólo opera sobre lo suyo. |
| **ALTO** | Credenciales por defecto en seeders | El módulo no siembra credenciales; no gestiona login. |
| **ALTO** | Token de impersonación en la URL | Sin impersonación; tokens sólo en cabeceras. |
| MEDIO | Sin TLS forzado; cabeceras débiles | 127.0.0.1 + TLS documentado; CSP/cabeceras (INTEGRACION). |
| BAJO | `console.error(e)` con cuerpos de petición; enumeración de usuarios; rate limit sólo por IP | Errores genéricos; logs sin PII; rate-limit + bloqueo por empleado/dispositivo. |

Positivo del original (se mantiene el criterio): bcrypt en servidor, consultas parametrizadas (Eloquent), sin `dangerouslySetInnerHTML`, validación en escrituras. **No existe PIN hoy** → el módulo lo introduce con política y bloqueo.

---

## 5. Marco legal (borrador → ver [CUMPLIMIENTO.md](../legal/CUMPLIMIENTO.md))

Verificado contra fuentes primarias (BOE, AEPD, EUR-Lex) a **2026-07-13**. Claves:
- **Registro de jornada obligatorio**: art. 34.9 ET (RDL 8/2019), exigible desde 12/05/2019; conservación **4 años**; a disposición de trabajador, RLT e Inspección.
- **Nuevo RD de desarrollo**: a 2026-07-13 **NO publicado en BOE** (verificado en sumarios del 09 y 13/07/2026); en tramitación (dictamen desfavorable del Consejo de Estado, 23/03/2026). Se implementa el **estándar más exigente del borrador** (digital, trazable, inalterable, historial de modificaciones, exportación CSV/PDF, acceso del trabajador). `TODO-LEGAL`: reverificar el BOE.
- **Base jurídica**: art. 6.1.c RGPD (obligación legal), no consentimiento. Minimización (art. 5).
- **Biometría prohibida** como fichaje ordinario (AEPD, guía 23/11/2023); **geolocalización** desproporcionada en kiosko fijo (art. 90 LOPDGDD) → **cero biometría, cero geolocalización**.
- **Derechos** arts. 13-22 RGPD + desconexión digital (art. 88 LOPDGDD); **encargados** (art. 28) + RAT (art. 30); LSSI (arts. 10 y 22.2).

---

## 6. Riesgos y cómo los aborda el módulo

| Riesgo | En Presentia hoy | En el módulo |
|---|---|---|
| **Zona horaria** | Inconsistente: unas rutas bucketizan en UTC y otras en local | Fecha de jornada SIEMPRE en la zona del centro (`Europe/Madrid`); ts en UTC. ([time.js](../src/domain/time.js)) |
| **Cruce de medianoche** | Se maneja al calcular, pero la fecha mostraba sólo el día de entrada | Segmento entrada→salida computa aunque cruce; jornada = día de la entrada. |
| **Cálculo de horas duplicado** | JS + PHP | Única fuente ([jornadas.js](../src/domain/jornadas.js)). |
| **Correlativo F-AAAA-NNNN** | **No existe** | Contador atómico por serie+año, con cambio de año. ([correlativo.js](../src/domain/correlativo.js)) |
| **"editado" + original** | Auditoría guardaba valor anterior, pero sin flag ni edición directa del admin | Versiones append-only que conservan el original + flag `editado` + auditoría hash-chain. |
| **Sin red** | World A offline (localStorage) | El kiosko degrada con elegancia si el servidor no responde (reintento); persistencia compartida en el servidor local de Expira. |
