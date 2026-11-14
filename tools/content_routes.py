"""v2.2 content pass: history, story and key facts for every route record.

Hand-written from the cited sources. Every fact has a citation in the entry's
`content_citations`. Anything not found in the sources consulted is marked
[UNKNOWN]. "Story" text retells documented events on or near the route; where
it describes a typical voyage rather than a recorded one it says so.
Merged into web/data/routes/*.json by tools/enrich.py (additive fields only).
"""


def W(title):
    slug = title.replace(" ", "_")
    return f"Wikipedia, “{title}”, https://en.wikipedia.org/wiki/{slug} (accessed 14 Nov 2026), and the sources cited there"


HERODOTUS = "Herodotus, Histories 5.52-54 and 8.98, trans. G. C. Macaulay (London: Macmillan, 1890) [public domain]"
PLINY37 = "Pliny the Elder, Natural History 37.11 (45), trans. J. Bostock and H. T. Riley (London: Bohn, 1855-1857) [public domain]"
BGS = "J. R. Bruijn, F. S. Gaastra and I. Schöffer, Dutch-Asiatic Shipping in the 17th and 18th Centuries (The Hague: Martinus Nijhoff, 1979-1987)"
LEVINSON = "Marc Levinson, The Box (Princeton: Princeton University Press, 2006)"
OURAIRPORTS = "OurAirports, airports.csv (public domain), hub coordinates; downloaded 13 Nov 2026"

R = {}

# ---------------- air ----------------
R["pan-am-707-1958"] = dict(
    history="Pan Am was the launch customer for the Boeing 707 and began regular 707 service on 26 October 1958, from New York Idlewild to Paris Le Bourget with a fuel stop at Gander, Newfoundland. "
            "It came three weeks after BOAC opened the first transatlantic jet service with the de Havilland Comet 4 on 4 October 1958. The 707 went on to be built in 1,010 examples and made jet travel routine on the North Atlantic.",
    story="On the evening of 26 October 1958 the Boeing 707-121 Clipper America (N711PA) left Idlewild with 111 passengers. Westerly winds and the early 707's range meant a stop to refuel at Gander before the run across the ocean to Le Bourget.",
    facts={"Operator": "Pan American World Airways", "Aircraft": "Boeing 707-121 Clipper America, N711PA", "Passengers": "111",
           "Date": "26 October 1958", "Stops": "Gander, Newfoundland (fuel)", "Track on the globe": "great-circle reconstruction"},
    content_citations=[W("Boeing 707"), W("Pan American World Airways"), W("Transatlantic flight")])
R["london-new-york-jets"] = dict(
    history="Jet airliners reached the North Atlantic in October 1958: BOAC flew the first transatlantic jet service between London Heathrow and New York Idlewild with a Comet 4 on 4 October, and Pan Am followed with the Boeing 707 on 26 October. "
            "Before jets, westbound piston airliners such as BOAC's Stratocruisers had to refuel at Shannon and Gander. From 1977 to 2003 British Airways also flew Concorde from London to New York JFK in about three and a half hours.",
    story="On 4 October 1958 Comet 4 G-APDC opened BOAC's London–New York jet service, the first scheduled transatlantic jet passenger flight; a sister Comet flew the opposite way the same day.",
    facts={"First jet service": "BOAC Comet 4, 4 October 1958", "Supersonic era": "Concorde to New York JFK from 17 October 1977; retired 2003",
           "Operators today": "[UNKNOWN] (not compiled here)", "Track on the globe": "great-circle reconstruction"},
    content_citations=[W("Transatlantic flight"), W("BOAC"), W("Concorde")])

