---
description: Show a paper's frontmatter, body, and expanded examines[]/requires[] (inline descriptions of cited atoms/techniques). v0.2-aware — renders experiments and outcomes explicitly.
argument-hint: <slug> [--raw]
---

# /hub-paper-show $ARGUMENTS

Display one paper with its cited refs expanded in-place so the reader can evaluate the argument without jumping across multiple files.

## Input resolution

Same as `/hub-paper-verify`: first match in `./.paper-draft/**/<slug>/PAPER.md`, then `~/.claude/papers/**/<slug>/PAPER.md`.

## Steps

1. Read the paper file.
2. Print the frontmatter block verbatim.
3. **Expand examines[]** — for each entry:
   - Resolve path per kind (skill/knowledge/technique); reject paper kind
   - Read the resolved file's frontmatter; extract `name`, `version`, `description`/`summary`
   - Print an annotated line:
     ```
     [technique] workflow/safe-bulk-pr-publishing v0.1.0-draft  (role: pilot #1)
                 → Build N projects in parallel ... batch conflict recovery
     ```
   - If ref resolves to missing file, mark `[MISSING]` and continue
4. **Render perspectives[]** — numbered sections with `name` and `summary`
5. **Render experiments[]** (v0.2) — table showing:
   ```
   EXPERIMENTS
     [1] coverage-threshold-measurement
         hypothesis: ...
         status: completed  supports_premise: partial  observed: 2026-04-24
         built_as: example/workflow/coverage-gate-benchmark → Interactive cost-model benchmark
         result: ...
   ```
   If `experiments[]` is empty AND `type=hypothesis`, print a WARN banner: `paper cannot reach status=implemented without a completed experiment`.
6. **Render proposed_builds[]** with `requires[]` expanded — for each build, show its `requires` refs inline with one-line descriptions (same pattern as examines expansion).
7. **Render outcomes[]** (v0.2) — for each outcome, resolve the `ref` to its current description if possible; show the `note`.
8. Print the paper body verbatim (the markdown after the frontmatter).
9. **Trailing status line**:
   `<N> examines resolved (<M> missing); <P> perspectives; <E_c>/<E_p> experiments completed/planned; <O> outcomes; <B> proposed builds; type=<type>; status=<status>`

## Flags

- `--raw`: skip all expansion, print file as-is.

## Rules

- Read-only.
- Never modify the paper.
- Never fetch remote. Missing refs are surfaced, not auto-repaired.
- **Retracted banner**: if `status=retracted`, prepend the output with a warning block showing `retraction_reason`. The body is still rendered (retracted papers are historical record, not deleted).

## v0.2 behaviors worth flagging

- If `outcomes[].kind == produced_example`, resolve against `example/<ref>/README.md` (or `manifest.json`) and print the one-line description. This works because paper #2's `built_as` + `outcomes` pattern expects this resolution.
- If a paper has `experiments[]` with mixed statuses (some `completed`, some `planned`), show both so readers see the in-progress work.

## Related

- `/hub-paper-list` — all papers, one row each
- `/hub-paper-verify <slug>` — structural check

## Why exists

A paper's frontmatter carries compact refs (`workflow/safe-bulk-pr-publishing`). Reading the names alone tells a reviewer *what is cited*; expanding them inline tells the reviewer *what each reference actually is*. Same logic extends to `experiments[].built_as`, `proposed_builds[].requires[]`, and `outcomes[].ref` — all of them are useful only when expanded alongside the narrative. That work belongs in the show command, not pushed onto the reader.
