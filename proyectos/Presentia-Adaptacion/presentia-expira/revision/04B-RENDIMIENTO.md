# 04B · INFORME DE RENDIMIENTO — Módulo Presentia (Fase 4.3)

**Fecha:** 2026-07-19 · **Agente:** rendimiento-agent · **Entorno de medición:** Node
v24.13.1, `node:sqlite` (`DatabaseSync`, experimental), Windows. Todas las mediciones se
hicieron con un entorno **propio y desechable** (BD SQLite en FICHERO temporal dentro de
`revision/_scripts/`, borrada al final de cada script) creado con
`src/dev/reference-env.js` + `src/index.js`, **sin tocar** la API compartida del puerto
8787 ni ningún `.db` real. Método de tiempo: `performance.now()` (Node), varias muestras
por medición, se reporta la **mediana** (y min/max). Los scripts usados quedan en
`revision/_scripts/perf.mjs`, `arranque.mjs`, `concurrencia.mjs`,
`child-writer-a.mjs`/`child-writer-b.mjs` (desechables, no forman parte del producto).

> Regla de la fase: **se mide, no se opina**. Todo número lleva su método. Donde no se
> pudo medir con evidencia real, se marca **⛔ NO VERIFICADO**.

---

## 0. Método de siembra (carga realista)

- 40 empleados sintéticos (`emp0`..`emp39`), días laborables consecutivos desde
  2020-01-06, 4 marcas por jornada (entrada 08:00, salida-comer 13:00, vuelta 14:00,
  salida 17:00) → jornada cerrada de 8h, igual que el seed de demostración de
  `dev-preview/api-server.mjs`.
- **5.000 jornadas → 20.000 marcas** (≈125 días laborables/empleado, ≈6 meses).
- **50.000 jornadas → 200.000 marcas** (≈1.250 días laborables/empleado, ≈4,8 años —
  coherente con el mínimo legal de conservación `conservacionAnios=4`).
- La siembra se agrupó en **una única transacción externa** (`BEGIN`/`COMMIT`) para no
  medir el coste de `fsync` por fila (eso se mide aparte, ver §4). Esto es sólo una
  técnica de siembra rápida del script de prueba; no cambia el resultado de las
  *lecturas* calientes (Hoy/Registros/Informe/Export), que son las que importan aquí.

---

## 1. Tabla de mediciones — ANTES (Fase 5 rellena "DESPUÉS")

| Métrica | Método | 5.000 jornadas | 50.000 jornadas | Objetivo | Cumple |
|---|---|---:|---:|---|---|
| `Hoy` (KPIs + marcas del día) | `hoy.service.hoy()`, mediana 5 llamadas | **9.14 ms** | **8.17 ms** | <200 ms | ✅ |
| `Registros`, filtro 1 mes | `registros.listarJornadas()`, mediana 5 | **171.84 ms** (800 filas) | **120.84 ms** (560 filas) | <200 ms | ⚠️ pasa con poco margen |
| `Registros`, TODO el rango (sin paginar) | ídem, mediana 3 (5k) / 1 muestra (50k) | **1 038.79 ms** (5 000 filas) | **10 421.22 ms** (50 000 filas) | <200 ms | ❌ |
| `Informe`, filtro 1 mes | `informe.informePorEmpleado()`, mediana 5 | **156.32 ms** | **105.83 ms** | <200 ms | ✅ |
| `Informe`, TODO el rango | ídem, mediana 3 (5k) / 1 muestra (50k) | **1 081.57 ms** | **9 794.49 ms** | <1 s | ❌ (5k roza; 50k x10) |
| Export **CSV** (informe TODO) | `informeACsv()` sobre el informe ya calculado | **1 935.75 ms** (273,6 KB) | **19 600.03 ms** (2 725 KB) | <1 s | ❌ |
| Export **PDF** (informe TODO) | `informeAPdf()` ídem | **2 015.95 ms** (317,0 KB) | **22 613.48 ms** (3 144 KB) | <1 s | ❌ |
| Informe+CSV extremo a extremo | recomputa informe + exporta | **2 835.72 ms** | **31 040.24 ms** | <1 s | ❌ |
| Informe+PDF extremo a extremo | recomputa informe + exporta | **2 768.02 ms** | **34 793.51 ms** | <1 s | ❌ |
| **Fichar** 1 marca (aislado, fichero real, autocommit con `fsync`) | `fichaje.fichar()` x10, mediana | **9.56 ms** | **9.17 ms** | <300 ms | ✅ (margen ~30x) |
| Arranque del módulo (`import`+`crearModulo`, BD fichero nueva) | `performance.now()`, entorno vacío | **182.65 ms** (53 import + 130 init) | n/a (no depende del volumen de datos) | <2 s pantalla usable | ✅ |
| 2ª llamada a `migrate()` (no-op, ya migrado) | ídem | **2.82 ms** | — | — | ✅ |
| Memoria del proceso en `crearModulo()` | `process.memoryUsage()` antes/después | Δ heapUsed ≈ **0.06 MB**; RSS proceso Node ≈ **60 MB** en reposo | — | — | informativo |
| Build `dev-preview` (`npm run build`, Vite) | tiempo de build + tamaño `dist/` | **~2.0 s** de build; `dist` = **352 KB** (JS 307.92 KB + CSS 41.31 KB; gzip JS 92.61 KB + CSS 7.04 KB) | — | — | informativo (1 solo chunk, sin code-splitting) |

