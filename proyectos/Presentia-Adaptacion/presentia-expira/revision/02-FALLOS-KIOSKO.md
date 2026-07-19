# FASE 2 — Caza de fallos en el KIOSKO (lo que usa el empleado)

**Módulo:** Presentia (`presentia-expira`) · **Alcance:** `kiosk/*.jsx`, `kiosk/api.js`, `kiosk/kiosk.css`, `src/http/handlers.js` (objeto `kiosk`), `src/http/kiosk-session.js`, `src/services/fichaje.service.js`, `src/domain/jornadas.js`, `src/domain/time.js`, `src/security/pin-policy.js`, `src/dev/reference-env.js`.

**Método:** entorno propio en memoria por script (no se ha tocado el servidor compartido `127.0.0.1:8787` ni ningún `.db` real). Cada script vive en `revision/_scripts/*.mjs`, importa `src/dev/reference-env.js` + `src/index.js` + `src/http/handlers.js` (igual que `dev-preview/api-server.mjs`) y se ejecuta con `node revision/_scripts/<script>.mjs`. Además se ejecutó `npm test` como línea base (**121/121 verdes**, ver salida íntegra al final). Donde el punto del checklist es puramente visual (CSS/JSX) y no había forma de automatizar un navegador real en este entorno, se indica explícitamente **"verificado por análisis estático"**.

Scripts producidos (evidencia reproducible):
- `revision/_scripts/k-noche-olvido.mjs` — turnos de noche / olvido de salida (3 escenarios).
- `revision/_scripts/k-acceso.mjs` — PIN correcto/incorrecto/vacío/letras/demasiados dígitos, inactivo, fuerza bruta + auditoría.
- `revision/_scripts/k-inactivo-alcance.mjs` — hasta dónde llega un empleado de baja con su PIN.
- `revision/_scripts/k-fichar-doble-idor-autoaprobar.mjs` — doble pulsación, IDOR en exportación, auto-aprobación, multi-marca on/off.
- `revision/_scripts/k-dos-tablets.mjs` — dos sesiones simultáneas para el mismo empleado.
- `revision/_scripts/k-resiliencia.mjs` — sesión caducada, token ausente/basura, servidor caído.
- `revision/_scripts/k-formato-pantalla.mjs` — fecha larga en español, hora, estado real.

---

## Resumen de severidades

| Severidad   | Nº |
|-------------|----|
| BLOQUEANTE  | 1  |
| CRÍTICO     | 1  |
| MAYOR       | 3  |
| MENOR       | 3  |
| COSMÉTICO   | 0  |
| **Total**   | **8** |

---

## K-01 · BLOQUEANTE — Olvidar la salida y volver a fichar al día siguiente corrompe la jornada del día anterior (falsifica horas legales, sin ningún aviso)

**Cómo reproducirlo** (`revision/_scripts/k-noche-olvido.mjs`, caso K-NOCHE-01):
1. Empleado ficha ENTRADA el lunes a las 08:00 y **olvida fichar la salida**.
2. El martes a las 07:30 (23 h 30 min después — un horario de vuelta al trabajo completamente normal) vuelve a acercarse al kiosko e introduce su PIN.
3. El panel le muestra el botón **"FICHAR SALIDA"** (no "entrada"), porque el sistema sigue viendo la jornada del lunes como abierta.
4. El empleado pulsa el único botón disponible.

**Qué debería pasar:** el sistema debería reconocer que ha pasado a otro día natural de trabajo y crear una jornada NUEVA para el martes (dejando la del lunes abierta, marcada como incidencia, para que el admin la corrija vía solicitud) — tal y como exige el propio checklist: *"olvidar la salida un día y fichar a la mañana siguiente NO puede cerrar la jornada de ayer con la hora de hoy"*.

**Qué pasa realmente:** el toque del martes se registra como la **SALIDA de la jornada del LUNES**. Evidencia real (`node revision/_scripts/k-noche-olvido.mjs`):

```
Lunes 08:00 -> ficha entrada jornadaId= 1 codigo= F-2026-0001
Martes 07:30 -> re-login. estado.siguienteTipo = salida  dentro= true  desde= 2026-07-13T08:00:00.000Z
  (El botón del kiosko mostrará: "FICHAR SALIDA")
Martes 07:30 -> el empleado pulsa el único botón disponible. Resultado: tipo= salida  jornadaId= 1  codigo= F-2026-0001
Jornada del LUNES tras el "fichaje" del martes: {"id":1,...,"estado":"cerrada","editado":0,...}
Marcas de esa jornada: [{"tipo":"entrada","ts":"2026-07-13T08:00:00.000Z"},{"tipo":"salida","ts":"2026-07-14T07:30:00.000Z"}]
Informe de horas de e1: { ..., "textoHoras": "23 h 30 m", ... }
```

