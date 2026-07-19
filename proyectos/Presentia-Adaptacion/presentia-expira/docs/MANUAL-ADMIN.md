# Manual del administrador — Presentia

El apartado **«Presentia»** del Manager tiene **6 pestañas**. El primer acceso exige aceptar
los términos (una vez por usuario). El botón de tema (claro/oscuro/auto) está en la cabecera.

## 1. Hoy
Vista del día en curso:
- **KPIs**: *Dentro ahora* (personas fichadas sin salir), *Salidas* (ya se han ido),
  *Personas hoy*.
- Lista de marcas del día, con insignia de estado. Se **autorefresca**.
- Con 0 marcas muestra el estado vacío correcto (sin errores).

## 2. Registros
Una fila por jornada (rango de fechas filtrable, y por empleado):
- Columnas: empleado, fecha, entrada, salida, código `F-AAAA-NNNN`, horas, editado.
- **En curso** (falta la salida) se marca en ámbar; **editado** marca las jornadas corregidas.
- **Editar una marca**: botón *Editar* → cambia la hora, **motivo obligatorio** → se guarda una
  **versión nueva conservando el valor original** y queda auditado.
- **Añadir marca**: para completar una jornada (p. ej. una salida olvidada).

## 3. Informe de horas
Horas por empleado en un rango (por defecto, el mes):
- Formato `168 h 30 m`; **Total del periodo** = suma de las filas.
- Cambiar el rango recalcula.
- **Exportar CSV y PDF** para el trabajador, la representación legal y la **Inspección de Trabajo**.
  El CSV lleva BOM (tildes correctas en Excel) y neutraliza fórmulas; **no contiene PIN ni hashes**.

## 4. Solicitudes
Correcciones pedidas por los empleados:
- Filtros: *Pendientes / Aprobadas / Rechazadas* (el contador de pendientes se ve en la pestaña).
- Cada solicitud muestra el cambio propuesto y el motivo.
- **Aprobar** aplica el cambio real (conservando el original) y lo audita. **Rechazar** no cambia nada.
- Una solicitud ya resuelta no se puede volver a resolver.

## 5. Ajustes
Configuración del módulo (se persiste; cada cambio queda auditado):
- **Jornada estándar (min)**: valor informativo/de referencia.
- **Redondeo (min)**: redondea el total de cada jornada al múltiplo más cercano (`0` = sin redondeo).
- **Tema por defecto**: claro / oscuro / automático (para dispositivos sin preferencia propia).
- **Mostrar «Fichar» en el kiosko**: muestra/oculta la tarjeta de fichaje.
- **Exigir PIN**: pide PIN para fichar.
- **Varias marcas por día**: permite pausas (varias entradas/salidas).
- **Imprimir ticket**: imprime un ticket al fichar (si Expira aporta impresora).

## 6. Legal
Visor de los documentos legales del módulo (protección de datos, términos, aviso legal,
cumplimiento, etc.), con buscador, **imprimir** y **descargar (.md)**. Los del empleado se
ven también en el kiosko.

## Notas de administración
- **Rol técnico**: mismo panel en azul con insignia «MODO TÉCNICO»; además puede verificar la
  integridad de la auditoría.
- **No se pueden borrar fichajes** (inalterabilidad legal): las correcciones siempre dejan rastro.
- **Instalación limpia**: sin empleados ni fichajes de ejemplo; los empleados y sus PIN los
  gestiona Expira.
