# Registro maestro de hallazgos — Revisión integral Presentia

Consolidado por el orquestador a partir de los 5 informes de la Ronda 1
(Fase 1 documentación, Fase 2 kiosko, Fase 3 admin, Fase 4.1/4.2 seguridad, Fase 4.3 rendimiento).
Total: **31 hallazgos únicos**. Nada se omite en silencio (regla 8).

**Disposición:** `FIX` = se corrige en la Fase 5 · `DOC` = no se corrige ahora, se documenta con motivo ·
`INTEG` = solo verificable/cerrable contra Expira real o el despliegue (fuera de este entorno).

## Correctitud de datos y jornadas → **Bloque A**
| ID | Sev | Resumen | Disp. |
|---|---|---|---|
| K-01 | BLOQUEANTE | Olvidar salida y volver al día siguiente (<24h) cierra la jornada de ayer con la hora de hoy | FIX |
| A-01 | CRÍTICO | Modal Editar/Añadir marca usa TZ del navegador; tabla usa Europe/Madrid → hora desplazada, corrupción silenciosa | FIX |
| A-02 | CRÍTICO | Editar/Añadir marca no valida orden cronológico entrada→salida | FIX |
| K-04 | MAYOR | `fichar` sin guardia de servidor contra doble envío → ciclo de 0 min (= doc#6) | FIX |
| A-04 | MAYOR | No hay forma de registrar un día olvidado por completo (0 marcas) | FIX |
| K-06 | MENOR | Zona horaria del kiosko hardcodeada `Europe/Madrid`, ignora `config.zonaHoraria` | FIX |
| A-06 | MENOR | Rango por defecto calculado con hora local del navegador, no con `zonaHoraria` | FIX |

## Seguridad y permisos → **Bloque B**
| ID | Sev | Resumen | Disp. |
|---|---|---|---|
| S-01 | HIGH/CRÍTICO | Rotar cabecera `x-presentia-dispositivo` anula backoff de PIN y rate-limiter | FIX |
| S-07 | HIGH/CRÍTICO | `scryptSync` bloquea el event-loop (~150ms) → DoS barato | FIX |
| S-02 | HIGH/CRÍTICO | Auditoría no detecta truncamiento de cola (borrar últimas filas) (= doc#2) | FIX |
| K-02 | CRÍTICO | Empleado dado de baja entra al kiosko (ve/exporta histórico, crea solicitudes) | FIX |
| K-03 | MAYOR | Autoaprobación de la propia solicitud (`actorId` no comparado con `empleado_id`) | FIX |
| S-06 | MEDIUM | `crearSolicitud`/`misRegistros`/`exportar` sin límite de tasa (= doc#5) | FIX |
| S-03 | MEDIUM | Token de sesión de kiosko viaja en la query de las descargas CSV/PDF (= K-07) | FIX |
| A-03 | MAYOR | CSV de Registros (cliente) no neutraliza inyección de fórmulas `=+-@` | FIX |
| A-07 | MENOR | Guard "solicitud ya resuelta" sin `WHERE estado='pendiente'` en SQL | FIX |
| A-08 | MENOR | Handlers `manager.*` no comprueban `ctx.canal` (asimetría con kiosko) | FIX |
| A-09 | MENOR | Valores inválidos en Ajustes se acotan en silencio en vez de rechazarse | FIX |
| S-04/05 | LOW | (menores del informe de seguridad) | FIX/DOC |

## Rendimiento → **Bloque C**
| ID | Sev | Resumen | Disp. |
|---|---|---|---|
| Perf-1 | CRÍTICO | N+1 en `marcasDeJornada` (repos.js): N+1 queries por N jornadas | FIX |
| Perf-2 | ALTO | `partesFecha()` reconstruye `Intl.DateTimeFormat` en cada llamada (~15×) | FIX |
| Perf-3 | ALTO | Sin paginación (`listarJornadas`) + tabla Registros sin virtualizar | FIX |
| Perf-5 | BAJO/MEDIO | `rate`/`kioskSessions` (Maps) nunca se purgan → crecimiento no acotado | FIX |
| Perf-6 | BAJO/MEDIO | Sin cache de sentencias preparadas en repos.js | FIX |
| Perf-4 | ALTO* | Sin `PRAGMA busy_timeout`/`WAL` (2 procesos → `SQLITE_BUSY`) | FIX+INTEG |
| Perf-7 | BAJO | Bundle Vite en un solo chunk (solo afecta a dev-preview) | DOC |

## Menores, decorativos y legales → **Bloque D**
| ID | Sev | Resumen | Disp. |
|---|---|---|---|
| K-05 | MAYOR | El kiosko no permite al empleado ver el estado de sus solicitudes | FIX (endpoint) |
| A-05 | MAYOR | `jornadaEstandarMin` es decorativo (no afecta a ningún cálculo) (= doc#3) | DOC (decisión de producto) |
| FK-1 | MENOR | Sin `PRAGMA foreign_keys = ON`; FKs no se hacen cumplir (doc#1) | FIX |
| LEG-1 | MENOR | `conservacionAnios` sin job/endpoint de purga (obligación legal) (doc#4) | FIX (función guardada+auditada, no auto) |
| UI-1 | MENOR | Fuente Inter nunca se carga (import roto a dir inexistente) (doc#7) | FIX (limpiar import) + INTEG (empaquetar fuente) |
| LEG-2 | MENOR | Documentos legales con marcadores `[NOMBRE_EMPRESA]` sin rellenar visibles (doc#8) | DOC/INTEG (los completa la empresa) |
| K-08 | MENOR | Kiosko sin manejo del botón "atrás" del navegador | DOC |

## Solo integración/despliegue (INTEG) — no cerrables en este entorno
Cifrado en reposo del `.db`, permisos del fichero, backups cifrados, Electron
(`contextIsolation`/`nodeIntegration`), TLS con el Hub, cabeceras Nginx/CSP/CORS del host,
sesión/cookies del Manager (delegadas a `session.resolve` de Expira), `pin.verify`/`hash`
reales de producción, firewall del VPS. Se verifican al integrar contra Expira.

## Plan de ejecución de la Fase 5 (bloques secuenciales, un solo escritor)
- **Bloque A** — correctitud de datos y zona horaria (7 fixes). Empezar por aquí (BLOQUEANTE + 2 CRÍTICO).
- **Bloque B** — seguridad y permisos (~11 fixes).
- **Bloque C** — rendimiento (N+1, formatter, paginación, pragmas, maps).
- **Bloque D** — menores/legales/decorativos (fix o documentar según disposición).
- Tras cada bloque: `npm test` completo (debe seguir verde + tests nuevos), y al final: auditoría, seguridad,
  lint, build, `npm audit`, re-medición de rendimiento (antes→después) y regeneración del PDF.

## Añadidos por el pase adversarial del orquestador (ver `00-COBERTURA-AUDIT.md`)
| ID | Sev | Resumen | Disp. | Bloque |
|---|---|---|---|---|
| OBS-3 | MAYOR | `editarMarca`/`crearJornadaCompleta` no validan coherencia `ts`↔`fecha` de la jornada (mover marca a otro día/año deja `fecha` obsoleta); A-02 solo cubre el orden interno | FIX | C (correctitud) |
| ADV-1 | MEDIA | Ningún endpoint limita el tamaño del payload (`motivo`/`comentario`/`cambio`) → 5 MB se almacena sin error; con S-06 = almacenamiento no acotado | FIX | C |
| ADV-2 | BAJA | `desde`/`hasta` sin validar como fecha y reflejados sin sanear en `Content-Disposition` | FIX | C |
| ADV-S3 | BAJA | `crearJornadaCompleta`/`editarMarca` sin cota de duración máxima (manifestación de OBS-3) | FIX | C |
| NF-09 | MENOR | Jornada huérfana ≥24h sin aviso proactivo en *Hoy* (K-01 la marca con insignia pero no alerta) | DOC/FIX-leve | D |
| ADV-S1 | VERIFICAR | La validación estricta de A-02 podría bloquear correcciones de jornadas ya inconsistentes (datos migrados) — comprobar que editar HACIA un estado válido sigue permitido | VERIFICAR | C |

### Correcciones al propio registro (señaladas por la auditoría de cobertura)
- **S-05**: en `04A-SEGURIDAD.md` es **MEDIUM**, no LOW; y coincide con **LEG-1 / doc#4** (purga de conservación
  no implementada). Se unifican: la purga se aborda una sola vez en el **Bloque D** (LEG-1). La línea "S-04/05 LOW"
  del registro queda matizada: S-04 = LOW, S-05 = MEDIUM (= LEG-1).
- **A-05** (DOC): la decisión de producto se mantiene, pero se añade requisito → la UI de Ajustes debe indicar
  "solo informativo" junto a `jornadaEstandarMin` (Bloque D).
