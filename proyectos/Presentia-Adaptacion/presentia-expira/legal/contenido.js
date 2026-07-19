// contenido.js — GENERADO por legal/generar-contenido.mjs. NO editar a mano.
// Fuente única: legal/*.md. Regenerar con: npm run legal:build
// Documentos legales del módulo, embebidos para renderizarse en el Manager y el kiosko.

export const ORDEN_CATEGORIAS = ["Protección de datos","Legales","Cumplimiento"];

export const DOCUMENTOS = [
  {
    id: "clausula-informativa",
    archivo: "CLAUSULA-INFORMATIVA-EMPLEADOS.md",
    titulo: "Información para el personal",
    categoria: "Protección de datos",
    empleado: true,
    markdown: `# Cláusula Informativa para el Personal — Registro de Jornada (Módulo "Presentia" en "Expira")

**Información sobre protección de datos personales (artículos 13 y 14 del Reglamento (UE) 2016/679, RGPD)**

Responsable del tratamiento: **[NOMBRE_EMPRESA]**
CIF: **[CIF]**
Domicilio: **[DOMICILIO]**
Delegado de Protección de Datos (en su caso): **[EMAIL_DPD]**
Fecha de la versión: **[FECHA]**

---

## 1. ¿Quién trata sus datos?

El responsable del tratamiento de sus datos personales es **[NOMBRE_EMPRESA]**, con CIF **[CIF]** y domicilio en **[DOMICILIO]**. Puede contactar con el Delegado de Protección de Datos, si ha sido designado, en **[EMAIL_DPD]**.

## 2. ¿Con qué finalidad tratamos sus datos?

Tratamos sus datos con la única finalidad de **registrar diariamente su jornada laboral**, dejando constancia del horario concreto de inicio y de fin de su jornada, así como de las pausas cuando proceda. Este registro permite acreditar el cumplimiento de la jornada de trabajo pactada y de la normativa laboral aplicable.

El registro de jornada se realiza a través del módulo **"Presentia"** integrado en el software **"Expira"**, mediante un sistema de fichaje por kiosko con **código PIN personal**.

> **El sistema NO utiliza datos biométricos** (huella dactilar, reconocimiento facial u otros) **ni datos de geolocalización.** El fichaje se basa exclusivamente en la identificación mediante PIN y en las marcas horarias de entrada y salida.

## 3. ¿Cuál es la base jurídica que legitima el tratamiento?

La base jurídica es el **cumplimiento de una obligación legal** aplicable al responsable (**artículo 6.1.c del RGPD**), en concreto la obligación de registro diario de la jornada establecida en el **artículo 34.9 del Estatuto de los Trabajadores** (redacción dada por el Real Decreto-ley 8/2019, de 8 de marzo — BOE-A-2019-3481).

Al tratarse de una obligación legal, **el tratamiento no depende de su consentimiento** y el registro de jornada es de cumplimiento obligatorio.

## 4. ¿Qué categorías de datos tratamos?

Únicamente los datos necesarios para el registro de jornada (principio de minimización, artículo 5.1.c RGPD):

- **Datos de identificación** del trabajador (nombre y apellidos, identificador interno de empleado y/o PIN asignado).
- **Marcas horarias** de entrada y de salida, así como de inicio y fin de pausas.
- **Horas** trabajadas y su cómputo resultante.
- Metadatos técnicos asociados al registro (código de registro de jornada, fecha, y trazabilidad de eventuales correcciones).

**No se tratan datos biométricos ni de geolocalización.** No se recogen categorías especiales de datos (artículo 9 RGPD).

## 5. ¿Durante cuánto tiempo conservamos sus datos?

Los registros de jornada se conservan durante **cuatro (4) años**, plazo establecido en el artículo 34.9 del Estatuto de los Trabajadores, durante el cual permanecen a disposición de las personas trabajadoras, de la representación legal de las personas trabajadoras (RLT) y de la Inspección de Trabajo y Seguridad Social (ITSS).

Transcurrido dicho plazo, los datos se suprimen o bloquean conforme a la Política de Conservación y Supresión del responsable.

## 6. ¿A quién comunicamos sus datos (destinatarios)?

Sus datos podrán ponerse a disposición o comunicarse a:

- La **Inspección de Trabajo y Seguridad Social (ITSS)**, cuando lo requiera en ejercicio de sus funciones.
- La **representación legal de las personas trabajadoras (RLT)**, en los términos legalmente previstos.
- **Encargados del tratamiento** que prestan servicios al responsable (por ejemplo, el proveedor tecnológico **[NOMBRE_PROVEEDOR]** y, en su caso, la infraestructura de **[HUB_CENTRAL]**), que tratan los datos por cuenta del responsable y conforme a un contrato de encargo de tratamiento (artículo 28 RGPD).

**No están previstas transferencias internacionales de datos.** En caso de que **[HUB_CENTRAL]** implicase un tratamiento fuera del Espacio Económico Europeo, se aplicarían las garantías previstas en el Capítulo V del RGPD. \`TODO-LEGAL\`: verificar si aplica y, en su caso, detallar las garantías.

## 7. ¿Cuáles son sus derechos?

Puede ejercer los siguientes derechos:

- **Acceso** (artículo 15 RGPD): conocer qué datos tratamos.
- **Rectificación** (artículo 16 RGPD): corregir datos inexactos.
- **Supresión** (artículo 17 RGPD), con los límites derivados de la obligación legal de conservación durante 4 años.
- **Limitación** del tratamiento (artículo 18 RGPD).
- **Portabilidad** (artículo 20 RGPD), cuando resulte aplicable.
- **Oposición** (artículo 21 RGPD), cuando resulte aplicable.

Además, como trabajador **puede acceder en cualquier momento a sus propios registros de jornada y obtener una copia de ellos** a través del propio módulo "Presentia" (con exportación en formato **CSV** y **PDF**).

**Cómo ejercerlos:** puede dirigir su solicitud a **[NOMBRE_EMPRESA]**, en el domicilio **[DOMICILIO]**, o al Delegado de Protección de Datos en **[EMAIL_DPD]**, acreditando su identidad.

## 8. Derecho a reclamar ante la autoridad de control

Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante la **Agencia Española de Protección de Datos (AEPD)** — www.aepd.es.

## 9. Derecho a la desconexión digital

Le recordamos que tiene derecho a la **desconexión digital** fuera de su tiempo de trabajo, en los términos del **artículo 88 de la Ley Orgánica 3/2018 (LOPDGDD)** y de la política de desconexión de la empresa. El registro de jornada no ampara ni justifica requerimientos de disponibilidad fuera del horario de trabajo registrado.

---

## Anexo — Texto breve mostrado en el kiosko (primer fichaje)

> **Protección de datos — Registro de jornada**
>
> **[NOMBRE_EMPRESA]** registra su hora de entrada y salida para cumplir la obligación legal de registro de jornada (art. 34.9 del Estatuto de los Trabajadores; base jurídica: art. 6.1.c RGPD).
>
> Solo se usan su identificación y las marcas horarias. **No se usan huella, cara ni ubicación (sin biometría ni geolocalización).**
>
> Los datos se conservan 4 años y estarán a su disposición, la de sus representantes y la de la Inspección de Trabajo. Puede consultar y descargar sus propios registros, ejercer sus derechos (acceso, rectificación, etc.) y reclamar ante la AEPD.
>
> Más información en la cláusula informativa completa. [Aceptar / He leído la información]

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "privacidad",
    archivo: "POLITICA-DE-PRIVACIDAD.md",
    titulo: "Política de privacidad",
    categoria: "Protección de datos",
    empleado: true,
    markdown: `# Política de Privacidad

**Módulo de Registro de Jornada «Presentia» — integrado en el software «Expira»**

*Última actualización: 13 de julio de 2026*

---

## 1. Responsable del tratamiento

- **Responsable:** [NOMBRE_EMPRESA]
- **CIF / NIF:** [CIF]
- **Domicilio:** [DOMICILIO]
- **Contacto en materia de protección de datos (DPD, si procede):** [EMAIL_DPD]

[NOMBRE_EMPRESA], como empleadora, es la **responsable del tratamiento** de los datos personales derivados del registro de jornada. El proveedor del software ([NOMBRE_PROVEEDOR]) y el Hub central ([HUB_CENTRAL]) actúan como **encargados del tratamiento**, con quienes se suscribe el correspondiente contrato de encargo conforme al **artículo 28 del RGPD**. El responsable mantiene el **registro de actividades de tratamiento** exigido por el **artículo 30 del RGPD**.

*Referencia normativa: Reglamento (UE) 2016/679 (RGPD), EUR-Lex CELEX 32016R0679 (https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679); Ley Orgánica 3/2018 (LOPDGDD), BOE-A-2018-16673 (https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673).*

## 2. Finalidad del tratamiento

La única finalidad del tratamiento es **dar cumplimiento a la obligación legal de registro diario de la jornada** de los trabajadores, establecida en el artículo 34.9 del Estatuto de los Trabajadores (introducido por el RDL 8/2019, BOE-A-2019-3481, exigible desde el 12 de mayo de 2019).

El sistema registra el horario concreto de inicio y fin de la jornada de cada trabajador. **En ningún caso** el tratamiento tiene por finalidad la **vigilancia encubierta** ni el control de la actividad más allá de lo estrictamente necesario para cumplir dicha obligación legal, en aplicación de los principios de **minimización, limitación de la finalidad y exactitud** (art. 5.1 RGPD).

## 3. Base jurídica

La base jurídica del tratamiento es el **cumplimiento de una obligación legal** aplicable al responsable, conforme al **artículo 6.1.c) del RGPD**, en relación con el artículo 34.9 del Estatuto de los Trabajadores.

**No se basa en el consentimiento** del trabajador, por lo que su retirada no es aplicable como mecanismo para cesar el tratamiento, sin perjuicio de los derechos que se detallan más abajo.

## 4. Categorías de datos tratados

Se tratan únicamente los datos estrictamente necesarios:

- Datos **identificativos del trabajador** (los necesarios para asociar el registro a la persona).
- **Marcas de entrada y salida** y **horas** de la jornada.

**No** se tratan datos biométricos ni datos de **geolocalización**:

- **Sin biometría.** El uso de sistemas biométricos como fichaje ordinario está desaconsejado/prohibido con carácter general por la Agencia Española de Protección de Datos («Guía sobre tratamientos de control de presencia mediante sistemas biométricos», de 23 de noviembre de 2023, basada en el Dictamen 1/2023 del CEPD; art. 9 RGPD). Guía: https://www.aepd.es/guias/guia-control-presencia-biometrico.pdf
- **Sin geolocalización.** Por el principio de proporcionalidad (art. 5.1.c RGPD) y el derecho a la intimidad frente a dispositivos de geolocalización (art. 90 LOPDGDD), en un kiosco fijo situado en la cocina la geolocalización es innecesaria.

Asimismo, se respeta el **derecho a la desconexión digital** de los trabajadores (art. 88 LOPDGDD).

## 5. Integridad y trazabilidad de los registros

Los registros son **inalterables y versionados**, y cuentan con una **auditoría encadenada mediante huella (hash)** que garantiza la trazabilidad de cualquier modificación, en coherencia con el principio de **exactitud** (art. 5.1 RGPD). El sistema permite la **exportación** de los registros en formato **CSV y PDF**.

## 6. Destinatarios de los datos

Los datos podrán ponerse a disposición de:

- La **Inspección de Trabajo y Seguridad Social (ITSS)**.
- Los **representantes legales de los trabajadores (RLT)**.
- El propio **trabajador**, que puede acceder a sus propios registros.

Como **encargados del tratamiento** (que acceden a los datos por cuenta del responsable, no como destinatarios con fines propios) intervienen el proveedor del software ([NOMBRE_PROVEEDOR]) y el Hub central ([HUB_CENTRAL]), regulados mediante contrato de encargo (art. 28 RGPD).

No se prevén transferencias internacionales de datos. \`TODO-LEGAL\`: confirmar la ubicación de alojamiento de los datos y, en su caso, la existencia de transferencias internacionales y sus garantías, extremo no determinado en la información verificada disponible.

## 7. Plazo de conservación

Los registros de jornada se conservan durante **4 años**, conforme al artículo 34.9 del Estatuto de los Trabajadores, período durante el cual deben permanecer a disposición de los trabajadores, de sus representantes y de la Inspección de Trabajo.

## 8. Derechos de las personas interesadas

Con carácter previo al tratamiento, se informa a los trabajadores conforme a los **artículos 13 y 14 del RGPD**.

Los trabajadores pueden ejercer los derechos de **acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad** (artículos 15 a 22 del RGPD), teniendo en cuenta que, al basarse el tratamiento en una obligación legal, algunos de estos derechos (como la supresión o la oposición) pueden verse limitados mientras subsista dicha obligación.

**Cómo ejercerlos:** mediante comunicación dirigida a [NOMBRE_EMPRESA] a través del correo [EMAIL_DPD], acreditando la identidad del solicitante.

## 9. Reclamación ante la autoridad de control

Si una persona considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante la **Agencia Española de Protección de Datos (AEPD)**, con domicilio en C/ Jorge Juan, 6, 28001 Madrid, y sede electrónica en **www.aepd.es**.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "conservacion",
    archivo: "POLITICA-DE-CONSERVACION-Y-SUPRESION.md",
    titulo: "Conservación y supresión",
    categoria: "Protección de datos",
    empleado: false,
    markdown: `# Política de Conservación y Supresión — Registro de Jornada ("Presentia" en "Expira")

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
| **Historial de modificaciones / versiones** (autoría, fecha, motivo de correcciones) | Vinculado al registro correspondiente: **4 años** (se propone alinearlo con la conservación del registro de jornada) | Minimización y limitación del plazo (art. 5.1.c y e RGPD). \`TODO-LEGAL\`: validar. |
| **Auditoría encadenada por hash (hash-chain), logs y sesiones** | **Criterio propuesto: 4 años**, alineados con la conservación del registro de jornada, para preservar la integridad y trazabilidad de los registros durante todo su periodo de vida legal | Minimización y limitación del plazo (art. 5.1.c y e RGPD). \`TODO-LEGAL\`: validar este plazo con el DPD/asesoría; podría fijarse un plazo menor para logs puramente técnicos si se justifica. |
| **Copias de seguridad (backups) cifradas** | Conforme al ciclo de rotación de backups, sin exceder la finalidad; los datos suprimidos del sistema activo se eliminarán de los backups en el siguiente ciclo de purga | Minimización (art. 5.1.c RGPD). \`TODO-LEGAL\`: fijar el periodo de rotación concreto. |

> **Justificación del criterio propuesto para auditoría/logs:** dado que la finalidad de la auditoría hash-chain es garantizar la **inalterabilidad y trazabilidad** de los registros de jornada, resulta coherente conservarla **el mismo tiempo que el registro al que da integridad (4 años)**. Un plazo inferior debilitaría la prueba de integridad; un plazo superior sería difícil de justificar frente al principio de minimización. Este criterio debe ser **validado** por el DPD o la asesoría (\`TODO-LEGAL\`).

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
5. **Alternativa de bloqueo:** cuando proceda mantener los datos bloqueados por posibles responsabilidades, se aplicará el **bloqueo** (limitación del tratamiento, art. 18 RGPD) en lugar del borrado inmediato. \`TODO-LEGAL\`: determinar si aplica bloqueo y su plazo.

## 5. Derechos de los interesados

La supresión anticipada solicitada por un trabajador (art. 17 RGPD) queda **limitada por la obligación legal** de conservar el registro de jornada durante 4 años (art. 34.9 ET). Fuera de dicha obligación, se atenderán los derechos conforme a los arts. 15-22 RGPD, según lo indicado en la cláusula informativa.

## 6. Revisión

Esta política se revisará periódicamente y, en todo caso, cuando se publique el nuevo Real Decreto de desarrollo del registro de jornada. \`TODO-LEGAL\`: a fecha **2026-07-13**, dicho RD **no está publicado en el BOE** y se encuentra **en tramitación** (dictamen desfavorable del Consejo de Estado de 23/03/2026); reverificar y actualizar los plazos si la nueva norma los modifica.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "encargo",
    archivo: "CONTRATO-ENCARGADO-TRATAMIENTO.md",
    titulo: "Contrato de encargo de tratamiento",
    categoria: "Protección de datos",
    empleado: false,
    markdown: `# Contrato de Encargo de Tratamiento

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
5. **Subencargados:** no recurrir a otro encargado sin autorización previa, por escrito, específica o general, del Responsable; en caso de autorización general, informar de altas/bajas para permitir la oposición. Todo subencargado quedará sujeto a las mismas obligaciones mediante contrato. \`TODO-LEGAL\`: relacionar aquí los subencargados autorizados (p. ej. proveedor de alojamiento).
6. **Asistir al Responsable** en la respuesta a las solicitudes de ejercicio de derechos de los interesados (arts. 15-22 RGPD) y en el cumplimiento de las obligaciones de los arts. 32 a 36 RGPD (seguridad, notificación de brechas, evaluaciones de impacto y consultas previas), teniendo en cuenta la naturaleza del tratamiento y la información disponible.
7. **Notificar sin dilación indebida** al Responsable las violaciones de seguridad de los datos de las que tenga conocimiento, con la información necesaria.
8. Poner a disposición del Responsable **toda la información necesaria para demostrar el cumplimiento** de sus obligaciones y **permitir y contribuir a auditorías e inspecciones** realizadas por el Responsable o un auditor autorizado.

## Cláusula 6 — Obligaciones del Responsable

Corresponde al Responsable: entregar al Encargado las instrucciones documentadas, velar por el cumplimiento previo y durante el tratamiento, y supervisar el tratamiento.

## Cláusula 7 — Transferencias internacionales

No se prevén transferencias internacionales de datos. \`TODO-LEGAL\`: si **[HUB_CENTRAL]** o algún subencargado implicase tratamiento fuera del EEE, deberá documentarse la transferencia y las garantías del Capítulo V RGPD (p. ej. cláusulas contractuales tipo).

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

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "rat",
    archivo: "REGISTRO-ACTIVIDADES-TRATAMIENTO.md",
    titulo: "Registro de actividades (RAT)",
    categoria: "Protección de datos",
    empleado: false,
    markdown: `# Registro de Actividades de Tratamiento (RAT) — Responsable

**Artículo 30 del Reglamento (UE) 2016/679 (RGPD)**
**Actividad de tratamiento: "Registro de jornada"**

Fecha de la versión: **[FECHA]**

---

## Ficha de la actividad de tratamiento

| Campo | Contenido |
|---|---|
| **Denominación de la actividad** | Registro de jornada del personal |
| **Responsable del tratamiento** | [NOMBRE_EMPRESA] |
| **CIF** | [CIF] |
| **Domicilio** | [DOMICILIO] |
| **Contacto / DPD** | [EMAIL_DPD] |
| **Fines del tratamiento** | Cumplimiento de la obligación legal de registro diario de jornada: dejar constancia del horario concreto de inicio y fin de la jornada de cada persona trabajadora, cómputo de horas y puesta a disposición de trabajadores, RLT e Inspección de Trabajo. |
| **Base jurídica** | Cumplimiento de una obligación legal (**art. 6.1.c RGPD**), en relación con el **art. 34.9 del Estatuto de los Trabajadores** (RDL 8/2019, BOE-A-2019-3481). |
| **Categorías de interesados** | Personal de [NOMBRE_EMPRESA] (personas trabajadoras por cuenta ajena). |
| **Categorías de datos personales** | Datos de identificación (nombre y apellidos, identificador de empleado, PIN); marcas horarias de entrada, salida y pausas; horas trabajadas; código de registro (F-AAAA-NNNN) y metadatos de trazabilidad de correcciones (autoría, fecha, motivo). **SIN datos biométricos. SIN datos de geolocalización. Sin categorías especiales (art. 9 RGPD).** |
| **Categorías de destinatarios** | Inspección de Trabajo y Seguridad Social (ITSS); representación legal de las personas trabajadoras (RLT); encargados del tratamiento ([NOMBRE_PROVEEDOR] y, en su caso, [HUB_CENTRAL]). |
| **Transferencias internacionales** | No previstas. \`TODO-LEGAL\`: si [HUB_CENTRAL] implicase tratamiento fuera del EEE, documentar la transferencia y las garantías del Capítulo V RGPD. |
| **Plazos de supresión** | Registros de jornada: **4 años** (art. 34.9 ET). Auditoría/logs asociados: conforme a la Política de Conservación y Supresión. Véase apartado de plazos. |
| **Medidas de seguridad (técnicas y organizativas)** | Ver detalle abajo (art. 32 RGPD). |

---

## Detalle de las medidas técnicas y organizativas (art. 32 RGPD)

**Técnicas:**

- **Cifrado de datos en reposo.**
- **Copias de seguridad (backups) cifradas.**
- **Control de acceso por rol** (trabajador, RLT, administrador), con acceso del trabajador limitado a sus propios registros.
- **Auditoría inalterable** de eventos y modificaciones mediante **cadena de hash (hash-chain)**; los registros son **versionados** y conservan el dato original; el historial guarda autoría, fecha y motivo de cada cambio.
- **Servidor local escuchando en 127.0.0.1** (interfaz de loopback), minimizando la exposición en red.
- Comunicaciones protegidas mediante **TLS** cuando el acceso se realice fuera del propio equipo. \`TODO-LEGAL\`: confirmar la configuración TLS en el despliegue concreto.
- **Exportación controlada** en formatos CSV y PDF.

**Organizativas:**

- Correcciones únicamente mediante **solicitud aprobada por el administrador** (no hay edición libre).
- Deber de **confidencialidad** del personal con acceso.
- **Contrato de encargo de tratamiento (art. 28 RGPD)** con los proveedores/encargados.
- **Información previa** a las personas trabajadoras (arts. 13-14 RGPD) mediante cláusula informativa.
- **Política de conservación y supresión** documentada.

---

## Notas

- Este RAT documenta una sola actividad ("Registro de jornada"). Otras actividades de tratamiento de [NOMBRE_EMPRESA] deben registrarse en fichas independientes.
- **Evaluación de impacto (art. 35 RGPD):** al no emplearse biometría ni geolocalización y limitarse a un tratamiento de datos identificativos y horarios basado en obligación legal, no se aprecia a priori un tratamiento de alto riesgo que exija EIPD. \`TODO-LEGAL\`: valorar y documentar el análisis de necesidad de EIPD según las circunstancias concretas de la organización.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "aviso-legal",
    archivo: "AVISO-LEGAL.md",
    titulo: "Aviso legal",
    categoria: "Legales",
    empleado: false,
    markdown: `# Aviso Legal

**Módulo de Registro de Jornada «Presentia» — integrado en el software «Expira»**

*Última actualización: 13 de julio de 2026*

---

## 1. Información general (art. 10 LSSI-CE)

En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE) (BOE-A-2002-13758, https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758), se ponen a disposición de los usuarios los siguientes datos identificativos del titular:

