# 00 · CATÁLOGO DE CASOS — Auditoría funcional de Presentia

> Contrato de la auditoría. Cada caso está **ejecutado** con evidencia real (suite
> `node --test`, 78 casos, 0 fallos). Fecha: 2026-07-13. Node v24.13.1. BD en memoria
> (cero destrucción). Reproducible: `npm test` + `node auditoria/seed/seed.mjs`.

**Leyenda de estado:** ✅ PASA · ❌ FALLA · ⚠️ PARCIAL · ⛔ NO VERIFICADO · 🚫 NO APLICA/entorno.

## Resumen de cobertura

| Bloque | Casos ejecutados | Estado |
|---|---|---|
| C1 · API y servidor | 9 (+val. previas) | ✅ |
| C2 · Roles y permisos | 6 (matriz completa) | ✅ |
| C3 · Kiosko | 7 | ✅ |
| C4 · Manager | 9 | ✅ |
| C5 · Reglas de negocio | 7 | ✅ |
| C6 · Datos/migración/operación | 3 (+3 previas) | ✅ |
| C7 · Seguridad | 4 (+7 previas) | ✅ |
| C8 · Legal | 2 (+cobertura previa) | ✅ |
| C9 · Diseño | verificación estática | ⚠️ (ver §NO VERIFICADO) |
| C10 · Robustez y límites | 3 | ✅ |
| C11 · Regresión de Expira | — | ⛔ (Expira no disponible) |
| **Suite completa** | **78** | **✅ 78/78** |

---

## Matriz de permisos (rol × acción) — cada celda es un caso, incluidas las denegaciones

`NA` = no autenticado · `EMP` = empleado · `ADM` = local_admin · `TEC` = technician.
Verificado en `test/auditoria.test.js` (C2·*) y `test/seguridad.test.js`.

| Acción (endpoint) | NA | EMP | ADM | TEC | Prueba |
|---|:--:|:--:|:--:|:--:|---|
| Manager · hoy | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · registros | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · editarMarca | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · anadirMarca | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · informe (+export) | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · solicitudes | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · aprobar / rechazar | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · ajustesGet / ajustesPut | ⛔401 | ⛔403 | ✅ | ✅ | C2 |
| Manager · auditoría/verificar | ⛔401 | ⛔403 | ⛔403 | ✅ | C2 (sólo técnico) |
| Kiosko · empleados/entrar/estado/fichar/… | canal `kiosk` + PIN/token | | | | C2 (CANAL_INVALIDO si no) |

Denegaciones adicionales verificadas: canal ≠ kiosk → `CANAL_INVALIDO`; token
inválido/caducado → `SESION_KIOSKO` 401; IDOR (marca/jornada ajena) → `PROHIBIDO`;
rol enviado por el cliente **ignorado** (procede de `session.resolve` del host).

---

## C1 · API y servidor
- CU-001 editarMarca sin motivo → `MOTIVO_REQUERIDO` 400 ✅
- CU-002 editarMarca ts inválido → `TS_INVALIDO` 400 ✅
- CU-003 editarMarca marca inexistente → `MARCA_INEXISTENTE` 404 ✅
- CU-004 anadirMarca tipo inválido / jornada inexistente / sin motivo ✅
- CU-005 entrar sin empleadoId → `EMPLEADO_REQUERIDO` 400 ✅
- CU-006 crearSolicitud sin motivo / cambio inválido ✅
- CU-007 aprobar/rechazar inexistente → 404; ya resuelta → 409 ✅
- CU-008 rate limiting: petición nº31 en ventana → `RATE` 429 ✅
- CU-009 BD vacía: Hoy en cero, Registros/Informe vacíos sin error ✅

## C2 · Roles y permisos
- CU-010 empleado no accede a NINGUNA acción del Manager → PROHIBIDO ✅
- CU-011 sin sesión → NO_AUTENTICADO en todo el Manager ✅
- CU-012 verificación de integridad sólo técnico (admin/empleado denegados) ✅
- CU-013 kiosko exige canal `kiosk` (6 endpoints) → CANAL_INVALIDO ✅
- CU-014 token inválido/ausente → SESION_KIOSKO 401 (estado/fichar/misRegistros) ✅
- CU-015 IDOR: empleado no añade marca en jornada ajena → PROHIBIDO ✅

## C3 · Kiosko
- CU-016 PIN incorrecto → PIN_INCORRECTO, mensaje genérico (no dice qué campo) ✅
- CU-017 empleado inactivo no puede fichar aunque el PIN sea válido → EMPLEADO_INVALIDO ✅
- CU-018 empleado inactivo no aparece en la lista del kiosko ✅
- CU-019 toggle entrada→salida con estado coherente en cada paso ✅
- CU-020 la sesión de kiosko caduca (~90 s) → SESION_KIOSKO ✅
- CU-021 misRegistros/exportar sólo devuelven lo propio ✅
- CU-022 doble pulsación: toggle entrada+salida (no dos entradas); cliente con antirrebote ✅

