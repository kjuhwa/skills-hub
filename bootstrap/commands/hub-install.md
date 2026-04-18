---
description: Search kjuhwa/skills-hub by keyword/category and install matching skills or knowledge locally, optionally pinning a version
argument-hint: <keyword | name@version> [--kind=skill|knowledge|auto] [--all] [--example] [--global] [--category=<name>] [--version=<x.y.z>] [--include-archived] [--refresh] [--interactive] [--force-main]
---

# /hub-install $ARGUMENTS

Install **skills** or **knowledge** entries from the central repository matching the keyword. Skills land in `~/.claude/skills/<name>/` (or project-scoped `.claude/skills/<name>/`) so Claude Code can auto-discover them. Knowledge entries land as plain markdown under `~/.claude/skills-hub/knowledge/<category>/<slug>.md` (or project-scoped `.claude/knowledge/<category>/<slug>.md`) for local citation, PR review, and offline reads — knowledge "installs" since v2.6.5.


## Dispatch (v2.6.0+)

- `--all` → delegate to the `/hub-install-all` flow (bulk-install every skill + knowledge from main)
- `--example` → delegate to the `/hub-install-example` flow (copy an example project into cwd)

If none of these flags are present, run the main flow below.

## Steps

1. **Ensure remote cache exists (fast path in v2.6.3+)**
   - Path: `~/.claude/skills-hub/remote/`
   - If missing: `git clone https://github.com/kjuhwa/skills-hub.git ~/.claude/skills-hub/remote` (full clone — shallow drops tags needed for version pinning). The URL is `skills-hub.git`, not `skills.git`.
   - **Otherwise do NOT auto-fetch.** Installing always uses the current working-tree state of the remote cache. Staleness detection is the job of `/hub-sync` (explicit) or `/hub-doctor` check 9 (reports the gap). The old "fetch if older than 1h" heuristic was the top contributor to slow installs.
   - `--refresh` flag opts into an inline `git fetch --tags --prune origin && git pull --ff-only` before install (for users who know they want fresh).
   - If clone fails (network/auth), report clearly and stop — do NOT fabricate skills.

2. **Parse version spec and kind (v2.6.5+)**
   - `$ARGUMENTS` of form `name@version` → split into keyword=`name`, version=`version`.
   - Explicit `--version=<x.y.z>` flag takes precedence.
   - Default (no version): install from `main` HEAD (latest).
   - **`--kind=<skill|knowledge|auto>`** (default `auto`):
     - `auto` — include both kinds in the search; if the keyword exactly matches one entry's `name` in **exactly one kind**, proceed with that kind. If the same slug exists in both kinds (rare but legal), require explicit `--kind` and stop.
     - `skill` or `knowledge` — restrict the search to that kind.
   - Knowledge entries currently have no git version tags (only skills do); `--version=<x>` on a knowledge install therefore relies on frontmatter match (tier 2 of step 6) or `--force-main`.

3. **Search**
   - Read `~/.claude/skills-hub/remote/index.json`. It's the authoritative flat catalog (rebuilt on every publish since v2.5.4). Fall back to scanning `**/SKILL.md` and `knowledge/**/*.md` only if `index.json` is missing (unusual).
   - **Skip archived entries.** An entry is considered archived when its source frontmatter (or `index.json` record) has `archived: true`. Archived entries remain in the repo for history but must never be surfaced to installers. If the user explicitly names an archived entry, show a single-line notice with the `archived_reason` and stop — do not install unless the user passes `--include-archived`.
   - Match keyword against: `name`, `description`, `tags`, `triggers`, `category` (case-insensitive).
   - If `--kind=<...>` present, restrict the search results to that kind. If `--category=<name>` present, restrict to that category.

4. **Present matches (v2.6.3+ fast-path, v2.6.5+ kind column)**
   - **Exact-name fast path**: if the keyword equals exactly one entry's `name` field (case-insensitive exact match, after stripping `@version`) within the effective kind scope, **skip the interactive prompt** and go straight to step 6. Under `--kind=auto`, a cross-kind name collision (same slug in both skill and knowledge) disables the fast path and forces the prompt.
   - Otherwise show: `kind/category/name — description (tags)` in a numbered list so the user can see skill vs knowledge at a glance.
   - If zero matches: suggest closest categories from `CATEGORIES.md` and stop.
   - If many (>10): show top 10 by tag-match score; ask user to narrow.

5. **Ask user** which to install (accept numbers, `all`, or `cancel`). Skipped entirely when step 4 hit the exact-name fast path.

