# 05 · CAMBIOS APLICADOS — Fase 5 (correcciones)

Metodología: causa raíz (no parches de síntoma), test de regresión permanente por
fallo corregido, `npm test` verde en TODO momento (base 121/121 antes de empezar).
Entorno de verificación: `src/dev/reference-env.js` (BD SQLite en memoria); ningún
`.db` real ni el servidor `:8787` compartido han sido tocados.

---

## BLOQUE A — correctitud de datos/jornadas y zona horaria

Agente: `errores-agent`. Fecha: 2026-07-19.

### K-01 (BLOQUEANTE) — jornada abierta de un día anterior se cerraba con la hora de hoy

- **Qué fallaba:** al fichar, `fichar()` resolvía "la jornada abierta del empleado" con
  un único criterio débil (`< 24h` desde la última entrada) sin comprobar su antigüedad
  real ni a qué día pertenecía. Un empleado que olvidaba fichar la salida el lunes y
  volvía a fichar el martes por la mañana (p.ej. 23,5 h después) veía su fichaje
  registrado como la SALIDA de la jornada del lunes, con la hora de hoy: la jornada de
  ayer quedaba con una duración disparatada (23,5 h) y la jornada de hoy no llegaba a
  existir hasta el siguiente fichaje.
- **Causa raíz:** `jornadaObjetivo` sólo comprobaba `(now - últimaEntrada) < 24h`, una
  condición que es CIERTA tanto para un turno de noche legítimo (8 h) como para un olvido
  de salida de casi un día completo (23,5 h) — no distinguía ambos casos.
- **Qué se hizo:** nueva función `evaluarJornadaAbierta` (`src/services/fichaje.service.js`)
  que sólo reutiliza la jornada abierta si (a) el día de calendario de su entrada es hoy
  o el inmediatamente anterior (permite cruzar UNA medianoche: turno de noche) **Y**
  (b) su antigüedad es menor que el nuevo ajuste `maxDuracionJornadaMin` (por defecto
  960 min = 16 h). Si no es reutilizable, la jornada abierta se marca
  `requiere_correccion = 1` (columna nueva, aditiva vía `ALTER TABLE ADD COLUMN`
  idempotente en `src/db/migrate.js`) y NUNCA se cierra con la hora del fichaje actual;
  se abre una jornada nueva para la fichada de hoy. Se registra un evento de auditoría
  `jornada_abandonada`. `Registros` expone el campo `requiereCorreccion` con una insignia
  ámbar "Requiere corrección" (`manager/tabs/Registros.jsx`).
- **Ficheros:** `src/services/fichaje.service.js`, `src/services/repos.js` (nuevas
  `marcarJornadaRequiereCorreccion`, `ultimaMarcaEmpleado`), `src/db/migrate.js`
  (`ensureColumn`), `src/db/schema.js` (comentario), `src/ports.js`
  (`maxDuracionJornadaMin`), `src/services/registros.service.js` (`requiereCorreccion` en
  `componerJornada`), `manager/tabs/Registros.jsx` (insignia).
- **Tests que lo protegen:** `test/fase5-bloqueA.test.js` →
  `K-01 (a) · olvido de salida <24h...` (no contamina la jornada de ayer),
  `K-01 (b) · turno de noche legítimo...` (sigue cerrando la MISMA jornada — el caso
  imprescindible que no podía romperse), `K-01 · maxDuracionJornadaMin es configurable...`.
- **Evidencia real (re-ejecución del script de Ronda 1 tras el fix):**
  ```
  node revision/_scripts/k-noche-olvido.mjs
  === CASO K-NOCHE-01 ===
  Martes 07:30 -> re-login. estado.siguienteTipo = entrada  dentro= false  desde= null
  Martes 07:30 -> ... Resultado: tipo= entrada  jornadaId= 2  codigo= F-2026-0002
  Jornada del LUNES ...: {"estado":"abierta", ..., "requiere_correccion":1}
  Total de jornadas en BD tras el incidente: 2
  >>> DIAGNÓSTICO: No reproducido en este escenario: el sistema creó una jornada nueva para el martes.

  === CASO K-NOCHE-02 (control, turno de noche real) ===
  06:00 (+8h) -> ficha salida jornadaId= 1 (misma jornada? true )
  Total de jornadas en BD: 1 (esperado: 1, turno de noche correcto)
  ```
  Evidencia adicional (nuevo script, con aserciones): `node revision/_scripts/post-fix-k01-k04.mjs`
  → `TODAS LAS COMPROBACIONES OK`.

### A-01 (CRÍTICO) + K-06 (MENOR) + A-06 (MENOR) — zona horaria inconsistente/hardcodeada

- **Qué fallaba:** `Europe/Madrid` estaba hardcodeado como zona horaria OPERATIVA (no
  sólo de ejemplo) en: `manager/api.js` (`TZ_DEFECTO`, usado por `fmtHora` en
  `Hoy.jsx`/`InformeHoras.jsx`/`Solicitudes.jsx`/`Registros.jsx`, que la llamaban SIN
  pasar `tz`), `kiosk/FicharScreen.jsx` (`const TZ = "Europe/Madrid"`, reloj/fecha
  larga/toast). Peor aún: `tsAInputLocal`/`inputLocalATs` (modal Editar/Añadir marca del
  Manager) usaban la hora LOCAL DEL NAVEGADOR (`new Date().getHours()`), no Madrid ni
  `config.zonaHoraria` — es decir, la TABLA y el MODAL de una misma marca podían mostrar
  dos zonas horarias distintas, y guardar desde el modal podía escribir un instante
  absoluto desplazado varias horas sin ningún aviso.
