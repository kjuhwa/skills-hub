---
description: Publish local slash-command edits to kjuhwa/skills.git bootstrap/commands/ with a version tag
argument-hint: [--bump=major|minor|patch] [--version=<x.y.z>] [--pr] [--branch=<name>]
---

# /skills_bootstrap_publish $ARGUMENTS

Stage `~/.claude/commands/*.md` edits into `bootstrap/commands/` on the remote repo, commit, and push a `bootstrap/v<semver>` annotated tag so `/skills_bootstrap_update` can roll forward or back.

## Steps

1. **Refresh cache**
   - `git -C ~/.claude/skills-hub/remote fetch --tags --prune origin`.
   - Clean checkout `main`: `git checkout main && git reset --hard origin/main` (stop if cache is dirty).

2. **Determine next version**
   - Read `~/.claude/skills-hub/bootstrap.json` → `installed_version` (or use latest `bootstrap/v*` tag if absent).
   - Resolve target:
     - `--version=<x.y.z>`: explicit. Refuse if tag already exists.
     - `--bump=major|minor|patch`: compute next.
     - Default: `patch` bump.
   - Reject pre-existing tags unless a different explicit version is supplied.

3. **Diff bootstrap vs local**
   - For each file in `~/.claude/commands/*.md` that also exists in `bootstrap/commands/`:
     - Show unified diff.
   - Detect new files (in local but not remote) and prompt user to include / skip per file.
   - Files only in remote but not local → not deleted (user may have removed locally on purpose); prompt: keep-in-remote / delete-in-remote.

4. **Create branch + copy**
   - Branch: `--branch=<name>` OR auto `bootstrap/release-v<version>`.
   - `git checkout -b <branch>`.
   - Copy approved local files into `bootstrap/commands/<file>`.
   - If any file was removed upstream per user decision, `git rm` it.

5. **Commit + tag**
   - Single commit: `Bootstrap v<version>: <summary>`. Summary is auto-generated from changed filenames (user may edit).
   - Annotated tag: `git tag -a bootstrap/v<version> -m "Bootstrap commands v<version>"`.

6. **Push** (confirmation required)
   - `git push -u origin <branch>`.
   - `git push origin bootstrap/v<version>`.
   - If `--pr` and `gh` CLI present: `gh pr create --title "Bootstrap v<version>" --body <changelog>`.
   - Otherwise print branch, tag, and compare URL.

7. **Report**
   - Published version, tag name, branch, commit SHA, file list.
   - Reminder: tag is immediately usable for `/skills_bootstrap_update --version=<x.y.z>` once pushed, even before PR merge.

## Rules

- **Never push to `main` directly** — always via feature branch + PR.
- Refuse to overwrite an existing tag (tags are immutable history).
- Skip files not in the `bootstrap/commands/` manifest (user-private commands stay local).
- If there are zero differences vs remote HEAD, report and stop — don't create empty version bumps.