- **Titular / Responsable de la explotación:** [NOMBRE_EMPRESA]
- **CIF / NIF:** [CIF]
- **Domicilio:** [DOMICILIO]
- **Correo electrónico de contacto:** [EMAIL_DPD]
- **Proveedor del software:** [NOMBRE_PROVEEDOR]
- **Infraestructura central de integración:** [HUB_CENTRAL]

> Nota: El módulo «Presentia» es una herramienta de uso interno instalada en un establecimiento de restauración (kiosco fijo de cocina y panel de gestión «Manager»). No constituye, por sí mismo, un sitio web público ni un servicio dirigido al público general. La presente información se facilita a efectos de transparencia respecto de las personas usuarias del sistema (trabajadores, administración del local y personal técnico).

## 2. Objeto del software

«Expira» es la plataforma de gestión sobre la que se integra el módulo «Presentia». El módulo «Presentia» tiene como finalidad exclusiva permitir el **registro diario de la jornada laboral** de los trabajadores del establecimiento, dando cumplimiento a la obligación legal establecida en el artículo 34.9 del Estatuto de los Trabajadores, introducido por el Real Decreto-ley 8/2019, de 8 de marzo (BOE-A-2019-3481, https://www.boe.es/buscar/doc.php?id=BOE-A-2019-3481), exigible desde el 12 de mayo de 2019.

Características técnicas relevantes del módulo:

- Registro diario del horario concreto de **inicio y fin** de cada trabajador.
- **No** utiliza sistemas biométricos de ningún tipo para el fichaje.
- **No** utiliza geolocalización.
- Los registros son **inalterables y versionados**, con auditoría encadenada mediante huella (hash), de modo que cualquier modificación queda trazada.
- Permite la **exportación** de los registros en formato CSV y PDF.
- Cada trabajador puede **acceder a sus propios registros**.
- Conservación de los registros durante **4 años**.

## 3. Condiciones generales de acceso y uso

El acceso y la utilización del módulo «Presentia» quedan reservados al personal autorizado por [NOMBRE_EMPRESA] conforme a los roles definidos en el sistema (empleado, administrador del local y técnico). El usuario se compromete a hacer un uso diligente, correcto y lícito de la herramienta, de conformidad con la legislación vigente, el presente Aviso Legal y los Términos y Condiciones (EULA) aplicables.

Queda prohibida cualquier utilización del sistema con fines distintos del registro de jornada, así como todo intento de manipulación, alteración o falseamiento de los registros.

## 4. Propiedad intelectual e industrial

El software «Expira», el módulo «Presentia», su código fuente, diseño, interfaces, estructura y demás elementos son titularidad de [NOMBRE_PROVEEDOR] o de quien ostente los correspondientes derechos, y se encuentran protegidos por la normativa sobre propiedad intelectual e industrial. La licencia de uso concedida a [NOMBRE_EMPRESA] no implica cesión de titularidad alguna sobre dichos derechos, en los términos previstos en los Términos y Condiciones (EULA).

Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra forma de explotación del software o de sus componentes sin la autorización expresa de sus titulares.

## 5. Exención y limitación de responsabilidad

[NOMBRE_EMPRESA] y [NOMBRE_PROVEEDOR] procuran que el sistema funcione de forma continuada y correcta, pero no pueden garantizar la ausencia total de interrupciones o errores derivados de causas ajenas a su control (fallos de suministro eléctrico, de conectividad, de hardware del kiosco, fuerza mayor u otras).

La responsabilidad sobre la exactitud, veracidad e integridad de los datos introducidos, así como sobre el cumplimiento de las obligaciones laborales asociadas al registro de jornada, corresponde a [NOMBRE_EMPRESA] en su condición de empleadora y responsable del tratamiento, en los términos detallados en los Términos y Condiciones y en la Política de Privacidad.

## 6. Protección de datos

El tratamiento de datos personales derivado del uso del módulo «Presentia» se rige por la **Política de Privacidad** del sistema, a la que se remite expresamente este Aviso Legal. La base jurídica del tratamiento es el cumplimiento de una **obligación legal** aplicable al responsable (art. 6.1.c del Reglamento (UE) 2016/679, RGPD), y **no** el consentimiento.

## 7. Legislación aplicable y jurisdicción

El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del sistema, las partes se someten a los Juzgados y Tribunales que resulten competentes conforme a Derecho en España.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "terminos",
    archivo: "TERMINOS-Y-CONDICIONES.md",
    titulo: "Términos y condiciones (EULA)",
    categoria: "Legales",
    empleado: false,
    markdown: `# Términos y Condiciones de Uso (EULA)

**Software «Expira» — Módulo de Registro de Jornada «Presentia»**

*Última actualización: 13 de julio de 2026*

---

## 1. Objeto y aceptación

El presente documento regula las condiciones de uso (licencia de usuario final o *EULA*) del software «Expira» y, en particular, de su módulo de registro de jornada «Presentia» (en adelante, «el Software»), proporcionado por [NOMBRE_PROVEEDOR] (en adelante, «el Proveedor») a [NOMBRE_EMPRESA] (en adelante, «el Cliente»).

El uso del Software implica la aceptación plena de estos Términos y Condiciones. Deben leerse conjuntamente con el Aviso Legal y la Política de Privacidad.

## 2. Licencia de uso

El Proveedor concede al Cliente una licencia de uso del Software de carácter **no exclusivo, intransferible y limitada** a la finalidad de registro de la jornada laboral de los trabajadores del establecimiento, conforme al artículo 34.9 del Estatuto de los Trabajadores (introducido por el RDL 8/2019, BOE-A-2019-3481).

La licencia no supone cesión de la propiedad intelectual o industrial sobre el Software, que permanece en todo momento en titularidad del Proveedor o de quien corresponda. Queda prohibida la ingeniería inversa, descompilación, redistribución o modificación no autorizada del Software, salvo en la medida permitida imperativamente por la ley.

## 3. Roles y perfiles de usuario

El Software opera con los siguientes roles, cuyas capacidades están delimitadas por el sistema:

- **Empleado (\`employee\`):** ficha su entrada y salida y accede a sus propios registros de jornada.
- **Administrador del local (\`local_admin\`):** configura los datos del establecimiento, da de alta y gestiona a los empleados y sus credenciales (PIN), consulta y exporta los registros del local.
- **Técnico (\`technician\`):** realiza tareas de instalación, mantenimiento y soporte técnico del sistema.

El Cliente es responsable de asignar los roles de forma adecuada y de limitar el acceso al personal autorizado.

## 4. Funcionalidades del módulo «Presentia»

El módulo «Presentia» ofrece, entre otras, las siguientes funciones:

- Registro diario del horario concreto de **inicio y fin** de la jornada de cada trabajador.
- Registros **inalterables y versionados**, con **auditoría encadenada mediante huella (hash)** que garantiza la trazabilidad de cualquier modificación.
- **Exportación** de los registros en formatos **CSV y PDF**.
- Acceso del trabajador a sus **propios registros**.
- **Conservación** de los registros durante **4 años**.

El módulo **no** emplea sistemas biométricos ni geolocalización.

## 5. Responsabilidades del Cliente

El Cliente, en su condición de empleador y responsable del tratamiento, asume las siguientes obligaciones:

- **Configurar correctamente** los datos de la empresa y del establecimiento.
- **Gestionar a los empleados** y sus credenciales de acceso (PIN), garantizando su confidencialidad y su actualización.
- **Cumplir sus obligaciones laborales** derivadas del registro de jornada, incluyendo poner los registros a disposición de los trabajadores, de sus representantes legales (RLT) y de la Inspección de Trabajo y Seguridad Social (ITSS), así como conservarlos durante 4 años (art. 34.9 ET).
- **Velar por la exactitud e integridad** de los datos introducidos en el sistema.
- Informar previamente a los trabajadores del tratamiento de sus datos, en los términos de la Política de Privacidad (arts. 13-14 RGPD).

## 6. Soporte y actualizaciones

El Proveedor prestará el soporte técnico y las actualizaciones del Software en los términos que se acuerden entre las partes. \`TODO-LEGAL\`: concretar el alcance, canales, tiempos de respuesta y coste del soporte y de las actualizaciones (SLA), que no se determinan en la información verificada disponible.

Las actualizaciones podrán incluir mejoras de seguridad, correcciones y adaptaciones normativas. En particular, se advierte de que el Real Decreto de desarrollo del registro de jornada, a fecha de 13 de julio de 2026, **no** se encuentra publicado en el BOE y sigue **en tramitación** (dictamen desfavorable del Consejo de Estado de 23 de marzo de 2026); el Software ya implementa el estándar más exigente del borrador. \`TODO-LEGAL\`: reverificar el BOE y actualizar el Software cuando dicho Real Decreto se publique.

## 7. Limitación de responsabilidad

En la medida permitida por la legislación aplicable, el Proveedor no responderá de los daños derivados de:

- Un uso incorrecto, negligente o no autorizado del Software por parte del Cliente o de sus usuarios.
- La introducción de datos inexactos o incompletos por el Cliente.
- Interrupciones o fallos ajenos al control del Proveedor (suministro eléctrico, conectividad, hardware del kiosco, fuerza mayor).
- El incumplimiento por el Cliente de sus obligaciones laborales o de protección de datos.

Nada en estos Términos excluye o limita la responsabilidad que no pueda excluirse o limitarse legalmente.

## 8. Protección de datos

El tratamiento de datos personales se rige por la **Política de Privacidad**, a la que se remite expresamente este documento. El Cliente es **responsable del tratamiento** y el Proveedor y el Hub central ([HUB_CENTRAL]) actúan como **encargados del tratamiento**, por lo que las partes deberán suscribir el correspondiente **contrato de encargo** conforme al artículo 28 del RGPD y mantener el **registro de actividades de tratamiento** del artículo 30 del RGPD.

## 9. Ley aplicable y jurisdicción

Estos Términos y Condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales competentes conforme a Derecho en España.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "cookies",
    archivo: "COOKIES-NO-APLICA.md",
    titulo: "Política de cookies",
    categoria: "Legales",
    empleado: false,
    markdown: `# Política de Cookies — No aplica

**Módulo de Registro de Jornada «Presentia» — integrado en el software «Expira»**

*Última actualización: 13 de julio de 2026*

---

## 1. Conclusión

En el estado actual del módulo «Presentia» y del panel de gestión «Manager» integrados en «Expira», **no procede** mostrar un banner de consentimiento de cookies ni publicar una política de cookies con recabado de consentimiento, por los motivos técnicos y jurídicos que se exponen a continuación.

## 2. Marco jurídico

El artículo **22.2 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)** (BOE-A-2002-13758, https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758) exige el **consentimiento previo, informado y granular** del usuario para el uso de dispositivos de almacenamiento y recuperación de datos (cookies y tecnologías similares), **salvo** cuando dicho almacenamiento o acceso tenga como **finalidad exclusiva** efectuar la transmisión de una comunicación o sea **estrictamente necesario** para prestar el servicio expresamente solicitado por el usuario (excepción de las cookies técnicas).

