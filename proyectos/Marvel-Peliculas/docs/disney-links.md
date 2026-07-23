# Enlaces "Ver en Disney+" — investigación, verificación y recomendación

**Fecha:** 2026-07-23 · **Objetivo:** arreglar los enlaces "Ver en Disney+" del MCU Tracker (`index.html`).

---

## 0. Resumen ejecutivo (TL;DR)

- **El formato actual está roto de raíz.** `https://www.disneyplus.com/search?q=<título>` devuelve **HTTP 404** (página de error real de Disney+). Disney+ **no tiene ninguna URL pública de búsqueda con parámetro `?q=`**: todas las variantes de `/search` (`/search`, `/es-es/search`, `/browse/search`, `/search/<texto>`) dan 404. Por eso "no funciona ninguno".
- **Lo que SÍ funciona:** la URL directa a la ficha del título:
  `https://www.disneyplus.com/es-es/browse/entity-<uuid>`
  Un UUID válido devuelve **200**; uno inválido devuelve **404**. Es decir, curl **sí distingue** una ficha real de una inexistente.
- **Recomendación:** sustituir `disneyUrl(it)` por una tabla `DISNEY_DIRECT` de fichas directas **verificadas** (58 entradas, cubre todo lo estrenado y en catálogo) + un *fallback* robusto para títulos sin ficha (no estrenados / no disponibles). Ver §1.

### Qué se verificó realmente (honestidad sobre el método)

Un `curl` comprueba dos cosas de forma fiable, **sin sesión iniciada**:
1. **Que la URL resuelve** (código HTTP final tras redirecciones): 200 = la ficha existe en el grafo de catálogo de Disney; 404 = no existe.
2. **A qué título corresponde**, porque Disney+ **prerenderiza metadatos SEO** (`<meta property="og:title">`) en el HTML servido. Ej.: la ficha de Loki devuelve `og:title = "Ver los episodios completos de Loki | Disney+"`. Eso confirma que el UUID apunta al título correcto y en español.

Lo que **NO** puede comprobar un curl: la **reproducción real** ni la **disponibilidad de licencia en España** para tu cuenta. Eso requiere sesión iniciada en Disney+ ES. Un `200` con `og:title` correcto es evidencia fuerte de que la ficha existe y está localizada en español, pero la disponibilidad final de reproducción no es verificable por este medio.

---

## 1. Recomendación + función `disneyUrl(it)` lista para pegar

**Estrategia:** ficha directa verificada por título (`DISNEY_DIRECT`); si el título no está en el mapa (no estrenado, o no está en Disney+), *fallback* a una búsqueda de Google acotada a Disney+ — porque **Disney+ no admite deep-link de búsqueda** y enviar a `/search` daría un 404. El fallback resuelve en cualquier región y lleva al usuario a la ficha correcta.

