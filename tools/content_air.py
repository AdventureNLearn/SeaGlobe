"""v2.3 air layer content: history, story and facts for the air corridors,
the three new aircraft types and the named aircraft on dated flights.
Same rules as content_routes.py: every fact is from the cited articles
(read 14 Nov 2026), gaps are marked [UNKNOWN]. Imported by content_assets.py.
"""
from content_routes import R, W
from content_assets import v, vessel

TRACK = "great-circle reconstruction between OurAirports coordinates"

# ---------------- vehicle types ----------------
v("wright-flyer", "Wright Flyer (1903), the first successful powered aeroplane.",
  "The Wright Flyer was a canard biplane with a wingspan of 40 ft 4 in, built by Wilbur and Orville Wright. Their employee Charlie Taylor built its engine from scratch: 12 horsepower, 180 lb. On 17 December 1903 it made the first sustained flight by a manned, powered and controlled heavier-than-air aircraft, at Kill Devil Hills, about 4 miles south of Kitty Hawk, North Carolina.",
  "Orville flew first, for 12 seconds and 120 ft, shorter than the wingspan of a Boeing 747. After the fourth flight a gust wrecked the Flyer; it never flew again and is now in the National Air and Space Museum.",
  {"Configuration": "canard biplane, two pusher propellers", "Wingspan": "40 ft 4 in", "Engine": "12 hp, 180 lb (Charlie Taylor)", "First flights": "17 Dec 1903 (four)", "Today": "National Air and Space Museum"},
  [W("Wright Flyer"), W("Wright brothers")])
v("dc-3", "Douglas DC-3 twin-engined airliner (C-47 Skytrain / Dakota in military service).",
  "The prototype Douglas Sleeper Transport first flew on 17 December 1935, 32 years to the day after Kitty Hawk. The day-plane version with 21 seats became the DC-3, and American Airlines began DC-3 passenger service on 26 June 1936. Civil production ended in 1943 at 607; with military versions such as the C-47 Skytrain (the RAF's Dakota) more than 16,000 were built.",
  "KLM's DC-3s replaced DC-2s on its Amsterdam–Batavia–Sydney route, then the world's longest scheduled route. C-47s flew in the Berlin Airlift, and DC-3s are still in commercial and military service ninety years after the first flight.",
  {"First flight": "17 Dec 1935 (DST prototype)", "Seats (DC-3)": "21", "Civil built": "607 (to 1943)", "All versions": "over 16,000", "Military names": "C-47 Skytrain, Dakota"},
  [W("Douglas DC-3"), W("Douglas C-47 Skytrain"), W("American Airlines")])
v("boeing-747", "Boeing 747 wide-body jet airliner ('Jumbo Jet').",
  "Pan Am asked Boeing for a jet two and a half times the size of the 707 and ordered 25 747-100s in April 1966. The 747 first flew on 9 February 1969 and entered service with Pan Am on 22 January 1970 on New York–London. The cockpit sits on a short upper deck so a nose cargo door could be fitted, which gives the 747 its hump. Production ended in January 2023 after 54 years and 1,574 aircraft.",
  "The first 747 was rolled out of Boeing's new Everett plant, built for it and the largest building in the world by volume. Qantas flew 747s for almost 49 years, from August 1971 to July 2020.",
  {"First flight": "9 Feb 1969", "Entered service": "22 Jan 1970 (Pan Am)", "Built": "1,574 (to Jan 2023)", "Launch order": "Pan Am, 25 aircraft (April 1966)"},
  [W("Boeing 747"), W("Qantas")])

# ---------------- named aircraft on dated flights ----------------
vessel("wright-flyer-1903", "Wright Flyer (1903)",
       {"Pilots": "Orville and Wilbur Wright", "Flights": "4, on 17 Dec 1903", "Longest": "852 ft (260 m) in 59 s (Wilbur)", "Fate": "wrecked by a gust after flight 4; Smithsonian since 1948"},
       "The Flyer made all four of its flights on 17 December 1903 from level ground near the brothers' camp at Kill Devil Hills, launched from a rail laid into a wind of more than 20 mph.",
       "Orville's first flight lasted 12 seconds. Wilbur's fourth flight of 59 seconds was the longest; minutes later strong gusts blew the machine over and wrecked it.",
       [W("Wright Flyer")])
