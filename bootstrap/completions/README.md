# Shell tab-completion for `hub-*` bin wrappers

Tab completion for `hub-search`, `hub-precheck`, `hub-index-diff` **outside** Claude Code's REPL. Claude Code does not support dynamic autocomplete for slash-command argument values — the `argument-hint` frontmatter field is descriptive text only, and there is no first-party completion-provider API for MCP/SDK/hooks as of v2.6.4.

## Install

The bootstrap installer copies these files into `~/.claude/skills-hub/completions/`. Source from your shell rc:

**bash** (`~/.bashrc`)
```bash
[ -f "$HOME/.claude/skills-hub/completions/hub-completion.bash" ] \
  && source "$HOME/.claude/skills-hub/completions/hub-completion.bash"
```

**zsh** (`~/.zshrc`)
```zsh
[ -f "$HOME/.claude/skills-hub/completions/hub-completion.zsh" ] \
  && source "$HOME/.claude/skills-hub/completions/hub-completion.zsh"
```

**PowerShell** (`$PROFILE`)
```powershell
. "$HOME\.claude\skills-hub\completions\hub-completion.ps1"
```

Open a new shell. Try:
```
$ hub-search jwt-r<TAB>
jwt-refresh-rotation-spring
$ hub-index-diff HEAD~<TAB>
HEAD~1   HEAD~5
```

## Coverage

| Wrapper | Completion |
|---|---|
| `hub-search <slug>` | Slug list from `~/.claude/skills-hub/remote/index.json` (archived entries excluded) |
| `hub-search --category=<cat>` | Categories from the same catalog |
| `hub-search --flags` | `--category --cat --kind --html --json -n --help` |
| `hub-precheck <flags>` | `--strict --skip-lint --json --help` |
| `hub-index-diff <ref>` | Recent branches and tags from the remote cache + `HEAD~N` shortcuts |

## Inside Claude Code

Claude Code slash commands (`/hub-install`, `/hub-show`, `/hub-remove`, etc.) do NOT benefit from these files. When you forget a slug while inside the REPL:

1. Run `/hub-find <keyword>` — ranked search over the full 800-entry catalog with Korean↔English synonym expansion.
2. Copy the `name` column from the top result.
3. Paste into `/hub-install <slug>`.

This two-step flow is the closest equivalent to tab-complete in the current Claude Code surface area.

## Refresh semantics

The completion functions read `~/.claude/skills-hub/remote/index.json` on every tab press — no caching, so new skills appear as soon as a `/hub-sync` or `git pull` updates the catalog. If completion returns empty or stale results:

- `ls ~/.claude/skills-hub/remote/index.json` — confirm the catalog exists.
- `/hub-precheck` — regenerate the catalog from filesystem if it's been lost.
- `/hub-doctor` — full environment health check.

## Limitations

- Archived entries are filtered out by design.
- Completion is O(N) per tab press — fine at N ≤ 5000. Beyond that, consider caching.
- PowerShell completion requires the command to already be on `PATH` when the profile loads. If `hub-search` isn't found at shell start, completion registers but won't fire; restart after adding to `PATH`.
- No completion for slash commands — this is a Claude Code limitation, not fixable at the hub level.
