"""v2.2 content pass: vehicle types (the 3D models) and named vessels/aircraft.

Same rules as content_routes.py: every fact cited, gaps marked [UNKNOWN].
Vehicle entries describe the real type the model stands for; the models are
artistic reconstructions (see ASSETS-LICENSES.md).
"""
from content_routes import W, BGS, LEVINSON

V = {}
def v(id, summary, history, story, facts, cites):
    V[id] = dict(summary=summary, history=history, story=story, facts=facts, content_citations=cites)

v("horse-rider", "Mounted courier or pack horses on an imperial road.",
  "Empires ran relay posts for official messages. The Persian angarium's riders changed horses at stations along the Royal Road and covered Susa–Sardis in about nine days. Augustus set up the Roman cursus publicus. He first copied the Persian relay, then changed it so one courier carried a message the whole way, using change stations (mutationes) and overnight inns (mansiones).",
  "Under the Romans, official news usually travelled about 50 Roman miles (80 km) a day, with overnight stops roughly every 25 miles.",
  {"Speed": "about 80 km/day (Roman post, typical)", "System": "Persian angarium; Roman cursus publicus"}, [W("Royal Road"), W("Cursus publicus")])
v("longship", "Norse ship: longship (war) or knarr (cargo).",
  "Viking ships were clinker-built of overlapping planks, with a single square sail and oars. Ship burials such as Oseberg (no earlier than 834) and Gokstad (late 9th century) preserved complete hulls. The knarr was the wider, deeper cargo ship that the North Atlantic settlers actually sailed to Iceland and Greenland.",
  "Settlers in knarrs crossed to Iceland and Greenland with cattle, sheep and household goods in an open hull. Of Erik the Red's 25 ships in 985, 14 arrived.",
  {"Build": "clinker, oak", "Rig": "single square sail + oars", "Examples": "Oseberg (≥834), Gokstad (c. 900), Skuldelev wrecks"}, [W("Longship"), W("Knarr"), W("Oseberg ship")])
v("barge", "Canal or river barge.",
  "Barges are flat-bottomed boats for canals and rivers. They were towed by people or animals from the towpath, and later by tugs. On China's Grand Canal, state grain barges carried tribute grain north to the capital for centuries. In Britain, horse-drawn barges on the towpath worked the canal network built from 1750.",
  "One horse on a towpath could pull far more in a barge than it could on a cart, which is why canals transformed bulk freight before railways.",
  {"Propulsion": "towed (people, horses), sail, later steam tugs", "Cargo": "grain, coal, salt, building stone"}, [W("Barge"), W("Grand Canal (China)")])
v("llama-caravan", "Llama pack train on the Inca roads.",
  "In the Inca Empire the llama was the only beast of burden. A llama carries roughly 25–30 kg, so goods moved in long trains of animals. Tambos along the Qhapaq Ñan supplied the herds.",
  "Llama trains carried state goods between storehouses, and chasqui runners carried messages on the same roads.",
  {"Load": "about 25–30 kg per animal", "Network": "Qhapaq Ñan"}, [W("Llama"), W("Qhapaq Ñan")])
v("trireme", "Greek trireme (oared warship).",
  "The trireme was the main warship of classical Greece. It had 170 oarsmen in three rows, plus deck crew and marines, and was just under 37 m long. Trials of the modern reconstruction Olympias reached about 8 knots. Athens built a fleet of 200 with Laurion silver and won at Salamis in 480 BCE.",
  "Triremes guarded the straits so that Black Sea grain ships could reach Athens. They had little room for food and water, so they usually put ashore at night.",
  {"Crew": "about 200 (170 rowers)", "Length": "just under 37 m", "Speed": "about 8 kn max (Olympias trials)"}, [W("Trireme"), W("Athenian navy"), W("Olympias (trireme)")])
v("roman-merchant", "Roman merchant sailing ship (corbita / navis oneraria).",
  "Roman merchant ships (naves onerariae) usually carried 80–150 tons. Corbitae were round-hulled grain ships with high sides, a design that had changed little since the Greeks. The largest grain ships were far bigger: Lucian describes the Isis as about 55 m long.",
  "Each year grain ships sailed from Alexandria with Egyptian wheat for Rome's free grain dole.",
  {"Capacity": "typically 80–150 t", "Rig": "square mainsail + small foresail (artemon)"}, [W("Ships of ancient Rome"), W("Cura Annonae")])