AIR = {
    "air-lhr-jfk": ("London Heathrow to New York JFK is the route on which the jet age began across the Atlantic: BOAC's Comet 4 opened it on 4 October 1958, then to Idlewild (renamed JFK in 1963). British Airways and Air France Concorde served New York JFK from 17 October 1977 until retirement in 2003.",
                    "In 1958 a westbound crossing still might need a fuel stop; by the 1970s Concorde made the same trip in under three and a half hours, and the subsonic jets on this great circle remain among the busiest long-haul flights on the planet [UNKNOWN: current traffic rank not compiled].",
                    {"Opened to jets": "4 October 1958 (BOAC Comet 4)", "Concorde": "17 Oct 1977 – 2003"}, [W("Transatlantic flight"), W("Concorde")]),
    "air-dxb-lhr": ("Dubai International Airport opened on 30 September 1960 with a sand runway able to take a DC-3. Emirates was founded on 15 March 1985, with its first two aircraft provided by Pakistan International Airlines, and later made London Heathrow one of its main long-haul routes. Dubai is now the world's busiest airport for international passengers.",
                    "From a compacted-sand strip in 1960 to the world's largest A380 operator (116 in service in January 2026), this route traces Dubai's rise as a hub between Europe and Asia. Which airline first flew Dubai–London, and when, is [UNKNOWN] in the sources consulted.",
                    {"DXB opened": "30 September 1960", "Emirates founded": "15 March 1985", "First service on the pair": "[UNKNOWN]"}, [W("Dubai International Airport"), W("Emirates (airline)")]),
    "air-sin-lhr": ("Singapore–London is a segment of the 'Kangaroo Route' between Australia and Britain. Qantas began flying passengers to Singapore in 1935 to connect with London-bound Imperial Airways, and in April 1947 began operating the whole Kangaroo Route itself. Singapore Airlines began flying on 1 October 1972 and later used London Heathrow as the maiden route for its new 777-300ER cabins.",
                    "The pre-war journey took many days and stops; today it is one overnight hop. The piece of the Kangaroo Route between Singapore and London has been flown for more than 90 years in some form.",
                    {"Kangaroo Route": "Qantas end-to-end from April 1947", "Singapore Airlines first flights": "1 October 1972"}, [W("Kangaroo Route"), W("Singapore Airlines")]),
    "air-hnd-lax": ("Haneda was Tokyo's primary international airport until Narita opened in 1978 and took almost all international flights; Haneda became mostly domestic. In 2010 a new international terminal and fourth runway let long-haul flights return to Haneda. For 1978–2010, Tokyo–Los Angeles flights used Narita, not Haneda, so this line is an approximation for those years.",
                    "This trans-Pacific great circle runs north of a straight line on a flat map, over the North Pacific toward the Aleutians. The airport at the Tokyo end moved twice in this period, from Haneda to Narita in 1978 and back to Haneda for many flights after 2010.",
                    {"Haneda international": "before 1978 and again from 2010", "1978–2010": "Tokyo flights mostly used Narita (not drawn)"}, [W("Haneda Airport")]),
    "air-hkg-syd": ("Cathay Pacific was founded in Hong Kong on 24 September 1946 by the Australian Sydney de Kantzow and partners, so this route links the airline to its founders' home. Hong Kong's airport moved from Kai Tak to Chek Lap Kok in 1998; the line here uses today's airport.",
                    "An airline started by an Australian ex-RAAF pilot and an American in post-war Hong Kong grew into one of Asia's largest carriers, and Sydney became one of its long-haul routes. The date of its first Hong Kong–Sydney service is [UNKNOWN] in the sources consulted.",
                    {"Cathay Pacific founded": "24 September 1946", "First service on the pair": "[UNKNOWN]"}, [W("Cathay Pacific")]),
    "air-fra-ord": ("Lufthansa traces its history to Deutsche Luft Hansa, founded in Berlin in 1926. The modern company was founded as Luftag on 6 January 1953. Frankfurt became its main hub, and Chicago O'Hare one of its North American gateways.",
                    "Germany's post-war airline rebuilt its transatlantic network in the 1950s, and Frankfurt–Chicago became one of the corridors linking Europe's and America's big connecting hubs. The first date of the route is [UNKNOWN] in the sources consulted.",
                    {"Lufthansa (modern) founded": "6 January 1953", "First service on the pair": "[UNKNOWN]"}, [W("Lufthansa")]),
    "air-pek-fra": ("Air China began operating on 1 July 1988, when the old national carrier CAAC was split into six airlines. Beijing Capital is its home base, and Frankfurt is one of the European cities it links to China. China's reform-era opening drove the growth of this Europe–China corridor.",
                    "The great circle from Beijing to Frankfurt crosses Mongolia, Siberia and Russia. For long periods Western airlines have had to detour around closed Russian airspace, so the real tracks can differ a great deal from this line [UNKNOWN: dates of specific closures not compiled here].",
                    {"Air China founded": "1 July 1988", "First service on the pair": "[UNKNOWN]"}, [W("Air China")]),
    "air-del-dxb": ("Delhi–Dubai is one of the many Gulf–India routes that carry migrant workers, families and business travellers. Dubai International opened in 1960 and is now the busiest airport in the world for international passengers.",
                    "Workers, families and traders shuttle between India and the Gulf on routes like this. The first service on the pair and its current ranking are [UNKNOWN] in the sources consulted.",
                    {"DXB opened": "30 September 1960", "First service on the pair": "[UNKNOWN]"}, [W("Dubai International Airport")]),
    "air-gru-jnb": ("São Paulo/Guarulhos opened in 1985, so the line starts then (before 1985, São Paulo's international flights used other airports). South African Airways, founded on 1 February 1934, today serves São Paulo as one of its two intercontinental routes, along with Perth.",
                    "Few air routes cross the South Atlantic. This one links Africa's and South America's biggest economic centres, flying over open ocean almost the whole way.",
                    {"GRU opened": "1985", "SAA founded": "1 February 1934", "SAA intercontinental": "São Paulo and Perth"}, [W("São Paulo/Guarulhos International Airport"), W("South African Airways")]),
    "air-ist-dxb": ("The Istanbul end is drawn at the new Istanbul Airport. All of the city's scheduled passenger flights moved there from Atatürk Airport on 6 April 2019. Before that date, Istanbul–Dubai flights used Atatürk, so this line approximates them.",
                    "Two of the world's biggest connecting hubs face each other across the Middle East on this route. The first service on the pair is [UNKNOWN] in the sources consulted.",
                    {"Istanbul Airport": "all scheduled passenger flights from 6 April 2019", "Earlier years": "Atatürk Airport (not drawn)"}, [W("Istanbul Airport"), W("Dubai International Airport")]),
    "air-pvg-lax": ("Shanghai Pudong opened officially in 1999 (Terminal 1 opened on 1 October 1999) and took over from Hongqiao as the city's main international airport. The line therefore starts in 1999. Before then, Shanghai's flights used Hongqiao.",
                    "This is one of the trans-Pacific links between China's largest city and the US West Coast. The first service on the pair is [UNKNOWN] in the sources consulted.",
                    {"PVG opened": "1 October 1999", "First service on the pair": "[UNKNOWN]"}, [W("Shanghai Pudong International Airport")]),
    "air-cdg-jfk": ("Pan Am opened jet service from New York to Paris (then via Le Bourget) on 26 October 1958. Air France flew Concorde from Paris to New York JFK from 17 October 1977 until 2003; subsonic jets took about eight hours westbound and Concorde a little over three.",
                    "Paris–New York carried both the first scheduled 707 service and Air France's supersonic flagship. Concorde's retirement in 2003 followed the July 2000 crash at Gonesse, which happened on a charter flight from CDG to New York.",
                    {"First jet service NY–Paris": "Pan Am 707, 26 Oct 1958 (to Le Bourget)", "Concorde": "17 Oct 1977 – 2003"}, [W("Boeing 707"), W("Concorde")]),
}
for k, (h, s, f, c) in AIR.items():
    f = dict(f); f.setdefault("Track on the globe", "great circle between two hubs (reconstruction)")
    R[k] = dict(history=h, story=s, facts=f, content_citations=c + [OURAIRPORTS])

# ---------------- land: roads and caravans ----------------
R["amber-road"] = dict(
    history="The Amber Road brought Baltic amber south to the Mediterranean. In Roman times a main branch ran from the Baltic coast (modern Lithuania and Poland) across Poland and Moravia to Carnuntum on the Danube, and on to Aquileia at the head of the Adriatic, where amber was shaped into jewellery. "
            "Pliny the Elder records that under Nero a Roman knight was sent to the Baltic coast to buy amber, about 600 miles from Carnuntum, and brought back so much that it decorated the nets of the arena.",
    story="Pliny's knight (his name is not given) was sent by Julianus, who ran Nero's gladiator shows. He toured the amber coast's markets and brought back so much that the arena nets, weapons and litters were decorated with amber, and his largest piece weighed thirteen pounds.",
    facts={"Goods": "Baltic amber (raw and worked)", "Main Roman nodes": "Baltic coast – Carnuntum – Aquileia", "Distance Carnuntum–coast": "about 600 Roman miles (Pliny)"},
    content_citations=[PLINY37, W("Amber Road")])
R["persian-royal-road"] = dict(
    history="The Royal Road of the Achaemenid Persian Empire ran about 2,699 km (1,677 miles) from Susa to Sardis and was probably perfected under Darius I. Herodotus describes its stations and says a traveller on foot needed about ninety days. "
            "Royal mounted couriers (the angarium) changed horses at each station and could cover it in about nine days.",
    story="Herodotus wrote that neither snow nor rain nor heat nor gloom of night stops these couriers from finishing their stage at full speed. Each rider handed the message to a fresh man and horse at the next station, which is how the king's orders crossed the empire in days.",
    facts={"Length": "about 2,699 km Susa–Sardis", "Courier time": "about 9 days (relay)", "On foot": "about 90 days", "Built/perfected": "probably under Darius I (r. 522–486 BCE)"},
    content_citations=[HERODOTUS, W("Royal Road")])
R["via-appia"] = dict(
    history="The Via Appia is named after the censor Appius Claudius Caecus, who began its first section in 312 BCE as a military road south from Rome during the Samnite Wars. It was later extended to Brundisium (Brindisi), the port for Greece and the east, and the Romans called it the regina viarum, the queen of the long roads.",
    story="Armies, officials and, from Augustus, the couriers of the cursus publicus used the Appia. Most of the people walking it were ordinary travellers going between Rome and the port at Brundisium, where ships left for Greece.",
    facts={"Begun": "312 BCE (Appius Claudius Caecus)", "Ends": "Rome – Brundisium", "Use": "military, official post, travellers and trade"},
    content_citations=[W("Appian Way"), W("Cursus publicus"), "Strabo, Geography 6.3.7, trans. H. C. Hamilton and W. Falconer (London: Bohn, 1854-1857) [public domain]"])
