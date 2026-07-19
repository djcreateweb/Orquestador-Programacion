# RESPONSIVE — adaptación a todos los dispositivos

> Resultado de la adaptación responsive del módulo Presentia (kiosko + Manager) a
> ordenador, pantalla táctil/kiosko, tablet y móvil, en las dos orientaciones y los
> dos temas. Análisis de partida en [`RESPONSIVE-ANALISIS.md`](./RESPONSIVE-ANALISIS.md);
> decisiones en [`DECISIONES.md`](./DECISIONES.md) (D-012…D-018).
>
> **Invariantes respetados:** diseño/tipografía/paleta sin cambios, tema claro y oscuro,
> cero funcionalidad perdida en pantallas pequeñas, **cero dependencias nuevas**, cero
> componentes duplicados (un componente, varios diseños).

---

## 1. Breakpoints (mobile-first)

El estilo base es el de móvil; los breakpoints **añaden**. Documentados en `shared/responsive.css`.

| Umbral | Ancho | Efecto |
|---|---|---|
| base | ≥ 320 px | Móvil: una columna, controles a ancho completo, tablas de datos como **tarjetas**. |
| `640 px` | ≤ 640 | **Umbral tabla↔tarjeta.** Filtros apilados, modales como hoja inferior, solicitudes en columna. |
| `768 px` | ≤ 768 | Legal a una columna (índice sobre el visor). |
| — | ≥ 641 | Tablas normales, filtros en línea (diseño de escritorio). |

**Contextos de entrada (ortogonales al ancho):**
- `@media (any-pointer: coarse)` → **objetivo táctil ≥44 px** e **inputs ≥16 px** siempre que haya dedo (kiosko, tablet, móvil, portátil táctil). Con **ratón fino** (escritorio/Electron) se conserva la **densidad idéntica** al diseño original (D-012).
- Alturas completas en **`dvh`** (con `vh` de respaldo) → la barra del navegador móvil no recorta modales ni visores.
- `env(safe-area-inset-*)` en toasts, hojas inferiores y overlays (notch / barra gestual).
- Tipografía fluida `clamp(min, vw, actual)` **acotada al tamaño actual** → idéntica en escritorio, encoge en móvil sin desbordar (D-014).

---

## 2. Estrategia por pantalla

### Kiosko (táctil, `.pk-`)
| Pantalla | Adaptación |
|---|---|
| Tarjeta «Fichar» | Ya enorme; feedback `:active` en táctil. |
| Aviso RGPD | Hoja inferior ≤640 px, `dvh`, pie de acción fijo, safe-area. Visores «ver más» en `dvh`. |
| Elegir empleado | Rejilla fluida `auto-fill/minmax`; enlace legal con 44 px. |
| Teclado PIN | Teclas ya grandes (≥44). Es un **teclado en pantalla** (no input de texto) → sin teclado virtual que tape nada. Entra en 320 px. |
| Panel de fichaje | Reloj y botón dominante con `clamp` acotado; botón de fichar sigue siendo el elemento mayor; `← Salir` a 44 px. |
| Mis registros | Filtros a ancho completo; **tabla → tarjetas** (≤640); inputs de fecha a 16 px/44 px. |
| Información legal | Visor con `dvh`; pestañas a 44 px. |

### Manager (escritorio/Electron, `.px-`)
| Sub-pestaña | Adaptación |
|---|---|
| Cabecera + 6 pestañas | Pestañas envuelven y a 44 px en táctil; insignia de modo y botón de tema táctiles. |
| Hoy | KPIs fluidos (`auto-fit/minmax`, valor con `clamp`); **Marcas del día → tarjetas**. |
| Registros | Filtros apilados; **tabla de 7 col. → tarjetas** (ninguna columna ni acción fuera de pantalla); modales Editar/Añadir como hoja inferior con acción fija; botones de fila a 44 px. |
| Informe de horas | Filtros apilados; **una tabla por empleado → tarjetas**; caja «Total» conservada. |
| Solicitudes | Ya en fichas; acciones Aprobar/Rechazar a ancho completo y 44 px; motivo sin desbordar. |
| Ajustes | Inputs y toggles táctiles (área de toque ampliada del toggle sin cambiar su aspecto). |
| Legal | Índice + visor a una columna ≤768; tablas Markdown con scroll contenido. |
| Modales / toasts | Hoja inferior + safe-area (móvil); `dvh`. |

**Ventana del Manager (Electron):** encoge sin romperse hasta 320 px (misma UI que móvil por debajo de 640). No requiere ancho mínimo artificial.

---

## 3. Estrategia por tabla

