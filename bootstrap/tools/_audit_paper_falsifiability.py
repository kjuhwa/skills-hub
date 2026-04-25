#!/usr/bin/env python3
"""Heuristic falsifiability advisory for paper.premise.then strings.

A `type: hypothesis` paper's value depends on the premise being *checkable* — capable
of being supported, refined, or refuted by an experiment. A premise that says "X is
good" cannot be tested. A premise that says "X drops latency by ≥30% past N=4 calls"
can be tested.

This tool runs three signal detectors over each paper's `premise.then` and emits an
advisory WARN when none of them fire. It is intentionally heuristic — false positives
(papers that are falsifiable but use unusual language) and false negatives (papers
that have a numeric threshold for a vacuous claim) are both possible. The advisory
is meant to *invite* a sharper rewrite, not to gate publication.

Signals (any 1+ match → falsifiable):

  A. Comparison operators (≥, ≤, <, >, =, ≈, ~, ±) or comparison phrases
     ('at least', 'exceeds', 'falls below', 'under <num>', 'over <num>')
  B. Numeric thresholds (\\d+ followed by %, percent, x, σ, units, or N=)
  C. Functional-form vocabulary (linearly / exponentially / power-law / saturat /
     superlinearly / logarithmically / polynomially)

Survey and position papers are exempt by default — their premises are not
prediction-shaped. Pass --include-survey-position to audit them anyway.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

HUB_ROOT = Path(__file__).resolve().parents[2]
PAPER_DIR = HUB_ROOT / "paper"

COMPARISON_RE = re.compile(
    r"[≥≤><=≈~±]"                                         # operators
    r"|\bat least\b|\bat most\b"                          # phrases
    r"|\bexceeds?\b|\bfalls? below\b"
    r"|\bunder \d|\bover \d"
    r"|\bbelow \d|\babove \d",
    re.IGNORECASE,
)

THRESHOLD_RE = re.compile(
    r"\d+\s*(?:%|percent|x|σ|files?|months?|days?|seconds?|ms|hours?|N=|years?)",
    re.IGNORECASE,
)

FUNCTIONAL_FORM_RE = re.compile(
    r"\b(?:linearly|logarithmically|exponentially|polynomially|"
    r"power[- ]law|superlinearly|sublinearly|saturat\w+|"
    r"plateau\w*|inverts?|crossover)\b",
    re.IGNORECASE,
)


def split_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return ""
    end = text.find("\n---\n", 4)
    if end == -1:
        return ""
    return text[4 : end + 1]


def parse_frontmatter(path: Path) -> dict | None:
    fm = split_frontmatter(path.read_text(encoding="utf-8"))
    if not fm:
        return None
    try:
        return yaml.safe_load(fm) or {}
    except yaml.YAMLError:
        return None


def detect_signals(text: str) -> list[str]:
    signals: list[str] = []
    if COMPARISON_RE.search(text):
        signals.append("comparison")
    if THRESHOLD_RE.search(text):
        signals.append("threshold")
    if FUNCTIONAL_FORM_RE.search(text):
        signals.append("functional-form")
    return signals


def audit_paper(path: Path, include_survey_position: bool) -> dict | None:
    fm = parse_frontmatter(path)
    if fm is None:
        return {
            "slug": path.relative_to(PAPER_DIR).parent.as_posix(),
            "skipped": "yaml-parse-error",
        }
    paper_type = (fm.get("type") or "hypothesis").strip()
    if paper_type != "hypothesis" and not include_survey_position:
        return None  # exempt
    then = (fm.get("premise") or {}).get("then") or ""
    if isinstance(then, list):
        then = " ".join(str(x) for x in then)
    signals = detect_signals(str(then))
    return {
        "slug": path.relative_to(PAPER_DIR).parent.as_posix(),
        "type": paper_type,
        "signals": signals,
        "falsifiable": bool(signals),
        "then_excerpt": str(then)[:140] + ("…" if len(str(then)) > 140 else ""),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--include-survey-position", action="store_true",
                   help="Audit survey and position papers too (default: hypothesis only)")
    p.add_argument("--only-flagged", action="store_true",
                   help="Print only papers that triggered the advisory")
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    rows = []
    for paper_md in sorted(PAPER_DIR.glob("**/PAPER.md")):
        result = audit_paper(paper_md, args.include_survey_position)
        if result is not None:
            rows.append(result)

    flagged = [r for r in rows if not r.get("falsifiable") and "skipped" not in r]
    if args.only_flagged:
        rows = flagged

    if args.json:
        print(json.dumps({
            "summary": {
                "audited": len(rows),
                "flagged": len(flagged),
                "skipped": sum(1 for r in rows if "skipped" in r),
            },
            "rows": rows,
        }, indent=2, ensure_ascii=False))
        return 0

    if not rows:
        print("No papers in scope.")
        return 0

    for r in rows:
        if "skipped" in r:
            print(f"[skip ] {r['slug']} — {r['skipped']}")
            continue
        flag = "  ! " if not r["falsifiable"] else "    "
        sig = ",".join(r["signals"]) if r["signals"] else "(none)"
        print(f"{flag}{r['type']:<10} {sig:<24} {r['slug']}")
        if not r["falsifiable"]:
            print(f"        then: {r['then_excerpt']}")

    if flagged:
        print(
            f"\n{len(flagged)} paper(s) triggered the falsifiability advisory. "
            "premise.then has no numeric threshold, comparison operator, or functional-form vocabulary. "
            "Consider rewriting to add a measurable predicate the experiment can check."
        )
    else:
        print(f"\nAll {len(rows)} hypothesis paper(s) carry at least one falsifiability signal.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
