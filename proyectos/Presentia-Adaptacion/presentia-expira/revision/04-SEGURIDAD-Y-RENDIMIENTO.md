# FASE 4 — SEGURIDAD Y RENDIMIENTO (consolidado)

> Documento consolidado por el orquestador a partir de `04A-SEGURIDAD.md` (Fase 4.1/4.2) y `04B-RENDIMIENTO.md` (Fase 4.3). La columna DESPUÉS de rendimiento la completa la Fase 5.

---

# Informe de Seguridad — Módulo Presentia — Fase 4.1 + 4.2

**Alcance:** `C:\Users\david\Desktop\Programación\Orquestador-Programacion\proyectos\Presentia-Adaptacion\presentia-expira`
**Fecha:** 2026-07-19
**Método:** lectura de código + ejecución real de la suite de pruebas (`node --test`, 121/121 OK) + scripts propios de repro en `revision/_scripts/` sobre entornos SQLite-en-memoria aislados (nunca se ha mutado el proceso compartido de `http://127.0.0.1:8787`, sólo se le hicieron `curl` de lectura GET) + `curl` real al servidor vivo + `npm audit`.

## Resumen

**Riesgo global:** 🟡 MEDIO-ALTO (tres hallazgos HIGH; ninguno es RCE/fuga masiva de datos, pero dos rompen controles compensatorios explícitamente documentados como necesarios — fuerza bruta de PIN y no-repudio de la auditoría).
**Bloqueante para producción:** SÍ, hasta corregir S-01 y S-07 (fuerza bruta de PIN sin bloqueo efectivo + posible DoS del proceso).

**Recuento por severidad:** HIGH: 3 · MEDIUM: 3 · LOW: 1 · Total: 7 hallazgos.

---

## Hallazgos

### S-01 — Bypass total del bloqueo por fuerza bruta de PIN y del rate limiter (cabecera de dispositivo falsificable)
**Severidad:** 🔴 HIGH
**Tipo:** A07 Identification & Authentication Failures / Insufficient Anti-Automation
**Archivo:** `src/http/authz.js` (`crearRateLimiter`), `src/services/fichaje.service.js` (`intentosRow`/`registrarFallo`, tabla `presentia_pin_intentos`), `src/http/handlers.js:73,107` (clave `` `entrar:${ctx.dispositivo}:${empleadoId}` ``), `src/http/fastify-adapter.js:23` (`ctx.dispositivo = req.headers['x-presentia-dispositivo'] || 'desconocido'`)

**Explotabilidad:** ALTA. No requiere autenticación previa (es el propio endpoint de login). Sólo exige poder enviar una cabecera HTTP arbitraria (`x-presentia-dispositivo`) distinta en cada petición — trivial de automatizar con cualquier cliente HTTP.

**Repro:** `revision/_scripts/06-bypass-backoff-dispositivo.mjs`. Se prueban 200 PINs consecutivos contra el empleado `e1`, rotando `x-presentia-dispositivo` con un UUID aleatorio en cada intento.

**Evidencia (salida real del script):**
```
Intentos realizados: 200
Veces que saltó PIN_BLOQUEADO: 0
Veces que saltó RATE (429): 0
PIN acertado: false
Número de filas de intentos para e1 (una por dispositivo distinto usado): 200
```
Tanto el rate limiter global (`crearRateLimiter`, ventana 60s/30 peticiones) como el contador de intentos fallidos de PIN (`presentia_pin_intentos`, PK `(empleado_id, dispositivo)`) usan `dispositivo` como parte de la clave. `dispositivo` proviene 100% del cliente (cabecera HTTP sin validar/normalizar), así que cada valor distinto abre un "carril" nuevo con contador a cero. Esto anula la defensa que el propio código documenta como obligatoria (`src/security/pin-policy.js:1-5`: *"El PIN de 4 dígitos = 10.000 combinaciones ⇒ débil por sí solo. Se compensa con... límite de intentos + backoff exponencial + bloqueo temporal"*). Sin ese bloqueo, un PIN de 4 dígitos es trivialmente atacable por fuerza bruta.
**Atenuante parcial:** cada verificación cuesta ~150 ms de scrypt (ver S-07), lo que ralentiza pero no impide un ataque paralelo/distribuido.
**Nota de alcance:** el mismo problema aplica a `fichar` (misma clave `dispositivo`-dependiente) — ver también S-06 para los endpoints que ni siquiera tienen ese límite parcial.

