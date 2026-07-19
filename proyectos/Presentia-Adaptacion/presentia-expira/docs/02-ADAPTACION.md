# 02 · ADAPTACIÓN (Fase 2)

Qué se construyó: el módulo reducido, seguro y conforme, con la forma que tendrá dentro de Expira.

## Estructura entregada
```
presentia-expira/
├── src/
│   ├── index.js               Punto de entrada (crearModulo + registrarFastify)
│   ├── ports.js               Interfaz de integración (puertos) + ROLES + DEFAULT_CONFIG
│   ├── errors.js              ErrorPresentia (código, estado HTTP, mensaje público genérico)
│   ├── db/{schema,migrate,tx}.js     Esquema presentia_*, migración idempotente, transacción SAVEPOINT
│   ├── domain/{time,correlativo,jornadas}.js   Lógica pura: TZ, F-AAAA-NNNN, emparejado/horas
│   ├── security/{hash,pin-policy}.js  scrypt + política/backoff de PIN
│   ├── services/*.js          fichaje, registros, informe, solicitudes, ajustes, hoy, audit, repos
│   ├── export/{csv,pdf}.js     CSV (BOM) y PDF de texto sin dependencias
│   ├── http/*.js              authz, kiosk-session, handlers (agnósticos), fastify-adapter
│   └── dev/reference-env.js   Entorno de referencia SOLO dev/test
├── manager/ · kiosk/          Componentes React (Manager 5 pestañas + kiosko "Fichar")
├── shared/{tokens,fonts}.css  Fuente única de diseño
├── legal/*.md                 10 documentos (ver CUMPLIMIENTO.md)
├── docs/*.md                  Este análisis, seguridad, integración, pruebas, decisiones
└── test/*.test.js             28 pruebas (dominio, migración, flujos, seguridad)
```

## Persistencia (§1.3)
- Esquema con prefijo `presentia_` ([src/db/schema.js](../src/db/schema.js)); **migración aditiva e idempotente** (`CREATE ... IF NOT EXISTS`).
- **Modelo:** jornada (día) → marcas (entrada/salida; pausas = pares extra). Correcciones = **versiones nuevas** que conservan el original (`presentia_marca_versiones`). Auditoría append-only encadenada por hash.
- Semilla de ajustes por defecto (8 h, redondeo 0, mostrar kiosko y exigir PIN activados).

## Servidor (§3, §6)
- Lógica de fichaje portada a Fastify+SQLite como **plugin registrable** ([src/index.js](../src/index.js), [src/http/fastify-adapter.js](../src/http/fastify-adapter.js)).
- **PIN, sesión, correlativos e impresión se delegan a Expira** vía puertos; el módulo añade rate-limit, bloqueo y auditoría encadenada.
- **Autorización por rol en cada endpoint**; anti-IDOR (el empleado sólo opera sobre lo suyo).

## Manager (§3) — apartado "Presentia" con 5 sub-pestañas
`Hoy` (KPIs + marcas del día, autorefresco), `Registros` (una fila por jornada, "en curso" ámbar, insignia "editado", Editar/Añadir marca), `Informe de horas` (por empleado, rango por defecto el mes, Total del periodo, CSV **y PDF**), `Solicitudes` (Pendientes/Aprobadas/Rechazadas, Aprobar/Rechazar), `Ajustes` (jornada estándar, redondeo, mostrar en kiosko, exigir PIN, varias marcas/día, imprimir ticket). Reescrito limpio: componentes pequeños, `fetch` (sin axios), cero dependencias nuevas, cero colores hardcodeados (tokens).

## Kiosko (§3) — "Fichar"
Tarjeta verde → PIN → avatar, "Hola {Nombre}", fecha larga en español, reloj vivo, estado, **un único botón enorme** FICHAR ENTRADA (verde)/FICHAR SALIDA (rojo), toast con la hora, antirrebote y degradación elegante si el servidor no responde. Acceso del empleado a **sus** registros + exportación + **aviso de tratamiento** (RGPD) la primera vez.

## Diseño (§1.1)
Único archivo de tokens ([shared/tokens.css](../shared/tokens.css)) con la paleta literal + Inter + monoespaciada del sistema, importado por Manager y kiosko. Estado por color constante (verde/rojo/ámbar); insignia MODO ADMIN/MODO TÉCNICO en azul (nunca violeta). Empaquetado de Inter en [shared/fonts.css](../shared/fonts.css) (`TODO-INTEGRACIÓN`).

## Reducción agresiva
Nada que no sirva a §3/§5/§6 existe: sin multi-tenant, superadmin, Programador/impersonación, empresas, mapas/geo, gráficos, Sanctum, axios ni Leaflet. Cero PHP/Laravel/MySQL en el resultado.
