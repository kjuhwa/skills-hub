---
description: Review skill drafts and push them to kjuhwa/skills.git as a branch, with per-skill version tags
argument-hint: [--all | --draft=<name>] [--pr] [--branch=<name>] [--bump=major|minor|patch]
---

# /hub-publish-skills $ARGUMENTS

Publish `.skills-draft/` contents to the remote repository.

## Steps

1. **Enumerate drafts** in `.skills-draft/` (recursive).
   - If none: report and stop.

2. **Dry-run review** (always first)
   - For each draft, show:
     - Target path in remote: `skills/<category>/<skill-name>/`
     - Frontmatter
     - content.md preview (first 40 lines)
     - Collision status (exists remotely? name-similar?)
   - Ask user per draft: publish / skip / edit-first / delete-draft.
   - `--all` auto-selects publish for all (still shows dry-run).

3. **Branch + commit in remote cache**
   - Ensure `~/.claude/skills-hub/remote` is on latest main: `git fetch && git checkout main && git reset --hard origin/main`.
   - Create branch: `--branch=<name>` OR auto `skills/add-<primary-category>-<YYYYMMDD>`.
   - Copy approved drafts into `skills/<category>/<skill-name>/`.
   - **Version resolution per skill**:
     - Read SKILL.md `version` field from the draft.
     - Check if tag `skills/<name>/v<ver>` already exists on origin (`git ls-remote --tags origin`).
     - If exists: refuse to publish until user bumps — suggest next version based on `--bump` flag (default `patch`). Rewrite draft's SKILL.md frontmatter to the bumped value.
     - If `version` missing in frontmatter: set to `1.0.0` for new skills, or latest remote tag + bump for existing skills.
   - Rebuild `index.json` (scan all SKILL.md frontmatter → flat JSON; include `version`).
   - Commit per skill with message: `Add <category>/<name> v<version>: <one-line description>` (use `Update` verb when skill already exists remotely).

4. **Push + tag** (requires confirmation)
   - `git push -u origin <branch>`.
   - For each published skill, create annotated tag: `git tag -a skills/<name>/v<version> -m "<name> v<version>"` pointing at that skill's commit, then `git push origin skills/<name>/v<version>`.
   - Tags are pushed even before PR merge so `hub-sync --version=` can resolve them from the branch; note in output that tags on feature branches are discoverable but only authoritative after merge.
   - If `--pr` flag and `gh` CLI available: `gh pr create --title ... --body ...` using draft's description + source_project; include published version list in PR body.
   - Otherwise print the branch name, tag list, and compare URL.

5. **Cleanup drafts**
   - Move published drafts to `.skills-draft/_published/<date>/` (don't delete outright — user may want reference).

## Rules

- **Never push to `main` directly.** Always a feature branch.
- **Never skip the dry-run step.**
- Respect repo's commit style — check `git log --oneline -20` in the cache first to match format.
- If remote push fails (auth), report precisely and leave branch intact locally for retry.
- Do not include draft metadata files (`_DUPLICATE_CHECK.md`, `_new-categories.md`) in commits.