**Sentencias SQL ejecutadas por llamada** (evidencia cuantitativa de N+1, instrumentando
`db.prepare`):

| Endpoint | 5.000 j. | 50.000 j. | Patrón |
|---|---:|---:|---|
| `Hoy` | 41 | 41 | 1 (jornadas del día) + N (marcas por jornada del día) |
| `Registros` 1 mes | 801 | 561 | 1 + N (N = filas del mes) |
| `Registros` TODO | 5 001 | 50 001 | **1 + N — exactamente N+1** |
| `Informe` 1 mes | 801 | 561 | 1 + N |
| `Informe` TODO | 5 001 | 50 001 | **1 + N — exactamente N+1** |

---

## 2. EXPLAIN QUERY PLAN — consultas calientes (`src/services/repos.js`)

Ejecutado a 5.000 y 50.000 filas (el plan no cambia con el volumen; SQLite elige el
mismo índice en ambos casos). **Ninguna de las consultas calientes hace `SCAN` de tabla
completa** — todas usan índice:

| Consulta (repos.js) | Plan obtenido | Índice usado (schema.js) |
|---|---|---|
| `jornadasDelDia(fecha)` | `SEARCH ... USING INDEX idx_presentia_jornadas_fecha (fecha=?)` | ✅ |
| `marcasDeJornada(jornadaId)` | `SEARCH ... USING INDEX idx_presentia_marcas_jornada (jornada_id=?)` **+ `USE TEMP B-TREE FOR ORDER BY`** | ✅ parcial — el índice cubre el filtro pero no el `ORDER BY ts, id` (índice sólo por `jornada_id`); coste irrelevante en la práctica porque cada jornada tiene ~4 marcas (ordenar 4 filas es gratis), pero se ejecuta **una vez por jornada** por el N+1 (§3.1) |
| `jornadasEnRango` CON `empleadoId` | `SEARCH ... USING INDEX idx_presentia_jornadas_emp (empleado_id=? AND fecha>? AND fecha<?)` | ✅ |
| `jornadasEnRango` SIN `empleadoId` | `SEARCH ... USING INDEX idx_presentia_jornadas_fecha (fecha>? AND fecha<?)` | ✅ |
| `jornadaAbiertaReciente(empleadoId)` | `SEARCH ... USING INDEX idx_presentia_jornadas_emp (empleado_id=?)` | ✅ |
| `jornadaDe(empleadoId, fecha)` | `SEARCH ... USING INDEX sqlite_autoindex_presentia_jornadas_2` (el `UNIQUE(empleado_id,fecha)`) | ✅ |
| `marcaPorId(id)` | `SEARCH ... USING INTEGER PRIMARY KEY (rowid=?)` | ✅ |

**Conclusión de índices: correctos y suficientes.** El problema de rendimiento en
Registros/Informe/Export **no es de índices ausentes**, es el patrón de acceso (N+1,
§3.1) y el coste por fila del formateo de fecha/hora (§3.2).

---

## 3. Cuellos de botella — causa y severidad

### 3.1 — N+1 en `marcasDeJornada` (CRÍTICO)
`hoy.service.hoy()`, `registros.service.componerJornada()` (usado por `listarJornadas`)
e `informe.service.informePorEmpleado()` iteran las jornadas del rango y llaman
`repos.marcasDeJornada(db, jornada.id)` **una vez por jornada**, en vez de traer las
marcas de todas las jornadas del rango con un único `WHERE jornada_id IN (...)` o un
`JOIN`. Medido: exactamente **N+1 sentencias** para N filas (tabla §1). Coste ≈0,2 ms por
sentencia extra ⇒ escala **linealmente** con el volumen: 1,04 s a 5k → 10,4 s a 50k para
`Registros`/`Informe` sin filtro estrecho. Con un filtro típico de "1 mes" el efecto ya
es visible (≈120-172 ms sólo por esto, muy cerca del límite de 200 ms) y empeorará sin
más volumen histórico si crece la plantilla (más filas/mes).

