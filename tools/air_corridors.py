"""Air layer (v2.3): historic air corridors, 1903 to today.

Hand-picked corridors, each with a public citation. Endpoints and stops are
airport coordinates from the OurAirports slice (public domain,
data/sources/ourairports/airports-slice.csv). Where the historic field is gone
or not in OurAirports, a modern airport in the same city stands in for it and
the record's notes say so. Lines between stops are great circles drawn by the
app, not recorded flight tracks. No OpenFlights, ADS-B or other flight-tracking
data is used. Every record is a reconstruction (reconstruction=True).
Dates: only dates stated in the cited sources are used; anything else is
marked [UNKNOWN] in the notes.
"""
from __future__ import annotations

import csv
from pathlib import Path

from content_routes import W

ROOT = Path(__file__).resolve().parents[1]
SLICE = ROOT / "data" / "sources" / "ourairports" / "airports-slice.csv"
OA = "OurAirports, airports.csv (public domain), airport coordinates; slice in data/sources/ourairports/airports-slice.csv, downloaded 14 Nov 2026"
G = "general history; not from a cargo or passenger manifest"

# Fields the corridors use that are not large_airport rows (kept in the slice by tools/slice_ourairports.py).
FIELDS = ["KFFA", "KUNV", "K0G6", "KIOW", "KLBF", "KCYS", "KRWL", "KRKS", "KEKO", "GOSS", "SBNT", "GB-1268",
          "HKKI", "YLRE", "ID-0231", "US-12488", "PMDY", "PWAK", "CSB5", "CCP2", "EGHI", "DE-0456", "DE-0904",
          "BGSF"]

_HUBS = None


def A(ident):
    """[lat, lng] of an airport in the OurAirports slice, rounded to 3 decimals."""
    global _HUBS
    if _HUBS is None:
        _HUBS = {r["ident"]: r for r in csv.DictReader(open(SLICE, encoding="utf-8"))}
    r = _HUBS[ident]
    return [round(float(r["latitude_deg"]), 3), round(float(r["longitude_deg"]), 3)]


def rec(**k):
    k.setdefault("type", "air")
    k.setdefault("line", "air")
    k.setdefault("years_approximate", False)
    k.setdefault("confidence", "historical reconstruction")
    k.setdefault("sample", True)
    k.setdefault("partial", True)
    k.setdefault("demo_seed", False)
    k.setdefault("citation_check", False)
    k.setdefault("goods_source", G)
    k.setdefault("source", "published history + OurAirports coordinates")
    k.setdefault("derived_from", "hand-written reconstruction from published history; stops from OurAirports (public domain)")
    k["era"] = "industrial" if int(str(k["start_date"])[:4]) < 1950 else "modern"
    k["citations"] = k["citations"] + [OA]
    k["citation"] = k["citations"][0]
    k["reconstruction"] = True
    return k


def tr(label, active=2, speed=20000, both=True, min_days=24):
    return {"kind": "traffic", "label": label, "speed_km_day": speed, "active": active, "both_directions": both, "min_display_days": min_days}


def dated(vid, ship, record, start, end=None, min_days=30):
    return {"kind": "dated", "voyages": [{"id": vid, "ship": ship, "record": record, "url": None, "start": start, "end": end or start,
                                          "anchors": [], "lateral_km": 0, "min_display_days": min_days}]}


STAND_IN = "The 3D model is a generic stand-in for this aircraft type."