## C4 · Manager
- CU-023 Hoy: KPIs cuadran (1 dentro, 1 salida, 2 personas, 3 marcas) ✅
- CU-024 Registros: filtro por empleado, enCurso, badge editado ✅
- CU-025 Informe: horas verificadas a mano y Total = suma de filas (13 h) ✅
- CU-026 Exportación CSV: tildes/ñ intactas, BOM, totales, sin PIN/hash ✅
- CU-027 Ajustes: exigirPin / mostrarEnKiosko / variasMarcasDia con efecto real ✅
- CU-028 Ajustes: redondeoMin afecta al total del informe (127→120) ✅
- CU-029 Ajustes: imprimirTicket invoca al puerto printing ✅
- CU-030 Ajustes: valor inválido acotado (redondeoMin 999→120, conservación 1→4) ✅
- CU-031 Ajustes: PERSISTEN tras reiniciar (misma BD en fichero) ✅

## C5 · Reglas de negocio y cálculos
- CU-032 DST: jornada que cruza el cambio de hora computa el tiempo real (90/180 min) ✅
- CU-033 redondeo 0/5/15 al múltiplo más cercano ✅
- CU-034 **REGRESIÓN turno de noche**: salida tras medianoche cierra la jornada de entrada ✅ *(defecto DEF-001 corregido)*
- CU-035 correlativo: sin huecos, sin duplicados, reinicia por año ✅
- CU-036 correlativo: UNIQUE(codigo) impide colisión ✅
- CU-037 jornada abierta no suma horas (enCurso) ✅
- CU-038 zona horaria: fichaje 23:30 Madrid pertenece al día local correcto ✅

## C6 · Datos, migración y operación
- CU-039 migración no toca tablas preexistentes ajenas a Presentia ✅
- CU-040 backup + RESTAURACIÓN preserva datos y cadena de auditoría ✅
- CU-041 corte de luz a media escritura: SAVEPOINT revierte, sin datos parciales ✅
- CU-042 migrar dos veces es idempotente *(migration.test)* ✅
- CU-043 migración no borra datos preexistentes *(migration.test)* ✅
- CU-044 todas las tablas con prefijo `presentia_` *(migration.test)* ✅

## C7 · Seguridad
- CU-045 **inyección CSV neutralizada** (celda con fórmula) ✅ *(defecto DEF-002 corregido)*
- CU-046 inyección SQL: empleadoId malicioso tratado como literal ✅
- CU-047 XSS: `<script>` en nombre se almacena/devuelve literal (render escapa) ✅
- CU-048 auditoría: borrar una línea intermedia rompe la cadena ✅
- CU-049 fuerza bruta de PIN: bloqueo + backoff + auditado sin PIN *(seguridad.test)* ✅
- CU-050 ni PIN/hash/token en respuestas *(seguridad.test)* ✅
- CU-051 copia robada de la BD no revela credenciales *(seguridad.test)* ✅
- CU-052 auditoría inalterable: alterar una línea rompe el hash *(seguridad.test)* ✅
- CU-053 no existe endpoint de borrado de fichajes *(seguridad.test)* ✅
- CU-054 exportaciones CSV/PDF no filtran PIN/hash/token *(evidencia directa)* ✅

## C8 · Legal
- CU-055 valor ORIGINAL nunca se pierde; edición guarda quién/cuándo/por qué ✅
- CU-056 esquema sin biometría ni geolocalización ✅
- CU-057 trabajador accede y exporta sus propios asientos *(CU-021)* ✅
- CU-058 conservación mínima 4 años inderogable *(migration.test)* ✅

## C9 · Diseño (verificación estática — ver limitaciones)
- CU-059 paleta exacta en tokens (#2f5fbf/#1e9a59/#dc2626) ✅
- CU-060 fuente Inter declarada ✅
- CU-061 cero colores hardcodeados fuera de `shared/tokens.css` ✅

## C10 · Robustez y casos límite
- CU-062 volumen ≥5.000 jornadas: informe/registros en tiempo razonable ✅
- CU-063 nombre con emojis y tildes se conserva ✅
- CU-064 rango de informe invertido devuelve vacío sin error ✅

## ⛔ / 🚫 No verificado en este entorno (ver 01-INFORME §Limitaciones)
- C11 Regresión de Expira — **Expira real no disponible** (módulo construido contra puertos).
- C9 diseño *renderizado* (píxeles, área táctil real, insignia MODO ADMIN/TÉCNICO) — requiere navegador/kiosko real.
- Electron `contextIsolation`/`nodeIntegration` — no hay shell Electron en el módulo.
- Capa HTTP Fastify real — el adaptador se inyecta desde el host; probados los handlers que invoca.