## 3. Justificación técnica

El sistema utiliza **únicamente almacenamiento técnico estrictamente necesario**, en concreto:

- Una **micro-sesión efímera de kiosco** mantenida en memoria/token, imprescindible para el funcionamiento del propio fichaje en el kiosco.
- La **sesión del propio software «Expira»**, necesaria para el funcionamiento del panel de gestión «Manager».

El sistema **no** utiliza:

- Cookies de **analítica** o medición de audiencia.
- Cookies de **publicidad** o comportamentales.
- Cookies o tecnologías de **seguimiento** de terceros.

Al tratarse de almacenamiento **estrictamente necesario** para prestar el servicio expresamente solicitado por el usuario (el registro de jornada y el acceso al panel), resulta de aplicación la **excepción del art. 22.2 LSSI-CE**, por lo que no se requiere consentimiento ni banner de cookies.

## 4. Advertencia sobre evolución futura

Esta conclusión se limita al estado actual del sistema, concebido como herramienta interna (kiosco fijo de cocina y panel «Manager»), sin una superficie web pública dirigida al público general.

\`TODO-LEGAL\`: Si en el futuro se habilita una **superficie web pública** (por ejemplo, un portal del trabajador accesible por internet, el Hub central [HUB_CENTRAL], una *landing* o cualquier página pública) que incorpore cookies no estrictamente necesarias (analítica, publicidad, seguimiento u otras), será **obligatorio** publicar una **Política de Cookies completa** e implementar un mecanismo de **consentimiento previo, informado y granular** conforme al art. 22.2 LSSI-CE y a las directrices de la AEPD. Este extremo deberá reevaluarse en ese momento.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "protocolo",
    archivo: "PROTOCOLO-REGISTRO-DE-JORNADA.md",
    titulo: "Protocolo de registro de jornada",
    categoria: "Cumplimiento",
    empleado: false,
    markdown: `# Protocolo Interno de Registro de Jornada — Módulo "Presentia" (software "Expira")