R["via-egnatia"] = dict(
    history="The Via Egnatia was built in the 2nd century BCE, ordered by Gnaeus Egnatius, proconsul of Macedonia, according to milestone inscriptions. It ran about 1,120 km from Dyrrachium (Durrës) on the Adriatic, over the mountains past Lake Ohrid and across Macedonia and Thrace to Byzantium. Together with the Via Appia and a sea crossing, it linked Rome to the East.",
    story="Travellers crossed from Brundisium to Dyrrachium by ship, then walked or rode the Egnatia east. Roman armies of the civil wars marched along it, and later the road carried Byzantine and Ottoman traffic toward Constantinople.",
    facts={"Built": "2nd century BCE (Gnaeus Egnatius; exact date uncertain)", "Length": "about 1,120 km", "Ends": "Dyrrachium – Byzantium"},
    content_citations=[W("Via Egnatia"), "Strabo, Geography 7.7.4 (quoting Polybius) [public domain]"])
R["qhapaq-nan-quito-cusco"] = dict(
    history="The Qhapaq Ñan was the Inca road system, a network of roughly 40,000 km across what are now Colombia, Ecuador, Peru, Bolivia, Chile and Argentina. Relay stations for chasqui runners stood at short intervals, and tambos a day's walk apart supplied travellers and llama herds. It became a UNESCO World Heritage Site in 2014.",
    story="Messages travelled by relay: one chasqui ran a short stage and passed the message and knotted-cord quipu to the next runner. Llama trains carried loads along the same road, and the llama was the only beast of burden in the Inca Empire.",
    facts={"Network length": "about 40,000 km (estimates vary up to 60,000)", "Runners": "chasqui relay", "Pack animal": "llama (about 25–30 kg loads)", "UNESCO": "2014"},
    content_citations=[W("Qhapaq Ñan"), W("Llama"), "Pedro de Cieza de León, The Travels of Pedro de Cieza de León, A.D. 1532-50, trans. C. R. Markham (London: Hakluyt Society, 1864) [public domain]"])
R["incense-route"] = dict(
    history="Frankincense and myrrh from southern Arabia went by caravan north through Shabwa, the kingdoms of Qataban, Saba and Ma'in, and Nabataean Petra to Gaza on the Mediterranean. The Nabataeans built their wealth on this trade. UNESCO lists parts of it as World Heritage: the Frankincense Trail in Oman (2000) and the desert cities in the Negev (2005).",
    story="Pliny the Elder describes the incense being carried to Shabwa under guard and taxed at stop after stop. By his account, the dues and fees along the way multiplied the price before it reached the Mediterranean.",
    facts={"Goods": "frankincense, myrrh, spices", "Animal": "dromedary camel", "Key cities": "Shabwa – Najran – Petra – Gaza"},
    content_citations=[W("Incense trade route"), "Pliny the Elder, Natural History 12.30-32 [public domain]"])
R["silk-road-changan-samarkand"] = dict(
    history="The Silk Road began with the Han dynasty's push into Central Asia after the missions of the envoy Zhang Qian, around 130–114 BCE. Caravans left Chang'an and went along the Hexi Corridor and around the Taklamakan to Kashgar, then over the Pamirs to Sogdiana. Sogdian merchants ran much of the trade between China and Central Asia until about the 10th century.",
    story="Few caravans went the whole way. Most goods passed hand to hand from oasis to oasis. Letters from Sogdian traders left near Dunhuang in the 4th century show families running trade networks across thousands of kilometres (see Hansen).",
    facts={"Opened": "c. 130–114 BCE (Han missions of Zhang Qian)", "Traders": "Sogdians prominent to c. 10th century", "Goods": "silk, paper, horses, silver, glass, spices"},
    content_citations=[W("Silk Road"), "Valerie Hansen, The Silk Road: A New History (Oxford: Oxford University Press, 2012)"])
R["silk-road-samarkand-antioch"] = dict(
    history="West of Samarkand the caravan roads crossed Parthian and later Sasanian Persia toward Mesopotamia and Syria. Isidore of Charax's Parthian Stations (1st century BCE/CE) lists the halts and distances of the Parthian road from the Euphrates eastward. Rome bought silk through Persian middlemen. From 1453 the Ottomans competed with other empires for control of these routes, and Europeans looked for sea routes around them.",
    story="Isidore's itinerary reads like a road sign list: a station, then the distance in schoeni to the next, from Zeugma on the Euphrates across Mesopotamia and Media toward Arachosia. It is one of the oldest surviving route guides.",
    facts={"Source itinerary": "Isidore of Charax, Parthian Stations", "Middlemen": "Parthian, then Sasanian Persia", "Goods": "silk west; silver, glass, wool east"},
    content_citations=[W("Silk Road"), "Isidore of Charax, Parthian Stations, trans. W. H. Schoff (Philadelphia: Commercial Museum, 1914) [public domain]"])
R["trans-saharan-gold-salt"] = dict(
    history="Camel caravans linked North Africa with West Africa's gold fields. The western route ran from Sijilmasa past the salt mines of Taghaza to the Niger bend. Under the Mali Empire, cities such as Timbuktu, Gao and Djenné prospered, and in Timbuktu salt sometimes traded nearly weight for weight with gold.",
    story="In the mid-14th century Ibn Battuta crossed from Sijilmasa via Taghaza, where houses were built of salt blocks, to Oualata. He reported that an average caravan had about 1,000 camels and that some had as many as 12,000.",
    facts={"Goods": "gold and enslaved people north; salt, cloth, copper and horses south", "Caravan size": "about 1,000 camels typical; up to 12,000 (Ibn Battuta)", "Key towns": "Sijilmasa – Taghaza – Oualata/Timbuktu"},
    content_citations=[W("Trans-Saharan trade"), W("Sijilmasa"), "Nehemia Levtzion, Ancient Ghana and Mali (London: Methuen, 1973)"])

# ---------------- canals and rivers ----------------
R["erie-canal"] = dict(
    history="The Erie Canal opened on 26 October 1825 and ran 363 miles (584 km) from Albany on the Hudson to Buffalo on Lake Erie. Critics called it 'Clinton's Ditch', but the legislature approved $7 million in 1817 and tolls covered the state's construction debt within the first year. It was enlarged several times, and from 1905 to 1918 most of the old line was replaced by the New York State Barge Canal.",
    story="On opening day Governor DeWitt Clinton rode a canal boat from Buffalo to New York and poured a keg of Lake Erie water into the Atlantic, the 'Wedding of the Waters'. After that, mule-towed boats carried western grain east and settlers west.",
    facts={"Opened": "26 October 1825", "Length": "363 mi (584 km)", "Cost": "about $7 million", "Towing": "mules and horses on the towpath", "Successor": "NYS Barge Canal (1918)"},
    content_citations=[W("Erie Canal"), "Peter L. Bernstein, Wedding of the Waters: The Erie Canal and the Making of a Great Nation (New York: Norton, 2005)"])
R["panama-canal-route"] = dict(
    history="The Panama Canal formally opened on 15 August 1914 with the transit of the cargo ship SS Ancon. It cut thousands of miles from the New York–San Francisco sea route, which before had to go around Cape Horn or through the Strait of Magellan. The United States ran the canal until Panama took full control at noon on 31 December 1999.",
    story="The first official transit took place days after the First World War broke out in Europe, so the opening got little attention. The canal still changed coast-to-coast American shipping almost at once.",
    facts={"Opened": "15 August 1914 (SS Ancon)", "Panamanian control": "31 December 1999", "Route drawn": "New York – Colón – Panama – San Francisco (reconstruction)"},
    content_citations=[W("Panama Canal"), "David McCullough, The Path Between the Seas (New York: Simon & Schuster, 1977)"])