- **Causa raíz:** no existía una única fuente de verdad de zona horaria en el frontend;
  cada función tenía su propio fallback (Madrid o navegador) en vez de recibir siempre
  `config.zonaHoraria` desde el backend.
- **Qué se hizo:**
  1. `src/domain/time.js` (backend, sin dependencias de Node, válido en el bundle del
     navegador — confirmado con `vite build`): nuevas `tsAValorLocal(ts, tz)` /
     `valorLocalATs(valor, tz)` / `diferenciaDiasCalendario`.
  2. `manager/api.js` y `kiosk/api.js`: `fmtHora`/`fmtReloj`/`fmtFechaLarga`/
     `tsAInputLocal`/`inputLocalATs`/`primerDiaMes`/`ultimoDiaMes` ahora EXIGEN `tz`
     (reexportan las funciones de `src/domain/time.js`; se elimina `TZ_DEFECTO`).
  3. Nuevo endpoint público `GET /kiosk/config` → `{ zonaHoraria }` (sin PIN, igual que
     `kiosk/empleados`) para que el kiosko conozca la zona ANTES de que el empleado se
     identifique.
  4. `manager/PresentiaSection.jsx` obtiene `zonaHoraria` de `GET /manager/ajustes`
     (ya existía la llamada para `temaPorDefecto`) y la pasa como prop `tz` a
     `Hoy`/`Registros`/`InformeHoras`/`Solicitudes`.
  5. `kiosk/FicharScreen.jsx` obtiene `tz` de `GET /kiosk/config` al montar y la pasa a
     `Reloj`, `fmtHora` del toast, el badge "Dentro desde" y a `MisRegistros`.
  6. Se eliminan TODOS los `Europe/Madrid` hardcodeados operativos (quedan sólo en
     `DEFAULT_CONFIG.zonaHoraria` — el valor por defecto configurable — y en comentarios/
     ejemplos).
- **Ficheros:** `src/domain/time.js`, `src/http/handlers.js` (`kiosk.config`,
  `manager.empleados`), `src/http/fastify-adapter.js`, `dev-preview/api-server.mjs`,
  `manager/api.js`, `manager/PresentiaSection.jsx`, `manager/tabs/Hoy.jsx`,
  `manager/tabs/InformeHoras.jsx`, `manager/tabs/Solicitudes.jsx`,
  `manager/tabs/Registros.jsx`, `kiosk/api.js`, `kiosk/FicharScreen.jsx`,
  `kiosk/MisRegistros.jsx`, `manager/README.md`, `kiosk/README.md`.
- **Test que lo protege:** `test/fase5-bloqueA.test.js` → `A-01 · valorLocalATs/
  tsAValorLocal son coherentes en una zona ≠ Madrid...` (round-trip exacto del instante
  absoluto para `America/New_York`), `A-01 · manager/api.js y kiosk/api.js exigen tz
  explícito...` (tabla y modal coinciden en la MISMA zona), `A-06 · rango por
  defecto...` (usa `config.zonaHoraria`, no la del navegador), `A-01/K-06 · GET
  /kiosk/config...`.
- **Evidencia real:**
  ```
  node -e "..." (ver test A-01, America/New_York):
    tabla (Madrid)  = 14:00
    tabla (NY)      = 08:00   <- antes SIEMPRE 14:00, ignorando la zona
    modal (NY)      = 2026-07-13T08:00   <- coincide con la tabla en la MISMA zona
    guardar sin cambios -> mismo instante absoluto (round-trip exacto)
  ```
  El script histórico `revision/_scripts/09-timezone-frontend.mjs` (Ronda 1) ahora
  informa `FALLO` en sus aserciones — es la prueba de que el bug que documentaba ya NO
  se reproduce: ese script fuerza deliberadamente NO pasar `tz` (para simular la llamada
  antigua) y comprueba que el resultado sea el hardcode `'14:00'` de Madrid; tras el fix
  ya no hay ningún hardcode de Madrid al que caer, así que esa aserción concreta deja de
  cumplirse (se conserva el script sin tocar como evidencia histórica de Ronda 1).

### A-02 (CRÍTICO) — editarMarca/anadirMarca no validaban el orden cronológico

- **Qué fallaba:** se podía editar una marca (o añadir una nueva) dejando la entrada en
  el mismo instante o después que su salida, sin ningún error.
- **Causa raíz:** no había ninguna validación de orden temporal antes de escribir en BD.
- **Qué se hizo:** nueva `ordenCronologicoValido(marcas)` en `src/domain/jornadas.js`:
  ordenadas por `ts`, las marcas deben alternar estrictamente `entrada, salida, entrada,
  salida…` empezando por `entrada`, con `ts` estrictamente creciente (ver D-08 en
  `DECISIONES.md` sobre por qué NO se reutiliza `emparejarSegmentos` para esto).
  `registros.service.js` (`editarMarca`/`anadirMarca`) y `solicitudes.service.js`
  (`aplicarCambio`, aprobar una solicitud) SIMULAN el cambio antes de tocar la BD y
  lanzan `ORDEN_INVALIDO` (400) con mensaje claro si es inconsistente.
- **Ficheros:** `src/domain/jornadas.js`, `src/services/registros.service.js`,
  `src/services/solicitudes.service.js`.
- **Test que lo protege:** `test/fase5-bloqueA.test.js` → `A-02 · editarMarca rechaza...`,
  `A-02 · anadirMarca rechaza...` (incluye verificación negativa: una salida posterior
  válida SÍ se acepta con normalidad).