```js
/* ============ Disney+ : enlaces directos verificados ============
   Disney+ NO tiene URL pública de búsqueda (/search?q= -> 404).
   La única URL fiable es la ficha directa: /es-es/browse/entity-<uuid>
   (200 si el UUID existe, 404 si no). Verificado con curl el 2026-07-23.
   Para cambiar de región cambia el segmento 'es-es' (p.ej. 'en-gb', 'es-419')
   o quítalo por completo (Disney redirige a la región del usuario).
   Las claves DEBEN coincidir EXACTAMENTE con it.t del dataset ALL_ITEMS. */
const DISNEY_DIRECT = {
  "Iron Man": "https://www.disneyplus.com/es-es/browse/entity-0c520152-b81f-4c20-9310-003debd1947e",
  "El Increíble Hulk": "https://www.disneyplus.com/es-es/browse/entity-30d00f7b-331a-4f43-b9e1-1989d39cb1a3",
  "Iron Man 2": "https://www.disneyplus.com/es-es/browse/entity-85c5529d-c053-4fa4-9957-4906eb5aedc6",
  "Thor": "https://www.disneyplus.com/es-es/browse/entity-479d41e3-8438-4ba4-b93d-8223220e069c",
  "Capitán América: El Primer Vengador": "https://www.disneyplus.com/es-es/browse/entity-8e68c43a-117c-4f4d-b217-0db106a1a614",
  "Los Vengadores": "https://www.disneyplus.com/es-es/browse/entity-3a5596d6-5133-4a8e-8d21-00e1531a4e0f",
  "Iron Man 3": "https://www.disneyplus.com/es-es/browse/entity-e8569c2d-85ec-42a4-8811-b2618d494a40",
  "Thor: El Mundo Oscuro": "https://www.disneyplus.com/es-es/browse/entity-7c4f4e28-4152-4f64-90ec-8b7f682c33d4",
  "Capitán América: El Soldado de Invierno": "https://www.disneyplus.com/es-es/browse/entity-ef333a5c-b855-4d3e-a7d9-d9e142b6dc7d",
  "Guardianes de la Galaxia": "https://www.disneyplus.com/es-es/browse/entity-c9ee959b-7249-4a4c-9708-9ffd1ddb00f1",
  "Vengadores: La Era de Ultrón": "https://www.disneyplus.com/es-es/browse/entity-39740da6-d484-471b-8dd7-a70c6151d705",
  "Ant-Man": "https://www.disneyplus.com/es-es/browse/entity-af42798c-b9db-457f-b748-5e1f029c1ece",
  "Capitán América: Civil War": "https://www.disneyplus.com/es-es/browse/entity-2fe7e94e-8b24-4a75-8fc8-969c2a16959e",
  "Doctor Strange": "https://www.disneyplus.com/es-es/browse/entity-43a741e8-2369-4577-9bec-ef94f4aaae0b",
  "Guardianes de la Galaxia Vol. 2": "https://www.disneyplus.com/es-es/browse/entity-9fcd7087-c151-49dc-aeb9-b2f9943fd4e6",
  "Spider-Man: Homecoming": "https://www.disneyplus.com/es-es/browse/entity-5b2b999a-045e-4d89-af52-390c257178db",
  "Thor: Ragnarok": "https://www.disneyplus.com/es-es/browse/entity-766280de-0c00-4781-a388-2c85c5b4e259",
  "Black Panther": "https://www.disneyplus.com/es-es/browse/entity-8904b1b5-da2c-4ff1-b389-dc81825559fd",
  "Vengadores: Infinity War": "https://www.disneyplus.com/es-es/browse/entity-9a136e06-852a-41bf-b71d-fa061cb43225",
  "Ant-Man y la Avispa": "https://www.disneyplus.com/es-es/browse/entity-3533ca7b-e187-4bf5-a65c-7c903cd2d4ad",
  "Capitana Marvel": "https://www.disneyplus.com/es-es/browse/entity-1e383a14-1ea6-4345-9ab8-fd37618669af",
  "Vengadores: Endgame": "https://www.disneyplus.com/es-es/browse/entity-b39aa962-be56-4b09-a536-98617031717f",
  "Spider-Man: Lejos de Casa": "https://www.disneyplus.com/es-es/browse/entity-2ca3cca0-bd2b-4934-93c0-c03d27fb249e",
  "WandaVision": "https://www.disneyplus.com/es-es/browse/entity-90affd1f-0851-48bc-9cab-c142d5c9c20c",
  "Falcon y el Soldado de Invierno": "https://www.disneyplus.com/es-es/browse/entity-3c08a31a-2350-4aaf-90d0-88def4c551bf",
  "Loki (Temporada 1)": "https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50",
  "Black Widow": "https://www.disneyplus.com/es-es/browse/entity-d9cd6bd1-bcf8-4a3b-8f92-0fdd4f79ac08",
  "What If...? (Temporada 1)": "https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f",
  "Shang-Chi y la Leyenda de los Diez Anillos": "https://www.disneyplus.com/es-es/browse/entity-92243dd0-bcfe-4365-ae76-1fa3cf1a2ab9",
  "Eternals": "https://www.disneyplus.com/es-es/browse/entity-b042efa2-6650-48fd-bf35-ea285a5a5649",
  "Hawkeye": "https://www.disneyplus.com/es-es/browse/entity-128482e8-a9bc-4289-9c0d-83a975d823f3",
  "Moon Knight": "https://www.disneyplus.com/es-es/browse/entity-330062c7-20c5-45e1-b6c5-e1e096055d75",
  "Doctor Strange en el Multiverso de la Locura": "https://www.disneyplus.com/es-es/browse/entity-2f51b691-b22a-42be-9c19-6bbabd2563e4",
  "Ms. Marvel": "https://www.disneyplus.com/es-es/browse/entity-7bf8d7e6-9739-4fee-86c0-f4afc48b152c",
  "Thor: Love and Thunder": "https://www.disneyplus.com/es-es/browse/entity-0007d7a0-2515-411e-9294-2de6a7b8d00e",
  "She-Hulk: Abogada Hulka": "https://www.disneyplus.com/es-es/browse/entity-b1c3c897-b925-4236-88e4-1ceed3623a46",
  "Werewolf by Night": "https://www.disneyplus.com/es-es/browse/entity-ad2fd4e8-062b-45b9-b2c5-8b8779873e48",
  "Black Panther: Wakanda Forever": "https://www.disneyplus.com/es-es/browse/entity-86e14fdb-3841-4282-ad38-07c8c4aab4b6",
  "Guardianes de la Galaxia: Especial Felices Fiestas": "https://www.disneyplus.com/es-es/browse/entity-1a15fe60-3236-4242-a699-a4e3392cf112",
  "Ant-Man y la Avispa: Quantumanía": "https://www.disneyplus.com/es-es/browse/entity-eb1453f3-48aa-4af0-85f5-8ca4916c7415",
  "Guardianes de la Galaxia Vol. 3": "https://www.disneyplus.com/es-es/browse/entity-820f0ded-3254-42c5-a7e4-7c044ff6dd65",
  "Secret Invasion": "https://www.disneyplus.com/es-es/browse/entity-4cfe6313-7f5e-4544-af84-d31bf718f65a",
  "Loki (Temporada 2)": "https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50",
  "The Marvels": "https://www.disneyplus.com/es-es/browse/entity-75c90eca-8969-4edb-ac1a-7165cff2671c",
  "What If...? (Temporada 2)": "https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f",
  "Echo": "https://www.disneyplus.com/es-es/browse/entity-3c9aa47d-88c2-455b-a63b-4be76b666a55",
  "Deadpool y Lobezno": "https://www.disneyplus.com/es-es/browse/entity-120ae1e6-2240-4924-a4ce-f8de6e28b0b1",
  "Agatha All Along": "https://www.disneyplus.com/es-es/browse/entity-5e474669-a4a2-4b90-a928-5ae7f845090c",
  "What If...? (Temporada 3)": "https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f",
  "Capitán América: Brave New World": "https://www.disneyplus.com/es-es/browse/entity-3064ac7f-ef4d-4f89-b92f-b5524da92a72",
  "Daredevil: Born Again (Temporada 1)": "https://www.disneyplus.com/es-es/browse/entity-85e7a914-c8e6-41db-95df-c740dc2cf1b7",
  "Thunderbolts*": "https://www.disneyplus.com/es-es/browse/entity-f51dce23-7d8f-490a-9f0c-be1b5432c2a9",
  "Ironheart": "https://www.disneyplus.com/es-es/browse/entity-b2b50b9a-a055-4b31-a609-8ec46f3add98",
  "Los Cuatro Fantásticos: Primeros Pasos": "https://www.disneyplus.com/es-es/browse/entity-2142a7a9-4c49-438d-a492-296c4e08b714",
  "Eyes of Wakanda": "https://www.disneyplus.com/es-es/browse/entity-8d16eb3d-b7e5-4c43-abda-a281be4d284a",
  "Marvel Zombies": "https://www.disneyplus.com/es-es/browse/entity-d274138a-7c29-4ddf-9ea2-2f9d3c1a24a0",
  "Wonder Man": "https://www.disneyplus.com/es-es/browse/entity-555c5896-02e4-4873-8fa9-ce090dcd874b",
  "Daredevil: Born Again (Temporada 2)": "https://www.disneyplus.com/es-es/browse/entity-85e7a914-c8e6-41db-95df-c740dc2cf1b7"
};

function disneyUrl(it){
  const direct = DISNEY_DIRECT[it.t];
  if (direct) return direct;
  // Sin ficha directa (no estrenado o no disponible en Disney+).
  // Disney+ no tiene deep-link de búsqueda (/search?q= -> 404), así que
  // usamos una búsqueda de Google acotada, robusta en cualquier región.
  return 'https://www.google.com/search?q=' + encodeURIComponent((it.q || it.t) + ' Disney+');
}
```

