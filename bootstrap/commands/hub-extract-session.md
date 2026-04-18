---
description: Extract reusable skills and knowledge from the current session's changes and conversation
argument-hint: [<keyword>] [--only=skills|knowledge] [--since=<ref>] [--include-conversation] [--min-confidence=high|medium|low] [--dry-run]
---

> **Note (since v2.6.0):** `/hub-extract --session` is the canonical entry. This command remains as a compatibility alias — same behaviour, same flags.


# /hub-extract-session $ARGUMENTS

Narrow-scope extraction: only what happened in **this session**. Produces both skill and knowledge drafts, same as `/hub-extract` but focused on recent activity.

Use this at the end of a work session to capture reusable patterns and lessons learned before they fade from context.

## Keyword mode

If a bare positional argument is given (e.g. `/hub-extract-session websocket`):
- Focus extraction on session activity related to that keyword's domain.
- Prioritize code changes, conversation threads, and workarounds that match the keyword.

No keyword → extract everything from this session, no bias.

## Steps

### 1. Determine session scope

- Default: `git diff --name-only HEAD` + uncommitted changes (`git status --porcelain`).
- `--since=<ref>`: use `git diff --name-only <ref>..HEAD` instead.
- If not a git repo: use files modified within the last 6 hours (mtime).

### 2. Context signals

- Recent commits: `git log --oneline --since="6 hours ago"` (or `$REF..HEAD`).
- `git log --grep="decision\|because\|workaround\|FIXME"` within scope → knowledge seeds.
- Current session's conversation is already in context — analyze it directly for:
  - User corrections / feedback patterns → **knowledge** (pitfall/decision)
  - Problems that took multiple iterations → **knowledge** (pitfall)
  - New tool usage or novel combinations → **skill**
  - Workarounds discovered → **skill** or **knowledge** depending on generalizability
- `--include-conversation` flag: also mine the conversation transcript for **workflow skills** and **decision knowledge** (not just code changes).

### 3. Classify

Same classification schema as `/hub-extract`:

```json
{
  "verdict": "skill" | "knowledge" | "both" | "drop",
  "confidence": "high" | "medium" | "low",
  ...
}
```

Session-specific classification rules:
- Procedure discovered through trial and error → **skill** (high value — hard-won knowledge)
- "Don't do X because Y" learned in this session → **knowledge** (pitfall)
- Decision made with rationale → **knowledge** (decision)
- One-off debugging step unlikely to recur → **drop**
- `--only=skills`: skip knowledge track. `--only=knowledge`: skip skill track.

### 4. Draft

- Skill drafts → `.skills-draft/session-<YYYYMMDD-HHMM>/<category>/<slug>/`
- Knowledge drafts → `.knowledge-draft/session-<YYYYMMDD-HHMM>/<category>/<slug>.md`
- Session timestamp prefix avoids collision with full-project (`/hub-extract`) drafts.
- For `both` verdicts: write both files with bidirectional links.

### 5. Preview + persist

Same interactive preview as `/hub-extract` (table with select/toggle). `--dry-run` stops after preview.

### 6. Report

```
Drafted (session 2026-04-16 14:30):
  skills:     2 in .skills-draft/session-20260416-1430/
  knowledge:  1 in .knowledge-draft/session-20260416-1430/
Dropped:      3 (one-off / low-confidence)

Next:
  • Review → /hub-publish-all
```

## Rules

- Keep tight focus: fewer, higher-quality drafts > many generic ones.
- Session extraction favors **workflow/process skills** and **pitfall/decision knowledge** — full-project extraction (`/hub-extract`) favors code patterns and architectural knowledge.
- Sanitize identically to `/hub-extract`.
- Never auto-commit or push.
- `--min-confidence` default `medium`. Low-confidence items only with explicit `--min-confidence=low`.
