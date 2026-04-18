---
description: One-shot publish of both `.skills-draft/` and `.knowledge-draft/` to kjuhwa/skills.git on a single branch with a single PR; auto-chunks into multiple PRs at scale
argument-hint: [--all] [--pr] [--branch=<name>] [--bump=major|minor|patch] [--only skills|knowledge] [--batch-size=<N>] [--batch-squash|--no-batch-squash] [--force-large]
---

# /hub-publish-all $ARGUMENTS

Combined publisher — runs the `/hub-publish-skills` and `/hub-publish-knowledge` pipelines back-to-back, on the **same feature branch**, producing one PR that captures both the procedure (skills) and the rationale (knowledge) from a single extraction round.

Use when `/hub-extract` (or `/hub-extract`) produced drafts in **both** `.skills-draft/` and `.knowledge-draft/` and you want them shipped as one logical change.

## Preconditions

- Union of `/hub-publish-skills` and `/hub-publish-knowledge` preconditions.
- At least one draft under `.skills-draft/` OR `.knowledge-draft/` (if both empty, stop).
- `~/.claude/skills-hub/remote/` clean (no uncommitted local changes).

## Modes

`/hub-publish-all` runs in one of two modes based on total draft count (`K + S`):

- **Single-PR mode (default)** — `K + S ≤ --batch-size` (default 50). Steps 1–6 execute once; one branch, one PR. This is the common case and keeps history tidy.
- **Batched mode** — `K + S > --batch-size`. Steps 1–6 execute **once per batch**. Each batch gets its own branch `release/combined-<YYYYMMDD>-batch-<N>-of-<M>` and its own PR. Step 7 (post-merge retag) runs once per PR after its squash-merge.

## Pre-flight scale check (runs before step 1)