def air_corridor_records():
    P = "air-pioneers"
    I = "air-interwar"
    J = "air-jet-age"
    return [
        # ---------------- pioneers, 1903-1933 ----------------
        rec(id="wright-kitty-hawk-1903", family=P, color="#ffe08a",
            name="Wright Flyer, Kill Devil Hills (Kitty Hawk), 17 Dec 1903", start_date="1903-12-17", end_date="1903-12-17",
            vehicle="wright-flyer", goods=["pilot only (test flights)"], confidence_level="medium",
            citations=[W("Wright Flyer"), W("Wright brothers")],
            path=[[36.0182, -75.6713], [36.0205, -75.6713]],
            notes="Four flights on 17 December 1903; the longest, by Wilbur, covered 852 ft (260 m) in 59 seconds. Drawn as a 260 m line starting at First Flight Airport (OurAirports KFFA), which adjoins the site; the direction of the line is our sketch [UNKNOWN]. Shown at a slowed display pace so it can be seen.",
            schedule=dated("wright-flyer-1903", "Wright Flyer (1903)", "First sustained powered, controlled flights (Wright Flyer article)", "1903-12-17")),
        rec(id="us-air-mail-1918", family=P, color="#ffe08a",
            name="First US Air Mail route, Washington–Philadelphia–New York, 1918", start_date="1918-05-15", end_date="1918-05-15",
            vehicle="prop-airliner", goods=["air mail"], confidence_level="medium",
            citations=[W("United States airmail service")],
            path=[A("KDCA"), A("KPHL"), A("KLGA")],
            notes="Scheduled US Air Mail began on 15 May 1918 on this route, flown by Army pilots in converted Curtiss JN-4HM 'Jenny' biplanes. The 1918 landing fields are not drawn: modern Washington, Philadelphia and New York airports stand in for them. " + STAND_IN,
            schedule=dated("us-air-mail-1918", "Curtiss JN-4HM 'Jenny' (Army Air Service)", "First day of scheduled US Air Mail", "1918-05-15")),
        rec(id="us-transcontinental-air-mail", family=P, color="#ffe08a",
            name="Transcontinental Air Mail, New York to San Francisco, 1920–1927", start_date="1920-09-08", end_date="1927-09-01",
            vehicle="prop-airliner", goods=["air mail"], confidence_level="medium",
            citations=[W("United States airmail service"), W("Transcontinental Airway System")],
            path=[A("KLGA"), A("KUNV"), A("KCLE"), A("K0G6"), A("KMDW"), A("KIOW"), A("KOMA"), A("KLBF"), A("KCYS"), A("KRWL"), A("KRKS"), A("KSLC"), A("KEKO"), A("KRNO"), A("KSFO")],
            notes="Government-operated transcontinental air mail from 8 September 1920; day-and-night service over the whole route from 1 July 1924; by 1 September 1927 all US air mail routes were flown under contract by commercial carriers, where this record ends. Stops follow the fields the source lists (Bellefonte, Cleveland, Bryan, Chicago, Iowa City, Omaha, North Platte, Cheyenne, Rawlins, Rock Springs, Salt Lake City, Elko, Reno), drawn at modern airports in those towns. Aircraft types on the route are [UNKNOWN] here. " + STAND_IN,
            schedule=tr("Air mail plane", 3)),
        rec(id="aeropostale-toulouse-dakar", family=P, color="#ffe08a",
            name="Aéropostale (La Ligne), Toulouse to Dakar, 1926–1933", start_date="1926", end_date="1933",
            vehicle="prop-airliner", goods=["air mail"], confidence_level="low", years_approximate=True,
            citations=[W("Aéropostale (aviation)")],
            path=[A("LFBO"), A("LEBL"), A("GMMN"), A("GOSS"), A("GOOY")],
            notes="Founded in Toulouse on 25 December 1918 as the Lignes Aériennes Latécoère; the Casablanca–Dakar leg across the Sahara was added in 1926 and the company operated until 1933. Stops drawn: Toulouse, Barcelona, Casablanca, Saint-Louis and Dakar, at modern airports. Other stops [UNKNOWN] here. " + STAND_IN,
            schedule=tr("Aéropostale mail plane", 2)),
        rec(id="aeropostale-south-atlantic-1930", family=P, color="#ffe08a",
            name="Mermoz's South Atlantic mail flight, Dakar to Natal, May 1930", start_date="1930-05-12", end_date="1930-05-13",
            vehicle="prop-airliner", goods=["air mail (122 kg)"], goods_source="Aéropostale article", confidence_level="medium",
            citations=[W("Aéropostale (aviation)")],
            path=[A("GOOY"), A("SBNT")],
            notes="On 12–13 May 1930 Jean Mermoz flew a Latécoère 28 seaplane 3,058 km from Dakar to Natal in 19 h 35 min with 122 kg of mail. Modern Dakar and Natal airfields stand in for the seaplane bases. " + STAND_IN,
            schedule=dated("mermoz-1930", "Latécoère 28 seaplane (Jean Mermoz)", "First nonstop South Atlantic air mail crossing", "1930-05-12", "1930-05-13")),
        # ---------------- airlines between the wars, 1929-1949 ----------------
        rec(id="imperial-airways-london-karachi", family=I, color="#ffb3c7",
            name="Imperial Airways, London to Karachi, 1929–1932", start_date="1929-03-30", end_date="1932-10-01",
            vehicle="prop-airliner", goods=["passengers", "air mail"], confidence_level="medium",
            citations=[W("Imperial Airways")],
            path=[A("GB-1268"), A("LFSB"), A("LIMJ"), A("HEBA"), A("HECA"), A("OPKC")],
            notes="From 30 March 1929 the seven-day London–Karachi service flew London to Basel, went by train to Genoa, by Short Calcutta flying boat to Alexandria, by train to Cairo and by DH.66 to Karachi. From 1 October 1932 the route moved to the Arabian side of the Gulf, where this record ends. Drawn through Croydon (OurAirports, closed) and modern airports; the train legs are drawn as straight air lines, and the Cairo–Karachi stops are [UNKNOWN] here. " + STAND_IN,
            schedule=tr("Imperial Airways airliner", 2)),
        rec(id="imperial-airways-cape-town", family=I, color="#ffb3c7",
            name="Imperial Airways Africa route, London to Cape Town, 1932–1939", start_date="1932-01-20", end_date="1939",
            vehicle="prop-airliner", goods=["air mail", "passengers"], confidence_level="low",
            citations=[W("Imperial Airways")],
            path=[A("GB-1268"), A("HECA"), A("HSSK"), A("HKKI"), A("FAOR"), A("FACT")],
            notes="A mail route between London and Cape Town opened on 20 January 1932; Imperial Airways operated until 1939, where this record ends. Stops drawn (Cairo, Khartoum, Kisumu, Johannesburg) are places on Alan Cobham's 1925–26 survey route; the 1932 service's own stops are [UNKNOWN] here. " + STAND_IN,
            schedule=tr("Imperial Airways airliner", 2)),
        rec(id="imperial-qantas-london-brisbane", family=I, color="#ffb3c7",
            name="Imperial Airways and Qantas, London to Brisbane, 1935–1939", start_date="1935-04", end_date="1939",
            vehicle="prop-airliner", goods=["passengers", "air mail"], confidence_level="low", years_approximate=True,
            citations=[W("Imperial Airways"), W("Kangaroo Route")],
            path=[A("GB-1268"), A("LIRA"), A("LGAV"), A("HECA"), A("OPKC"), A("VIDP"), A("VECC"), A("VYYY"), A("VTBD"), A("WSSS"), A("ID-0231"), A("YPDN"), A("YLRE"), A("YBBN")],
            notes="The first London–Brisbane service left on 8 December 1934 for mail; passenger flights began the following April, with Qantas flying Singapore–Brisbane. Imperial Airways operated until 1939, where this record ends. Stops drawn are a subset of the 1933 Astraea survey route (Croydon … Rome, Athens, Cairo, Karachi, Delhi, Calcutta, Rangoon, Bangkok, Singapore, Batavia, Darwin, Longreach … Brisbane), at modern or closed airports from OurAirports. " + STAND_IN,
            schedule=tr("Imperial / Qantas airliner", 2)),
        rec(id="klm-amsterdam-batavia", family=I, color="#ffb3c7",
            name="KLM, Amsterdam to Batavia, 1929–1940", start_date="1929-09", end_date="1940-05-10",
            vehicle="prop-airliner", goods=["passengers", "air mail"], confidence_level="low",
            citations=[W("KLM"), W("Douglas DC-3")],
            path=[A("EHAM"), A("LIRF"), A("HECA"), A("OPKC"), A("VECC"), A("VTBD"), A("WSSS"), A("ID-0231")],
            notes="Regular scheduled Amsterdam–Batavia services began in September 1929; the DC-2 came onto the route in 1934 and DC-3s from 1936. The record ends with the German invasion of the Netherlands on 10 May 1940. Intermediate stops are [UNKNOWN] in the sources consulted: the line through Rome, Cairo, Karachi, Calcutta, Bangkok and Singapore is our sketch. Batavia is drawn at Kemayoran (OurAirports, closed); the source names the later Halim field as the original destination, so the exact Batavia field is [UNKNOWN] here. " + STAND_IN,
            schedule=tr("KLM airliner", 2)),
        rec(id="pan-am-china-clipper-1935", family=I, color="#ffb3c7",
            name="Pan Am China Clipper, San Francisco Bay to Manila, Nov 1935", start_date="1935-11-22", end_date="1935-11-29",
            vehicle="prop-airliner", goods=["air mail (over 110,000 pieces)"], goods_source="China Clipper article", confidence_level="medium",
            citations=[W("China Clipper"), W("Martin M-130")],
            path=[A("US-12488"), A("PHNL"), A("PMDY"), A("PWAK"), A("PGUM"), A("RPLL")],
            notes="The first commercial transpacific air mail left Alameda on 22 November 1935 and reached Manila on 29 November via Honolulu, Midway, Wake and Guam. Alameda is drawn at the former Naval Air Station (OurAirports, closed); the island stops at today's airfields, since the flying-boat moorings are not in OurAirports. " + STAND_IN,
            schedule=dated("china-clipper-1935", "China Clipper (Martin M-130, NC14716)", "Inaugural transpacific air mail flight", "1935-11-22", "1935-11-29")),
        rec(id="pan-am-yankee-clipper-1939", family=I, color="#ffb3c7",
            name="Pan Am Yankee Clipper, northern transatlantic air mail, June 1939", start_date="1939-06-24", end_date="1939-06-24",
            vehicle="prop-airliner", goods=["air mail"], confidence_level="medium",
            citations=[W("Pan American World Airways"), W("Boeing 314 Clipper")],
            path=[A("KLGA"), A("CSB5"), A("CCP2"), A("EINN"), A("EGHI")],
            notes="On 24 June 1939 the Boeing 314 Yankee Clipper opened Pan Am's northern transatlantic air mail route via Shediac, Botwood and Foynes to Southampton; passenger service followed on 8 July 1939. The southern route to France had opened for air mail on 20 May 1939. New York (Port Washington) is drawn at LaGuardia and Foynes at nearby Shannon (both stand-ins); arrival date [UNKNOWN] here. " + STAND_IN,
            schedule=dated("yankee-clipper-1939", "Yankee Clipper (Boeing 314)", "Northern route air mail inauguration", "1939-06-24")),
        rec(id="american-airlines-dc3-1936", family=I, color="#ffb3c7",
            name="American Airlines DC-3, first passenger service, Newark–Chicago, 1936", start_date="1936-06-26", end_date="1936-06-26",
            vehicle="dc-3", goods=["passengers"], confidence_level="medium",
            citations=[W("Douglas DC-3"), W("American Airlines")],
            path=[A("KEWR"), A("KMDW")],
            notes="American Airlines began DC-3 passenger service on 26 June 1936 with simultaneous flights from Newark and Chicago; one direction is drawn. Chicago is drawn at Midway (stand-in for the 1936 field, [UNKNOWN] here).",
            schedule=dated("american-dc3-1936", "Douglas DC-3 (American Airlines)", "First DC-3 passenger service", "1936-06-26")),
        rec(id="berlin-airlift-frankfurt-tempelhof", family=I, color="#ffb3c7",
            name="Berlin Airlift, Frankfurt to Tempelhof (US), 1948–1949", start_date="1948-06-26", end_date="1949-09-30",
            vehicle="dc-3", goods=["coal", "food", "fuel", "medicine"], goods_source="Berlin Blockade article", confidence_level="medium",
            citations=[W("Berlin Blockade")],
            path=[A("EDDF"), A("DE-0456")],
            notes="The airlift ran from 26 June 1948 to 30 September 1949 through three 20-mile-wide air corridors. American C-47s (military DC-3s, the model shown) and C-54s flew from the Frankfurt area into Tempelhof (OurAirports, closed). The US Air Force delivered 1,783,573 tons. The line is a straight sketch of the southern corridor, not a flight track.",
            schedule=tr("C-47 Skytrain (USAF)", 6, both=False)),
        rec(id="berlin-airlift-hamburg-gatow", family=I, color="#ffb3c7",
            name="Berlin Airlift, Hamburg area to Gatow (RAF), 1948–1949", start_date="1948-06-26", end_date="1949-09-30",
            vehicle="dc-3", goods=["coal", "food", "fuel"], goods_source="Berlin Blockade article", confidence_level="medium",
            citations=[W("Berlin Blockade")],
            path=[A("EDDH"), A("DE-0904")],
            notes="The British flew southeast from airfields in the Hamburg area through their corridor into RAF Gatow (OurAirports, closed) and delivered 541,937 tons. Hamburg airport stands in for the several departure fields. The model shows a C-47 (Dakota in RAF service); the mix of British types on this corridor is [UNKNOWN] here (the source names Handley Page Haltons and Short Sunderlands among them). Straight sketch, not a flight track.",
            schedule=tr("Dakota (RAF)", 4, both=False)),
        # ---------------- jet age, 1952-today ----------------
        rec(id="boac-comet-1952", family=J, color="#b8f3ff",
            name="BOAC Comet, first jetliner passenger service, London to Johannesburg, 1952", start_date="1952-05-02", end_date="1952-05-02",
            vehicle="comet", goods=["passengers"], confidence_level="medium",
            citations=[W("De Havilland Comet"), W("BOAC")],
            path=[A("EGLL"), A("LIRA"), A("HSSK"), A("HKJK"), A("FAOR")],
            notes="On 2 May 1952 Comet G-ALYP flew the world's first jetliner flight with fare-paying passengers, opening London–Johannesburg (five stops, scheduled at 21 h 20 min). Stops drawn (Rome, Khartoum, Nairobi) are places the sources name for Comet Africa flights; the exact five stops are [UNKNOWN] here. Arrival date [UNKNOWN].",
            schedule=dated("comet-g-alyp-1952", "Comet 1 G-ALYP 'Yoke Peter' (BOAC)", "First jetliner service with fare-paying passengers", "1952-05-02")),
        rec(id="sas-polar-copenhagen-los-angeles-1954", family=J, color="#b8f3ff",
            name="SAS polar route, Copenhagen to Los Angeles, 1954", start_date="1954-11-15", end_date="1954-11-15",
            vehicle="prop-airliner", goods=["passengers"], confidence_level="medium",
            citations=[W("Polar route"), W("Scandinavian Airlines")],
            path=[A("EKCH"), A("BGSF"), A("CYWG"), A("KLAX")],
            notes="SAS began the first commercial polar route on 15 November 1954, flying Douglas DC-6Bs from Copenhagen to Los Angeles via Søndre Strømfjord (Kangerlussuaq) and Winnipeg. Only the first flight is shown; how long the service ran is [UNKNOWN] here. " + STAND_IN,
            schedule=dated("sas-polar-1954", "Douglas DC-6B (SAS)", "First commercial polar route flight", "1954-11-15")),
        rec(id="sas-polar-copenhagen-tokyo-1957", family=J, color="#b8f3ff",
            name="SAS polar route, Copenhagen to Tokyo via Anchorage, 1957", start_date="1957-02", end_date="1957",
            vehicle="prop-airliner", goods=["passengers"], confidence_level="low",
            citations=[W("Polar route"), W("Scandinavian Airlines")],
            path=[A("EKCH"), A("PANC"), A("RJTT")],
            notes="In February 1957 SAS began Europe–Tokyo flights over the pole via Anchorage with Douglas DC-7Cs. Only 1957 is shown; the day of the first flight and the end of the service are [UNKNOWN] here. Tokyo is drawn at Haneda. " + STAND_IN,
            schedule={"kind": "years", "label": "Douglas DC-7C (SAS)", "years": [1957], "years_source": "first flights February 1957 (Polar route article)",
                      "start_day": 31, "speed_km_day": 20000, "min_display_days": 24}),
        rec(id="pan-am-747-1970", family=J, color="#b8f3ff",
            name="Pan Am Boeing 747, first service, New York to London, 1970", start_date="1970-01-22", end_date="1970-01-22",
            vehicle="boeing-747", goods=["passengers"], confidence_level="medium",
            citations=[W("Boeing 747"), W("Pan American World Airways")],
            path=[A("KJFK"), A("EGLL")],
            notes="The 747 entered service on 22 January 1970 on Pan Am's New York–London route. The inaugural flight of the evening of 21 January was delayed for hours by an engine failure on Clipper Young America, and Clipper Victor was substituted. Arrival time [UNKNOWN] here.",
            schedule=dated("pan-am-747-1970", "Clipper Victor (Boeing 747-100, Pan Am)", "First Boeing 747 revenue service", "1970-01-22")),
        rec(id="qantas-747-kangaroo-route", family=J, color="#b8f3ff",
            name="Qantas Boeing 747, Kangaroo Route, Sydney to London, 1971–2020", start_date="1971-08", end_date="2020-07",
            vehicle="boeing-747", goods=["passengers", "air freight"], confidence_level="low",
            citations=[W("Kangaroo Route"), W("Qantas")],
            path=[A("YSSY"), A("WSSS"), A("OBBI"), A("EGLL")],
            notes="Qantas introduced the 747 (747-238B) in August 1971 and retired its last 747 in July 2020. Stops drawn (Singapore, Bahrain) are those the source gives for the late 1970s; the routing changed over the years and is not shown. Service gaps [UNKNOWN] here.",
            schedule=tr("Qantas Boeing 747", 2)),
        rec(id="concorde-london-bahrain-1976", family=J, color="#b8f3ff",
            name="Concorde, first British Airways service, London to Bahrain, 1976", start_date="1976-01-21", end_date="1976-01-21",
            vehicle="concorde", goods=["passengers"], confidence_level="medium",
            citations=[W("Concorde")],
            path=[A("EGLL"), A("OBBI")],
            notes="Concorde entered service on 21 January 1976 with British Airways from London Heathrow and Air France from Paris. London–Bahrain is among the BA routes the source lists. The Concorde model is an artistic impression.",
            schedule=dated("concorde-ba-1976", "Concorde (British Airways)", "First Concorde scheduled service (BA)", "1976-01-21")),
        rec(id="concorde-paris-rio-1976", family=J, color="#b8f3ff",
            name="Concorde, first Air France service, Paris to Rio via Dakar, 1976", start_date="1976-01-21", end_date="1976-01-21",
            vehicle="concorde", goods=["passengers"], confidence_level="medium",
            citations=[W("Concorde")],
            path=[A("LFPG"), A("GOOY"), A("SBGL")],
            notes="Air France's first Concorde service left Paris-Roissy on 21 January 1976; Paris–Dakar–Rio de Janeiro is among the Air France routes the source lists. Rio is drawn at Galeão. The Concorde model is an artistic impression.",
            schedule=dated("concorde-af-1976", "Concorde (Air France)", "First Concorde scheduled service (Air France)", "1976-01-21")),
        rec(id="concorde-london-new-york", family=J, color="#b8f3ff",
            name="Concorde, London to New York JFK, 1977–2003", start_date="1977-10-17", end_date="2003-10-24",
            vehicle="concorde", goods=["passengers"], confidence_level="medium",
            citations=[W("Concorde")],
            path=[A("EGLL"), A("KJFK")],
            notes="Concorde flew to New York JFK from 17 October 1977; the average supersonic transatlantic flight took just under 3.5 hours. British Airways retired its Concorde fleet on 24 October 2003. Service gaps (for example after the July 2000 crash, until 7 November 2001) are not shown. Display pace slowed so the aircraft can be seen. The Concorde model is an artistic impression.",
            schedule=tr("Concorde (British Airways)", 1)),
        rec(id="concorde-paris-new-york", family=J, color="#b8f3ff",
            name="Concorde, Paris to New York JFK, 1977–2003", start_date="1977-10-17", end_date="2003-05-30",
            vehicle="concorde", goods=["passengers"], confidence_level="low",
            citations=[W("Concorde")],
            path=[A("LFPG"), A("KJFK")],
            notes="Paris–New York is among the Air France Concorde routes; the source dates Concorde service to JFK from 17 October 1977 without naming the airline, so Air France's own start date is [UNKNOWN] here. Air France flew its last commercial Concorde flight on 30 May 2003. The Concorde model is an artistic impression.",
            schedule=tr("Concorde (Air France)", 1)),
        rec(id="singapore-sq21-newark-2004", family=J, color="#b8f3ff",
            name="Singapore Airlines SQ21/22, Singapore–Newark nonstop, 2004–2013", start_date="2004-06-28", end_date="2013-11-23",
            vehicle="jet", goods=["passengers"], confidence_level="medium",
            citations=[W("Singapore Airlines Flights 21 and 22")],
            path=[A("WSSS"), A("KEWR")],
            notes="Flown from 28 June 2004 to 23 November 2013 with the Airbus A340-500 on a 15,344 km great circle passing within 130 km of the North Pole, and again from 11 October 2018 to 25 March 2020 with the A350-900ULR (that second period is not drawn). The great circle here is a sketch; real tracks varied with the winds.",
            schedule=tr("Airbus A340-500 (Singapore Airlines)", 1)),
        rec(id="singapore-sq23-new-york-2020", family=J, color="#b8f3ff",
            name="Singapore Airlines SQ23/24, Singapore–New York JFK nonstop, 2020–today", start_date="2020-11-09", end_date="2026",
            vehicle="jet", goods=["passengers"], confidence_level="medium",
            citations=[W("Singapore Airlines Flights 23 and 24")],
            path=[A("WSSS"), A("KJFK")],
            notes="Launched on 9 November 2020; 15,349 km great circle, scheduled at over 18 hours. Real tracks often run over the Pacific or the Atlantic depending on winds; only the great circle is drawn.",
            schedule=tr("Airbus A350-900 (Singapore Airlines)", 1)),
        rec(id="qantas-perth-london-2018", family=J, color="#b8f3ff",
            name="Qantas Perth–London nonstop (Kangaroo Route), 2018–today", start_date="2018-03-25", end_date="2026",
            vehicle="jet", goods=["passengers"], confidence_level="medium",
            citations=[W("Kangaroo Route")],
            path=[A("YPPH"), A("EGLL")],
            notes="Qantas began nonstop Perth–London flights with Boeing 787s on 25 March 2018, the first nonstop link between Australia and Europe. Interruptions and reroutings since 2020 are not shown [UNKNOWN].",
            schedule=tr("Boeing 787 (Qantas)", 1)),
    ]