### 3.2 — `Intl.DateTimeFormat` reconstruido en cada llamada (ALTO — domina el coste de exportación)
`partesFecha()` (`src/domain/time.js`, usada por `fechaJornada`, `formatearHora`,
`formatearFechaHora`, `anioDe`) crea un `new Intl.DateTimeFormat(...)` **nuevo en cada
invocación** en lugar de reutilizar una instancia cacheada. Micro-benchmark aislado
(mismo entorno, `Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid', ...})`):

| Nº de invocaciones | Formatter nuevo cada vez | Formatter cacheado | Factor |
|---:|---:|---:|---:|
| 1 000 | 216.14 ms | 23.18 ms | ~9x |
| 100 000 | 17 490.91 ms | 1 139.99 ms | ~15x |

El export CSV/PDF llama `formatearHora` ~2 veces por jornada (entrada/salida): a 50.000
jornadas son ~100.000 llamadas, que **coinciden casi exactamente** con el coste medido
del export (19,6 s CSV / 22,6 s PDF, tabla §1). Esta es la causa **dominante** —por
encima del propio N+1— de que las exportaciones sean, con diferencia, lo más lento del
módulo. Es una única línea de causa raíz que explica el mayor incumplimiento de
objetivo del informe (hasta ~22x el límite de 1 s a 50k).

### 3.3 — Sin paginación en `Registros` (servidor y UI) (ALTO)
`registros.listarJornadas()` (y el handler `manager.registros`) no admite `limit`/`offset`;
devuelve TODO el rango solicitado. `manager/tabs/Registros.jsx` renderiza **todas** las
filas recibidas en una única `<table>` (`filas.map(...)` directo en el `<tbody>`, sin
virtualización ni paginación — verificado leyendo el JSX, líneas 269-307). El filtro por
defecto es "mes en curso" (mitiga el caso común), pero el admin puede ampliar el rango
libremente y no hay ningún límite de filas ni en el servidor ni en el cliente: con la
combinación de 3.1+3.3, abrir "Registros" de todo el histórico a 50k jornadas tarda
>10 s en el servidor antes de que la UI reciba nada que pintar.

### 3.4 — SQLite en fichero sin `PRAGMA busy_timeout`/`journal_mode=WAL` (ALTO, condicionado a la integración)
`src/db/migrate.js` sólo ejecuta `CREATE TABLE/INDEX IF NOT EXISTS`; ningún punto del
código de Presentia fija `PRAGMA busy_timeout` ni `journal_mode`. Comprobado que
`node:sqlite` abre un fichero nuevo con **`journal_mode=delete`** (no WAL) y
**`busy_timeout=0`** si nadie los configura. Prueba real con **dos procesos** escribiendo
al mismo fichero (`revision/_scripts/child-writer-a.mjs`/`-b.mjs`): el proceso A retiene
el candado de escritura 400 ms; el proceso B, que intenta escribir a los 150 ms, recibe
**inmediatamente** `ERR_SQLITE_ERROR: database is locked` (sin esperar ni reintentar).
**Matiz importante:** dentro de UN SOLO proceso Node (el caso real: un servidor Fastify
único, como `dev-preview/api-server.mjs`), `node:sqlite` es síncrono y bloqueante, así
que las peticiones "simultáneas" de varias tablets se **serializan** en el mismo hilo sin
riesgo de corrupción (medido: 10 fichajes "simultáneos" ⇒ 137,45 ms en total, ≈ igual a
la suma de sus tiempos individuales, 0 errores). El riesgo de `SQLITE_BUSY` sólo se
manifiesta si el puerto `db` que aporte Expira usa **más de una conexión/proceso** al
mismo fichero (p.ej. un proceso de mantenimiento/backup corriendo a la vez, o varios
workers). Presentia no defiende contra ese escenario (no fija `busy_timeout` aunque tiene
acceso a `db.exec` en `migrate()`), así que **debe verificarse contra el puerto real de
Expira** antes de descartar el riesgo.

### 3.5 — Mapas en memoria sin barrido periódico (BAJO/MEDIO)
`crearRateLimiter` (`buckets`) y `crearKioskSessions` (`store`) en `src/http/authz.js` y
`src/http/kiosk-session.js` exponen `.reset()`/`.limpiar()`, pero **ningún punto del
código** (ni `fastify-adapter.js` ni `dev-preview/api-server.mjs`, comprobado por grep)
los invoca nunca. En un proceso de larga duración (el mini-PC del kiosko, encendido todo
el día) ambos `Map` crecen sin cota superior explícita (acotados de facto por el número
de combinaciones dispositivo+empleado y por la caducidad de 90 s de las sesiones, que
sólo se purga de forma perezosa al validar un token, no proactivamente). No es una fuga
por temporizador (no existe tal temporizador), sino una estructura sin barrido.

