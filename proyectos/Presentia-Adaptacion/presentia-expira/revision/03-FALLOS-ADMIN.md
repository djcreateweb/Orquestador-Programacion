# 03 · FALLOS ADMIN — Fase 3 (caza de fallos, Manager, control por control)

Metodología: lectura completa de `src/http/handlers.js`, `src/http/authz.js`,
`src/services/*.js`, `src/domain/*.js`, `src/db/schema.js`/`migrate.js`,
`src/export/{csv,pdf}.js`, y las 5 sub-pestañas de `manager/tabs/*.jsx` +
`manager/api.js`. Verificación **independiente** (nunca de vista): entornos
propios en memoria (`../src/dev/reference-env.js` + `../src/index.js`),
recomputación manual y SQL directo sobre la misma BD. `npm test` = **121/121
verdes** antes y después de esta fase (no se ha tocado código de producto ni
tests). Ningún dato del servidor compartido `:8787` ha sido mutado.

Scripts desechables usados como evidencia (ejecutables, no destructivos, cada
uno crea su propio entorno en memoria):

- `revision/_scripts/01-hoy.mjs`
- `revision/_scripts/02-registros.mjs`
- `revision/_scripts/03-registros-limites.mjs`
- `revision/_scripts/04-informe.mjs`
- `revision/_scripts/05-solicitudes.mjs`
- `revision/_scripts/06-ajustes.mjs`
- `revision/_scripts/07-permisos.mjs`
- `revision/_scripts/08-coherencia.mjs`
- `revision/_scripts/09-timezone-frontend.mjs`
- `revision/_scripts/10-casos-limite-extra.mjs`

> Nota: `revision/_scripts/` es una carpeta compartida con otro agente (Fase
> "kiosko") que trabaja en paralelo sobre el mismo repositorio; sus ficheros
> (`k-*.mjs`, `01-audit-tamper.mjs`, `perf.mjs`, `perf-test-50000.db`, etc.) no
> se han tocado ni se referencian aquí salvo que se indique explícitamente.

**Recuento por severidad:** BLOQUEANTE 0 · CRÍTICO 2 · MAYOR 3 · MENOR 4 · COSMÉTICO 0 (**9 hallazgos**).

---

## Resumen ejecutivo (los 5 más graves)

1. **A-01 CRÍTICO** — El modal "Editar/Añadir marca" precarga la hora en la zona horaria del NAVEGADOR del admin, mientras la tabla siempre muestra Europe/Madrid: si el admin no está en esa zona, puede guardar una hora absoluta desplazada varias horas **sin ningún aviso**.
2. **A-02 CRÍTICO** — `editarMarca`/`anadirMarca` no validan el orden cronológico entrada→salida: invertirlo dejas la jornada como "en curso" con 0 minutos y **Hoy cuenta como "dentro" a alguien que ya fichó su salida**, sin error ni aviso.
3. **A-03 MAYOR** — El CSV de Registros (generado en el cliente) **no neutraliza la inyección de fórmulas** (`=`,`+`,`-`,`@`), a diferencia del CSV de Informe (backend) que sí lo hace.
4. **A-04 MAYOR** — No existe ninguna vía (ni Registros ni Solicitudes) para registrar un día **completamente olvidado** (cero marcas): toda operación de "añadir marca" exige una jornada ya existente.
5. **A-05 MAYOR** — El ajuste "Jornada estándar (min)" se persiste y se muestra en Ajustes, pero **no afecta a ningún cálculo** (Informe/Hoy/Registros): es puramente decorativo.

Entregable: `revision/03-FALLOS-ADMIN.md` (este documento).

---

## HOY

**Estado: PASA** (sin hallazgos nuevos). KPIs verificados contra SQL directo sobre la propia BD en memoria (no de vista): `dentroAhora`, `salidas`, `personasHoy`, `marcasHoy` recomputados de forma independiente y coinciden exactamente. Comportamiento con cero marcas: `{dentroAhora:0, salidas:0, personasHoy:0, marcas:[]}` sin error. Cada marca trae `tipo` (para la insignia verde "Entrada"/roja "Salida" — `manager/tabs/Hoy.jsx:90-94`), `codigo` y `empleadoNombre`. Orden: más reciente primero (`src/services/hoy.service.js:36`). Autorrefresco: `setInterval(cargar, 15000)` confirmado por lectura estática (`manager/tabs/Hoy.jsx:7,32`).
Evidencia: `revision/_scripts/01-hoy.mjs` (9/9 OK).