vessel("us-air-mail-1918", "Curtiss JN-4HM 'Jenny' (US Army Air Service)",
       {"Type": "Curtiss JN-4HM, converted", "Fleet": "six aircraft", "Pilots": "US Army", "Date": "15 May 1918", "Serials": "[UNKNOWN]"},
       "US Air Mail began on 15 May 1918 with six converted Army Curtiss JN-4HM 'Jenny' biplanes flown by Army pilots on the Washington–Philadelphia–New York route.",
       "On the first day Lt George Boyle, just out of flight school, flew the northbound leg from Washington, got lost and made a forced landing near Waldorf, Maryland, 18 minutes after take-off.",
       [W("United States airmail service")])
vessel("mermoz-1930", "Latécoère 28 seaplane (Jean Mermoz)",
       {"Type": "Latécoère 28 on floats", "Engine": "Hispano-Suiza, 650 hp", "Distance": "3,058 km", "Time": "19 h 35 min", "Mail": "122 kg", "Aircraft name": "[UNKNOWN]"},
       "On 12–13 May 1930 the Aéropostale pilot Jean Mermoz made the first nonstop air crossing of the South Atlantic with mail, from Dakar to Natal.",
       "Before this, mail reaching Dakar by air went on to South America by steamer; Aéropostale had flown Rio de Janeiro–Natal since November 1927.",
       [W("Aéropostale (aviation)")])
vessel("china-clipper-1935", "China Clipper (Martin M-130, NC14716)",
       {"Type": "Martin M-130 four-engined flying boat", "Registration": "NC14716", "Delivered": "9 Oct 1935", "Sisters": "Philippine Clipper, Hawaii Clipper", "Fate": "all three M-130s lost in service"},
       "China Clipper was the first of three Martin M-130 flying boats built for Pan American Airways. It inaugurated the first commercial transpacific air mail service, San Francisco to Manila, on 22 November 1935.",
       "It reached Manila on 29 November after stops at Honolulu, Midway, Wake and Guam, and delivered over 110,000 pieces of mail. Pan Am had to build hotels, docks and radio stations on the almost empty islands of Wake and Midway.",
       [W("China Clipper"), W("Martin M-130")])
vessel("yankee-clipper-1939", "Yankee Clipper (Boeing 314)",
       {"Type": "Boeing 314 Clipper flying boat", "Built (all 314s)": "12, nine served with Pan Am", "Pilot": "Harold Gray", "Route": "via Shediac, Botwood, Foynes to Southampton", "Fate": "lost in an accident (the only fatal 314 loss)"},
       "Pan Am took delivery of six Boeing 314s in early 1939. Yankee Clipper, piloted by Harold Gray, opened the northern transatlantic air mail route to Britain on 24 June 1939, and carried the first passengers on that route on 8 July 1939.",
       "Of the twelve 314s built, three were lost in accidents and only one of those cost lives: the loss of Yankee Clipper itself.",
       [W("Pan American World Airways"), W("Boeing 314 Clipper")])
vessel("american-dc3-1936", "Douglas DC-3 (American Airlines)",
       {"Operator": "American Airlines", "Date": "26 June 1936", "Flights": "simultaneous, from Newark and from Chicago", "Registration": "[UNKNOWN]"},
       "American Airlines inaugurated DC-3 passenger service on 26 June 1936. The first DC-3 built followed seven Douglas Sleeper Transports off the line and went straight to American.",
       "The DC-3 came out of a marathon telephone call in which American's chief executive C. R. Smith persuaded a reluctant Donald Douglas to design a sleeper aircraft based on the DC-2.",
       [W("Douglas DC-3"), W("American Airlines")])
vessel("comet-g-alyp-1952", "Comet 1 G-ALYP 'Yoke Peter' (BOAC)",
       {"Type": "de Havilland Comet 1", "Registration": "G-ALYP", "First flight": "9 Jan 1951", "First passenger jet service": "2 May 1952", "Fate": "broke up off Elba, 10 Jan 1954 (BOAC Flight 781)"},
       "G-ALYP was the first production Comet. On 2 May 1952 it flew the world's first jetliner flight with fare-paying passengers, opening BOAC's London–Johannesburg service.",
       "On 10 January 1954, 20 minutes after leaving Rome Ciampino, G-ALYP broke up in mid-air off Elba with 35 on board. Recovered wreckage showed fatigue cracks from a window corner, and later airliners were designed to be fail-safe.",
       [W("De Havilland Comet"), W("BOAC")])