R["grand-canal-yuan-ming"] = dict(
    history="The Grand Canal is the longest canal in the world; its main stem from Hangzhou to Beijing is about 1,776 km. Emperor Yang of Sui joined older canals into a network by 609. Under the Yuan and Ming the line was straightened toward Beijing so that grain barges could feed the capital. In 1855 the Yellow River changed course and cut the canal in Shandong. It became a UNESCO World Heritage Site in 2014.",
    story="Marco Polo described the canal and the huge grain traffic on it. For centuries tribute grain from the Yangtze delta went north in convoys of state barges.",
    facts={"Length": "about 1,776 km (Hangzhou–Beijing)", "Network joined": "by 609 (Sui)", "Cut": "1855 (Yellow River shift)", "Goods": "tribute grain, salt, silk", "UNESCO": "2014"},
    content_citations=[W("Grand Canal (China)"), "Marco Polo, The Book of Ser Marco Polo, trans. H. Yule, 3rd ed. (1903) [public domain]"])

# ---------------- classical seas ----------------
R["athens-black-sea-grain"] = dict(
    history="Classical Athens could not feed itself and imported grain, much of it from the Black Sea through the Hellespont. Silver from the Laurion mines paid for a fleet of 200 triremes, and the navy kept the straits open for the grain ships. Losing that route, as after the defeat at Aegospotami in 405 BCE, meant the city could be starved.",
    story="Grain merchant ships sailed south through the Bosporus and the Hellespont. Trireme squadrons guarded the straits, because a hostile fleet there could cut off Athens's bread supply.",
    facts={"Goods": "grain (wheat)", "Escort": "Athenian triremes", "Funding": "Laurion silver (fleet of 200 triremes)"},
    content_citations=[W("Athenian navy"), W("Trireme"), "Alfonso Moreno, Feeding the Democracy (Oxford: Oxford University Press, 2007)"])
R["roman-alexandria-ostia-grain"] = dict(
    history="Rome's grain supply, the cura annonae, depended heavily on Egyptian wheat shipped from Alexandria. Ships unloaded at Puteoli and later at Portus near Ostia, the harbour built by Claudius and enlarged by Trajan. With a following wind, Italy to Alexandria could take as little as about 14 days. The return trip against the wind took much longer.",
    story="Lucian describes the grain ship Isis, driven off course to the Piraeus. She was about 55 m long, and crowds came to stare at her. The big grain ships were the largest merchant ships of the ancient world.",
    facts={"Goods": "Egyptian wheat", "Italian ports": "Puteoli; Portus/Ostia", "Big ship example": "Isis, about 55 m (Lucian)", "Fast passage": "about 14 days Italy→Alexandria"},
    content_citations=[W("Cura Annonae"), "Lionel Casson, Ships and Seamanship in the Ancient World (Princeton, 1971)"])
R["red-sea-muziris"] = dict(
    history="Roman Egyptian ships sailed from Red Sea ports with the monsoon to Muziris on the Malabar coast of India, the main port of the Chera kingdom for pepper. The Periplus of the Erythraean Sea (1st century CE) describes the trade, and a 2nd-century papyrus records a loan contract on a cargo shipped from Muziris to Alexandria. Muziris disappeared, probably after a Periyar River flood in 1341.",
    story="The Muziris papyrus (now in Vienna) records the cargo of a ship called the Hermapollon, including chests of Gangetic nard and a huge quantity of pepper, all financed on credit and taxed when it reached Egypt.",
    facts={"Goods": "pepper, spices, gems, textiles; Roman gold and wine outbound", "Wind": "SW monsoon out, NE monsoon home", "Source": "Periplus (1st c. CE); Muziris papyrus (2nd c. CE)"},
    content_citations=[W("Muziris"), W("Periplus of the Erythraean Sea"), "Lionel Casson (ed. and trans.), The Periplus Maris Erythraei (Princeton, 1989)"])
R["constantinople-grain"] = dict(
    history="After Constantine founded Constantinople, Egyptian grain shipments were sent there instead of to Rome. The cura annonae lasted in Constantinople in reduced form into the 7th century, and the free bread dole ended after Egypt was lost to the Persians in 618–619.",
    story="Each year the grain fleet sailed from Alexandria up the Aegean and through the Dardanelles to the capital. The city depended on its arrival, and if the fleet was late, Constantinople went hungry.",
    facts={"Goods": "Egyptian wheat", "Ended": "about 618 (Persian conquest of Egypt)"},
    content_citations=[W("Cura Annonae"), "A. H. M. Jones, The Later Roman Empire, 284-602 (Oxford, 1964)"])

# ---------------- medieval seas ----------------
HANSA = [W("Hanseatic League"), "Philippe Dollinger, The German Hansa, trans. D. S. Ault and S. H. Steinberg (Stanford, 1970)"]
R["hanseatic-baltic-trunk"] = dict(
    history="The Hanseatic League grew from Lübeck and other north German towns in the late 12th century into a league of nearly 200 settlements. Before the Hansa, Visby on Gotland was the leading Baltic centre, and its merchants founded a trading post at Novgorod in 1080. The Hansa's diets met in Lübeck from about 1300 (formally from 1356 or 1358). The league slowly came apart, and its last diet met in 1669.",
    story="Cogs carried grain, furs, wax and timber west from the Baltic, and cloth, salt and wine east. A Bremen cog wreck dated about 1380 shows what such a ship could carry: about 130 tons.",
    facts={"Founded": "late 12th century (Lübeck)", "Members": "nearly 200 settlements", "Last diet": "1669", "Ship": "cog (about 130 t capacity, Bremen cog)"},
    content_citations=HANSA + [W("Bremen cog")])
R["hanseatic-bergen"] = dict(
    history="At Bergen the Hansa ran a kontor on the Bryggen wharf. Its warehouses stored stockfish (dried cod) from northern Norway and grain from Europe. Bryggen has been a UNESCO World Heritage Site since 1979.",
    story="German merchants at Bryggen lived in a closed, all-male community. They paid for stockfish with grain, which northern Norway needed. The dried cod was shipped on through Lübeck to the rest of Europe.",
    facts={"Goods": "stockfish north→south; grain in", "Kontor": "Bryggen, Bergen", "UNESCO": "1979"},
    content_citations=HANSA + [W("Bryggen")])
R["hanseatic-bruges-london"] = dict(
    history="In London the Hansa's kontor was the Steelyard (Stâlhof, named as early as 1320). It was once the largest medieval trading complex in Britain, and Elizabeth I abolished its privileges in 1598. Its site is now under Cannon Street station. Bruges was the Hansa's great western market in Flanders.",
    story="In 1988 archaeologists working at Cannon Street station found the remains of the Steelyard, centuries after its merchants had left. Steelyard Passage and Hanseatic Walk are still named after it.",
    facts={"London kontor": "Steelyard (to 1598)", "Flanders": "Bruges", "Goods": "wool, cloth, wine"},
    content_citations=HANSA + [W("Steelyard")])