**Notas de mantenimiento**
- El `og:title` de algunas fichas en `es-es` viene con el prerender vacío (caché SEO irregular de Disney: p. ej. Iron Man y WandaVision no prerenderizan en `es-es` pero **sí** en `en-gb` con el título correcto). No afecta al usuario final: la URL resuelve **200** y la app carga la ficha por cliente. Los UUID se confirmaron correctos por región cruzada.
- Los UUID "antiguos" (de Wikidata) que Disney ha migrado hacen **307 → 200** hacia el UUID vigente automáticamente (visto en las dos de Spider-Man), así que siguen siendo válidos.
- Series con varias temporadas comparten **una sola ficha** (mismo UUID): Loki T1/T2, What If…? T1/T2/T3, Daredevil: Born Again T1/T2.
- Si prefieres no fijar idioma, quita `es-es/` de las URLs: `…/browse/entity-<uuid>` también devuelve 200 y Disney redirige a la región del usuario logueado.

---

## 2. Candidatos de URL de BÚSQUEDA probados con curl

Método: `curl -sIL -A "Mozilla/5.0 …" -o /dev/null -w "%{http_code} -> %{url_effective}"` (HEAD siguiendo redirecciones) y confirmado con GET (`-sL`, inspeccionando `<title>` del cuerpo).

