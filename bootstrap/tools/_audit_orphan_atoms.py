#!/usr/bin/env python3
"""Find orphan atoms — skills and knowledge entries that are not cited by any technique or paper.

A "0-citation" atom is the empirical signal that `paper/arch/technique-layer-roi-after-100-pilots`
predicts will dominate the corpus (≥80% under-cited). This tool produces the actual measurement,
turning a hypothesis into observable data:

  - Reads citations.json (built by _build_citations_index.py)
  - Walks skills/ + knowledge/ trees and computes the complement
  - Reports orphan counts grouped by category, with optional per-entry listing

Output formats:
  - Default human table (counts per category + summary)
  - --list      append every orphan ref grouped by category
  - --json      machine-readable for downstream tooling
  - --kind=skill | knowledge   restrict scope
  - --category=<cat>           restrict to one category
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

HUB_ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = HUB_ROOT / "skills"
KNOWLEDGE_DIR = HUB_ROOT / "knowledge"
CITATIONS = HUB_ROOT / "citations.json"


def load_cited_keys() -> set[str]:
    if not CITATIONS.exists():
        print("citations.json missing — run _build_citations_index.py first.", file=sys.stderr)
        return set()
    try:
        data = json.loads(CITATIONS.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Failed to read citations.json: {e}", file=sys.stderr)
        return set()
    return set(data.get("citations", {}).keys())


def walk_skills() -> list[tuple[str, str, str]]:
    """Return [(kind=skill, ref=<category>/<name>, category)]."""
    results = []
    for skill_md in sorted(SKILLS_DIR.glob("**/SKILL.md")):
        rel = skill_md.relative_to(SKILLS_DIR).parent.as_posix()
        if "/" in rel:
            category = rel.split("/", 1)[0]
        else:
            category = rel
        results.append(("skill", rel, category))
    return results


def walk_knowledge() -> list[tuple[str, str, str]]:
    """Return [(kind=knowledge, ref=<category>/<slug>, category)]."""
    results = []
    for k_md in sorted(KNOWLEDGE_DIR.glob("**/*.md")):
        # Skip files outside category subdirs
        rel = k_md.relative_to(KNOWLEDGE_DIR).as_posix()
        # Strip ".md"
        if rel.endswith(".md"):
            rel = rel[:-3]
        # Skip top-level files (need a category folder)
        if "/" not in rel:
            continue
        # Skip "external" — those are imports, not first-party knowledge
        if rel.startswith("external/"):
            continue
        category = rel.split("/", 1)[0]
        results.append(("knowledge", rel, category))
    return results


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--kind", choices=["skill", "knowledge"], help="Restrict scope")
    p.add_argument("--category", help="Restrict to one category")
    p.add_argument("--list", action="store_true", help="Print every orphan ref")
    p.add_argument("--json", action="store_true", help="Emit JSON")
    args = p.parse_args()

    cited = load_cited_keys()
    if not cited:
        return 1

    atoms: list[tuple[str, str, str]] = []
    if args.kind != "knowledge":
        atoms.extend(walk_skills())
    if args.kind != "skill":
        atoms.extend(walk_knowledge())
    if args.category:
        atoms = [a for a in atoms if a[2] == args.category]

    by_cat: dict[str, dict] = defaultdict(lambda: {"total": 0, "orphans": [], "cited": 0})
    for kind, ref, category in atoms:
        key = f"{kind}/{ref}"
        bucket = by_cat[f"{kind}:{category}"]
        bucket["total"] += 1
        if key in cited:
            bucket["cited"] += 1
        else:
            bucket["orphans"].append(ref)

    total_atoms = sum(b["total"] for b in by_cat.values())
    total_orphan = sum(len(b["orphans"]) for b in by_cat.values())
    total_cited = total_atoms - total_orphan
    pct = (total_orphan / total_atoms * 100) if total_atoms else 0

    if args.json:
        out = {
            "summary": {
                "total_atoms": total_atoms,
                "cited": total_cited,
                "orphans": total_orphan,
                "orphan_pct": round(pct, 1),
            },
            "by_category": {k: {"total": v["total"], "cited": v["cited"], "orphans": len(v["orphans"]),
                               "orphan_refs": sorted(v["orphans"])} for k, v in sorted(by_cat.items())},
        }
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return 0

    print(f"{'KIND:CATEGORY':<32} {'TOTAL':>6} {'CITED':>6} {'ORPHAN':>7} {'%':>6}")
    for key in sorted(by_cat.keys()):
        b = by_cat[key]
        orphan_n = len(b["orphans"])
        orphan_pct = (orphan_n / b["total"] * 100) if b["total"] else 0
        print(f"{key:<32} {b['total']:>6} {b['cited']:>6} {orphan_n:>7} {orphan_pct:>5.1f}%")

    print(f"\n{'TOTAL':<32} {total_atoms:>6} {total_cited:>6} {total_orphan:>7} {pct:>5.1f}%")

    # Empirical signal commentary
    if total_atoms >= 100 and pct >= 80:
        print(
            "\n[hypothesis support] paper/arch/technique-layer-roi-after-100-pilots predicts "
            ">=80% orphan rate at scale; observed = {:.1f}%.".format(pct)
        )
    elif total_atoms >= 100:
        print(
            "\n[hypothesis status] paper/arch/technique-layer-roi-after-100-pilots predicts "
            ">=80% orphan; observed = {:.1f}%. Threshold not yet reached.".format(pct)
        )

    if args.list:
        print("\nOrphan list:")
        for key in sorted(by_cat.keys()):
            orphans = by_cat[key]["orphans"]
            if not orphans:
                continue
            print(f"\n# {key}")
            for ref in sorted(orphans):
                print(f"  {ref}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
