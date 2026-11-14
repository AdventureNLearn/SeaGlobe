/* SeaGlobe atlas schema: era bands, route types and the vehicle asset list.
   Years are astronomical: 1 BCE = 0, 500 BCE = -499. Labels convert back.
   New route types (land, river, rail, air, pipeline) add a file under
   data/routes/<type>.js with records in the same shape as data/routes/sea.js. */
(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).schema = {
  schema_version: 1,
  timeline: { min: -499, max: 2026, present: 2026 },
  eras: [
    { id: "classical",      name: "Classical",       from: -499, to: 299,  color: "#e7c766", showcase: "0060-05-01", camera: { lat: 33, lng: 30, altitude: 1.9 }, card: "assets/eras/era-classical.jpg", card_note: "Artistic impression (AI-generated); the sail emblem and prow are stylized, not historical." },
    { id: "late-antiquity", name: "Late Antiquity",  from: 300,  to: 699,  color: "#c9a2ff", showcase: "0450-06-01", camera: { lat: 37, lng: 45, altitude: 2.1 } },
    { id: "medieval",       name: "Medieval",        from: 700,  to: 1499, color: "#9ad0a8", showcase: "1320-05-01", camera: { lat: 38, lng: 22, altitude: 1.8 } },
    { id: "age-of-sail",    name: "Age of Sail",     from: 1500, to: 1829, color: "#6fa8ff", showcase: "1595-09-20", camera: { lat: 0, lng: 20, altitude: 2.4 }, card: "assets/eras/era-age-of-sail.jpg", card_note: "Artistic impression (AI-generated)." },
    { id: "industrial",     name: "Industrial",      from: 1830, to: 1949, color: "#ffbf5e", subtitle: "rail and steam", showcase: "1870-03-01", camera: { lat: 38, lng: -40, altitude: 2.4 } },
    { id: "modern",         name: "Modern",          from: 1950, to: 2026, color: "#5ee7ff", subtitle: "container, air, pipeline", showcase: "1985-06-01", camera: { lat: 30, lng: 20, altitude: 2.5 } }
  ],
  route_types: [ // file: null means the type's records live in family files under data/routes/
    { id: "sea",      name: "Sea",      file: "data/routes/sea.js" },
    { id: "land",     name: "Land",     file: "data/routes/land.js" },
    { id: "river",    name: "River",    file: null },
    { id: "canal",    name: "Canal",    file: null },
    { id: "rail",     name: "Rail",     file: "data/routes/rail.js" },
    { id: "air",      name: "Air",      file: "data/routes/air.js" },
    { id: "pipeline", name: "Pipeline", file: "data/routes/pipeline.js" }
  ],
  // Every vehicle is built procedurally in js/vehicles.js (no model files).
  vehicles: [
    { id: "horse-rider",    name: "Mounted courier / pack horses", eras: ["classical", "late-antiquity", "medieval"], type: "land" },
    { id: "longship",       name: "Norse longship / knarr",     eras: ["medieval"],                   type: "sea" },
    { id: "barge",          name: "Canal or river barge",       eras: ["medieval", "industrial"],     type: "canal" },
    { id: "llama-caravan",  name: "Llama caravan",              eras: ["medieval"],                   type: "land" },
    { id: "trireme",        name: "Greek trireme",              eras: ["classical"],                  type: "sea" },
    { id: "roman-merchant", name: "Roman merchant ship (corbita)", eras: ["classical", "late-antiquity"], type: "sea" },
    { id: "galley",         name: "Merchant galley",            eras: ["medieval"],                   type: "sea" },
    { id: "cog",            name: "Cog",                        eras: ["medieval"],                   type: "sea" },
    { id: "dhow",           name: "Dhow",                       eras: ["medieval", "age-of-sail"],    type: "sea" },
    { id: "junk",           name: "Junk / treasure ship",       eras: ["medieval"],                   type: "sea" },
    { id: "galleon",        name: "Galleon",                    eras: ["age-of-sail"],                type: "sea" },
    { id: "east-indiaman",  name: "East Indiaman",              eras: ["age-of-sail"],                type: "sea" },
    { id: "frigate",        name: "Frigate",                    eras: ["age-of-sail"],                type: "sea" },
    { id: "steamship",      name: "Paddle / screw steamer",     eras: ["industrial"],                 type: "sea" },
    { id: "container-ship", name: "Container ship",             eras: ["modern"],                     type: "sea" },
    { id: "camel-caravan",  name: "Camel caravan",              eras: ["classical", "late-antiquity", "medieval", "age-of-sail"], type: "land" },
    { id: "steam-train",    name: "Steam train",                eras: ["industrial"],                 type: "rail" },
    { id: "jet",            name: "Jet airliner",               eras: ["modern"],                     type: "air" },
    { id: "pipeline-flow",  name: "Pipeline section with flow pulse", eras: ["modern"],               type: "pipeline" },
    { id: "treasure-ship",  name: "Ming treasure ship (baochuan)", eras: ["medieval"],                type: "sea" },
    { id: "canal-boat",     name: "Mule-towed canal boat",      eras: ["industrial"],                 type: "canal" },
    { id: "ox-wagon",       name: "Ox wagon / covered cart",    eras: ["classical", "late-antiquity", "medieval", "age-of-sail", "industrial"], type: "land" },
    { id: "diesel-train",   name: "Diesel-electric train",      eras: ["industrial", "modern"],       type: "rail" },
    { id: "electric-train", name: "Electric high-speed train",  eras: ["modern"],                     type: "rail" },
    { id: "prop-airliner",  name: "Piston-engined airliner",    eras: ["industrial", "modern"],       type: "air" },
    { id: "wright-flyer",   name: "Wright Flyer (1903)",        eras: ["industrial"],                 type: "air" },
    { id: "dc-3",           name: "Douglas DC-3 / C-47",        eras: ["industrial", "modern"],       type: "air" },
    { id: "comet",          name: "de Havilland Comet",         eras: ["modern"],                     type: "air" },
    { id: "boeing-747",     name: "Boeing 747",                 eras: ["modern"],                     type: "air" },
    { id: "concorde",       name: "Concorde",                   eras: ["modern"],                     type: "air" },
    { id: "satellite",      name: "Satellite (decorative layer)", eras: ["modern"],                   type: "space" }
  ],
  // Fields every route record carries (see DATA.md).
  record_fields: ["id", "type", "era", "name", "start_date", "end_date", "goods", "goods_source", "source", "citation", "confidence", "vehicle", "path", "schedule"]
};