| # | URL candidata | Código final | Redirección / resultado | ¿Sirve? |
|---|---------------|:---:|---|:---:|
| 1 | `https://www.disneyplus.com/search?q=loki` | **404** | Sin redirección. Página de error. | ❌ |
| 2 | `https://www.disneyplus.com/es-es/search?q=loki` | **404** | GET → cuerpo real con `<title>No podemos encontrar la página que buscas.</title>` | ❌ |
| 3 | `https://www.disneyplus.com/browse/search?q=loki` | **404** | Redirige a `/browse/page-78d5fc4d-…` y termina en 404 | ❌ |
| 4 | `https://www.disneyplus.com/es-es/browse/search?q=loki` | **404** | Igual que #3 con prefijo región | ❌ |
| 5 | `https://www.disneyplus.com/search/loki` | **404** | Sin redirección. Error. | ❌ |
| 6 | `https://www.disneyplus.com/es-es/search/loki` | **404** | Sin redirección. Error. | ❌ |
| 7 | `https://www.disneyplus.com/search` | **404** | Sin redirección. Error. | ❌ |
| 8 | `https://www.disneyplus.com/es-es/search` | **404** | Sin redirección. Error. | ❌ |

**Conclusión:** ninguna URL de búsqueda funciona. El buscador de Disney+ vive **solo dentro de la app autenticada** y **no acepta parámetro de consulta** por URL. Confirma el problema del cliente.

### Rutas base de control (para demostrar que el 404 anterior es real y no un bloqueo genérico)

| URL | Código | Resultado |
|-----|:---:|---|
| `https://www.disneyplus.com/` | **200** | Home global |
| `https://www.disneyplus.com/es-es` | **200** | Home España |
| `https://www.disneyplus.com/es-es/home` | **200** | `<title>Disney+ | Películas y series</title>` |
| `https://www.disneyplus.com/login` | **200** | Redirige a `/identity/login` |

### Formato de ficha directa (el que SÍ funciona)

| URL | Código | og:title / observación |
|-----|:---:|---|
| `…/es-es/browse/entity-8f8c5cbb-…` (Loki) | **200** | `Ver los episodios completos de Loki \| Disney+` |
| `…/es-es/browse/entity-ee4f01fd-…` (ejemplo real) | **200** | Ficha válida |
| `…/browse/entity-ee4f01fd-…` (sin región) | **200** | Válida; Disney redirige a región |
| `…/es-es/browse/entity-00000000-0000-0000-0000-000000000000` (UUID falso) | **404** | `The page you were looking for cannot be found.` |

El contraste 200 (UUID válido) vs 404 (UUID falso) demuestra que **curl valida realmente la existencia de la ficha**.

---

## 3. `DISNEY_DIRECT` — fichas directas verificadas (58 entradas)

Todas verificadas el **2026-07-23** con `curl -sL` contra `https://www.disneyplus.com/es-es/browse/entity-<uuid>` → **HTTP 200**. UUIDs obtenidos de Wikidata (propiedad **P13902 = "Disney+ browse ID"**, 2.900 registros) y cotejados por `og:title` en español. El mapa JS completo está en §1.

