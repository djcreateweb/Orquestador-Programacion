# DECISIONES — Revisión integral de Presentia

Registro de decisiones tomadas durante la revisión integral (5 fases) del módulo
`presentia-expira`, orquestada por un equipo de agentes especializados.

Fecha de inicio: 2026-07-19.

## D-01 · Ubicación y regla de "mover trabajo previo"
- **Contexto:** el prompt exige que todo viva en `presentia-expira/` y, si hay trabajo
  en `backend/` o `frontend/`, moverlo aquí.
- **Hecho comprobado:** en este repositorio **no existen `backend/` ni `frontend/`**.
  El Presentia original (Laravel + React) fue eliminado y es recuperable en la rama
  `presentia-original-preborrado`. No hay nada que mover.
- **Decisión:** se trabaja íntegramente dentro de `presentia-expira/`. No se analizan ni
  tocan ramas/carpetas heredadas.

## D-02 · Control de versiones (git)
- **Contexto:** `presentia-expira/` vive dentro de la carpeta `Presentia-Adaptacion/`,
  que tiene **su propio repositorio git independiente** (remote propio
  `github.com/djcreateweb/Presentia-Adaptacion.git`). Además, sus archivos ya están
  copiados en el repo **orquestador** (monorepo).
- **Instrucción previa del usuario:** "no tocar el git separado de Presentia-Adaptacion".
- **Decisión:** los agentes **no hacen commits individuales**. El git interno de
  Presentia-Adaptacion **no se toca**. Al terminar la revisión, el orquestador consolida
  todo el trabajo en el repositorio **orquestador**. Si el usuario quiere fijarlo también
  en el repo independiente de Presentia-Adaptacion, se hará a petición expresa.