v("galley", "Mediterranean merchant galley (galea grossa).",
  "Galleys combined oars with lateen sails. The Italian maritime republics built large merchant galleys for valuable cargo, and Venice's state-organised great galleys sailed in mude convoys from 1315 to 1533.",
  "With big crews of oarsmen who could also fight, great galleys were safe from pirates. That made them the choice for spices and silk, which were worth the high cost.",
  {"Propulsion": "oars + lateen sails", "Operator": "Venetian state convoys (mude)", "Cargo": "spices, silk, high-value goods"}, [W("Galley"), W("Muda (convoy)")])
v("cog", "Cog (Hanseatic sailing cargo ship).",
  "The cog was the workhorse of the Hanseatic League: clinker-built sides, a flat bottom, a single square sail and a stern rudder. The Bremen cog, found in the Weser in 1962 and dated to about 1380, could carry an estimated 130 tons.",
  "Cogs carried Baltic grain, furs and timber west and brought back cloth and salt.",
  {"Capacity": "about 130 t (Bremen cog)", "Build": "clinker sides, flat bottom, oak", "Rig": "single square sail"}, [W("Cog (ship)"), W("Bremen cog")])
v("dhow", "Dhow (Indian Ocean sailing ship).",
  "'Dhow' covers many traditional Indian Ocean and Red Sea ships with settee or lateen sails. Older types had planks sewn together with coir rope rather than nailed. They traded on the monsoon between Arabia, East Africa and India.",
  "A dhow left Arabia or Africa on one monsoon and came home on the next, so the round trip took about a year.",
  {"Rig": "settee or lateen", "Build": "traditionally sewn planks (coir)", "Waters": "Red Sea, Gulf, Indian Ocean"}, [W("Dhow")])
v("junk", "Chinese junk.",
  "Junks had a central rudder, an overhanging flat stern, a flat bottom and watertight bulkheads. Battened junk rigs were in use by the 12th century. Big junks carried China's trade across the South China Sea and the Indian Ocean.",
  "Marco Polo and Ibn Battuta both sailed on or described big junks, which had many cabins for merchants.",
  {"Features": "watertight bulkheads, stern rudder, battened sails"}, [W("Junk (ship)")])
v("galleon", "Galleon (Spanish armed cargo ship).",
  "Galleons were developed in the early 16th century from carracks and caravels. Spanish commanders Pedro Menéndez de Avilés and Álvaro de Bazán designed the long, fairly narrow form in the 1550s. They were armed cargo ships and also the main warships until the 17th century.",
  "The Manila galleons were the largest of their kind and crossed the Pacific once or twice a year for 250 years.",
  {"Era": "16th–18th c.", "Role": "armed cargo carrier / warship"}, [W("Galleon"), W("Manila galleon")])
v("east-indiaman", "East Indiaman (armed company merchant ship).",
  "East Indiamen were the large armed merchant ships of the European East India companies. They carried passengers and goods and had guns to fight pirates. Big late British examples were about 175 ft long overall. In the 1830s, as the company monopolies ended, they gave way to faster ships.",
  "In SeaGlobe this model also stands in for other deep-sea sailing merchantmen, such as Atlantic slave ships, which were usually smaller.",
  {"Role": "armed merchant / passenger ship", "Large late British example": "about 175 ft overall"}, [W("East Indiaman"), W("Dutch East India Company")])
v("frigate", "Sailing frigate (Royal Navy fifth rate).",
  "Frigates were fast cruising warships with one main gun deck. Britain rated most of them as fifth rates, and small 28-gun frigates as sixth rates. They scouted, escorted convoys and carried dispatches. HMS Launceston (in service 1741–1784) was a 44-gun fifth rate.",
  "Launceston's 1769 log of Halifax to Plymouth is the one track in SeaGlobe drawn from real daily positions.",
  {"Rating": "fifth rate (most frigates)", "Roles": "scouting, escort, dispatch"}, [W("Frigate"), W("HMS Launceston")])
v("steamship", "Paddle or screw steamer.",
  "Clermont (1807, New York–Albany) is often called the first commercially successful steamboat. Paddle wheels drove steamships until screw propellers spread from the 1850s. Brunel's Great Western (1838) showed that a big steamship could cross the Atlantic with fuel to spare.",
  "Steam made sailing times predictable. Mail, passengers and freight could follow a timetable instead of waiting for the wind.",
  {"Propulsion": "paddle wheels, then screw (from 1850s)", "Fuel": "coal"}, [W("Paddle steamer"), W("SS Great Western")])
