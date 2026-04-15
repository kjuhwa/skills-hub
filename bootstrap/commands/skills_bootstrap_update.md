---
description: Update local slash commands (init_skills, skills_*) from kjuhwa/skills.git — latest or a specific version
argument-hint: [--version=<x.y.z>] [--dry-run] [--force]
---

# /skills_bootstrap_update $ARGUMENTS

Pull slash-command files from `bootstrap/commands/` in the remote repo and install them into `~/.claude/commands/`. Supports latest (HEAD) or a specific tagged version for rollback.

## Steps

1. **Refresh cache**
   - `git -C ~/.claude/skills-hub/remote fetch --tags --prune origin`.
   - If working tree clean: `git -C ~/.claude/skills-hub/remote checkout main && git -C ~/.claude/skills-hub/remote reset --hard origin/main`.
   - If cache dirty or has local commits: report and stop.

2. **Resolve ref**
   - `--version=<x.y.z>`: use tag `bootstrap/v<x.y.z>`. Verify it exists via `git -C <remote> rev-parse --verify refs/tags/bootstrap/v<x.y.z>`. If missing, list `git -C <remote> tag -l "bootstrap/v*" | sort -V` and stop.
   - No flag: use `main` HEAD.

3. **Diff preview**
   - For each file in `bootstrap/commands/` at the resolved ref, compare against `~/.claude/commands/<file>`.
   - Show list: `NEW / UPDATED / UNCHANGED / LOCAL-MODIFIED`.
   - `LOCAL-MODIFIED` = user edited their local copy; updating will overwrite — warn and offer `.bak`.

4. **Apply**
   - `--dry-run`: print plan only, write nothing.
   - Otherwise: extract each file via `git -C <remote> show <ref>:bootstrap/commands/<file>` → write to `~/.claude/commands/<file>`.
   - For `LOCAL-MODIFIED` files without `--force`: skip and report.

5. **Record version**
   - Write `~/.claude/skills-hub/bootstrap.json`:
     ```json
     {
       "installed_version": "1.2.0",
       "installed_commit": "<sha>",
       "installed_at": "<iso>",
       "source_ref": "bootstrap/v1.2.0"
     }
     ```
   - If installing from `main` HEAD (no version flag), set `installed_version: "main"` and record the commit SHA.

6. **Report**
   - Show: previous version → new version, list of changed commands, any skipped due to local modifications.
   - Remind user that newly added slash commands may need a Claude Code restart to register.

## Rules

- Never touch `~/.claude/commands/` files outside `bootstrap/commands/` scope — user-authored commands stay untouched.
- Never `reset --hard` if the remote cache has uncommitted work (guard with `git status --porcelain`).
- Rollback (downgrade to older tag) is allowed; confirm explicitly when target version is lower than `installed_version`.
- If `bootstrap.json` is missing, treat as first install and proceed.
