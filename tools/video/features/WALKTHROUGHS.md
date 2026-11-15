# Feature walkthrough script list

Narrated, captioned walkthroughs for every major feature. Voice is unset until
the owner picks one. Do not generate audio in this scaffold. Recorder:
`tools/video/narrated.mjs` (Piper at 1.0, captions follow the spoken words).

| Id | Topic | Script |
| --- | --- | --- |
| `basics` | How to open SeaGlobe and read the globe and eras | existing tools/video/features/basics.mjs |
| `encyclopedia` | Encyclopedia search, Ask, Listen, show on globe | existing tools/video/features/encyclopedia.mjs |
| `log` | Ship's Log, filters, CSV, keyboard | existing tools/video/features/log.mjs |
| `regions` | Borders and regions, breadcrumb, live US town boundaries | existing tools/video/features/regions.mjs |
| `tools` | Air hubs, coordinates, measure, print | existing tools/video/features/tools.mjs |
| `space` | Launch sites, satellites, space entries | existing tools/video/features/space.mjs |
| `tours` | Narrated tours, Next, Stop, captions | existing tools/video/features/tours.mjs |
| `radio` | Creedence Radio, load, minimize, close | existing tools/video/features/radio.mjs |
| `ask` | Ask the atlas, offline and with the visitor's own key | existing tools/video/features/ask.mjs |
| `about` | About, credits, version, changelog | existing tools/video/features/about.mjs |
| `phone` | Phone sheet, tabs, targets | existing tools/video/features/phone.mjs |
| `models` | Vehicle models / contact sheet if still used | existing tools/video/features/models.mjs |
| `windows` | Window controls (lock, content zoom, minimize, reset layout) | TODO script |
| `how-to-go-deeper` | The Layers 'How to go deeper' note | TODO script |
| `pmtiles-borders` | Fast Census PMTiles borders (after v3.1 is on) | TODO script |
| `terrain` | 3DEP terrain (after v3.1 is on) | TODO script |
| `historical-bells` | Historical bells on the time slider (v3.3+) | TODO script |
| `laws` | Quoted laws on country entries (v3.3+) | TODO script |
| `authorities` | Authorities on places (v3.3+) | TODO script |
| `tax` | Federal tax section, US Code and IRS only (v3.3+) | TODO script |
| `learning-paths` | Cited explainers on places (v3.3+) | TODO script |

New TODO scripts should follow the existing feature-module shape (`scenes`, `lines[].say`, `lines[].cap`, optional `phone`).