Ver también **A-02**, que sí afecta a Hoy de forma indirecta (KPI `dentroAhora` incorrecto tras una edición sin validar en Registros).

---

## REGISTROS

**Estado: PASA con hallazgos** (A-02, A-03, A-04 — ver abajo).

Verificado con evidencia (`revision/_scripts/02-registros.mjs`, `03-registros-limites.mjs`):
- Una fila por jornada; filtro por empleado, por rango, y ambos combinados (por separado y juntos) — todos correctos.
- "En curso" (sin salida) → `salida:null`, `enCurso:true` (la UI pinta `Insignia tipo="en-curso"`, ámbar vía `--status-warning`, `manager/presentia.css:220`).
- Badge "editado" **solo** en la jornada tocada; el resto conserva `editado:false`.
- `editarMarca`: valida motivo obligatorio (rechaza solo-espacios), valida `ts` numérico, **guarda**, **audita exactamente 1 entrada** (`accion:'marca_editada'`) y **conserva el valor original** en `presentia_marca_versiones.valor_anterior` (verificado con SQL directo, no de vista).
- `anadirMarca`: audita `accion:'marca_anadida'`, marca la jornada como editada, recalcula `enCurso`.
- Orden ascendente por fecha (`repos.jornadasEnRango`, `ORDER BY fecha ASC`).
- Volumen: 5.000 jornadas sembradas por SQL directo → `manager.registros()` responde en **363 ms** y `manager.informe()` en **363 ms** (ambos «tiempo razonable»).

### A-02 · CRÍTICO — `editarMarca` no valida coherencia cronológica entrada↔salida
- **Área:** `src/services/registros.service.js` (`editarMarca`), `src/domain/jornadas.js` (`emparejarSegmentos`/`resumenJornada`).
- **Repro:** jornada con entrada 08:00 y salida 12:00. El admin edita la ENTRADA y por error la deja en 13:00 (después de la salida real).
- **Esperado:** el sistema debería rechazar la edición o, como mínimo, avisar de la incoherencia (entrada > salida más próxima).
- **Actual:** se guarda sin error. `emparejarSegmentos` reordena por `ts` y trata la salida (ts menor) como "huérfana" y la entrada (ts mayor) como un segmento **abierto**. Resultado: `enCurso:true`, `salida:null`, `minutos:0` — la jornada aparece como si el empleado siguiera fichado, PESE A TENER una marca de salida real en la BD.
- **Evidencia:** `revision/_scripts/03-registros-limites.mjs` → `{"entrada":...,"salida":null,"minutos":0,"enCurso":true}`.

### A-04 · MAYOR — Imposible registrar un día completamente olvidado (cero marcas)
- **Área:** `src/services/registros.service.js` (`anadirMarca`), `src/services/solicitudes.service.js` (`aplicarCambio`, rama `'anadir'`).
- **Repro:** un empleado NO fichó absolutamente nada un día laborable. En Registros no existe ninguna fila para ese día (no hay jornada), así que el botón "Añadir marca" no tiene dónde engancharse; y `manager.anadirMarca({jornadaId: <inexistente>, ...})` lanza `JORNADA_INEXISTENTE`. Tampoco por Solicitudes: `aplicarCambio` exige `jornada = repos.jornadaPorId(cambio.jornadaId)` ya existente.
- **Esperado:** el checklist de esta fase ("AÑADIR MARCA crea bien la jornada") asume que añadir una marca puede generar la jornada si no existe.
- **Actual:** no existe ningún endpoint `crearJornada`/equivalente en `manager.*`; `crearJornada()` (`src/services/repos.js:24`) solo se invoca desde `fichaje.service.js` (fichaje real vía kiosko). Un día 100% olvidado **no tiene remedio administrativo** en el estado actual del módulo.
- **Evidencia:** `revision/_scripts/02-registros.mjs` → `anadirMarca` con `jornadaId:999999` lanza `JORNADA_INEXISTENTE`.

