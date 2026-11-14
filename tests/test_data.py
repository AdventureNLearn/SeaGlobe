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
