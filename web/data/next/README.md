# Next-layer data skeletons

Schemas and **example** records for planned v3.1+ layers. Nothing here is loaded
on a normal visit (feature flags default off, and example records require
`?exampleData=1`).

Every `*-example.json` file is **example data**, not a citable fact. Do not ship
example records as encyclopedia content. Replace them with officially cited
records before turning a flag on for users.

| Folder | Kind | Primary source to credit (when real data is added) |
| --- | --- | --- |
| `laws/` | quoted statute cells | The official instrument URL on the record |
| `authorities/` | offices, not people | The official office page |
| `tax/` | US Title 26 / IRS only | Office of the Law Revision Counsel; eCFR; IRS notices |
| `learning-paths/` | short explainers | The official standard or agency the explainer is about |
| `bells/` | historical bells | The cited foundry, inventory, or contemporary source |
| `gis/` | county GIS, no parcels | U.S. Census Bureau |
| `layers/registry.json` | layer registry stub | Credits per layer |
| `topics/` | curated Topics list | Existing encyclopedia entries named on each row. `example.json` is test-only and loads only with `?exampleData=1`. |

Parcels and personal data are out of scope.
