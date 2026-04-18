---
description: List locally installed knowledge entries from the hub registry
argument-hint: [--category <cat>] [--tag <tag>] [--linked-to <skill>] [--orphans] [--scope global|project]
---

> **Note (since v2.6.0):** `/hub-list --kind knowledge` is the canonical entry. This command remains as a compatibility alias — same behaviour, same flags.


# /hub-list-knowledge $ARGUMENTS

Report knowledge artifacts (non-executable facts/decisions/pitfalls) registered alongside skills.

## Steps

1. Read `~/.claude/skills-hub/registry.json`. If missing or `version < 2`, note and fall back to filesystem scan only.
2. Scan filesystem:
   - Global: `~/.claude/skills-hub/knowledge/<category>/*.md`
   - Project: `.claude/knowledge/<category>/*.md` (if present in cwd)
3. Cross-reference registry vs filesystem:
   - **Tracked + present**: normal row.
   - **Tracked + missing**: `[ORPHAN REGISTRY]` — offer removal.
   - **Untracked + present**: `[UNTRACKED]` — may be manual or pre-hub.
4. Apply filters (`--category`, `--tag`, `--linked-to <skill-slug>`, `--orphans`, `--scope`).
5. Render grouped by scope → category:

```
GLOBAL
  api/
    oauth-token-refresh-strategy   conf=medium  linked=[oauth-setup]        2026-04-15
  pitfall/
    springdoc-opid-collision       conf=high    linked=[swagger-ai-opt...]  2026-04-15
  arch/
    git-tag-registry-versioning    conf=high    linked=[]                   2026-04-15

PROJECT
  (none)

ORPHANS
  (none)
```

## Rules

- Read-only unless user approves orphan cleanup.
- If a knowledge file lacks frontmatter `type: knowledge`, flag as `[MALFORMED]`.
- Respect `--linked-to` by reading each entry's `linked_skills`.