vessel("sas-polar-1954", "Douglas DC-6B (SAS)",
       {"Operator": "Scandinavian Airlines (SAS)", "Type": "Douglas DC-6B", "Date": "15 Nov 1954", "Stops": "Søndre Strømfjord, Winnipeg", "Registration": "[UNKNOWN]"},
       "SAS became the first airline to fly a scheduled polar route, from Copenhagen to Los Angeles with DC-6Bs, starting on 15 November 1954.",
       "A tariff that allowed free transit via Copenhagen to other European cities made the route popular with American tourists through the 1950s.",
       [W("Polar route"), W("Scandinavian Airlines")])
vessel("pan-am-747-1970", "Clipper Victor (Boeing 747-100, Pan Am)",
       {"Type": "Boeing 747-100", "Operator": "Pan American World Airways", "Date": "22 Jan 1970", "Route": "New York JFK – London Heathrow", "Fate": "destroyed in the Tenerife collision, 1977"},
       "Pan Am's inaugural 747 service was due on the evening of 21 January 1970 with Clipper Young America, but an engine failure delayed it for hours and Clipper Victor was substituted.",
       "Clipper Victor was lost seven years later at Tenerife (1977), when it collided on the runway with a KLM 747-200.",
       [W("Pan American World Airways"), W("Boeing 747")])
vessel("concorde-ba-1976", "Concorde (British Airways)",
       {"Operator": "British Airways", "Date": "21 Jan 1976", "From": "London Heathrow", "Registration": "[UNKNOWN] here", "Concordes built": "20 (14 production)"},
       "Concorde began scheduled service with British Airways and Air France on the same day, 21 January 1976. Twenty were built, of which 14 were production aircraft for airlines.",
       "Its only competitor, the Tupolev Tu-144, carried passengers only from November 1977 until a crash in May 1978.",
       [W("Concorde")])
vessel("concorde-af-1976", "Concorde (Air France)",
       {"Operator": "Air France", "Date": "21 Jan 1976", "From": "Paris-Roissy", "Registration": "[UNKNOWN] here", "Last commercial flight": "30 May 2003"},
       "Air France's first Concorde service left Paris-Roissy on 21 January 1976, the same day as British Airways'. Air France's routes included Paris–Dakar–Rio de Janeiro and Paris–New York.",
       "Air France flew its last commercial Concorde flight on 30 May 2003, five months before British Airways retired its fleet.",
       [W("Concorde")])

# ---------------- corridors ----------------
def r(id, history, story, facts, cites):
    R[id] = dict(history=history, story=story, facts=facts, content_citations=cites)

r("wright-kitty-hawk-1903",
  "On 17 December 1903 Orville and Wilbur Wright made four flights in the Wright Flyer at Kill Devil Hills, about 4 miles south of Kitty Hawk, North Carolina: the first sustained flights of a manned, powered and controlled heavier-than-air aircraft.",
  "The Smithsonian at first refused to credit the Wrights, and Orville threatened to send the Flyer to London. It went on display at the Smithsonian on 17 December 1948, 45 years to the day after its flights.",
  {"Date": "17 December 1903", "Flights": "4", "Longest": "852 ft (260 m), 59 s", "Place": "Kill Devil Hills, NC", "Track on the globe": "260 m sketch; direction [UNKNOWN]"},
  [W("Wright Flyer"), W("Wright brothers")])
r("us-air-mail-1918",
  "The Post Office Department made Air Mail a new class of service on 15 May 1918, with the Washington–Philadelphia–New York route and the first special Air Mail stamps. Army pilots flew it at first; the route was the first step towards a transcontinental air mail.",
  "Lt James Edgerton, just out of flight school, flew the Philadelphia–Washington leg on the first day; the northbound flight from Washington got lost and came down near Waldorf, Maryland.",
  {"First day": "15 May 1918", "Aircraft": "Curtiss JN-4HM 'Jenny' (6)", "Pilots": "US Army", "Track on the globe": TRACK},
  [W("United States airmail service")])