### A-03 · MAYOR — CSV de Registros (cliente) sin neutralizar inyección de fórmulas
- **Área:** `manager/api.js:142-152` (`descargarCsvCliente`), usado por `manager/tabs/Registros.jsx:233` (botón "Exportar CSV").
- **Repro:** un empleado con nombre `=cmd|'/c calc'!A1` (o cualquier celda que empiece por `=`,`+`,`-`,`@`) aparece en la tabla de Registros; el admin pulsa "Exportar CSV" y abre el fichero en Excel/LibreOffice.
- **Esperado:** igual que el CSV de Informe (`src/export/csv.js:9-11`, función `neutralizarFormula`), la celda debería anteponer un apóstrofo.
- **Actual:** `descargarCsvCliente`/`escapar` (`manager/api.js:143-146`) solo entrecomilla ante `" ; \n`, **no** neutraliza el carácter inicial de fórmula. La celda sale cruda: `"=cmd|'/c calc'!A1"`, interpretable como fórmula por Excel/LibreOffice.
- **Evidencia:** lógica extraída y ejecutada en Node — celda resultante `"=cmd|'/c calc'!A1"`, `startsWith('=') === true`. (El CSV de Informe, backend, SÍ neutraliza correctamente — ver `revision/_scripts/04-informe.mjs`, comprobado con el mismo caso.)
- **Nota:** esta misma clase de defecto (CSV injection) ya fue detectada y corregida en `src/export/csv.js` según `auditoria/02-DEFECTOS.md` (DEF-002); el fix no se replicó al exportador de cliente de Registros, que es un camino de código distinto.

---

## INFORME DE HORAS

**Estado: PASA** (backend). Verificado con `revision/_scripts/04-informe.mjs` (17/17 OK):
- Horas verificadas A MANO: turno con pausa de comida (08:00–13:00, 14:00–17:30) → 510 min = **"8 h 30 m"**, coincide con el cálculo manual independiente.
- Redondeo: 127 min con `redondeoMin=15` → `Math.round(127/15)*15 = 120`; el **Total del periodo usa el valor redondeado**, no el crudo.
- Total del periodo == suma manual de `totalMinutosRedondeados` por empleado (multi-empleado).
- Rango por defecto del **backend** == mes en curso (`primerDiaDelMes`/`ultimoDiaDelMes` con `config.zonaHoraria`), verificado contra cálculo independiente.
- CSV: BOM UTF-8 presente; tildes/ñ conservadas (`Muñíz`); celda que empieza por `=` queda neutralizada (`'=1+2 Ñoño Muñíz`); **no** contiene el PIN (`4728`) ni hashes (`scrypt$`).
- PDF: cabecera `%PDF-` correcta; nombre con tildes preservado (WinAnsi/latin1); **no** contiene PIN ni hash.

### A-05 · MAYOR — "Jornada estándar (min)" (`jornadaEstandarMin`) sin efecto real en ningún cálculo
- **Área:** `src/ports.js` (`DEFAULT_CONFIG.jornadaEstandarMin`, `normalizeConfig`), `manager/tabs/Ajustes.jsx:33,84,92-102` (campo editable con conversión a horas).
- **Repro:** cambiar "Jornada estándar (min)" de 480 (8 h) a 120 (2 h) desde Ajustes y volver a consultar el Informe/Hoy/Registros del mismo periodo.
- **Esperado:** el checklist de esta fase pide verificar el "efecto real" de este ajuste igual que los demás (redondeo, PIN, etc.); un admin espera que cambiar la "jornada estándar" afecte a algo (p. ej. horas extra/déficit).
- **Actual:** `grep jornadaEstandarMin` en `src/` solo aparece en `ports.js` (definición/normalización); no se usa en `domain/jornadas.js`, `informe.service.js`, `hoy.service.js` ni `registros.service.js`. El informe antes y después de cambiar 480→120 es **byte a byte idéntico** (mismos `totalMinutos`/`jornadas`).
- **Evidencia:** `revision/_scripts/06-ajustes.mjs` → assert de igualdad estricta `JSON.stringify(infAntes.empleados) === JSON.stringify(infDespues.empleados)`.
- **Nota de honestidad:** ya documentado como observación "no defecto" (OBS-1) en `auditoria/02-DEFECTOS.md` de una auditoría previa (decisión consciente de alcance). Se reconfirma aquí de forma independiente porque el ajuste sigue siendo editable/persistente en la UI sin ninguna indicación de que es meramente informativo — para un admin que lo cambia, el resultado es indistinguible de un ajuste roto.