---

### S-02 — La verificación de integridad de la auditoría NO detecta el borrado de las filas MÁS RECIENTES (truncamiento de cola)
**Severidad:** 🔴 HIGH
**Tipo:** A08 Software & Data Integrity Failures / Insufficient Audit Trail Protection
**Archivo:** `src/services/audit.service.js` (`verificarIntegridad`)

**Explotabilidad:** MEDIA — requiere ya acceso de escritura DIRECTO a la base de datos (no hay ningún endpoint de la API que permita `DELETE`/`UPDATE` sobre `presentia_auditoria`; confirmado por grep de `kiosk`/`manager` handlers — cero coincidencias de `eliminar|borrar|destroy|delete`). Es explotable por un actor con privilegios de sistema operativo/DBA, o que robe el fichero `.db` y lo reescriba antes de la siguiente verificación.

**Repro:** `revision/_scripts/01-audit-tamper.mjs` (3 escenarios).

**Evidencia (salida real del script):**
```
ESCENARIO A: UPDATE de una fila INTERMEDIA -> { ok: false, rotoEn: 3, total: 6 }   => DETECTADO
ESCENARIO B: DELETE de una fila INTERMEDIA -> { ok: false, rotoEn: 4, total: 5 }   => DETECTADO
ESCENARIO C: DELETE de la fila MÁS RECIENTE -> { ok: true,  rotoEn: null, total: 5 } => NO DETECTADO
```
La cadena de hash (`hash = sha256(prev_hash + payload)`) protege correctamente cualquier fila que tenga AL MENOS una fila posterior (porque su `prev_hash` dejaría de coincidir). Pero al borrar la(s) fila(s) más reciente(s), no queda ninguna fila posterior que referencie el hash eliminado, así que `verificarIntegridad()` recorre la cadena restante sin encontrar ninguna discrepancia y devuelve `ok: true`. Es una limitación estructural conocida de los hash-chains simples (requieren un "ancla"/checkpoint publicado periódicamente FUERA del sistema, o comparar contra un recuento/`rowid` máximo conocido por un tercero, para detectar truncamientos de cola).
**Relevancia:** `legal/POLITICA-DE-CONSERVACION-Y-SUPRESION.md` afirma *"la cadena de hash enlaza los eventos de forma que cualquier manipulación sería detectable"* — esta afirmación es correcta para manipulaciones "en el medio" pero no cubre el borrado de las entradas más nuevas, que es precisamente el escenario más tentador para un atacante (ocultar su ÚLTIMA acción).

---

### S-07 — `scryptSync` bloquea por completo el bucle de eventos de Node (vector de denegación de servicio)
**Severidad:** 🔴 HIGH
**Tipo:** A05 Security Misconfiguration / Denial of Service
**Archivo:** `src/security/hash.js` (`verifySecret`/`hashSecret`, `crypto.scryptSync`)

**Explotabilidad:** ALTA cuando se combina con S-01 (sin bloqueo efectivo) y S-06 (endpoints sin límite): basta con generar tráfico de login/verificación moderado para degradar TODO el proceso (kiosko y Manager comparten el mismo proceso Node en la arquitectura de referencia).

**Repro:** `revision/_scripts/08-scrypt-blocking-cost.mjs`.

**Evidencia (salida real del script):**
```
Coste medio de UNA verificación de PIN (scrypt N=32768,r=8,p=1): 149.7 ms
30 verificaciones consecutivas tardaron 4460 ms en total.
Ticks de setInterval(5ms) registrados durante ese tiempo: 0 (esperados si NO bloqueara: ~892)
=> CONFIRMADO: el bucle de eventos quedó COMPLETAMENTE bloqueado durante las verificaciones.
```
`crypto.scryptSync` es SÍNCRONO: mientras se ejecuta, ningún otro timer/petición puede avanzar en el mismo proceso Node (confirmado empíricamente: 0 de ~892 ticks esperados de un `setInterval` de 5 ms se dispararon durante 30 verificaciones consecutivas). Con ~150 ms por intento, unas pocas decenas de peticiones concurrentes a `/kiosk/entrar` bastan para congelar el servidor completo (todos los kioskos Y el Manager) durante segundos.
**Matiz importante:** `src/security/hash.js` es el *fallback de referencia* usado cuando Expira no inyecta su propio puerto `hash`/`pin.verify` (`ports.js:16`). Si en la integración real Expira aporta una implementación asíncrona o aislada (worker thread, cola, límite de concurrencia), este hallazgo no aplicaría con la misma severidad — pero tal y como se entrega y se puede ejecutar HOY en este repo, el comportamiento bloqueante es real y reproducible.

