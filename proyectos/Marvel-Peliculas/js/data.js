/* ================================================================
   MCU TRACKER — DATOS DE CONTENIDO (js/data.js)
   Extraído del <script> inline de index.html (reestructura 2026-07-23).
   Se carga con <script src> DESPUÉS de js/images-posters.js y ANTES
   de js/app.js. Declara en el ámbito global: DATA, XMEN_DATA,
   PRESET_VISTO.

   CONTRATO INTOCABLE (CLAUDE.md): el campo `t` es la clave primaria
   de state/ratings/POSTERS_LOCAL. No renombrar ningún `t` publicado.

   m = duración total en minutos (en series, suma de todos los episodios).
   est:true = duración estimada (título sin metraje oficial confirmado;
   se muestra con «≈»).
   ================================================================ */

const DATA=[
 {phase:"Fase 1",years:"2008 – 2012",items:[
  {t:"Iron Man",d:"Mayo 2008",type:"film",m:126},
  {t:"El Increíble Hulk",d:"Junio 2008",type:"film",q:"The Incredible Hulk 2008",m:112},
  {t:"Iron Man 2",d:"Mayo 2010",type:"film",m:124},
  {t:"Thor",d:"Mayo 2011",type:"film",q:"Thor 2011 pelicula",m:115},
  {t:"Capitán América: El Primer Vengador",d:"Julio 2011",type:"film",m:124},
  {t:"Los Vengadores",d:"Mayo 2012",type:"film",q:"The Avengers 2012",m:143},
 ]},
 {phase:"Fase 2",years:"2013 – 2015",items:[
  {t:"Iron Man 3",d:"Mayo 2013",type:"film",m:130},
  {t:"Thor: El Mundo Oscuro",d:"Noviembre 2013",type:"film",m:112},
  {t:"Capitán América: El Soldado de Invierno",d:"Abril 2014",type:"film",m:136},
  {t:"Guardianes de la Galaxia",d:"Agosto 2014",type:"film",m:121},
  {t:"Vengadores: La Era de Ultrón",d:"Mayo 2015",type:"film",m:141},
  {t:"Ant-Man",d:"Julio 2015",type:"film",m:117},
 ]},
 {phase:"Fase 3",years:"2016 – 2019",items:[
  {t:"Capitán América: Civil War",d:"Mayo 2016",type:"film",m:147},
  {t:"Doctor Strange",d:"Noviembre 2016",type:"film",m:115},
  {t:"Guardianes de la Galaxia Vol. 2",d:"Mayo 2017",type:"film",m:136},
  {t:"Spider-Man: Homecoming",d:"Julio 2017",type:"film",m:133},
  {t:"Thor: Ragnarok",d:"Noviembre 2017",type:"film",m:130},
  {t:"Black Panther",d:"Febrero 2018",type:"film",m:134},
  {t:"Vengadores: Infinity War",d:"Abril 2018",type:"film",m:149},
  {t:"Ant-Man y la Avispa",d:"Julio 2018",type:"film",m:118},
  {t:"Capitana Marvel",d:"Marzo 2019",type:"film",m:123},
  {t:"Vengadores: Endgame",d:"Abril 2019",type:"film",m:181},
  {t:"Spider-Man: Lejos de Casa",d:"Julio 2019",type:"film",m:129},
 ]},
 {phase:"Fase 4",years:"2021 – 2022",items:[
  {t:"WandaVision",d:"Enero 2021",type:"serie",m:360},
  {t:"Falcon y el Soldado de Invierno",d:"Marzo 2021",type:"serie",m:305},
  {t:"Loki (Temporada 1)",d:"Junio 2021",type:"serie",q:"Loki serie temporada 1",m:285},
  {t:"Black Widow",d:"Julio 2021",type:"film",m:134},
  {t:"What If...? (Temporada 1)",d:"Agosto 2021",type:"serie",q:"What If Marvel temporada 1",m:280},
  {t:"Shang-Chi y la Leyenda de los Diez Anillos",d:"Septiembre 2021",type:"film",m:132},
  {t:"Eternals",d:"Noviembre 2021",type:"film",m:156},
  {t:"Hawkeye",d:"Noviembre 2021",type:"serie",q:"Hawkeye serie Marvel",m:290},
  {t:"Spider-Man: No Way Home",d:"Diciembre 2021",type:"film",m:148},
  {t:"Moon Knight",d:"Marzo 2022",type:"serie",m:280},
  {t:"Doctor Strange en el Multiverso de la Locura",d:"Mayo 2022",type:"film",m:126},
  {t:"Ms. Marvel",d:"Junio 2022",type:"serie",m:265},
  {t:"Thor: Love and Thunder",d:"Julio 2022",type:"film",m:119},
  {t:"She-Hulk: Abogada Hulka",d:"Agosto 2022",type:"serie",m:290},
  {t:"Werewolf by Night",d:"Octubre 2022",type:"especial",m:53},
  {t:"Black Panther: Wakanda Forever",d:"Noviembre 2022",type:"film",m:161},
  {t:"Guardianes de la Galaxia: Especial Felices Fiestas",d:"Noviembre 2022",type:"especial",q:"Guardians of the Galaxy Holiday Special",m:44},
 ]},
 {phase:"Fase 5",years:"2023 – 2025",items:[
  {t:"Ant-Man y la Avispa: Quantumanía",d:"Febrero 2023",type:"film",m:124},
  {t:"Guardianes de la Galaxia Vol. 3",d:"Mayo 2023",type:"film",m:150},
  {t:"Secret Invasion",d:"Junio 2023",type:"serie",q:"Secret Invasion serie Marvel",m:260},
  {t:"Loki (Temporada 2)",d:"Octubre 2023",type:"serie",q:"Loki temporada 2",m:305},
  {t:"The Marvels",d:"Noviembre 2023",type:"film",m:105},
  {t:"What If...? (Temporada 2)",d:"Diciembre 2023",type:"serie",q:"What If Marvel temporada 2",m:285},
  {t:"Echo",d:"Enero 2024",type:"serie",q:"Echo serie Marvel",m:210},
  {t:"Deadpool y Lobezno",d:"Julio 2024",type:"film",q:"Deadpool Wolverine 2024",m:128},
  {t:"Agatha All Along",d:"Septiembre 2024",type:"serie",m:325},
  {t:"What If...? (Temporada 3)",d:"Diciembre 2024",type:"serie",q:"What If Marvel temporada 3",m:240},
  {t:"Capitán América: Brave New World",d:"Febrero 2025",type:"film",m:118},
  {t:"Daredevil: Born Again (Temporada 1)",d:"Marzo 2025",type:"serie",q:"Daredevil Born Again temporada 1",m:450},
  {t:"Thunderbolts*",d:"Mayo 2025",type:"film",q:"Thunderbolts 2025 pelicula",m:127},
  {t:"Ironheart",d:"Junio 2025",type:"serie",q:"Ironheart serie Marvel",m:265},
  {t:"Los Cuatro Fantásticos: Primeros Pasos",d:"Julio 2025",type:"film",q:"Fantastic Four First Steps",m:115},
 ]},
 {phase:"Fase 6",years:"2025 – 2026",items:[
  {t:"Eyes of Wakanda",d:"Agosto 2025",type:"serie",m:120},
  {t:"Marvel Zombies",d:"Octubre 2025",type:"serie",q:"Marvel Zombies serie 2025",m:120},
  {t:"Wonder Man",d:"Enero 2026",type:"serie",q:"Wonder Man serie Marvel 2026",m:210,est:true},
  {t:"Daredevil: Born Again (Temporada 2)",d:"Marzo 2026",type:"serie",q:"Daredevil Born Again temporada 2",m:400,est:true},
  {t:"Spider-Man: Brand New Day",d:"Julio 2026",type:"film",m:130,est:true},
  {t:"VisionQuest",d:"Finales 2026 (estimado)",type:"serie",q:"VisionQuest serie Marvel",m:300,est:true},
  {t:"Vengadores: Doomsday",d:"Diciembre 2026",type:"film",q:"Avengers Doomsday 2026",m:160,est:true},
 ]},
];