## D-03 · Generación del PDF sin dependencias nuevas
- **Contexto:** el PDF de la Fase 1 debe generarse sin instalar nada.
- **Hecho comprobado:** no hay `wkhtmltopdf`/`pandoc`/`puppeteer`, pero **sí** están
  instalados Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) y Edge
  (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
- **Decisión:** el PDF se genera Markdown → HTML autocontenido imprimible →
  `chrome --headless --print-to-pdf` (Edge como fallback). Cero dependencias nuevas.

## D-04 · Aislamiento de las pruebas (sin destrucción, sin interferencias)
- **Contexto:** la base de datos del módulo es **SQLite en memoria** (no hay `.db` real).
  Hay un servidor de preview compartido en `http://127.0.0.1:8787`.
- **Decisión:** cada agente que necesite escribir/mutar crea **su propio entorno en
  memoria** en scripts desechables (bajo `revision/_scripts/`), importando
  `src/dev/reference-env.js` + `src/index.js`. El servidor 8787 compartido se usa solo
  para comprobaciones de lectura, para que los agentes no se contaminen entre sí. Jamás
  se toca un `.db` real (no existe).

## D-05 · Alcance honesto de la Fase 4 (seguridad)
- **Contexto:** varios controles de seguridad son de **tiempo de integración/despliegue**
  contra la Expira real y su hardware (cifrado en reposo, permisos del `.db`, backups
  cifrados, Electron `contextIsolation`/`nodeIntegration`, TLS con el Hub).
- **Decisión:** como aquí la BD es en memoria y no hay Expira real ni shell Electron,
  esos puntos **no se pueden cerrar** en este entorno. Se marcan explícitamente como
  "NO VERIFICABLE EN ESTE ENTORNO" con el motivo, en vez de fabricar un veredicto. El
  resto de la seguridad sí se prueba aquí con evidencia real.

## D-06 · Estructura de entregables de la revisión
- `docs/DOCUMENTACION-PRESENTIA.md` + `docs/DOCUMENTACION-PRESENTIA.pdf` (Fase 1).
- `revision/02-FALLOS-KIOSKO.md` (Fase 2).
- `revision/03-FALLOS-ADMIN.md` (Fase 3).
- `revision/04A-SEGURIDAD.md` + `revision/04B-RENDIMIENTO.md` (Fase 4). El orquestador
  los consolida después en `revision/04-SEGURIDAD-Y-RENDIMIENTO.md` (evita que dos
  agentes escriban el mismo fichero a la vez).
- `revision/05-CAMBIOS-APLICADOS.md` (Fase 5).
- `revision/_scripts/` — scripts de prueba desechables (no son código de producto).

## D-07 · FASE 5 · BLOQUE A — criterio "reutilizable" para K-01 (jornada abierta)
- **Contexto:** el fix de K-01 exige distinguir un turno de noche legítimo (22:00→06:00,
  cruza medianoche, debe seguir cerrando la MISMA jornada) de un olvido de salida (p.ej.
  entrada lunes 08:00, el empleado vuelve martes 07:30 sin haber fichado salida el lunes:
  NO debe cerrarse la jornada del lunes con la hora del martes).
- **Redacción original del encargo:** "si su entrada pertenece a un día de jornada
  distinto al actual O su antigüedad supera `maxDuracionJornadaMin`, NO la cierres".
  Tomada LITERALMENTE con "actual" = fecha de HOY, esa condición sería cierta también
  para el turno de noche legítimo (la entrada es de "ayer", hoy es otro día), lo que
  rompería el requisito imprescindible de que el turno de noche siga funcionando.
- **Decisión:** se implementa la condición de "distinto día de jornada" como **gap de
  calendario > 1 día** entre el día de la entrada y el día de hoy (permite cruzar
  EXACTAMENTE una medianoche, que es la definición de un turno de noche), combinada en
  AND con `antigüedad < maxDuracionJornadaMin` (960 min = 16 h por defecto). En la
  práctica, para los casos de este encargo, el filtro decisivo es `maxDuracionJornadaMin`
  (23.5 h > 16 h ⇒ no reutilizable; 8 h de turno de noche < 16 h ⇒ sí reutilizable); el
  gap de calendario queda como cinturón de seguridad adicional para configuraciones de
  `maxDuracionJornadaMin` inusualmente altas. Ver `evaluarJornadaAbierta` en
  `src/services/fichaje.service.js`.
- **Jornada abandonada:** en vez de forzar el cierre, se añade la columna aditiva
  `presentia_jornadas.requiere_correccion` (migración vía `ALTER TABLE ADD COLUMN`,
  comprobando antes su existencia — aditivo e idempotente, nunca se toca el `estado`
  existente ni su `CHECK`). Se expone en Registros (`requiereCorreccion`) con una
  insignia ámbar "Requiere corrección".

## D-08 · FASE 5 · BLOQUE A — A-02: validación de orden por invariante de alternancia, no por reemparejado
- **Contexto:** la primera implementación de `ordenCronologicoValido` reutilizaba
  `emparejarSegmentos` (dominio ya existente) para comprobar `salida > entrada` en cada
  segmento. Se descubrió que esto NO detecta el caso real que pide A-02: si se mueve una
  `entrada` a un instante posterior a su `salida`, `emparejarSegmentos` simplemente
  re-empareja por orden cronológico (la salida pasa a "huérfana", la entrada pasa a
  "abierta") y ningún segmento llega a tener `entrada≥salida` — el bug se "esconde" en
  vez de detectarse.
- **Decisión:** `ordenCronologicoValido` (nueva, en `src/domain/jornadas.js`) valida la
  invariante real del toggle: ordenadas por `ts`, las marcas deben alternar ESTRICTAMENTE
  `entrada, salida, entrada, salida…` empezando por `entrada`, con `ts` estrictamente
  creciente. `registros.service.js` y `solicitudes.service.js` SIMULAN el cambio (edición
  o alta) en memoria y validan ANTES de escribir nada en BD.

## D-09 · FASE 5 · BLOQUE A — K-04: rechazar en vez de fusionar/ignorar
- **Contexto:** el encargo permitía "rechazar/ignorar de forma idempotente".
- **Decisión:** se implementa como RECHAZO explícito (`FICHAJE_DUPLICADO`, 429) en vez de
  devolver silenciosamente el resultado del primer fichaje. Motivo: un rechazo con
  mensaje claro es auditable y NO puede confundirse con un fichaje exitoso en el cliente
  (el kiosko ya sabe mostrar errores con mensaje); "fusionar" habría exigido inventar una
  respuesta sintética sin marca/auditoría real asociada. Ventana configurable
  `ventanaAntiRebotarFichajeSeg` (por defecto 3 s; 0 = desactivada), comparando contra la
  ÚLTIMA marca del empleado en CUALQUIER jornada/dispositivo (cubre el caso "dos tablets").
- **Efecto colateral aceptado y documentado:** el test `auditoria.test.js` "C3 · doble
  pulsación (observación)" documentaba literalmente el comportamiento defectuoso (dos
  toques seguidos = entrada+salida de 0 min) como "comportamiento real, no bug". Se
  REESCRIBE como test de regresión del fix (ahora exige `FICHAJE_DUPLICADO` en el 2º
  toque); es el único test existente cuyo contenido cambia, porque su propósito explícito
  era documentar el bug que esta fase corrige.

