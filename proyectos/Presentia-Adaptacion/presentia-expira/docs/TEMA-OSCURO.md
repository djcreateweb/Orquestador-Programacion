# Tema claro / oscuro / automático

El módulo Presentia soporta tres modos de tema: **claro**, **oscuro** y **automático**
(sigue a `prefers-color-scheme` y reacciona en caliente). El modo claro es idéntico al
original (paleta del PDF); el oscuro es una paleta nueva con contraste WCAG AA.

## Cómo funciona (un interruptor, dos valores de token)

- **`shared/tokens.css`** es la única fuente de color. El bloque
  `:root[data-tema-efectivo="oscuro"]` **redefine solo las primitivas**
  (`--slate/blue/green/red-*`, estados y `on-*`); los alias semánticos (`--color-*`,
  `--status-*`) los siguen por cascada. Ningún componente sabe qué tema hay activo.
- **Dos atributos en `<html>`**:
  - `data-tema` = preferencia del usuario: `claro` | `oscuro` | `auto`.
  - `data-tema-efectivo` = resuelto a `claro` | `oscuro` (lo que usa el CSS).
  Así hay **un solo bloque oscuro** y `auto` no duplica media queries: el JS (y el
  script anti-FOUC) resuelven `auto` leyendo `matchMedia`.
- **`shared/tema.js`** (lógica pura + aplicación al DOM), **`shared/BotonTema.jsx`**
  (botón que cicla claro→oscuro→auto), **`shared/contraste.js`** (cálculo WCAG, tests).

## El botón
- **Manager**: en la cabecera (`PresentiaSection`), visible en todas las sub-pestañas.
  Un clic cicla claro → oscuro → auto. Icono + etiqueta, `aria-label`, `title`, foco
  visible, accesible por teclado.
- **Kiosko**: no lleva botón (dispositivo compartido). Sigue la preferencia del
  dispositivo si existe; si no, **`auto`** (se oscurece de noche). Ver `DECISIONES.md`.

## Persistencia
- Preferencia **por dispositivo** en `localStorage` con la clave `presentia.tema`.
- **Valor global por defecto** en la config del módulo: `temaPorDefecto`
  (`claro`|`oscuro`|`auto`, por defecto `auto`), editable en **Ajustes**. Se adopta en
  los dispositivos **sin** preferencia propia.

## Sin parpadeo (anti-FOUC)
El `<head>` del host debe incluir un script inline que fije el tema **antes** del primer
render (ya incluido en `dev-preview/index.html`):

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("presentia.tema") || "auto";
      var oscuro = t === "oscuro" ||
        (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      var r = document.documentElement;
      r.setAttribute("data-tema", t);
      r.setAttribute("data-tema-efectivo", oscuro ? "oscuro" : "claro");
    } catch (e) {}
  })();
</script>
```

## Transición
Cross-fade de 180 ms en `background/color/border` **solo durante el cambio** (clase
temporal `.tema-cambiando` en `<html>`). Respeta `prefers-reduced-motion`: si está
activo, no hay transición.

## Cómo añadir un color nuevo sin romper el tema
1. Defínelo **solo en `shared/tokens.css`**, nunca en un componente.
2. Si es un color de marca, añade la primitiva en `:root` (claro) y su valor oscuro en
   `:root[data-tema-efectivo="oscuro"]`. Si es un alias, referéncialo con `var(--...)`.
3. Calcula el contraste con `shared/contraste.js` y añade el par a `PARES_OSCURO` en
   `test/tema.test.js` (debe cumplir AA). El test `CERO colores hardcodeados` falla si
   pones un `#`/`rgb()` fuera de `tokens.css`.

## Paleta oscura y contrastes
Ver la tabla completa en `docs/TEMA-OSCURO-ANALISIS.md`. Contraste mínimo alcanzado:
**4.89:1** (texto atenuado sobre superficie elevada) para texto; **3.96:1** para
elementos de interfaz (foco). Todos ≥ AA.

## Nota
El **PDF exportado va siempre en claro** (es un documento, no depende del tema de la UI).
