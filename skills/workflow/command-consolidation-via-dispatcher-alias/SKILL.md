---
name: command-consolidation-via-dispatcher-alias
description: When you have 35+ slash commands and cognitive load is the bottleneck, consolidate via dispatcher commands (one canonical command + --kind or --only flags) and leave the originals as aliases with a deprecation note. Zero breaking changes, "Core N" mental model for new users.
category: workflow
tags: [slash-command, claude-code, command-design, consolidation, deprecation, ux, mental-model]
triggers: ["too many commands", cognitive-load, deprecation, alias, "/hub-list", "/hub-publish", "Core 8"]
source_project: skills-hub-bootstrap-v2.6.0
version: 0.1.0
---

# command-consolidation-via-dispatcher-alias

## Problem

Over time, a tool family grows: `/hub-list-skills`, `/hub-list-knowledge`, `/hub-list-examples`, `/hub-publish-skills`, `/hub-publish-knowledge`, `/hub-publish-all`, `/hub-publish-example`, `/hub-install-all`, `/hub-install-example`, `/hub-extract`, `/hub-extract-session`, … 35 commands, 90% of which the user never touches. New users can't build a mental model. Existing users suffer cognitive load ("was it `/hub-list-skills` or `/hub-skills-list`?").

Deleting commands breaks workflows and muscle memory. Renaming breaks every doc and tutorial that linked to them.

## Pattern

Two-phase consolidation that preserves full backwards compatibility.

### Phase 1 — add canonical dispatchers

For each cluster of related commands, introduce ONE canonical command with a selector flag:

| Cluster | Canonical | Selector flag |
|---|---|---|
| `/hub-list-{skills,knowledge,examples}` | `/hub-list` | `--kind {skills|knowledge|examples|all}` (default: all) |
| `/hub-publish-{skills,knowledge,all,example}` | `/hub-publish` | `--only {skills|knowledge|all|example}` (default: all) |
| `/hub-install-{all,example}` | `/hub-install` | `--all` / `--example` flags |
| `/hub-extract-session` | `/hub-extract` | `--session` flag |

The canonical command's body explicitly defers to the specialised command for its flow ("Dispatch" section at the top). The AI reads this and delegates.

### Phase 2 — annotate legacy commands

Inject a one-line deprecation note right after the YAML frontmatter closing delimiter:

```markdown
---
description: <original>
argument-hint: <original>
---

> **Note (since v2.6.0):** `/hub-list --kind skills` is the canonical entry.
> This command remains as a compatibility alias — same behaviour, same flags.

# /hub-list-skills $ARGUMENTS
...
```

Everything else stays. Same behaviour, same body, just a deprecation banner. Legacy scripts/docs keep working.

### Phase 3 (deferred, optional) — remove aliases

Only after telemetry shows the legacy command is no longer invoked. Without telemetry, don't remove — the cost of breakage outweighs the benefit of a shorter command list.

## Documentation update

README gains a "Core N" section at the top of the command reference that lists only canonical commands. Legacy commands are folded into a separate "Aliases" block with `→` arrows showing the canonical mapping:

```
--- Core 8 (v2.6.0+) ---
/hub-find, /hub-suggest, /hub-install, /hub-list,
/hub-extract, /hub-publish, /hub-sync, /hub-doctor

--- Legacy aliases (still work) ---
hub-install-all.md        → /hub-install --all
hub-list-skills.md        → /hub-list --kind skills
hub-extract-session.md    → /hub-extract --session
...
```

## When to use

- You have 20+ commands in a family and new users struggle to pick.
- Frequent support questions about "which one for X?".
- Existing user base you cannot break.

## When NOT to use

- Small command count (< 10). Consolidation overhead isn't worth it.
- Commands with genuinely different semantics that happen to share a noun. Don't force `--only` onto commands that aren't parallel.

## Pitfalls

- **Don't consolidate too aggressively**. `/hub-merge`, `/hub-split`, `/hub-refactor`, `/hub-condense`, `/hub-cleanup` all touch the corpus but have distinct verbs and risks — leave them separate.
- **Dispatch block must be obvious**. Put it at the top of the canonical command's body so the AI sees it before getting into flow details.
- **Argument-hint matters**. Include the new flags (`--kind`, `--only`, `--session`) in the canonical command's `argument-hint` so tab-completion surfaces them.
- **Avoid silent renames**. Even if an alias is never called, its file should stay; tooling (`/hub-commands-publish`) may iterate the directory and break if files disappear.
