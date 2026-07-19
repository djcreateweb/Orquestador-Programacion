# Registro de Actividades de Tratamiento (RAT) — Responsable

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
| **Transferencias internacionales** | No previstas. `TODO-LEGAL`: si [HUB_CENTRAL] implicase tratamiento fuera del EEE, documentar la transferencia y las garantías del Capítulo V RGPD. |
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
- Comunicaciones protegidas mediante **TLS** cuando el acceso se realice fuera del propio equipo. `TODO-LEGAL`: confirmar la configuración TLS en el despliegue concreto.
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
- **Evaluación de impacto (art. 35 RGPD):** al no emplearse biometría ni geolocalización y limitarse a un tratamiento de datos identificativos y horarios basado en obligación legal, no se aprecia a priori un tratamiento de alto riesgo que exija EIPD. `TODO-LEGAL`: valorar y documentar el análisis de necesidad de EIPD según las circunstancias concretas de la organización.

---

*Documento redactado con asistencia de IA a partir de fuentes públicas oficiales; no sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos. Debe revisarse por un profesional antes de su uso en producción.*
