# 00 · AUDITORÍA DE COBERTURA + PASE ADVERSARIAL — Revisión integral Presentia

**Rol:** orquestador-revisor (solo análisis; no se ha tocado código ni tests, no hay commits).
**Fecha:** 2026-07-19 · **cwd:** `presentia-expira` (confirmado con `pwd`).
**Fuentes cruzadas:** `revision/00-REGISTRO-HALLAZGOS.md` (registro maestro, 31 hallazgos),
`02-FALLOS-KIOSKO.md`, `03-FALLOS-ADMIN.md`, `04-SEGURIDAD-Y-RENDIMIENTO.md` (= `04A`+`04B`),
`docs/DOCUMENTACION-PRESENTIA.md` §14.
**Nota:** `05-CAMBIOS-APLICADOS.md` y varios ficheros de `src/` estaban siendo modificados por otro
agente (Fase 5, Bloque A aplicado); se leyeron pero **no** se toman como estado final.

---

## PARTE 1 — AUDITORÍA DE COBERTURA

### 1.1 Trazabilidad hallazgo de origen → registro maestro

| Origen | Nº en informe | Recogidos en el registro | Veredicto |
|---|---|---|---|
| Kiosko (K-01…K-08) | 8 | K-01,02,03,04,05,06,08 explícitos; **K-07 deduplicado en S-03** (línea 30) | ✅ 8/8 |
| Admin (A-01…A-09) | 9 | A-01…A-09 todos presentes | ✅ 9/9 |
| Seguridad (S-01…S-07) | 7 | S-01,02,03,06,07 explícitos; S-04+S-05 agrupados como "S-04/05 LOW" | ⚠️ 7/7 pero ver 1.2 |
| Rendimiento (Perf-1…7) | 7 | Perf-1…7 todos presentes | ✅ 7/7 |
| Documentación (§14) | **10** (no 8) | Solo 8 mapeados (doc#1…doc#8) | ❌ **2 sin rastrear** — ver 1.3 |

Severidades: coherentes en todos los bloques de datos/kiosko/admin/rendimiento (BLOQUEANTE/CRÍTICO/
MAYOR/MENOR y CRÍTICO/ALTO/BAJO se corresponden 1:1 con los informes de origen). **Excepción: S-05**
(ver 1.2).

### 1.2 CONFIRMADO — S-05: severidad mal codificada + duplicación con LEG-1

- En `04A-SEGURIDAD.md`, **S-05 ("purga controlada y auditada no implementada") es `MEDIUM`**.
  En el registro maestro (`00-REGISTRO-HALLAZGOS.md:35`) aparece agrupado como **`S-04/05 | LOW`** →
  degrada una severidad MEDIUM a LOW.
- Además **S-05 es el MISMO hallazgo que LEG-1 / doc#4** ("`conservacionAnios` sin job/endpoint de
  purga", registro línea 54). Queda por tanto **listado dos veces** con disposiciones distintas:
  como LEG-1 (Bloque D, "FIX función guardada+auditada") y dentro de "S-04/05" (Bloque B, "FIX/DOC").
- **Impacto:** riesgo de que en la ejecución se cuente/cierre dos veces, o de que se trate como LOW
  cuando el informe de seguridad lo marcó MEDIUM (cumplimiento RGPD art. 5.1.e). Recomendación:
  colapsar S-05 en LEG-1 y borrar la mención "S-05" de la línea 35 (dejar solo S-04 LOW).

### 1.3 CONFIRMADO — 2 de las 10 observaciones de documentación (§14) NO están en el registro

El registro consolida "8 observaciones de documentación" (doc#1…doc#8), pero `DOCUMENTACION-PRESENTIA.md`
§14 contiene **10 observaciones numeradas**. Mapeo por contenido:

| §14 | Contenido | En el registro |
|---|---|---|
| 1 | FK no forzadas (`PRAGMA foreign_keys`) | ✅ FK-1 (doc#1) |
| 2 | Auditoría no detecta truncamiento de cola | ✅ S-02 (doc#2) |
| 3 | `jornadaEstandarMin` decorativo | ✅ A-05 (doc#3) |
| 4 | `conservacionAnios` sin purga | ✅ LEG-1 (doc#4) |
| 5 | Rate limit solo 2/24 endpoints | ✅ S-06 (doc#5) |
| 6 | `fichar` sin protección de servidor doble-envío | ✅ K-04 (doc#6) |
| 7 | Fuente Inter nunca se carga | ✅ UI-1 (doc#7) |
| **8** | **`editarMarca` no valida coherencia `ts` ↔ `fecha` de la jornada (OBS-3)** | ❌ **NO** |
| **9** | **Jornada huérfana ≥24h (turno de noche) sin alerta/KPI** | ❌ **NO como entrada propia** |
| 10 | Documentos legales con marcadores `[NOMBRE_EMPRESA]` | ✅ LEG-2 (**etiquetado doc#8**) |

- El registro **renumeró** los marcadores legales de §14 #10 → "doc#8" y, al hacerlo, **dejó fuera §14
  #8 y §14 #9**.
- **§14 #8 (OBS-3) es una laguna viva y distinta de A-02.** A-02 (ya corregido en Bloque A) solo valida
  el orden entrada→salida *dentro* de la jornada; **no** impide que un admin mueva una marca a otro día
  o año dejando `presentia_jornadas.fecha` obsoleta. Verificado en `registros.service.js:61-87`
  (`editarMarca`): tras el fix A-02 solo se llama a `exigirOrdenCronologico`, nunca se recalcula ni
  contrasta `fecha`. → **Debe rastrearse como hallazgo propio** (disposición razonable: DOC o FIX menor).
- **§14 #9 (huérfana ≥24h sin alerta):** distinta de K-01 (K-01 era la corrupción <24h). El fix K-01 del
  Bloque A la aborda *incidentalmente* (marca `requiere_correccion=1` + insignia en Registros +
  auditoría `jornada_abandonada`), pero **el residuo sigue vivo**: no hay KPI ni aviso proactivo en
  "Hoy". Como *cobertura*, nunca fue una entrada rastreable del registro; conviene dejar constancia
  explícita del residuo.

### 1.4 Disposición dudosa (baja confianza)

- **A-05 (MAYOR → DOC).** El informe de admin la ranquea entre los 5 más graves (MAYOR); el registro la
  marca `DOC (decisión de producto)`. Defendible (es un campo de config sin consumidor, no un bug de
  cálculo), pero un ajuste MAYOR marcado DOC debería llevar aparejado, como mínimo, que la UI de Ajustes
  indique "solo informativo"; de lo contrario, para el admin es indistinguible de un ajuste roto (lo dice
  el propio A-09). Sugerencia: mantener DOC **pero** condicionarlo a una nota visible en la UI.

### Veredicto de cobertura
**Trazabilidad de kiosko / admin / seguridad / rendimiento: completa.** Con **tres salvedades
confirmadas**: (1) S-05 con severidad degradada (MEDIUM→LOW) y duplicada con LEG-1; (2) §14 #8 (OBS-3,
`ts`↔`fecha`) sin rastrear; (3) §14 #9 (huérfana ≥24h sin alerta) sin entrada propia (solo abordada de
refilón por K-01). No se detectó ningún hallazgo de kiosko/admin/seguridad/rendimiento perdido.

---

## PARTE 2 — PASE ADVERSARIAL (clases de fallo no cubiertas por los 5 agentes)

Método: relectura de `handlers.js`, `fichaje/registros/solicitudes/ajustes.service.js`,
`domain/{jornadas,time,correlativo}.js`, `repos.js`, `ports.js`, `fastify-adapter.js`; comprobaciones
aisladas en `node:sqlite` (scratchpad, no toca el repo).

### CONFIRMADO

**ADV-1 · [MEDIA] Sin límite de tamaño/longitud de payload en NINGÚN endpoint → almacenamiento no
acotado.**
`src/services/solicitudes.service.js:42-49` (`crear`) hace `JSON.stringify(cambio)` y persiste `motivo`
sin ninguna cota de longitud; igual `editarMarca`/`anadirMarca`/`crearJornadaCompleta` (`motivo`) y
`aprobar`/`rechazar` (`comentario`). No hay validación de longitud en `handlers.js` ni en los servicios
(grep confirmado). Comprobado en `node:sqlite`: una cadena de **5.000.000 de caracteres se almacena sin
error ni truncado**. Combinado con **S-06** (`crearSolicitud` sin rate-limit) y una micro-sesión de
kiosko de 90 s, un empleado autenticado puede inflar `presentia_solicitudes` con payloads gigantes →
agotamiento de disco / degradación. Los 5 agentes cubrieron el *número* de peticiones (S-06) pero no el
*tamaño* del payload. **Fichero:** `src/services/solicitudes.service.js:42-49`; ausencia de guardas de
longitud en `src/http/handlers.js:138-144`, `172-198`, `220-234`.

**ADV-2 · [BAJA] `desde`/`hasta` nunca se validan como fecha y se reflejan sin sanitizar en la cabecera
`Content-Disposition` de las exportaciones.**
`handlers.js:128-136` (`kiosk.exportar`) y `206-213` (`manager.informeExport`) construyen
`filename` = `` `mis-horas-${desde}_${hasta}.csv` `` / `` `informe-${desde}_${hasta}.csv` `` a partir de
`ctx.query` **sin validar** que sean `YYYY-MM-DD`, y `fastify-adapter.js:35` los inyecta en
`reply.header('Content-Disposition', ...)`. En SQL solo se usan en comparación de cadenas (`fecha >= ?`,
parametrizado → sin SQLi), así que un valor raro devuelve un informe vacío en silencio; pero el reflejo
del parámetro en una cabecera de respuesta es una superficie de manipulación de nombre de descarga
(comillas en el `filename`). **Fichero:** `src/http/handlers.js:134-135`, `211-212` +
`src/http/fastify-adapter.js:35`.
> Explotabilidad real (response-splitting con CRLF) → **SOSPECHA**: Node suele rechazar caracteres de
> control en cabeceras (`ERR_INVALID_CHAR`), lo que limita el impacto a un `filename` malformado. El
> hecho *confirmado* es la ausencia de validación de `desde`/`hasta` y el reflejo sin sanear.

**ADV-3 · Confirmaciones NEGATIVAS (responden a las preguntas explícitas del encargo; NO son fallos):**
- **Colisión de correlativos F-AAAA-NNNN bajo concurrencia:** NO ocurre intra-proceso. `correlativo.js:24-35`
  usa `INSERT … ON CONFLICT DO UPDATE SET ultimo = ultimo + 1 RETURNING ultimo` (atómico en una sola
  sentencia) y `node:sqlite` es síncrono en un proceso → serializa. Entre procesos, el riesgo es
  `SQLITE_BUSY` (ya rastreado como **Perf-4**), no un correlativo duplicado (el `UNIQUE(codigo)` lo
  atraparía además).
- **Minutos negativos:** imposibles. `jornadas.js:38-44` solo suma segmentos con `salida > entrada`;
  `formatearDuracion` (`:77-81`) hace `Math.max(0, …)`.
- **DST / cambio de hora:** el cómputo es por diferencia de epoch (`jornadas.js:41`), que refleja el
  tiempo real transcurrido; la bucketización de fecha usa `Intl.DateTimeFormat` en la zona del centro
  (`time.js:13-33`). Coherente en el límite de mes/año (turno 31-dic→1-ene: la jornada se ancla al día
  de la entrada; el correlativo usa `anioDe(entrada)`).
- **`Number(id)`=`NaN` en `aprobar`/`rechazar`/`editarMarca`/`anadirMarca`:** NO produce 500.
  Verificado en `node:sqlite`: enlazar `NaN` devuelve fila vacía → el servicio lanza el 404 limpio
  esperado (`SOLICITUD_INEXISTENTE`/`MARCA_INEXISTENTE`/`JORNADA_INEXISTENTE`).
- **Autorización por endpoint:** cada `kiosk.*` invoca `requireCanalKiosko` y cada `manager.*` invoca
  `requireRol` al inicio (revisado handler por handler en `handlers.js`); no hay endpoint sin guarda.
- **Fuga de info en errores HTTP:** `fastify-adapter.js:39-46` solo emite mensaje público genérico y
  loguea `e.message` únicamente si `status>=500`; sin stack en la respuesta.

### SOSPECHA (requiere verificación)

**ADV-S1 · [MENOR–MAYOR, SOSPECHA — código en curso] El fix A-02 valida la jornada COMPLETA con
alternancia estricta; podría bloquear la corrección de jornadas ya inconsistentes.**
`exigirOrdenCronologico` (`registros.service.js:26-31`, `solicitudes.service.js:17-22`) exige que TODAS
las marcas de la jornada (con el cambio simulado) alternen estrictamente entrada/salida con `ts`
creciente. Si una jornada ya está inconsistente (p. ej. datos importados/legados con dos entradas o una
salida huérfana), **editar cualquier marca para arreglarla dispararía `ORDEN_INVALIDO` (400)** —
justamente las jornadas rotas que un admin necesita corregir. En un sistema *solo-toggle* limpio no se
puede llegar a ese estado por las rutas guardadas (por eso es SOSPECHA de bajo alcance), pero conviene
verificarlo contra datos migrados de Expira. **Fichero:** `src/domain/jornadas.js:102-113` +
llamadas en `registros.service.js:71,99` y `solicitudes.service.js:76,85`.

**ADV-S2 · [BAJA/LATENTE, SOSPECHA] `undefined` como parámetro enlazado lanza `TypeError` en
`node:sqlite`.**
Verificado: `db.prepare('… = ?').get(undefined)` → `TypeError: Provided value cannot be bound to SQLite
parameter`. Hoy **no** hallé ruta HTTP que alcance un bind `undefined` (los ids se coaccionan con
`Number()`→`NaN`, `jornadaId`/`marcaId` por defecto a `null`, y `motivo` se valida antes). Riesgo
latente si una futura refactorización pasara un campo de body opcional directo a un `.get`/`.run`; en tal
caso el adaptador respondería `500 ERROR` en vez de un 400 controlado.

**ADV-S3 · [BAJA, SOSPECHA] `crearJornadaCompleta`/`editarMarca` sin cota máxima de duración.**
`exigirOrdenCronologico` solo verifica `salida > entrada`, no un máximo. Un admin puede crear/editar una
jornada con entrada y salida separadas por meses (minutos disparatados), sin aviso; es la manifestación
de la laguna §14 #8 (OBS-3) sobre el nuevo `crearJornadaCompleta` (`registros.service.js:122-154`).
Admin-only y auditado, por eso baja severidad. **Sugerencia:** contrastar contra `maxDuracionJornadaMin`.

### TODO/FIXME/HACK en código
Grep en todo el repo (excl. `node_modules`): **cero** `TODO/FIXME/HACK/XXX` en `src/`, `manager/`,
`kiosk/`, `shared/`. Las únicas ocurrencias son `TODO-LEGAL` / `TODO-INTEGRACIÓN` en `legal/*.md`,
`docs/`, `INTEGRACION-EN-EXPIRA.md` y `README.md` — ya rastreadas (LEG-2 / INTEG).

---

## RESUMEN PARA EL ORQUESTADOR PRINCIPAL

**(1) Veredicto de cobertura:** hay hallazgos de origen sin rastrear → **SÍ**, tres:
- §14 **#8 (OBS-3)** — `editarMarca` no valida `ts`↔`fecha` de la jornada: **fuera del registro** (A-02
  no lo cubre; laguna viva).
- §14 **#9** — jornada huérfana ≥24h sin alerta/KPI: **sin entrada propia** (solo abordada de refilón por
  el fix K-01; residuo "Hoy" sin aviso sigue vivo).
- **S-05** — severidad degradada MEDIUM→LOW y **duplicada** con LEG-1/doc#4 (misma "purga no
  implementada"). Además, disposición dudosa (baja confianza): **A-05** (MAYOR marcado DOC).

**(2) Hallazgos NUEVOS del pase adversarial (priorizados):**
- CONFIRMADO — **ADV-1 [MEDIA]** sin límite de tamaño de payload (`motivo`/`comentario`/`cambio`);
  amplifica S-06 → almacenamiento no acotado. `solicitudes.service.js:42-49`.
- CONFIRMADO — **ADV-2 [BAJA]** `desde`/`hasta` sin validar y reflejados en `Content-Disposition`.
  `handlers.js:134-135,211-212` + `fastify-adapter.js:35`.
- SOSPECHA — **ADV-S1 [MENOR–MAYOR]** A-02 bloquea la corrección de jornadas ya inconsistentes
  (datos legados). `jornadas.js:102-113`.
- SOSPECHA — **ADV-S2 [BAJA/latente]** bind `undefined` → 500 (sin ruta explotable hoy).
- SOSPECHA — **ADV-S3 [BAJA]** sin cota de duración máxima en jornada manual/editada.
- Confirmaciones OK (sin fallo): correlativo atómico sin colisión, minutos no negativos, DST por epoch,
  `NaN` id → 404 limpio, cero `TODO/FIXME` en código de producto.

**(3) Ruta del informe:**
`C:\Users\david\Desktop\Programación\Orquestador-Programacion\proyectos\Presentia-Adaptacion\presentia-expira\revision\00-COBERTURA-AUDIT.md`
