# Contrato de Encargo de Tratamiento

**Artículo 28 del Reglamento (UE) 2016/679 (RGPD)**

En **[DOMICILIO]**, a **[FECHA]**.

## Partes

- **RESPONSABLE DEL TRATAMIENTO:** **[NOMBRE_EMPRESA]**, con CIF **[CIF]** y domicilio en **[DOMICILIO]** (en adelante, el "Responsable").
- **ENCARGADO DEL TRATAMIENTO:** **[NOMBRE_PROVEEDOR]** (y, en su caso, la infraestructura **[HUB_CENTRAL]**), con CIF **[CIF]** y domicilio en **[DOMICILIO]** (en adelante, el "Encargado").

Ambas partes se reconocen capacidad para contratar y acuerdan el presente contrato de encargo de tratamiento conforme al artículo 28 RGPD.

---

## Cláusula 1 — Objeto

El Encargado tratará, por cuenta del Responsable, los datos personales necesarios para la prestación del servicio de **registro de jornada** a través del módulo **"Presentia"** integrado en el software **"Expira"** (mantenimiento, soporte, alojamiento y/o procesamiento técnico según proceda).

## Cláusula 2 — Duración

El presente contrato tendrá vigencia mientras se mantenga la relación de prestación de servicios entre las partes, iniciándose el **[FECHA]** y finalizando con la terminación de dicha relación. A su finalización, el Encargado procederá conforme a la Cláusula 8.

## Cláusula 3 — Naturaleza y finalidad del tratamiento

- **Naturaleza:** tratamiento técnico (alojamiento, mantenimiento, soporte y operación del módulo de registro de jornada), sin que el Encargado emplee los datos para fines propios.
- **Finalidad:** exclusivamente posibilitar el registro diario de jornada del personal del Responsable, en cumplimiento del art. 34.9 del Estatuto de los Trabajadores.

## Cláusula 4 — Tipo de datos personales e interesados

- **Categorías de interesados:** personal (personas trabajadoras) del Responsable.
- **Categorías de datos:** datos de identificación (nombre y apellidos, identificador de empleado, PIN); marcas horarias de entrada, salida y pausas; horas trabajadas; código de registro y metadatos de trazabilidad. **Sin datos biométricos ni de geolocalización. Sin categorías especiales.**

## Cláusula 5 — Obligaciones del Encargado

El Encargado se obliga a:

1. **Tratar los datos únicamente conforme a las instrucciones documentadas del Responsable**, incluidas las relativas a transferencias internacionales; si el Encargado considera que una instrucción infringe la normativa, informará de inmediato al Responsable.
2. **No destinar los datos a finalidad distinta** ni comunicarlos a terceros, salvo autorización legal o del Responsable.
3. Garantizar la **confidencialidad**, asegurando que las personas autorizadas se comprometen a respetarla o están sujetas a deber de confidencialidad.
4. Adoptar las **medidas de seguridad del artículo 32 RGPD** (véase Cláusula 9).
5. **Subencargados:** no recurrir a otro encargado sin autorización previa, por escrito, específica o general, del Responsable; en caso de autorización general, informar de altas/bajas para permitir la oposición. Todo subencargado quedará sujeto a las mismas obligaciones mediante contrato. `TODO-LEGAL`: relacionar aquí los subencargados autorizados (p. ej. proveedor de alojamiento).
6. **Asistir al Responsable** en la respuesta a las solicitudes de ejercicio de derechos de los interesados (arts. 15-22 RGPD) y en el cumplimiento de las obligaciones de los arts. 32 a 36 RGPD (seguridad, notificación de brechas, evaluaciones de impacto y consultas previas), teniendo en cuenta la naturaleza del tratamiento y la información disponible.
7. **Notificar sin dilación indebida** al Responsable las violaciones de seguridad de los datos de las que tenga conocimiento, con la información necesaria.
8. Poner a disposición del Responsable **toda la información necesaria para demostrar el cumplimiento** de sus obligaciones y **permitir y contribuir a auditorías e inspecciones** realizadas por el Responsable o un auditor autorizado.

## Cláusula 6 — Obligaciones del Responsable

Corresponde al Responsable: entregar al Encargado las instrucciones documentadas, velar por el cumplimiento previo y durante el tratamiento, y supervisar el tratamiento.

## Cláusula 7 — Transferencias internacionales

No se prevén transferencias internacionales de datos. `TODO-LEGAL`: si **[HUB_CENTRAL]** o algún subencargado implicase tratamiento fuera del EEE, deberá documentarse la transferencia y las garantías del Capítulo V RGPD (p. ej. cláusulas contractuales tipo).

## Cláusula 8 — Devolución o supresión al finalizar

A la finalización del contrato, y según elija el Responsable, el Encargado:

- **Devolverá** al Responsable los datos personales y las copias existentes, o
- **Suprimirá** los datos personales una vez concluida la prestación,

salvo que la conservación venga exigida por el Derecho de la Unión o de los Estados miembros (por ejemplo, el plazo de 4 años del art. 34.9 ET durante el que el Responsable deba conservar los registros). La supresión se realizará de forma segura.

## Cláusula 9 — Medidas de seguridad (art. 32 RGPD)

El Encargado aplicará, como mínimo, las siguientes medidas coherentes con el sistema:

- **Cifrado de datos en reposo** y **backups cifrados.**
- **Control de acceso por rol** y por identidad, con privilegios mínimos.
- **Auditoría inalterable** mediante cadena de hash (hash-chain) y **registros versionados** que conservan el original (autoría, fecha y motivo de cada cambio).
- Exposición mínima en red: **servidor local en 127.0.0.1**; comunicaciones mediante **TLS** cuando proceda.
- Procedimientos de **copia de seguridad** y de recuperación.
- Capacidad de **exportación** de los datos en CSV y PDF para su devolución.

## Cláusula 10 — Responsabilidad

El incumplimiento del presente contrato podrá dar lugar a las responsabilidades previstas en el artículo 28 y concordantes del RGPD y demás normativa aplicable.

---

Firmado por ambas partes en la fecha indicada.

**El Responsable — [NOMBRE_EMPRESA]**  |  **El Encargado — [NOMBRE_PROVEEDOR]**

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*