r("us-transcontinental-air-mail",
  "Scheduled transcontinental air mail between New York and San Francisco began on 8 September 1920. At first mail flew by day and went by train at night; full day-and-night service began on 1 July 1924, so a coast-to-coast trip that had taken over 70 hours was scheduled at 34 h 46 min westbound. Congress funded a lighted airway along the route in 1923; the 2,665-mile New York–San Francisco airway was completed to a June 1925 deadline.",
  "On 22 February 1921 Jack Knight flew the Omaha–Chicago leg at night for the first time. By 1 September 1927 all US air mail, including the transcontinental route, was flown under contract by commercial carriers.",
  {"Opened": "8 September 1920", "Day and night": "from 1 July 1924", "Lighted airway": "2,665 mi (June 1925 deadline)", "Contract flying": "all routes by 1 September 1927", "Track on the globe": TRACK},
  [W("United States airmail service"), W("Transcontinental Airway System")])
r("aeropostale-toulouse-dakar",
  "Aéropostale was founded in Toulouse on 25 December 1918 as the Lignes Aériennes Latécoère ('La Ligne') and operated until 1933. Jean Mermoz opened Toulouse–Barcelona over the Pyrenees in 1924, and in 1926 a leg was added from Casablanca across the Sahara to Dakar, where mail went on by steamer to South America.",
  "The first nonstop Toulouse–Saint-Louis (Senegal) flight began in 1927. Antoine de Saint-Exupéry managed and flew for its Aeroposta Argentina subsidiary; his novel about those years became the 1933 film Night Flight.",
  {"Founded": "25 December 1918, Toulouse", "Casablanca–Dakar": "1926", "Company ended": "1933", "Track on the globe": TRACK},
  [W("Aéropostale (aviation)")])
r("aeropostale-south-atlantic-1930",
  "On 12–13 May 1930 Aéropostale finally flew the South Atlantic: Jean Mermoz took a float-equipped Latécoère 28 nonstop from Dakar to Natal, 3,058 km in 19 h 35 min, with 122 kg of mail.",
  "Until then mail from France flew to Dakar and crossed the ocean by steamer; Aéropostale had flown Rio de Janeiro–Natal since November 1927, so the flight joined the two halves of La Ligne.",
  {"Date": "12–13 May 1930", "Pilot": "Jean Mermoz", "Aircraft": "Latécoère 28 seaplane", "Distance": "3,058 km", "Track on the globe": TRACK},
  [W("Aéropostale (aviation)")])
r("imperial-airways-london-karachi",
  "After two years of negotiation with Persia over overflight rights, Imperial Airways began a London–Karachi service on 30 March 1929. It took seven days and mixed aircraft and trains: London to Basel by air, train to Genoa, Short Calcutta flying boat to Alexandria, train to Cairo, then a DH.66 to Karachi.",
  "From 1 October 1932 the eastern route moved from the Persian to the Arabian side of the Gulf, and Handley Page HP 42s took over the Cairo–Karachi sector.",
  {"Opened": "30 March 1929", "Journey": "seven days, air and rail", "Rerouted": "1 October 1932 (Arabian side of the Gulf)", "Track on the globe": TRACK},
  [W("Imperial Airways")])
r("imperial-airways-cape-town",
  "Alan Cobham surveyed a UK–Cape Town route for Imperial Airways in 1925–26. A weekly London–Mwanza service began on 28 February 1931, Christmas mail went through to Cape Town in December 1931, and a mail route between London and Cape Town opened on 20 January 1932.",
  "The DH.66 City of Karachi flew the last sector of the December 1931 Christmas mail and arrived in Cape Town on 21 December 1931.",
  {"Survey": "Alan Cobham, Nov 1925 – Mar 1926", "Mail route opened": "20 January 1932", "Stops on the globe": "from the Cobham survey route", "Track on the globe": TRACK},
  [W("Imperial Airways")])