### A-04 (MAYOR) — no se podía registrar un día olvidado por completo (0 marcas)

- **Qué fallaba:** `anadirMarca` exige una `jornadaId` ya existente; si un día no tiene
  NINGUNA marca, no existe fila en `presentia_jornadas` y no hay ningún punto de entrada
  para corregirlo desde el Manager.
- **Causa raíz:** el modelo de "añadir marca" asumía siempre una jornada preexistente.
- **Qué se hizo:** nueva `crearJornadaCompleta(deps, {empleadoId, entrada, salida,
  motivo, ...})` en `src/services/registros.service.js`: crea la jornada (con su
  correlativo) y sus dos marcas (entrada+salida) en una sola transacción; la fecha de
  jornada se DERIVA de `entrada` (misma regla que `fichar`, fuente única), no se acepta
  como parámetro independiente; rechaza si ya existe jornada ese día (`JORNADA_YA_EXISTE`)
  o si el orden es inconsistente (reutiliza `ordenCronologicoValido`, fix A-02). Nuevo
  endpoint `POST /manager/registros/jornada`. UI: botón "Añadir jornada olvidada" en
  `Registros.jsx` con selector de empleado (nuevo `GET /manager/empleados`, admin,
  incluye inactivos) + hora de entrada/salida + motivo obligatorio.
- **Ficheros:** `src/services/registros.service.js`, `src/http/handlers.js`
  (`manager.crearJornada`, `manager.empleados`), `src/http/fastify-adapter.js`,
  `dev-preview/api-server.mjs`, `manager/api.js`, `manager/tabs/Registros.jsx`.
- **Test que lo protege:** `test/fase5-bloqueA.test.js` → `A-04 · crearJornadaCompleta
  registra un día totalmente olvidado...` (incluye que un 2º intento sobre el mismo
  día da `JORNADA_YA_EXISTE`), `A-04 · crearJornadaCompleta exige motivo y orden
  cronológico válido`, `A-04 · GET /manager/empleados lista también inactivos...`.

### K-04 (MAYOR) — `fichar` sin guardia de servidor contra doble envío

- **Qué fallaba:** dos pulsaciones casi simultáneas del mismo empleado (doble-click, dos
  tablets, reintento de red) hacían que el servidor tratara la 2ª como un toggle normal:
  entrada seguida inmediatamente de salida, creando una "jornada" de 0 minutos.
- **Causa raíz:** `fichar` no comprobaba la antigüedad de la última marca del empleado
  antes de procesar una nueva.
- **Qué se hizo:** guardia en servidor (`src/services/fichaje.service.js`, dentro de la
  transacción): si existe una marca del empleado (en CUALQUIER jornada/dispositivo) con
  menos de `ventanaAntiRebotarFichajeSeg` segundos de antigüedad (nuevo ajuste, por
  defecto 3 s; 0 = desactivada), se rechaza con `FICHAJE_DUPLICADO` (429) y un mensaje
  claro; no se crea ninguna marca. Nueva `repos.ultimaMarcaEmpleado`. No afecta a
  fichadas espaciadas ni a empleados distintos (ver D-09 en `DECISIONES.md` sobre por
  qué se eligió RECHAZAR en vez de fusionar/ignorar).
- **Ficheros:** `src/services/fichaje.service.js`, `src/services/repos.js`,
  `src/ports.js` (`ventanaAntiRebotarFichajeSeg`).
- **Tests que lo protegen:** `test/fase5-bloqueA.test.js` → `K-04 · dos fichadas casi
  simultáneas...`, `K-04 · dos "tablets" fichando casi a la vez...`, `K-04 · fichadas
  espaciadas (> ventana) NO se ven afectadas`, `K-04 · empleados DISTINTOS no se
  bloquean entre sí...`, `K-04 · ventanaAntiRebotarFichajeSeg = 0 desactiva la
  guardia...`. Además, `test/auditoria.test.js` → el test que antes documentaba el bug
  como "observación" (`C3 · doble pulsación (observación)`) se REESCRIBIÓ como
  regresión del fix (`C3 · REGRESIÓN K-04...`, ver D-09).
- **Evidencia real (scripts de Ronda 1, re-ejecutados):**
  ```
  node revision/_scripts/k-dos-tablets.mjs
  Tablet A ficha -> {"tipo":"entrada", ...}
  ErrorPresentia: doble fichaje casi simultáneo
    code: 'FICHAJE_DUPLICADO', status: 429,
    publico: 'Ya se ha registrado tu fichaje hace unos segundos. Espera un momento.'
  ```
  (El script original no capturaba esta excepción nueva — por eso "crashea"; es
  precisamente la prueba de que el servidor ahora SÍ protege el doble toque. Evidencia
  limpia con try/catch: `node revision/_scripts/post-fix-k01-k04.mjs` →
  `TODAS LAS COMPROBACIONES OK`.)

---

## Verificación final

```
npm test
ℹ tests 139
ℹ pass 139
ℹ fail 0
```
139 = 121 base (uno de ellos, `C3 · doble pulsación`, con el CONTENIDO reescrito para
reflejar la conducta corregida — ver K-04/D-09; el recuento de tests no cambia) + 18
tests nuevos en `test/fase5-bloqueA.test.js` (K-01 ×3, A-01/K-06 ×3, A-06 ×1,
diferenciaDiasCalendario ×1, A-02 ×2, A-04 ×3, K-04 ×5 = 18). También se actualizó
`test/release.test.js` ("un arranque limpio... 10 ajustes" → 12, por los 2 ajustes
nuevos legítimos `maxDuracionJornadaMin` y `ventanaAntiRebotarFichajeSeg`).

