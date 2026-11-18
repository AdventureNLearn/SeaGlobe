#!/usr/bin/env python3
"""Fail if a StarFire record still has a handle in a URL, a long title, or first-person title text.

The credit line "StarFire by @wntrslmbr" is required and is not treated as a finding.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "web" / "data" / "next" / "starfire" / "starfire.json"
CREDIT = "StarFire by @wntrslmbr"
TITLE_MAX = 100

# Account path in a URL: x.com/<user>/status, twitter.com/<user>, any @handle path, mastodon /@
# x.com/i/status/<id> is the handle-free form and is allowed.
HANDLE_URL_RE = re.compile(
    r"https?://(?:www\.)?(?:x|twitter)\.com/(?!i(?:/|$))[^/\s\"'?#]+"
    r"|https?://[^\s\"']*mastodon\.[^\s\"']+/@"
    r"|https?://[^\s\"']+/@[A-Za-z0-9_.]+",
    re.I,
)

FIRST_PERSON_RE = re.compile(
    r"\b(I|I'm|I've|I'd|I'll|me|my|mine|we|we're|we've|we'd|we'll|our|ours)\b",
    re.I,
)


def urls_in(text: str) -> list[str]:
    return re.findall(r"https?://[^\s\"'<>]+", text)


def first_person(title: str) -> list[str]:
    hits = []
    t = title.replace("’", "'")
    for m in FIRST_PERSON_RE.finditer(t):
        if m.group(0).upper() in ("US", "UK"):
            continue
        hits.append(m.group(0))
    return hits


def walk_strings(obj, acc: list[str]) -> None:
    if isinstance(obj, str):
        acc.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            walk_strings(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_strings(v, acc)


def main() -> int:
    data = json.loads(PACK.read_text(encoding="utf-8"))
    errors: list[str] = []
    recs = [r for r in (data.get("records") or []) if isinstance(r, dict) and r.get("example") is not True]
    if data.get("credit") != CREDIT or data.get("citation") != CREDIT:
        errors.append(f"The credit line must stay exactly {CREDIT!r}.")
    for rec in recs:
        rid = rec.get("id") or "[missing id]"
        title = rec.get("title") or ""
        if len(title) > TITLE_MAX:
            errors.append(f"{rid}: title is {len(title)} characters (max {TITLE_MAX}): {title}")
        fp = first_person(title)
        if fp:
            errors.append(f"{rid}: first-person text in the title ({', '.join(fp)}): {title}")
        strings: list[str] = []
        walk_strings(rec, strings)
        for s in strings:
            if s == CREDIT:
                continue
            # Ignore the required credit when it appears as a label, not as a URL
            check = s.replace(CREDIT, " ")
            for url in urls_in(check):
                if HANDLE_URL_RE.search(url):
                    errors.append(f"{rid}: account handle in a URL: {url}")
    if errors:
        print("\n".join(errors))
        print(f"{len(errors)} StarFire privacy check(s) failed")
        return 1
    print(f"StarFire privacy checks passed ({len(recs)} records)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
