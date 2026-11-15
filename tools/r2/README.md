# R2 upload manifest (template)

`upload-manifest.template.json` lists the Census TIGER/Line 2026 PMTiles and the
USGS 3DEP terrain archive already built locally, with byte sizes from
`SIZES-pmtiles.txt`. Checksums are left `[UNKNOWN]` here; copy them from
`SHA256SUMS-pmtiles.txt` at upload time.

**Do not upload** from this scaffold. Owner YES is required for every upload and
every push. Gaps (cousub/place z11–13, terrain z7–8, Aleutian / date-line pieces)
stay `[UNKNOWN]` until Build finishes them.

Credits: U.S. Census Bureau; U.S. Geological Survey.
