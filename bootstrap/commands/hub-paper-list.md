---
description: List locally drafted and installed papers, grouped by status (v0.2 adds type column)
argument-hint: [--status draft|reviewed|implemented|retracted] [--type hypothesis|survey|position] [--category <cat>] [--drafts-only | --installed-only]
---

# /hub-paper-list $ARGUMENTS

Report papers (hypothesis-driven analyses) present on disk:

- **Installed**: `~/.claude/papers/<category>/<slug>/PAPER.md`
- **Drafts**: `./.paper-draft/<category>/<slug>/PAPER.md` (project-local)

## Steps

1. Parse args. Default: list both drafts and installed, all statuses, all types.
2. Scan the two roots for `**/PAPER.md`.
3. For each file, read frontmatter: `name`, `version`, `category`, `type`, `status`, `description`, `examines[]` count, `perspectives[]` count, `experiments[]` count (with sub-status breakdown), `outcomes[]` count, `proposed_builds[]` count.
4. Cross-reference `~/.claude/skills-hub/registry.json` → `papers` section:
   - Present + tracked → normal row
   - Present + untracked → `[UNTRACKED]`
   - Tracked + missing → `[ORPHAN REGISTRY]` (offer removal)
5. Apply filters (`--status`, `--type`, `--category`, `--drafts-only`, `--installed-only`).
6. Render stable text table, grouped by status (retracted last):
   ```
   STATE    | STATUS       | TYPE       | CATEGORY | NAME                          | EXAMINES | EXP(c/p) | OUT | BUILDS
   draft    | draft        | hypothesis | workflow | technique-layer-composition-value | 4     | 0/0      | 2   | 3
   install  | implemented  | hypothesis | workflow | parallel-dispatch-breakeven-point | 4     | 1/0      | 2   | 3
   install  | retracted    | position   | ai       | agent-chain-composability     | 1        | 0/0      | 0   | 0
   ```
   Legend: `EXP(c/p)` = experiments completed / planned; `OUT` = outcomes count; `BUILDS` = proposed_builds count.
7. Annotations:
   - Empty `external_refs[]` → append `(internal-only)` in NAME column
   - Empty `proposed_builds[]` → append `(pure-analysis)`
   - `type=position` with empty `experiments[]` and empty `outcomes[]` → append `(opinion-only)` — elevated flag under v0.2 retraction criterion
8. Trailing summary: `<N> drafts, <M> installed (<d> draft, <r> reviewed, <i> implemented, <ret> retracted; <h> hypothesis, <s> survey, <p> position)`.

## v0.2 retraction-criterion signal

At the end of list output, if total papers ≥ 5 AND ≥ 60% have both `experiments[]` empty AND `outcomes[]` empty, emit a warning:

```
⚠  Paper-layer empty-loop signal: <X>/<Y> papers have empty experiments AND outcomes.
   Schema §11 retraction threshold is 60% at N≥5 papers. Currently at <pct>%.
```

This is the canonical spot for the schema §11 check — `/hub-paper-list` sees all papers at once.

## Rules

- Read-only.
- If neither root exists, print "no papers found" — not an error.
- When registry lacks the `papers` key, treat as empty.

## Related

- `/hub-paper-show <slug>` — full view of one paper
- `/hub-paper-verify --all` — structural lint across all
- `/hub-find --kind paper <query>` — remote search

## Why exists

The paper layer is meant to drive new builds and produce corpus outcomes. Without a list view the backlog is unreachable and the retraction signal from schema §11 cannot be observed. This command is where both live.