`npm run smoke` → `SMOKE TEST: OK`. `cd dev-preview && npm run build` → build de Vite
correcto (confirma que las importaciones cruzadas `manager/kiosk` → `src/domain/time.js`
funcionan en el bundle del navegador).

## Checklist post-fix (por hallazgo)

- [x] K-01: el error ya no aparece; turno de noche protegido por test de regresión.
- [x] A-01/K-06/A-06: cero hardcodes de zona horaria operativos; tabla y modal coherentes.
- [x] A-02: rechazo con mensaje claro (`ORDEN_INVALIDO`, 400) en editar/añadir/aprobar.
- [x] A-04: día sin marcas se puede registrar; duplicado da error claro.
- [x] K-04: doble toque rechazado (`FICHAJE_DUPLICADO`, 429); fichadas legítimas intactas.
- [x] Manejo defensivo añadido (validación de tipos, límites acotados en `normalizeConfig`).
- [x] Causa raíz documentada en cada bloque de este documento y en `DECISIONES.md` (D-07…D-10).

---

## BLOQUE B — seguridad y permisos

Agente: `seguridad-agent`. Fecha: 2026-07-19. Base al empezar: `npm test` 139/139
(Bloque A ya aplicado). Fuente de los hallazgos: `revision/04-SEGURIDAD-Y-RENDIMIENTO.md`
y `revision/03-FALLOS-ADMIN.md`. Decisiones de diseño detalladas: `DECISIONES.md`
(D-11 a D-16).

### S-01 (HIGH) — rotar `x-presentia-dispositivo` anulaba el bloqueo de PIN y el rate limiter

- **Qué fallaba:** tanto el contador de fallos de PIN (`presentia_pin_intentos`, PK
  `(empleado_id, dispositivo)`) como el rate limiter de `entrar`/`fichar` (clave
  `` `entrar:${dispositivo}:${empleadoId}` ``) usaban `dispositivo` — la cabecera HTTP
  `x-presentia-dispositivo`, 100% controlada por el cliente sin validar — como parte de
  su clave. Cada valor distinto abría un "carril" nuevo con contador a cero.
- **Causa raíz:** la clave de un control anti-fuerza-bruta debe ser la IDENTIDAD
  ATACADA, no un dato que el propio atacante controla.
- **Qué se hizo:** `src/services/fichaje.service.js` (`intentosRow`/`registrarFallo`/
  `limpiarIntentos`) usa ahora una clave de bloqueo FIJA (`__bloqueo_por_empleado__`)
  indexada sólo por `empleadoId`; `src/http/handlers.js` cambia las claves del rate
  limiter a `` `entrar:${empleadoId}` ``/`` `fichar:${empleadoId}` `` (sin
  `ctx.dispositivo`). El dispositivo real se sigue auditando en el `detalle` de cada
  evento (no se pierde trazabilidad forense). Ver D-11.
- **Ficheros:** `src/services/fichaje.service.js`, `src/http/handlers.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `S-01 · rotar
  x-presentia-dispositivo YA NO anula el bloqueo por fuerza bruta de PIN`.
- **Evidencia real (script de repro re-ejecutado):**
  ```
  node revision/_scripts/06-bypass-backoff-dispositivo.mjs
  Intentos realizados: 200
  Veces que saltó PIN_BLOQUEADO: 27
  Veces que saltó RATE (429): 170
  Número de filas de intentos para e1: 1        <- antes: 200 (una por dispositivo falso)
  ```
  ANTES del fix: `0` bloqueos y `0` rechazos por RATE en 200 intentos (ver
  `revision/04-SEGURIDAD-Y-RENDIMIENTO.md`, hallazgo S-01).

### S-07 (HIGH) — `scryptSync` bloqueaba el bucle de eventos de Node

- **Qué fallaba:** `src/security/hash.js` usaba `crypto.scryptSync` (síncrono): cada
  verificación de PIN (~150 ms) bloqueaba TODO el proceso Node (kiosko y Manager
  comparten proceso); confirmado con `revision/_scripts/08-scrypt-blocking-cost.mjs`
  (0 de ~892 ticks esperados de un `setInterval` paralelo se ejecutaron durante 30
  verificaciones consecutivas).
- **Causa raíz:** uso de la variante SÍNCRONA de una KDF memory-hard en el hilo
  principal de JS, en vez de la variante asíncrona (que delega el cálculo al
  threadpool de libuv y libera el hilo principal).
- **Qué se hizo:** `hashSecret`/`verifySecret` (`src/security/hash.js`) se reescriben
  como funciones `async` sobre `crypto.scrypt` (mismo formato de hash, misma sal
  aleatoria, mismos parámetros de coste N/r/p, misma comparación en tiempo constante
  `timingSafeEqual`). Ver D-12 para la razón por la que `src/dev/reference-env.js`
  (el entorno de test, blindado contra `NODE_ENV=production`) mantiene un helper local
  SÍNCRONO para su propio `pin.verify` — evita una cascada de `async`/`await` a través
  de `kiosk.entrar` y las ~70 llamadas síncronas de la suite de tests existente, sin
  reducir la seguridad real (nunca corre en producción).
- **Ficheros:** `src/security/hash.js`, `src/dev/reference-env.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `S-07 · hashSecret/
  verifySecret son asíncronos...` (confirma `instanceof Promise`, corrección funcional
  y que un `setInterval` paralelo SÍ tiquetea durante varias verificaciones).
