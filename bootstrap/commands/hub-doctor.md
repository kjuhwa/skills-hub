---
description: Diagnose and repair the local skills hub environment — cache integrity, registry consistency, broken links, permission issues
argument-hint: [--fix] [--verbose]
---

# /hub-doctor $ARGUMENTS

Local environment health check and repair. While `/hub-cleanup` maintains the **remote** repository, `/hub-doctor` focuses on your **local** installation.

## Checks (run in order)

### 1. Remote cache integrity
- `~/.claude/skills-hub/remote/` exists and is a git repo (`git -C <path> rev-parse --git-dir`).
- Working tree is clean (`git status --porcelain` is empty).
- Remote origin URL matches expected (`https://github.com/kjuhwa/skills.git` or SSH equivalent).
- HEAD is detached or on `main` — warn if on a stale feature branch.
- **Fix**: re-clone if corrupt (`--fix` required); checkout main if on wrong branch.

### 2. Registry consistency
- `~/.claude/skills-hub/registry.json` exists and is valid JSON.
- `version` field is `2`. If `1`, offer migration.
- Every `skills.<slug>` entry has a corresponding directory at its `path`.
- Every `knowledge.<slug>` entry has a corresponding file at its `path`.
- No duplicate slugs across skills and knowledge (slug collision).
- **Fix**: remove orphan registry entries; migrate v1→v2 (`--fix` required).

### 3. Filesystem ↔ registry sync
- Scan `~/.claude/skills/*/SKILL.md` (global) and `.claude/skills/*/SKILL.md` (project).
- Cross-reference with registry:
  - `[ORPHAN REGISTRY]` — in registry but file missing.
  - `[UNTRACKED]` — file exists but not in registry.
  - `[PATH MISMATCH]` — registry path doesn't match actual location.
- Scan `~/.claude/skills-hub/knowledge/**/*.md` similarly.
- **Fix**: re-register untracked entries; remove orphan entries (`--fix` required).

### 4. Directory structure
- All expected directories exist:
  - `~/.claude/skills-hub/knowledge/{api,arch,pitfall,decision,domain}/`
  - `~/.claude/skills-hub/external/`
  - `.skills-draft/`, `.knowledge-draft/` (project-level, if `.claude/` exists in cwd)
- `.gitignore` includes `.skills-draft/` and `.knowledge-draft/`.
- **Fix**: create missing directories; append to `.gitignore` (`--fix` required).

### 5. Bootstrap version
- `~/.claude/skills-hub/bootstrap.json` exists and is valid JSON.
- `installed_version` is not `"unknown"`.
- Compare with latest `bootstrap/v*` tag in cache.
- **Fix**: recreate `bootstrap.json` from current command files (`--fix` required).

### 6. Permission & encoding
- All `SKILL.md` and knowledge `*.md` files are UTF-8 readable.
- No files with BOM markers that might cause parse issues.
- No files > 1MB (unusually large skill/knowledge — likely a mistake).
- **Fix**: report only — no auto-fix for encoding/size issues.

## Report format

```
hub-doctor results:

  [PASS]  Remote cache integrity (main @ abc1234, clean)
  [WARN]  Registry consistency — 2 orphan entries
  [FAIL]  Filesystem sync — 3 untracked skills, 1 path mismatch
  [PASS]  Directory structure
  [WARN]  Bootstrap — version unknown
  [PASS]  Permissions & encoding

  Summary: 2 passed, 2 warnings, 1 failure
  
  Run /hub-doctor --fix to repair 3 issues automatically.
  1 issue requires manual attention (see details above).
```

With `--verbose`: expand each check to show individual items (orphan names, untracked paths, etc.).

## Arguments

- `--fix` — automatically repair fixable issues. Prompts for confirmation before each destructive repair (re-clone, registry entry removal).
- `--verbose` — show detailed per-item results for every check.

## Rules

- **Default is read-only** — without `--fix`, only diagnose and report.
- **Never delete installed skills** — only clean up registry entries that point to missing files.
- **Never modify the remote** — this is local-only.
- **Never re-clone without confirmation** — even with `--fix`, prompt before destructive actions.
- If the environment is completely uninitialized, suggest `/hub-init` instead of trying to fix from scratch.
- Exit with a clear summary: pass/warn/fail counts + next steps.