---

### S-03 — Token de micro-sesión de kiosko viaja en la URL (query string) para las exportaciones
**Severidad:** 🟠 MEDIUM
**Tipo:** A02 Cryptographic Failures / Sensitive Data in URL
**Archivo:** `kiosk/api.js:70-71` (`urlMisHorasCsv`, `urlMisHorasPdf`), consumido por `descargar()` (crea un `<a href>` y hace click), rutas `GET /kiosk/mis-horas.csv|.pdf` en `src/http/fastify-adapter.js:56-57`

**Explotabilidad:** MEDIA-BAJA. El token vive sólo 90 s (`crearKioskSessions({ ttlMs: 90000 })`) y sólo da acceso a los datos propios del empleado (nunca admin). Pero un token de sesión en la URL puede quedar registrado en logs de acceso de Nginx/Expira, en el historial del navegador del kiosko compartido, o en cachés de proxies intermedios — mala práctica reconocida por OWASP (no poner identificadores de sesión en la URL).

**Repro:** lectura directa de `kiosk/api.js`:
```js
urlMisHorasCsv: (token, desde, hasta) => `${base}/kiosk/mis-horas.csv${qs({ token, desde, hasta })}`,
urlMisHorasPdf: (token, desde, hasta) => `${base}/kiosk/mis-horas.pdf${qs({ token, desde, hasta })}`,
```
y de `src/http/handlers.js:39-42` (`empleadoDeSesion` lee `ctx.body?.token || ctx.query?.token`, y en un `GET` no hay body, así que necesariamente usa `ctx.query.token`).

---

### S-05 — La "purga controlada y auditada" tras el plazo de conservación NO está implementada en código
**Severidad:** 🟠 MEDIUM (cumplimiento / minimización de datos, no vulnerabilidad de red)
**Tipo:** Cumplimiento RGPD art. 5.1.c/e — dato solicitado explícitamente en el encargo
**Archivo:** `src/ports.js:38,66` (sólo el MÍNIMO se aplica: `conservacionAnios` nunca puede bajar de 4); no existe ningún endpoint, job, ni función `purgar*`/`eliminarVencidos*` en `src/`.

**Explotabilidad:** N/A (no es una vulnerabilidad explotable remotamente; es una funcionalidad ausente).

**Repro:** `grep -ri "purga|purge" src/` → 0 coincidencias (sólo aparece la palabra en `legal/POLITICA-DE-CONSERVACION-Y-SUPRESION.md`, como PROCEDIMIENTO descrito, no como código). `test/migration.test.js:40-44` confirma que sólo se testea el SUELO de 4 años, nunca un borrado por vencimiento.

**Evidencia:** `legal/POLITICA-DE-CONSERVACION-Y-SUPRESION.md` §4 describe el procedimiento de purga como algo que debe **autorizar el administrador** y quedar **auditado**, pero no hay ninguna pieza de código que identifique registros vencidos (`fecha < hoy - 4 años`) ni que ejecute o audite esa purga. Es coherente con el principio de "no borrar nunca automáticamente durante el periodo de conservación" (correcto), pero significa que, pasado el plazo, la organización no dispone de ninguna herramienta en el módulo para cumplir su propia política de purga — tendría que hacerse fuera del sistema, sin el registro auditado que la política promete.

---