### A-06 · MENOR — Rango por defecto del FRONTEND calculado con la hora local del navegador, no con `zonaHoraria`
- **Área:** `manager/api.js` (`primerDiaMes`/`ultimoDiaMes`, usan `new Date()` del navegador), usado en `manager/tabs/Registros.jsx:175-177` y `manager/tabs/InformeHoras.jsx:15-17`.
- **Repro:** admin con el navegador/SO en `Pacific/Honolulu` (UTC-10) el 1 de agosto a las 06:00 UTC (08:00 en Madrid → ya es agosto en la zona del negocio; 31/07 20:00 en Honolulu → localmente aún julio).
- **Esperado:** el rango "mes en curso" debería coincidir con lo que el backend considera el mes en curso para el negocio (`config.zonaHoraria`, por defecto Europe/Madrid), igual que ya hace `rangoDefecto()` en `src/http/handlers.js:30-37`.
- **Actual:** `primerDiaMes`/`ultimoDiaMes` devuelven `2026-07-01..2026-07-31` (julio) mientras el backend, en ese mismo instante, ya considera agosto el mes en curso. El front-end SIEMPRE envía `desde`/`hasta` explícitos, por lo que el default del backend nunca llega a usarse desde la UI real.
- **Evidencia:** ejecución con `process.env.TZ='Pacific/Honolulu'` antes de importar `manager/api.js` (ver transcripción de sesión).
- **Impacto:** solo se manifiesta cerca de los límites de mes y con el navegador en una zona horaria distinta a la del negocio; no afecta si el admin trabaja desde la misma zona horaria del centro.

---

## SOLICITUDES

**Estado: PASA** (con nota de defensa en profundidad A-07). Verificado con `revision/_scripts/05-solicitudes.mjs` (23/23 OK) y `10-casos-limite-extra.mjs`:
- 3 filtros (`pendiente`/`aprobada`/`rechazada`) y sin filtro, todos correctos.
- Cada solicitud trae `cambio` (objeto completo) y `motivo` (no vacío) para que `describirCambio()` (`manager/tabs/Solicitudes.jsx:21-28`) los muestre.
- `aprobar` con `cambio.accion:'anadir'` **añade realmente** una marca (verificado contando filas en `presentia_marcas` antes/después) y cierra la jornada; con `cambio.accion:'editar'` aplica el nuevo `ts` y **conserva el original** en `presentia_marca_versiones` (verificado independientemente del caso ya cubierto en `test/flujos.test.js`).
- `rechazar` deja la fila de jornada **byte a byte idéntica** (comparación JSON antes/después) y no añade marcas.
- Una solicitud ya resuelta no se resuelve dos veces: segunda `aprobar()` → `SOLICITUD_RESUELTA` (409), sin duplicar marcas; `rechazar()` sobre una ya aprobada también falla igual.
- Concurrencia simulada (`Promise.all` con dos "admins" distintos aprobando la misma solicitud): **solo una tiene éxito**, la marca no se duplica.

### A-07 · MENOR — Guard de "ya resuelta" sin protección a nivel SQL (solo por monohilo síncrono)
- **Área:** `src/services/solicitudes.service.js` (`aprobar`, `rechazar`).
- **Detalle:** el `SELECT` que comprueba `estado !== 'pendiente'` ocurre **antes** de entrar en el `SAVEPOINT` (`aprobar`) o sin transacción alguna (`rechazar`); el `UPDATE` final (`...WHERE id = ?`) **no** incluye `AND estado = 'pendiente'` como cinturón de seguridad a nivel de fila. La garantía real de "no se resuelve dos veces" depende ÚNICAMENTE de que Node ejecute todo el handler de forma síncrona (sin `await` entre la lectura y la escritura) y de que la BD sea single-process (SQLite en memoria del propio proceso).
- **Por qué no es explotable HOY:** confirmado con simulación de concurrencia (`Promise.all`) — como no hay puntos de suspensión, Node no puede intercalar las dos ejecuciones; la 2ª siempre ve el estado ya actualizado por la 1ª.
- **Riesgo:** si en el futuro se introduce cualquier operación asíncrona entre el `SELECT` y el `UPDATE` (p. ej. una migración a un cliente de BD asíncrono, un `await` de auditoría remota, etc.), o si el módulo se ejecutara contra una BD compartida por más de un proceso, el guard dejaría de proteger de verdad y sí podría duplicarse la aplicación del cambio.
- **Evidencia:** `revision/_scripts/05-solicitudes.mjs` (sección "CONCURRENCIA"), lectura de código citada arriba.

