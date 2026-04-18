---
description: Unified publish entry point. Defaults to /hub-publish-all; use --only to restrict to one kind. Supersedes /hub-publish-skills, /hub-publish-knowledge, /hub-publish-example.
argument-hint: [--only skills|knowledge|all|example] [--pr] [--branch=<name>] [--bump=major|minor|patch]
---

# /hub-publish $ARGUMENTS

Single entry for publishing drafts back to the hub. By default runs the full combined flow (`/hub-publish-all`); pass `--only` to restrict to one kind.

## Dispatch

| `--only` | Delegates to |
|---|---|
| `all` *(default)* | `/hub-publish-all` — knowledge-first then skills on one feature branch, single PR |
| `skills` | `/hub-publish-skills` — skills only |
| `knowledge` | `/hub-publish-knowledge` — knowledge only |
| `example` | `/hub-publish-example` — local creation to `example/<slug>/` |

All flags (`--pr`, `--branch`, `--bump`) pass through unchanged.

## Steps

1. Parse `--only`. Default `all`.
2. Sanity-check the corresponding draft tree is non-empty; if empty, report and stop.
3. Delegate to the chosen flow with all remaining arguments.

## When to pick each

- **Default (`--only all`)**: you ran `/hub-extract` and have both skill and knowledge drafts from the same session → one coherent PR.
- **`--only skills`**: just procedure patterns, no rationale content.
- **`--only knowledge`**: pitfalls/decisions only, no executable recipes.
- **`--only example`**: you built a demo project under `example/` and want to ship that specific layout (different branch/PR semantics).

## Why exists

Before v2.6.0 there were four nearly-identical publish commands. `/hub-publish-all` was already the umbrella but users often forgot and ran the specialised ones. This command is the new canonical name; the four originals remain as compatibility aliases.