**Empresa:** [NOMBRE_EMPRESA] — CIF: [CIF] — Domicilio: [DOMICILIO]
**Fecha de aprobación:** [FECHA]
**Marco legal:** Artículo 34.9 del Estatuto de los Trabajadores (RDL 8/2019, BOE-A-2019-3481)

---

## 1. Objeto y marco legal

El presente protocolo establece la organización y documentación del registro diario de jornada de **[NOMBRE_EMPRESA]**, en cumplimiento del **artículo 34.9 del Estatuto de los Trabajadores**, exigible desde el **12 de mayo de 2019**, que obliga a garantizar el registro diario de jornada, incluyendo el **horario concreto de inicio y de finalización** de la jornada de cada persona trabajadora.

Conforme al artículo 34.9 ET, la organización y documentación del registro se realiza **mediante negociación colectiva o acuerdo de empresa** o, en su defecto, **por decisión del empresario previa consulta con la representación legal de las personas trabajadoras (RLT)**. Véase el apartado 10.

> \`TODO-LEGAL\`: A fecha **2026-07-13**, el nuevo Real Decreto de desarrollo del registro de jornada **NO está publicado en el BOE** y se encuentra **en tramitación** (dictamen desfavorable del Consejo de Estado de 23/03/2026). Este protocolo debe **reverificarse y actualizarse cuando dicho Real Decreto se publique**.

## 2. Sistema utilizado

El registro se realiza mediante el módulo **"Presentia"** integrado en el software **"Expira"**:

- **Fichaje por kiosko** con **código PIN personal** por trabajador.
- **Sin biometría** (no se emplea huella, rostro ni ningún dato biométrico como fichaje ordinario, conforme al criterio de la AEPD — Guía de 23/11/2023 y Dictamen 1/2023).
- **Sin geolocalización** (no se registra la ubicación del trabajador; respeto al artículo 90 LOPDGDD).
- El **servidor local** del sistema escucha en **127.0.0.1** (interfaz de loopback), de modo que el servicio no queda expuesto en red por defecto.
- **Datos cifrados en reposo** y **copias de seguridad (backups) cifradas.**

## 3. Registro de entrada, salida y pausas

- El trabajador ficha su **entrada** al inicio de la jornada y su **salida** al finalizarla, mediante su PIN en el kiosko.
- Las **pausas** (inicio y fin) se registran cuando proceda según la organización del centro.
- La **jornada diaria** se compone, como mínimo, de una marca de **entrada** y una marca de **salida**, quedando registrado el horario concreto de inicio y fin.
- El sistema calcula el cómputo de horas resultante a partir de dichas marcas.

## 4. Identificación de registros — código F-AAAA-NNNN

Cada registro de jornada se identifica con un **código único** con el formato:

\`\`\`
F-AAAA-NNNN
\`\`\`

donde \`AAAA\` es el año y \`NNNN\` es un número correlativo. Este código permite referenciar de forma inequívoca cada jornada en consultas, correcciones, exportaciones y auditorías.

## 5. Correcciones: solo mediante solicitud aprobada

- **No existe edición libre** de los registros. Ningún usuario puede modificar directamente una marca ya registrada.
- Toda corrección se tramita mediante **solicitud** del trabajador (o de quien corresponda), que debe ser **aprobada por el administrador (admin)**.
- Cada corrección aprobada genera una **nueva versión** del registro que **conserva el dato original**, junto con la **autoría, la fecha y el motivo** de la modificación.

## 6. Inalterabilidad y trazabilidad

- Los registros son **inalterables y versionados**: las modificaciones no sobrescriben el original, sino que se acumulan como historial.
- El sistema mantiene una **auditoría encadenada por hash (hash-chain)**: cada evento/versión se enlaza criptográficamente con el anterior, de modo que cualquier alteración posterior sería **detectable**.
- El **historial de modificaciones** conserva, para cada cambio, **quién** lo realizó (autoría), **cuándo** (fecha) y **por qué** (motivo).
- Durante el periodo de conservación, **los registros no se borran sin rastro** (véase la Política de Conservación y Supresión).

## 7. Acceso a los registros

De conformidad con el artículo 34.9 ET, los registros permanecen a disposición de:

- Las **personas trabajadoras**: cada trabajador puede **acceder a sus propios registros y obtener copia** de ellos.
- La **representación legal de las personas trabajadoras (RLT)**.
- La **Inspección de Trabajo y Seguridad Social (ITSS)**.

El acceso se realiza mediante **control de acceso por rol** dentro del sistema.

## 8. Exportación

Los registros pueden exportarse en formato **CSV** y **PDF**, tanto para su consulta y entrega al trabajador como para su puesta a disposición de la RLT y de la Inspección de Trabajo.

## 9. Conservación

Los registros de jornada se conservan durante **cuatro (4) años**, conforme al artículo 34.9 ET, permaneciendo a disposición de trabajadores, RLT e ITSS durante todo ese periodo. La supresión posterior se rige por la Política de Conservación y Supresión.

## 10. Consulta a la representación legal de las personas trabajadoras (RLT)

Este protocolo se adopta, según proceda, mediante acuerdo de empresa o, en su defecto, por decisión de **[NOMBRE_EMPRESA]** **previa consulta a la RLT**, conforme al artículo 34.9 ET.

- Fecha de la consulta/acuerdo con la RLT: **[FECHA]**.
- \`TODO-LEGAL\`: dejar constancia documental del acuerdo o de la consulta a la RLT (acta o comunicación) y archivarla junto a este protocolo.

## 11. Protección de datos

El tratamiento de datos derivado de este registro se ampara en el **artículo 6.1.c RGPD** (obligación legal) y se rige por la cláusula informativa entregada al personal, el Registro de Actividades de Tratamiento y la Política de Conservación y Supresión.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*`,
  },
  {
    id: "cumplimiento",
    archivo: "CUMPLIMIENTO.md",
    titulo: "Tabla maestra de cumplimiento",
    categoria: "Cumplimiento",
    empleado: false,
    markdown: `# CUMPLIMIENTO — tabla maestra

Requisito legal → norma y artículo → fuente consultada (URL + fecha) → **dónde se cumple en el código** → estado.
Fecha de verificación de fuentes: **2026-07-13**. Ámbito: España (normativa laboral + protección de datos).

| # | Requisito | Norma / artículo | Fuente (URL) · fecha | Dónde se cumple (archivo/función/pantalla) | Estado |
|---|---|---|---|---|---|
| 1 | Registro **diario** con horario concreto de inicio/fin de cada trabajador | Art. 34.9 ET (RDL 8/2019) | boe.es/buscar/doc.php?id=BOE-A-2019-3481 · 2026-07-13 | \`services/fichaje.service.js\` (fichar entrada/salida), \`domain/jornadas.js\` | ✅ |
| 2 | **Conservación 4 años** | Art. 34.9 ET | BOE-A-2019-3481 · 2026-07-13 | \`ports.js\` \`conservacionAnios\` (mín. 4, no rebajable) + \`POLITICA-DE-CONSERVACION-Y-SUPRESION.md\` | ✅ (purga automática: \`TODO-INTEGRACIÓN\`) |
| 3 | Registros **a disposición** de trabajador, RLT e Inspección | Art. 34.9 ET | BOE-A-2019-3481 · 2026-07-13 | \`export/csv.js\`, \`export/pdf.js\`; kiosko "mis registros"; Manager "Informe" | ✅ |
| 4 | Registro **digital, trazable e inalterable**; historial de modificaciones con autoría/fecha/motivo; imposibilidad de borrar sin rastro | Estándar del borrador del RD de desarrollo (art. 34.9 ET) | Borrador MITES (audiencia pública) · 2026-07-13 | \`services/audit.service.js\` (hash-chain), \`services/repos.js\` \`versionarMarcaTs\`, \`schema.js\` \`presentia_marca_versiones\` | ✅ (RD **no publicado**: reverificar) |
| 5 | **Exportación verificable** (CSV y PDF) | Estándar del borrador | Borrador MITES · 2026-07-13 | \`export/csv.js\`, \`export/pdf.js\`; endpoints \`*/informe.csv|.pdf\` | ✅ |
| 6 | **Acceso del trabajador** a sus asientos y copia | Art. 34.9 ET + art. 15 RGPD | BOE-A-2019-3481 · 2026-07-13 | \`http/handlers.js\` \`kiosk.misRegistros/exportar\` (sólo lo propio, anti-IDOR) | ✅ |
| 7 | Base jurídica = **obligación legal** (no consentimiento) | Art. 6.1.c RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`POLITICA-DE-PRIVACIDAD.md\`, \`CLAUSULA-INFORMATIVA-EMPLEADOS.md\` | ✅ |
| 8 | **Minimización** y limitación de finalidad | Art. 5.1 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`schema.js\` (sólo id, marcas, horas); sin datos superfluos | ✅ |
| 9 | **Cero biometría** | Art. 9 RGPD + Guía AEPD 23/11/2023 | aepd.es/guias/guia-control-presencia-biometrico.pdf · 2026-07-13 | Diseño: PIN, sin captura biométrica en ningún módulo | ✅ |
| 10 | **Cero geolocalización** | Art. 90 LOPDGDD + art. 5.1.c RGPD | boe.es/buscar/act.php?id=BOE-A-2018-16673 · 2026-07-13 | Eliminado Leaflet/geo; \`schema.js\` sin columnas de ubicación | ✅ |
| 11 | **Información previa** al trabajador | Arts. 13-14 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`kiosk/AvisoTratamiento.jsx\` + \`CLAUSULA-INFORMATIVA-EMPLEADOS.md\` | ✅ |
| 12 | Derechos **ARSOPL** | Arts. 15-22 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`POLITICA-DE-PRIVACIDAD.md\` (procedimiento de ejercicio) | ✅ (proceso documental) |
| 13 | **Desconexión digital** | Art. 88 LOPDGDD | BOE-A-2018-16673 · 2026-07-13 | \`CLAUSULA-INFORMATIVA-EMPLEADOS.md\` | ✅ (informativo) |
| 14 | **Contrato de encargo** | Art. 28 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`CONTRATO-ENCARGADO-TRATAMIENTO.md\` (plantilla) | ✅ (firmar) |
| 15 | **Registro de actividades (RAT)** | Art. 30 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`REGISTRO-ACTIVIDADES-TRATAMIENTO.md\` | ✅ (completar datos) |
| 16 | **EIPD** si procede | Art. 35 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | Sin biometría/geo, normalmente no exigible; evaluar a escala de Hub | ⚠️ \`TODO-LEGAL\` |
| 17 | **Aviso legal** | Art. 10 LSSI (Ley 34/2002) | boe.es/buscar/act.php?id=BOE-A-2002-13758 · 2026-07-13 | \`AVISO-LEGAL.md\` | ✅ (completar datos) |
| 18 | **Cookies** / almacenamiento técnico | Art. 22.2 LSSI | BOE-A-2002-13758 · 2026-07-13 | \`COOKIES-NO-APLICA.md\` (sólo almacenamiento técnico necesario) | ✅ |
| 19 | Registros **no borrables** durante el plazo | Art. 34.9 ET + integridad | BOE-A-2019-3481 · 2026-07-13 | Sin endpoint de borrado (test); auditoría hash-chain | ✅ |
| 20 | **Confidencialidad/seguridad** del tratamiento | Art. 32 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | \`docs/SEGURIDAD.md\`; scrypt, authz por endpoint, cifrado (host) | ✅ / ⚠️ cifrado \`TODO-INTEGRACIÓN\` |

## Estado del RD de desarrollo del registro de jornada
A **2026-07-13 NO está publicado en el BOE** (verificado en los sumarios del 09 y 13/07/2026). Sigue **en tramitación** (dictamen desfavorable del Consejo de Estado, 23/03/2026; prensa apunta a aprobación antes de agosto de 2026, con entrada en vigor 20 días tras su publicación). El módulo ya implementa el **estándar más exigente del borrador**. **\`TODO-LEGAL\`: reverificar el BOE y ajustar contenido mínimo/formatos exigidos cuando se publique.**

## TODO-LEGAL (requieren validación profesional)
1. Texto **definitivo** del RD (contenido mínimo, formatos, periodo transitorio) — reverificar BOE.
2. Dictamen íntegro del Consejo de Estado de 23/03/2026 (referencia oficial).
3. Necesidad de **EIPD** (art. 35) para el despliegue concreto y a escala de Hub.
4. **Plazo de conservación** de logs/auditoría/sesión (distinto del de jornada) — fijar y justificar.
5. Sustituir los marcadores \`[NOMBRE_EMPRESA]\`, \`[CIF]\`, \`[DOMICILIO]\`, \`[EMAIL_DPD]\`, \`[NOMBRE_PROVEEDOR]\`, \`[HUB_CENTRAL]\`.
6. Transferencias internacionales si el Hub aloja datos fuera del EEE.

---

> **Aviso obligatorio.** Este material lo ha redactado un sistema de IA a partir de fuentes públicas oficiales. **No sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos** y debe revisarse por un profesional antes de su uso en producción. Los puntos que más requieren esa revisión son los \`TODO-LEGAL\` de arriba, en especial el estado y contenido definitivo del nuevo Real Decreto de registro de jornada, la necesidad de EIPD y los plazos de conservación de logs.`,
  }
];

/** Documento por id, o null. */
export function documentoPorId(id) {
  return DOCUMENTOS.find((d) => d.id === id) || null;
}

/** Documentos visibles para el empleado (kiosko). */
export function documentosEmpleado() {
  return DOCUMENTOS.filter((d) => d.empleado);
}

/** Documentos agrupados por categoría, respetando ORDEN_CATEGORIAS. */
export function documentosPorCategoria(soloEmpleado = false) {
  const lista = soloEmpleado ? documentosEmpleado() : DOCUMENTOS;
  return ORDEN_CATEGORIAS
    .map((cat) => ({ categoria: cat, documentos: lista.filter((d) => d.categoria === cat) }))
    .filter((g) => g.documentos.length > 0);
}