### 3.6 — Sin cache de sentencias preparadas (BAJO-MEDIO, parte del mismo síntoma que 3.1)
Cada función de `repos.js` hace `db.prepare(sql)` de nuevo en cada llamada (no hay
`Map` de sentencias precompiladas reutilizables). Con el patrón N+1 (3.1), esto añade un
coste de recompilación SQL por cada una de las N llamadas repetidas a la misma sentencia
`SELECT * FROM presentia_marcas WHERE jornada_id = ?`.

### 3.7 — Bundle Vite sin code-splitting (BAJO / informativo)
`manager/PresentiaSection.jsx` importa las 6 pestañas (`Hoy`, `Registros`,
`InformeHoras`, `Solicitudes`, `Ajustes`, `Legal`) de forma estática (sin `React.lazy` /
`Suspense`); el build de `dev-preview` genera **un solo chunk** de 307,92 KB JS (92,61 KB
gzip) + 41,31 KB CSS (7,04 KB gzip), construido en ~2,0 s. Para un módulo empotrado de
este tamaño el impacto real es bajo (no es una SPA completa; se carga una vez por sesión
de Manager), pero es una oportunidad de mejora menor.

### 3.8 — Confirmaciones POSITIVAS (no son defectos, se documentan por transparencia)
- **Autorefresco "Hoy" (15 s)** y **reloj del kiosko (1 s)**: ambos `setInterval` se
  limpian correctamente en el `return` de su `useEffect` (`manager/tabs/Hoy.jsx` líneas
  29-37; `kiosk/FicharScreen.jsx` líneas 21-24, componente `Reloj`). **No hay fuga de
  memoria por temporizadores sin `clearInterval`.**
- **Latencia de un fichaje individual** (`fichar()`, autocommit real con `fsync` de
  fichero, `synchronous=FULL` por defecto): mediana ~9-9,6 ms tanto a 5k como a 50k de
  historial — **no degrada con el volumen** (los índices de escritura, `jornadaDe` y
  `jornadaAbiertaReciente`, son de búsqueda directa). Objetivo <300 ms cumplido con
  margen amplio (~30x).
- **Arranque del módulo** (import + `crearModulo`, incluida la migración real sobre un
  fichero nuevo): ~183 ms; una segunda llamada a `migrate()` (no-op, esquema ya
  presente) tarda ~2,8 ms. Cumple el objetivo de "pantalla usable <2 s" con margen
  amplio. **Nota aparte:** `crearReferenceEnv()` (entorno de referencia, **sólo
  dev/test**) tarda ~600 ms en sembrar 4 PIN de demostración porque usa `scrypt`
  (KDF lenta a propósito, §6.1 del propio módulo); este coste **no existe en
  producción** (Expira aporta sus propios empleados/PIN ya gestionados) y no se ha
  contabilizado en el tiempo de arranque de producción de la tabla §1.
- **Sin `SCAN` de tabla completa** en ninguna consulta caliente, a ningún volumen (§2).
- **Sin temporizadores en el backend** (`src/**`): 0 coincidencias de
  `setInterval`/`setTimeout` fuera de la UI (grep confirmado); CPU en reposo del propio
  módulo ≈ 0 (sin *polling*). El consumo en reposo del mini-PC vendrá del proceso
  Node/Fastify/SO en general, no de Presentia.

---

## 4. Concurrencia — detalle de la prueba (`revision/_scripts/concurrencia.mjs`)

```
1) 10 "tablets" fichando casi a la vez, MISMO proceso Node:
   emp0: 62.35 ms  emp1: 9.15 ms  emp2: 8.61 ms  emp3: 8.36 ms  emp4: 7.79 ms
   emp5: 7.41 ms   emp6: 8.67 ms  emp7: 7.62 ms  emp8: 8.50 ms  emp9: 7.58 ms
   Tiempo TOTAL: 137.45 ms  (suma individual: 136.04 ms) → SERIALIZADO, 0 errores.

2) Contención REAL entre 2 PROCESOS sobre el mismo fichero SQLite:
   PRAGMA busy_timeout por defecto: 0 ms
   PRAGMA journal_mode: delete (no WAL)
   [A] candado de escritura tomado a +0ms
   [A] commit OK a +407ms
   [B] BLOQUEADO a +152ms — ERR_SQLITE_ERROR database is locked
```