| Título (it.t exacto) | Código | `og:title` observado (es-es, salvo nota) |
|---|:---:|---|
| Iron Man | 200 | *(prerender es-es vacío;* `en-gb` = "Watch Iron Man"*)* |
| El Increíble Hulk | 200 | *(es-es vacío;* `en-gb` = "Watch The Incredible Hulk"*)* ⚠ ver §4 |
| Iron Man 2 | 200 | Ver Marvel Studios' Iron Man 2 |
| Thor | 200 | Ver Thor |
| Capitán América: El Primer Vengador | 200 | Ver Capitán América: El Primer Vengador |
| Los Vengadores | 200 | Ver Los Vengadores |
| Iron Man 3 | 200 | Ver Iron Man 3 |
| Thor: El Mundo Oscuro | 200 | Ver Thor: El Mundo Oscuro |
| Capitán América: El Soldado de Invierno | 200 | Ver Capitán América: El Soldado de Invierno |
| Guardianes de la Galaxia | 200 | Ver Guardianes de la galaxia |
| Vengadores: La Era de Ultrón | 200 | Ver Vengadores: La era de Ultrón |
| Ant-Man | 200 | Ver Ant-Man *(descartado el corto homónimo, UUID 0c6b63b2)* |
| Capitán América: Civil War | 200 | Ver Capitán América: Civil War |
| Doctor Strange | 200 | Ver Doctor Strange (Doctor Extraño) |
| Guardianes de la Galaxia Vol. 2 | 200 | Ver Guardianes de la galaxia vol.2 |
| Spider-Man: Homecoming | 200 | Ver Spider-Man™: Homecoming *(307→200 a UUID vigente)* ⚠ ver §4 |
| Thor: Ragnarok | 200 | Ver Marvel Studios' Thor: Ragnarok |
| Black Panther | 200 | Ver Black Panther |
| Vengadores: Infinity War | 200 | Ver Vengadores: Infinity War |
| Ant-Man y la Avispa | 200 | Ver Ant-Man y la Avispa |
| Capitana Marvel | 200 | Ver Capitana Marvel |
| Vengadores: Endgame | 200 | Ver Vengadores : Endgame |
| Spider-Man: Lejos de Casa | 200 | Ver Spider-Man™: Far From Home *(307→200 a UUID vigente)* ⚠ ver §4 |
| WandaVision | 200 | *(es-es vacío;* `en-gb` = "Watch WandaVision \| Full episodes"*)* |
| Falcon y el Soldado de Invierno | 200 | Ver los episodios completos de Falcon y el Soldado de Invierno |
| Loki (Temporada 1) | 200 | Ver los episodios completos de Loki |
| Black Widow | 200 | Ver Viuda Negra |
| What If...? (Temporada 1) | 200 | Ver los episodios completos de ¿Qué pasaría si…? |
| Shang-Chi y la Leyenda de los Diez Anillos | 200 | Ver Shang-Chi y la leyenda de Los Diez Anillos |
| Eternals | 200 | Ver Eternals |
| Hawkeye | 200 | Ver los episodios completos de Ojo de Halcón |
| Moon Knight | 200 | Ver los episodios completos de Caballero Luna |
| Doctor Strange en el Multiverso de la Locura | 200 | Ver Doctor Strange en el multiverso de la locura |
| Ms. Marvel | 200 | Ver los episodios completos de Ms. Marvel |
| Thor: Love and Thunder | 200 | Ver Thor: Love and Thunder |
| She-Hulk: Abogada Hulka | 200 | Ver los episodios completos de She-Hulk: abogada Hulka |
| Werewolf by Night | 200 | Ver La maldición del Hombre Lobo |
| Black Panther: Wakanda Forever | 200 | Ver Black Panther: Wakanda Forever |
| Guardianes de la Galaxia: Especial Felices Fiestas | 200 | Ver … Guardianes de la Galaxia: especial felices fiestas |
| Ant-Man y la Avispa: Quantumanía | 200 | Ver Ant-Man y la Avispa: Quantumanía |
| Guardianes de la Galaxia Vol. 3 | 200 | Ver Guardianes de la Galaxia: Volumen 3 |
| Secret Invasion | 200 | Ver los episodios completos de Invasión secreta |
| Loki (Temporada 2) | 200 | *(misma ficha que T1)* Ver los episodios completos de Loki |
| The Marvels | 200 | Ver The Marvels |
| What If...? (Temporada 2) | 200 | *(misma ficha que T1)* |
| Echo | 200 | Ver los episodios completos de Echo |
| Deadpool y Lobezno | 200 | Ver Deadpool y Lobezno |
| Agatha All Along | 200 | Ver los episodios completos de Agatha ¿quién si no? |
| What If...? (Temporada 3) | 200 | *(misma ficha que T1)* |
| Capitán América: Brave New World | 200 | Ver Capitán América: Brave New World |
| Daredevil: Born Again (Temporada 1) | 200 | Ver los episodios completos de Daredevil: Born Again |
| Thunderbolts* | 200 | Ver Thunderbolts* |
| Ironheart | 200 | Ver los episodios completos de Ironheart |
| Los Cuatro Fantásticos: Primeros Pasos | 200 | Ver Los 4 Fantásticos: Primeros pasos |
| Eyes of Wakanda | 200 | Ver los episodios completos de Los ojos de Wakanda |
| Marvel Zombies | 200 | Ver los episodios completos de Marvel Zombis |
| Wonder Man | 200 | Ver los episodios completos de Wonder Man |
| Daredevil: Born Again (Temporada 2) | 200 | *(misma ficha que T1)* Ver los episodios completos de Daredevil: Born Again |

