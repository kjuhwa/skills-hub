---
description: List projects already published under example/ in the skills-hub remote — use this before /hub-make to avoid duplication
argument-hint: [--refresh] [--verbose]
---

> **Note (since v2.6.0):** `/hub-list --kind examples` is the canonical entry. This command remains as a compatibility alias — same behaviour, same flags.


# /hub-list-examples $ARGUMENTS

Enumerate every subfolder under `example/` in the `kjuhwa/skills-hub` remote cache and render a compact catalog. Intended as the first step of `/hub-make` so new creations don't re-invent something that already lives there.

## Steps

1. **Refresh cache** (skip if `--refresh` absent and cache is < 1h old)
   - `git -C ~/.claude/skills-hub/remote fetch --prune origin main`
   - `git -C ~/.claude/skills-hub/remote checkout main`
   - `git -C ~/.claude/skills-hub/remote reset --hard origin/main`
   - If `example/` does not exist yet, print `(no examples yet — safe to build anything)` and stop.

2. **Scan**
   - Examples are organized as `example/<category>/<slug>/` (28 categories).
   - For each `example/<category>/<slug>/` directory, read:
     - `README.md` first H1 → title
     - README's `> **Why.**` line OR first paragraph → one-line summary
     - `manifest.json` (optional) → `tags`, `stack`, `created_at`, `author`
   - Skip any entry whose `README.md` is missing (report as `[BROKEN]`).

3. **Render** grouped by category, sorted by `created_at` desc (fallback alpha):
   ```
   category/slug              title                     stack              created
   circuit-breaker/
     circuit-breaker-dashboard  Circuit Breaker Dashboard  html, css, js   2026-04-16
   messaging/
     dlq-flow-visualizer        DLQ Flow Visualizer        html, css, js   2026-04-16
   ...
   ```
   - With `--verbose`: add description/tags on a wrapped second line per row.
   - Without `--verbose`: show category totals and first 3 slugs per category for compact view.

4. **Footer**
   - Print totals: `N examples · cached from <commit-sha> · fetched <timestamp>`.
   - Print the remote URL: `https://github.com/kjuhwa/skills-hub/tree/main/example`.

## Rules

- Read-only — never mutate the cache beyond the fetch/reset above.
- Treat slug as the source of truth for uniqueness checks elsewhere.
- If cache clone is missing, instruct the user to run `/hub-install` first; do not auto-clone here.
