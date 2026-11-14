"""Data and hygiene tests. Run: python -m unittest discover tests"""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
FAM = WEB / "data" / "routes"
RUNTIME = [p for p in WEB.rglob("*") if p.suffix in {".js", ".css", ".html"} and "vendor" not in p.parts]
SHAREABLE = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix in {".md", ".js", ".mjs", ".py", ".css", ".html", ".json", ".cmd", ".txt"}
             and not any(x in p.parts for x in ("raw", "das", "__pycache__", "node_modules", "vendor", ".git"))
             and p.name != "pangaea-750354.metadata.json"]  # excluded from the repo (.gitignore); redacted copy is shipped


class DataFiles(unittest.TestCase):
    def test_js_copy_matches_json(self):
        files = sorted(FAM.glob("*.json"))
        self.assertGreaterEqual(len(files), 20)
        for f in files:
            js = f.with_suffix(".js").read_text(encoding="utf-8")
            body = js[js.index("= {") + 2: js.rstrip().rstrip(";").rfind("}") + 1]
            self.assertEqual(json.loads(body), json.loads(f.read_text(encoding="utf-8")), f.name)

    def test_index_lists_every_family(self):
        idx = (FAM / "index.js").read_text(encoding="utf-8")
        for f in FAM.glob("*.json"):
            self.assertIn(f"data/routes/{f.stem}.js", idx)

    def test_records_have_citations_and_flags(self):
        n = 0
        for f in FAM.glob("*.json"):
            for r in json.loads(f.read_text(encoding="utf-8"))["routes"]:
                n += 1
                self.assertIsInstance(r["reconstruction"], bool, r["id"])
                self.assertTrue(r["citations"], r["id"])
                self.assertIn(r["confidence_level"], {"high", "medium", "low"}, r["id"])
        self.assertGreaterEqual(n, 60)

    def _ok_text(self, t, where):
        self.assertIsInstance(t, str, where)
        self.assertTrue(len(t.strip()) >= 40 or "[UNKNOWN]" in t, f"{where}: too short and not marked [UNKNOWN]")

    def _ok_entry(self, e, where):
        for k in ("history", "story"):
            self._ok_text(e.get(k), f"{where}.{k}")
        cites = e.get("content_citations")
        self.assertTrue(cites and all(isinstance(c, str) and len(c) > 10 for c in cites), f"{where}: needs at least one citation")
        for k, v in (e.get("facts") or {}).items():
            self.assertTrue(str(v).strip(), f"{where}.facts.{k} empty (use [UNKNOWN])")

    def test_every_route_has_history_story_and_citations(self):
        n = 0
        for f in FAM.glob("*.json"):
            for r in json.loads(f.read_text(encoding="utf-8"))["routes"]:
                n += 1
                self._ok_entry(r, r["id"])
                self.assertIsInstance(r.get("facts"), dict, r["id"])
        self.assertGreaterEqual(n, 69)

    def test_every_named_vessel_has_history_story_and_citations(self):
        n = 0
        for f in FAM.glob("*.json"):
            for r in json.loads(f.read_text(encoding="utf-8"))["routes"]:
                for v in r["schedule"].get("voyages", []):
                    if v.get("ship"):
                        n += 1
                        self.assertIn("vessel", v, f"{r['id']}/{v['id']} ({v['ship']}) has no vessel entry")
                        self._ok_entry(v["vessel"], f"{r['id']}/{v['id']}")
                        self.assertTrue(v["vessel"].get("name") and v["vessel"].get("facts"), v["id"])
        self.assertGreaterEqual(n, 9)

    def test_every_vehicle_type_has_history_story_and_citations(self):
        schema = (WEB / "data" / "schema.js").read_text(encoding="utf-8")
        block = schema[schema.index("vehicles:"):]
        ids = re.findall(r'\{ id: "([a-z-]+)"', block)
        self.assertGreaterEqual(len(ids), 26)
        js = (WEB / "data" / "content.js").read_text(encoding="utf-8")
        info = json.loads(js[js.index("= {") + 2: js.rstrip().rstrip(";").rfind("}") + 1])
        for i in ids:
            self.assertIn(i, info, f"vehicle type {i} has no content")
            self._ok_entry(info[i], f"vehicle {i}")
        for f in FAM.glob("*.json"):
            for r in json.loads(f.read_text(encoding="utf-8"))["routes"]:
                self.assertIn(r["vehicle"], info, r["id"])

    def test_sources_md_covers_every_record(self):
        src = (ROOT / "SOURCES.md").read_text(encoding="utf-8")
        for f in FAM.glob("*.json"):
            for r in json.loads(f.read_text(encoding="utf-8"))["routes"]:
                self.assertIn(f"`{r['id']}`", src)


class Hygiene(unittest.TestCase):
    HOME = re.compile(r"(C:\\Users\\[A-Za-z]|/home/[a-z]|/Users/[A-Za-z]|" + "/work" + "space/)")
    EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
    SECRET = re.compile(r"(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}", re.I)

    def test_no_home_paths_emails_or_secrets(self):
        for p in SHAREABLE:
            if p.name == "test_data.py":
                continue
            t = p.read_text(encoding="utf-8", errors="ignore")
            self.assertIsNone(self.HOME.search(t), f"home path in {p.relative_to(ROOT)}")
            m = self.EMAIL.search(t)
            self.assertIsNone(m, f"email-like text in {p.relative_to(ROOT)}: {m and m.group(0)}")
            self.assertIsNone(self.SECRET.search(t), f"secret-like text in {p.relative_to(ROOT)}")

    def test_runtime_code_fetches_nothing_remote(self):
        # Only the Go-deeper links (data/deeper.js) and citation strings may contain URLs; code must not fetch them.
        for p in RUNTIME:
            t = p.read_text(encoding="utf-8", errors="ignore")
            if p.name in {"deeper.js", "texture.js"} or p.parent == FAM:
                continue
            for m in re.finditer(r"(src|href)\s*=\s*['\"](https?:)?//", t):
                self.fail(f"remote src/href in {p.relative_to(ROOT)}")
            self.assertNotRegex(t, r"fetch\(\s*['\"]https?://", p.name)
            self.assertNotRegex(t, r"@import\s+url\(\s*['\"]?https?://", p.name)

    def test_no_large_files(self):
        for p in WEB.rglob("*"):
            if p.is_file():
                self.assertLess(p.stat().st_size, 50 * 1024 * 1024, p.name)


if __name__ == "__main__":
    unittest.main()