## D-10 · FASE 5 · BLOQUE A — zona horaria: reutilizar `src/domain/time.js` desde el frontend
- **Contexto:** A-01/K-06/A-06 exigen una única fuente de verdad para la zona horaria
  (`config.zonaHoraria`) coherente entre backend, Manager y kiosko.
- **Hecho comprobado:** `INTEGRACION-EN-EXPIRA.md` deja claro que `manager/`, `kiosk/` y
  `src/` viajan SIEMPRE juntos como una sola carpeta copiada dentro de Expira (no son
  paquetes npm independientes), y `src/domain/time.js` no tiene dependencias de Node (sólo
  `Intl`/`Date`), por lo que es 100% válido en el bundle de navegador (confirmado con
  `vite build` en `dev-preview/`, que compiló sin errores).
- **Decisión:** en vez de duplicar la lógica de conversión de zona horaria en
  `manager/api.js`/`kiosk/api.js`, se añaden las funciones genéricas `tsAValorLocal` /
  `valorLocalATs` / `diferenciaDiasCalendario` en `src/domain/time.js` y se **importan**
  desde el frontend. Elimina el riesgo de que backend y frontend diverjan en el cálculo.
  `fmtHora`/`fmtReloj`/`fmtFechaLarga` ya no tienen un valor por defecto operativo de
  `tz` (antes `"Europe/Madrid"`): si no se pasa `tz`, usan la zona del proceso/navegador
  como último recurso defensivo, pero TODOS los puntos reales de la app pasan siempre
  `config.zonaHoraria` (Manager: `GET /manager/ajustes`; kiosko: nuevo `GET /kiosk/config`,
  sin PIN — dato no sensible, necesario antes de identificarse).
- **Añadido no solicitado explícitamente pero necesario para completar A-04 en la UI:**
  nuevo endpoint `GET /manager/empleados` (admin) para poder elegir, en el modal "Añadir
  jornada olvidada", un empleado que no tiene ninguna jornada en el rango cargado (si no
  existiera este endpoint, A-04 quedaría resuelto en el backend pero inalcanzable desde
  la UI del Manager).

## D-11 · FASE 5 · BLOQUE B — S-01: la clave de bloqueo/rate-limit es el EMPLEADO, no el dispositivo
- **Contexto:** rotar `x-presentia-dispositivo` (cabecera 100% controlada por el cliente)
  anulaba tanto el backoff de PIN (`presentia_pin_intentos`, PK `(empleado_id,
  dispositivo)`) como el rate limiter de `entrar`/`fichar` (clave
  `` `entrar:${dispositivo}:${empleadoId}` ``).
- **Decisión:** el contador de bloqueo/backoff y las claves del rate limiter pasan a
  indexarse ÚNICAMENTE por `empleadoId` (la identidad atacada). Para `entrar`, el
  `empleadoId` viene del body (inherente a cualquier login: se limita por CUENTA
  atacada, patrón estándar OWASP); para `fichar`/`misRegistros`/`solicitarDescarga`/
  `crearSolicitud`/`exportar`, el `empleadoId` es SERVER-TRUSTED (derivado del token de
  sesión/descarga ya validado, nunca de un campo del cliente). La columna
  `dispositivo` de `presentia_pin_intentos` no se puede alterar en su PK de forma
  aditiva, así que se conserva en el esquema pero la fila de bloqueo usa siempre una
  clave fija (`__bloqueo_por_empleado__`); el dispositivo REAL sigue registrándose en
  el `detalle` de la auditoría (trazabilidad forense intacta).
