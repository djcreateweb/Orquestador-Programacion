# ENTREGA — Presentia v1.0.0

## Qué es esto
**Presentia** es un módulo de **registro de jornada** (control horario) para integrarse dentro
del software **Expira**. No tiene login propio ni base de datos nueva: reutiliza los empleados,
PIN, sesiones y auditoría de Expira, y añade tablas aditivas `presentia_*`. Aporta el apartado
**«Presentia»** en el Manager y la acción **«Fichar»** en el kiosko.

## Estado
- **Versión:** 1.0.0 (tag `v1.0.0`) · **Fecha:** 2026-07-14
- **Veredicto:** ✅ **APTO PARA INTEGRAR.** El módulo está limpio (sin datos ni credenciales de
  demo), endurecido, probado (121/121) y empaquetado. La **puesta en producción real** queda
  condicionada a cerrar los `TODO-INTEGRACIÓN` (abajo), que solo pueden hacerse contra Expira.

## Qué contiene cada carpeta
| Carpeta | Contenido |
|---|---|
| `src/` | Núcleo backend: dominio, servicios, HTTP (handlers + adaptador Fastify), BD, seguridad. `src/dev/` es solo dev/test (blindado contra producción). |
| `manager/` | UI del Manager (React): 6 pestañas. |
| `kiosk/` | UI del kiosko (React): fichar, mis registros, info legal, aceptación. |
| `shared/` | Tokens de diseño, 2 temas, responsive, renderer Markdown, botón de tema, utilidades. |
| `legal/` | 10 documentos legales + generador de contenido embebido. |
| `docs/` | Documentación: integración, manuales, análisis, notas de release, tema, responsive. |
| `auditoria/` | Auditoría funcional (catálogo, informe, defectos, evidencias, semilla). |
| `test/` | Suite completa (node:test, cero dependencias). |
| `dev-preview/` | Herramienta interna de previsualización/compilación. **No es producción.** |

## Cómo integrarlo
Sigue **[`INTEGRACION-EN-EXPIRA.md`](INTEGRACION-EN-EXPIRA.md)** (procedimiento por pasos).
> ⚠️ **Haz copia de seguridad de la BD de Expira ANTES de migrar (paso 4).**
Tras integrar: `npm run smoke` debe imprimir `SMOKE TEST: OK`.

## Qué queda pendiente para un humano
- **Regresión C11** contra la Expira real: confirmar que sus funciones previas (etiquetado,
  caducidades, licencia, Hub, backups, impresión) siguen intactas.
- **Validación visual en hardware**: kiosko/tablet/Electron, en tema claro y oscuro.
- **Revisión legal por abogado/DPD**: validar los textos de `legal/`, sustituir los marcadores
  `[NOMBRE_EMPRESA]`, `[CIF]`, `[DOMICILIO]`, `[EMAIL_DPD]`, `[NOMBRE_PROVEEDOR]`, `[HUB_CENTRAL]`,
  y **reverificar el estado del RD** de registro de jornada en el BOE.
- **Endurecimiento de despliegue**: cifrado en reposo + backups cifrados, servidor en 127.0.0.1
  + TLS con el Hub, CSP y cabeceras, Electron (`contextIsolation`/sin `nodeIntegration`), NTP,
  empaquetar la fuente Inter.
- **Decisión abierta**: si la «jornada estándar» debe generar horas extra en el informe (hoy es
  informativa).

## Riesgos residuales conocidos
- El sello temporal legal depende del **reloj del mini-PC** → asegurar NTP.
- Si el Hub aloja datos fuera del EEE, hay que documentar la transferencia (RGPD cap. V).
- La fuente **Inter** aún no se empaqueta (`shared/fonts.css`): hoy usa Inter local o el fallback.
- El módulo se entrega como **fuente**; Expira debe empaquetarlo (Vite/su bundler).

## Recuperar el Presentia original
Se eliminó (`backend/` Laravel + `frontend/` React). Estado archivado y recuperable:
```bash
git checkout presentia-original-preborrado
```