LANE = "Frederic C. Lane, Venice: A Maritime Republic (Baltimore: Johns Hopkins University Press, 1973)"
R["venetian-alexandria-muda"] = dict(
    history="The Venetian mude were state-organised convoys of great merchant galleys (galee grosse da mercato) led by a captain appointed by the state, with the galleys auctioned to merchants for each voyage. The state first paid for merchant galleys in 1290. The system ran continuously from 1315 to 1533, and the Alexandria line brought spices back from Mamluk Egypt.",
    story="Each year the galleys of the Alexandria muda sailed together on a fixed schedule set by the Senate. They loaded pepper and spices that had come up the Red Sea from India, and brought them back to the Rialto for sale across Europe.",
    facts={"Organiser": "Venetian state (Senate)", "Ships": "great merchant galleys", "System": "1315–1533", "Goods": "spices, silk, cotton; silver and cloth out"},
    content_citations=[W("Muda (convoy)"), LANE])
R["venetian-constantinople"] = dict(
    history="The Venetian Romania galleys went to Constantinople and the Black Sea. In 1290 the state for the first time paid for ten merchant galleys bound for the Byzantine Empire. The route lasted until the Ottoman conquest of Constantinople in 1453.",
    story="The galleys called at Venetian bases in Greece on the way to the Byzantine capital. There they loaded silk, alum and grain, and some went on into the Black Sea.",
    facts={"State galleys first": "1290 (ten galleys to Byzantium)", "Ended": "1453", "Goods": "silk, alum, grain, spices"},
    content_citations=[W("Muda (convoy)"), LANE])
R["venetian-flanders-galleys"] = dict(
    history="From the early 14th century, Venetian galley convoys sailed out of the Mediterranean through the Strait of Gibraltar to Southampton, London and Bruges. They carried spices and sweet wine north and brought back wool and cloth. The line was part of the muda system (1315–1533).",
    story="The Flanders galleys were the longest of the muda voyages, a round trip of many months. Their arrival in an English or Flemish port was a major event at the market.",
    facts={"Route": "Venice – Gibraltar – Southampton/London – Bruges", "System": "1315–1533", "Goods": "spices, sweet wine; wool and cloth back"},
    content_citations=[W("Muda (convoy)"), LANE])
EPSTEIN = "Steven A. Epstein, Genoa and the Genoese, 958–1528 (Chapel Hill: University of North Carolina Press, 1996)"
R["genoese-black-sea"] = dict(
    history="The Treaty of Nymphaeum (1261) gave Genoa great privileges in the Byzantine world. Genoese merchants held Pera (Galata) across the Golden Horn and founded Caffa in Crimea, which became their main Black Sea colony until the Ottomans took it in 1475. The trade included grain, furs, silk, alum and enslaved people.",
    story="In 1347 the Black Death is believed to have reached Europe for the first time through Caffa, carried by Genoese ships leaving the besieged colony. That story ties this trade route to the worst pandemic of the Middle Ages.",
    facts={"Treaty": "Nymphaeum, 1261", "Colonies": "Pera (Galata), Caffa", "Caffa fell": "1475 (Ottomans)", "Goods": "grain, furs, silk, alum, enslaved people"},
    content_citations=[W("Genoese colonies"), W("Caffa"), EPSTEIN])
R["genoese-trebizond"] = dict(
    history="Trebizond on the southern Black Sea coast was the capital of an empire founded in 1204 that lasted until Mehmed II conquered it in 1461. It was the end point of a caravan road from Tabriz and Persia, and Genoese and Venetian ships came there for silk and spices.",
    story="Silk from Persia reached Trebizond overland, where Italian ships loaded it and carried it west through Pera.",
    facts={"Empire of Trebizond": "1204–1461", "Goods": "silk, spices, alum"},
    content_citations=[W("Empire of Trebizond"), EPSTEIN])
CHAUDHURI = "K. N. Chaudhuri, Trade and Civilisation in the Indian Ocean (Cambridge: Cambridge University Press, 1985)"
R["indian-ocean-aden-calicut-malacca"] = dict(
    history="Indian Ocean trade ran on the monsoon winds: south-west from about April to September, north-east in winter. Calicut (Kozhikode), capital of the Zamorins, was a main pepper port where Arab merchants had traded since the 7th century. Vasco da Gama landed there on 20 May 1498, and after that the Portuguese tried to control these seas.",
    story="In 1345 Ibn Battuta stayed in Calicut as a guest of the Zamorin and saw Chinese junks in the harbour. Dhows from Aden, junks from China and Malay ships all met in the same ports, each timing its voyage to the monsoon.",
    facts={"Goods": "pepper, spices, textiles, horses", "Wind": "monsoon (seasonal)", "Calicut": "da Gama landed 20 May 1498"},
    content_citations=[W("Calicut"), W("Indian Ocean trade"), W("Ibn Battuta"), CHAUDHURI])
R["indian-ocean-east-africa-india"] = dict(
    history="Kilwa took control of Sofala in the late 12th century, which put it at the outlet of the gold and ivory trade from Great Zimbabwe and Monomatapa. Kilwa's sultans used the gold to extend their power along the Swahili coast. In 1505 Francisco de Almeida landed about 500 Portuguese soldiers at Kilwa, and the Portuguese built a fort at Sofala.",
    story="Sofala's gold paid for Kilwa's stone mosques and palaces. Monsoon dhows carried the gold and ivory to India and brought back cloth and beads.",
    facts={"Goods": "gold, ivory, textiles, beads", "Key ports": "Sofala, Kilwa", "Portuguese": "Kilwa taken 1505"},
    content_citations=[W("Kilwa Sultanate"), CHAUDHURI])
R["indian-ocean-hormuz-calicut"] = dict(
    history="Hormuz at the mouth of the Persian Gulf was a great entrepôt for Gulf horses and pearls going to India. Afonso de Albuquerque attacked it in 1507, the Portuguese held it from 1515 to 1622, and then Shah Abbas the Great took it with English help.",
    story="Indian kingdoms imported war horses by the shipload, because horses bred poorly in the south. Ships from Hormuz carried them to the Malabar ports and came back with pepper and cloth.",
    facts={"Goods": "horses, pearls; pepper and textiles back", "Portuguese Hormuz": "1515–1622"},
    content_citations=[W("Kingdom of Ormus"), CHAUDHURI])
R["maritime-silk-road-polo-1291"] = dict(
    history="Around 1291 the Polos left China by sea as escorts for the Mongol princess Kököchin, who was travelling to marry the Ilkhan of Persia. They sailed from Quanzhou through Southeast Asia and India to Hormuz. Marco Polo was back in Venice in 1295 after 24 years away.",
    story="By Polo's account (Yule's translation) the fleet had 14 ships and the voyage took about two years. Many of the travellers died on the way. When they reached Persia the Ilkhan Arghun had died, so the princess married his son Ghazan instead [figures from Polo's own account; not independently verified].",
    facts={"Departed": "c. 1291, Quanzhou", "Arrived": "Hormuz, c. 1293", "Ships": "14 (Polo's account)", "Polo home": "1295"},
    content_citations=[W("Marco Polo"), "Marco Polo, The Book of Ser Marco Polo, trans. H. Yule, 3rd ed. (1903) [public domain]"])
