# Política de Conservación y Supresión — Registro de Jornada ("Presentia" en "Expira")

**Empresa:** [NOMBRE_EMPRESA] — CIF: [CIF] — Domicilio: [DOMICILIO]
**Fecha de la versión:** [FECHA]
**Marco:** Art. 34.9 ET (RDL 8/2019, BOE-A-2019-3481) y art. 5.1 RGPD (limitación del plazo de conservación y minimización)

---

## 1. Objeto

Establecer los plazos de conservación y el procedimiento de supresión de los datos tratados por el módulo de registro de jornada **"Presentia"**, garantizando el cumplimiento del principio de **limitación del plazo de conservación** (art. 5.1.e RGPD) y de **minimización** (art. 5.1.c RGPD), sin menoscabo de la obligación legal de conservación.

## 2. Plazos de conservación

| Tipo de dato / registro | Plazo | Fundamento |
|---|---|---|
| **Registros de jornada** (marcas de entrada/salida y pausas, horas, código F-AAAA-NNNN) | **4 años** | Art. 34.9 del Estatuto de los Trabajadores. |
| **Historial de modificaciones / versiones** (autoría, fecha, motivo de correcciones) | Vinculado al registro correspondiente: **4 años** (se propone alinearlo con la conservación del registro de jornada) | Minimización y limitación del plazo (art. 5.1.c y e RGPD). `TODO-LEGAL`: validar. |
| **Auditoría encadenada por hash (hash-chain), logs y sesiones** | **Criterio propuesto: 4 años**, alineados con la conservación del registro de jornada, para preservar la integridad y trazabilidad de los registros durante todo su periodo de vida legal | Minimización y limitación del plazo (art. 5.1.c y e RGPD). `TODO-LEGAL`: validar este plazo con el DPD/asesoría; podría fijarse un plazo menor para logs puramente técnicos si se justifica. |
| **Copias de seguridad (backups) cifradas** | Conforme al ciclo de rotación de backups, sin exceder la finalidad; los datos suprimidos del sistema activo se eliminarán de los backups en el siguiente ciclo de purga | Minimización (art. 5.1.c RGPD). `TODO-LEGAL`: fijar el periodo de rotación concreto. |

> **Justificación del criterio propuesto para auditoría/logs:** dado que la finalidad de la auditoría hash-chain es garantizar la **inalterabilidad y trazabilidad** de los registros de jornada, resulta coherente conservarla **el mismo tiempo que el registro al que da integridad (4 años)**. Un plazo inferior debilitaría la prueba de integridad; un plazo superior sería difícil de justificar frente al principio de minimización. Este criterio debe ser **validado** por el DPD o la asesoría (`TODO-LEGAL`).

## 3. Principio de no borrado sin rastro durante el periodo de conservación

Durante el plazo de conservación (4 años), **los registros no se borran ni se alteran sin rastro**:

- Las correcciones se realizan **solo mediante solicitud aprobada por el administrador** y generan **nuevas versiones** que conservan el dato original.
- La **cadena de hash** enlaza los eventos de forma que cualquier manipulación sería detectable.
- No existe edición ni eliminación libre de registros dentro del periodo de conservación.

Esto garantiza que los registros permanezcan **a disposición de los trabajadores, la RLT y la Inspección de Trabajo** durante todo el plazo legal.

## 4. Procedimiento de purga controlada y auditada (tras el plazo)

Transcurrido el plazo de conservación aplicable, la supresión se realizará conforme al siguiente procedimiento:

1. **Identificación:** selección de los registros cuyo plazo de 4 años haya vencido, por fecha de la jornada.
2. **Autorización:** la purga debe ser **autorizada por el administrador/responsable** (o el DPD, si procede). No es un borrado automático sin control.
3. **Ejecución de la supresión** de forma **segura** (borrado que impida la recuperación) sobre el sistema activo, incluyendo, en el siguiente ciclo de rotación, las **copias de seguridad**.
4. **Registro de la purga:** cada operación de purga queda **auditada** (qué se suprimió, cuándo, por quién y bajo qué autorización), dejando constancia de la actuación aunque los datos personales concretos ya no se conserven.
5. **Alternativa de bloqueo:** cuando proceda mantener los datos bloqueados por posibles responsabilidades, se aplicará el **bloqueo** (limitación del tratamiento, art. 18 RGPD) en lugar del borrado inmediato. `TODO-LEGAL`: determinar si aplica bloqueo y su plazo.

## 5. Derechos de los interesados

La supresión anticipada solicitada por un trabajador (art. 17 RGPD) queda **limitada por la obligación legal** de conservar el registro de jornada durante 4 años (art. 34.9 ET). Fuera de dicha obligación, se atenderán los derechos conforme a los arts. 15-22 RGPD, según lo indicado en la cláusula informativa.

## 6. Revisión

Esta política se revisará periódicamente y, en todo caso, cuando se publique el nuevo Real Decreto de desarrollo del registro de jornada. `TODO-LEGAL`: a fecha **2026-07-13**, dicho RD **no está publicado en el BOE** y se encuentra **en tramitación** (dictamen desfavorable del Consejo de Estado de 23/03/2026); reverificar y actualizar los plazos si la nueva norma los modifica.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*
