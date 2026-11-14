/* "Go deeper": plain outbound links to the public homepages of projects whose
   data is NOT bundled here (restricted or unknown license, see DATA.md).
   Links only: nothing is embedded, fetched, tiled or hotlinked. Listing a project
   here does not mean it endorses SeaGlobe, or SeaGlobe it. */
(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).deeper = [
  { id: "darmc", name: "DARMC: Digital Atlas of Roman and Medieval Civilizations", url: "https://darmc.harvard.edu/", credit: "Harvard University, McCormick et al.", desc: "Scholarly GIS layers for the Roman and medieval world, including Roman roads from the Barrington Atlas." },
  { id: "awmc", name: "Ancient World Mapping Center", url: "https://awmc.unc.edu/", credit: "University of North Carolina at Chapel Hill", desc: "Maps and map tiles of the ancient Mediterranean world." },
  { id: "owtrad", name: "OWTRAD: Old World Trade Routes", url: "http://www.ciolek.com/owtrad.html", credit: "T. Matthew Ciolek", desc: "Compiled land, river and sea trade routes of Eurasia and Africa, including a Persian Royal Road set." },
  { id: "das", name: "Dutch-Asiatic Shipping in the 17th and 18th Centuries", url: "https://resources.huygens.knaw.nl/das/", credit: "Huygens Institute; Bruijn, Gaastra and Schöffer", desc: "Voyage-by-voyage records of VOC shipping between the Netherlands and Asia, 1595-1795." },
  { id: "slavevoyages", name: "SlaveVoyages", url: "https://www.slavevoyages.org/", credit: "The SlaveVoyages consortium", desc: "Research databases on the trans-Atlantic and intra-American slave trades." },
  { id: "soundtoll", name: "Sound Toll Registers Online", url: "https://www.soundtoll.nl/", credit: "STRO project", desc: "Passages and cargoes recorded at the Danish Sound toll, 1497-1857." },
  { id: "openstreetmap", name: "OpenStreetMap", url: "https://www.openstreetmap.org/", credit: "OpenStreetMap contributors", desc: "A community map of today's roads, railways and places." },
  { id: "openflights", name: "OpenFlights", url: "https://openflights.org/", credit: "OpenFlights.org", desc: "Airport, airline and route databases." },
  { id: "shipping-lanes", name: "Global Shipping Lanes", url: "https://github.com/newzealandpaul/Shipping-Lanes", credit: "Benden (2022)", desc: "Shipping-lane polylines georeferenced from a 2012 ocean map." },
  { id: "comtrade", name: "UN Comtrade", url: "https://comtradeplus.un.org/", credit: "United Nations Statistics Division", desc: "Official international merchandise trade statistics." },
  { id: "gem", name: "Global Energy Monitor", url: "https://globalenergymonitor.org/", credit: "Global Energy Monitor", desc: "Trackers of oil and gas pipelines and other energy infrastructure." },
  { id: "unesco-whc", name: "UNESCO World Heritage Centre", url: "https://whc.unesco.org/", credit: "UNESCO", desc: "World Heritage listings, including Silk Roads corridors and Qhapaq Ñan." },
  { id: "qhapaq-nan", name: "Qhapaq Ñan, Andean Road System (World Heritage listing)", url: "https://whc.unesco.org/en/list/1459/", credit: "UNESCO", desc: "The listing for the Inca road system." },
  { id: "han-silk-road", name: "Traffic data of the Silk Road in the Han dynasty", url: "https://doi.org/10.11922/sciencedb.611", credit: "ScienceDB / China Scientific Data", desc: "A dataset on Han-era Silk Road traffic." },
  { id: "periplus-network", name: "Periplus Maris Erythraei network dataset", url: "https://hdl.handle.net/1956/11470", credit: "E. H. Seland, University of Bergen (BORA)", desc: "A network-analysis dataset built from the Periplus." }
];
/* Which links are relevant to which route lines (route.line or route.family). */
window.SEAGLOBE_DATA.deeper_by_line = {
  roman: ["darmc", "awmc", "owtrad"], greek: ["awmc", "owtrad"], "royal-road": ["owtrad", "awmc"],
  "silk-road": ["owtrad", "han-silk-road", "unesco-whc"], incense: ["owtrad", "periplus-network"], amber: ["owtrad", "darmc"],
  sahara: ["owtrad"], "indian-ocean": ["owtrad", "periplus-network"], venetian: ["darmc", "owtrad"], genoese: ["darmc", "owtrad"],
  hanseatic: ["soundtoll", "owtrad"], viking: ["owtrad", "darmc"], "grand-canal": ["owtrad", "unesco-whc"], inca: ["qhapaq-nan"],
  voc: ["das"], eic: ["owtrad"], atlantic: ["slavevoyages"], manila: ["owtrad"], container: ["shipping-lanes", "comtrade"],
  air: ["openflights"], pipeline: ["gem"], rail: ["openstreetmap"], canal: ["openstreetmap"], steam: ["owtrad"]
};