R["ibn-battuta-calicut-quanzhou"] = dict(
    history="Ibn Battuta travelled from 1325 to 1354. In Calicut he was the guest of the Zamorin. He then sailed east by way of Bengal and Southeast Asia and reached Quanzhou (Zaitun) in 1345. He later dictated the Rihla describing his travels.",
    story="At Calicut a storm wrecked the Chinese junk that was carrying the gifts of the Sultan of Delhi he was escorting. He went on alone, as he tells it, and finally reached Zaitun, which he called one of the greatest ports in the world.",
    facts={"Traveller": "Ibn Battuta (1304–c. 1368/69)", "Reached Quanzhou": "1345", "Source": "the Rihla"},
    content_citations=[W("Ibn Battuta"), "Ibn Battuta, Voyages d'Ibn Batoutah, ed. Defrémery and Sanguinetti (Paris, 1853-1858) [public domain]"])
DREYER = "Edward L. Dreyer, Zheng He: China and the Oceans in the Early Ming Dynasty, 1405–1433 (New York: Pearson Longman, 2006)"
R["zheng-he-trunk"] = dict(
    history="The Ming treasure fleets under Zheng He made seven voyages between 1405 and 1433. Ships built at the Longjiang yard gathered at Liujiagang on the Yangtze. On the first voyage there were 317 ships, 62 of them treasure ships, with 27,800 men. The first three voyages went by Champa, Java, Sumatra and Malacca to Ceylon and Calicut.",
    story="Before each departure Zheng He made sacrifices to the sea goddess Tianfei at Liujiagang. The fleet then sailed with the north-east monsoon, stopping to deliver gifts and bring back envoys and tribute to the Yongle Emperor.",
    facts={"Voyages": "7, 1405–1433", "First voyage": "317 ships (62 treasure ships), 27,800 men", "Assembly": "Liujiagang", "Commander": "Zheng He"},
    content_citations=[W("Ming treasure voyages"), W("Zheng He"), DREYER])
R["zheng-he-west"] = dict(
    history="From the fourth voyage (1413) the fleets went past India to Hormuz, Aden and the East African coast: Mogadishu, Brava and Malindi. On the last voyage the fleet reached Hormuz on 17 January 1433.",
    story="Envoys from Malindi sent a giraffe to the Ming court in 1415, where it was greeted as a qilin, a lucky mythical beast (see Dreyer).",
    facts={"From": "1413 (4th voyage)", "Furthest": "Mogadishu, Brava, Malindi", "Hormuz (7th voyage)": "17 January 1433"},
    content_citations=[W("Ming treasure voyages"), DREYER])
R["manila-galleon-outbound"] = dict(
    history="The Manila galleons crossed the Pacific between Acapulco in New Spain and Manila from 1565 to 1815, usually one or two round trips a year. Westbound ships sailed the trade winds, carrying Mexican and Peruvian silver to buy Chinese silk and porcelain in Manila.",
    story="Silver from American mines crossed the Pacific in these ships and paid Chinese merchants in Manila. Historians see this as the start of a truly global trade.",
    facts={"Years": "1565–1815", "Goods": "silver westbound", "Frequency": "1–2 round trips a year"},
    content_citations=[W("Manila galleon"), "William Lytle Schurz, The Manila Galleon (New York: E. P. Dutton, 1939)"])
R["manila-galleon-return"] = dict(
    history="The return route, the tornaviaje, was worked out in 1565 by Andrés de Urdaneta. Galleons ran north to catch the westerlies and the Kuroshio current. They left Cavite at the end of June or early July and reached Acapulco around March or April of the following year, a crossing of at least four months.",
    story="Urdaneta's discovery made the whole system possible. Before him, ships could sail west across the Pacific but not come back. Return galleons were packed with silk and porcelain, and scurvy often killed many of the crew on the long crossing.",
    facts={"Route found": "1565 (Urdaneta)", "Crossing": "at least four months", "Goods": "silk, porcelain, spices eastbound"},
    content_citations=[W("Manila galleon"), "William Lytle Schurz, The Manila Galleon (New York: E. P. Dutton, 1939)"])

# ---------------- Norse ----------------
JONES = "Gwyn Jones, The Norse Atlantic Saga (Oxford: Oxford University Press, 1964; 2nd ed. 1986)"
R["viking-norway-iceland"] = dict(
    history="By tradition, Íslendingabók and Landnámabók date the settlement of Iceland to 870–874, with Ingólfr Arnarson as the first permanent settler, and put the end of the settlement age at 930, when the Althing was founded. Landnámabók names about 1,500 farms and places and more than 3,500 people.",
    story="Landnámabók says Ingólfr threw his high-seat pillars overboard off the coast and settled where they washed ashore, at Reykjavík. Settlers crossed from western Norway in open ships with their families and livestock.",
    facts={"Settlement": "c. 870/874–930", "First settler (tradition)": "Ingólfr Arnarson", "Ship": "knarr (cargo) more than warship"},
    content_citations=[W("Settlement of Iceland"), JONES])
R["viking-iceland-greenland"] = dict(
    history="Erik the Red explored Greenland and returned in 985 with a fleet of 25 ships; 14 arrived, and the others turned back or were lost. He founded the Eastern Settlement and his farm Brattahlíð. The last written record from Norse Greenland is a marriage at Hvalsey in 1408.",
    story="Of Erik's 25 ships, 11 never reached Greenland. The colony that survived lasted more than four centuries before it vanished, for reasons still debated.",
    facts={"Founding voyage": "985, 25 ships (14 arrived)", "Last record": "1408 marriage at Hvalsey"},
    content_citations=[W("Erik the Red"), W("Norse colonization of North America"), JONES])
R["varangian-route"] = dict(
    history="The route from the Varangians to the Greeks ran from the Baltic up rivers, across portages and down the Dnieper past Kiev to the Black Sea and Constantinople. The Primary Chronicle (early 12th century) names it. Emperor Constantine VII's De Administrando Imperio (10th century) describes the Rus coming down the Dnieper each year and portaging around seven rapids.",
    story="Constantine VII gives the names of the Dnieper rapids in both Norse and Slavic. At each one the Rus unloaded their boats and dragged them along the bank while watching for Pecheneg attacks.",
    facts={"Rivers": "Volkhov, Lovat, Dnieper", "Hazards": "seven Dnieper rapids; Pecheneg raids", "Sources": "De Administrando Imperio ch. 9; Primary Chronicle"},
    content_citations=[W("Trade route from the Varangians to the Greeks"), "Constantine VII Porphyrogenitus, De Administrando Imperio, ch. 9"])

# ---------------- Atlantic ----------------
SLAVE = [W("Atlantic slave trade"), W("Triangular trade"), W("Middle Passage")]
R["atlantic-triangle-outward"] = dict(
    history="Liverpool and Bristol merchants moved into the African slave trade after the Royal African Company lost its monopoly in 1698. Ships left British ports loaded with manufactured goods, guns and ammunition, and textiles to buy captives on the West African coast. Britain abolished its slave trade in 1807.",
    story="This leg was the 'outward passage'. The goods carried on it were traded for people. The ship model shown is a stand-in East Indiaman. Real slave ships were usually smaller, purpose-fitted merchantmen.",
    facts={"Goods": "textiles, metalware, guns, ammunition", "British abolition": "1807", "Ship model": "stand-in (not a slaver type)"},
    content_citations=SLAVE + ["Eric Williams, Capitalism and Slavery (Chapel Hill, 1944)"])
