#!/usr/bin/env python3
"""Build citations.json — a reverse-lookup index from atom → entries that cite it.

Walks every TECHNIQUE.md (composes[]) and PAPER.md (examines[] + proposed_builds[].requires[])
and produces a flat map:

  {
    "<kind>/<ref>": {
      "cited_by": [
        { "kind": "technique" | "paper", "ref": "<category>/<slug>", "role": "<short label>", "via": "composes" | "examines" | "requires" }
      ]
    },
    ...
  }

The output is consumed by `/hub-show` (and in future `/hub-find`) to surface "this atom
is cited by N entries" without re-walking the corpus on every command. Regenerated on
post-commit / post-merge via precheck.py the same way `index.json` is.

Idempotent: deterministic ordering, sorted keys, sorted citation lists.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

import yaml

HUB_ROOT = Path(__file__).resolve().parents[2]
PAPER_DIR = HUB_ROOT / "paper"
TECHNIQUE_DIR = HUB_ROOT / "technique"
OUTPUT = HUB_ROOT / "citations.json"


def split_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return ""
    end = text.find("\n---\n", 4)
    if end == -1:
        return ""
    return text[4 : end + 1]


def parse_frontmatter(text: str) -> dict:
    fm = split_frontmatter(text)
    if not fm:
        return {}
    try:
        return yaml.safe_load(fm) or {}
    except yaml.YAMLError:
        return {}


def normalize_key(kind: str, ref: str) -> str | None:
    if not kind or not ref:
        return None
    kind = kind.strip()
    ref = ref.strip()
    if kind not in ("skill", "knowledge", "technique", "paper"):
        return None
    return f"{kind}/{ref}"


OUTCOME_TO_KIND = {
    "produced_skill": "skill",
    "produced_knowledge": "knowledge",
    "produced_pitfall": "knowledge",   # pitfall is a knowledge subcategory
    "produced_technique": "technique",
    "updated_skill": "skill",
    "updated_knowledge": "knowledge",
    "updated_technique": "technique",
}


def collect_paper_citations(citations: dict, produced: dict) -> int:
    count = 0
    for paper_md in sorted(PAPER_DIR.glob("**/PAPER.md")):
        fm = parse_frontmatter(paper_md.read_text(encoding="utf-8"))
        rel = paper_md.relative_to(PAPER_DIR).parent.as_posix()
        source = {"kind": "paper", "ref": rel}
        for entry in fm.get("examines") or []:
            if not isinstance(entry, dict):
                continue
            key = normalize_key(entry.get("kind"), entry.get("ref"))
            if not key:
                continue
            citations[key].append({**source, "role": (entry.get("role") or "").strip(), "via": "examines"})
            count += 1
        for build in fm.get("proposed_builds") or []:
            if not isinstance(build, dict):
                continue
            for entry in build.get("requires") or []:
                if not isinstance(entry, dict):
                    continue
                key = normalize_key(entry.get("kind"), entry.get("ref"))
                if not key:
                    continue
                citations[key].append({
                    **source,
                    "role": (entry.get("role") or "").strip(),
                    "via": f"requires:{(build.get('slug') or '').strip()}",
                })
                count += 1
        # outcomes: build produced_by reverse map
        for outcome in fm.get("outcomes") or []:
            if not isinstance(outcome, dict):
                continue
            outcome_kind = (outcome.get("kind") or "").strip()
            target_ref = (outcome.get("ref") or "").strip()
            if not target_ref or outcome_kind not in OUTCOME_TO_KIND:
                continue
            atom_kind = OUTCOME_TO_KIND[outcome_kind]
            key = f"{atom_kind}/{target_ref}"
            produced[key].append({
                **source,
                "outcome_kind": outcome_kind,
            })
    return count


def collect_technique_citations(citations: dict) -> int:
    count = 0
    for tech_md in sorted(TECHNIQUE_DIR.glob("**/TECHNIQUE.md")):
        fm = parse_frontmatter(tech_md.read_text(encoding="utf-8"))
        rel = tech_md.relative_to(TECHNIQUE_DIR).parent.as_posix()
        source = {"kind": "technique", "ref": rel}
        for entry in fm.get("composes") or []:
            if not isinstance(entry, dict):
                continue
            key = normalize_key(entry.get("kind"), entry.get("ref"))
            if not key:
                continue
            citations[key].append({**source, "role": (entry.get("role") or "").strip(), "via": "composes"})
            count += 1
    return count


def build() -> dict:
    citations: dict[str, list] = defaultdict(list)
    produced: dict[str, list] = defaultdict(list)
    paper_count = collect_paper_citations(citations, produced)
    tech_count = collect_technique_citations(citations)

    # Merge cited_by + produced_by into a single per-atom record.
    all_keys = set(citations.keys()) | set(produced.keys())
    sorted_citations: dict[str, dict] = {}
    for key in sorted(all_keys):
        record: dict = {}
        if key in citations:
            record["cited_by"] = sorted(
                citations[key], key=lambda e: (e["kind"], e["ref"], e.get("via", ""))
            )
        if key in produced:
            record["produced_by"] = sorted(
                produced[key], key=lambda e: (e["kind"], e["ref"], e.get("outcome_kind", ""))
            )
        sorted_citations[key] = record

    return {
        "schema": 2,
        "totals": {
            "paper_citations": paper_count,
            "technique_citations": tech_count,
            "atoms_cited": sum(1 for v in sorted_citations.values() if "cited_by" in v),
            "atoms_produced": sum(1 for v in sorted_citations.values() if "produced_by" in v),
        },
        "citations": sorted_citations,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--output", default=str(OUTPUT), help="Output path (default: <repo>/citations.json)")
    p.add_argument("--print", action="store_true", help="Print to stdout instead of writing")
    args = p.parse_args()

    data = build()
    payload = json.dumps(data, indent=2, ensure_ascii=False, sort_keys=False)

    if args.print:
        print(payload)
    else:
        out = Path(args.output)
        out.write_text(payload + "\n", encoding="utf-8")
        print(
            f"Wrote {out.relative_to(HUB_ROOT) if out.is_relative_to(HUB_ROOT) else out} — "
            f"{data['totals']['atoms_cited']} atoms cited "
            f"({data['totals']['paper_citations']} paper refs + "
            f"{data['totals']['technique_citations']} technique refs); "
            f"{data['totals']['atoms_produced']} atoms produced by paper outcomes"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
