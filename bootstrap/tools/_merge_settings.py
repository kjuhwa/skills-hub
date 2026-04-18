#!/usr/bin/env python3
"""
Merge (or remove) skills-hub hook entries in ~/.claude/settings.json.

Idempotent: entries are tagged with a `_marker` field. Re-running install with
the same (hook-type, marker) pair cleanly replaces the old entry. The legacy
invocation (no flags) targets UserPromptSubmit with matcher "*" and marker
"skills-hub:auto-suggest-hook" so older install.sh versions keep working.

Usage:
  # Legacy default — UserPromptSubmit / "*" / auto-suggest marker.
  python _merge_settings.py install <settings.json> < command-on-stdin

  # Any hook type with explicit flags.
  python _merge_settings.py install \\
      --type PreToolUse \\
      --matcher "Write|Edit|MultiEdit|NotebookEdit" \\
      --marker skills-hub:write-gate-hook \\
      <settings.json> < command-on-stdin

  # Remove every skills-hub hook entry (all markers, all types).
  python _merge_settings.py uninstall <settings.json>

The install subcommand reads the hook command as a single line from stdin and
writes it verbatim into settings.json. Passing the command through stdin
avoids cross-shell argv quoting issues (Windows/PowerShell in particular
strips embedded quotes from arguments).
"""
import argparse
import json
import os
import sys

LEGACY_MARKER = "skills-hub:auto-suggest-hook"
ALL_MARKERS = {
    "skills-hub:auto-suggest-hook",
    "skills-hub:write-gate-hook",
    "skills-hub:search-clear-hook",
}
# Fallback substrings for pre-marker installs we still want to clean up.
LEGACY_SCRIPT_FRAGMENTS = (
    "hub-suggest-hint",
    "hub-write-gate",
    "hub-search-clear",
)


def _load(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError, ValueError):
        return {}


def _dump(path: str, obj: dict) -> None:
    parent = os.path.dirname(path)
    if parent and not os.path.isdir(parent):
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _group_has_marker(group: dict, marker: str) -> bool:
    """True if any hook in `group` carries the exact `_marker`, or if it is a
    pre-marker install referencing the corresponding hub script by basename.
    """
    script_for_marker = {
        "skills-hub:auto-suggest-hook": "hub-suggest-hint",
        "skills-hub:write-gate-hook": "hub-write-gate",
        "skills-hub:search-clear-hook": "hub-search-clear",
    }.get(marker)
    for h in group.get("hooks", []) or []:
        if not isinstance(h, dict):
            continue
        if h.get("_marker") == marker:
            return True
        cmd = h.get("command") or ""
        if script_for_marker and script_for_marker in cmd:
            return True
    return False


def _group_is_any_skills_hub(group: dict) -> bool:
    for h in group.get("hooks", []) or []:
        if not isinstance(h, dict):
            continue
        if h.get("_marker") in ALL_MARKERS:
            return True
        cmd = h.get("command") or ""
        if any(frag in cmd for frag in LEGACY_SCRIPT_FRAGMENTS):
            return True
    return False


def install(settings_path: str, hook_type: str, matcher: str, marker: str, command: str) -> int:
    settings = _load(settings_path)
    hooks = settings.setdefault("hooks", {})
    slot = hooks.setdefault(hook_type, [])
    if not isinstance(slot, list):
        slot = []
        hooks[hook_type] = slot
    slot[:] = [g for g in slot if isinstance(g, dict) and not _group_has_marker(g, marker)]
    slot.append({
        "matcher": matcher,
        "hooks": [{
            "type": "command",
            "command": command,
            "_marker": marker,
        }],
    })
    _dump(settings_path, settings)
    return 0


def uninstall(settings_path: str) -> int:
    if not os.path.exists(settings_path):
        return 0
    settings = _load(settings_path)
    hooks = settings.get("hooks")
    if not isinstance(hooks, dict):
        return 0
    changed = False
    for hook_type in list(hooks.keys()):
        slot = hooks.get(hook_type)
        if not isinstance(slot, list):
            continue
        before = len(slot)
        slot[:] = [g for g in slot if isinstance(g, dict) and not _group_is_any_skills_hub(g)]
        if len(slot) != before:
            changed = True
        if not slot:
            hooks.pop(hook_type, None)
            changed = True
    if not hooks:
        settings.pop("hooks", None)
        changed = True
    if changed:
        _dump(settings_path, settings)
    return 0


def _parse_install(argv: list) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="_merge_settings.py install", add_help=False)
    parser.add_argument("--type", dest="hook_type", default="UserPromptSubmit")
    parser.add_argument("--matcher", dest="matcher", default="*")
    parser.add_argument("--marker", dest="marker", default=LEGACY_MARKER)
    parser.add_argument("settings_path")
    return parser.parse_args(argv)


def main(argv: list) -> int:
    if len(argv) >= 2 and argv[1] == "install":
        try:
            args = _parse_install(argv[2:])
        except SystemExit:
            return 2
        command = sys.stdin.read().strip()
        if not command:
            sys.stderr.write("install: empty command on stdin\n")
            return 2
        return install(args.settings_path, args.hook_type, args.matcher, args.marker, command)
    if len(argv) >= 3 and argv[1] == "uninstall":
        return uninstall(argv[2])
    sys.stderr.write(
        "usage: _merge_settings.py install [--type T] [--matcher M] [--marker K] "
        "<settings.json> < command-on-stdin\n"
        "       _merge_settings.py uninstall <settings.json>\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
