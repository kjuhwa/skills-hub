#!/usr/bin/env python3
"""
skills-hub PostToolUse flag-clearer.

Runs after Bash / Skill / ToolSearch tool calls. If the executed tool was a
hub search (Bash invoking hub-search/hub_search.py/hub-find/hub-install, or
the Skill tool invoking a hub-* skill), the PENDING flag created by
`hub-suggest-hint.py` is deleted so `hub-write-gate.py` stops blocking
subsequent Write/Edit calls.
"""
import json
import re
import sys
from pathlib import Path

STATE_DIR = Path.home() / ".claude" / "skills-hub" / "state"
PENDING = STATE_DIR / "hub_first_pending.flag"

BASH_RE = re.compile(r"hub[_-]search|/hub-find|/hub-install|/hub-list|hub-find\b", re.IGNORECASE)


def matches_hub_search(data: dict) -> bool:
    tool = (data.get("tool_name") or "").strip()
    inp = data.get("tool_input") or {}
    if tool == "Bash":
        cmd = inp.get("command") or ""
        return bool(BASH_RE.search(cmd))
    if tool == "Skill":
        skill = (inp.get("skill") or "").strip()
        args = (inp.get("args") or "").strip()
        if skill.startswith("hub-") or skill in {
            "hub-find",
            "hub-install",
            "hub-list",
            "hub-search-skills",
            "hub-search-knowledge",
        }:
            return True
        if args and BASH_RE.search(args):
            return True
    if tool == "ToolSearch":
        q = (inp.get("query") or "").strip()
        if BASH_RE.search(q):
            return True
    return False


def main() -> int:
    if not PENDING.exists():
        return 0
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    if matches_hub_search(data):
        try:
            PENDING.unlink()
        except FileNotFoundError:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