---

## AJUSTES

**Estado: PASA con notas** (A-05 arriba; A-08 abajo). Verificado con `revision/_scripts/06-ajustes.mjs` (25/25 OK), cada ajuste en sus DOS estados con efecto real medido, no solo leído:
- `mostrarEnKiosko`: `true`→lista de 4 empleados; `false`→lista vacía; `true` de nuevo→vuelve a mostrarse.
- `exigirPin`: `true`→PIN erróneo rechazado (`PIN_INCORRECTO`); `false`→**cualquier** PIN entra.
- `variasMarcasDia`: `false`→tras cerrar la jornada del día, un tercer fichaje lanza `JORNADA_CERRADA`; `true`→se puede reabrir/añadir otra entrada el mismo día.
- `imprimirTicket`: `false`→`printing.printTicket` NUNCA se invoca; `true`→se invoca exactamente 1 vez por fichaje (puerto `printing` simulado y contado).
- `redondeoMin`: persistencia 0→15 confirmada (efecto real sobre el cálculo ya cubierto en el bloque de Informe: 127→120 con `redondeoMin=15`).
- `jornadaEstandarMin`: **sin efecto real** — ver **A-05**.

**Persistencia tras "reinicio":** se recreó el módulo (`crearModulo(env)`) una **segunda vez** sobre la MISMA conexión de BD (simulando un reinicio del proceso que reutiliza el almacenamiento persistente) tras guardar `redondeoMin:10`, `exigirPin:false`, `temaPorDefecto:'oscuro'`: los tres valores se leen intactos vía `leerConfig()` y vía `manager.ajustesGet()` en el módulo "reiniciado" — **confirmado, no de vista**.

**Un `empleado` NO puede tocar Ajustes:** `ajustesGet`/`ajustesPut` con `rol:'empleado'` → `PROHIBIDO` en ambos; se comprobó además que el intento de escritura **no tuvo ningún efecto** sobre la config real (sigue `exigirPin:true`).

### A-09 · MENOR — Valor inválido se ACOTA silenciosamente, no se "rechaza" (sin error 400)
- **Área:** `src/ports.js` (`normalizeConfig`), `src/services/ajustes.service.js` (`guardar`).
- **Repro:** `PUT /manager/ajustes` con `{redondeoMin:999, jornadaEstandarMin:-50, conservacionAnios:1, temaPorDefecto:'invalido-xyz'}`.
- **Esperado (según el checklist de esta fase, "valor inválido rechazado"):** un admin esperaría o bien un error 400 explicando qué valor no es válido, o al menos una respuesta que le permita saber que su entrada fue corregida.
- **Actual:** la petición devuelve `200 OK` con los valores **silenciosamente acotados/sustituidos** (`redondeoMin→120`, `jornadaEstandarMin→480` [el valor por DEFECTO, no un acotado al mínimo/máximo válido más cercano], `conservacionAnios→4`, `temaPorDefecto→'auto'`), sin ningún código de error ni campo que indique qué se corrigió. El frontend (`manager/tabs/Ajustes.jsx:70-71`) sí refleja el valor normalizado tras guardar, pero no informa al admin de que su valor fue rechazado — simplemente ve un número distinto al que escribió, sin explicación.
- **Evidencia:** `revision/_scripts/06-ajustes.mjs`, sección "valor inválido".
- **Severidad:** MENOR — no hay riesgo de seguridad ni de integridad (los límites SÍ se respetan), es una cuestión de experiencia de administración (falta de feedback).

---

## PERMISOS (matriz rol × acción completa)