/* ============ SAGA X-MEN (pestaña propia; también suma al progreso global) ============ */
const XMEN_DATA=[
 {phase:"Películas y series",years:"1992 – 2024",items:[
  {t:"X-Men: La Serie Animada",d:"1992 – 1997",type:"serie",q:"X-Men serie animada 1992",m:1670},
  {t:"X-Men",d:"Agosto 2000",type:"film",q:"X-Men 2000 pelicula",m:104},
  {t:"X-Men: Evolución",d:"2000 – 2003",type:"serie",q:"X-Men Evolution serie animada",m:1090},
  {t:"X-Men 2",d:"Mayo 2003",type:"film",q:"X2 X-Men United",m:134},
  {t:"X-Men: La Decisión Final",d:"Mayo 2006",type:"film",q:"X-Men The Last Stand",m:104},
  {t:"Lobezno y los X-Men",d:"Enero 2009",type:"serie",q:"Wolverine and the X-Men serie animada",m:570},
  {t:"X-Men Orígenes: Lobezno",d:"Mayo 2009",type:"film",q:"X-Men Origins Wolverine",m:107},
  {t:"X-Men: Primera Generación",d:"Junio 2011",type:"film",q:"X-Men First Class",m:132},
  {t:"Lobezno Inmortal",d:"Julio 2013",type:"film",q:"The Wolverine 2013",m:126},
  {t:"X-Men: Días del Futuro Pasado",d:"Mayo 2014",type:"film",q:"X-Men Days of Future Past",m:132},
  {t:"Deadpool",d:"Febrero 2016",type:"film",q:"Deadpool 2016 pelicula",m:108},
  {t:"X-Men: Apocalipsis",d:"Mayo 2016",type:"film",q:"X-Men Apocalypse",m:144},
  {t:"Legion",d:"2017 – 2019",type:"serie",q:"Legion serie FX Marvel",m:1350},
  {t:"Logan",d:"Marzo 2017",type:"film",q:"Logan 2017 pelicula",m:137},
  {t:"The Gifted",d:"2017 – 2019",type:"serie",q:"The Gifted serie mutantes",m:1245},
  {t:"Deadpool 2",d:"Mayo 2018",type:"film",m:119},
  {t:"X-Men: Fénix Oscura",d:"Junio 2019",type:"film",q:"X-Men Dark Phoenix",m:113},
  {t:"Los Nuevos Mutantes",d:"Agosto 2020",type:"film",q:"The New Mutants 2020",m:94},
  {t:"X-Men '97",d:"Marzo 2024",type:"serie",q:"X-Men 97 serie Disney+",m:290},
 ]},
];

const PRESET_VISTO=[
 "Iron Man","El Increíble Hulk","Iron Man 2","Thor","Capitán América: El Primer Vengador","Los Vengadores",
 "Iron Man 3","Thor: El Mundo Oscuro","Capitán América: El Soldado de Invierno","Guardianes de la Galaxia","Vengadores: La Era de Ultrón","Ant-Man",
 "Capitán América: Civil War","Doctor Strange","Guardianes de la Galaxia Vol. 2","Spider-Man: Homecoming","Thor: Ragnarok","Black Panther","Vengadores: Infinity War","Ant-Man y la Avispa","Capitana Marvel","Vengadores: Endgame","Spider-Man: Lejos de Casa",
 "Falcon y el Soldado de Invierno","Loki (Temporada 1)","Loki (Temporada 2)","Hawkeye","Eternals","Shang-Chi y la Leyenda de los Diez Anillos","Spider-Man: No Way Home","Black Widow","Thunderbolts*","Capitán América: Brave New World"
];
