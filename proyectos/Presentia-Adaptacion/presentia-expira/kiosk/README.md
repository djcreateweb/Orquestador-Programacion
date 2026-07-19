# Presentia · Kiosko (componentes React)

Componentes de fichaje para la pantalla del kiosko (táctil, cocina). Expira los
monta; no son un scaffold nuevo. React 19, **cero dependencias nuevas** (`fetch`).

## Montaje

El host crea **una** instancia de API con el `dispositivo` del kiosko y decide la
navegación entre la tarjeta del menú y la pantalla de fichaje.

```jsx
import { crearApiKiosk } from "./kiosk/api.js";
import FicharCard from "./kiosk/FicharCard.jsx";
import FicharScreen from "./kiosk/FicharScreen.jsx";

const api = crearApiKiosk({ base: "/presentia", dispositivo: "kiosko-cocina-1" });

// En el menú del kiosko (junto a las tarjetas azules de cocina):
<FicharCard onOpen={() => abrirPantalla("fichar")} visible={mostrarEnKiosko} />

// La pantalla de fichaje:
<FicharScreen api={api} onSalir={() => volverAlMenu()} />
```

Cada componente importa su CSS (`./kiosk.css`), que importa los tokens
(`../shared/tokens.css`). No hace falta importar la hoja aparte.

## Componentes y props

### `FicharCard` — tarjeta grande **VERDE** del menú
| Prop         | Tipo       | Def.                          | Descripción |
|--------------|------------|-------------------------------|-------------|
| `onOpen`     | `function` | —                             | Se invoca al pulsar la tarjeta. |
| `titulo`     | `string`   | `"Fichar"`                    | Título de la tarjeta. |
| `subtitulo`  | `string`   | `"Registra tu entrada o salida"` | Texto secundario. |
| `visible`    | `boolean`  | `true`                        | Pásalo con el ajuste `mostrarEnKiosko`; si es `false` no renderiza nada. |

### `FicharScreen` — pantalla de fichaje
| Prop      | Tipo       | Def. | Descripción |
|-----------|------------|------|-------------|
| `api`     | objeto de `crearApiKiosk` | — | Cliente de API del kiosko (requerido). |
| `onSalir` | `function` | —    | Opcional. Vuelve al menú del kiosko desde la lista de empleados. |

Flujo interno: **elegir empleado → PIN (`POST entrar`) → token en estado de React
(memoria, NO localStorage) → panel** con avatar, «Hola {nombre}», **reloj en vivo**
(fecha larga en español, en `config.zonaHoraria` — `GET /kiosk/config`, fix K-06; NUNCA
`Europe/Madrid` fijo), estado (dentro/fuera) y **botón único
enorme** que alterna **FICHAR ENTRADA** (verde) / **FICHAR SALIDA** (rojo). Al fichar
muestra un **toast con la hora**. **Antirrebote**: el botón se deshabilita mientras
hay petición en curso. Si el servidor no responde, muestra un error amable y permite
reintentar. El token caduca en ~90 s; si `POST fichar` devuelve `401 SESION_KIOSKO`,
vuelve a pedir el PIN conservando al empleado. Incluye `AvisoTratamiento` y da acceso
a `MisRegistros`.

### `MisRegistros` — el empleado ve/exporta lo suyo
| Prop               | Tipo       | Descripción |
|--------------------|------------|-------------|
| `api`              | objeto     | Cliente de API del kiosko. |
| `token`            | `string`   | Token de la micro-sesión (en memoria). |
| `empleadoNombre`   | `string`   | Opcional, para el título. |
| `onVolver`         | `function` | Vuelve al panel. |
| `onSesionCaducada` | `function` | Se invoca si el token caduca (para re-pedir PIN). |

Selector de rango (por defecto el mes en curso) y **Exportar CSV/PDF** (descargas con
el token en la query: `/kiosk/mis-horas.csv` y `.pdf`).

### `AvisoTratamiento` — aviso RGPD (primera vez)
| Prop          | Tipo       | Def. | Descripción |
|---------------|------------|------|-------------|
| `onAceptar`   | `function` | —    | Callback tras aceptar. |
| `responsable` | `string`   | genérico | Nombre del responsable del tratamiento. |
| `persistKey`  | `string`   | `"presentia.avisoTratamiento.v1"` | Clave de `localStorage` para recordar la aceptación (booleano, **nunca** el token). |
| `forzar`      | `boolean`  | `false` | Muestra el aviso aunque ya se aceptara. |

Informa del fin (art. 34.9 ET), datos tratados, conservación y **ausencia de
biometría y geolocalización**. Sólo texto (sin `dangerouslySetInnerHTML`).

## Sesión del kiosko (importante)

- Envía siempre la cabecera `x-presentia-dispositivo: <dispositivo>` (lo hace
  `crearApiKiosk`).
- El **token** de micro-sesión se guarda **sólo en estado de React** (memoria). No se
  persiste en `localStorage` ni en cookies. Caduca en ~90 s.
- El empleado se identifica con su **PIN**; el módulo aplica rate-limit/backoff en el
  servidor.

## Contrato de API consumido (base `base`)

Sobre: `{ ok:true, data }` | `{ ok:false, error:{ code, mensaje } }`. Los `ts` son
epoch ms → `HH:MM` con `Intl` es-ES, en la zona horaria del centro (`config.zonaHoraria`,
`GET /kiosk/config` — fix K-06, nunca una zona fija en el bundle).

- `GET  /kiosk/empleados`
- `GET  /kiosk/config` (sólo `{ zonaHoraria }`; sin PIN, dato no sensible)
- `POST /kiosk/entrar   { empleadoId, pin }`
- `POST /kiosk/estado   { token }`
- `POST /kiosk/fichar   { token }`  → `401 SESION_KIOSKO` si el token caducó.
- `POST /kiosk/mis-registros { token, desde?, hasta? }`
- `GET  /kiosk/mis-horas.csv?token&desde&hasta` · `/kiosk/mis-horas.pdf`
- `POST /kiosk/solicitud { token, cambio, motivo, jornadaId?, marcaId? }`

## Estructura

```
kiosk/
  api.js              wrapper fetch (cabecera de dispositivo) + formato (reloj, fecha larga)
  kiosk.css           estilos (SÓLO variables de ../shared/tokens.css)
  FicharCard.jsx      tarjeta VERDE del menú
  FicharScreen.jsx    pantalla de fichaje (reloj en vivo, PIN, botón entrada/salida)
  MisRegistros.jsx    ver/exportar lo propio
  AvisoTratamiento.jsx  aviso RGPD (primera vez)
```