- La jornada del lunes queda registrada con **23 h 30 m** trabajadas (un dato de jornada laboral **falso**, art. 34.9 ET), y **`editado` sigue en `0`** — no hay ninguna marca que la distinga de un registro normal para el admin.
- El empleado **se queda sin entrada registrada para el martes** hasta que vuelva a tocar el kiosko una segunda vez (y esa segunda vez sí creará la jornada del martes, pero con la hora de ese segundo toque, no las 07:30 reales).

**Causa raíz:** `jornadaObjetivo()` en `src/services/fichaje.service.js` (líneas 26-37) reutiliza la última jornada abierta del empleado si la última marca fue una `entrada` hace **menos de 24 h** (`DIA_MS`). Esta regla se diseñó para el turno de noche real (entrada 22:00 → salida 06:00, ~8 h después, condición correcta — ver caso de control K-NOCHE-02, que sí funciona bien), pero el umbral de 24 h es demasiado amplio: cualquier "olvido de fichar la salida" seguido de una vuelta normal al trabajo al día siguiente (que casi siempre ocurre en menos de 24 h) cae en la misma rama y se trata como si fuera la continuación de un turno nocturno.

**Contraste (control, SÍ funciona bien):**
- Turno de noche real 22:00→06:00 (+8h): **1 sola jornada**, correcta (caso K-NOCHE-02).
- Frontera exacta 24h: si el reingreso ocurre exactamente a las 24h, el sistema SÍ crea una jornada nueva (`siguienteTipo` = `entrada`) — pero por debajo de esa frontera (23h59, 23h30, 20h…) el fallo se dispara.

**Nota:** no existe ningún test en `test/` que cubra este escenario. `test/auditoria.test.js` (`C5 · REGRESIÓN turno de noche`, DEF-001 en `auditoria/02-DEFECTOS.md`) sólo prueba el caso BUENO (entrada 22:00 → salida 3h después). El caso del checklist ("olvido + fichaje normal al día siguiente") no está cubierto por ningún test existente.

**Severidad:** BLOQUEANTE. Es la función más crítica del producto (registro legal de jornada) y el escenario disparador — "olvidarse de fichar la salida y volver al día siguiente en menos de 24h" — es el caso más común de "olvido", no un caso raro. La corrupción es silenciosa (sin flag `editado`, sin auditoría distinguible, sin aviso al empleado ni al admin).

---

## K-02 · CRÍTICO — Un empleado dado de baja (`activo:false`) puede iniciar sesión con su PIN y usar el kiosko casi por completo; sólo el fichaje queda bloqueado

**Cómo reproducirlo** (`revision/_scripts/k-inactivo-alcance.mjs`, empleado `e9` con `activo:false`):

**Qué debería pasar:** el checklist exige "empleado inactivo/baja no entra". El login (PIN) debería rechazarse por completo para un empleado de baja.

**Qué pasa realmente:** `kiosk.entrar()` (handler) y `verificarPin()` (servicio) **no comprueban `activo` en ningún momento**; sólo `fichaje.fichar()` lo hace. Evidencia real:

```
1) kiosk.entrar (PIN correcto, empleado INACTIVO): {"token":"2CYpZ4...", "empleado":{"id":"e9","nombre":"Baja Reciente",...}, "estado":{...}, "aceptado":false}
2) kiosk.estado con el token del inactivo: {"empleado":{...},"estado":{...}}
3) kiosk.terminos: {"aceptado":false,"version":"v1","ts":null}
4) kiosk.aceptarTerminos (¡puede aceptar términos siendo baja!): {"aceptado":true,"version":"v1",...}
5) kiosk.misRegistros (consulta de datos histórico-laborales): {"desde":"2026-01-01","hasta":"2026-12-31","empleados":[],...}
6) kiosk.crearSolicitud (empleado de baja pudo crear una solicitud): {"id":1,"empleadoId":"e9",...,"estado":"pendiente",...}
7) kiosk.fichar RECHAZADA (única barrera real): EMPLEADO_INVALIDO 403 Empleado no disponible.
```