---

## 4. Títulos del tracker SIN ficha directa (usan el *fallback* de Google)

Estos títulos **no** están en `DISNEY_DIRECT`. `disneyUrl(it)` los envía a `google.com/search?q=<título> Disney+`.

| Título | Motivo | Estado verificado |
|---|---|---|
| **Spider-Man: No Way Home** | Sony. **No existe** browse ID en Wikidata (2.900 registros) → sin ficha en Disney+. | Confirmado ausente en el dataset |
| **Spider-Man: Brand New Day** | Sony. Estreno jul-2026; aún no en catálogo. | Sin browse ID |
| **VisionQuest** | Serie no estrenada (finales 2026). | Sin browse ID |
| **Vengadores: Doomsday** | Película no estrenada (dic-2026). | Sin browse ID |

### Matiz importante frente a la suposición inicial (honestidad)

La tarea asumía que **El Increíble Hulk** (Universal) y **Spider-Man: Homecoming / Lejos de Casa** (Sony) **no** estarían en Disney+ ES. **La evidencia por curl indica lo contrario en 2026:**

- **El Increíble Hulk** → ficha 200; prerender en `en-gb` = "Watch The Incredible Hulk | Disney+". Está en Disney+ (confirmado US/UK). Disney recuperó la distribución; disponibilidad de reproducción en ES no verificable sin sesión, pero la ficha resuelve.
- **Spider-Man: Homecoming** y **Spider-Man: Lejos de Casa** → ficha 200 con **`og:title` en español** ("Ver Spider-Man™: Homecoming | Disney+") tras un **307 → 200** hacia el UUID vigente en el catálogo ES. Es decir, tienen página localizada en Disney+ **ES** (probablemente vía la ventana de licencia Sony–Disney). Por eso se incluyen en `DISNEY_DIRECT`.

**No Way Home** sigue **sin** ficha (no está en Disney+), coherente con la suposición. Solo **No Way Home** entre los estrenados de Spider-Man queda fuera.

> Recomendación práctica: si prefieres ser conservador y no arriesgar un enlace a una ficha que quizá no sea reproducible en la cuenta del usuario en España, puedes **sacar de `DISNEY_DIRECT`** las tres marcadas con ⚠ (El Increíble Hulk, Homecoming, Lejos de Casa) para que caigan al *fallback* de Google. Su ficha responde 200 hoy, pero es la que más riesgo de licencia regional tiene.

---

## 5. Evidencia de método (reproducible)

```bash
# 1) La búsqueda actual está rota (404 con página de error en español):
curl -sL -A "Mozilla/5.0" -o /dev/null -w "%{http_code} %{url_effective}\n" \
  "https://www.disneyplus.com/es-es/search?q=loki"          # -> 404

# 2) La ficha directa funciona (200) y un UUID falso da 404:
curl -sI -A "Mozilla/5.0" -o /dev/null -w "%{http_code}\n" \
  "https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50"   # -> 200 (Loki)
curl -sI -A "Mozilla/5.0" -o /dev/null -w "%{http_code}\n" \
  "https://www.disneyplus.com/es-es/browse/entity-00000000-0000-0000-0000-000000000000"   # -> 404

# 3) Confirmar el título de una ficha por su og:title:
curl -s -A "Mozilla/5.0" "https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50" \
  | grep -o '<meta property="og:title" content="[^"]*"'
# -> content="Ver los episodios completos de Loki | Disney+"

# 4) Fuente de los UUID: Wikidata SPARQL, propiedad P13902 (Disney+ browse ID)
#    https://query.wikidata.org/sparql  ->  SELECT ?item ?itemLabel ?browseId WHERE { ?item wdt:P13902 ?browseId }
```

**Fuentes:**
- [Wikidata SPARQL — propiedad P13902 "Disney+ browse ID"](https://query.wikidata.org/) (2.900 fichas)
- [Template:Disney+ browse — Wikipedia](https://en.wikipedia.org/wiki/Template:Disney%2B_browse) (documenta el formato `www.disneyplus.com/browse/entity-<id>`)
- Verificación en vivo con `curl` contra `www.disneyplus.com` (2026-07-23)
