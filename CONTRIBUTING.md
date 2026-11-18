# Contributing to SeaGlobe

SeaGlobe accepts new or corrected atlas records that match the templates below. Code, tiles, binaries, personal data, and parcels are not accepted here.

## How to submit

Open a pull request that edits an existing layer file, or open an issue and attach a JSON file the maintainer can merge into that file. Do not open a pull request that adds a new file. Merge into a file that is already in the project.

Check a submission first:

```
python3 tools/check_contribution.py your-submission.json
```

The checker prints errors in plain words and does not write or merge anything.

## What is accepted

- A record that matches one of the templates in this file (points, lines, or areas).
- A primary source for every record (an official page, archive, dataset, or durable identifier such as a DOI) in `citation` or `citations` / `cite`, and a short `source` label where the template has that field. A secondary book may be listed as well; it does not replace the primary source. Gaps are `[UNKNOWN]`, never guessed.
- A license line on the submission wrapper. Allowed values: `public domain`, or `CC BY` with an optional version (for example `CC BY 4.0` or `CC BY 3.0`). `CC BY-SA`, `CC BY-NC`, and any other value are rejected. Narrow exception: the StarFire layer (`"layer": "starfire"`) may use `"license": "MIT"`, by creator permission given to the owner on 16 and 17 November 2026; the credit line is exactly `StarFire by @wntrslmbr`. Every other layer keeps the public domain or CC BY rule.
- No names of private people, emails, phone numbers, street addresses, or parcel identifiers.

## Submission wrapper

```json
{
  "license": "public domain",
  "layer": "airports",
  "merge_into": "web/data/places/airports.js",
  "records": []
}
```

`layer` is one of `airports`, `launch-sites`, `bells`, `routes`, `regions`, `uap`, `starfire`. `merge_into` must already exist in the repo. Coordinate order follows the existing files: route and place points are `[lat, lon]` or named `lat` / `lon`; region rings are `[lon, lat]`.

## Templates

### Airports (points)

Merge into `web/data/places/airports.js`. Each record is an 8-item array: `ident`, `name`, `lat`, `lon`, `country`, `municipality`, `iata`, `type`. Use `""` when municipality or IATA is none. Name the OurAirports (or other official) source in the issue, the pull request, or a `citation` next to the wrapper.

```json
["BIKF", "Keflavik International Airport", 63.985, -22.606, "IS", "Reykjavík", "KEF", "large_airport"]
```

### Launch sites (points)

Merge into `web/data/space/gcat.js`. Required fields: `code`, `name`, `short`, `state`, `location` (use `"-"` when there is no separate location), `lat`, `lon`, `launches`, `first`, `last`. Name the GCAT page or an official site source in the issue, the pull request, or a `citation` next to the wrapper.

```json
{
  "code": "CC",
  "name": "Cape Canaveral Air Station, Florida",
  "short": "Canaveral",
  "state": "US",
  "location": "-",
  "lat": 28.46,
  "lon": -80.54,
  "launches": 1108,
  "first": 1957,
  "last": 2026
}
```

### Bells (points)

Merge into `web/data/next/bells/bells.json` (the shipped historical bells layer). Required fields: `id` (must start with `bell:`), `kind` (must be `bell`), `title`, `example` (real submissions must use `false`), and `citations` (a non-empty list with a primary source). Optional fields may use `[UNKNOWN]` when not sourced. A bell without coordinates gets no map pin. `web/data/next/bells/example.json` is example data only and must not be shipped as a real record.

### UAP records (official, declassified) (points)

Merge into `web/data/next/uap/uap.json` (the official declassified UAP layer, heavy and off by default). Use `"layer": "uap"` and `"license": "public domain"` on the wrapper; the allowed license values are unchanged. Only official government records that are public domain (for example U.S. government works: AARO, the National Archives, U.S. Air Force) are accepted. Records from archives under other licenses (for example UK Open Government Licence, Library and Archives Canada terms, CNES GEIPAN) are linked under Go deeper only, not added here.

Required fields:

- `id`: `uap:<agency>-<place>-<year>`, lowercase words joined by `-` (for example `uap:aaro-al-taqaddum-2017`).
- `kind`: `uap-record`. `example`: `false` for real records.
- `title`: the record's name (case or file title as the agency gives it, with the date).
- `place`: the installation, town, county, or sea area named in the official record.
- `geo`: `lat` / `lon` rounded to 0.1 degree (about 11 km), taken from a cited public-domain gazetteer (for example OurAirports or GNIS), or `null` when the record names no usable place (no pin). Say what the point stands for in `location_basis` and where it came from in `coordinate_source`. Never pin a finer point than the record names.
- `date` (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`) and `time` (`start`, `end`, `precision`), as on the official record.
- `agency`: the issuing body (for example AARO, U.S. Air Force Project Blue Book).
- `finding`: the agency's own conclusion, quoted or closely paraphrased from the cited page, or `[UNKNOWN]` when it was not read. A record with no readable finding and nothing else official to say is not added.
- `claim`: `we-have-a-record`, `not-proven`, or `people-disagree`. On this layer `claim` describes the agency's own finding: `we-have-a-record` means the official finding was read on the cited page; it is not SeaGlobe asserting what the object was. Any claim of extraterrestrial origin is `not-proven`; public claims that contradict the official finding go in `other_claims` as `people-disagree`, each with its own `cite`.
- `citations`: a non-empty list with the primary official URL and, where one exists, a durable identifier (for example a National Archives Identifier, NAID, with series, record group, and microfilm roll). Every fact on the record is covered by a citation.
- `license_basis`: why the record is public domain (for example "U.S. government work (17 U.S.C. 105)").

Optional fields: `summary` (only what the official page states), `status` (`official-report` or `declassified`), `claim_note`, `other_claims`, `evidence.gaps` (each gap as `[UNKNOWN]` with what was not read).

Not allowed: names of witnesses or other private people, personal data of any kind, exact or street addresses, homes, parcels, or coordinates finer than 0.1 degree. Official videos, scans, and PDFs are linked, never bundled.

```json
{
  "example": false,
  "kind": "uap-record",
  "id": "uap:aaro-al-taqaddum-2017",
  "title": "Al Taqaddum Air Base object, 23 October 2017",
  "place": "Al Taqaddum Air Base, Iraq",
  "geo": {"lat": 33.3, "lon": 43.6},
  "location_basis": "installation named in the official record (coarse, 0.1 degree)",
  "coordinate_source": "OurAirports airports.csv (public domain), ident ORAT",
  "date": "2017-10-23",
  "time": {"start": 2017, "end": 2017, "precision": "day"},
  "agency": "All-domain Anomaly Resolution Office (AARO), U.S. Department of Defense",
  "finding": "AARO assesses with high confidence that the object was consistent with a cluster of fully and partially inflated balloons.",
  "claim": "we-have-a-record",
  "citations": ["https://www.aaro.mil/UAP-Cases/UAP-Case-Resolution-Reports/"],
  "license_basis": "U.S. government work (17 U.S.C. 105), public domain"
}
```


### StarFire sightings (points)

Merge into `web/data/next/starfire/starfire.json` (the StarFire sightings layer, heavy and off by default). Use `"layer": "starfire"` and `"license": "MIT"` on the wrapper. This MIT exception is only for the StarFire layer; creator permission was given to the owner on 16 and 17 November 2026. Credit every record and the wrapper as `StarFire by @wntrslmbr`. This is a dated archive snapshot (17 November 2026): do not add a live feed, a refresh URL, or a poll of the archive. Keep this layer separate from official UAP records. Default `claim` is `not-proven` (these are reports, not confirmed identifications).

Required fields:

- `id`: `starfire:<source-id>-<year>`, lowercase words and digits joined by `-`.
- `kind`: `starfire-record`. `example`: `false` for real records.
- `title`, `place`, `date` (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`) and `time` (`start`, `end`, `precision`).
- `geo`: `lat` / `lon` rounded to 0.1 degree, or `null` when there is no pin. Say what the point stands for in `location_basis` and where it came from in `coordinate_source`. If the coordinate is a state, region or county centroid, or the archive says it is not a sighting position, say so in `location_basis` so the pin can be drawn as approximate.
- `agency`: `StarFire by @wntrslmbr`.
- `finding`: the archive or official finding, or `[UNKNOWN]` when it was not given.
- `claim`: `we-have-a-record`, `not-proven`, or `people-disagree`. This layer uses `not-proven` unless a later cited finding changes that.
- `citations`: a non-empty list with at least one source URL from the archive.
- `license_basis`: why the record can be kept (StarFire archive under the MIT License; place data from GeoNames, CC BY 4.0; linked articles belong to their publishers and are cited, not copied).

Not allowed: names of witnesses or other private people, personal data of any kind, exact or street addresses, homes, parcels, article text, a live feed, or coordinates finer than 0.1 degree.

```json
{
  "example": false,
  "kind": "starfire-record",
  "id": "starfire:example-place-2026",
  "title": "Example sighting report",
  "place": "Example State, United States",
  "geo": {"lat": 44.9, "lon": -122.7},
  "location_basis": "state/province-level only; NOT a sighting position. Coarse pin, 0.1 degree.",
  "coordinate_source": "StarFire by @wntrslmbr snapshot, 17 November 2026; coordinates rounded to 0.1 degree. Place data: GeoNames (geonames.org), CC BY 4.0.",
  "date": "2026",
  "time": {"start": 2026, "end": 2026, "precision": "year"},
  "agency": "StarFire by @wntrslmbr",
  "finding": "[UNKNOWN]",
  "claim": "not-proven",
  "citations": ["Example outlet, 2026-11-17: https://example.invalid/report"],
  "license_basis": "StarFire archive under the MIT License; place data from GeoNames (geonames.org), CC BY 4.0; linked articles belong to their publishers. This record is a coarsened snapshot with source citations, not article text."
}
```

### Routes (lines)

Merge into an existing family JSON file under `web/data/routes/` (for example `web/data/routes/atlantic.json`). Do not add a new family file. Required fields: `id`, `name`, `type`, `era`, `path` (at least two `[lat, lon]` points), `source`, `citation` (primary source with a URL or DOI), `start_date`, `end_date`.

Allowed `type` values from `web/data/schema.js`: `sea`, `land`, `river`, `canal`, `rail`, `air`, `pipeline`. Allowed `era` values: `classical`, `late-antiquity`, `medieval`, `age-of-sail`, `industrial`, `modern`.

### Regions (areas)

Merge into an existing pack under `web/data/regions/` (`world.js`, `admin1/<A3>.js`, or `counties/US-<ST>.js`). Do not use this template for towns. Required fields depend on the pack: countries need `id`, `a3`, `name`, `polys`; states need `id`, `name`, `iso`, `polys`; counties need `id`, `name`, `fips`, `polys`. Each ring is `[lon, lat]` points, length at least 4 including closure, with the first point equal to the last.

```json
{
  "id": "country-gnq",
  "a3": "GNQ",
  "name": "Eq. Guinea",
  "polys": [[[[9.65, 2.28], [11.28, 2.26], [11.29, 1.06], [9.83, 1.07], [9.49, 1.01], [9.31, 1.16], [9.65, 2.28]]]]
}
```

## License

Code is MIT. Original documentation and hand-written route reconstructions are CC BY 4.0. Third-party datasets keep their own licenses. See [LICENSE](LICENSE) and [DATA.md](DATA.md).