R["atlantic-middle-passage"] = dict(
    history="The transatlantic slave trade carried off an estimated 12.5 million captives from Africa. About 10.7 million survived the crossing to the Americas. By the 19th century the Middle Passage took about five to seven weeks. Death rates varied widely, and on some voyages reached 47–58%.",
    story="Olaudah Equiano, who was enslaved as a child, described the Middle Passage in 1789: the hold, the chains and the smell. His account became one of the key texts of the abolition campaign. This route is shown as a record of people, not as cargo.",
    facts={"Embarked": "about 12.5 million (whole trade)", "Survived": "about 10.7 million", "Crossing": "5–7 weeks (19th c.)", "Witness": "Olaudah Equiano (1789)"},
    content_citations=SLAVE + ["Olaudah Equiano, The Interesting Narrative of the Life of Olaudah Equiano (London, 1789) [public domain]"])
R["atlantic-triangle-return"] = dict(
    history="On the last leg, ships carried sugar, rum and other plantation goods back to Britain. These goods were produced by enslaved labour in the Caribbean. Eric Williams argued that profits from this triangle helped finance British industry.",
    story="The voyage home closed the triangle. Sugar from Jamaican plantations was unloaded at Liverpool docks, and the ship was fitted out again for Africa.",
    facts={"Goods": "sugar, rum, molasses, cotton", "Thesis": "Williams, Capitalism and Slavery (1944)"},
    content_citations=SLAVE + ["Eric Williams, Capitalism and Slavery (Chapel Hill, 1944)"])

# ---------------- VOC / EIC ----------------
R["das-amsterdam-1595"] = dict(
    history="The Compagnie van Verre raised 290,000 guilders and fitted out four ships, Mauritius, Amsterdam, Hollandia and Duifje, with 248 men. Petrus Plancius trained the navigators. They left Texel on 2 April 1595 and lost 71 men during six months at Madagascar. They reached Bantam in June 1596, and only 94 men were still alive when the ships went home. The expedition still made a profit, and it opened the spice trade to the merchants who later formed the VOC in 1602.",
    story="The voyage went badly: the officers quarrelled, Bantam refused them, de Houtman was captured and ransomed, and twelve men including Amsterdam's skipper were killed at Sidayu. Amsterdam was in such bad condition that she was burnt. The other three ships left Bali on 26 February 1597 and reached Texel on 14 August 1597.",
    facts={"Fleet": "Amsterdam, Mauritius, Hollandia, Duifje", "Crew": "248 out; about 94 survived to the return", "Departed": "Texel, 2 April 1595", "Home": "Texel, 14 August 1597 (three ships)", "Cargo home": "245 bags of pepper, 41 t nutmeg, 30 bales of mace"},
    content_citations=[W("First Dutch Expedition to the East Indies"), BGS])
R["das-patriot-1780"] = dict(
    history="Voyage 4367.3 in the Dutch-Asiatic Shipping record went from Texel on 4 January 1780 to Batavia on 22 July 1780, via the Cape. Later that year, in December 1780, Britain declared war on the Dutch Republic (the Fourth Anglo-Dutch War, 1780–1784). The war cost the VOC heavily, and the company was dissolved in 1799.",
    story="This is one of the last VOC outward voyages before the war: Patriot reached Batavia five months before Britain declared war. The ship's size, crew and cargo are in the DAS database, which is not bundled here [UNKNOWN in this build].",
    facts={"Departed": "Texel, 4 January 1780", "Arrived": "Batavia, 22 July 1780", "Tonnage, crew, cargo": "[UNKNOWN] (in DAS, not bundled)"},
    content_citations=[BGS, W("Fourth Anglo-Dutch War"), W("Dutch East India Company")])
R["voc-return-fleet"] = dict(
    history="The VOC was set up on 20 March 1602. In 1619 it made Jayakarta its Asian headquarters and renamed it Batavia. Between 1602 and 1796 it sent nearly a million Europeans to Asia on 4,785 ships. Return fleets brought pepper, spices, textiles, tea and porcelain home in convoy, usually by way of the Cape.",
    story="Return ships left Batavia around the turn of the year and stopped at the Cape for fresh food. They reached the Dutch coast in the summer, where the sale of their cargo set prices across Europe.",
    facts={"VOC founded": "20 March 1602", "Batavia": "1619", "Ships sent": "4,785 (1602–1796)", "Dissolved": "1799"},
    content_citations=[W("Dutch East India Company"), BGS])
R["eic-london-madras"] = dict(
    history="The English East India Company was chartered on 31 December 1600. In 1639 Francis Day bought coastal land from the ruler of Chandragiri, and Fort St George at Madras was completed on 23 April 1644. The company stopped trading in 1833 and was dissolved in 1874.",
    story="East Indiamen sailed around the Cape to the Coromandel Coast and brought back cotton cloth (calico and chintz), which became fashionable in Britain. Fort St George grew into the city of Madras (now Chennai).",
    facts={"Charter": "31 December 1600", "Madras land": "1639 (Francis Day)", "Fort St George": "completed 23 April 1644", "Trade ended": "1833", "Dissolved": "1874"},
    content_citations=[W("East India Company"), W("Fort St. George, India"), "K. N. Chaudhuri, The Trading World of Asia and the English East India Company (Cambridge, 1978)"])

# ---------------- logbook ----------------
R["cliwoc-launceston-1769"] = dict(
    history="This is the only track in SeaGlobe drawn from real logged positions. It shows 32 daily noon positions of HMS Launceston between Halifax and Plymouth, 7 September – 8 October 1769, from the ship's logbook (National Maritime Museum, ADM/L/L53), digitised by the CLIWOC climate project. Launceston was a 44-gun fifth rate in Royal Navy service from 1741 to 1784.",
    story="Each noon the officer of the watch wrote down the ship's position, wind and weather. More than 250 years later, climate scientists used those entries to rebuild the Atlantic weather of 1769, and SeaGlobe uses the same entries to draw the ship's track.",
    facts={"Dates": "7 Sep – 8 Oct 1769", "Positions": "32 daily noons (logged)", "Ship": "HMS Launceston, 44-gun fifth rate (1741–1784)", "Log": "NMM ADM/L/L53"},
    content_citations=["García-Herrera et al., PANGAEA (2010), https://doi.org/10.1594/PANGAEA.750354, CC BY 3.0", W("HMS Launceston")])

# ---------------- steam and containers ----------------
R["great-western-1838"] = dict(
    history="SS Great Western, designed by Isambard Kingdom Brunel, was the first steamship built specially for the Atlantic crossing. She was launched at Bristol on 19 July 1837. A fire before the maiden voyage injured Brunel, and more than 50 passengers cancelled. She left on 8 April 1838 with only seven passengers.",
    story="The rival company chartered the small steamer Sirius to beat her. Sirius reached New York on 22 April, and Great Western arrived the next day with 200 tons of coal still aboard. That showed a big steamship could cross the Atlantic with fuel to spare.",
    facts={"Departed": "Avonmouth, 8 April 1838", "Arrived": "New York, 23 April 1838", "Passengers": "7", "Coal left": "200 tons"},
    content_citations=[W("SS Great Western"), "Denis Griffiths, Brunel's 'Great Western' (Wellingborough, 1985)"])
R["suez-steam-bombay"] = dict(
    history="The Suez Canal, built by Ferdinand de Lesseps's company, opened on 17 November 1869. Steamers to India no longer had to go round the Cape. P&O, which held British mail contracts from 1837 and to Alexandria from 1840, became the main British line to Bombay by way of the canal. Egypt nationalised the canal in 1956.",
    story="Before 1869, passengers and mail got off at Alexandria, crossed the desert overland and boarded another ship at Suez. The canal let a single steamer go all the way from Britain to Bombay.",
    facts={"Canal opened": "17 November 1869", "Main line": "P&O", "Nationalised": "1956"},
    content_citations=[W("Suez Canal"), W("P&O (company)"), "Freda Harcourt, Flagships of Imperialism (Manchester, 2006)"])