- **Evidencia real (script de repro re-ejecutado, ahora `await`-eando):**
  ```
  node revision/_scripts/08-scrypt-blocking-cost.mjs
  30 verificaciones (en paralelo, vía Promise.all) tardaron 1292 ms en total.
  Ticks de setInterval(5ms) registrados durante ese tiempo: 93 (antes: 0)
  => CONFIRMADO: el bucle de eventos siguió LIBRE...
  ```

### S-02 (HIGH) — `verificarIntegridad()` no detectaba el truncamiento de cola de la auditoría

- **Qué fallaba:** borrar la(s) fila(s) MÁS RECIENTE(S) de `presentia_auditoria` no
  rompía la cadena de hash (ninguna fila posterior referencia el hash eliminado);
  `verificarIntegridad()` devolvía `{ok:true}` tras ese borrado.
- **Causa raíz:** limitación estructural de un hash-chain simple sin ancla/checkpoint
  externo — sólo detecta manipulación "en el medio".
- **Qué se hizo:** nueva tabla aditiva `presentia_auditoria_ancla` (fila única: último
  id + último hash + recuento), actualizada en CADA `audit.registrar()`.
  `verificarIntegridad()` compara la última fila real contra el ancla tras recorrer la
  cadena; si no coincide (id, hash o recuento), devuelve `ok:false`. `migrate.js` siembra
  el ancla en instalación limpia y hace backfill único si se aplica sobre una BD con
  historial previo al fix. Ver D-13 (incluye la limitación reconocida: un atacante que
  también sepa falsificar el ancla la evadiría igual — el ancla vive en la misma BD).
- **Ficheros:** `src/services/audit.service.js`, `src/db/schema.js`, `src/db/migrate.js`.
- **Tests que lo protegen:** `test/fase5-bloqueB.test.js` → `S-02 · borrar la ÚLTIMA
  fila...` y `S-02 · el ancla también detecta borrar VARIAS filas finales de golpe`.
- **Evidencia real (script de repro re-ejecutado):**
  ```
  node revision/_scripts/01-audit-tamper.mjs
  ESCENARIO C: DELETE de la ÚLTIMA fila -> { ok: false, rotoEn: null, total: 5 }
  RESULTADO: detectado.
  ```
  ANTES del fix: `{ ok: true, rotoEn: null, total: 5 }` → "NO DETECTADO".

### K-02 (CRÍTICO) — empleado dado de baja podía entrar y operar en el kiosko

- **Qué fallaba:** `kiosk.entrar` sólo comprobaba `activo` implícitamente a través de
  `fichar` (que sí lo bloqueaba); `entrar` emitía igualmente un token de sesión válido
  a un empleado inactivo, y con ese token podía ver su estado/histórico, exportar y
  crear solicitudes — sólo "fichar" estaba bloqueado.
- **Causa raíz:** la comprobación de `activo` estaba en el lugar equivocado (sólo en
  `fichaje.fichar`), no en la puerta de entrada (`entrar`) ni en la resolución de
  sesión reutilizada por el resto de acciones autenticadas.
- **Qué se hizo:** `kiosk.entrar` comprueba `activo` ANTES de verificar el PIN (mismo
  código `EMPLEADO_INVALIDO`, 403, que ya usaba `fichar`) — un empleado inactivo ya NO
  recibe ningún token. `empleadoDeSesion` (usada por `estado`/`terminos`/
  `aceptarTerminos`/`misRegistros`/`solicitarDescarga`/`crearSolicitud`/`fichar`) ahora
  recibe `deps` y también comprueba `activo` — defensa en profundidad para el caso en
  que la baja ocurra DURANTE una sesión de 90s ya emitida.
- **Ficheros:** `src/http/handlers.js`.
- **Test que lo protege:** `test/auditoria.test.js` → `C3 · REGRESIÓN K-02: empleado
  inactivo NO puede autenticarse en el kiosko en absoluto...` (reescrito, ver D-15);
  `test/fase5-bloqueB.test.js` → `K-02 · empleado que causa baja DURANTE su sesión
  pierde el acceso a TODAS las acciones autenticadas` (7 acciones comprobadas).
- **Evidencia real (script de repro re-ejecutado y ampliado):**
  ```
  node revision/_scripts/k-inactivo-alcance.mjs
  CASO 1: kiosk.entrar RECHAZADO de raíz (ya no se emite ningún token): EMPLEADO_INVALIDO 403
  CASO 2 (baja a mitad de sesión): estado/terminos/aceptarTerminos/misRegistros/
    solicitarDescarga/crearSolicitud/fichar -> TODOS RECHAZADOS con EMPLEADO_INVALIDO 403
  ```
  ANTES del fix: sólo `fichar` fallaba; el resto de acciones funcionaban con normalidad.

### K-03 (MAYOR) — un admin podía aprobar/rechazar su propia solicitud

- **Qué fallaba:** `solicitudes.aprobar`/`rechazar` no comprobaban si el actor que
  resuelve es el mismo empleado que creó la solicitud (un admin también "ficha" como
  empleado en el kiosko y puede pedir correcciones sobre sí mismo).
- **Causa raíz:** ausencia de separación de funciones (self-approval) en el flujo de
  resolución de solicitudes.
- **Qué se hizo:** `exigirNoAutoaprobacion(s, actorId)` en
  `src/services/solicitudes.service.js`, invocada en `aprobar` y `rechazar` justo
  después de comprobar que la solicitud existe y está pendiente; lanza
  `AUTOAPROBACION_PROHIBIDA` (403) si `s.empleado_id === actorId`.
