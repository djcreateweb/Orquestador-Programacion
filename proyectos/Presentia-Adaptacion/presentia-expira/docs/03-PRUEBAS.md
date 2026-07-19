# 03 · PRUEBAS (Fase 3)

Verificación del módulo. Runner nativo de Node (`node --test`), **sin frameworks nuevos**, siempre
contra BD **en memoria** (`:memory:`). Ejecutar: `npm test` desde `presentia-expira/`.

## Resultado
**28/28 pruebas en verde, 0 fallos** (duración ~6,5 s). El aviso `ExperimentalWarning: SQLite` es
benigno: `node:sqlite` es una feature integrada de Node ≥ 22 (aquí Node 24.13.1), sin dependencias.

```
ℹ tests 28   ℹ pass 28   ℹ fail 0   ℹ cancelled 0   ℹ skipped 0
```

## Cobertura

### Dominio ([test/domain.test.js](../test/domain.test.js))
- Horas con pausas (dos segmentos), **cruce de medianoche** (2 h correctas).
- **Redondeo** al múltiplo más cercano y 0 = sin redondeo.
- Estado "en curso" cuando falta la salida; `siguienteTipo`.
- **Correlativo** F-AAAA-NNNN: formato y parseo (incl. >9999).
- **Zona horaria**: la fecha de jornada bucketiza en la zona del centro, no en UTC (23:30 UTC → día siguiente en Madrid).
- Rango por defecto = mes en curso.

### Migración ([test/migration.test.js](../test/migration.test.js))
- **Idempotencia**: migrar dos veces no rompe ni duplica ajustes.
- **No destruye** datos preexistentes al re-migrar.
- Todas las tablas con prefijo `presentia_`.
- `conservacionAnios` nunca baja del **mínimo legal (4)**.

### Flujos de negocio ([test/flujos.test.js](../test/flujos.test.js))
- **(a)** entrada → "dentro" en *Hoy* → salida → *Registros* con 240 min y mismo código.
- **(b)** olvido → solicitud → **aprobación** → jornada corregida, `editado`, con el **valor original conservado** (versión en `presentia_marca_versiones`).
- **(b2)** edición directa del admin conserva el valor original (motivo obligatorio).
- **(c)** **rechazo** no cambia nada.
- **(d)** "mostrar en kiosko" desactivado oculta la lista de empleados.
- Informe: "Total del periodo" y exportación **CSV (con BOM)** y **PDF (cabecera `%PDF-`)**.
- "varias marcas/día" desactivado impide reabrir la jornada.

### Seguridad ([test/seguridad.test.js](../test/seguridad.test.js)) — cada test falla si se rompe la propiedad
- **Fuerza bruta de PIN**: bloqueo tras N intentos, auditado, **sin el PIN en el log**; tras el backoff, el PIN correcto funciona.
- **IDOR**: un empleado no puede crear solicitudes sobre la jornada/marca de otro.
- **Autorización por rol**: empleado no accede al Manager; sin sesión tampoco; sólo el técnico verifica la integridad de la auditoría.
- **Sin secretos en respuestas**: ni PIN, ni hashes, ni tokens.
- **Auditoría inalterable**: alterar una línea rompe la cadena de hashes y se detecta.
- **Registros no borrables**: no existe ningún handler de borrado.
- **BD robada**: ninguna tabla del módulo contiene PIN ni hashes en claro.
- **Política de PIN**: rechaza triviales (0000/1234/1111/cortos), acepta razonables.

## Calidad estática
- `node --check` sobre el árbol de `src` sin errores de sintaxis. Cero dependencias ⇒ `npm audit` sin superficie de terceros.

## Alcance no ejecutado (honesto)
- **Frontend (Manager/kiosko):** son componentes React para integrarse en Expira; **no hay app host ni scaffold Vite** en este workspace, por lo que se **revisaron por código** (uso de tokens, contrato de API, antirrebote, sin `dangerouslySetInnerHTML`) pero **no se ejecutaron en navegador**. Verificación end-to-end de UI queda como `TODO-INTEGRACIÓN` en el repo real de Expira.
- **Cifrado en reposo, TLS, CSP y kiosko Electron blindado**: dependen del host (ver [SEGURIDAD.md](SEGURIDAD.md) y [INTEGRACION-EN-EXPIRA.md](INTEGRACION-EN-EXPIRA.md)).