### S-06 — Límite de peticiones incompleto: sólo `entrar` y `fichar` tienen `rate.check`; `crearSolicitud`, `misRegistros` y `exportar` no tienen ningún límite
**Severidad:** 🟠 MEDIUM
**Tipo:** A04 Insecure Design / Resource Exhaustion
**Archivo:** `src/http/handlers.js` — únicas 2 llamadas a `ctx.rate.check` están en `kiosk.entrar` (línea 73) y `kiosk.fichar` (línea 107); `crearSolicitud`, `misRegistros`, `exportar`, `estado`, `terminos`, `aceptarTerminos` no llaman a `ctx.rate.check` en ningún punto (confirmado por grep).

**Explotabilidad:** MEDIA — requiere un token de sesión de kiosko válido (obtenible en 90 s tras un PIN correcto, y trivialmente vía S-01 si el PIN aún no se conoce).

**Repro:** `revision/_scripts/07-rate-limit-incompleto.mjs`.

**Evidencia (salida real del script):**
```
--- 500 llamadas a crearSolicitud con el MISMO token, sin pausa ---
Aceptadas: 500 / Rechazadas: 0 (de 500)
Filas en presentia_solicitudes tras el bombardeo: 500

--- 200 llamadas a exportar (PDF) con el MISMO token ---
Exportaciones PDF generadas: 200 / rechazadas: 0 (de 200) en 217 ms
```
Con un único token válido se pudieron crear 500 solicitudes y generar 200 PDFs sin ningún rechazo por límite de tasa, abriendo la puerta a saturar la tabla `presentia_solicitudes` o a un consumo de CPU sostenido generando exportaciones repetidamente.

---

### S-04 — `crearSolicitud`: los campos de nivel superior `jornadaId`/`marcaId` no se validan contra la propiedad del empleado (sólo se valida lo embebido en `cambio`)
**Severidad:** 🟢 LOW
**Tipo:** A01 Broken Access Control (impacto acotado — metadato, no escritura real)
**Archivo:** `src/http/handlers.js:130-136` (`kiosk.crearSolicitud`, `validarPropiedad` sólo inspecciona `cambio.marcaId`/`cambio.jornadaId`), `src/services/solicitudes.service.js:33-47` (`crear` inserta `jornadaId`/`marcaId` de nivel superior sin comprobación)

**Explotabilidad:** BAJA. `aplicarCambio` (la función que de verdad se ejecuta al aprobar, en `solicitudes.service.js:61-78`) sólo usa los ids EMBEBIDOS en `cambio` — los mismos que `validarPropiedad` valida — así que no es posible escribir ni filtrar datos ajenos. El impacto se limita a que las columnas `jornada_id`/`marca_id` de la fila (metadatos que el Manager muestra) pueden contener un id de OTRO empleado, lo que podría confundir al administrador que revisa la lista de Solicitudes.

**Repro:** `revision/_scripts/04-idor-solicitud-metadata.mjs`.

**Evidencia (salida real del script):**
```
Solicitud creada (fila en presentia_solicitudes):
{ id: 1, empleado_id: 'e1', jornada_id: 1, marca_id: 1, cambio: '{"accion":"editar","marcaId":2,...}' }
¿jornada_id almacenado pertenece a e2 (ajeno)? true
¿marca_id almacenado pertenece a e2 (ajeno)? true
¿El objeto `cambio` (el que SÍ se aplica al aprobar) referencia la marca propia de e1? true
```

---

## Controles verificados y CONFIRMADOS correctos (evidencia real)

