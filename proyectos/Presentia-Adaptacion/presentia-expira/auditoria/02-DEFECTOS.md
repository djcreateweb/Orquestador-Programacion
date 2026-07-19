# 02 · DEFECTOS — Auditoría funcional de Presentia

2 defectos encontrados, **2 corregidos y verificados**. 0 abiertos.

---

## DEF-001 · Turnos de noche: la salida tras medianoche no cierra la jornada de entrada
- **Severidad:** MAYOR (cálculo de horas incorrecto para turnos que cruzan medianoche).
- **Área:** `src/services/fichaje.service.js` (`fichar`, `estadoEmpleado`).
- **Cómo reproducirlo (antes del fix):** un empleado ficha ENTRADA a las 23:00 y SALIDA a las 02:00 del día siguiente vía kiosko.
- **Comportamiento defectuoso:** `fichar` bucketizaba la marca por la fecha local del **instante de la marca**. Como la salida cae en el día siguiente, `jornadaDe(empleado, díaSiguiente)` devolvía `null` y se creaba una **jornada nueva** cuya primera marca se registraba como **entrada** (no salida). Resultado: la jornada de entrada quedaba abierta con 0 h, la del día siguiente también, y **las horas reales del turno se perdían**. Además, tras medianoche el kiosko mostraba al trabajador como "Fuera / FICHAR ENTRADA" estando aún dentro.
- **Evidencia:** el caso CU-025 (informe 8 h + 5 h) daba `480 !== 780`: las 5 h del segundo empleado (cuya salida caía a las 00:00 locales) no se computaban.
- **Causa raíz:** el servicio resolvía la jornada por fecha de calendario en vez de por **estado** (¿hay una jornada abierta del empleado?). El dominio (`emparejarSegmentos`) sí soportaba cruzar medianoche, pero nunca recibía ambas marcas en la misma jornada.
- **Corrección aplicada:** nueva función `jornadaObjetivo()` — si no hay jornada del día local pero el empleado tiene una **jornada abierta reciente** (última entrada hace <24 h), el fichaje cierra ESA jornada. Si la jornada abierta es de hace ≥24 h (olvido de días atrás), NO se reutiliza: se empieza una nueva hoy y la antigua queda para corrección del admin (evita cerrar por error un olvido antiguo). Helper `repos.jornadaAbiertaReciente()`. `estadoEmpleado` usa la misma resolución, de modo que el kiosko sigue mostrando "Dentro" tras medianoche.
- **Caso que lo verifica:** CU-034 (`test/auditoria.test.js`, "REGRESIÓN turno de noche") + CU-025 vuelve a pasar. Suite completa 78/78.

## DEF-002 · Inyección de fórmulas en la exportación CSV (CSV injection)
- **Severidad:** MENOR (defensa en profundidad; el texto libre no controlado —motivos— no llega al CSV, sólo nombres, que provienen de Expira).
- **Área:** `src/export/csv.js` (`esc`).
- **Cómo reproducirlo (antes del fix):** un empleado cuyo **nombre** empiece por `=`, `+`, `-` o `@` (p. ej. `=1+2`). Al abrir el CSV en Excel/LibreOffice, la celda se interpreta como **fórmula**.
- **Comportamiento defectuoso:** `esc` sólo entrecomillaba ante `" , ; \n`, pero no neutralizaba el carácter inicial de fórmula. Confirmado con sonda: la celda `=1+2` se emitía cruda.
- **Causa raíz:** falta de saneado contra CSV injection (OWASP).
- **Corrección aplicada:** `neutralizarFormula()` antepone un apóstrofo (`'`) a toda celda que empiece por `= + - @ \t \r`, forzando su lectura como texto.
- **Caso que lo verifica:** CU-045 (`test/auditoria.test.js`, "inyección CSV neutralizada").

---

## Observaciones (no defectos — registradas por honestidad)

- **OBS-1 · `jornadaEstandarMin` sin efecto en cálculos.** El ajuste se persiste y se muestra en la pestaña Ajustes (equivalencia en horas), pero **no interviene en ningún cálculo del informe** (no hay lógica de horas extra/esperadas). El prompt de auditoría asumía "afecta al informe"; en la implementación es informativo. No se ha inventado la funcionalidad (fuera de alcance); se documenta. Recomendación: si se desea, añadir columna "horas esperadas vs. trabajadas" en el informe.
- **OBS-2 · Rate limiting sólo en `entrar`/`fichar`.** `crearSolicitud`, `misRegistros` y `exportar` no tienen límite de ritmo. Riesgo bajo (requieren token de kiosko válido y sólo operan sobre lo propio). Recomendación opcional: extender el limiter.
- **OBS-3 · Edición de marca sin validar que el `ts` caiga en la fecha de la jornada.** Un admin puede fijar una hora de otro día. Es una acción de administración confiable y auditada; se documenta como decisión, no defecto.
- **OBS-4 · `fichar` es un toggle sin antirrebote en servidor.** Mitigado en cliente (`FicharScreen` deshabilita el botón mientras hay petición). Dos llamadas seguidas producen entrada+salida (jornada de 0 min), nunca corrupción. Aceptable por diseño.