- **Ficheros:** `src/services/solicitudes.service.js`, `dev-preview/api-server.mjs`
  (la semilla de demostración aprobaba la solicitud de `a1` como `a1`: se cambió el
  creador a `t1` para no autoaprobarse).
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `K-03 · un admin NO puede
  aprobar ni rechazar su propia solicitud` (incluye regresión negativa: OTRO admin/
  técnico sí puede resolverla).
- **Evidencia real:**
  ```
  node -e "..." (ver sección de verificación) -> autoaprobacion -> rechazada:
    AUTOAPROBACION_PROHIBIDA No puedes aprobar ni rechazar tu propia solicitud.
  ```
  ANTES del fix (`revision/_scripts/05-fuerza-bruta-y-sesion.mjs`, bloque E): "a1 pudo
  APROBAR SU PROPIA solicitud".

### S-06 (MEDIUM) — `crearSolicitud`/`misRegistros`/`exportar` sin límite de tasa

- **Qué fallaba:** sólo `entrar`/`fichar` llamaban a `ctx.rate.check`; con un único
  token de sesión válido se podían generar cientos de solicitudes/exportaciones sin
  ningún límite (repro: 500/500 solicitudes y 200/200 PDFs aceptados).
- **Causa raíz:** el rate limiting no se aplicó de forma sistemática a todos los
  endpoints autenticados del kiosko, sólo a los dos primeros que se implementaron.
- **Qué se hizo:** `ctx.rate.check` con clave `` `<accion>:${empleadoId}` `` (empleadoId
  SERVER-TRUSTED, coherente con S-01) en `misRegistros`, `crearSolicitud`,
  `solicitarDescarga` y `exportar` (`src/http/handlers.js`).
- **Ficheros:** `src/http/handlers.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `S-06 · crearSolicitud/
  misRegistros/solicitarDescarga ahora tienen límite de tasa`.
- **Evidencia real (script de repro re-ejecutado y actualizado al flujo S-03/K-07):**
  ```
  node revision/_scripts/07-rate-limit-incompleto.mjs
  Aceptadas: 30 / Rechazadas: 470 (de las cuales por RATE: 470) (de 500)
  Exportaciones PDF generadas: 30 / rechazadas: 170 (de las cuales por RATE: 170) (de 200)
  ```
  ANTES del fix: 500/500 y 200/200 aceptadas, 0 rechazos.

### S-03 / K-07 (MEDIUM) — el token de sesión de kiosko viajaba en la URL de descarga

- **Qué fallaba:** `kiosk/api.js` construía `urlMisHorasCsv`/`urlMisHorasPdf` con el
  token de MICRO-SESIÓN (90 s de vida, reutilizable) en la query string; puede quedar
  registrado en logs de acceso, historial del navegador de un kiosko compartido o
  cachés de proxy.
- **Causa raíz:** reutilización del token de sesión (pensado para peticiones POST con
  body) en una descarga `GET`, que sólo puede llevar parámetros por URL.
- **Qué se hizo (diseño recomendado por el propio encargo):** token de DESCARGA nuevo,
  de UN SOLO USO y vida corta (20 s), distinto del token de sesión: nuevo endpoint
  `POST /kiosk/mis-horas/token` (exige el token de sesión en el BODY) que emite el
  token de descarga; `GET /kiosk/mis-horas.csv|.pdf` exige y CONSUME ese token de
  descarga (`ctx.descargaTokens.consumir`), nunca el de sesión. Ver D-14.
- **Ficheros:** `src/http/descarga-tokens.js` (nuevo), `src/index.js`,
  `src/http/handlers.js` (`kiosk.solicitarDescarga`, `kiosk.exportar`),
  `src/http/fastify-adapter.js`, `dev-preview/api-server.mjs`, `kiosk/api.js`,
  `kiosk/MisRegistros.jsx`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `S-03/K-07 · el token de
  SESIÓN ya no sirve en la query de exportar...` (rechazo del token de sesión, un solo
  uso del token de descarga, caducidad en segundos).
- **Evidencia real:**
  ```
  exportar con TOKEN DE SESIÓN en la query -> RECHAZADO: DESCARGA_INVALIDA
  CSV exportado (con token de DESCARGA, un solo uso): ... (funciona una vez)
  2º intento con el MISMO token de descarga -> RECHAZADO: DESCARGA_INVALIDA
  ```

### A-03 (MAYOR) — CSV de Registros (cliente) no neutralizaba inyección de fórmulas

- **Qué fallaba:** `manager/api.js` (`descargarCsvCliente`/`escapar`) sólo entrecomillaba
  ante `" ; \n`, sin anteponer `'` a celdas que empiezan por `= + - @` — a diferencia
  del CSV de backend (`src/export/csv.js`), que sí lo hacía.
- **Causa raíz:** dos exportadores CSV independientes (backend y cliente) con lógicas
  de escape DUPLICADAS y divergentes; el fix de CSV injection (`auditoria/02-DEFECTOS.md`,
  DEF-002) sólo se aplicó al de backend.
- **Qué se hizo:** se exporta `escaparCelda` desde `src/export/csv.js` (antes función
  privada `esc`) y `manager/api.js` la REUTILIZA en `descargarCsvCliente`, eliminando
  el escapado propio incompleto. Una única fuente de verdad para el escapado CSV.