| Control | Evidencia |
|---|---|
| **Sin PIN/contraseñas en claro en ninguna tabla** | Dump completo de las 9 tablas (`TABLAS` de `src/db/schema.js`) tras fichajes reales: sin `4728` ni `scrypt$` en ningún campo (test existente `seguridad.test.js` + confirmado en columnas vía `pragma_table_info` en todas las tablas). El módulo **por diseño no persiste el PIN**: la verificación se delega al puerto externo `pin.verify` (`ports.js:12`); `src/security/hash.js` (scrypt N=2¹⁵, sal 16 B, `timingSafeEqual`) sólo se usa para IMPLEMENTAR ese puerto en el entorno de referencia/dev-test (`src/dev/reference-env.js:40,53`), nunca para almacenar un secreto en las tablas propias de Presentia. |
| **Ningún algoritmo débil (MD5/SHA1) para secretos** | `hash.js` usa `scrypt` (memory-hard) para el PIN; `kiosk-session.js` usa SHA-256 pero sólo para hashear un token YA aleatorio de 256 bits (uso correcto — no es un secreto de baja entropía). |
| **Cero endpoints de borrado de fichajes** | grep de `kiosk`/`manager` (`Object.keys`) contra `/eliminar\|borrar\|destroy\|delete/i` → 0 coincidencias; confirmado también por test existente y lectura completa de `fastify-adapter.js` (16 rutas, ninguna `DELETE`). |
| **Correcciones conservan el original** | `presentia_marca_versiones` es append-only; `versionarMarcaTs` inserta la versión ANTES de sobrescribir `ts` (`repos.js:52-61`); confirmado con test C8 (`valor_anterior` = ts original). |
| **Consultas parametrizadas (sin concatenación SQL)** | Lectura completa de `repos.js`, `audit.service.js`, `solicitudes.service.js`, `migrate.js`: 100% `db.prepare(...).run/get/all(params)`; cero interpolación de strings de usuario en SQL. Confirmado con intentos reales de SQLi (`revision/_scripts/02-sqli-attempts.mjs`): 6 payloads (`' OR '1'='1`, `DROP TABLE`, `UNION SELECT`, etc.) contra `empleadoId` (login y filtro) y `motivo`/`comentario`: 0 tablas afectadas, 0 filas exfiltradas, todas las 9 tablas `presentia_*` siguen existiendo tras el ataque. |
| **XSS: escapado real confirmado por render** | `revision/_scripts/03-xss-render.mjs` renderiza los componentes REALES (`manager/components/Insignia.jsx`, `shared/Markdown.jsx`) con `react-dom/server` inyectando `<script>alert(document.cookie)</script>`, `<img src=x onerror=...>` y `"><h1>hackeado</h1>` en nombre/motivo: el HTML resultante los escapa (`&lt;script&gt;...`), ninguno aparece crudo. Cero uso de `dangerouslySetInnerHTML` en todo el repo (grep). El parser de Markdown (`shared/markdown-parse.js`) sólo autolinkea `https?://`, nunca genera `href="javascript:..."`. |
| **Inyección CSV neutralizada** | `src/export/csv.js` antepone `'` a celdas que empiezan por `= + - @`/tab/CR; confirmado con test existente y lectura de código. |
| **Autorización en servidor, no en el cliente** | `src/http/authz.js` (`requireRol`, `requireCanalKiosko`) se invoca al PRINCIPIO de cada handler `manager.*`/`kiosk.*` (revisado handler por handler en `handlers.js`); la prop `rol` que recibe `manager/PresentiaSection.jsx` sólo pinta una insignia cosmética, nunca decide autorización (confirmado por lectura de código). IDOR: el `empleadoId` de operaciones autenticadas del kiosko se deriva SIEMPRE del token de servidor (`empleadoDeSesion`), nunca de un campo enviado por el cliente. |
| **Sesión de kiosko robusta (salvo S-03)** | Token de 32 bytes aleatorios (256 bits), almacenado sólo como hash SHA-256 en memoria (`kiosk-session.js`), caduca a los 90 s, revocable. Confirmado con `revision/_scripts/05-fuerza-bruta-y-sesion.mjs` (válido a los 89 s, caducado a los 91 s, un token adivinado no valida, revocar() invalida). |
| **Fuerza bruta: mecanismo presente (aunque bypassable, ver S-01)** | Backoff exponencial 30 s→15 min tras 3 fallos, confirmado con `revision/_scripts/05-fuerza-bruta-y-sesion.mjs`: bloqueo tras 3 intentos, `PIN_BLOQUEADO` con el PIN correcto durante el bloqueo, éxito tras esperar. Auditado (`pin_fallido`/`pin_bloqueado`) sin que el PIN aparezca nunca en el detalle (`¿"0000" aparece en la auditoría? false`). |
| **Cero fugas en la API viva (curl real a :8787, sólo lectura GET)** | `kiosk/empleados`, `manager/hoy`, `manager/registros`, `manager/informe`, `manager/informe.csv`, `manager/solicitudes`, `manager/ajustes`, `manager/terminos`, ruta 404: grep de todas las respuestas contra `pin|scrypt|token|password|contraseñ|stack|Error:|internal/` → única coincidencia fue la CLAVE DE CONFIG `exigirPin` (nombre de ajuste, no un valor de PIN). Mensajes de error genéricos (`{"code":"NO_RUTA","mensaje":"Ruta no encontrada"}`), sin trazas. |
| **Cero biometría / geolocalización** | Dump de columnas de las 9 tablas vía `pragma_table_info`: ninguna columna `bio\|huella\|face\|gps\|lat\|lon\|geo\|ubicac`. |
| **Retención mínima de 4 años forzada** | `normalizeConfig` (`ports.js:66`) fuerza `conservacionAnios >= 4` incluso si se intenta bajar (confirmado con test existente); ver no obstante S-05 (falta la purga). |
| **Sin secretos ni CDNs en el repo** | grep de `api[_-]?key\|secret\|password=\|AKIA...\|BEGIN...PRIVATE KEY` en `src/` → sólo comentarios/nombres de función sobre el propio manejo de secretos, cero valores reales. grep de `cdn\|unpkg\|jsdelivr\|googleapis\|cloudflare` en todo el repo (excluyendo `node_modules`) → 0 coincidencias. |
| **`npm audit` limpio** | Raíz del módulo: 0 dependencias de producción (`package.json`, `type:module`, sin `dependencies`). `dev-preview` (arnés de previsualización, no forma parte del entregable): `npm audit` → `{"critical":0,"high":0,"moderate":0,"low":0,"info":0}`. |
| **Migración aditiva e idempotente** | Confirmado por lectura de `migrate.js` (`CREATE TABLE IF NOT EXISTS` + `INSERT OR IGNORE`) y test existente (`migrar dos veces es idempotente`, `migración no borra datos preexistentes`). |
| **Suite de pruebas completa** | `node --test` ejecutado de forma independiente: **121/121 pruebas pasan** (incluye IDOR, fuerza bruta, integridad de auditoría, SQLi, XSS, CSV injection, biometría/geo, backup+restauración, corte de luz/rollback, DST, volumen 5.000 jornadas). |