Con su PIN, un empleado de baja puede: entrar, ver su estado, **aceptar términos y condiciones en nombre de una relación laboral ya finalizada**, consultar y (vía `/kiosk/mis-horas.csv|.pdf`) **exportar su histórico**, y **crear solicitudes de corrección**. Sólo el botón de fichar queda bloqueado con un mensaje genérico ("Empleado no disponible.") que en la UI (`FicharScreen.jsx`) se muestra simplemente como un error tras pulsar "FICHAR ENTRADA/SALIDA" — el empleado ya ha llegado hasta el panel con su nombre y su estado antes de descubrir que no puede fichar.

`kiosk.empleados()` (la lista para elegir "¿quién ficha?") sí excluye correctamente a los inactivos (`e.activo !== false`), así que un inactivo no aparece en la lista para elegir — pero si conoce su `empleadoId` (p. ej. porque lo usó cuando estaba activo, o si el kiosko expone algún atajo), puede saltarse esa lista y loguearse igualmente.

**Severidad:** CRÍTICO — es un fallo de control de acceso post-baja: el checklist pide explícitamente que un inactivo "no entre", y en la práctica entra y conserva acceso de lectura/consentimiento a su propio expediente laboral.

---

## K-03 · MAYOR — Un admin/técnico puede aprobar (o rechazar) su PROPIA solicitud de corrección

**Cómo reproducirlo** (`revision/_scripts/k-fichar-doble-idor-autoaprobar.mjs`, bloque E): `a1` (Laura Admin, `local_admin`) también es un "empleado" del kiosko (ficha sus propias horas como cualquier otro). Ficha una entrada, crea desde el kiosko una solicitud de corrección **sobre su propia marca**, y después — actuando como manager — se auto-aprueba.

**Qué debería pasar:** el checklist exige "no puede aprobarse a sí mismo".

**Qué pasa realmente:**

```
Solicitud creada por a1 sobre sí mismo: {"id":1,"empleadoId":"a1","empleadoNombre":"Laura Admin",...,"estado":"pendiente",...}
>>> RESULTADO: a1 pudo APROBAR SU PROPIA solicitud: {"id":1,...,"estado":"aprobada","resueltoPor":"a1","comentario":"Me lo autoapruebo",...}
```

**Causa raíz:** `solicitudes.aprobar()` y `solicitudes.rechazar()` en `src/services/solicitudes.service.js` no comparan `actorId` con `s.empleado_id` en ningún momento; el único control es el de rol (`requireRol(ADMIN)` en el handler), que un admin siempre cumple.

**Severidad:** MAYOR (requiere ya tener credenciales de admin/técnico, por lo que el radio de explotación está acotado, pero anula por completo la separación de funciones que el propio flujo de solicitudes dice ofrecer, y es totalmente explotable por un admin único de un centro pequeño).

---

## K-04 · MAYOR — Sin protección en el servidor frente al doble toque: el 2º toque casi inmediato se registra como una SALIDA válida de 0 minutos

**Cómo reproducirlo** (`revision/_scripts/k-fichar-doble-idor-autoaprobar.mjs` bloque A/B, y `revision/_scripts/k-dos-tablets.mjs` para el caso de dos dispositivos): se llama dos veces a `kiosk.fichar()` con el mismo token (o con tokens de dos "tablets" logueadas con el mismo empleado) sin avanzar el reloj entre medias — simula un doble toque más rápido que el re-render de React, un doble evento táctil (touch+click) o dos kioskos usados casi a la vez por el mismo empleado.

**Qué debería pasar:** el checklist exige "doble pulsación rápida NO duplica marca" — lo razonable es que el segundo toque casi inmediato sea ignorado o rechazado con un aviso ("ya se ha fichado hace un instante"), no que cree una segunda marca real.

**Qué pasa realmente:** evidencia real:

```
Primera llamada (click 1): {"tipo":"entrada","ts":1783929600000,...,"estado":"abierta","marcaId":1,"jornadaId":1}
Segunda llamada (click 2, mismo instante, mismo token): {"tipo":"salida","ts":1783929600000,...,"estado":"cerrada","marcaId":2,"jornadaId":1}
Marcas resultantes en la jornada: [{"tipo":"entrada","ts":1783929600000},{"tipo":"salida","ts":1783929600000}]
Informe tras el doble toque: [{"...","entrada":1783929600000,"salida":1783929600000,"minutos":0,...,"textoHoras":"0 h 0 m",...}]
```