- **No tocado:** el rate limiter (`crearRateLimiter`, Map `buckets`) en sí — su barrido
  periódico es Perf-5 (Bloque C); sólo se cambiaron las CLAVES que se le pasan.

## D-12 · FASE 5 · BLOQUE B — S-07: hash.js asíncrono SIN cascada al entorno de referencia
- **Contexto:** `crypto.scryptSync` bloquea el hilo principal de JS (~150 ms/verificación,
  confirmado con `revision/_scripts/08-scrypt-blocking-cost.mjs`: 0 ticks de un
  `setInterval` paralelo). El fix pedido es "usar la variante asíncrona de scrypt".
- **Problema detectado al diseñar el fix:** `src/dev/reference-env.js` (el ÚNICO
  entorno ejecutable de este repo, usado por los 139+ tests existentes) implementa su
  puerto `pin.verify(empleadoId, pin) -> boolean` usando `defaultHashPort.verifySecret`
  de forma SÍNCRONA. Si `verifySecret` pasa a devolver una `Promise`, `pin.verify`
  devolvería esa `Promise` (objeto truthy) en vez de un booleano real: `fichaje.
  verificarPin` (`const ok = !!(pinPort && pinPort.verify(...))`) evaluaría SIEMPRE
  `ok=true`, aceptando CUALQUIER PIN — una regresión de autenticación mucho más grave
  que el DoS que se pretende arreglar. La única forma correcta de propagar la
  asincronía sin ese bug es hacer `async` también `pin.verify`, `fichaje.verificarPin` y
  el handler `kiosk.entrar` — y con ello, las ~70 llamadas síncronas a `kiosk.entrar` en
  5 ficheros de test existentes (`auditoria.test.js`, `flujos.test.js`,
  `aceptacion.test.js`, `fase5-bloqueA.test.js`, `seguridad.test.js`), que asumen un
  valor de retorno síncrono inmediatamente desestructurado (`const en = kiosk.entrar(...);
  en.token`).
- **Decisión:** `src/security/hash.js` (`hashSecret`/`verifySecret`) se reescribe para
  ser GENUINAMENTE asíncrono (`crypto.scrypt`, threadpool de libuv — el hilo principal
  de JS queda libre mientras deriva la clave; confirmado con el script 08 re-ejecutado:
  ticks > 0 durante 30 verificaciones en paralelo). Esto cierra exactamente el PoC
  demostrado por el hallazgo (que ejercita `hash.js` de forma aislada) y dota al puerto
  opcional `hash` de una implementación de referencia correcta y no bloqueante para
  cualquier integración real. `src/dev/reference-env.js` dejó de depender de
  `defaultHashPort` para su PROPIA verificación de PIN interna: usa un helper local
  minúsculo (`hashPinSincrono`/`verificarPinSincrono`, mismos parámetros de coste/sal/
  comparación en tiempo constante, sólo que con `scryptSync`) exclusivamente para su
  contrato síncrono de `pin.verify`. `reference-env.js` está blindado con un `throw` si
  `NODE_ENV=production` y su cabecera ya advierte "NUNCA usar en producción": mantenerlo
  síncrono no reintroduce el riesgo en un despliegue real, y evita una reescritura
  desproporcionada (y de alto riesgo de introducir regresiones) de la suite de tests
  existente, que el encargo exige expresamente no romper.