v("container-ship", "Container ship.",
  "Container ships carry standard boxes measured in TEU. The converted tanker Ideal X carried 58 containers in 1956, and NYK's Hakone Maru (1968, 752 TEU) was the first built to the TEU standard. The largest ships since 2023 carry over 24,000 TEU, and containers carry about 90% of non-bulk cargo.",
  "One standard box moves from ship to train to truck without being unpacked, which made shipping dramatically cheaper.",
  {"Unit": "TEU", "Largest": "over 24,000 TEU", "Pioneer": "Ideal X (1956)"}, [W("Container ship"), W("Containerization")])
v("camel-caravan", "Camel caravan.",
  "Camel caravans carried trade across the deserts and steppes of Arabia, the Sahara and Central Asia. They moved at walking pace, usually 16–40 km a day. Ibn Battuta reported trans-Saharan caravans of about 1,000 camels, some as large as 12,000.",
  "A caravan's day was set by the distance between wells and caravanserais, so the routes followed the water.",
  {"Speed": "about 16–40 km/day", "Size": "~1,000 camels typical (Sahara, Ibn Battuta)"}, [W("Camel train"), W("Trans-Saharan trade")])
v("steam-train", "Steam train.",
  "Richard Trevithick's locomotive hauled the first recorded steam railway train at Pen-y-darren on 21 February 1804. Stephenson's Rocket won the Rainhill trials in 1829, and the Liverpool and Manchester Railway opened in 1830 as the first inter-city line run entirely by steam.",
  "While the line was being finished, Rocket carried 40 passengers across the Chat Moss bog in 17 minutes, averaging about 17 mph (27 km/h).",
  {"First": "Pen-y-darren, 21 Feb 1804 (Trevithick)", "Rocket": "Rainhill trials, 1829"}, [W("Steam locomotive"), W("Liverpool and Manchester Railway")])
v("jet", "Jet airliner.",
  "The de Havilland Comet first flew in 1949 and entered service with BOAC in 1952 as the first purpose-built jet airliner. After the Comet 1 crashes the type was redesigned, and the Comet 4 opened transatlantic jet service on 4 October 1958. Boeing's 707 (Dash 80 prototype first flown 15 July 1954) followed on 26 October 1958, and 1,010 were built.",
  "Early jets used turbojets. Turbofans soon replaced them because they are quieter and use less fuel.",
  {"First jet airliner": "DH Comet (service 1952)", "707 built": "1,010"}, [W("Jet airliner"), W("De Havilland Comet"), W("Boeing 707")])
v("pipeline-flow", "Pipeline section with a moving flow pulse.",
  "Oil pipelines started in the Pennsylvania oil region in the 1860s. Modern lines run thousands of kilometres. The pulse on the globe only marks the direction of flow; real oil moves slowly and continuously through the pipe.",
  "Pump stations push the oil along over mountains and under rivers to refineries and tanker ports.",
  {"First oil pipelines": "1860s, Pennsylvania", "Shown as": "illustrative flow pulse"}, [W("Pipeline transport")])
v("treasure-ship", "Ming treasure ship (baochuan).",
  "The treasure ships were the largest ships in Zheng He's fleets, 62 of them on the first voyage. Some old Chinese records give them a size of 44 zhang, about 127 m long and 52 m wide. Modern scholars dispute these figures, and many think the real ships were considerably smaller [size disputed].",
  "The ships were built at the Longjiang shipyard in Nanjing and carried envoys, troops and trade goods for the emperor.",
  {"Number (1st voyage)": "62", "Recorded size": "44 zhang (~127 m), disputed", "Built": "Longjiang yard, Nanjing"}, [W("Chinese treasure ship"), W("Ming treasure voyages")])
v("canal-boat", "Mule-towed canal boat.",
  "On the Erie Canal, boats were pulled by mules or horses walking on the towpath. These purpose-built canal boats replaced the older Durham boats once the canal opened in 1825.",
  "Packet boats carried passengers and line boats carried freight, both at walking pace. That was still far faster and cheaper than the roads of the day.",
  {"Towing": "mules/horses", "Canal": "Erie (from 1825)"}, [W("Erie Canal"), W("Durham boat")])
v("ox-wagon", "Ox wagon / covered cart.",
  "An ox wagon is a four-wheeled vehicle pulled by teams of oxen harnessed in pairs. Ox carts were used on land routes all over the world. The Voortrekkers used ox wagons on the Great Trek in South Africa.",
  "Teams of oxen were slow but strong and could live on grazing, which suited long overland trips.",
  {"Draught": "oxen in pairs"}, [W("Ox wagon")])