Con dos "tablets" (dos tokens distintos, mismo empleado) el resultado es idéntico: la jornada no se duplica (protegido por `UNIQUE(empleado_id, fecha)` y por ser toda la operación síncrona sin punto de interrupción real — no hay condición de carrera posible en este proceso), **pero el segundo toque no se ignora: se interpreta como una salida real**, abriendo y cerrando la jornada en el mismo instante sin avisar a nadie.

**Causa raíz:** `fichaje.fichar()` no tiene ninguna ventana de "cooldown" ni deduplicación por `(empleadoId, ts reciente)`; la única protección existente es del lado del cliente (`enviando` en `FicharScreen.jsx`, que deshabilita el botón mientras hay una petición en curso) — insuficiente ante doble evento táctil, reintentos de red o un segundo dispositivo.

**Severidad:** MAYOR — corrompe puntualmente los datos de jornada (marca real perdida/falsa jornada de 0 minutos) sin bloquear el uso del kiosko en general.

---

## K-05 · MAYOR — El empleado no tiene ninguna forma de ver el estado de sus propias solicitudes de corrección

**Cómo reproducirlo:** revisar el contrato de API expuesto por el kiosko (`kiosk/api.js`, `kiosk/README.md`) y el catálogo de handlers `kiosk` en `src/http/handlers.js`.

**Qué debería pasar:** el checklist exige "ver estado" además de "crear corrección" para las solicitudes.

**Qué pasa realmente:** el objeto `kiosk` en `src/http/handlers.js` sólo expone `crearSolicitud`; no existe ningún `kiosk.misSolicitudes` (ni ruta equivalente en `dev-preview/api-server.mjs`, que enumera exhaustivamente todas las rutas del kiosko). `kiosk/api.js` sólo define `crearSolicitud(payload)`, sin ningún método de lectura. No existe ningún componente `MisSolicitudes.jsx` en `kiosk/` (el listado de archivos del directorio es: `api.js, AvisoTratamiento.jsx, FicharCard.jsx, FicharScreen.jsx, InfoLegal.jsx, kiosk.css, MisRegistros.jsx, README.md`). Sólo el Manager (`manager.solicitudes`, sólo admin/técnico) puede listarlas.

El empleado puede crear una solicitud de corrección desde el kiosko, pero después no tiene ninguna vía — dentro del propio kiosko — para saber si fue aprobada, rechazada o sigue pendiente; tiene que preguntar al encargado por otro medio.

**Severidad:** MAYOR — no es un fallo de seguridad, pero es un requisito funcional explícito no cumplido, con impacto directo en la experiencia del empleado.

---

## K-06 · MENOR — La zona horaria del kiosko está fijada ("Europe/Madrid") en el frontend, no se deriva de la configuración del backend

**Evidencia:** `grep "Europe/Madrid" kiosk/*` →

```
kiosk/api.js:6:export const TZ_DEFECTO = "Europe/Madrid";
kiosk/FicharScreen.jsx:16:const TZ = "Europe/Madrid";
```

El backend sí soporta una `zonaHoraria` configurable (`deps.config.zonaHoraria`, por defecto `Europe/Madrid`, ver `src/ports.js` y `src/domain/time.js`) y la usa correctamente para bucketizar la fecha de cada jornada. Pero ninguna respuesta del kiosko (`kiosk.entrar`, `kiosk.estado`, …) devuelve esa zona horaria al cliente, y el frontend la tiene **hardcodeada**. Si un centro se configura con otra zona horaria (p. ej. Canarias, `Atlantic/Canary`), el reloj y la fecha larga que ve el empleado en el kiosko no coincidirían con la zona que el servidor usa realmente para decidir a qué día pertenece su jornada.

**Severidad:** MENOR — el valor por defecto coincide con la inmensa mayoría de despliegues; el riesgo sólo se materializa si se cambia la configuración de zona horaria.

---

## K-07 · MENOR — El token de micro-sesión viaja en la URL de las descargas CSV/PDF

**Evidencia:** `kiosk/api.js` — `urlMisHorasCsv`/`urlMisHorasPdf` construyen `GET /kiosk/mis-horas.csv?token=...&desde=...&hasta=...`, y `MisRegistros.jsx` los abre con un `<a href=...>` (`descargar()`). El token de sesión (32 bytes aleatorios) queda expuesto en la query string, lo que puede persistir en logs de acceso del servidor/proxy o en el historial del navegador.