R["ideal-x-1956"] = dict(
    history="On 26 April 1956 Malcom McLean's converted T2 tanker Ideal X carried 58 containers from Port Newark to Houston, where 58 trucks were waiting. It is usually counted as the start of commercially successful container shipping.",
    story="McLean, a trucking owner, decided that loading the whole trailer box on a ship was cheaper than unloading and reloading every crate. On arrival in Houston the boxes were lifted straight onto trucks.",
    facts={"Date": "26 April 1956", "Containers": "58", "Ship": "Ideal X (ex-T2 tanker Potrero Hills)", "Owner": "Pan-Atlantic Steamship Co. (McLean)"},
    content_citations=[W("SS Ideal X"), W("Containerization"), LEVINSON])
R["shanghai-rotterdam-containers"] = dict(
    history="After China opened its economy from 1978, Asia–Europe container lines through the Suez Canal grew into one of the world's main trade routes. About 90% of non-bulk cargo now goes by container ship, and since 2023 the largest ships carry more than 24,000 TEU.",
    story="A box loaded in Shanghai passes Singapore, the Indian Ocean, the Red Sea and Suez on its way to the Maasvlakte terminals at Rotterdam. When the Red Sea is unsafe, ships go around the Cape instead [UNKNOWN: specific diversion dates not compiled].",
    facts={"Largest ships": "over 24,000 TEU (from 2023)", "Share": "about 90% of non-bulk cargo by container"},
    content_citations=[W("Container ship"), LEVINSON])
R["transpacific-containers"] = dict(
    history="The trans-Pacific container lane carries Asian manufactured goods to the US West Coast ports of Los Angeles and Long Beach. Capacity is measured in TEU (twenty-foot equivalent units), and NYK's Hakone Maru of 1968, at 752 TEU, is counted as the first ship built to the standard.",
    story="A ship leaving Shanghai follows the great circle north across the Pacific toward the Aleutians before turning down toward San Pedro Bay.",
    facts={"Unit": "TEU", "First TEU-standard ship": "Hakone Maru (NYK), 1968, 752 TEU"},
    content_citations=[W("Containerization"), W("Container ship"), LEVINSON])

# ---------------- rail ----------------
R["liverpool-manchester-railway"] = dict(
    history="The Liverpool and Manchester Railway opened on 15 September 1830. It was the first inter-city railway where every train was hauled by steam on a set timetable. Stephenson's Rocket won the Rainhill trials in October 1829, which settled the choice of locomotives.",
    story="On opening day William Huskisson MP was hit and killed by Rocket, the first widely reported railway death. The narrow gap between the two tracks played a part. The railway opened anyway, and passenger numbers were far higher than expected.",
    facts={"Opened": "15 September 1830", "Engineer": "George Stephenson", "Rainhill trials": "October 1829 (Rocket won)"},
    content_citations=[W("Liverpool and Manchester Railway"), "Simon Garfield, The Last Journey of William Huskisson (London, 2002)"])
R["first-transcontinental"] = dict(
    history="The first transcontinental railroad opened for through traffic on 10 May 1869, when the Central Pacific (690 miles east from Sacramento) met the Union Pacific (1,085 miles west from Council Bluffs/Omaha) at Promontory Summit, Utah. Thousands of Chinese labourers built most of the Central Pacific's line through the Sierra Nevada.",
    story="Leland Stanford tapped the golden 'Last Spike' with a silver hammer, and the news went out by telegraph. A trip across the continent that had taken months by wagon now took about a week.",
    facts={"Opened": "10 May 1869", "Central Pacific": "690 mi", "Union Pacific": "1,085 mi", "Meeting point": "Promontory Summit, Utah"},
    content_citations=[W("First transcontinental railroad"), "Stephen E. Ambrose, Nothing Like It in the World (New York, 2000)"])
R["trans-siberian-railway"] = dict(
    history="Russia announced the Trans-Siberian Railway on 9 March 1891 and built it between 1891 and 1916. It is 9,289 km from Moscow to Vladivostok, the longest railway line in the world, and has connected the two cities directly since 1916.",
    story="Trains leave from Yaroslavsky station in Moscow and pass Omsk, Novosibirsk, Krasnoyarsk, Irkutsk, Ulan-Ude, Chita and Khabarovsk before reaching the Pacific at Vladivostok.",
    facts={"Built": "1891–1916", "Length": "9,289 km", "Ends": "Moscow – Vladivostok"},
    content_citations=[W("Trans-Siberian Railway"), "Christian Wolmar, To the Edge of the World (London: Atlantic, 2013)"])

# ---------------- pipelines ----------------
R["trans-alaska-pipeline"] = dict(
    history="Oil was found at Prudhoe Bay in 1968. The Trans-Alaska Pipeline is 800 miles (1,287 km) of 48-inch (1.22 m) steel pipe from Prudhoe Bay to Valdez on Prince William Sound, and oil first flowed on 20 June 1977.",
    story="Oil from the North Slope crosses three mountain ranges and many rivers to reach tankers at Valdez. The 1989 Exxon Valdez spill involved one of those tankers, not the pipeline itself.",
    facts={"Length": "800 mi (1,287 km)", "Diameter": "48 in (1.22 m)", "First oil": "20 June 1977"},
    content_citations=[W("Trans-Alaska Pipeline System"), "Peter A. Coates, The Trans-Alaska Pipeline Controversy (Bethlehem, 1991)"])
R["druzhba-pipeline"] = dict(
    history="The Druzhba ('Friendship') pipeline has been in full operation since October 1964. It starts at Almetyevsk in Tatarstan, collecting oil from western Siberia, the Urals and the Caspian, and carries it more than 4,000 km into Europe. Its northern branch crosses Belarus and Poland to the Schwedt refinery in Germany.",
    story="Built to supply the Soviet Union's Eastern Bloc allies, Druzhba outlasted the bloc. It is still one of the longest oil pipelines in the world.",
    facts={"In service": "October 1964", "Start": "Almetyevsk", "Length": "over 4,000 km (system)", "Northern end": "Schwedt, Germany"},
    content_citations=[W("Druzhba pipeline"), "Jeronim Perović (ed.), Cold War Energy (Cham: Palgrave Macmillan, 2017)"])
R["btc-pipeline"] = dict(
    history="The Baku–Tbilisi–Ceyhan pipeline is 1,768 km long, from the Sangachal terminal near Baku through Georgia to Ceyhan on Turkey's Mediterranean coast. It was inaugurated at Sangachal on 25 May 2005, and the first oil reached Ceyhan on 28 May 2006. On 1 July 2026 SOCAR took over operation from BP.",
    story="The line was built to bring Caspian oil to world markets without crossing Russia or Iran. It crosses the Caucasus mountains on the way to the Mediterranean.",
    facts={"Length": "1,768 km", "First oil at Ceyhan": "28 May 2006", "Operator": "BP until 1 July 2026, then SOCAR"},
    content_citations=[W("Baku–Tbilisi–Ceyhan pipeline"), "S. F. Starr and S. E. Cornell (eds), The Baku-Tbilisi-Ceyhan Pipeline (Washington, 2005)"])
