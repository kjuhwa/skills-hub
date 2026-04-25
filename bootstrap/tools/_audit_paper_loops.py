#!/usr/bin/env python3
"""Per-paper loop-health audit. Surfaces papers stuck in draft with planned experiments past a stale threshold.

For each PAPER.md, reports:
  - slug, category
  - type (hypothesis | survey | position)
  - status (draft | reviewed | implemented | retracted)
  - experiments by state: planned / running / completed / abandoned
  - outcomes count
  - first-commit age in days (git log --diff-filter=A --reverse --format=%aI)
  - cited_by count (consults citations.json)
  - stale flag — true when type=hypothesis AND status in {draft, reviewed} AND age >= --stale-days AND any experiment.status in {planned, running}

Stale = "you can close this loop and you haven't yet". The §11 retraction signal fires
when ≥5 papers carry empty experiments + outcomes; --stale fires earlier and per-paper
to invite action before the layer-level signal pressure builds.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import yaml

HUB_ROOT = Path(__file__).resolve().parents[2]
PAPER_DIR = HUB_ROOT / "paper"
CITATIONS = HUB_ROOT / "citations.json"


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


def first_commit_iso(path: Path) -> str | None:
    try:
        out = subprocess.run(
            ["git", "-C", str(HUB_ROOT), "log", "--diff-filter=A", "--reverse",
             "--format=%aI", str(path.relative_to(HUB_ROOT).as_posix())],
            check=True, capture_output=True, text=True,
        ).stdout.strip().splitlines()
        return out[0] if out else None
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def days_since(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - dt
        return delta.days
    except ValueError:
        return None


def load_citations_count() -> dict[str, int]:
    if not CITATIONS.exists():
        return {}
    try:
        data = json.loads(CITATIONS.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return {k: len(v.get("cited_by", [])) for k, v in (data.get("citations") or {}).items()}


def audit_paper(path: Path, citations: dict[str, int], stale_days: int) -> dict:
    fm = parse_frontmatter(path.read_text(encoding="utf-8"))
    rel_to_paper_dir = path.relative_to(PAPER_DIR).parent.as_posix()
    paper_key = f"paper/{rel_to_paper_dir}"

    type_ = (fm.get("type") or "hypothesis").strip()
    status = (fm.get("status") or "").strip()
    experiments = fm.get("experiments") or []
    exp_status = Counter()
    for e in experiments:
        if isinstance(e, dict):
            exp_status[(e.get("status") or "unknown").strip()] += 1
    outcomes = fm.get("outcomes") or []

    age = days_since(first_commit_iso(path))
    cited_by = citations.get(paper_key, 0)

    # Stale rule: type=hypothesis + status not yet implemented + has at least one planned/running + age >= threshold
    stale = (
        type_ == "hypothesis"
        and status in ("draft", "reviewed")
        and (exp_status.get("planned", 0) + exp_status.get("running", 0)) > 0
        and age is not None
        and age >= stale_days
    )

    return {
        "slug": rel_to_paper_dir,
        "category": (fm.get("category") or "").strip(),
        "name": (fm.get("name") or "").strip(),
        "description": (fm.get("description") or "").strip(),
        "type": type_,
        "status": status,
        "experiments": dict(exp_status),
        "outcomes_count": len(outcomes),
        "age_days": age,
        "cited_by": cited_by,
        "stale": stale,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--stale-days", type=int, default=30, help="Stale threshold in days (default 30)")
    p.add_argument("--only-stale", action="store_true", help="Only emit stale papers")
    p.add_argument("--json", action="store_true", help="Emit JSON instead of human table")
    args = p.parse_args()

    citations = load_citations_count()
    rows = [audit_paper(p_, citations, args.stale_days) for p_ in sorted(PAPER_DIR.glob("**/PAPER.md"))]
    if args.only_stale:
        rows = [r for r in rows if r["stale"]]

    if args.json:
        print(json.dumps({"stale_threshold_days": args.stale_days, "papers": rows}, indent=2, ensure_ascii=False))
        return 0

    if not rows:
        if args.only_stale:
            print(f"No papers stale past {args.stale_days} days. Loop pressure is clean.")
        else:
            print("No papers found.")
        return 0

    # Human table
    headers = ["STALE", "AGE", "TYPE", "STATUS", "EXP", "OUT", "CITED", "SLUG"]
    print(f"{'STALE':<6} {'AGE':>5} {'TYPE':<10} {'STATUS':<12} {'EXP':<24} {'OUT':>4} {'CITED':>5}  SLUG")
    for r in rows:
        flag = "!" if r["stale"] else " "
        age = "-" if r["age_days"] is None else f"{r['age_days']}d"
        exp_summary = " ".join(f"{k}={v}" for k, v in sorted(r["experiments"].items())) or "—"
        print(
            f"{flag:<6} {age:>5} {r['type']:<10} {r['status']:<12} {exp_summary[:24]:<24} "
            f"{r['outcomes_count']:>4} {r['cited_by']:>5}  {r['slug']}"
        )

    stale_n = sum(1 for r in rows if r["stale"])
    total = len(rows)
    if stale_n:
        print(f"\n{stale_n}/{total} stale (≥{args.stale_days}d, hypothesis with planned/running experiments).")
        print("Action: /hub-paper-experiment-run <slug> to close the loop.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