r("imperial-qantas-london-brisbane",
  "The first London–Brisbane service left on 8 December 1934 carrying mail, with Qantas flying the Singapore–Brisbane sector; passenger flights began the following April. Qantas later coined the name Kangaroo Route for the Australia–UK service and flew the whole route itself from 1947.",
  "An experimental London–Australia mail flight in April 1931 took 26 days after the DH.66 City of Cairo ran out of fuel and crash-landed in Timor. The 1933 survey flight by the Atalanta Astraea mapped the stops later used.",
  {"Mail from": "8 December 1934", "Passengers from": "April 1935", "Partner": "Qantas (Singapore–Brisbane)", "Track on the globe": TRACK},
  [W("Imperial Airways"), W("Kangaroo Route")])
r("klm-amsterdam-batavia",
  "KLM's first experimental intercontinental flight, a Fokker F.VII, left for Batavia on 1 October 1924. Regular scheduled Amsterdam–Batavia services began in September 1929. The DC-2 came onto the route in 1934, and DC-3s, delivered by ship in September 1936, replaced them on the service via Batavia to Sydney.",
  "On 10 May 1940, the day of the German invasion of the Netherlands, several KLM aircraft were away on the Far East route; five DC-3s and one DC-2 ended up in Britain.",
  {"First flight": "1 October 1924 (Fokker F.VII H-NACC)", "Regular service": "from September 1929", "DC-2": "1934", "DC-3": "from 1936", "Stops on the globe": "our sketch [UNKNOWN]"},
  [W("KLM"), W("Douglas DC-3")])
r("pan-am-china-clipper-1935",
  "On 22 November 1935 Pan Am's Martin M-130 China Clipper left Alameda with the first commercial transpacific air mail. It reached Manila on 29 November via Honolulu, Midway, Wake and Guam, about 8,000 miles in a week.",
  "The flying boats' short range meant Pan Am had to put hotels, docks, repair shops and radio stations on Wake and Midway. Later the reporters Dorothy Kilgallen and Leo Kiernan, racing each other around the world, rode the route on the first regular west-to-east flight.",
  {"Departed": "22 November 1935, Alameda", "Arrived": "29 November 1935, Manila", "Stops": "Honolulu, Midway, Wake, Guam", "Mail": "over 110,000 pieces", "Track on the globe": TRACK},
  [W("China Clipper"), W("Martin M-130")])
r("pan-am-yankee-clipper-1939",
  "Pan Am's Boeing 314s opened scheduled transatlantic flying in 1939: the southern route to France for air mail on 20 May (Yankee Clipper), passengers on 28 June (Dixie Clipper); the northern route to Britain for air mail on 24 June via Shediac, Botwood and Foynes, with passengers from 8 July.",
  "After the war began in September 1939, Pan Am kept flying the Atlantic to neutral Lisbon and to Ireland, with military passengers and cargo given priority.",
  {"Southern route mail": "20 May 1939", "Northern route mail": "24 June 1939", "Northern passengers": "8 July 1939", "Aircraft": "Boeing 314", "Track on the globe": TRACK},
  [W("Pan American World Airways"), W("Boeing 314 Clipper")])
r("american-airlines-dc3-1936",
  "American Airlines helped develop the DC-3 and inaugurated DC-3 passenger service on 26 June 1936 with simultaneous flights from Newark and Chicago. The 21-seat day version followed the 14–16 berth Douglas Sleeper Transport.",
  "There was no DC-3 prototype: the first one built came off the line after seven DSTs and was delivered straight to American Airlines.",
  {"Date": "26 June 1936", "Operator": "American Airlines", "Seats": "21", "Track on the globe": TRACK},
  [W("Douglas DC-3"), W("American Airlines")])
r("berlin-airlift-frankfurt-tempelhof",
  "When the Soviet Union blockaded West Berlin's rail, road and water links in June 1948, the Western Allies supplied the city by air from 26 June 1948 to 30 September 1949, through three 20-mile-wide corridors. Allied aircraft made 278,228 flights to Berlin with 2,334,374 tons, nearly two-thirds of it coal.",
  "Early on, 32 C-47s lifted off for Berlin in a day with 80 tons of milk, flour and medicine. American C-47s and C-54s together flew more than 92 million miles. 101 people died, mostly in flying accidents.",
  {"Airlift": "26 June 1948 – 30 September 1949", "US share": "1,783,573 tons (76.4%)", "Aircraft": "C-47 and C-54", "Track on the globe": "straight sketch of the corridor"},
  [W("Berlin Blockade")])
