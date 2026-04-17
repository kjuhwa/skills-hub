# Hub Auto-Loop Dashboard

> **Why.** Fully automated pipeline that generates apps, publishes to skills-hub, extracts skills/knowledge, and loops — with a live web dashboard proving the hub is actually being leveraged each cycle.

## Features

- **7-phase pipeline** — generate → build → publish → merge → extract → publish-sk → install → loop (all automated, auto-merged)
- **Evocative 10–20 word themes** — each cycle picks a random phrase like "Midnight cartographers chart constellations drifting across velvet skies" instead of bare keywords. Unlocks creative variety from Claude.
- **FULL hub inventory in prompt** — every cycle scans all 300+ skills and 300+ knowledge entries from the hub, embeds them into Claude's prompt, and requires 100+ citations spread across 3 generated apps.
- **Live Recipe panel** — right-side panel shows, in real time, which skills/knowledge Claude cited this cycle (up to 200 skills + 100 knowledge). Click any item to open a modal showing the full SKILL.md / knowledge .md content.
- **Status strip** — top bar shows current phase (n/7), phase elapsed time (live MM:SS), and the cycle's theme phrase with gradient glow.
- **Run Once / Start Loop** — either drive one complete cycle and stop, or run continuously.
- **Real-time SSE log stream** with color-coded levels and auto-scrolling panel.
- **Apps built / Skills acquired** panels showing every artifact produced with links to merged PRs.

## File structure

```
auto-hub-loop/
  server.js     — HTTP server + SSE + 7-phase orchestration engine (~1300 lines)
  index.html    — Dashboard: pipeline strip, status bar, apps list, recipe panel, log stream, hub-item modal (~900 lines)
  manifest.json — Hub metadata
```

## Usage

```bash
node server.js
# open http://localhost:8917
# click "Start Loop" or "Run Once"
```

### Pipeline phases

Each cycle runs these phases in sequence:

1. **Generate Ideas** — Claude produces 3 distinct app ideas (visualization + simulation + tool) from a random theme phrase
2. **Build Apps** — parse and write files to `NN-slug/` directories, validate JS syntax
3. **Publish PRs** — git branch + commit + push + `gh pr create` for each app (3 PRs)
4. **Auto-Merge** — `gh pr merge --merge` for each PR
5. **Extract Skills** — Claude analyzes the built apps for NEW, genuine patterns (ignoring templated `-visualization-pattern` slugs)
6. **Publish S/K** — single PR with all extracted skills + knowledge, auto-merged
7. **Install All** — copy new items into `~/.claude/skills/` and `.claude/knowledge/`

### Key technical tricks

- **Large-prompt stdin redirect** — prompts with 300+ skill descriptions exceed argv limits. Server writes prompt to a temp file, then spawns `claude -p < tmpfile` via shell redirect (avoids ENAMETOOLONG on Windows, stdin-pipe propagation bugs on Windows cmd).
- **OMC hook isolation** — child Claude process runs with `DISABLE_OMC=1`, `OMC_SKIP_HOOKS=*`, `CLAUDE_DISABLE_SESSION_HOOKS=1` env to prevent autopilot hooks from hijacking output into side channels.
- **Recipe extraction** — after apps are built, the server scans the Claude output for all known skill/knowledge names (regex word-boundary + backtick match) and broadcasts the matched list via SSE.
- **Duplicate-aware extraction** — extraction phase tells Claude to skip names already in the repo and bans templated suffixes, forcing genuinely new patterns each cycle.

## Stack

`node` · `html` · `css` · `vanilla-js` — zero external dependencies, ~2200 lines total

## Skills applied

| Skill | Used for |
|---|---|
| `stdin-redirect-cli-large-prompts` | >30KB prompt delivery via temp file + shell redirect |
| `full-inventory-over-sampling-prompt` | Passing all 300+ hub items to Claude instead of sampling |
| `parallel-build-sequential-publish` | Build locally in batch, publish to git one at a time |
| `zero-dep-dark-html-app` | Dashboard scaffold |

## Knowledge respected

| Knowledge | Why |
|---|---|
| `dashboard-decoration-vs-evidence` | Replaced animated character with Recipe panel showing actual cited skills |
| `single-keyword-formulaic-llm-output` | Themes are 10–20 word phrases, not single words |
| `batch-pr-conflict-recovery` | Per-PR flow avoids catalog README edits to prevent merge conflicts |
| `flat-vs-categorized-folder-structure` | Publishes to `example/<category>/<slug>/` not flat |

## Provenance

- Built iteratively by Claude Code via `/hub-make` across multiple sessions in 2026-04-16 and 2026-04-17
- Source working copy: `D:/22_TEST/test/17-auto-hub-loop`
- This is v2 — significant rewrite since initial publish (PR #111)
