# Presentia — módulo de registro de jornada para Expira

Este repositorio contiene **un único entregable**: el módulo **`presentia-expira/`**,
un módulo de registro de jornada (control horario) listo para integrarse dentro del
software **Expira**. Sin login propio, sin base de datos nueva (solo tablas
`presentia_*` aditivas), heredando empleados, PIN, sesiones y auditoría del host.

> El Presentia original (aplicación **Web-Fichaje**: Laravel + React + MySQL) que vivía
> en `backend/` y `frontend/` **se ha eliminado** tras portar su lógica al módulo. Queda
> archivado y es recuperable con el tag de git `presentia-original-preborrado`
> (`git checkout presentia-original-preborrado`).

## Empieza aquí

Todo vive en **[`presentia-expira/`](presentia-expira/)**:

- **`presentia-expira/ENTREGA.md`** — resumen de entrega, estado y veredicto.
- **`presentia-expira/INTEGRACION-EN-EXPIRA.md`** — procedimiento paso a paso para integrarlo.
- **`presentia-expira/README.md`** — características y uso.
- **`presentia-expira/docs/`** — documentación, manuales y notas de release.
- **`presentia-expira/legal/`** — textos legales (requieren validación profesional).

```bash
cd presentia-expira
npm test           # suite completa
```
