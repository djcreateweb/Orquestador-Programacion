# Presentia · módulo de registro de jornada para Expira

Presentia deja de ser una aplicación y pasa a ser **un módulo dentro de Expira**, reducido al mínimo:
sin procesos nuevos, sin base de datos nueva (sólo tablas `presentia_*` aditivas), **sin login propio**
(reutiliza los empleados y sus PIN de Expira), heredando licencia, Hub, backups, sesiones y auditoría.
En la interfaz sólo añade el apartado **«Presentia»** en el Manager y la acción **«Fichar»** en el kiosko.

> **Modo de construcción:** el código real de Expira no estaba disponible, así que el módulo se diseñó
> contra una **interfaz de puertos** ([src/ports.js](src/ports.js)). Ver [docs/INTEGRACION-EN-EXPIRA.md](docs/INTEGRACION-EN-EXPIRA.md).

## Características
- **Fichaje** entrada/salida con PIN (verificado por Expira), pausas opcionales, código correlativo `F-AAAA-NNNN`.
- **Manager** con 5 sub-pestañas: Hoy · Registros · Informe de horas · Solicitudes · Ajustes.
- **Kiosko** "Fichar": PIN → reloj + botón único (verde entrada / rojo salida) + acceso del empleado a lo suyo.
- **Legal**: registro digital, trazable e **inalterable** (auditoría encadenada por hash + versiones que conservan el original), exportación **CSV y PDF**, conservación 4 años, **cero biometría y cero geolocalización**.
- **Seguridad**: verificación de PIN en servidor, autorización por endpoint, anti-IDOR, bloqueo/backoff, errores genéricos, sin secretos en logs/BD.
- **Cero dependencias nuevas** (usa `node:sqlite`, `node:crypto`; PDF propio).

## Uso rápido (dev)
```bash
cd presentia-expira
npm test          # 139 pruebas (dominio, migración, flujos, seguridad, legal, tema, responsive)
```
Integración real: ver [docs/INTEGRACION-EN-EXPIRA.md](docs/INTEGRACION-EN-EXPIRA.md).

## Estructura
- `src/` — dominio, servicios, HTTP (handlers + adaptador Fastify), seguridad, exportación, puertos.
- `manager/` · `kiosk/` — componentes React (importan `shared/tokens.css`).
- `shared/` — tokens de diseño y fuentes.
- `legal/` — 10 documentos (aviso legal, privacidad, cláusula informativa, protocolo, RAT, encargo, conservación, cookies, EULA, **CUMPLIMIENTO.md**).
- `docs/` — [01-ANALISIS](docs/01-ANALISIS.md) · [02-ADAPTACION](docs/02-ADAPTACION.md) · [03-PRUEBAS](docs/03-PRUEBAS.md) · [SEGURIDAD](docs/SEGURIDAD.md) · [INTEGRACION-EN-EXPIRA](docs/INTEGRACION-EN-EXPIRA.md) · [DECISIONES](docs/DECISIONES.md).

## Aviso legal
La documentación de `legal/` la ha redactado un sistema de IA a partir de fuentes públicas oficiales;
**no sustituye el asesoramiento de un abogado ni de un DPD** y debe revisarse antes de producción.
Ver los `TODO-LEGAL` en [legal/CUMPLIMIENTO.md](legal/CUMPLIMIENTO.md) (en especial, el estado del nuevo
Real Decreto de registro de jornada, no publicado en BOE a 2026-07-13).