v("diesel-train", "Diesel-electric train.",
  "Diesel locomotives with electric transmission were in service in the United States by 1925, at about 600 hp. After the Second World War they replaced steam on most of the world's railways.",
  "A diesel engine drives a generator, and the electricity powers the motors on the axles.",
  {"Early service": "by 1925 (US, ~600 hp)"}, [W("Diesel locomotive")])
v("electric-train", "Electric high-speed train.",
  "Japan's Tōkaidō Shinkansen started on 1 October 1964, just before the Tokyo Olympics. It was the first dedicated high-speed railway, with 0 Series trains running at 210 km/h. New high-speed lines today are generally built for at least 250 km/h.",
  "The Shinkansen showed that trains could compete with aircraft between cities a few hundred kilometres apart.",
  {"First": "Tōkaidō Shinkansen, 1 Oct 1964", "Speed then": "210 km/h"}, [W("High-speed rail"), W("Shinkansen")])
v("prop-airliner", "Piston-engined airliner.",
  "Before jets, piston airliners flew the world's routes. The Douglas DC-3 first flew on 17 December 1935, and 607 civil examples were built, plus more than 16,000 including military versions. Lockheed built 856 Constellations between 1943 and 1958 for long-haul and transatlantic service.",
  "Westbound piston airliners crossing the Atlantic often had to refuel at Shannon and Gander, which jets later made unnecessary.",
  {"DC-3": "first flight 17 Dec 1935", "Constellations built": "856 (1943–1958)"}, [W("Douglas DC-3"), W("Lockheed Constellation"), W("BOAC")])
v("satellite", "Satellite (decorative layer).",
  "Sputnik 1 was the first artificial satellite. The Soviet Union launched it on 4 October 1957; it was a 58 cm polished metal sphere weighing 83.6 kg. The satellites on the SeaGlobe globe are decorative and do not show real orbits.",
  "Sputnik's radio beeps could be picked up by amateur radio operators around the world, and its launch started the space race.",
  {"First": "Sputnik 1, 4 Oct 1957", "Shown as": "decorative, not real orbits"}, [W("Sputnik 1"), W("Satellite")])

# ---------------- named vessels and aircraft (keyed by voyage id) ----------------
DUTCH1 = [W("First Dutch Expedition to the East Indies"), BGS]
VESSELS = {}
def vessel(vid, name, facts, history, story, cites):
    VESSELS[vid] = dict(name=name, facts=facts, history=history, story=story, content_citations=cites)

vessel("das-0001.1", "Amsterdam (1595)",
       {"Type": "ship of the Compagnie van Verre", "Built": "[UNKNOWN]", "Tonnage": "[UNKNOWN] (in DAS, not bundled)", "Crew": "[UNKNOWN] (fleet total 248)", "Fate": "burnt in the Indies, early 1597"},
       "Amsterdam was one of the four ships the Compagnie van Verre fitted out for the first Dutch voyage to the East Indies. She left Texel on 2 April 1595.",
       "Her skipper was one of twelve men killed when the ships were boarded at Sidayu, near Surabaya. Off Madura her guns fired on the royal party coming out to meet the Dutch. By the end of the voyage she was in such bad condition that the crew set her adrift and burnt her, and she never came home.",
       DUTCH1)
vessel("das-0002.1", "Duifje (1595)",
       {"Type": "small jacht (scout)", "Tonnage": "[UNKNOWN] (the 25–30 lasten often quoted belongs to the later 1601 Duyfken)", "Fate": "returned Aug 1597; renamed Overijsel"},
       "Duifje ('Little Dove') was the smallest ship of the 1595 fleet, a fast, lightly armed jacht. After the fleet came home in August 1597 she was renamed Overijsel and sailed again on the second and fourth Dutch expeditions.",
       "Don't confuse her with the later Duyfken of 1601, which reached Australia in 1606 under Willem Janszoon. They were different ships with the same name.",
       DUTCH1 + [W("Duyfken")])
vessel("das-0003.1", "Hollandia (1595)",
       {"Type": "ship of the Compagnie van Verre", "Tonnage": "[UNKNOWN] (in DAS, not bundled)", "Fate": "returned to Texel 14 Aug 1597"},
       "Hollandia sailed in the first Dutch expedition and was one of the three ships that came home.",
       "Her skipper, Jan Dignumsz, died during the six months at Madagascar. The fight over who would replace him ended only when Gerrit van Beuningen was put in irons for the rest of the voyage.",
       DUTCH1)