Interpretación: sin carreras de datos dentro de un proceso único (bueno); riesgo real de
`SQLITE_BUSY` sólo si Expira usa múltiples conexiones/procesos al mismo fichero sin
`busy_timeout` — **pendiente de verificar contra el puerto `db` real de Expira**
(⛔ NO VERIFICADO en este entorno, ya que no hay integración real disponible, igual que
constató la auditoría funcional previa en `auditoria/01-INFORME-AUDITORIA.md`).

---

## 5. Resumen de objetivos (MEDIDO vs OBJETIVO)

| Objetivo | Medido | Resultado |
|---|---|---|
| Endpoint normal <200 ms | `Hoy` 8-9 ms ✅ · `Registros`/`Informe` 1 mes 106-172 ms ⚠️ (roza) · `Registros`/`Informe` SIN filtro 1 039-10 421 ms ❌ | Cumple sólo en el caso acotado |
| Informe <1 s | 1 mes: ✅ (106-156 ms) · TODO el rango: 1,08 s (5k, roza) / 9,79 s (50k) ❌ | Depende del rango |
| Exportación (CSV/PDF) <1 s (asimilado a "informes") | 1,9-2,0 s (5k) / 19,6-22,6 s (50k) ❌ | Incumplido en ambos volúmenes |
| Marcar un fichaje <300 ms | 9,17-9,56 ms ✅ | Cumplido con margen ~30x |
| Pantalla usable <2 s | Arranque del módulo 183 ms ✅ (el resto —bundle, red— fuera del alcance de este agente) | Cumplido (parcial: sólo el arranque del módulo) |

---

## 6. Datos para el orquestador (resumen)

**Tabla clave (mediana, ms):**

| Operación | 5.000 | 50.000 |
|---|---:|---:|
| Hoy | 9,14 | 8,17 |
| Registros (1 mes) | 171,84 | 120,84 |
| Registros (TODO) | 1 038,79 | 10 421,22 |
| Informe (TODO) | 1 081,57 | 9 794,49 |
| Export CSV (TODO) | 1 935,75 | 19 600,03 |
| Export PDF (TODO) | 2 015,95 | 22 613,48 |
| Fichar (1 marca) | 9,56 | 9,17 |

**Cuellos de botella priorizados:**
1. **[CRÍTICO]** N+1 en `marcasDeJornada` (Hoy/Registros/Informe) — 1 query extra por
   cada jornada; domina el coste a partir de cientos de filas (10,4 s a 50k sin filtro).
2. **[ALTO]** `Intl.DateTimeFormat` reconstruido en cada `formatearHora`/`fechaJornada`
   (`src/domain/time.js`) — causa dominante del coste de exportación CSV/PDF (~15x más
   lento que cachear el formatter; explica los 19,6-22,6 s a 50k).
3. **[ALTO]** Sin paginación en `Registros` (servidor: `listarJornadas` sin
   `limit`/`offset`; UI: `manager/tabs/Registros.jsx` pinta toda `filas` sin
   virtualizar).
4. **[ALTO, condicionado]** Sin `PRAGMA busy_timeout`/`journal_mode=WAL` — confirmado
   `SQLITE_BUSY` inmediato entre dos procesos escribiendo al mismo fichero; sin riesgo
   dentro de un único proceso Node (medido, serializa sin error). Pendiente verificar
   contra el puerto `db` real de Expira.
5. **[BAJO/MEDIO]** `rate` y `kioskSessions` (Maps en memoria) sin barrido periódico
   (`.limpiar()`/`.reset()` nunca invocados).
6. **[BAJO-MEDIO]** Sin cache de sentencias preparadas en `repos.js` (recompila SQL en
   cada llamada; agrava el síntoma de #1).
7. **[BAJO]** Bundle Vite en un solo chunk (307,92 KB JS / 92,61 KB gzip), sin
   `React.lazy`/`Suspense` en `PresentiaSection.jsx`.
8. **Confirmado sin defecto:** intervalos de UI (`Hoy` 15 s, reloj del kiosko 1 s) se
   limpian correctamente; sin `SCAN` de tabla completa en ninguna consulta caliente, a
   ningún volumen; latencia de fichaje individual no degrada con el histórico.

**Entregable:** `revision/04B-RENDIMIENTO.md` (este documento).
**Scripts de medición (desechables):** `revision/_scripts/perf.mjs`,
`revision/_scripts/arranque.mjs`, `revision/_scripts/concurrencia.mjs`,
`revision/_scripts/child-writer-a.mjs`, `revision/_scripts/child-writer-b.mjs`.
