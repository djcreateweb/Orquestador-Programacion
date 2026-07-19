# RELEASE 03 · Verificación de entrega (Fase 4)

Cada comprobación con ejecución real. Fecha: 2026-07-14 · Node v24.

| # | Comprobación | Evidencia | Resultado |
|---|---|---|:--:|
| 1 | **Arranque virgen sin datos** | BD vacía + `migrate` → 0 jornadas/marcas/solicitudes/aceptaciones; solo 10 ajustes por defecto (`test/release.test.js`) | ✅ |
| 2 | **Cero credenciales por defecto** | `admin/admin`, `admin/1234`, `e1/0000`, `e1/1234` → `PIN_INCORRECTO`; empleados en kiosko `[]` en instalación limpia | ✅ |
| 3 | **Grep de prohibidos** (falla si hay demo/credenciales/ruido en producción) | `test/release.test.js` · 0 hallazgos | ✅ |
| 4 | **Ciclo completo sobre instalación virgen** | crear empleado → entrada → salida → Registros con horas → informe cuadra → auditoría íntegra (`npm run smoke`) | ✅ |
| 5 | **Suite completa** (dominio, flujos, seguridad, migración, auditoría, legal, aceptación, tema, responsive, release) | `npm test` → **121/121** | ✅ |
| 6 | **Migración**: aditiva, idempotente, no destruye | `test/migration.test.js` (idempotente + no borra preexistentes) | ✅ |
| 7 | **Reversión** documentada | Plan de reversión en `INTEGRACION-EN-EXPIRA.md` (quitar enganche; tablas aditivas; restaurar copia) | ✅ |
| 8 | **Lint / build / audit** | `node --check` OK; build 54 módulos; `npm audit` 0 vulnerabilidades | ✅ |
| 9 | **Sin funcionalidad perdida** | 6 pestañas del Manager + kiosko siguen operativas; suite y smoke lo cubren | ✅ |
| 10 | **`backend/` y `frontend/` eliminados** y todo verde sin ellos | `grep` sin refs; suite/build verdes | ✅ |
| 11 | **Original archivado y recuperable** | tag `presentia-original-preborrado` | ✅ |
| 12 | **Árbol autosuficiente** | `presentia-expira/` no referencia nada externo; raíz limpia (solo `presentia-expira/` + README + .gitignore) | ✅ |
| 13 | **Paquete de integración seguible** | `INTEGRACION-EN-EXPIRA.md` por pasos + smoke test en verde | ✅ |

## No verificable en este entorno (queda para el repo real de Expira)
- **Regresión C11** (funciones previas de Expira intactas): requiere el repo real.
- Validación **visual** en hardware (kiosko/tablet/Electron), claro y oscuro.
- Verificación **legal** online del estado del RD y revisión por abogado/DPD.
- Endurecimiento de despliegue (cifrado en reposo, TLS, CSP, Electron, NTP): contra el entorno real.

Estos son límites del banco de pruebas, no defectos; están listados como `TODO-INTEGRACIÓN`.
