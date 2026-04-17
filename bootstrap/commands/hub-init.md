---
description: Initialize skills hub working environment for the current project — clone cache, registry, draft dirs, gitignore
argument-hint: [--global] [--force] [--skip-clone]
---

# /hub-init $ARGUMENTS

One-time setup for using skills hub commands in this project (or globally). Run this before any other `/hub-*` command, or let other commands auto-detect and suggest it.

## What it sets up

| Component | Global (`~/.claude/`) | Project (`.claude/`, cwd) |
|-----------|----------------------|--------------------------|
| Remote cache | `~/.claude/skills-hub/remote/` (git clone) | — |
| Registry | `~/.claude/skills-hub/registry.json` (v2) | — |
| Knowledge dirs | `~/.claude/skills-hub/knowledge/{api,arch,pitfall,decision,domain}/` | `.claude/knowledge/` |
| Draft dirs | — | `.skills-draft/`, `.knowledge-draft/` |
| Bootstrap meta | `~/.claude/skills-hub/bootstrap.json` | — |
| External cache | `~/.claude/skills-hub/external/` | — |

## Steps

1. **Check existing state**
   - If `~/.claude/skills-hub/remote/` exists and is a valid git repo, report as `[OK]` and skip clone.
   - If `registry.json` exists and `version >= 2`, report `[OK]`.
   - If `registry.json` exists with `version: 1`, migrate to v2 (add `knowledge: {}`, bump version).

2. **Clone remote cache** (skip with `--skip-clone`)
   - `git clone https://github.com/kjuhwa/skills.git ~/.claude/skills-hub/remote` (full clone — tags needed).
   - On failure: report the error clearly, mark as `[FAIL]`, continue with remaining setup.

3. **Initialize registry**
   - If missing, create `~/.claude/skills-hub/registry.json`:
     ```json
     { "version": 2, "skills": {}, "knowledge": {} }
     ```
   - Atomic write (temp file + rename).

4. **Create global directories**
   - `~/.claude/skills-hub/knowledge/{api,arch,pitfall,decision,domain}/`
   - `~/.claude/skills-hub/external/`

5. **Create project directories** (skip if `--global` or no `.claude/` in cwd)
   - `.skills-draft/`, `.knowledge-draft/`
   - Add both to `.gitignore` if not already present.
   - `.claude/knowledge/` (project-scoped knowledge)

6. **Bootstrap check**
   - Read `~/.claude/skills-hub/bootstrap.json` if present → show installed command version.
   - If missing, create with `{ "installed_version": "unknown", "installed_at": "<now>" }`.

7. **Install update-check hook**
   - Create `~/.claude/skills-hub/check-updates.sh` — a script that checks for bootstrap version updates and stale cache (>24h) using local git data only (no network).
   - Read `~/.claude/settings.json` and check if a `SessionStart` hook for `check-updates.sh` already exists.
   - If missing, merge a `SessionStart` hook entry into `~/.claude/settings.json`:
     ```json
     {
       "hooks": {
         "SessionStart": [{
           "hooks": [{
             "type": "command",
             "command": "bash ~/.claude/skills-hub/check-updates.sh 2>/dev/null || true",
             "timeout": 10
           }]
         }]
       }
     }
     ```
   - **Never replace existing hooks** — merge into the existing `SessionStart` array if one exists.
   - If already present, report `[OK]` and skip.

8. **Report**
   ```
   hub-init complete:
     Remote cache:   [OK] ~/.claude/skills-hub/remote/ (abc1234, 2h ago)
     Registry:       [OK] v2 (124 skills, 87 knowledge)
     Knowledge dirs: [OK] 5 categories
     Draft dirs:     [OK] .skills-draft/, .knowledge-draft/
     Update hook:    [OK] SessionStart hook in ~/.claude/settings.json
     Bootstrap:      v1.2.0
     
   Next: /hub-install <keyword> or /hub-search-skills <keyword>
   ```

## Arguments

- `--global` — only set up global components, skip project-level dirs.
- `--force` — re-clone remote cache even if it exists; recreate registry from scratch (destructive — confirm first).
- `--skip-clone` — skip the git clone step (useful offline or if cache is managed externally).

## Rules

- **Idempotent.** Safe to run multiple times — only creates what's missing.
- **Never delete existing data** unless `--force` is explicitly passed AND user confirms.
- **Never modify installed skills or knowledge.** This only sets up infrastructure.
- If any step fails, continue with remaining steps and report all failures at the end.
- Registry write is atomic (temp file + rename).