**Mitigación existente:** el token es de alta entropía y caduca en ~90 s (`crearKioskSessions`), lo que reduce mucho el riesgo real; es una descarga (`GET` con `Content-Disposition: attachment`), para la que pasar el token por cabecera no es trivial con un simple `<a href>`.

**Severidad:** MENOR.

---

## K-08 · MENOR (informativo) — El flujo del kiosko no gestiona el botón "atrás" del navegador/tablet

**Método:** análisis estático (`grep -r "history|pushState|useNavigate|react-router|popstate" kiosk/` → sin resultados).

Toda la navegación interna del kiosko (`empleados → pin → panel → registros/legal/aceptar`) se hace con estado de React (`useState`), sin `history.pushState` ni hash routing. Esto significa que el botón "atrás" del sistema (si el kiosko no corre en modo totalmente bloqueado/kiosco de hardware) no retrocede un paso dentro del flujo de fichaje: o no hace nada, o navega fuera de la SPA por completo, dependiendo del contenedor. No se ha podido verificar el comportamiento real en un navegador (no hay arnés de navegador disponible en este entorno); se declara **verificado por análisis estático únicamente**.

**Severidad:** MENOR — la mayoría de despliegues de kiosko corren en modo quiosco sin barra de navegación accesible, lo que mitiga el impacto.

---

## Comprobaciones que SÍ pasan (evidencia adjunta, no son fallos)

- **PIN correcto entra / incorrecto no entra con mensaje genérico** ("Credenciales incorrectas.", sin distinguir si el empleado existe o no) — `k-acceso.mjs` puntos 1, 2, 2b.
- **PIN vacío / con letras / con más dígitos / `undefined`** — todos rechazados de forma uniforme con el mismo error genérico `PIN_INCORRECTO`, sin distinción de campo — `k-acceso.mjs` puntos 4-6b.
- **Fuerza bruta: bloqueo tras 3 fallos con backoff (30s→1m→2m→5m→15m), auditado en `presentia_pin_intentos` y en `presentia_auditoria` (`pin_fallido`/`pin_bloqueado`), sin el PIN en ningún registro** — `k-acceso.mjs` punto 7, y test existente `seguridad.test.js` ("fuerza bruta de PIN…") ✅ verde en `npm test`. El bloqueo es por `(empleado, dispositivo)`: otro kiosko no se ve afectado.
- **Tras un login correcto se limpian los intentos fallidos previos** (no hay penalización residual por debajo del umbral) — `k-acceso.mjs` punto 8.
- **IDOR en `mis-registros`/`mis-horas`: inyectar `empleadoId` de otro empleado en el body se IGNORA**; el `empleadoId` siempre se deriva del token de servidor, nunca de un dato del cliente — `k-fichar-doble-idor-autoaprobar.mjs` bloque C. También cubierto por el test existente `seguridad.test.js` (IDOR sobre solicitudes) ✅.
- **Exportación CSV sin PIN/hash/token** — `k-fichar-doble-idor-autoaprobar.mjs` bloque D (contenido íntegro impreso), y test existente `seguridad.test.js` ("ni PIN ni hashes ni tokens…", "una copia robada de la BD…") ✅.
- **multi-marca desactivada**: 2ª entrada del día se bloquea con mensaje claro ("La jornada de hoy ya está registrada.") — `k-fichar-doble-idor-autoaprobar.mjs` bloque F, y test existente `flujos.test.js` ✅.
- **multi-marca activada (por defecto)**: permite pausas (varias parejas entrada/salida el mismo día) — bloque G.
- **Turno de noche REAL (22:00→06:00, 8h después) cierra la MISMA jornada** (contraste positivo de K-01) — `k-noche-olvido.mjs` caso K-NOCHE-02, y test existente `auditoria.test.js` ("REGRESIÓN turno de noche") ✅.
- **Motivo obligatorio** en solicitudes (vacío o sólo espacios, ambos rechazados con `MOTIVO_REQUERIDO`) — comprobado por script ad-hoc (ver transcripción en el historial de esta sesión).
- **Sesión de kiosko caducada a media acción (TTL 90s)**: al fichar con un token caducado se recibe `401 SESION_KIOSKO` con mensaje claro, y el código de `FicharScreen.jsx`/`MisRegistros.jsx` lo captura para volver a pedir el PIN sin pantalla en blanco — `k-resiliencia.mjs` punto 1.
- **Token ausente o con formato basura**: mismo error genérico y controlado (401), sin excepción no controlada — `k-resiliencia.mjs` puntos 2-3.
- **Servidor caído (fetch real contra un puerto sin nadie escuchando)**: `crearApiKiosk` devuelve un `ApiError('RED', 'No hay conexión con el servidor...')` controlado; el código del kiosko lo captura y muestra un mensaje, no una pantalla en blanco — `k-resiliencia.mjs` punto 4.
- **Fecha larga en español, formato de hora, iniciales del avatar, estado "fuera"/"dentro desde HH:MM"** — verificado con salida real de las funciones `fmtReloj`/`fmtFechaLarga`/`fmtHora`/`iniciales` y del servicio `estadoEmpleado` — `k-formato-pantalla.mjs` (p. ej. `lunes, 13 de julio de 2026`, `Dentro desde 10:00`).
- **El reloj del kiosko avanza (tick de 1s) y se limpia al desmontar** — `Reloj` en `FicharScreen.jsx` usa `setInterval(...,1000)` + `clearInterval` en el cleanup de `useEffect`. **Verificado por análisis estático** (no hay arnés de navegador en este entorno para medir el DOM en vivo).
- **Botón muestra la acción correcta** (verde "FICHAR ENTRADA" / rojo "FICHAR SALIDA") según `estado.siguienteTipo`, confirmado con datos reales del servicio — `k-formato-pantalla.mjs`.
- **Sin XSS en la información legal**: `shared/Markdown.jsx` construye nodos React (nunca `dangerouslySetInnerHTML`); verificado por lectura de código y por la suite `test/legal.test.js` (verde).

