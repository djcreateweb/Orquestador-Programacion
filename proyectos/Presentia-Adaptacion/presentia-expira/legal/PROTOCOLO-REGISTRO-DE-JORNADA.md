# Protocolo Interno de Registro de Jornada — Módulo "Presentia" (software "Expira")

**Empresa:** [NOMBRE_EMPRESA] — CIF: [CIF] — Domicilio: [DOMICILIO]
**Fecha de aprobación:** [FECHA]
**Marco legal:** Artículo 34.9 del Estatuto de los Trabajadores (RDL 8/2019, BOE-A-2019-3481)

---

## 1. Objeto y marco legal

El presente protocolo establece la organización y documentación del registro diario de jornada de **[NOMBRE_EMPRESA]**, en cumplimiento del **artículo 34.9 del Estatuto de los Trabajadores**, exigible desde el **12 de mayo de 2019**, que obliga a garantizar el registro diario de jornada, incluyendo el **horario concreto de inicio y de finalización** de la jornada de cada persona trabajadora.

Conforme al artículo 34.9 ET, la organización y documentación del registro se realiza **mediante negociación colectiva o acuerdo de empresa** o, en su defecto, **por decisión del empresario previa consulta con la representación legal de las personas trabajadoras (RLT)**. Véase el apartado 10.

> `TODO-LEGAL`: A fecha **2026-07-13**, el nuevo Real Decreto de desarrollo del registro de jornada **NO está publicado en el BOE** y se encuentra **en tramitación** (dictamen desfavorable del Consejo de Estado de 23/03/2026). Este protocolo debe **reverificarse y actualizarse cuando dicho Real Decreto se publique**.

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

```
F-AAAA-NNNN
```

donde `AAAA` es el año y `NNNN` es un número correlativo. Este código permite referenciar de forma inequívoca cada jornada en consultas, correcciones, exportaciones y auditorías.

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
- `TODO-LEGAL`: dejar constancia documental del acuerdo o de la consulta a la RLT (acta o comunicación) y archivarla junto a este protocolo.

## 11. Protección de datos

El tratamiento de datos derivado de este registro se ampara en el **artículo 6.1.c RGPD** (obligación legal) y se rige por la cláusula informativa entregada al personal, el Registro de Actividades de Tratamiento y la Política de Conservación y Supresión.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*
