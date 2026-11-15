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
- A license line on the submission wrapper. Allowed values: `public domain`, or `CC BY` with an optional version (for example `CC BY 4.0` or `CC BY 3.0`). `CC BY-SA`, `CC BY-NC`, and any other value are rejected.
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

`layer` is one of `airports`, `launch-sites`, `bells`, `routes`, `regions`. `merge_into` must already exist in the repo. Coordinate order follows the existing files: route and place points are `[lat, lon]` or named `lat` / `lon`; region rings are `[lon, lat]`.

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