r("berlin-airlift-hamburg-gatow",
  "The British ran their part of the airlift from airfields in the Hamburg area through their corridor into RAF Gatow in the British sector, returning by the centre corridor; unlike the Americans they also ran some round trips. The RAF delivered 541,937 tons.",
  "Between August 1948 and August 1949 the 'Berlin Airlift Corridor Incidents Report' recorded 733 incidents between Soviet and Allied aircraft.",
  {"Airlift": "26 June 1948 – 30 September 1949", "RAF share": "541,937 tons (23.3%)", "Destination": "RAF Gatow", "Track on the globe": "straight sketch of the corridor"},
  [W("Berlin Blockade")])
r("boac-comet-1952",
  "On 2 May 1952 BOAC's de Havilland Comet G-ALYP flew the world's first jetliner flight with fare-paying passengers, opening London–Johannesburg. The five-stop flight was scheduled at 21 h 20 min. By summer 1953 eight BOAC Comets left London each week, three of them for Johannesburg.",
  "All Comet 1s were grounded in April 1954 after a series of crashes caused by metal fatigue. The redesigned Comet 4 opened the first transatlantic jet service in October 1958.",
  {"Date": "2 May 1952", "Aircraft": "Comet 1 G-ALYP", "Stops": "five ([UNKNOWN] which)", "Schedule": "21 h 20 min", "Track on the globe": TRACK},
  [W("De Havilland Comet"), W("BOAC")])
r("sas-polar-copenhagen-los-angeles-1954",
  "After pioneering flights in the 1930s and 1940s, SAS made the first commercial polar route crossing: Douglas DC-6B flights between Copenhagen and Los Angeles via Kangerlussuaq (Søndre Strømfjord) and Winnipeg, starting 15 November 1954.",
  "Canadian Pacific followed with Vancouver–Amsterdam in 1955, and Pan Am and TWA with West Coast–Paris/London in 1957.",
  {"First flight": "15 November 1954", "Aircraft": "Douglas DC-6B", "Stops": "Kangerlussuaq, Winnipeg", "Track on the globe": TRACK},
  [W("Polar route"), W("Scandinavian Airlines")])
r("sas-polar-copenhagen-tokyo-1957",
  "In February 1957 SAS was first again, flying Europe to Tokyo over the pole via Anchorage with Douglas DC-7Cs; Air France and KLM followed in 1958. Anchorage stayed a Europe–Japan stop for decades: in 1983 seven airlines flew Japan–western Europe via Anchorage.",
  "SAS sold the route as part of a round-the-world service over the North Pole. Most of the 1983 Anchorage flights were early Boeing 747s.",
  {"First flights": "February 1957 (day [UNKNOWN])", "Aircraft": "Douglas DC-7C", "Stop": "Anchorage", "Track on the globe": TRACK},
  [W("Polar route"), W("Scandinavian Airlines")])
r("pan-am-747-1970",
  "The Boeing 747 entered service on 22 January 1970 on Pan Am's New York–London route. Pan Am had asked for a jet two and a half times the size of the 707 to cut seat costs by 30%, and ordered 25 747-100s in April 1966.",
  "First Lady Pat Nixon christened Clipper Young America on 15 January 1970, but on inauguration night its engine failed and Clipper Victor flew the first service after a delay of several hours.",
  {"Date": "22 January 1970", "Aircraft": "Clipper Victor (747-100)", "Route": "New York JFK – London Heathrow", "Track on the globe": TRACK},
  [W("Boeing 747"), W("Pan American World Airways")])
r("qantas-747-kangaroo-route",
  "Qantas added Boeing 747s to the Kangaroo Route in 1971, with fewer stops and a shorter journey; by the late 1970s the usual stops were Singapore and Bahrain. A one-stop Sydney–London service with 747-300s followed in October 1988.",
  "In 1989 the 747-400 City of Canberra flew nonstop London–Sydney in just over 20 hours, without passengers or cargo. Qantas retired its last 747 in July 2020 after almost 49 years.",
  {"747 from": "August 1971", "Last 747": "July 2020", "Stops drawn": "Singapore, Bahrain (late 1970s)", "Track on the globe": TRACK},
  [W("Kangaroo Route"), W("Qantas")])
