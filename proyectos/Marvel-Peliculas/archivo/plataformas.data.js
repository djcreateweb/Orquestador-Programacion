// Disponibilidad por plataforma en España (ES). Verificado 2026-07-23.
// url = enlace directo a la ficha si existe (o null). status para no estrenados.
//
// Fuentes de verificación:
//   - Disney+  -> fichas /es-es/browse/entity-<uuid> comprobadas con curl (HTTP 200 + og:title en español).
//                UUIDs de Wikidata (propiedad P13902 "Disney+ browse ID").
//   - No-Disney/dudosos -> investigados en fuentes ES (JustWatch/eCartelera/prensa) por disponibilidad real.
//   - Claves = cadenas EXACTAS de it.t del tracker (ALL_ITEMS en index.html).
//
// Nombres normalizados: "Disney+", "Netflix", "Prime Video", "Movistar Plus+", "Max",
//   "SkyShowtime", "Apple TV", "Alquiler/Compra", "En cines", "Próximamente", "No disponible".
const PLATFORMS = {
  "Iron Man": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-0c520152-b81f-4c20-9310-003debd1947e" } ],
  "El Increíble Hulk": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-30d00f7b-331a-4f43-b9e1-1989d39cb1a3" } ],
  "Iron Man 2": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-85c5529d-c053-4fa4-9957-4906eb5aedc6" } ],
  "Thor": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-479d41e3-8438-4ba4-b93d-8223220e069c" } ],
  "Capitán América: El Primer Vengador": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-8e68c43a-117c-4f4d-b217-0db106a1a614" } ],
  "Los Vengadores": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-3a5596d6-5133-4a8e-8d21-00e1531a4e0f" } ],
  "Iron Man 3": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-e8569c2d-85ec-42a4-8811-b2618d494a40" } ],
  "Thor: El Mundo Oscuro": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-7c4f4e28-4152-4f64-90ec-8b7f682c33d4" } ],
  "Capitán América: El Soldado de Invierno": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-ef333a5c-b855-4d3e-a7d9-d9e142b6dc7d" } ],
  "Guardianes de la Galaxia": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-c9ee959b-7249-4a4c-9708-9ffd1ddb00f1" } ],
  "Vengadores: La Era de Ultrón": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-39740da6-d484-471b-8dd7-a70c6151d705" } ],
  "Ant-Man": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-af42798c-b9db-457f-b748-5e1f029c1ece" } ],
  "Capitán América: Civil War": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-2fe7e94e-8b24-4a75-8fc8-969c2a16959e" } ],
  "Doctor Strange": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-43a741e8-2369-4577-9bec-ef94f4aaae0b" } ],
  "Guardianes de la Galaxia Vol. 2": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-9fcd7087-c151-49dc-aeb9-b2f9943fd4e6" } ],
  "Spider-Man: Homecoming": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-5b2b999a-045e-4d89-af52-390c257178db" } ],
  "Thor: Ragnarok": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-766280de-0c00-4781-a388-2c85c5b4e259" } ],
  "Black Panther": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-8904b1b5-da2c-4ff1-b389-dc81825559fd" } ],
  "Vengadores: Infinity War": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-9a136e06-852a-41bf-b71d-fa061cb43225" } ],
  "Ant-Man y la Avispa": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-3533ca7b-e187-4bf5-a65c-7c903cd2d4ad" } ],
  "Capitana Marvel": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-1e383a14-1ea6-4345-9ab8-fd37618669af" } ],
  "Vengadores: Endgame": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-b39aa962-be56-4b09-a536-98617031717f" } ],
  "Spider-Man: Lejos de Casa": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-2ca3cca0-bd2b-4934-93c0-c03d27fb249e" } ],
  "WandaVision": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-90affd1f-0851-48bc-9cab-c142d5c9c20c" } ],
  "Falcon y el Soldado de Invierno": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-3c08a31a-2350-4aaf-90d0-88def4c551bf" } ],
  "Loki (Temporada 1)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50" } ],
  "Black Widow": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-d9cd6bd1-bcf8-4a3b-8f92-0fdd4f79ac08" } ],
  "What If...? (Temporada 1)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f" } ],
  "Shang-Chi y la Leyenda de los Diez Anillos": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-92243dd0-bcfe-4365-ae76-1fa3cf1a2ab9" } ],
  "Eternals": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-b042efa2-6650-48fd-bf35-ea285a5a5649" } ],
  "Hawkeye": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-128482e8-a9bc-4289-9c0d-83a975d823f3" } ],
  // Sony. NO está en Disney+ ES. En España: suscripción en Movistar Plus+; también alquiler/compra (Prime Video, Rakuten).
  "Spider-Man: No Way Home": [ { name:"Movistar Plus+", url:null }, { name:"Alquiler/Compra", url:null } ],
  "Moon Knight": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-330062c7-20c5-45e1-b6c5-e1e096055d75" } ],
  "Doctor Strange en el Multiverso de la Locura": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-2f51b691-b22a-42be-9c19-6bbabd2563e4" } ],
  "Ms. Marvel": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-7bf8d7e6-9739-4fee-86c0-f4afc48b152c" } ],
  "Thor: Love and Thunder": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-0007d7a0-2515-411e-9294-2de6a7b8d00e" } ],
  "She-Hulk: Abogada Hulka": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-b1c3c897-b925-4236-88e4-1ceed3623a46" } ],
  "Werewolf by Night": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-ad2fd4e8-062b-45b9-b2c5-8b8779873e48" } ],
  "Black Panther: Wakanda Forever": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-86e14fdb-3841-4282-ad38-07c8c4aab4b6" } ],
  "Guardianes de la Galaxia: Especial Felices Fiestas": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-1a15fe60-3236-4242-a699-a4e3392cf112" } ],
  "Ant-Man y la Avispa: Quantumanía": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-eb1453f3-48aa-4af0-85f5-8ca4916c7415" } ],
  "Guardianes de la Galaxia Vol. 3": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-820f0ded-3254-42c5-a7e4-7c044ff6dd65" } ],
  "Secret Invasion": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-4cfe6313-7f5e-4544-af84-d31bf718f65a" } ],
  "Loki (Temporada 2)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-8f8c5cbb-e5ba-4285-9e2c-86abcac9fd50" } ],
  "The Marvels": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-75c90eca-8969-4edb-ac1a-7165cff2671c" } ],
  "What If...? (Temporada 2)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f" } ],
  "Echo": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-3c9aa47d-88c2-455b-a63b-4be76b666a55" } ],
  "Deadpool y Lobezno": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-120ae1e6-2240-4924-a4ce-f8de6e28b0b1" } ],
  "Agatha All Along": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-5e474669-a4a2-4b90-a928-5ae7f845090c" } ],
  "What If...? (Temporada 3)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-fc588cfe-ff2b-4a44-abbd-d76359ce778f" } ],
  "Capitán América: Brave New World": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-3064ac7f-ef4d-4f89-b92f-b5524da92a72" } ],
  "Daredevil: Born Again (Temporada 1)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-85e7a914-c8e6-41db-95df-c740dc2cf1b7" } ],
  "Thunderbolts*": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-f51dce23-7d8f-490a-9f0c-be1b5432c2a9" } ],
  "Ironheart": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-b2b50b9a-a055-4b31-a609-8ec46f3add98" } ],
  "Los Cuatro Fantásticos: Primeros Pasos": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-2142a7a9-4c49-438d-a492-296c4e08b714" } ],
  "Eyes of Wakanda": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-8d16eb3d-b7e5-4c43-abda-a281be4d284a" } ],
  "Marvel Zombies": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-d274138a-7c29-4ddf-9ea2-2f9d3c1a24a0" } ],
  "Wonder Man": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-555c5896-02e4-4873-8fa9-ce090dcd874b" } ],
  "Daredevil: Born Again (Temporada 2)": [ { name:"Disney+", url:"https://www.disneyplus.com/es-es/browse/entity-85e7a914-c8e6-41db-95df-c740dc2cf1b7" } ],
  // No estrenados a 2026-07-23 -> status en vez de plataforma.
  "Spider-Man: Brand New Day": [ { name:"En cines", url:null } ],       // estreno cines jul 2026 (Sony)
  "VisionQuest": [ { name:"Próximamente", url:null } ],                  // serie sin estreno (finales 2026 est.)
  "Vengadores: Doomsday": [ { name:"Próximamente", url:null } ]         // película sin estreno (dic 2026)
};

// Export opcional para entornos con módulos; inofensivo como <script> clásico.
if (typeof module !== "undefined" && module.exports) { module.exports = { PLATFORMS }; }
