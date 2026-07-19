# Tema oscuro — Análisis (Fase 1)

Inventario de superficies de color y tabla de contrastes. Base: la arquitectura de
tokens ya centraliza el color en `shared/tokens.css` (primitivas `--slate/blue/green/
red-*` → alias semánticos `--color-*`, `--status-*`). **No había colores hardcodeados
fuera de tokens** (verificado con grep de `#`, `rgb(`, `rgba(`, `hsl(`).

## Puntos que requerían token nuevo (se corrigieron en Fase 2)
- **Velo de modal/aviso**: usaban `color-mix(var(--color-text) 50/55%)`, que en oscuro
  se invertía (velo claro sobre contenido oscuro). → nuevo token `--color-overlay`
  (oscuro en ambos temas).
- **Círculo decorativo de la tarjeta «Fichar»**: usaba `color-mix(var(--color-text-on-accent) 18%)`,
  acoplado al color de texto de botón. → nuevo token `--vidrio-accento` (vidrio blanco).
- **Enlaces de texto**: el azul de acción no llega a 4.5:1 sobre superficies oscuras.
  → nuevo token `--color-enlace` (azul más luminoso en oscuro).

## Inventario de superficies revisadas (ambos temas)
Fondo base · superficie suave · superficie elevada (tarjeta/panel/modal) · cabecera ·
tablas (cabecera, filas alternas, hover) · inputs/selects/placeholders · botones
(primario, suave, éxito, peligro, deshabilitado) · toggles · badges/insignias
(«editado», «en curso» ámbar, MODO TÉCNICO azul) · toasts (éxito/error/info) · modales
y su **velo** · KPIs · caja info · estados carga/error/vacío · foco de teclado ·
scrollbars (heredan) · visor de documentos legales (prosa: enlaces, código, tablas,
citas) · pantalla de aceptación · botones enormes del kiosko (ENTRADA verde / SALIDA
rojo) · reloj grande · aviso RGPD. **El PDF exportado va SIEMPRE en claro** (es un
documento; el generador no depende del tema).

## Tabla de contrastes — paleta OSCURA (WCAG 2.x)
Umbral AA: **4.5:1** texto normal · **3:1** texto grande / componentes de interfaz.
Calculado por `shared/contraste.js` (test: `test/tema.test.js`).

| Par (texto / fondo) | Colores | Ratio | Umbral | ¿AA? |
|---|---|---:|:--:|:--:|
| Texto / superficie | `#f1f5f9` / `#1e293b` | 13.35 | 4.5 | ✅ |
| Texto / superficie elevada | `#f1f5f9` / `#273449` | 11.45 | 4.5 | ✅ |
| Texto / base | `#f1f5f9` / `#0f172a` | 16.30 | 4.5 | ✅ |
| Texto atenuado / superficie | `#94a3b8` / `#1e293b` | 5.71 | 4.5 | ✅ |
| Texto atenuado / elevada | `#94a3b8` / `#273449` | 4.89 | 4.5 | ✅ |
| on-accent (oscuro) / azul acción | `#0f172a` / `#4f83e3` | 4.84 | 4.5 | ✅ |
| on-accent (oscuro) / verde acción | `#0f172a` / `#22b86a` | 6.91 | 4.5 | ✅ |
| on-accent (oscuro) / rojo acción | `#0f172a` / `#ef4444` | 4.74 | 4.5 | ✅ |
| Éxito: texto / fondo | `#4ade80` / `#14532d` | 5.23 | 4.5 | ✅ |
| Aviso/pendiente: texto / fondo | `#fbbf24` / `#422006` | 8.73 | 4.5 | ✅ |
| Info: texto / fondo | `#93c5fd` / `#16233d` | 8.68 | 4.5 | ✅ |
| Error: texto / fondo | `#fca5a5` / `#3b1717` | 8.38 | 4.5 | ✅ |
| Caducidad: texto / fondo | `#422006` / `#facc15` | 9.52 | 4.5 | ✅ |
| Texto sobre azul suave | `#6b9bee` / `#16233d` | 5.63 | 4.5 | ✅ |
| Texto sobre verde suave | `#34cf7e` / `#0f2b1f` | 7.49 | 4.5 | ✅ |
| Enlace / superficie | `#7ea6f0` / `#1e293b` | 5.99 | 4.5 | ✅ |
| Enlace / superficie elevada | `#7ea6f0` / `#273449` | 5.14 | 4.5 | ✅ |
| Foco (azul acción) / superficie [UI] | `#4f83e3` / `#1e293b` | 3.96 | 3 | ✅ |
| Verde acción / base [UI] | `#22b86a` / `#0f172a` | 6.91 | 3 | ✅ |
| Rojo acción / base [UI] | `#ef4444` / `#0f172a` | 4.74 | 3 | ✅ |

**Ajuste respecto a la tabla del encargo:** el enlace de texto usa `#7ea6f0` (más
luminoso que el `#4f83e3` de la tabla, mismo tono) porque `#4f83e3` como **texto**
normal se queda en 3.4–3.96:1. El `#4f83e3` se mantiene para **fondos de botón**
(texto oscuro encima, 4.84:1) y para **bordes/foco** (3.96:1 ≥ 3).

**Bordes decorativos** (`#334155`, divisores/líneas de tabla): ~1.3:1 contra la
superficie; son elementos no esenciales (exentos de 1.4.11). La identificación de los
controles interactivos se garantiza por el relleno + el **foco** (borde azul brillante
`#4f83e3`, 3.96:1).
