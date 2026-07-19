# CUMPLIMIENTO — tabla maestra

Requisito legal → norma y artículo → fuente consultada (URL + fecha) → **dónde se cumple en el código** → estado.
Fecha de verificación de fuentes: **2026-07-13**. Ámbito: España (normativa laboral + protección de datos).

| # | Requisito | Norma / artículo | Fuente (URL) · fecha | Dónde se cumple (archivo/función/pantalla) | Estado |
|---|---|---|---|---|---|
| 1 | Registro **diario** con horario concreto de inicio/fin de cada trabajador | Art. 34.9 ET (RDL 8/2019) | boe.es/buscar/doc.php?id=BOE-A-2019-3481 · 2026-07-13 | `services/fichaje.service.js` (fichar entrada/salida), `domain/jornadas.js` | ✅ |
| 2 | **Conservación 4 años** | Art. 34.9 ET | BOE-A-2019-3481 · 2026-07-13 | `ports.js` `conservacionAnios` (mín. 4, no rebajable) + `POLITICA-DE-CONSERVACION-Y-SUPRESION.md` | ✅ (purga automática: `TODO-INTEGRACIÓN`) |
| 3 | Registros **a disposición** de trabajador, RLT e Inspección | Art. 34.9 ET | BOE-A-2019-3481 · 2026-07-13 | `export/csv.js`, `export/pdf.js`; kiosko "mis registros"; Manager "Informe" | ✅ |
| 4 | Registro **digital, trazable e inalterable**; historial de modificaciones con autoría/fecha/motivo; imposibilidad de borrar sin rastro | Estándar del borrador del RD de desarrollo (art. 34.9 ET) | Borrador MITES (audiencia pública) · 2026-07-13 | `services/audit.service.js` (hash-chain), `services/repos.js` `versionarMarcaTs`, `schema.js` `presentia_marca_versiones` | ✅ (RD **no publicado**: reverificar) |
| 5 | **Exportación verificable** (CSV y PDF) | Estándar del borrador | Borrador MITES · 2026-07-13 | `export/csv.js`, `export/pdf.js`; endpoints `*/informe.csv|.pdf` | ✅ |
| 6 | **Acceso del trabajador** a sus asientos y copia | Art. 34.9 ET + art. 15 RGPD | BOE-A-2019-3481 · 2026-07-13 | `http/handlers.js` `kiosk.misRegistros/exportar` (sólo lo propio, anti-IDOR) | ✅ |
| 7 | Base jurídica = **obligación legal** (no consentimiento) | Art. 6.1.c RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `POLITICA-DE-PRIVACIDAD.md`, `CLAUSULA-INFORMATIVA-EMPLEADOS.md` | ✅ |
| 8 | **Minimización** y limitación de finalidad | Art. 5.1 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `schema.js` (sólo id, marcas, horas); sin datos superfluos | ✅ |
| 9 | **Cero biometría** | Art. 9 RGPD + Guía AEPD 23/11/2023 | aepd.es/guias/guia-control-presencia-biometrico.pdf · 2026-07-13 | Diseño: PIN, sin captura biométrica en ningún módulo | ✅ |
| 10 | **Cero geolocalización** | Art. 90 LOPDGDD + art. 5.1.c RGPD | boe.es/buscar/act.php?id=BOE-A-2018-16673 · 2026-07-13 | Eliminado Leaflet/geo; `schema.js` sin columnas de ubicación | ✅ |
| 11 | **Información previa** al trabajador | Arts. 13-14 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `kiosk/AvisoTratamiento.jsx` + `CLAUSULA-INFORMATIVA-EMPLEADOS.md` | ✅ |
| 12 | Derechos **ARSOPL** | Arts. 15-22 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `POLITICA-DE-PRIVACIDAD.md` (procedimiento de ejercicio) | ✅ (proceso documental) |
| 13 | **Desconexión digital** | Art. 88 LOPDGDD | BOE-A-2018-16673 · 2026-07-13 | `CLAUSULA-INFORMATIVA-EMPLEADOS.md` | ✅ (informativo) |
| 14 | **Contrato de encargo** | Art. 28 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `CONTRATO-ENCARGADO-TRATAMIENTO.md` (plantilla) | ✅ (firmar) |
| 15 | **Registro de actividades (RAT)** | Art. 30 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `REGISTRO-ACTIVIDADES-TRATAMIENTO.md` | ✅ (completar datos) |
| 16 | **EIPD** si procede | Art. 35 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | Sin biometría/geo, normalmente no exigible; evaluar a escala de Hub | ⚠️ `TODO-LEGAL` |
| 17 | **Aviso legal** | Art. 10 LSSI (Ley 34/2002) | boe.es/buscar/act.php?id=BOE-A-2002-13758 · 2026-07-13 | `AVISO-LEGAL.md` | ✅ (completar datos) |
| 18 | **Cookies** / almacenamiento técnico | Art. 22.2 LSSI | BOE-A-2002-13758 · 2026-07-13 | `COOKIES-NO-APLICA.md` (sólo almacenamiento técnico necesario) | ✅ |
| 19 | Registros **no borrables** durante el plazo | Art. 34.9 ET + integridad | BOE-A-2019-3481 · 2026-07-13 | Sin endpoint de borrado (test); auditoría hash-chain | ✅ |
| 20 | **Confidencialidad/seguridad** del tratamiento | Art. 32 RGPD | eur-lex CELEX 32016R0679 · 2026-07-13 | `docs/SEGURIDAD.md`; scrypt, authz por endpoint, cifrado (host) | ✅ / ⚠️ cifrado `TODO-INTEGRACIÓN` |

## Estado del RD de desarrollo del registro de jornada
A **2026-07-13 NO está publicado en el BOE** (verificado en los sumarios del 09 y 13/07/2026). Sigue **en tramitación** (dictamen desfavorable del Consejo de Estado, 23/03/2026; prensa apunta a aprobación antes de agosto de 2026, con entrada en vigor 20 días tras su publicación). El módulo ya implementa el **estándar más exigente del borrador**. **`TODO-LEGAL`: reverificar el BOE y ajustar contenido mínimo/formatos exigidos cuando se publique.**

## TODO-LEGAL (requieren validación profesional)
1. Texto **definitivo** del RD (contenido mínimo, formatos, periodo transitorio) — reverificar BOE.
2. Dictamen íntegro del Consejo de Estado de 23/03/2026 (referencia oficial).
3. Necesidad de **EIPD** (art. 35) para el despliegue concreto y a escala de Hub.
4. **Plazo de conservación** de logs/auditoría/sesión (distinto del de jornada) — fijar y justificar.
5. Sustituir los marcadores `[NOMBRE_EMPRESA]`, `[CIF]`, `[DOMICILIO]`, `[EMAIL_DPD]`, `[NOMBRE_PROVEEDOR]`, `[HUB_CENTRAL]`.
6. Transferencias internacionales si el Hub aloja datos fuera del EEE.

---

> **Aviso obligatorio.** Este material lo ha redactado un sistema de IA a partir de fuentes públicas oficiales. **No sustituye el asesoramiento de un abogado ni de un Delegado de Protección de Datos** y debe revisarse por un profesional antes de su uso en producción. Los puntos que más requieren esa revisión son los `TODO-LEGAL` de arriba, en especial el estado y contenido definitivo del nuevo Real Decreto de registro de jornada, la necesidad de EIPD y los plazos de conservación de logs.
