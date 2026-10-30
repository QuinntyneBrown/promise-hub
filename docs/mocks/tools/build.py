"""Regenerate docs/mocks from the screen modules.

    python docs/mocks/tools/build.py            # writes pages/, dialogs/, notifications/, manifest.json
    python docs/mocks/tools/build.py --clean    # also removes files no longer in the manifest

Then run the skill's checker:
    python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
"""
from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from reg import SCREENS, Builder  # noqa: E402

MODULES = ["pages_core", "pages_ops", "pages_admin", "pages_onboarding", "pages_tenancy", "pages_guardian", "pages_participants", "pages_mentoring", "pages_consent", "pages_curriculum", "pages_learning", "pages_journey", "pages_reflection", "pages_checkins", "pages_flags", "pages_assign", "pages_schedule", "pages_attendance", "pages_applications", "pages_volunteer", "pages_guardian_portal", "pages_messaging", "pages_notifications", "pages_people", "pages_settings", "pages_organization", "pages_reports", "pages_website", "pages_learning_bond", "pages_learning_bond_guardian", "dialogs", "notifications"]
FOLDER = {"page": "pages", "dialog": "dialogs", "notification": "notifications"}


def main(argv: list[str]) -> int:
    only = [m for m in argv if not m.startswith("--")]
    for m in only or MODULES:
        try:
            importlib.import_module(m)
        except ModuleNotFoundError as e:
            if e.name == m:
                print(f"skip {m} (not written yet)")
            else:
                raise
    manifest = {"project": "PromiseHub", "required_states": {"page": ["default", "loading", "empty", "error"], "dialog": ["default", "busy", "invalid"], "notification": ["info", "success", "warning", "danger"]}, "screens": []}
    written = set()
    count = 0
    for meta in SCREENS:
        b = Builder(meta)
        meta["fn"](b)
        docs = b.render()
        folder = ROOT / FOLDER[meta["kind"]] / meta["id"]
        folder.mkdir(parents=True, exist_ok=True)
        for state, html in docs.items():
            p = folder / f"{state}.html"
            p.write_text(html, encoding="utf-8")
            written.add(p.resolve())
            count += 1
        entry = {"id": meta["id"], "kind": meta["kind"], "title": meta["title"]}
        if meta["route"]:
            entry["route"] = meta["route"]
        if meta["opens_from"]:
            entry["opens_from"] = meta["opens_from"]
        if meta["reqs"]:
            entry["requirements"] = meta["reqs"]
        entry["states"] = list(docs.keys())
        if meta["na"]:
            entry["not_applicable"] = meta["na"]
        manifest["screens"].append(entry)
    if "--clean" in argv:
        for kind in FOLDER.values():
            for p in (ROOT / kind).rglob("*.html"):
                if p.resolve() not in written:
                    print("remove", p.relative_to(ROOT))
                    p.unlink()
            for d in sorted((ROOT / kind).glob("*"), reverse=True):
                if d.is_dir() and not any(d.iterdir()):
                    d.rmdir()
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    pages = sum(1 for s in manifest["screens"] if s["kind"] == "page")
    dialogs = sum(1 for s in manifest["screens"] if s["kind"] == "dialog")
    notifs = sum(1 for s in manifest["screens"] if s["kind"] == "notification")
    print(f"{len(manifest['screens'])} screens ({pages} pages, {dialogs} dialogs, {notifs} notifications), {count} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