vessel("das-0004.1", "Mauritius (1595)",
       {"Type": "ship of the Compagnie van Verre", "Tonnage": "[UNKNOWN] (in DAS, not bundled)", "Fate": "returned to Texel 14 Aug 1597"},
       "Mauritius was the first-named of the four ships of the 1595 fleet and one of the three that came home in 1597.",
       "The survivors brought home 245 bags of pepper, 41 tonnes of nutmeg and 30 bales of mace. Prices were so high that this small cargo still made the voyage pay.",
       DUTCH1)
vessel("das-4367.3", "Patriot (VOC, 1780)",
       {"Operator": "VOC", "Departed": "Texel, 4 Jan 1780", "Arrived": "Batavia, 22 Jul 1780", "Builder, tonnage, crew, cargo": "[UNKNOWN] (in DAS, not bundled)"},
       "Patriot's 1780 outward voyage is recorded in Dutch-Asiatic Shipping as voyage 4367.3. Beyond its dates, the details are [UNKNOWN] in this build.",
       "She reached Batavia five months before Britain declared war on the Dutch Republic in December 1780.",
       [BGS, W("Fourth Anglo-Dutch War")])
vessel("cliwoc-launceston-1769", "HMS Launceston",
       {"Type": "44-gun fifth rate, Royal Navy", "In service": "1741–1784", "Builder": "[UNKNOWN]", "Tonnage": "[UNKNOWN]", "Crew": "[UNKNOWN]", "Log": "NMM ADM/L/L53"},
       "HMS Launceston was a 44-gun fifth rate in service from 1741 to 1784. In May 1745, under Captain Calmady, she was one of the ships at the capture of the French 64-gun Vigilant off Louisbourg during King George's War.",
       "In September–October 1769 she sailed from Halifax to Plymouth, and her logbook recorded 32 noon positions. Those are the positions SeaGlobe draws.",
       [W("HMS Launceston"), W("Capture of Vigilant"), "García-Herrera et al., PANGAEA (2010), https://doi.org/10.1594/PANGAEA.750354, CC BY 3.0"])
vessel("ideal-x-1956", "Ideal X",
       {"Built": "Marinship Corporation (Sausalito), WWII, as T2 tanker Potrero Hills", "Class size": "T2-SE-A1: 523 ft, 16,613 DWT (class figures)", "Converted": "1955 for containers", "Later": "Elemir (Bulgarian owners, 1959)", "Fate": "scrapped 20 Oct 1964, Hirao, Japan"},
       "Ideal X was built in the Second World War as the T2 tanker Potrero Hills. Malcom McLean's Pan-Atlantic Steamship Company bought her and in 1955 converted her to carry containers on deck.",
       "On 26 April 1956 she carried 58 containers from Newark to Houston. In 1959 she was sold to Bulgarian owners and renamed Elemir, was badly damaged in heavy weather on 8 February 1964, and was scrapped in Japan that October.",
       [W("SS Ideal X"), W("T2 tanker"), LEVINSON])
vessel("great-western-1838", "SS Great Western",
       {"Designer": "Isambard Kingdom Brunel", "Builder": "Patterson & Mercer, Bristol", "Launched": "19 July 1837", "Engines": "Maudslay, Sons and Field side-lever, 750 ihp", "Hull": "oak, iron-strapped; four masts", "Tonnage": "[UNKNOWN] in sources consulted", "Fate": "Crimean War troopship; scrapped 1856"},
       "Great Western was the first steamship built specially for the Atlantic crossing, and in 1838–39 she was the largest passenger ship in the world. She sailed to New York for eight years. She was then sold to the Royal Mail Steam Packet Company, served as a troopship in the Crimean War and was scrapped in 1856.",
       "At her launch a shipwright was killed by a falling timber, and a fire before the maiden voyage injured Brunel. She still made the crossing with fuel to spare.",
       [W("SS Great Western")])
vessel("pan-am-707-1958", "Pan Am Clipper America (N711PA)",
       {"Type": "Boeing 707-121", "Registration": "N711PA", "Operator": "Pan American World Airways", "First revenue flight": "26 Oct 1958", "Passengers": "111"},
       "Clipper America flew Pan Am's first scheduled jet service, New York Idlewild to Paris Le Bourget, on 26 October 1958. Pan Am gave its aircraft 'Clipper' names.",
       "The flight carried 111 passengers and stopped at Gander for fuel. Pan Am itself shut down on 4 December 1991.",
       [W("Pan American World Airways"), W("Boeing 707")])