1. Count: `K = size of .knowledge-draft/**/*.md`, `S = size of .skills-draft/**/SKILL.md`. Total = `K + S`.
2. **Pre-load the existing slug set once** from `~/.claude/skills-hub/remote/index.json` into an in-memory `set` so subsequent collision checks are O(1) per draft. The naive per-draft scan of the catalog is O(N²) and becomes the dominant cost past ~200 drafts.
3. Branch on total:

   | Total | Behavior |
   |---|---|
   | `≤ --batch-size` (default 50) | Single-PR mode. Proceed to step 1. |
   | `51–199` | Warn: `note: <total> drafts, auto-chunking into <M> batches of ≤ <batch-size>`. Show batch plan (table: batch #, K count, S count, slug preview of first 3). Ask once for `ok` / `abort`. |
   | `200–999` | Same warning plus a wall-time estimate (`≈ total × 0.5s` for commit+push, `+ M × 2s` for gh pr create). Re-confirm explicitly. |
   | `≥ 1000` | **Refuse** unless `--force-large` is present. Print top 5 category counts so the user can diagnose (e.g. `knowledge/pitfall: 412 — did you mean to publish these?`). This scale almost always means a wrong-dir mistake or a duplicate import. |

4. If mode = batched, build the batch list: sort drafts by slug (stable order so re-runs assign the same drafts to the same batches), knowledge-first within each chunk, chunks of ≤ `--batch-size`.
5. **Within-batch squash**: `--batch-squash` (default ON when `--batch-size > 20`) collapses each batch's commits into at most two (`knowledge: batch N/M (K entries)`, `skills: batch N/M (S entries)`). This matters because the remote's `post-commit` git hook re-runs `precheck.py` on every commit; one-commit-per-draft at 1000 drafts = 1000 full-tree reindexes. `--no-batch-squash` restores the legacy one-commit-per-draft shape for small batches where commit granularity aids review.

## Steps

1. **Enumerate both draft trees**.
   - Skills: `.skills-draft/<category>/<name>/SKILL.md`.
   - Knowledge: `.knowledge-draft/<category>/<slug>.md`.
   - `--only skills` or `--only knowledge` restricts the run to one kind (in which case just defer to the underlying command).
   - If both trees empty: report and stop.

2. **Combined dry-run** (always first)
   - Render one table with both kinds, e.g.:
     ```
     KIND       | CATEGORY | SLUG                              | STATUS  | VERSION/CONF
     skill      | backend  | retry-with-jitter-backoff         | NEW     | v0.1.0-draft → v1.0.0
     skill      | arch     | event-replay-from-offset-store    | UPDATE  | v1.2.1 → v1.2.2
     knowledge  | api      | idempotency-key-per-tenant        | NEW     | high
     knowledge  | pitfall  | feature-flag-sunset-policy        | NEW     | medium
     ```
   - Ask once: publish all / review per-row / abort. Per-row review walks both pipelines' per-draft prompts.
   - `--all` auto-selects publish for every well-formed draft.

3. **Single branch, interleaved commits**
   - Ensure `~/.claude/skills-hub/remote` is on latest main (same reset as the individual commands).
   - Branch name: `--branch=<name>` OR auto `release/combined-<YYYYMMDD>` so it's clear the branch carries both kinds.
   - **Commit order**: knowledge first, then skills.
     - Reason: skills can declare `linked_knowledge` in their SKILL.md; landing knowledge first means the skill commit can already reference the knowledge slug in the same branch.
   - Per-knowledge commit: same as `/hub-publish-knowledge` step 3.
   - Per-skill commit: same as `/hub-publish-skills` step 3 (version resolution, tag prep). If a skill's `linked_knowledge` names a slug published in this run, record the cross-link in registry.json (skills entry → `linked_knowledge: [<slug>]`, knowledge entry → `linked_skills: [<skill>]`).
   - **Capture each skill's commit SHA immediately after the commit** via `git rev-parse HEAD` and store in a `{skill_name: sha}` map. Do **not** rely on `HEAD~N` indexing later — the index is fragile once more commits land (seen in the wild: reversed tag targets when iterating in the wrong order).
   - `registry.json` rebuilt once at the end of the commit sequence, not per-commit, to avoid churn — add a final `Rebuild registry.json` commit if any entries changed.

4. **Rebuild `index.json`**
   - Run `py -3 ~/.claude/skills-hub/tools/_rebuild_index_json.py --root ~/.claude/skills-hub/remote` to regenerate the flat catalog from the current filesystem.
   - If the rebuild produces a larger catalog than the old one, surface the delta count before committing and let the user approve (some entries may be intentionally excluded elsewhere).
   - If there are changes, commit as `chore: rebuild index.json`.
   - **Why this matters**: without this, `/hub-find` and the L1/L2 indexes never see the new entries and appear to have lost them. Missed in early v2.5.x releases; filed as the root cause of PR #1028.

5. **Push + tag + PR** (requires confirmation)
   - `git push -u origin <branch>`.
   - For each **skill**, create the annotated tag `skills/<name>/v<version>` at the captured SHA from the map in step 3 (not at `HEAD`, because other commits have landed since).
   - Push tags: `git push origin --tags` restricted to this run's tags.
   - If `--pr` and `gh` available:
     - Title: `Publish <N> skills + <M> knowledge entries` (single-PR mode) or `Publish batch <N>/<M>: <K> knowledge + <S> skills` (batched mode).
     - **Body size guard**: build the body in memory first; if it exceeds ~50 KB (safe margin under GitHub's ~65 KB PR body limit and typical shell arg limits), truncate the `## Skills` / `## Knowledge` sections to the first 20 entries each and commit a full `MANIFEST.md` to the branch root. The PR body links to it: `_... and N more — see [MANIFEST.md](../blob/<branch>/MANIFEST.md)_`.
     - **Always invoke via `--body-file`** (write body to a temp file, `gh pr create --body-file /tmp/pr-body-<N>.md`). Never pass body inline — `--body "..."` hits shell arg length limits around 32 KB on Windows and breaks silently in the middle of a run.
     - **Use explicit `--repo <owner>/<name> --head <branch> --base main`** flags rather than relying on the shell's cwd being the git directory. See knowledge entry `gh-pr-create-cwd-prefix-does-not-stick`.
     - Body sections: `## Skills`, `## Knowledge`, `## Cross-links` (skill ↔ knowledge pairs created this run), `## Source` (project/session/commit refs), `## Batch` (only in batched mode: `<N>/<M>`, total, slug range, previous/next batch PR links once available).
     - Add a `## Post-merge` block that tells the reviewer/merger to run step 7 after squash-merge.
   - Otherwise print branch name, tag list, and compare URL.
   - In **batched mode**, each batch opens one PR. Do **not** open all PRs in parallel — serialize: open batch N, wait for `ok` (or `--yes` auto-confirm), then open batch N+1. Prevents accidental mass-PR floods from an incorrectly-counted draft dir.

6. **Cleanup drafts**
   - Move published skill drafts → `.skills-draft/_published/<date>/`.
   - Move published knowledge drafts → `.knowledge-draft/_published/<date>/`.
   - Leave unpublished drafts in place.

7. **Post-merge: re-anchor skill tags** (run AFTER the PR is squash-merged)
   - Squash merge orphans tags created on the release branch — they point at a commit that is no longer reachable from `main` (see knowledge entry `squash-merge-orphans-release-branch-tags`).
   - Fetch: `git fetch origin && git checkout main && git pull --ff-only`.
   - Read the squash-merge commit SHA from the merged PR (`gh pr view <N> --json mergeCommit --jq '.mergeCommit.oid'`).
   - For every tag in this run's tag list:
     ```bash
     git tag -d <tag>
     git tag -a <tag> <merge-commit-sha> -m "<original-message>"
     git push --force origin <tag>
     ```
   - Verify: `git merge-base --is-ancestor <tag> main && echo ok`. All tags must be reachable from main.
   - Skip this step if the PR used a merge commit (not squash) — then the original tag is already reachable.

## Rules

- **Never push to `main` directly.** One feature branch per run (per batch, in batched mode).
- **Never skip the dry-run step.**
- If either pipeline aborts mid-run, the branch is kept as-is for inspection — no automatic rollback, no force-push. In batched mode, already-merged batches are never reverted; only the batch that failed stops the sequence.
- Cross-linking is **opt-in**: only link when a skill's SKILL.md explicitly names a `linked_knowledge` slug, or a knowledge file's frontmatter names `linked_skills`. Never infer links from name similarity. Cross-links across batches are allowed only when the referenced entry has already landed on `main` (i.e. the target batch's PR is merged).
- Sanitization rules from both underlying commands apply.
- On conflict between `--only` and the presence of drafts in the excluded kind, warn and proceed with the requested kind only; don't silently publish the other.
- If `gh` is unavailable, still push the branch and print a ready-to-paste PR URL + title + body draft.

### Scale rules (v2.6.4+)

- `--batch-size=<N>` defaults to 50 and is clamped to the range `[5, 200]`. Values below 5 create too many tiny PRs; values above 200 risk GitHub's diff-rendering and shell-arg limits regardless of squashing.
- `--force-large` is required to publish ≥ 1000 drafts in a single invocation. Without it, the pre-flight check refuses and prints the top 5 category counts for diagnosis. This is a guardrail against accidental mass publishes, not a performance limit.
- **Slug collisions against the existing catalog must be resolved before any commit lands.** The pre-flight pre-loads the catalog slugs into a `set` exactly once; every draft is checked against it in O(1). If any collision is found, the whole run stops and prints the offending pairs — do not let partial batches leak through.
- **Within-batch squash is on by default at scale.** When `--batch-size > 20`, each batch collapses to at most two commits (`knowledge: batch N/M`, `skills: batch N/M`) so the remote's `post-commit` hook runs a bounded number of reindexes. Users who want commit-per-draft granularity for review pass `--no-batch-squash` and accept the hook-fire cost.
- **PR bodies MUST use `--body-file`** when generated at scale; inline `--body "..."` breaks silently past ~32 KB on Windows shells. At any size, explicit `--repo`/`--head`/`--base` flags are mandatory — never rely on shell cwd for `gh` invocations (see `gh-pr-create-cwd-prefix-does-not-stick`).
- **Batched PRs open serially, not in parallel.** Opening N PRs concurrently can trip per-user rate limits on `gh` / the GitHub API, and the serial flow gives the user a chance to abort after seeing batch 1 render correctly.

## When NOT to use

- If you only have skill drafts → `/hub-publish-skills` is simpler.
- If you only have knowledge drafts → `/hub-publish-knowledge` is simpler.
- If drafts come from unrelated sessions → publish separately so PR history stays coherent.