**Estado: PASA** (con nota de arquitectura A-08). Verificado con `revision/_scripts/07-permisos.mjs` (26 aserciones OK). Matriz completa para las 11 acciones de `manager.*` (`hoy, registros, editarMarca, anadirMarca, informe, informeExport, solicitudes, ajustesGet, ajustesPut, auditoriaVerificar, terminos`) × 4 roles (sin sesión, `empleado`, `local_admin`, `technician`):

| Acción | sin sesión | empleado | local_admin | technician |
|---|---|---|---|---|
| hoy / registros / editarMarca / anadirMarca / informe / informeExport / solicitudes / ajustesGet / ajustesPut / terminos | `NO_AUTENTICADO` 401 | `PROHIBIDO` 403 | OK | OK |
| auditoriaVerificar | `NO_AUTENTICADO` 401 | `PROHIBIDO` 403 | `PROHIBIDO` 403 | OK |

Todas las celdas de denegación verificadas explícitamente (no solo las de éxito).

- **Forjar el rol en la petición:** con `actor={empleadoId:'e1', rol:'local_admin'}` (siendo `e1` realmente `'empleado'` en `employees`), `manager.hoy()` responde `OK`. El handler **no** vuelve a comprobar `employees.getById(actor.empleadoId).rol`; confía 100% en `ctx.actor` tal y como llega. Esto es **por diseño documentado** (`src/http/authz.js:1-4`: "el rol procede del puerto `session.resolve` del host... nunca se confía en el rol enviado por el cliente") — la seguridad depende enteramente de que la implementación real de `session.resolve(req)` en Expira sea infalible; el módulo en sí no tiene forma de verificarlo. Se deja constancia, no se cuenta como hallazgo nuevo (es una asunción arquitectónica explícita, fuera del control de este módulo).
- **Token de kiosko caducado** (`>90s`, TTL de `crearKioskSessions`): `kiosk.fichar()` → `SESION_KIOSKO` 401. Confirmado.
- **Sin token en absoluto:** `kiosk.fichar()`/`kiosk.misRegistros()` → `SESION_KIOSKO` 401. Confirmado.
- **IDOR (cambiar un ID ajeno):** `e1` (con su propio token) intentando crear una solicitud `editar` sobre `marcaId` de `e2`, o `anadir` sobre `jornadaId` de `e2` → `PROHIBIDO` 403 en ambos casos (`validarPropiedad()`, `src/http/handlers.js:46-55`). Confirmado.
- **Kiosko no alcanza rutas de administración:** los 6 endpoints de `kiosk.*` exigen `requireCanalKiosko(ctx.canal)` (`src/http/authz.js:23-25`) — confirmado que fallan con `CANAL_INVALIDO` si `canal !== 'kiosk'`.

### A-08 · MENOR — `manager.*` no comprueba `ctx.canal`; asimetría de defensa en profundidad
- **Área:** `src/http/handlers.js` (todo el objeto `manager`), `src/http/authz.js` (`requireCanalKiosko` solo se invoca desde `kiosk.*`).
- **Detalle:** cada handler de `kiosk.*` empieza con `requireCanalKiosko(ctx.canal)` como cinturón de seguridad redundante (aunque las rutas ya estén fijadas). Ningún handler de `manager.*` tiene el equivalente (`requireCanalManager` o similar): solo comprueban `ctx.actor.rol` vía `requireRol`.
- **Repro (verificado):** invocar `manager.hoy(deps, {canal:'kiosk', actor:ADMIN, ...})` directamente → responde `OK` (no lanza `CANAL_INVALIDO`). Lo mismo para `registros`, `informe`, `informeExport`, `solicitudes`, `ajustesGet`, `ajustesPut`, `terminos`, `aceptarTerminos`, `aprobar` (y `editarMarca`/`anadirMarca`/`rechazar` fallan, pero por validación de payload, NO por el canal).
- **Por qué no es explotable HOY:** en el enrutado real (`src/http/fastify-adapter.js:63-77`), el valor de `canal` para cada ruta de `manager/*` está **hardcodeado en el servidor** (`'manager'`), no proviene del cliente; un atacante no puede hacer que una petición HTTP real a `/presentia/manager/hoy` llegue con `canal:'kiosk'`.
- **Por qué se documenta igualmente:** es una asimetría de diseño (el lado kiosko sí tiene el cinturón de seguridad redundante, el lado admin no) que iría contra la regla general del propio código ("ocultar un botón no es autorizar", `src/http/authz.js:1-4`) si en el futuro se añadiera cualquier ruta o wiring alternativo (tests, otro adaptador HTTP, un proxy interno) que reutilizara `canal` de forma menos controlada.
- **Evidencia:** `revision/_scripts/07-permisos.mjs`, bloque final ("Desde el kiosko no debe alcanzarse...").

