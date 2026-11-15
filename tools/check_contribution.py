#!/usr/bin/env python3
"""Check a SeaGlobe contribution JSON. Prints plain-English errors; writes nothing."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 1048576
LAYERS = ("airports", "launch-sites", "bells", "routes", "regions")
PRIVACY = {
    "email", "phone", "telephone", "mobile", "address", "street", "ssn",
    "social_security", "parcel", "parcel_id", "apn", "owner_name",
}
LICENSE_RE = re.compile(r"^(public domain|cc by(?: \d+(?:\.\d+)?)?)$", re.I)
ID_RE = re.compile(r"https?://|doi:\s*10\.|doi\.org/10\.|\b10\.\d{4,}/", re.I)
AIRPORT_FIELDS = ("ident", "name", "lat", "lon", "country", "municipality", "iata", "type")
LAUNCH_FIELDS = ("code", "name", "short", "state", "location", "lat", "lon", "launches", "first", "last")


def out(msg: str) -> None:
    print(msg)


def load_schema() -> tuple[set[str], set[str]]:
    text = (ROOT / "web" / "data" / "schema.js").read_text(encoding="utf-8")
    types, eras = set(), set()
    m = re.search(r"\n\s*route_types:\s*\[(.*?)\]\s*,", text, re.S)
    if m:
        types = set(re.findall(r'\bid:\s*"([^"]+)"', m.group(1)))
    m = re.search(r"\n\s*eras:\s*\[(.*?)\]\s*,", text, re.S)
    if m:
        eras = set(re.findall(r'\bid:\s*"([^"]+)"', m.group(1)))
    return types, eras


def is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def latlon_ok(lat, lon) -> bool:
    return is_num(lat) and is_num(lon) and -90 <= lat <= 90 and -180 <= lon <= 180


def extract_jsonish(text: str):
    start = text.find("{")
    astart = text.find("[")
    if start < 0 and astart < 0:
        return None
    if astart >= 0 and (start < 0 or astart < start):
        start = astart
    chunk = text[start:]
    try:
        return json.loads(chunk)
    except json.JSONDecodeError:
        pass
    # strip trailing ); or assignment wrappers already skipped
    end = max(chunk.rfind("}"), chunk.rfind("]"))
    if end >= 0:
        try:
            return json.loads(chunk[: end + 1])
        except json.JSONDecodeError:
            return None
    return None


def existing_keys(path: Path, layer: str) -> set[str]:
    text = path.read_text(encoding="utf-8")
    keys: set[str] = set()
    if layer == "airports":
        for m in re.finditer(r'\[\s*"([^"]+)"\s*,', text):
            keys.add(m.group(1))
        return keys
    data = extract_jsonish(text)
    recs = []
    if isinstance(data, dict):
        if isinstance(data.get("sites"), list):
            recs = data["sites"]
        elif isinstance(data.get("records"), list):
            recs = data["records"]
        elif isinstance(data.get("countries"), list):
            recs = data["countries"]
        elif isinstance(data.get("states"), list):
            recs = data["states"]
        elif isinstance(data.get("counties"), list):
            recs = data["counties"]
        elif "id" in data or "code" in data:
            recs = [data]
        else:
            # admin1 rest packs: { countries: { A3: { states: [...] } } }
            countries = data.get("countries")
            if isinstance(countries, dict):
                for pack in countries.values():
                    if isinstance(pack, dict) and isinstance(pack.get("states"), list):
                        recs.extend(pack["states"])
    elif isinstance(data, list):
        recs = data
    field = {"launch-sites": "code", "bells": "id", "routes": "id", "regions": "id"}.get(layer, "id")
    for rec in recs:
        if isinstance(rec, dict) and rec.get(field) not in (None, ""):
            keys.add(str(rec[field]))
        elif isinstance(rec, list) and rec:
            keys.add(str(rec[0]))
    return keys


def walk_keys(obj, acc: list[str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            acc.append(str(k))
            walk_keys(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_keys(v, acc)


def privacy_hit(name: str) -> bool:
    low = name.lower()
    if low in PRIVACY:
        return True
    parts = re.split(r"[^a-z0-9]+", low)
    return any(p in PRIVACY for p in parts if p)


def has_source(val) -> bool:
    if isinstance(val, str):
        return bool(val.strip()) and bool(ID_RE.search(val))
    if isinstance(val, list):
        return any(isinstance(x, str) and x.strip() and ID_RE.search(x) for x in val)
    return False


def wrapper_source(sub: dict) -> bool:
    for k in ("citation", "citations", "cite", "source"):
        v = sub.get(k)
        if isinstance(v, str) and v.strip():
            return True
        if isinstance(v, list) and any(isinstance(x, str) and x.strip() for x in v):
            return True
    return False


def allowed_merge(layer: str, rel: str) -> bool:
    rel = rel.replace("\\", "/")
    if layer == "airports":
        return rel == "web/data/places/airports.js"
    if layer == "launch-sites":
        return rel == "web/data/space/gcat.js"
    if layer == "bells":
        return rel in ("web/data/next/bells/example.json", "web/data/next/bells/bells.json")
    if layer == "routes":
        return bool(re.fullmatch(r"web/data/routes/[^/]+\.json", rel)) and rel != "web/data/routes.json"
    if layer == "regions":
        return bool(re.fullmatch(r"web/data/regions/(world\.js|admin1/[^/]+\.js|counties/US-[A-Z]{2}\.js)", rel))
    return False


def rec_source(rec, layer: str, sub: dict) -> bool:
    if layer in ("airports", "launch-sites"):
        if isinstance(rec, dict) and (has_source(rec.get("citation") or rec.get("citations") or rec.get("cite")) or wrapper_source(sub)):
            return True
        return wrapper_source(sub)
    if layer == "bells":
        if isinstance(rec, dict) and rec.get("example") is True:
            return True
        return isinstance(rec, dict) and has_source(rec.get("citation") or rec.get("citations") or rec.get("cite"))
    if layer == "routes":
        return isinstance(rec, dict) and has_source(rec.get("citation") or rec.get("citations") or rec.get("cite"))
    if layer == "regions":
        if isinstance(rec, dict) and has_source(rec.get("citation") or rec.get("citations") or rec.get("cite")):
            return True
        return wrapper_source(sub)  # Natural Earth often cited on the issue / wrapper
    return False


def check_coords(rec, layer: str, errors: list[tuple[int, str]]) -> None:
    def point(lat, lon) -> None:
        if not latlon_ok(lat, lon):
            errors.append((3, "A latitude must be a number from −90 to 90, and a longitude must be a number from −180 to 180."))

    def pair(pt, lat_first: bool) -> None:
        if not (isinstance(pt, (list, tuple)) and len(pt) == 2 and is_num(pt[0]) and is_num(pt[1])):
            errors.append((3, "This point is not a coordinate pair."))
            return
        if lat_first:
            point(pt[0], pt[1])
        else:
            point(pt[1], pt[0])

    if layer == "airports" and isinstance(rec, list) and len(rec) >= 4:
        point(rec[2], rec[3])
    elif layer == "launch-sites" and isinstance(rec, dict):
        point(rec.get("lat"), rec.get("lon"))
    elif layer == "bells" and isinstance(rec, dict) and rec.get("geo") not in (None,):
        geo = rec["geo"]
        if isinstance(geo, dict):
            point(geo.get("lat"), geo.get("lon"))
    elif layer == "routes" and isinstance(rec, dict) and "path" in rec:
        path = rec["path"]
        if not isinstance(path, list) or len(path) < 2:
            errors.append((3, "A path must have at least two points."))
        elif isinstance(path, list):
            for pt in path:
                pair(pt, True)
    elif layer == "regions" and isinstance(rec, dict) and rec.get("polys") is not None:
        polys = rec["polys"]
        if not isinstance(polys, list):
            errors.append((1, "This field has the wrong type: polys."))
            return
        for poly in polys:
            if not isinstance(poly, list):
                errors.append((3, "This point is not a coordinate pair."))
                continue
            for ring in poly:
                if not isinstance(ring, list):
                    errors.append((3, "This point is not a coordinate pair."))
                    continue
                if len(ring) < 4:
                    errors.append((3, "A polygon ring is too short."))
                    continue
                for pt in ring:
                    pair(pt, False)
                a, b = ring[0], ring[-1]
                if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)) and len(a) == 2 and len(b) == 2:
                    if a[0] != b[0] or a[1] != b[1]:
                        errors.append((3, "A polygon ring must end at the same point it starts."))


def check_record_format(rec, layer: str, types: set[str], eras: set[str], errors: list[tuple[int, str]]) -> None:
    if layer == "airports":
        if not isinstance(rec, list) or len(rec) != 8:
            errors.append((1, "An airport record must be an array of 8 items."))
            return
        for i, name in enumerate(AIRPORT_FIELDS):
            val = rec[i]
            if name in ("lat", "lon"):
                if not is_num(val):
                    errors.append((1, f"This field has the wrong type: {name}."))
            elif not isinstance(val, str):
                errors.append((1, f"This field has the wrong type: {name}."))
            elif name in ("ident", "name", "country", "type") and not val:
                errors.append((1, f"This record is missing a required field: {name}."))
        return
    if not isinstance(rec, dict):
        errors.append((1, "This field has the wrong type: records."))
        return
    if layer == "launch-sites":
        for name in LAUNCH_FIELDS:
            if name not in rec:
                errors.append((1, f"This record is missing a required field: {name}."))
                continue
            val = rec[name]
            if name in ("lat", "lon", "launches", "first", "last"):
                if not is_num(val):
                    errors.append((1, f"This field has the wrong type: {name}."))
            elif not isinstance(val, str):
                errors.append((1, f"This field has the wrong type: {name}."))
            elif name in ("code", "name", "short", "state") and not val:
                errors.append((1, f"This record is missing a required field: {name}."))
    elif layer == "bells":
        for name in ("id", "kind", "title", "example"):
            if name not in rec:
                errors.append((1, f"This record is missing a required field: {name}."))
        if "id" in rec:
            if not isinstance(rec["id"], str):
                errors.append((1, "This field has the wrong type: id."))
            elif not rec["id"].startswith("bell:"):
                errors.append((1, "A bell id must start with bell:."))
        if "kind" in rec and rec["kind"] != "bell":
            errors.append((1, "This field has the wrong type: kind."))
        if "example" in rec and not isinstance(rec["example"], bool):
            errors.append((1, "This field has the wrong type: example."))
        if rec.get("example") is False and "citations" not in rec:
            errors.append((1, "This record is missing a required field: citations."))
        elif "citations" in rec and not isinstance(rec["citations"], list):
            errors.append((1, "This field has the wrong type: citations."))
        if "title" in rec and not isinstance(rec["title"], str):
            errors.append((1, "This field has the wrong type: title."))
    elif layer == "routes":
        for name in ("id", "name", "type", "era", "path", "source", "citation", "start_date", "end_date"):
            if name not in rec:
                errors.append((1, f"This record is missing a required field: {name}."))
        if rec.get("type") is not None and rec.get("type") not in types:
            errors.append((1, "This route type or era is not in schema.js."))
        elif rec.get("era") is not None and rec.get("era") not in eras:
            errors.append((1, "This route type or era is not in schema.js."))
        if "path" in rec and not isinstance(rec["path"], list):
            errors.append((1, "This field has the wrong type: path."))
        for name in ("id", "name", "type", "era", "source", "citation", "start_date", "end_date"):
            if name in rec and not isinstance(rec[name], str):
                errors.append((1, f"This field has the wrong type: {name}."))
    elif layer == "regions":
        for name in ("id", "name", "polys"):
            if name not in rec:
                errors.append((1, f"This record is missing a required field: {name}."))
        # pack-specific
        # a3 / iso / fips checked by caller via merge path
        if "id" in rec and not isinstance(rec["id"], str):
            errors.append((1, "This field has the wrong type: id."))
        if "name" in rec and not isinstance(rec["name"], str):
            errors.append((1, "This field has the wrong type: name."))
        if "polys" in rec and not isinstance(rec["polys"], list):
            errors.append((1, "This field has the wrong type: polys."))


def region_extra(rel: str, rec: dict, errors: list[tuple[int, str]]) -> None:
    if rel.endswith("world.js"):
        if "a3" not in rec:
            errors.append((1, "This record is missing a required field: a3."))
        elif not isinstance(rec["a3"], str):
            errors.append((1, "This field has the wrong type: a3."))
    elif "/admin1/" in rel:
        if "iso" not in rec:
            errors.append((1, "This record is missing a required field: iso."))
        elif not isinstance(rec["iso"], str):
            errors.append((1, "This field has the wrong type: iso."))
    elif "/counties/" in rel:
        if "fips" not in rec:
            errors.append((1, "This record is missing a required field: fips."))
        elif not isinstance(rec["fips"], str):
            errors.append((1, "This field has the wrong type: fips."))


def rec_key(rec, layer: str):
    if layer == "airports":
        if isinstance(rec, list) and rec:
            return str(rec[0])
        return None
    if not isinstance(rec, dict):
        return None
    field = {"launch-sites": "code", "bells": "id", "routes": "id", "regions": "id"}[layer]
    val = rec.get(field)
    return None if val in (None, "") else str(val)


def main(argv: list[str]) -> int:
    errors: list[tuple[int, str]] = []
    if len(argv) < 2:
        out("The checker could not read this file: (no path given).")
        return 9
    path = Path(argv[1])
    if not path.is_file():
        out(f"The checker could not read this file: {argv[1]}.")
        return 9
    try:
        size = path.stat().st_size
        raw = path.read_bytes()
    except OSError:
        out(f"The checker could not read this file: {argv[1]}.")
        return 9
    if size > MAX_BYTES:
        errors.append((5, "This file is over 1 MiB."))
    try:
        text = raw.decode("utf-8")
        sub = json.loads(text)
    except (UnicodeDecodeError, json.JSONDecodeError):
        errors.append((1, "This file is not valid JSON."))
        for code, msg in errors:
            out(msg)
        return min(c for c, _ in errors)

    if not isinstance(sub, dict):
        errors.append((1, "This file is not valid JSON."))
        for code, msg in errors:
            out(msg)
        return min(c for c, _ in errors)

    for name in ("license", "layer", "merge_into", "records"):
        if name not in sub:
            errors.append((1, f"The submission is missing a required wrapper field: {name}."))
    if "records" in sub and not isinstance(sub["records"], list):
        errors.append((1, "This field has the wrong type: records."))

    if "license" in sub:
        lic = sub["license"]
        if not isinstance(lic, str) or not LICENSE_RE.fullmatch(lic.strip()):
            errors.append((6, "The license must be public domain or CC BY, and the submission must say which."))

    layer = sub.get("layer") if isinstance(sub.get("layer"), str) else None
    rel = sub.get("merge_into") if isinstance(sub.get("merge_into"), str) else None
    if "layer" in sub and layer not in LAYERS:
        errors.append((1, "This layer or merge_into path is not allowed."))
        layer = None
    merge_path = None
    if rel:
        rel_norm = rel.replace("\\", "/")
        if rel_norm.startswith("/") or ".." in Path(rel_norm).parts:
            errors.append((1, "This layer or merge_into path is not allowed."))
            rel = None
        else:
            merge_path = (ROOT / rel_norm).resolve()
            try:
                merge_path.relative_to(ROOT)
            except ValueError:
                errors.append((1, "This layer or merge_into path is not allowed."))
                merge_path = None
                rel = None
    if layer and rel:
        if not allowed_merge(layer, rel.replace("\\", "/")):
            errors.append((1, "This layer or merge_into path is not allowed."))
        elif merge_path is not None and not merge_path.is_file():
            errors.append((8, "This submission adds a new file. Merge the record into an existing layer file."))
            merge_path = None

    manifest = ROOT / "grokme" / "lite-manifest.json"
    if not manifest.is_file():
        errors.append((9, "The checker could not read this file: grokme/lite-manifest.json."))
    else:
        try:
            man = json.loads(manifest.read_text(encoding="utf-8"))
            cap = int((man.get("limits") or {}).get("files") or 600)
            n = man.get("file_count")
            if n is None:
                n = len(man.get("files") or [])
            # merge into an existing listed or unlisted file does not add a path
            if merge_path is not None and merge_path.is_file() and n > cap:
                errors.append((8, f"The lite build would have {n} files; the cap is 600."))
        except (OSError, json.JSONDecodeError, TypeError, ValueError):
            errors.append((9, "The checker could not read this file: grokme/lite-manifest.json."))

    records = sub.get("records") if isinstance(sub.get("records"), list) else []
    for rec in records:
        keys: list[str] = []
        walk_keys(rec, keys)
        for name in keys:
            if privacy_hit(name):
                errors.append((7, f"This field is not allowed: {name} (no personal data or parcels)."))

    types, eras = set(), set()
    try:
        types, eras = load_schema()
    except OSError:
        errors.append((9, "The checker could not read this file: web/data/schema.js."))

    if layer and isinstance(records, list):
        rel_norm = (rel or "").replace("\\", "/")
        for rec in records:
            check_record_format(rec, layer, types, eras, errors)
            if layer == "regions" and isinstance(rec, dict) and rel:
                region_extra(rel_norm, rec, errors)
            check_coords(rec, layer, errors)
            if isinstance(rec, (dict, list)) and not rec_source(rec, layer, sub):
                errors.append((2, "This record is missing a primary source."))

        seen: set[str] = set()
        existing: set[str] = set()
        if merge_path is not None and merge_path.is_file():
            try:
                # An official layer file checked against itself is not a duplicate of its own records.
                if path.resolve() == merge_path:
                    existing = set()
                else:
                    existing = existing_keys(merge_path, layer)
            except OSError:
                errors.append((9, f"The checker could not read this file: {rel}."))
        for rec in records:
            key = rec_key(rec, layer)
            if not key:
                continue
            if key in seen or key in existing:
                errors.append((4, f"This id already exists: {key}."))
            seen.add(key)

    if not errors:
        return 0
    # unique messages, keep first occurrence, exit with lowest code
    shown = set()
    for code, msg in errors:
        if msg in shown:
            continue
        shown.add(msg)
        out(msg)
    return min(c for c, _ in errors)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
