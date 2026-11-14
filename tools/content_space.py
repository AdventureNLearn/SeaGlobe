"""Encyclopedia text for the notable spacecraft in the GCAT slice. Our own short wording; each entry cites the
Wikipedia article it was checked against (read 14 Nov 2026). Orbit numbers and launch dates come from GCAT, not
from this text. Anything not stated in the cited article is left out or marked [UNKNOWN].
Usage: python3 tools/content_space.py  (writes web/data/space/content.js)"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
W = lambda t: f"Wikipedia, \"{t}\", https://en.wikipedia.org/wiki/{t.replace(' ', '_')} (accessed 14 Nov 2026)"

C = {
 "S00002": {"title": "Sputnik 1", "aliases": ["PS-1", "1-y ISZ"],
   "summary": "The first artificial Earth satellite, launched by the Soviet Union on 4 October 1957.",
   "history": "Sputnik 1 went into an elliptical low Earth orbit and radioed signals home for about three weeks, until its silver-zinc batteries ran down. Atmospheric drag brought it down on 4 January 1958.",
   "cite": [W("Sputnik 1")]},
 "S00004": {"title": "Explorer 1", "aliases": ["Explorer I"],
   "summary": "The first United States satellite (1958), flown for the International Geophysical Year.",
   "history": "Explorer 1 followed the Soviet Sputnik 1 and Sputnik 2 of 1957; its launch is counted as part of the opening of the Cold War space race between the two countries.",
   "cite": [W("Explorer 1")]},
 "S00340": {"title": "Telstar 1", "aliases": [],
   "summary": "An early communications satellite (launched 10 July 1962) that relayed live television between the United States and Europe.",
   "history": "Telstar 1 worked for only about seven months before radiation from the Starfish Prime high-altitude nuclear test disabled it. It is no longer working but is still in orbit.",
   "cite": [W("Telstar 1")]},
 "S00858": {"title": "Syncom 3", "aliases": ["Syncom C"],
   "summary": "Launched in 1964 and described as the world's first geostationary satellite.",
   "history": "Syncom was a NASA programme begun in 1961 for active geosynchronous communication satellites, built by Hughes Aircraft. Syncom 2 (1963) was the first geosynchronous communications satellite; Syncom 3 the first geostationary one.",
   "cite": [W("Syncom")]},
 "S01954": {"title": "Luna 9", "aliases": ["Luna-9", "Ye-6 No. 13"],
   "summary": "Soviet lunar probe; on 3 February 1966 the first spacecraft to soft-land on the Moon and send back pictures from its surface.",
   "history": "Luna 9 was an uncrewed mission of the Soviet Luna programme. The globe shows only its departure from Earth; its trajectory to the Moon is not drawn.",
   "cite": [W("Luna 9")]},
 "S04039": {"title": "Apollo 11 (command and service module)", "aliases": ["Apollo 11", "Apollo CM-107"],
   "summary": "The 1969 NASA mission that first landed humans on the Moon.",
   "history": "Apollo 11 was the fifth crewed Apollo mission. Its crew were Neil Armstrong (commander), Michael Collins (command module pilot) and Edwin \"Buzz\" Aldrin (lunar module pilot). The globe shows only the launch from Earth.",
   "cite": [W("Apollo 11")]},
 "S05160": {"title": "Salyut 1", "aliases": ["DOS-1", "Salyut"],
   "summary": "The first space station, launched by the Soviet Union on 19 April 1971.",
   "history": "The Salyut programme went on to launch more stations; its last module, Zvezda (DOS-8), became the core of the Russian segment of the International Space Station.",
   "cite": [W("Salyut 1")]},
 "S06126": {"title": "Landsat 1", "aliases": ["ERTS 1", "ERTS-A", "LS-1"],
   "summary": "First satellite of the US Landsat Earth-observation programme, launched 23 July 1972 from Vandenberg.",
   "history": "Landsat 1 was first named Earth Resources Technology Satellite (ERTS). It was adapted from the Nimbus 4 weather satellite and launched on a Delta 0900 rocket.",
   "cite": [W("Landsat 1")]},
 "S06633": {"title": "Skylab", "aliases": ["Skylab Orbital Workshop"],
   "summary": "The first United States space station, occupied for about 24 weeks between May 1973 and February 1974.",
   "history": "Three crews in turn lived aboard Skylab, on the missions Skylab 2, Skylab 3 and Skylab 4.",
   "cite": [W("Skylab")]},
 "S10684": {"title": "Navstar 1", "aliases": ["Navstar GPS SVN 1"],
   "summary": "A Navstar GPS satellite launched 22 February 1978 (launch date from GCAT).",
   "history": "[UNKNOWN] — no history text has been written and checked for this entry yet.",
   "cite": []},
 "S20580": {"title": "Hubble Space Telescope", "aliases": ["HST", "Hubble"],
   "summary": "A NASA space telescope launched into low Earth orbit in 1990 on STS-31, still working.",
   "history": "Hubble is named after the astronomer Edwin Hubble and is one of NASA's Great Observatories. The Space Telescope Science Institute chooses its targets and processes its data.",
   "cite": [W("Hubble Space Telescope")]},
 "S25544": {"title": "International Space Station (Zarya, first module)", "aliases": ["ISS", "Zarya", "Functional Cargo Block"],
   "summary": "Zarya, launched on 20 November 1998 on a Proton-K, was the first module of the International Space Station.",
   "history": "Zarya first supplied the station's power, propulsion and guidance; later it was used mostly for storage. It was built in Russia and paid for by the United States. The station is run by five partner agencies (NASA, Roscosmos, ESA, JAXA and CSA).",
   "cite": [W("Zarya (ISS module)"), W("International Space Station")]},
 "S37820": {"title": "Tiangong-1", "aliases": ["Tiangong 1"],
   "summary": "China's first prototype space station, in orbit from September 2011 to April 2018.",
   "history": "During development it was called a target vehicle: its main job was to test orbital rendezvous and docking, and secondly to serve as a crewed laboratory.",
   "cite": [W("Tiangong-1")]},
 "S48274": {"title": "Tianhe core module", "aliases": ["Tianhe"],
   "summary": "The first module of the Tiangong space station, launched 29 April 2021.",
   "history": "Its launch opened the final phase of the Tiangong programme within the China Manned Space Program.",
   "cite": [W("Tianhe core module")]},
}


def main():
    p = ROOT / "web" / "data" / "space" / "content.js"
    p.write_text("/* Generated by tools/content_space.py. Short entries for the notable GCAT objects; see each entry's citations. */\n"
                 "(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).space_content = " + json.dumps(C, indent=1, ensure_ascii=False) + ";\n")
    print(len(C), "space entries")


if __name__ == "__main__":
    main()