---

## COHERENCIA ENTRE PANTALLAS

**Estado: PASA con la excepción de A-02.** Verificado con `revision/_scripts/08-coherencia.mjs`:
- Lo fichado en kiosko aparece al instante en Hoy (mismo código de jornada, mismo tipo de marca).
- Una corrección en Registros (`editarMarca`, mover la salida +2h) se refleja al instante en Informe (180 min → 300 min, exacto).
- Aprobar en Solicitudes cambia el fichaje real: Registros pasa de `enCurso:true` a `enCurso:false` con `minutos:240`; Informe coincide EXACTAMENTE (240 min); Hoy también reclasifica a la persona de "dentro" a "se ha ido".
- **Repetido el escenario de A-02 entre pantallas:** tras editar la entrada con una hora posterior a la salida real, `Hoy` pasa de `dentroAhora:0, salidas:1` (correcto) a `dentroAhora:1, salidas:0` — el sistema muestra a un empleado como presente físicamente en el centro cuando en realidad fichó su salida hace horas. Esto es más que un problema de cálculo de horas: en un panel de "quién está dentro ahora mismo" (uso operativo, p. ej. en caso de emergencia/evacuación) es una información objetivamente falsa generada por una edición sin validar.

---

## INTERFAZ (análisis estático)

**Análisis estático** de `manager/*.jsx`, `manager/presentia.css`, `shared/responsive.css`, `shared/tokens.css` — sin hallazgos nuevos más allá de lo ya cubierto por la suite (`test/tema.test.js`, `test/responsive.test.js`, 121/121 verdes):
- Claro/oscuro: cero colores hardcodeados fuera de `shared/tokens.css` (test existente); `.px-*` usa exclusivamente `var(--color-*)`/`var(--status-*)`.
- Tablas → tarjetas en móvil con `data-label` en cada `<td>` (`Hoy.jsx`, `Registros.jsx`, `InformeHoras.jsx`); `Solicitudes.jsx` no usa tabla (lista `.px-solicitud`), no lo necesita.
- Estados vacío/carga/error consistentes en las 5 pestañas: `.px-estado` ("Cargando…", "No hay..."), `.px-error[role=alert]`.
- Modales (`Editar marca`, `Añadir marca`, `Resolver solicitud`) como hoja con `max-height:90dvh` + fallback `90vh`, y acciones fijas al pie.
- Insignia "en curso" usa `--status-warning` (ámbar) — confirmado en CSS, coherente con lo pedido.
- No se ha podido verificar renderizado real en navegador/viewport físico (limitación ya reconocida en `auditoria/00-CATALOGO.md`, sección "No verificado"); esta fase se limita, como las anteriores, a análisis estático del código y los tokens.

---

## Apéndice — Comandos de verificación

```bash
npm test                                   # 121/121 verdes (antes y después)
node revision/_scripts/01-hoy.mjs
node revision/_scripts/02-registros.mjs
node revision/_scripts/03-registros-limites.mjs
node revision/_scripts/04-informe.mjs
node revision/_scripts/05-solicitudes.mjs
node revision/_scripts/06-ajustes.mjs
node revision/_scripts/07-permisos.mjs
node revision/_scripts/08-coherencia.mjs
node revision/_scripts/09-timezone-frontend.mjs
node revision/_scripts/10-casos-limite-extra.mjs
```

Todos imprimen `OK:`/`FALLO:` por aserción y terminan con `--- fin <script>.mjs ---`;
código de salida `1` si hay algún `FALLO` (todos terminaron en `0` salvo el hallazgo
esperado en `03-registros-limites.mjs`, que es información, no un fallo del script).