### Interfaz (kiosk/*.jsx, kiosk.css, shared/responsive.css) — todo verificado por análisis estático (sin arnés de navegador disponible)

- **Táctil / botones grandes**: `.pk-boton-ficha` (padding `2rem 1rem`, texto `clamp(1.4rem,5.5vw,1.9rem)`) y `.pk-card` (padding `1.75rem`) son enormes por diseño base, sin depender de media query. El teclado numérico (`.pk-tecla`) y los botones secundarios (`.pk-btn`, `.pk-volver`) alcanzan `min-height: 44px` específicamente en `@media (any-pointer: coarse)` (`shared/responsive.css`), cubierto también por el test `responsive.test.js` (verde).
- **El teclado virtual del sistema operativo NO puede tapar el PIN**: la pantalla de PIN usa un teclado numérico propio en pantalla (botones `0-9`/"Borrar"/"Entrar" en `FicharScreen.jsx`), no un `<input>` enfocable — por tanto no se invoca el teclado nativo del SO en absoluto en esa pantalla. (El único `<input type="date">` del kiosko está en `MisRegistros.jsx`, una pantalla con scroll normal, no en el flujo de PIN.)
- **Legible claro/oscuro**: cero colores hardcodeados en `kiosk.css` (todo vía `var(--...)` de `shared/tokens.css`), y la paleta oscura cumple WCAG AA según `test/tema.test.js` (verde, incluye "CERO colores hardcodeados fuera de tokens.css").
- **Tablet vertical/horizontal y móvil ≥320px, sin scroll horizontal**: `.pk-pantalla` tiene `max-width: 34rem` centrado y `padding` fluido; `.pk-empleados` usa `grid-template-columns: repeat(auto-fill, minmax(8rem,1fr))` (se adapta sin desbordar); `.pk-tabla-wrap` tiene `overflow-x` propio y en `≤640px` el patrón tabla→tarjetas evita el scroll horizontal (`shared/responsive.css`, cubierto por `responsive.test.js`, verde). No se ha medido `scrollWidth` en un navegador real (fuera del alcance de este entorno); el diseño fluido con `clamp()`/`grid`/`dvh` es consistente con la ausencia de scroll horizontal.

---

## Salida de `npm test` (línea base, previa a este análisis)

```
ℹ tests 121
ℹ pass 121
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

Ningún test existente cubre K-01 (olvido + reingreso <24h), K-02 (login de inactivo), K-03 (auto-aprobación) ni K-04 (doble toque sin cooldown) — de ahí que la suite esté en verde pese a estos hallazgos.