- **Ficheros:** `src/export/csv.js`, `manager/api.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `A-03 · escaparCelda
  neutraliza...` y `A-03 · manager/api.js (CSV de cliente) reutiliza escaparCelda...`.
- **Evidencia real:** `escaparCelda("=cmd|'/c calc'!A1")` → `"'=cmd|'/c calc'!A1"`
  (antepone apóstrofo); confirmado también que `manager/api.js` importa `escaparCelda`
  de `src/export/csv.js` en vez de duplicar el escape.

### A-07 (MENOR) — UPDATE de aprobar/rechazar sin `WHERE estado='pendiente'`

- **Qué fallaba:** el guard "ya resuelta" sólo se comprobaba en un `SELECT` previo; el
  `UPDATE` final no repetía la condición `estado='pendiente'`, así que la garantía
  dependía ÚNICAMENTE de que Node ejecutara todo de forma síncrona sin puntos de
  suspensión entre la lectura y la escritura.
- **Causa raíz:** ausencia de un cinturón de seguridad a nivel de fila (SQL) que no
  dependa de la ausencia de concurrencia real.
- **Qué se hizo:** el `UPDATE` de `aprobar`/`rechazar`
  (`src/services/solicitudes.service.js`) añade `AND estado = 'pendiente'`; se
  comprueba `upd.changes === 0` y, si es así, se lanza `SOLICITUD_RESUELTA` (409) —
  incluso si una lectura previa (hipotéticamente obsoleta) hubiera dicho "pendiente".
  En `aprobar`, esto ocurre DENTRO del `SAVEPOINT`, así que si el `UPDATE` no aplica,
  `aplicarCambio` (que sí se ejecutó antes) se revierte también.
- **Ficheros:** `src/services/solicitudes.service.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `A-07 · el UPDATE de aprobar
  exige estado=pendiente...` (simula una lectura obsoleta interceptando el `SELECT`
  inicial vía un `db.prepare` envolvente; confirma que ni el estado ni la marca quedan
  corrompidos).

### A-08 (MENOR) — `manager.*` no comprobaba `ctx.canal`

- **Qué fallaba:** cada handler `kiosk.*` empieza con `requireCanalKiosko` (cinturón de
  seguridad redundante); ningún handler `manager.*` tenía el equivalente — asimetría de
  diseño (no explotable HOY porque el enrutado real fija `canal` en el servidor, pero
  contraria a la regla general "ocultar un botón no es autorizar").
- **Causa raíz:** el cinturón de seguridad de canal sólo se añadió en un lado
  (kiosko) al construir el módulo.
- **Qué se hizo:** nueva `requireCanalManager(canal)` en `src/http/authz.js`, invocada
  como PRIMERA línea de los 16 handlers `manager.*` (simétrico a `requireCanalKiosko`).
