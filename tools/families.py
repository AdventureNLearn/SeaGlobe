"""Route families, tranche 1. Hand-written reconstructions from public-domain
primary texts and published scholarship, plus air routes whose endpoints come
from OurAirports (public domain). No geometry is copied or traced from any
restricted dataset. Coordinates are approximate modern positions of the places
named, rounded; lines between them are our own sketch.
Each record: reconstruction=True, a citations list, confidence_level high/medium/low.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
G = "general history; not from a cargo manifest"


def rec(**k):
    k.setdefault("years_approximate", True)
    k.setdefault("confidence", "historical reconstruction")
    k.setdefault("sample", True)
    k.setdefault("partial", True)
    k.setdefault("demo_seed", False)
    k.setdefault("citation_check", False)
    k.setdefault("goods_source", G)
    k.setdefault("source", "published history")
    k["citation"] = k["citations"][0]
    k["reconstruction"] = True
    return k


def tr(label, speed, active=2, both=True, **x):
    d = {"kind": "traffic", "label": label, "speed_km_day": speed, "active": active, "both_directions": both}
    d.update(x)
    return d


HERODOTUS = "Herodotus, Histories 5.52-54 and 8.98, trans. G. C. Macaulay (London: Macmillan, 1890) [public domain]"
STRABO = "Strabo, Geography, trans. H. C. Hamilton and W. Falconer (London: Bohn, 1854-1857) [public domain]"
PLINY = "Pliny the Elder, Natural History, trans. J. Bostock and H. T. Riley (London: Bohn, 1855-1857) [public domain]"
ISIDORE = "Isidore of Charax, Parthian Stations, trans. W. H. Schoff (Philadelphia: Commercial Museum, 1914) [public domain]"
POLO = "Marco Polo, The Book of Ser Marco Polo, trans. and ed. Henry Yule, 3rd ed. rev. H. Cordier (London: John Murray, 1903) [public domain]"
IBN = "Ibn Battuta, Voyages d'Ibn Batoutah, ed. and trans. C. Defrémery and B. R. Sanguinetti (Paris, 1853-1858) [public domain]"
CIEZA = "Pedro de Cieza de León, The Travels of Pedro de Cieza de León, A.D. 1532-50, trans. C. R. Markham (London: Hakluyt Society, 1864) [public domain]"
HANSEN = "Valerie Hansen, The Silk Road: A New History (Oxford: Oxford University Press, 2012)"
BGS = "J. R. Bruijn, F. S. Gaastra and I. Schöffer, Dutch-Asiatic Shipping in the 17th and 18th Centuries (The Hague: Martinus Nijhoff, 1979-1987)"
LEVINSON = "Marc Levinson, The Box (Princeton: Princeton University Press, 2006)"
OURAIRPORTS = "OurAirports, airports.csv (public domain), hub coordinates; downloaded 13 Nov 2026"

FAMILY_RECORDS = [
    # ---- Royal Road (Persian) ----
    rec(id="persian-royal-road", type="land", family="royal-road", line="royal-road", era="classical", color="#d9a441",
        name="Persian Royal Road, Sardis to Susa", start_date="-0499", end_date="-0329", vehicle="horse-rider",
        goods=["royal dispatches", "tribute"], confidence_level="medium",
        citations=[HERODOTUS, "Pierre Briant, From Cyrus to Alexander: A History of the Persian Empire (Winona Lake: Eisenbrauns, 2002)"],
        path=[[38.49, 28.04], [39.0, 30.5], [39.2, 33.2], [38.73, 35.48], [37.9, 38.3], [37.15, 40.6], [36.36, 43.15], [35.47, 44.39], [34.0, 45.8], [32.19, 48.25]],
        notes="Herodotus describes 111 staging posts on a road of about three months' travel from Sardis to Susa, and royal couriers who rode it in relays. The line is our sketch through Anatolia, the upper Tigris and down to Susa.",
        schedule=tr("Royal courier (angarium relay)", 300, 3)),
    # ---- Silk Roads ----
    rec(id="silk-road-samarkand-antioch", type="land", family="silk-roads", line="silk-road", era="classical", color="#f2d18b",
        name="Silk Road west, Samarkand to Antioch", start_date="-0129", end_date="1400", vehicle="camel-caravan",
        goods=["silk", "spices", "glass", "silver"], confidence_level="medium",
        citations=[ISIDORE, HANSEN],
        path=[[39.65, 66.96], [37.66, 62.19], [36.3, 59.6], [35.6, 53.4], [34.8, 48.5], [34.31, 47.07], [33.09, 44.58], [34.4, 40.9], [35.5, 38.5], [36.2, 36.16]],
        notes="Via Merv, the Parthian road through Hecatompylos and Ecbatana, Ctesiphon and the Euphrates to Antioch. Isidore of Charax lists the Parthian stations of the middle section.",
        schedule=tr("Bactrian camel caravan", 28, 3)),
    rec(id="maritime-silk-road-polo-1291", type="sea", family="silk-roads", line="silk-road", era="medieval", color="#ffcf7a",
        name="Marco Polo's return voyage, Quanzhou to Hormuz, 1291-1293", start_date="1291", end_date="1293", vehicle="junk",
        goods=["escort of the princess Kököchin", "silk", "porcelain"], confidence_level="medium",
        citations=[POLO],
        path=[[24.87, 118.68], [21.0, 113.5], [15.0, 110.0], [8.0, 106.0], [2.5, 104.5], [2.6, 101.3], [5.3, 97.0], [6.0, 81.5], [8.5, 76.8], [15.0, 72.5], [22.0, 63.0], [26.4, 57.0], [27.1, 56.45]],
        notes="Polo's account of the fleet that carried a Mongol bride from Zaiton (Quanzhou) via Sumatra, Ceylon and India to Hormuz. Years from Yule's edition; months and pace reconstructed.",
        schedule={"kind": "years", "label": "Yuan fleet junk", "years": [1291], "start_day": 30, "duration_days": 640, "convoy": 2,
                  "years_source": "Years from Polo (Yule ed. 1903); months and pace reconstructed"}),
    rec(id="ibn-battuta-calicut-quanzhou", type="sea", family="silk-roads", line="silk-road", era="medieval", color="#ffcf7a",
        name="Ibn Battuta's passage toward China, c. 1345-1346", start_date="1345", end_date="1346", vehicle="junk",
        goods=["passengers", "pepper"], confidence_level="low",
        citations=[IBN],
        path=[[11.25, 75.77], [7.2, 79.5], [5.8, 82.0], [5.5, 95.3], [2.6, 101.3], [1.3, 104.2], [10.0, 109.5], [21.0, 113.5], [24.87, 118.68]],
        notes="Ibn Battuta's own narrative of sailing from the Malabar coast via Sumatra to Zaitun. His chronology here is disputed; years approximate.",
        schedule={"kind": "years", "label": "Chinese junk", "years": [1345], "start_day": 250, "duration_days": 220,
                  "years_source": "Approximate years from Ibn Battuta's narrative (Defrémery and Sanguinetti ed.); months reconstructed"}),
    # ---- Incense Route ----
    rec(id="incense-route", type="land", family="incense-route", line="incense", era="classical", color="#e9b5ff",
        name="Incense Route, Shabwa to Gaza", start_date="-0499", end_date="0200", vehicle="camel-caravan",
        goods=["frankincense", "myrrh", "spices"], confidence_level="medium",
        citations=[PLINY + ", book 12.30-32", STRABO + ", book 16.4"],
        path=[[15.92, 48.62], [15.42, 45.33], [17.49, 44.13], [20.0, 42.6], [24.47, 39.61], [26.62, 37.92], [28.1, 36.5], [30.33, 35.44], [31.5, 34.47]],
        notes="Pliny gives the frankincense road from the Hadramawt through Arabia to Gaza in many stages; Strabo describes the caravan trade. Our line follows the commonly named stations: Shabwa, Marib, Najran, Yathrib, Dedan, Petra, Gaza.",
        schedule=tr("Dromedary caravan", 30, 3)),
    # ---- Amber Road ----
    rec(id="amber-road", type="land", family="amber-road", line="amber", era="classical", color="#ffb347",
        name="Amber Road, Aquileia to the Baltic", start_date="0014", end_date="0400", vehicle="horse-rider",
        goods=["amber", "furs", "Roman bronzes and glass (northbound)"], confidence_level="medium",
        citations=[PLINY + ", book 37.11 (45)"],
        path=[[45.77, 13.37], [46.05, 14.51], [46.42, 15.87], [47.23, 16.62], [48.11, 16.86], [49.6, 17.4], [51.76, 18.09], [53.0, 18.4], [54.35, 18.65]],
        notes="Pliny reports that a Roman knight travelled about 600 miles from Carnuntum to the Baltic coast to buy amber under Nero. Our line runs Aquileia, Emona, Poetovio, Savaria, Carnuntum, Calisia to the coast.",
        schedule=tr("Amber trader with pack horses", 40, 2)),
    # ---- Roman roads ----
    rec(id="via-appia", type="land", family="roman-roads", line="roman", era="classical", color="#ff9f7a",
        name="Via Appia, Rome to Brundisium", start_date="-0311", end_date="0476", vehicle="horse-rider",
        goods=["official traffic", "travellers", "goods by cart"], confidence_level="high",
        citations=[STRABO + ", book 6.3.7", "Lorenzo Quilici, Via Appia (Rome: Fratelli Palombi, 1989)"],
        path=[[41.89, 12.49], [41.67, 12.75], [41.29, 13.25], [41.25, 13.6], [41.08, 14.25], [41.13, 14.78], [40.95, 15.6], [40.66, 16.6], [40.47, 17.24], [40.64, 17.94]],
        notes="Begun in 312 BCE by Appius Claudius; extended to Brundisium. Strabo describes the road. Line through Tarracina, Capua, Beneventum, Venusia and Tarentum.",
        schedule=tr("Cursus publicus rider", 70, 2)),
    rec(id="via-egnatia", type="land", family="roman-roads", line="roman", era="classical", color="#ff9f7a",
        name="Via Egnatia, Dyrrachium to Byzantium", start_date="-0145", end_date="1400", vehicle="horse-rider",
        goods=["armies", "officials", "trade"], confidence_level="high",
        citations=[STRABO + ", book 7.7.4 (quoting Polybius)"],
        path=[[41.32, 19.45], [41.11, 20.8], [40.8, 21.4], [40.64, 22.94], [40.82, 23.85], [41.01, 24.29], [40.85, 25.9], [40.98, 27.5], [41.01, 28.97]],
        notes="Built from about 146 BCE across the Balkans; Strabo gives its length from Polybius. Used into Byzantine and Ottoman times.",
        schedule=tr("Cursus publicus rider", 70, 2)),
    # ---- Viking routes ----
    rec(id="viking-norway-iceland", type="sea", family="viking", line="viking", era="medieval", color="#8fd3ff",
        name="Norse crossing, western Norway to Iceland", start_date="0870", end_date="1300", vehicle="longship",
        goods=["settlers", "livestock", "timber (to Iceland)", "wool cloth and fish (return)"], confidence_level="medium",
        citations=["Landnámabók and Íslendingabók (12th-13th c.), see The Book of Settlements, trans. H. Pálsson and P. Edwards (Winnipeg, 1972)",
                   "Gwyn Jones, The Norse Atlantic Saga (Oxford: Oxford University Press, 1964)"],
        path=[[60.39, 5.32], [61.0, 1.0], [62.0, -6.8], [63.4, -14.0], [64.15, -21.94]],
        notes="The sailing directions in Landnámabók run from Norway past Shetland and the Faroes to Iceland. Line is our sketch.",
        schedule=tr("Knarr (Norse ocean trader)", 140, 2)),
    rec(id="viking-iceland-greenland", type="sea", family="viking", line="viking", era="medieval", color="#8fd3ff",
        name="Norse crossing, Iceland to Greenland", start_date="0985", end_date="1410", vehicle="longship",
        goods=["settlers", "walrus ivory (return)", "furs"], confidence_level="medium",
        citations=["Eiríks saga rauða (13th c.), in The Vinland Sagas, trans. M. Magnusson and H. Pálsson (London: Penguin, 1965)",
                   "Gwyn Jones, The Norse Atlantic Saga (Oxford: Oxford University Press, 1964)"],
        path=[[64.15, -21.94], [64.9, -24.5], [64.0, -33.0], [61.5, -42.5], [61.15, -45.5]],
        notes="From Breiðafjörður or Reykjavík west to the Eastern Settlement at Brattahlíð. Settlement from about 985; last written record about 1408.",
        schedule=tr("Knarr (Norse ocean trader)", 140, 1)),
    rec(id="varangian-route", type="river", family="viking", line="viking", era="medieval", color="#8fd3ff",
        name="Route from the Varangians to the Greeks, Birka to Constantinople", start_date="0860", end_date="1050", vehicle="longship",
        goods=["furs", "slaves", "silver (return)", "silk (return)"], confidence_level="low",
        citations=["Constantine VII Porphyrogenitus, De Administrando Imperio, ch. 9 (10th c.)",
                   "The Russian Primary Chronicle (12th c.), trans. S. H. Cross (Cambridge, MA, 1930)"],
        path=[[59.34, 17.54], [59.6, 21.0], [59.9, 26.5], [60.0, 30.2], [60.1, 32.3], [58.52, 31.27], [56.5, 31.6], [54.78, 32.05], [52.5, 30.9], [50.45, 30.52], [47.8, 35.1], [46.6, 31.9], [45.2, 30.5], [43.0, 28.9], [41.2, 29.1], [41.01, 28.97]],
        notes="Constantine VII describes the Rus' boats coming down the Dnieper past the rapids to the Black Sea. River and portage line sketched by us.",
        schedule=tr("Rus' river boat", 45, 2)),
    # ---- Grand Canal ----
    rec(id="grand-canal-yuan-ming", type="river", family="grand-canal", line="grand-canal", era="medieval", color="#7fe0c7",
        name="Grand Canal, Hangzhou to Beijing", start_date="1293", end_date="1855", vehicle="barge",
        goods=["tax grain", "salt", "silk", "timber"], confidence_level="medium",
        citations=[POLO + ", book 2", "Jane Kate Leonard, Controlling from Afar: The Daoguang Emperor's Management of the Grand Canal Crisis (Ann Arbor, 1996)"],
        path=[[30.27, 120.15], [31.3, 120.6], [31.78, 119.95], [32.39, 119.41], [33.6, 119.0], [34.5, 117.9], [35.41, 116.59], [36.45, 116.0], [36.84, 115.7], [38.3, 116.85], [39.13, 117.2], [39.9, 116.66]],
        notes="The Yuan route across Shandong to Dadu (Beijing), completed 1293, used for grain transport until the Yellow River shifted in 1855. Polo describes canal traffic.",
        schedule=tr("Grain barge", 35, 4)),
    # ---- Inca roads ----
    rec(id="qhapaq-nan-quito-cusco", type="land", family="inca-roads", line="inca", era="medieval", color="#ffd27a",
        name="Qhapaq Ñan, Quito to Cusco", start_date="1438", end_date="1572", vehicle="llama-caravan",
        goods=["cloth", "maize", "state tribute", "chasqui messages"], confidence_level="medium",
        citations=[CIEZA, "John Hyslop, The Inka Road System (Orlando: Academic Press, 1984)"],
        path=[[-0.22, -78.51], [-1.67, -78.65], [-2.9, -79.0], [-4.0, -79.2], [-5.2, -79.4], [-7.16, -78.51], [-8.6, -77.9], [-9.87, -76.86], [-11.77, -75.5], [-12.8, -74.6], [-13.65, -73.95], [-13.53, -71.97]],
        notes="The highland trunk road, described by Cieza de León. Line through Tomebamba, Cajamarca, Huánuco Pampa, Jauja and Vilcas to Cusco.",
        schedule=tr("Llama caravan", 25, 3)),
    # ---- Atlantic triangle (factual, sensitive) ----
    rec(id="atlantic-triangle-outward", type="sea", family="atlantic", line="atlantic", era="age-of-sail", color="#c7a17a",
        name="Atlantic triangle, leg 1: Liverpool to the Bight of Biafra", start_date="1700", end_date="1807", vehicle="east-indiaman",
        goods=["textiles", "metal goods", "firearms", "alcohol"], confidence_level="medium",
        citations=["Eric Williams, Capitalism and Slavery (Chapel Hill: University of North Carolina Press, 1944)",
                   "Olaudah Equiano, The Interesting Narrative of the Life of Olaudah Equiano (London, 1789) [public domain]"],
        path=[[53.4, -3.1], [52.0, -5.5], [48.0, -10.0], [36.0, -14.0], [24.0, -19.0], [12.0, -20.0], [5.0, -10.0], [3.5, 2.0], [4.43, 7.17]],
        notes="British slaving voyages carried trade goods to West Africa to buy captives. Shown from 1700 to the British abolition of the trade in 1807; other nations' trade ran earlier and later.",
        schedule=tr("Slaving ship (outward)", 120, 2, False)),
    rec(id="atlantic-middle-passage", type="sea", family="atlantic", line="atlantic", era="age-of-sail", color="#9b5b55",
        name="Atlantic triangle, leg 2: the Middle Passage", start_date="1700", end_date="1807", vehicle="east-indiaman",
        goods=["enslaved African people, transported by force"], goods_source="general history",
        confidence_level="medium",
        citations=["Olaudah Equiano, The Interesting Narrative of the Life of Olaudah Equiano (London, 1789) [public domain]",
                   "Marcus Rediker, The Slave Ship: A Human History (New York: Viking, 2007)"],
        path=[[4.43, 7.17], [2.0, 2.0], [0.5, -10.0], [5.0, -30.0], [12.0, -50.0], [15.5, -63.0], [17.2, -72.5], [17.97, -76.79]],
        notes="Captive Africans were shipped across the Atlantic in brutal conditions; many died on the voyage. Equiano, who survived it as a child, wrote one of the few first-hand accounts. Shown factually, with no game-like effects.",
        schedule=tr("Slave ship (Middle Passage)", 110, 2, False)),
    rec(id="atlantic-triangle-return", type="sea", family="atlantic", line="atlantic", era="age-of-sail", color="#c7a17a",
        name="Atlantic triangle, leg 3: Jamaica to Liverpool", start_date="1700", end_date="1807", vehicle="east-indiaman",
        goods=["sugar", "rum", "cotton", "produce of enslaved labour"], confidence_level="medium",
        citations=["Eric Williams, Capitalism and Slavery (Chapel Hill: University of North Carolina Press, 1944)"],
        path=[[17.97, -76.79], [20.5, -74.0], [24.0, -76.0], [30.0, -77.0], [38.0, -66.0], [45.0, -45.0], [50.0, -20.0], [52.0, -8.0], [53.4, -3.1]],
        notes="Ships returned with plantation produce. Our line follows the Gulf Stream and westerlies.",
        schedule=tr("Merchant ship (return)", 140, 2, False)),
    # ---- VOC / EIC ----
    rec(id="voc-return-fleet", type="sea", family="voc-eic", line="voc", era="age-of-sail", color="#6fa8ff",
        name="VOC return fleets, Batavia to Texel", start_date="1620", end_date="1795", vehicle="east-indiaman",
        goods=["pepper", "nutmeg and cloves", "textiles", "tea (later)"], confidence_level="medium",
        citations=[BGS],
        path=[[-6.13, 106.81], [-6.8, 105.2], [-12.0, 100.0], [-25.0, 75.0], [-35.0, 40.0], [-34.36, 18.5], [-20.0, 0.0], [-15.9, -5.7], [-7.9, -14.4], [10.0, -25.0], [30.0, -35.0], [45.0, -25.0], [60.0, -5.0], [53.05, 4.77]],
        notes="Homeward fleets via the Cape, St Helena and Ascension, then north-about around Scotland in wartime. Our line; illustrative traffic.",
        schedule=tr("VOC retourschip", 115, 3, False, convoy=2)),
    rec(id="eic-london-madras", type="sea", family="voc-eic", line="eic", era="age-of-sail", color="#e85d75",
        name="English East India Company, London to Madras", start_date="1640", end_date="1833", vehicle="east-indiaman",
        goods=["silver bullion (outward)", "cotton textiles", "pepper", "saltpetre"], confidence_level="medium",
        citations=["K. N. Chaudhuri, The Trading World of Asia and the English East India Company, 1660-1760 (Cambridge: Cambridge University Press, 1978)"],
        path=[[51.45, 0.6], [50.6, 0.5], [49.6, -5.5], [40.0, -14.0], [32.6, -17.5], [15.0, -25.0], [0.0, -22.0], [-20.0, -10.0], [-34.8, 18.0], [-35.0, 25.0], [-28.0, 42.0], [-15.0, 60.0], [0.0, 76.0], [5.5, 82.5], [13.08, 80.35]],
        notes="Outward Indiamen via Madeira, the Cape and the Indian Ocean to the Coromandel coast. Our line; illustrative traffic.",
        schedule=tr("East Indiaman", 120, 3)),
    # ---- Canals ----
    rec(id="erie-canal", type="canal", family="canals", line="canal", era="industrial", color="#9ee6ff",
        name="Erie Canal, Albany to Buffalo", start_date="1825-10-26", end_date="1949", vehicle="canal-boat",
        goods=["grain", "flour", "timber", "passengers"], confidence_level="high",
        citations=["Peter L. Bernstein, Wedding of the Waters: The Erie Canal and the Making of a Great Nation (New York: Norton, 2005)"],
        path=[[42.65, -73.75], [42.81, -73.94], [42.94, -74.6], [43.1, -75.23], [43.05, -76.15], [43.06, -77.0], [43.16, -77.61], [43.17, -78.69], [42.89, -78.88]],
        notes="Opened 26 October 1825. Our line through Schenectady, Utica, Syracuse, Rochester and Lockport.",
        schedule=tr("Canal boat (mule-towed)", 80, 3, min_display_days=10)),
    rec(id="panama-canal-route", type="sea", family="canals", line="canal", era="industrial", color="#9ee6ff",
        name="New York to San Francisco via the Panama Canal", start_date="1914-08-15", end_date="1949", vehicle="steamship",
        goods=["general cargo", "passengers"], confidence_level="medium",
        citations=["David McCullough, The Path Between the Seas: The Creation of the Panama Canal, 1870-1914 (New York: Simon & Schuster, 1977)"],
        path=[[40.55, -73.9], [36.0, -74.5], [27.0, -73.0], [20.1, -73.8], [16.0, -76.5], [9.4, -79.9], [8.95, -79.53], [7.0, -80.4], [12.0, -92.0], [20.0, -107.0], [22.4, -111.0], [30.0, -118.4], [34.0, -121.0], [37.8, -122.6]],
        notes="The canal opened to traffic on 15 August 1914. Our line through the Windward Passage and up the Pacific coast.",
        schedule=tr("Steamer", 480, 2)),
    # ---- Railways ----
    rec(id="trans-siberian-railway", type="rail", family="railways", line="rail", era="industrial", color="#ffd29a",
        name="Trans-Siberian Railway, Moscow to Vladivostok", start_date="1916", end_date="1949", vehicle="steam-train",
        goods=["passengers", "freight", "mail"], confidence_level="medium",
        citations=["Christian Wolmar, To the Edge of the World: The Story of the Trans-Siberian Railway (London: Atlantic, 2013)"],
        path=[[55.75, 37.62], [57.63, 39.87], [58.6, 49.66], [58.0, 56.25], [56.84, 60.6], [55.16, 61.4], [54.99, 73.37], [55.03, 82.92], [56.01, 92.87], [52.29, 104.3], [51.83, 107.58], [52.03, 113.5], [50.27, 127.53], [48.48, 135.08], [43.12, 131.89]],
        notes="The all-Russian route via the Amur line was complete in 1916. Our line through Yaroslavl, Perm, Yekaterinburg, Omsk, Novosibirsk, Irkutsk and Khabarovsk.",
        schedule=tr("Steam train", 600, 4, min_display_days=60)),
    # ---- Container lanes ----
    rec(id="transpacific-containers", type="sea", family="container-lanes", line="container", era="modern", color="#5ee7ff",
        name="Container lane, Shanghai to Los Angeles", start_date="1980", end_date="2026", vehicle="container-ship",
        goods=["manufactured goods in containers"], confidence_level="low",
        citations=[LEVINSON],
        path=[[31.2, 122.1], [30.5, 128.0], [31.5, 133.0], [34.5, 142.0], [40.0, 160.0], [42.0, -175.0], [40.0, -150.0], [36.0, -130.0], [33.7, -118.3]],
        notes="Illustrative great-circle lane. Lanes derived from the World Bank AIS density layer are on the backlog.",
        schedule=tr("Container ship", 800, 4)),
    # ---- Pipelines ----
    rec(id="druzhba-pipeline", type="pipeline", family="pipelines", line="pipeline", era="modern", color="#ff7ab8",
        name="Druzhba oil pipeline, Almetyevsk to Schwedt", start_date="1964", end_date="2026", vehicle="pipeline-flow",
        goods=["crude oil"], confidence_level="low", citation_check=True,
        citations=["Jeronim Perović (ed.), Cold War Energy: A Transnational History of Soviet Oil and Gas (Cham: Palgrave Macmillan, 2017)"],
        path=[[54.9, 52.3], [53.2, 50.1], [52.6, 45.0], [53.25, 34.37], [52.05, 29.25], [52.4, 23.6], [52.55, 19.7], [53.06, 14.28]],
        notes="Northern branch through Belarus and Poland to Germany, in service from the 1960s. Our sketch through the named terminals; not traced from any pipeline dataset.",
        schedule=tr("Oil flow", 160, 4, False)),
    rec(id="btc-pipeline", type="pipeline", family="pipelines", line="pipeline", era="modern", color="#ff7ab8",
        name="Baku-Tbilisi-Ceyhan pipeline", start_date="2006", end_date="2026", vehicle="pipeline-flow",
        goods=["crude oil"], confidence_level="medium",
        citations=["S. Frederick Starr and Svante E. Cornell (eds), The Baku-Tbilisi-Ceyhan Pipeline: Oil Window to the West (Washington: CACI and SRSP, 2005)"],
        path=[[40.18, 49.47], [40.6, 47.0], [41.72, 44.78], [41.4, 43.0], [39.9, 41.27], [38.7, 39.2], [37.6, 37.5], [36.85, 35.93]],
        notes="Caspian oil to the Mediterranean, first exports 2006. Our sketch through Tbilisi and Erzurum.",
        schedule=tr("Oil flow", 160, 3, False)),
]


# v2.2: no line before its airport opened (PVG opened 1 Oct 1999; GRU opened 1985). Other start years stay illustrative.
AIR_START = {("PVG", "LAX"): "1999", ("GRU", "JNB"): "1985"}


def air_records():
    hubs = {r["iata_code"]: r for r in csv.DictReader(open(ROOT / "data" / "sources" / "ourairports" / "hubs.csv", encoding="utf-8"))}
    pairs = [("LHR", "JFK"), ("DXB", "LHR"), ("SIN", "LHR"), ("HND", "LAX"), ("HKG", "SYD"), ("FRA", "ORD"), ("PEK", "FRA"),
             ("DEL", "DXB"), ("GRU", "JNB"), ("IST", "DXB"), ("PVG", "LAX"), ("CDG", "JFK")]
    out = []
    for a, b in pairs:
        A, B = hubs[a], hubs[b]
        out.append(rec(id=f"air-{a.lower()}-{b.lower()}", type="air", family="air", line="air", era="modern", color="#e8f1ff",
                       name=f"Jet route {A['municipality']} ({a}) to {B['municipality']} ({b})", start_date=AIR_START.get((a, b), "1980"), end_date="2026",
                       vehicle="jet", goods=["passengers", "air freight"], goods_source="general description", confidence_level="low",
                       source="dataset (endpoints) + great circle", derived_from="OurAirports hub coordinates (public domain)",
                       citations=[OURAIRPORTS], reconstruction=True,
                       path=[[round(float(A["latitude_deg"]), 3), round(float(A["longitude_deg"]), 3)], [round(float(B["latitude_deg"]), 3), round(float(B["longitude_deg"]), 3)]],
                       notes="Great circle between two hubs. Start year is illustrative [UNKNOWN]; real services and paths vary. Display pace slowed so aircraft can be seen.",
                       schedule=tr("Jet airliner", 20000, 2, True, min_display_days=24)))
    return out


FAMILY_RECORDS = FAMILY_RECORDS + air_records()