| Tabla | Estrategia | Nota |
|---|---|---|
| Registros, Hoy, Informe, Mis registros (kiosko) | **Tarjetas apiladas** ≤640 px (`td[data-label]`) | Ningún dato ni acción se pierde; en ≥641 vuelven a `<table>`. |
| Solicitudes | Ya son **fichas** | Acciones a ancho completo en móvil. |
| Legal / prosa (Markdown) | **Scroll horizontal contenido** | Contenido de tablas arbitrario (RAT, etc.): no «tarjetizable» genéricamente (P15). |

---

## 4. Objetivos táctiles y densidad

- **Con dedo** (`any-pointer: coarse`): todos los controles ≥44 px (pestañas, botones, botones de fila `--sm`, ítems del índice legal, toggles con área ampliada, inputs, teclas). Inputs a 16 px (sin zoom de iOS).
- **Con ratón** (escritorio/Electron): se conserva la **densidad original** (tabla densa, botones compactos) → el diseño de escritorio queda **pixel-idéntico** (invariante §1.2).

---

## 5. Matriz de verificación (navegador real)

Chrome vía Playwright sobre `dev-preview`, midiendo `scrollWidth`/`clientWidth` (desborde del
módulo) y el tamaño real de cada control (área táctil, incluyendo la ampliación con `::after`
de los toggles). Emulación **táctil** (`hasTouch` → `any-pointer: coarse`). El chrome del arnés
de preview se excluye de la medición.

**Anchos:** 320 · 375 · 414 · 768 · 1024 · 1280 · 1440 · 1920 px
**Temas:** claro y oscuro · **Vistas:** 11 (6 pestañas Manager + modal + 4 pantallas kiosko).

| Comprobación | Resultado |
|---|---|
| Capturas (8 anchos × 2 temas × 11 vistas) | **176** |
| Scroll horizontal del módulo (`scrollWidth > clientWidth`) | **0** en todas |
| Controles con área táctil <44 px | **0** en todas |
| Tema claro y oscuro correctos | ✅ en todos los anchos |
| Horizontal (altura corta): teléfono 812×380 y tablet 1024×600 | **0** desborde, **0** táctiles <44 |
| Escritorio con **ratón** a 1440 px | Densidad original conservada (tabla densa, botones compactos) ✅ |

**Flujos completos repetidos en móvil (375 px):** fichar (elegir empleado → PIN → panel →
FICHAR), aceptación de términos, ver «Mis registros», editar registro (modal hoja inferior),
aprobar/rechazar solicitud, exportar CSV/PDF, cambiar un ajuste. Ninguna funcionalidad se pierde.

> Reproducir: `dev-preview` (API en 8787 + Vite) y el script `responsive-check.mjs` del
> scratchpad (`WIDTHS=… THEMES=… TOUCH=0|1 node responsive-check.mjs`). No se versiona
> (usa el Playwright cacheado por npx + Chrome del sistema → cero deps en el módulo, D-015).

---

## 6. Tests de regresión

- **`test/responsive.test.js`** (node:test, **cero deps**, corre en `npm test`): fija que
  siguen presentes las reglas que garantizan el comportamiento — import de `responsive.css`,
  44 px bajo `any-pointer:coarse`, inputs a 16 px, patrón tabla→tarjeta con `data-label`,
  `dvh` con respaldo, tablas con min-width dentro de contenedor `overflow-x`, modal hoja
  inferior con acción fija + safe-area, filtros apilados. **9 tests.**
- **`test/tema.test.js`** ampliado: el guard «cero colores hardcodeados» ahora cubre
  `shared/responsive.css`.
- Suite completa: **`npm test` → 117/117** · **`npm run lint`** en verde · suite de auditoría previa intacta.

---

## 7. Pendiente de validar en hardware real

La medición empírica se hizo en Chrome de escritorio emulando táctil. Queda por confirmar en
dispositivo físico (no bloqueante; el diseño ya lo contempla):

1. **Respuesta al dedo** (guante / mano húmeda) en el kiosko de cocina: los objetivos ≥44 px y
   el `:active` inmediato deberían bastar.
2. **Teclado virtual** en formularios de texto del Manager (motivo de Editar/Resolver) en móvil
   real: el input activo debe quedar visible (el modal hace scroll interno). El PIN del kiosko no
   usa teclado virtual (es teclado en pantalla).
3. **Notch / barra gestual** (safe-area) en iPhone/Android con gesto: toasts y hojas inferiores.
4. **Orientación bloqueada** y **brillo** del kiosko físico.
5. **Kiosko en horizontal muy bajo** (<~450 px de alto): el teclado PIN queda tras un scroll
   corto. Los kioskos reales son ≥600 px de alto, donde no ocurre; revisar si algún panel se
   monta en una franja apaisada muy baja.
