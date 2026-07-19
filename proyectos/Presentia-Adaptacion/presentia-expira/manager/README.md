# Presentia · Manager (componentes React)

Componentes de la sección **Fichajes** que Expira monta dentro de su panel de
administración. No es un scaffold nuevo: son piezas que se importan. React 19,
**cero dependencias nuevas** (usan `fetch`, sin axios/gráficos/mapas).

## Montaje

```jsx
import PresentiaSection from "./manager/PresentiaSection.jsx";

// En algún punto del panel de admin de Expira:
<PresentiaSection rol="local_admin" apiBase="/presentia" />
```

`PresentiaSection` ya importa su CSS (`./presentia.css`), que a su vez importa los
tokens (`../shared/tokens.css`). No hay que importar la hoja de estilos aparte.

## Props de `PresentiaSection`

| Prop             | Tipo                              | Def.          | Descripción |
|------------------|-----------------------------------|---------------|-------------|
| `rol`            | `"local_admin" \| "technician"`   | `"local_admin"` | Rol del actor (viene de la sesión del host). Decide la insignia de modo: **MODO ADMIN** o **MODO TÉCNICO**, siempre en azul admin con icono 🔑. No cambia permisos: la autorización real la aplica el backend. |
| `apiBase`        | `string`                          | `"/presentia"` | Prefijo de las rutas del módulo. |
| `pestanaInicial` | `"hoy" \| "registros" \| "informe" \| "solicitudes" \| "ajustes"` | `"hoy"` | Sub-pestaña abierta al montar. |

## Sesión y autenticación

El Manager **no** maneja tokens. Cada petición viaja con las cookies de sesión del
host (`fetch` con `credentials: "include"`). Expira debe resolver la sesión y el rol
en el servidor (puerto `session.resolve`). Si el usuario no es `local_admin`/
`technician`, el backend responde `403` y la UI muestra el error.

## Sub-pestañas (§3)

1. **Hoy** — KPIs *Dentro ahora* / *Marcas hoy* / *Personas hoy* + marcas del día
   (hora en `--font-mono`, insignia entrada/salida). Autorefresco cada ~15 s.
2. **Registros** — tabla filtrable (empleado + rango), una fila por jornada.
   *En curso* en ámbar; insignia *editado*. Acciones por fila: **Editar** (marca +
   nueva hora + motivo obligatorio) y **Añadir marca** (tipo + hora + motivo).
   **Exportar CSV** (generado en cliente a partir de lo cargado).
3. **Informe de horas** — por empleado: jornadas y horas (`168 h 30 m`), selector de
   rango (por defecto el mes en curso), caja *Total del periodo*, **Exportar CSV/PDF**
   (descargas del backend: `/manager/informe.csv` y `/manager/informe.pdf`).
4. **Solicitudes** — sub-pestañas *Pendientes / Aprobadas / Rechazadas*, contador de
   pendientes visible, **Aprobar/Rechazar** con comentario opcional.
5. **Ajustes** — jornada estándar (min→h), redondeo (min) y toggles (mostrar «Fichar»
   en kiosko, exigir PIN, varias marcas/día, imprimir ticket). Guardar con `PUT`.

## Estructura

```
manager/
  PresentiaSection.jsx     contenedor (cabecera + insignia de modo + 5 sub-pestañas)
  api.js                   wrapper fetch + helpers de formato (HH:MM, rangos, descargas)
  presentia.css            estilos (SÓLO variables de ../shared/tokens.css)
  components/
    Insignia.jsx           badge: exito/aviso/en-curso/info/peligro/editado/neutral
    Toast.jsx              aviso efímero + hook useToast
  tabs/
    Hoy.jsx  Registros.jsx  InformeHoras.jsx  Solicitudes.jsx  Ajustes.jsx
```

## Contrato de API consumido (base `apiBase`)

Sobre de respuesta: `{ ok:true, data }` | `{ ok:false, error:{ code, mensaje } }`.
Los `ts` son epoch ms → se formatean a `HH:MM` con `Intl` es-ES, en la zona horaria
del centro (`config.zonaHoraria`, obtenida de `GET /manager/ajustes`; NUNCA una zona
fija en el bundle — fix A-01/A-06).

- `GET  /manager/hoy`
- `GET  /manager/empleados` (lista completa, incl. inactivos — para "Añadir jornada")
- `GET  /manager/registros?desde&hasta&empleadoId`
- `POST /manager/registros/marca/editar { marcaId, tsNuevo, motivo }`
- `POST /manager/registros/marca/anadir { jornadaId, tipo, ts, motivo }`
- `POST /manager/registros/jornada { empleadoId, entrada, salida, motivo }` (día sin ninguna marca)
- `GET  /manager/informe?desde&hasta&empleadoId`
- `GET  /manager/informe.csv` · `GET /manager/informe.pdf`
- `GET  /manager/solicitudes?estado=pendiente|aprobada|rechazada`
- `POST /manager/solicitudes/:id/aprobar { comentario }` · `.../rechazar { comentario }`
- `GET  /manager/ajustes` · `PUT /manager/ajustes { claves }`

## Notas de diseño

- Cero colores/fuentes hardcodeados: todo vía variables de `../shared/tokens.css`.
- Color con significado constante: **verde** correcto, **rojo** error/salida,
  **ámbar** pendiente/en curso. Datos técnicos (códigos, horas) en `--font-mono`.
- Los `<input type="datetime-local">` de los modales de Registros (Editar/Añadir marca/
  Añadir jornada) operan SIEMPRE en `config.zonaHoraria` (fix A-01/K-06), igual que la
  tabla — no en la hora local del navegador del admin. Así, lo que se ve y lo que se
  guarda son consistentes aunque el equipo del Manager esté en otra zona horaria.
```