- **Alcance de la corrección real:** el DoS de S-07 depende, tal y como el propio informe
  04-SEGURIDAD-Y-RENDIMIENTO.md ya reconocía ("la severidad real de S-01 y S-07 depende
  de qué implementación concreta de hash/pin inyecte Expira en producción"), de qué
  puerto real aporte Expira. Este fix asegura que la implementación DE REFERENCIA que
  Presentia ofrece (`src/security/hash.js`) ya NO es bloqueante si se integra tal cual
  (con `await`), cerrando la causa raíz allí donde es código de producto del módulo.

## D-13 · FASE 5 · BLOQUE B — S-02: ancla tamper-evidente EN LA MISMA BD (no un ancla externa)
- **Contexto:** el hash-chain de `presentia_auditoria` no detecta el TRUNCAMIENTO DE
  COLA (borrar las filas más recientes): no queda ninguna fila posterior cuyo
  `prev_hash` referencie el hash eliminado. El propio informe apunta la solución
  "de libro": un ancla/checkpoint publicado PERIÓDICAMENTE FUERA del sistema.
- **Decisión:** dado que este módulo no tiene ningún mecanismo de publicación externa
  (no hay red/otro sistema al que anclar), se implementa un ancla DENTRO de la misma BD
  (nueva tabla aditiva `presentia_auditoria_ancla`, fila única, actualizada en CADA
  `audit.registrar()`: último id + último hash + recuento total) que `verificarIntegridad()`
  compara contra la última fila real. Esto detecta el escenario EXACTO demostrado por
  el hallazgo (borrado directo de fila(s) vía SQL sin pasar por la API, que no tiene
  ningún endpoint de borrado) porque el atacante tendría que manipular DOS lugares
  consistentes (la tabla de auditoría Y el ancla) para pasar desapercibido, no sólo uno.
- **Limitación reconocida (documentada, no oculta):** un atacante que además sepa
  falsificar el ancla (mismo nivel de acceso de escritura directo a la BD) podría
  evadir esta protección igual que evadiría cualquier ancla in-DB; la solución de
  "libro" (ancla verdaderamente EXTERNA/inmutable) requeriría infraestructura fuera del
  alcance de este módulo (publicar el hash en un sistema de terceros, WORM, etc.) y
  queda fuera de este bloque.
- **Migración:** `migrate.js` siembra el ancla en `(0, 'GENESIS', 0)` en una instalación
  limpia; si se aplica sobre una BD YA EXISTENTE con historial de auditoría previo a
  este fix, hace un backfill ÚNICO a partir de la última fila real (no puede detectar
  retroactivamente un truncamiento anterior al propio fix, pero protege cualquier
  truncamiento a partir de ahora) — aditivo e idempotente, igual que el resto de
  `migrate()`.

## D-14 · FASE 5 · BLOQUE B — S-03/K-07: token de descarga de un solo uso, no cookies/redirect
- **Contexto:** el kiosko usa un token de MICRO-SESIÓN propio (no cookies del host) para
  no re-pedir el PIN entre pantallas; las descargas CSV/PDF son un `GET` con `<a href>`,
  así que el token viajaba en la query — mala práctica OWASP (identificador de sesión
  en la URL: logs, historial del navegador compartido, cachés de proxy).
- **Decisión (la recomendada explícitamente en el encargo):** nuevo token de DESCARGA,
  de un SOLO USO y vida corta (20 s, bastante para que el navegador dispare la
  descarga, muy por debajo de los 90 s de la sesión), emitido por un nuevo endpoint
  `POST /kiosk/mis-horas/token` (exige el token de SESIÓN en el BODY, nunca en la URL).
  Sólo el token de descarga —efímero, de un solo uso— aparece en la query de
  `GET /kiosk/mis-horas.csv|.pdf`. Implementado en `src/http/descarga-tokens.js`
  (misma forma que `kiosk-session.js`: sólo se guarda el HASH del token en memoria).
- **Por qué no cookies/redirect:** el kiosko no tiene sesión de cookies del host (a
  diferencia del Manager, que si usa `session.resolve(req)`); introducir cookies sólo
  para el kiosko habría sido un cambio de arquitectura mucho mayor y fuera del alcance
  de "cerrar S-03/K-07".
- **Frontend:** `kiosk/api.js` (`solicitarDescarga`) y `kiosk/MisRegistros.jsx` (botones
  Exportar CSV/PDF) piden el token de descarga justo antes de disparar la descarga.

## D-15 · FASE 5 · BLOQUE B — excepciones documentadas a "no romper npm test"
- **Contexto:** igual que D-09 (Bloque A) reescribió un test que documentaba
  literalmente el bug de K-04 como "comportamiento correcto", varios hallazgos de este
  bloque exigían cambiar un comportamiento que un test EXISTENTE afirmaba como bueno.
- **K-02** (`test/auditoria.test.js`, antes *"C3 · empleado inactivo: aunque el PIN sea
  correcto, no puede fichar"*): el test asumía que `kiosk.entrar` debía EMITIR un token
  a un empleado inactivo (y que sólo `fichar` lo bloqueaba). Reescrito como
  *"C3 · REGRESIÓN K-02: ..."*: ahora exige que `entrar` rechace de raíz.
- **A-09** (`test/auditoria.test.js`, antes *"C4 · Ajustes: valor inválido se acota..."*):
  el test afirmaba que `redondeoMin:999`/`conservacionAnios:1` debían aceptarse con
  200 OK y devolver el valor acotado. Reescrito como *"C4 · REGRESIÓN A-09: ..."*:
  ahora exige `AJUSTE_INVALIDO` (400) y que la config NO cambie (rechazo atómico); se
  añade además un test negativo nuevo confirmando que un valor SÍ válido se sigue
  aceptando con normalidad.
- **C3 · exportar** (mismo fichero): adaptado al nuevo flujo de dos pasos
  (`solicitarDescarga` + `exportar` con el token de descarga), sin cambiar lo que la
  prueba en sí verifica (que sólo devuelve lo propio del empleado).
- **Regla aplicada:** el RECUENTO de tests nunca baja (se reescribe el contenido, no se
  borra el test) y cada reescritura queda documentada aquí con el motivo exacto,
  igual que exige la práctica ya asentada en D-09.

## D-16 · FASE 5 · BLOQUE B — S-05 (LOW): la purga de datos vencidos NO se implementa en este bloque
- **Contexto:** S-05 señala que no existe en el código ninguna función/endpoint de
  "purga controlada y auditada" de registros que superen `conservacionAnios` (4 años
  mínimo legal), aunque la política legal (`legal/POLITICA-DE-CONSERVACION-Y-SUPRESION.md`)
  describe ese procedimiento.
- **Decisión: NO se implementa en este bloque.** Motivos:
  1. **No es una vulnerabilidad explotable de red** (el propio informe la clasifica como
     "cumplimiento/minimización de datos", no como fallo de seguridad atacable) — es una
     funcionalidad AUSENTE, no un bug con causa raíz corregible en un fichero concreto.
  2. **Diseñar bien una purga real es un cambio de producto, no un parche de seguridad:**
     exige decidir con el negocio (no unilateralmente en un bloque de correcciones) qué
     cuenta exactamente como "vencido" (¿por jornada? ¿por empleado completo tras baja +
     4 años?), qué API/rol lo autoriza, qué se hace con `presentia_marca_versiones`/
     `presentia_auditoria` asociadas (¿se purgan también, rompiendo la propia cadena de
     auditoría que S-02 acaba de reforzar?, ¿se conservan indefinidamente los metadatos
     de auditoría aunque se borre el dato operativo?), y cómo se refleja en la UI del
     Manager. Implementarlo apresuradamente dentro de este bloque de seguridad arriesga
     introducir un endpoint de borrado masivo mal diseñado — el tipo de riesgo que el
     propio módulo evita deliberadamente hoy ("cero endpoints de borrado", confirmado y
     testeado).
  3. El principio de diseño ya vigente ("no borrar nunca automáticamente durante el
     periodo de conservación") es CORRECTO y se mantiene sin cambios; lo que falta es la
     herramienta para cuando el plazo YA venció, que es trabajo de una fase de producto
     dedicada, no de este bloque de fixes de seguridad con tests de regresión puntuales.
- **Queda documentado, no oculto:** ver `revision/05-CAMBIOS-APLICADOS.md` (Bloque B) para
  el registro formal de este hallazgo como NO CORREGIDO EN ESTE BLOQUE, con el mismo
  detalle.
