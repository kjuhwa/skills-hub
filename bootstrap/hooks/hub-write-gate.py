#!/usr/bin/env python3
"""
skills-hub PreToolUse gate for Write/Edit/MultiEdit/NotebookEdit.

If `hub-suggest-hint.py` detected implementation intent earlier this turn and
created the PENDING flag at ~/.claude/skills-hub/state/hub_first_pending.flag,
this hook emits a blocking <system-reminder> before the first code-writing
tool call. The flag is cleared by `hub-search-clear.py` (PostToolUse) once a
hub search command actually runs.

Opt out at runtime: set SKILLS_HUB_NO_AUTO_SUGGEST=1 in the environment.
"""
import json
import os
import sys
from pathlib import Path

STATE_DIR = Path.home() / ".claude" / "skills-hub" / "state"
PENDING = STATE_DIR / "hub_first_pending.flag"

GATE = (
    "<system-reminder>\n"
    "STOP — skills-hub gate is engaged.\n"
    "Implementation intent was detected in the user's prompt, but no hub search "
    "(`hub-search`, `hub_search.py`, `/hub-find`, `/hub-install`) has been executed "
    "yet in this turn. DO NOT proceed with this Write/Edit/MultiEdit/NotebookEdit.\n"
    "Required action: run `hub-search <keyword>` (or `py -3 "
    "~/.claude/skills-hub/tools/hub_search.py <keyword>`) first, surface the top "
    "matches to the user, and THEN continue. Confirmation phrases like 'ok' or "
    "'proceed' do NOT waive this gate.\n"
    "Opt out with env var SKILLS_HUB_NO_AUTO_SUGGEST=1 only if the user explicitly "
    "asked to skip the hub.\n"
    "</system-reminder>"
)


def main() -> int:
    if os.environ.get("SKILLS_HUB_NO_AUTO_SUGGEST") == "1":
        return 0
    if not PENDING.exists():
        return 0
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    tool = data.get("tool_name", "") or ""
    if tool not in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        return 0
    sys.stdout.write(GATE + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