6. **Resolve ref per entry (v2.6.3+ graceful fallback, v2.6.5+ kind-aware)**
   - Tag prefix depends on kind: skills use `refs/tags/skills/<name>/v<version>`; knowledge currently has **no tag scheme** — tier 1 below is skipped for knowledge.
   - **If a version was specified**, resolve in this order:
     1. **Tag match** (skills only): verify `refs/tags/skills/<name>/v<version>` exists (`git -C ~/.claude/skills-hub/remote rev-parse --verify …`). If so, use that tag.
     2. **Frontmatter match**: if the tag is missing (or the entry is a knowledge item) but the current `main` copy's source frontmatter has `version: <same-version>`, install from `main` HEAD and print a one-line warning: `note: no tag exists for v<version>, but main declares this version in frontmatter — installing from main`. Treat as pinned=true in the registry.
     3. **No match + no tags exist for this entry** (always true for knowledge today): print a friendly line — `hint: this entry has no version tags yet. Drop "@<version>" to install from main, or use --force-main to proceed anyway.` Stop unless `--force-main`.
     4. **No match + other tags exist** (skills only): list available tags via `git tag -l "skills/<name>/v*"` and stop. User picks one explicitly.
   - **No version specified**: use current `main` checkout — same as before.
   - Checkout files via `git -C <remote> show <ref>:<source-path>` per file (keeps main working tree untouched). Source paths:
     - skills: `skills/<category>/<name>/{SKILL.md,content.md,examples/…}`
     - knowledge: `knowledge/<category>/<slug>.md` (single file, no `content.md` companion)

7. **Install selected (v2.6.5+ kind-aware destinations)**
   - Destination depends on kind and scope:

     | Kind | `--global` OR no project `.claude/` | Project-scoped (default when cwd has `.claude/`) |
     |---|---|---|
     | skill | `~/.claude/skills/<name>/` | `.claude/skills/<name>/` |
     | knowledge | `~/.claude/skills-hub/knowledge/<category>/<slug>.md` | `.claude/knowledge/<category>/<slug>.md` |

   - On destination collision: show diff of existing vs remote (including version), ask overwrite / skip / rename.
   - Copy the full source tree for skills (SKILL.md + content.md + examples/); for knowledge, copy the single `<slug>.md` only.
   - Update `~/.claude/skills-hub/registry.json`:
     - Skills: `skills.<slug>` entry.
     - Knowledge: `knowledge.<slug>` entry (v2 schema — already present with 0 entries until v2.6.5 populates it).
     - Fields for both: `category`, `scope`, `path`, `installed_at`, `version`, `source_commit` (tag SHA or `main` HEAD SHA), `pinned: true` when an explicit version was supplied — `/hub-sync` must skip pinned entries unless `--force`.

8. **Report**
   - List installed entries with their kind, resolved version, and local path.
   - **Only skills require a Claude Code session restart** to be discovered as invokable. Knowledge entries are plain markdown — they take effect immediately for Read/citation use.

## Rules

- **Always install from `main` branch.** All skill/knowledge sources must come from the `main` branch of the remote cache. Never use feature branches (`example/*`, `skill/*`, etc.) — they may contain outdated or unmerged content. Skill version-pinned installs use tags that point to commits on `main`; knowledge has no tag scheme today and always resolves from `main` HEAD (tier 2/3 of step 6).
- Never install without explicit user selection unless `--yes` flag.
- Never modify the remote clone cache's working tree (read-only usage).
- **Discovery panel when `$ARGUMENTS` is empty (v2.6.4+)** — show a three-part panel before prompting:
  1. **Recent installs** — up to 5 entries from `~/.claude/skills-hub/registry.json`, sorted by `installed_at` descending. Skips entries whose files are missing on disk.
  2. **Categories** — from `CATEGORIES.md`, annotated with entry counts read from `index.json` (e.g. `security (47)`).
  3. **Hint line** — Claude Code's REPL has no native tab-complete for slash-command args. When you don't remember a slug, run `/hub-find <keyword>` first and paste the `name` from the results. For shell wrappers outside Claude Code, source `~/.claude/skills-hub/completions/hub-completion.{bash,zsh,ps1}` from your rc.
  Then prompt the user for a keyword, slug, or category.
- **Archived entries** (`archived: true` in frontmatter or index) are excluded from search results and bulk installs. Install them only when the user explicitly names the entry AND passes `--include-archived`; then print the `archived_reason` before proceeding so the user has context.
