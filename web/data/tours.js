/* Narrated tours. Each stop names an atlas entry; the spoken and captioned words come from that entry's own
   cited summary at run time, so a tour never says anything the encyclopedia does not. Recorded narration files
   are not shipped yet (asset manifest: tour-narration, [UNKNOWN] size); the browser's own speech voice reads them. */
(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).tours = [
  { id: "eras", title: "Six eras of routes", stops: ["era:classical", "era:late-antiquity", "era:medieval", "era:age-of-sail", "era:industrial", "era:modern"] },
  { id: "air", title: "Early flight to the jet age", stops: ["route:wright-kitty-hawk-1903", "route:us-air-mail-1918", "route:aeropostale-south-atlantic-1930", "route:imperial-airways-london-karachi", "route:pan-am-china-clipper-1935", "route:boac-comet-1952", "route:pan-am-747-1970", "route:concorde-london-new-york"] },
  { id: "space", title: "The space age", stops: ["topic:space", "spacecraft:s00002", "spacecraft:s00004", "spacecraft:s04039", "spacecraft:s06633", "spacecraft:s20580", "spacecraft:s25544"] },
];