r("concorde-london-bahrain-1976",
  "Concorde entered scheduled service on 21 January 1976 with British Airways from London Heathrow and Air France from Paris-Roissy. London–Bahrain was among British Airways' Concorde routes, with London–New York, London–Miami and London–Barbados.",
  "Twenty Concordes were built, two prototypes, two pre-production, two development and 14 production aircraft; eighteen are preserved.",
  {"Date": "21 January 1976", "Operator": "British Airways", "Track on the globe": TRACK},
  [W("Concorde")])
r("concorde-paris-rio-1976",
  "Air France's Concorde service began on 21 January 1976, the same day as British Airways'. Its routes included Paris–Dakar–Rio de Janeiro, Paris–Azores–Caracas, Paris–New York and Paris–Washington.",
  "Concorde's only supersonic rival, the Tupolev Tu-144, carried passengers only from November 1977 to May 1978.",
  {"Date": "21 January 1976", "Operator": "Air France", "Stop": "Dakar", "Track on the globe": TRACK},
  [W("Concorde")])
r("concorde-london-new-york",
  "Transatlantic flights were Concorde's main market: Washington Dulles from 24 May (year [UNKNOWN] in the source text read) and New York JFK from 17 October 1977. Subsonic jets took about eight hours from Paris to New York; Concorde took just under 3.5 hours on average. British Airways retired its fleet on 24 October 2003.",
  "After the Air France crash of 25 July 2000, normal service resumed on 7 November 2001 with flights to JFK, where Mayor Rudy Giuliani greeted the passengers.",
  {"JFK from": "17 October 1977", "Average crossing": "just under 3.5 h", "BA retirement": "24 October 2003", "Track on the globe": TRACK},
  [W("Concorde")])
r("concorde-paris-new-york",
  "Paris–New York was one of Air France's Concorde routes. Air France and British Airways announced Concorde's retirement in 2003, citing rising maintenance costs, low passenger numbers after the 2000 crash and the slump after the September 11 attacks.",
  "Air France flew its last commercial Concorde flight on 30 May 2003.",
  {"JFK service from": "17 October 1977 (airline not named in source)", "AF last flight": "30 May 2003", "Track on the globe": TRACK},
  [W("Concorde")])
r("singapore-sq21-newark-2004",
  "In June 2004 Singapore Airlines introduced SQ21 with the Airbus A340-500 on a record-breaking 15,344 km great-circle route from Newark to Singapore, passing within 130 km of the North Pole. It ran from 28 June 2004 to 23 November 2013, and again with A350-900ULRs from 11 October 2018 to 25 March 2020.",
  "SQ21 was scheduled to leave Newark at 23:00 local time and land in Singapore at 04:05 local time, a flight of a little over 18 hours.",
  {"First period": "28 June 2004 – 23 November 2013 (A340-500)", "Second period": "11 Oct 2018 – 25 Mar 2020 (not drawn)", "Great circle": "15,344 km", "Track on the globe": TRACK},
  [W("Singapore Airlines Flights 21 and 22")])
r("singapore-sq23-new-york-2020",
  "Singapore Airlines flights 23 and 24, Singapore–New York JFK, launched on 9 November 2020 and are the longest regularly scheduled nonstop flights in the world, a 15,349 km great circle scheduled at over 18 hours.",
  "SQ24 to New York usually flies about 17,250 km over the Pacific to use the jet stream, while SQ23 back to Singapore sometimes goes east across the Atlantic instead of the polar route.",
  {"Launched": "9 November 2020", "Great circle": "15,349 km", "Aircraft": "Airbus A350-900", "Track on the globe": TRACK},
  [W("Singapore Airlines Flights 23 and 24")])
r("qantas-perth-london-2018",
  "Qantas began nonstop Perth–London flights with Boeing 787s on 25 March 2018, making the Kangaroo Route nonstop for the first time and linking Australia and Europe nonstop for the first time. Qantas' Project Sunrise plans to connect Sydney and London in a single hop.",
  "Qantas had flown a one-stop Perth–London service via Bombay from 29 March 1974, first with 707s and from June 1974 with 747-200s.",
  {"Nonstop from": "25 March 2018", "Aircraft": "Boeing 787", "Track on the globe": TRACK},
  [W("Kangaroo Route")])
