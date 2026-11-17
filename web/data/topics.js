/* Curated Topics list (owner order). Each row points at existing encyclopedia entries; the
   summary is taken only from those cited entries and the Guide lines already written from them.
   Test-only example rows are not in this file. They live in data/next/topics/example.json and
   load only with ?exampleData=1. */
(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).topics = [
  {
    id: "topic-nav:historical-bells",
    title: "Historical Bells",
    summary: "Twenty-five sourced bells, each pinned at official coordinates or at its last known building or site (marked approximate when the pin is not official). Each bell is in the encyclopedia; bells with a known cast year appear on the time slider.",
    order: 1,
    layersLight: ["bells"],
    entities: [
      "bell:liberty",
      "bell:bicentennial",
      "bell:centennial",
      "bell:wilbank",
      "bell:justice",
      "bell:friendship",
      "bell:great-bell-elizabeth-tower",
      "bell:st-patrick",
      "bell:japanese-peace",
      "bell:emmanuel",
      "bell:pummerin",
      "bell:todai-ji",
      "bell:peace-tower-bourdon",
      "bell:esquilas-san-joseph",
      "bell:campana-independencia",
      "bell:seongdeok",
      "bell:cheonheungsa",
      "bell:emden",
      "bell:great-paul",
      "bell:great-tom",
      "bell:gloriosa",
      "bell:sigismund",
      "bell:benin-af1897-498",
      "bell:petersglocke",
      "bell:maria-dolens"
    ]
  },
  {
    id: "topic-nav:six-eras-of-sea-routes",
    title: "Six eras of sea routes",
    summary: "A visual journey through 2,500 years of voyages on the SeaGlobe timeline, across the six eras: Classical, Late Antiquity, Medieval, Age of Sail, Industrial and Modern. A narrated tour of the six eras is coming later.",
    order: 2,
    eras: ["classical", "late-antiquity", "medieval", "age-of-sail", "industrial", "modern"],
    time: { start: "0060-05-01" },
    camera: { lat: 33, lng: 30, altitude: 1.9 },
    layersLight: ["routes"],
    tour: "eras",
    entities: [
      "era:classical",
      "era:late-antiquity",
      "era:medieval",
      "era:age-of-sail",
      "era:industrial",
      "era:modern",
      "tour:eras"
    ]
  },
  {
    id: "topic-nav:early-flight-to-the-jet-age",
    title: "Early flight to the jet age",
    summary: "Historic air corridors from the Wright Flyer (17 Dec 1903) to today's nonstop long-haul routes, with air hubs from OurAirports. A narrated tour of this layer is coming later.",
    order: 3,
    eras: ["industrial", "modern"],
    time: { start: "1903-12-17" },
    layersLight: ["routes"],
    layersHeavy: ["hubs"],
    tour: "air",
    entities: [
      "topic:air-pioneers",
      "topic:air-interwar",
      "topic:air-jet-age",
      "route:wright-kitty-hawk-1903",
      "route:us-air-mail-1918",
      "route:aeropostale-south-atlantic-1930",
      "route:imperial-airways-london-karachi",
      "route:pan-am-china-clipper-1935",
      "route:boac-comet-1952",
      "route:pan-am-747-1970",
      "route:concorde-london-new-york",
      "tour:air",
      "app:guide-air-hubs"
    ]
  },
  {
    id: "topic-nav:the-space-age",
    title: "The space age",
    summary: "Launch sites and yearly payload counts from GCAT (1957–today), plus decorative satellite markers in the space age. Orbit rings are illustrative, not live positions. A narrated tour is coming later.",
    order: 4,
    eras: ["modern"],
    time: { start: 1957, end: 2026 },
    layersLight: ["sats"],
    layersHeavy: ["launch"],
    tour: "space",
    entities: [
      "topic:space",
      "spacecraft:s00002",
      "spacecraft:s00004",
      "spacecraft:s04039",
      "spacecraft:s06633",
      "spacecraft:s20580",
      "spacecraft:s25544",
      "tour:space",
      "app:guide-launch-sites",
      "app:guide-satellites"
    ]
  },
  {
    id: "topic-nav:ships-and-assets-today",
    title: "Ships and assets today",
    summary: "The Ships and assets layer, on by default, shows moving ships, aircraft and vehicles on the globe. These are illustrative, not live positions.",
    order: 5,
    eras: ["modern"],
    time: { start: "1985-06-01" },
    camera: { lat: 30, lng: 20, altitude: 2.5 },
    layersLight: ["ships", "night"],
    focus: { era: "modern" },
    entities: [
      "era:modern",
      "app:guide-ships",
      "app:guide-night-lights"
    ]
  },
  {
    id: "topic-nav:countries-and-regions",
    title: "Countries and regions",
    summary: "Turn on Borders and regions, then zoom in: country, then state or province (every country), then county, then towns. County and town shapes load only for the state or country in view.",
    order: 6,
    layersHeavy: ["regions"],
    entities: [
      "app:guide-borders",
      "app:how-to-go-deeper",
      "level:world",
      "level:country",
      "level:state",
      "level:county",
      "level:town"
    ]
  },
  {
    id: "topic-nav:wind-and-weather",
    title: "Wind and weather",
    summary: "Schematic wind belts and logbook wind arrows (a CLIWOC sample from HMS Launceston, 1769). The belts are not a published climatology; a preferred historical wind atlas is [UNKNOWN].",
    order: 7,
    time: { start: "1769-09-07" },
    layersHeavy: ["wind"],
    entities: [
      "app:guide-wind",
      "route:cliwoc-launceston-1769"
    ],
    citations: [
      "CLIWOC 2.1 ship logbook data (PANGAEA), Jones et al. (2007), https://doi.org/10.1594/PANGAEA.611088, CC BY 3.0"
    ]
  },
  {
    id: "topic-nav:how-seaglobe-works",
    title: "How SeaGlobe works",
    summary: "A short walk that starts from Sampler, the idle globe — a rotating mix of vessels from every era and region. Open the Guide from Help, or from the Encyclopedia's Guide tab, for one or two lines on how to use each feature.",
    order: 8,
    entities: [
      "app:guide",
      "app:guide-topics",
      "app:guide-encyclopedia",
      "app:guide-layers",
      "app:how-to-go-deeper"
    ]
  }
];