- **Ficheros:** `src/http/authz.js`, `src/http/handlers.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `A-08 · manager.* rechaza
  CANAL_INVALIDO si el canal no es "manager"...` (16 acciones comprobadas + regresión
  negativa con canal correcto).
- **Evidencia real (script de repro re-ejecutado):**
  ```
  node revision/_scripts/07-permisos.mjs
  INFO: manager.hoy() invocado con canal='kiosk' pero actor=ADMIN -> CANAL_INVALIDO
  ... (16/16 acciones)
  ```
  ANTES del fix, este mismo script informaba `-> OK` para las 16 acciones (documentado
  como hallazgo A-08 en `revision/03-FALLOS-ADMIN.md`, no como fallo del script).

### A-09 (MENOR) — valores inválidos de Ajustes se acotaban en silencio

- **Qué fallaba:** `PUT /manager/ajustes` con valores fuera de rango
  (`redondeoMin:999`, `jornadaEstandarMin:-50`, `conservacionAnios:1`,
  `temaPorDefecto:'invalido-xyz'`) devolvía `200 OK` con los valores silenciosamente
  acotados/sustituidos, sin ningún código de error.
- **Causa raíz:** `normalizeConfig` (tolerante, pensada para LECTURA/fusión de config)
  se usaba también como única validación en la ESCRITURA, donde un valor inválido
  debería rechazarse, no corregirse en silencio.
- **Qué se hizo:** nueva `validarAjustesEstricto(parcial)` (`src/ports.js`), invocada en
  `src/services/ajustes.service.js` (`guardar`) ANTES de persistir nada: si algún campo
  es inválido, lanza `AJUSTE_INVALIDO` (400) con el detalle de cada campo/motivo y NO
  aplica ningún cambio (rechazo atómico, ni siquiera los campos válidos del mismo
  payload). `normalizeConfig` se mantiene intacta para lectura (nunca debe reventar el
  arranque del módulo).
- **Ficheros:** `src/ports.js`, `src/services/ajustes.service.js`.
- **Test que lo protege:** `test/auditoria.test.js` → `C4 · REGRESIÓN A-09: valor
  inválido se RECHAZA...` (reescrito, ver D-15) + `C4 · Ajustes: un valor válido dentro
  de rango SÍ se acepta` (negativo); `test/fase5-bloqueB.test.js` → `A-09 · ajustesPut
  rechaza tipos/enums inválidos...` (booleanos/enum, no sólo rangos numéricos).
- **Evidencia real (script de repro re-ejecutado):**
  ```
  node revision/_scripts/06-ajustes.mjs
  INFO: PUT con valores inválidos ahora lanza: AJUSTE_INVALIDO - Valor no válido —
    redondeoMin: debe ser un número entero entre 0 y 120. jornadaEstandarMin: ...
  OK: rechazo ATÓMICO: ningún campo se acota/aplica en silencio, la config queda intacta
  ```

### S-04 (LOW) — metadatos jornada_id/marca_id de crearSolicitud sin validar contra el empleado

- **Qué fallaba:** `kiosk.crearSolicitud` aceptaba campos de nivel superior
  `jornadaId`/`marcaId` (independientes de `cambio`, el único objeto que
  `validarPropiedad` valida y que `aplicarCambio` usa realmente al aprobar) sin
  comprobar que pertenecieran al empleado solicitante — un empleado podía "etiquetar"
  su solicitud con metadatos de OTRO empleado (impacto acotado: sólo metadato/
  visualización en el Manager, no permite escribir/filtrar datos ajenos).
- **Causa raíz:** dos fuentes de verdad para el mismo dato (los ids embebidos en
  `cambio`, validados, y los ids de nivel superior, sin validar) que podían divergir.
- **Qué se hizo:** `kiosk.crearSolicitud` (`src/http/handlers.js`) ya NO acepta
  `jornadaId`/`marcaId` de nivel superior del cliente: los deriva SIEMPRE del propio
  `cambio` (el mismo objeto ya validado por `validarPropiedad`), eliminando la
  divergencia de raíz.
- **Ficheros:** `src/http/handlers.js`.
- **Test que lo protege:** `test/fase5-bloqueB.test.js` → `S-04 · jornada_id/marca_id
  almacenados se derivan de cambio...`.
- **Evidencia real:** con la inyección `jornadaId`/`marcaId` de otro empleado en el
  body, la fila almacenada ahora conserva el `marca_id` derivado de `cambio` (propio);
  antes (`revision/_scripts/04-idor-solicitud-metadata.mjs`) los campos de nivel
  superior se guardaban tal cual, contaminados con el id ajeno.

### S-05 (LOW) — purga controlada y auditada NO implementada

- **NO corregido en este bloque.** Ver `DECISIONES.md`, D-16, para el motivo completo:
  no es una vulnerabilidad de red explotable, sino una funcionalidad de producto
  ausente cuyo diseño correcto (qué cuenta como "vencido", qué API/rol lo autoriza, qué
  ocurre con las tablas de versiones/auditoría asociadas) excede el alcance de un
  bloque de parches de seguridad con tests de regresión puntuales, y una implementación
  apresurada de un endpoint de borrado masivo sería en sí misma un riesgo nuevo.

---

## Verificación final — BLOQUE B

```
npm test
ℹ tests 154
ℹ pass 154
ℹ fail 0
```
154 = 139 base (Bloque A) + 15: 2 tests EXISTENTES reescritos sin cambiar su recuento
(`C3` empleado inactivo → K-02; `C4` valor inválido → A-09; el tercero, `C3 · misRegistros/
exportar`, se adaptó al nuevo flujo de descarga sin añadir/quitar tests) + 1 test nuevo
en `test/auditoria.test.js` (`C4 · Ajustes: un valor válido...`, negativo de A-09) + 14
tests nuevos en `test/fase5-bloqueB.test.js` (S-01 ×1, S-07 ×1, S-02 ×2, K-02 ×1, K-03 ×1,
S-06 ×1, S-03/K-07 ×1, A-03 ×2, A-07 ×1, A-08 ×1, A-09 ×1, S-04 ×1 = 14).

`npm run smoke` → `SMOKE TEST: OK`. `npm run lint` → sin errores.
`cd dev-preview && npm run build` → build de Vite correcto (confirma que la nueva
importación cruzada `manager/api.js` → `src/export/csv.js` funciona en el bundle del
navegador, igual que `src/domain/time.js` en el Bloque A).

## Checklist post-fix — BLOQUE B (por hallazgo)

- [x] S-01: rotar `x-presentia-dispositivo` ya no anula el bloqueo de PIN ni el rate
      limiter (clave = empleadoId, server-trusted o el propio objetivo del login).
- [x] S-07: `hashSecret`/`verifySecret` asíncronos (no bloquean el bucle de eventos);
      el entorno de test mantiene su propio `pin.verify` síncrono (D-12).
- [x] S-02: `verificarIntegridad()` detecta el truncamiento de cola gracias al ancla.
- [x] K-02: empleado inactivo bloqueado en `entrar` y en TODAS las acciones
      autenticadas del kiosko, no sólo en `fichar`.
- [x] K-03: nadie resuelve su propia solicitud (`AUTOAPROBACION_PROHIBIDA`).
- [x] S-06: `crearSolicitud`/`misRegistros`/`solicitarDescarga`/`exportar` con límite
      de tasa.
- [x] S-03/K-07: el token de sesión nunca viaja en la URL; token de descarga de un
      solo uso y vida corta.
- [x] A-03: CSV de cliente reutiliza la neutralización de fórmulas del backend.
- [x] A-07: `UPDATE ... WHERE estado='pendiente'` como cinturón de seguridad SQL.
- [x] A-08: `manager.*` exige `canal='manager'`, simétrico al kiosko.
- [x] A-09: ajustes inválidos se rechazan (400, atómico), ya no se acotan en silencio.
- [x] S-04: metadatos de `crearSolicitud` derivados del `cambio` validado, no de
      campos de nivel superior independientes.
- [ ] S-05: documentado como NO corregido en este bloque (funcionalidad de producto
      ausente, fuera de alcance — ver `DECISIONES.md` D-16).
- [x] Causa raíz documentada en cada apartado de este documento y en `DECISIONES.md`
      (D-11 a D-16).