---

## NO VERIFICABLE EN ESTE ENTORNO (integración/despliegue)

Estos controles son de **tiempo de integración/despliegue** y no pueden cerrarse en este repositorio porque la BD es en memoria, no hay Expira real ni shell Electron, y no hay configuración de Nginx en este repo (confirmado: `grep -i nginx` en todo el repo → 0 coincidencias).

- **Cifrado en reposo del fichero `.db`**: aquí la BD es `:memory:`/SQLite en fichero de test únicamente para pruebas de backup; en producción sería un fichero real gestionado por Expira sobre el VPS Contabo. Debe verificarse en despliegue: cifrado de disco (LUKS/BitLocker) o cifrado a nivel de aplicación del `.db`.
- **Permisos del fichero `.db`** (propietario, `chmod`, ACL): no aplica a un entorno en memoria; verificar en el servidor real.
- **Backups cifrados y su ciclo de rotación**: el código demuestra que copiar el fichero preserva datos e integridad de la cadena de auditoría (test `C6 · backup + RESTAURACIÓN`), pero el CIFRADO del backup y su rotación son responsabilidad de la infraestructura Contabo/Expira, no de este módulo.
- **Electron (contextIsolation/nodeIntegration/preload)**: no existe shell Electron en este repo; Presentia es un módulo integrable (componentes React + servicios). Si Expira embebe un shell Electron, debe auditarse allí.
- **TLS/HTTPS entre Expira, el Hub y los kioskos**: no hay configuración de red/TLS en este repo.
- **Cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy), CORS y rate limiting a nivel de proxy**: deben configurarse en el Nginx/Fastify del HOST Expira. `registrarFastify()` (`src/http/fastify-adapter.js`) sólo REGISTRA rutas en la instancia Fastify que aporta Expira; Presentia no levanta su propio servidor HTTP en producción ni fija cabeceras. Un `limit_req_zone` por IP en Nginx mitigaría parcialmente S-01/S-06/S-07 pero no está presente ni verificable aquí.
- **Sesión/cookies del Manager (HttpOnly/Secure/SameSite, CSRF, Sanctum o equivalente)**: delegada por diseño al puerto `session.resolve(req)` de Expira (`ports.js:13`); Presentia no implementa login ni gestiona cookies propias para el Manager.
- **Implementación real de `pin.verify` en producción** (dónde y cómo Expira valida el PIN real, y si usa una implementación asíncrona que evite el bloqueo de S-07): es un puerto/contrato; el módulo, por diseño, no almacena el PIN. La severidad real de S-01 y S-07 depende de qué implementación concreta de `hash`/`pin` inyecte Expira en producción (si sustituye el *fallback* `src/security/hash.js` por algo propio).
- **Firewall/red del VPS Contabo**.

