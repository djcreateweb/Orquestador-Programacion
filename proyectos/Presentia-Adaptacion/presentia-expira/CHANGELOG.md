# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Versionado semántico.

## [1.0.0] — 2026-07-14

Primera versión de **producción**: módulo de registro de jornada integrable en Expira,
sin datos de demostración, endurecido y empaquetado para su integración.

### Añadido
- **Núcleo de fichaje**: entrada/salida por PIN (verificado por Expira), pausas, código
  correlativo `F-AAAA-NNNN`, cálculo de horas con redondeo configurable.
- **Manager** (6 pestañas): Hoy · Registros · Informe de horas · Solicitudes · Ajustes · Legal.
- **Kiosko** «Fichar»: PIN → reloj → botón único (verde entrada / rojo salida), consulta y
  exportación de los registros propios.
- **Correcciones**: solicitudes del empleado + aprobación del admin; edición directa del
  admin. Todo **versionado** (conserva el original) y **auditado** (cadena de hash).
- **Legal en la app**: los 10 documentos de `legal/` se muestran en el Manager y (los del
  empleado) en el kiosko, con visor Markdown propio (sin dependencias).
- **Aceptación de términos** obligatoria en el primer acceso, por usuario, auditada.
- **Tema claro / oscuro / automático** (WCAG AA, sin FOUC, respeta `prefers-reduced-motion`).
- **Responsive** mobile-first (tabla→tarjetas, objetivos táctiles, hoja inferior, safe-area).
- **Exportación** CSV (con BOM y neutralización de inyección de fórmulas) y PDF propios.
- **Seguridad**: verificación de PIN en servidor, autorización por endpoint, anti-IDOR,
  bloqueo/backoff, auditoría inalterable, cero secretos en logs/BD, cero dependencias nuevas.
- **Auditoría funcional** (`auditoria/`) y **documentación** completa (`docs/`, `legal/`).

### Corregido (durante la adaptación/auditoría)
- Turnos de noche: la salida tras medianoche cierra la jornada de entrada (no crea otra).
- Inyección de fórmulas (CSV injection) neutralizada en la exportación.
- Render fiel de los documentos legales (bloques de código y saltos de línea).

### Eliminado
- **Presentia original** (`backend/` Laravel + `frontend/` React) — archivado en el tag
  `presentia-original-preborrado`, recuperable.

### Seguridad / endurecimiento
- `reference-env` y la semilla de auditoría **fallan** con `NODE_ENV=production`.
- Instalación limpia: base vacía, **cero** usuarios/PIN/fichajes por defecto; solo la
  configuración por defecto de `presentia_ajustes`.

### Pendiente para integración (ver INTEGRACION-EN-EXPIRA.md / ENTREGA.md)
- Regresión contra la Expira real (C11), validación visual en hardware, revisión legal
  por abogado/DPD y confirmación del estado del RD de registro de jornada.