---

## Metodología y scripts de repro (no modifican producto ni tests)

Todos en `revision/_scripts/`, ejecutables con `node revision/_scripts/<archivo>.mjs` desde la raíz del repo, cada uno sobre su propio entorno SQLite-en-memoria (`crearReferenceEnv`) — nunca se ha escrito en el proceso compartido `:8787` (sólo `curl` de lectura GET):

- `01-audit-tamper.mjs` — integridad de la auditoría: UPDATE/DELETE intermedio (detectado) vs. DELETE de la fila más reciente (NO detectado) → S-02.
- `02-sqli-attempts.mjs` — 6 payloads de SQLi contra `empleadoId` (login/filtro) y `motivo`/`comentario` → confirma parametrización total.
- `03-xss-render.mjs` — renderiza componentes REALES (`Insignia.jsx`, `Markdown.jsx`) con `react-dom/server` e inyecta `<script>`/`<img onerror>`/enlaces `javascript:` → confirma escapado.
- `04-idor-solicitud-metadata.mjs` — metadatos `jornadaId`/`marcaId` de `crearSolicitud` no validados → S-04.
- `05-fuerza-bruta-y-sesion.mjs` — backoff de PIN, rate limiter, entropía/caducidad/revocación del token de kiosko.
- `06-bypass-backoff-dispositivo.mjs` — bypass de bloqueo y rate limiter rotando `x-presentia-dispositivo` → S-01.
- `07-rate-limit-incompleto.mjs` — 500 solicitudes y 200 PDFs sin límite con un único token → S-06.
- `08-scrypt-blocking-cost.mjs` — coste y naturaleza bloqueante de `scryptSync` → S-07.

---

## Comunicación con el orquestador

```json
{
  "agent": "seguridad-agent",
  "status": "completed",
  "risk_level": "MEDIUM-HIGH",
  "blocking_deployment": true,
  "recuento_severidad": { "high": 3, "medium": 3, "low": 1, "total": 7 },
  "hallazgos_explotables_mas_graves": [
    "S-01: rotar la cabecera x-presentia-dispositivo anula el bloqueo por fuerza bruta de PIN y el rate limiter (200 intentos sin bloqueo, script 06)",
    "S-07: crypto.scryptSync bloquea el 100% del bucle de eventos (~150ms/intento, 0 de 892 ticks esperados), DoS de bajo coste combinado con S-01/S-06 (script 08)",
    "S-02: verificarIntegridad() no detecta el borrado de las filas MÁS RECIENTES de auditoría (truncamiento de cola), sólo detecta manipulación 'en el medio' (script 01, escenario C)",
    "S-06: crearSolicitud/misRegistros/exportar no tienen ningún rate limit (500 solicitudes y 200 PDFs aceptados sin límite con 1 token, script 07)",
    "S-03: el token de sesión de kiosko viaja en la query string de las descargas CSV/PDF (kiosk/api.js)"
  ],
  "no_verificables": [
    "Cifrado en reposo y permisos del fichero .db real",
    "Backups cifrados y su rotación",
    "Electron (contextIsolation/nodeIntegration)",
    "TLS/HTTPS Expira-Hub-kioskos",
    "Cabeceras de seguridad HTTP/CSP/CORS/rate-limit de proxy (Nginx del host)",
    "Sesión/cookies del Manager (delegada a Expira: session.resolve)",
    "Implementación real de pin.verify/hash en producción (puerto de Expira)",
    "Firewall/red del VPS Contabo"
  ],
  "entregable": "revision/04A-SEGURIDAD.md"
}
```


---

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
