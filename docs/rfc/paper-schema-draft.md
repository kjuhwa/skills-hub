---
doc: paper-schema-draft
status: draft-v0.1
author: kjuhwa@nkia.co.kr
date: 2026-04-24
---

# `paper/` — Hypothesis-Driven Exploration Layer (v0.1)

## 1. Why

The hub already has three primitives:
- **atom** — `skill`, `knowledge` (verifiable: does it resolve, does it run?)
- **recipe** — `technique` (verifiable: do the composed refs exist?)
- **artifact** — `example` (verifiable: does it visibly work?)

All three live on the **enforcement axis**. You can pass/fail them.

What the hub does *not* have is a first-class place for **"what if" statements** — essays that treat the existing corpus as evidence and propose new directions. Those arguments cannot be pass/fail'd: they are judgment calls. Forcing them through a verify gate would flatten the exploratory content they exist to hold.

`paper/` is the **exploration axis**:

```
atom (knowledge/skill)  →  technique (recipe, verifiable)  ←  enforcement axis
                                   ↓
                            paper (hypothesis + angles + external research)  ←  exploration axis
                                   ↓
                            example / app (concrete instantiation of a paper's proposal)
```

A paper **uses** the enforcement axis (it cites techniques/atoms by path) but is **not reducible** to it. Its value is in what it proposes, not in whether the proposal runs today.

## 2. Boundary with existing concepts

| Concept | Mode | Unit | Verifiable? | References |
|---|---|---|---|---|
| skill | atom | procedure | yes (frontmatter + runnable) | — |
| knowledge | atom | fact/lesson | yes (frontmatter) | — |
| technique | recipe | composition | yes (refs resolve, no nesting, etc.) | skills + knowledge |
| **paper** | **claim** | **hypothesis** | **structure only** | **techniques + skills + knowledge + external** |
| example | artifact | finished build | visual/runtime | often produced by a paper's proposal |

**Technique vs paper**:
- Technique answers *"how do we do X safely?"*
- Paper answers *"what if we tried X in context Y, and what should we build to test that?"*

**Paper vs RFC/design-doc**:
- An RFC proposes a *change to the hub itself* and wants to be merged.
- A paper stays in `paper/` as a reusable artifact. It may spawn RFCs, but it is not an RFC.
- If a pilot paper turns out to be indistinguishable from an RFC in practice, this layer retracts — see §13.

## 3. Directory and file layout

```
paper/
  <category>/
    <slug>/
      PAPER.md           ← frontmatter + body (required)
      resources/         ← optional: figures, data exports, pdf excerpts
      notes/             ← optional: author notes, discarded drafts, rebuttals
```

Categories reuse `CATEGORIES.md`. No new enum values.

## 4. Frontmatter schema

```yaml
---
version: 0.1.0
name: <slug>
description: <single line, ≤120 chars — the hypothesis summarized>
category: <one of CATEGORIES.md>
tags: [<string>, ...]

premise:                    # REQUIRED — what makes this a paper
  if: <condition statement>
  then: <predicted outcome>

examines:                   # what this paper analyzes (hub refs)
  - kind: technique | skill | knowledge
    ref: <kind-root-relative path>
    role: <free-text, e.g. "subject of analysis", "supporting evidence", "counter-example">

perspectives:               # angles/lenses applied to the subject — at least 2 required
  - name: <short label>
    summary: <1-2 line description of what this angle examines>

external_refs:              # citations found via hub-research or manual
  - title: <string>
    url: <string>
    kind: paper | article | book | video | tool | repo
    relevance: <1 line — why it matters to this paper>

proposed_builds:            # concrete downstream proposals (optional but expected)
  - slug: <kebab-case app/experiment name>
    summary: <what it does, in 1-2 lines>
    scope: poc | demo | production

status: draft               # draft | reviewed | implemented | retracted
---
```

### Field rationale

- **`premise.if/then`** is the gate that distinguishes a paper from a wiki entry. No `if/then`, no paper.
- **`examines[]`** makes the paper **cite-able as structured data**, so future tooling can show "which papers reference this technique/skill?"
- **`perspectives[]`** forces multi-angle analysis — a single-angle paper is really just a note.
- **`external_refs[]`** — `hub-research` feeds into this. An empty list is allowed but flagged as "internal-only" in `hub-paper-list`.
- **`proposed_builds[]`** closes the loop to `example/` and new apps. Papers with no proposed builds are allowed but carry a `pure-analysis` tag.
- **`status`** — retracted papers stay in the tree (historical record) but are ranked last in search.

## 5. Body structure (recommended, not enforced)

```
# <Title>

## Premise
... expand the if/then from frontmatter with supporting intuition.

## Background
... what corpus pieces are we examining (cite examines[]).

## Perspectives
### <perspective 1 name>
...
### <perspective 2 name>
...

## External Context
... cite external_refs[]; synthesize.

## Proposed Builds
### <build slug>
... what to build, why this paper's claims require it.

## Open Questions
## Limitations
```

Body format is free markdown. The frontmatter is the structured surface.

## 6. Verification rules (structure-only, v0.1)

Unlike technique which verifies **refs + role + binding consistency**, paper verification is deliberately narrow — it guards **structure**, never **substance**.

1. `premise.if` and `premise.then` both non-empty strings.
2. `examines[]` non-empty, every `ref` resolves to an actual file (same path convention as technique: kind-root-relative).
3. `perspectives[]` length ≥ 2 (a single-angle paper is not a paper).
4. `description` ≤ 120 chars.
5. `name` equals the containing directory name.
6. `status` ∈ {draft, reviewed, implemented, retracted}.
7. No check on `external_refs` URL reachability (too flaky, too online-dependent).
8. No check on whether `proposed_builds` actually exist under `example/` (that's what the `implemented` status is for).

**What is NOT verified** (intentionally):
- The claims in `premise`.
- The accuracy of `perspectives[].summary`.
- The quality or real existence of `external_refs[]`.
- Whether the paper is "good".

A paper either asserts correct things or it doesn't. That is a reviewer job, not a lint job.

## 7. v0 scope limits (revisitable in v0.2)

- **No paper-to-paper references** in `examines[]`. Academic papers cite papers, so this is uncomfortable — but in v0 the same cycle/coupling risk applies as with technique nesting. Revisit once we have ≥5 papers.
- **No rich citation format** (BibTeX, DOI, etc.). External refs stay free-form URL + title.
- **No schema for `perspectives[]` names** (like "theoretical", "economic", "ethical"). Free text. We'll propose a controlled vocabulary only if we see 10+ papers converge on the same labels.

## 8. Lifecycle

```
draft (.paper-draft/)   ──►  reviewed   ──►  implemented    ──►  retracted (if disproven)
                                   ↓              ↓                        ↑
                            (peer review)   (a proposed_build landed    (author withdraws,
                                            in example/ and the         reviewer rejects,
                                            paper's claim was tested)   or later evidence
                                                                         overturns it)
```

Transition criteria are social (reviewer, author, time). Not enforced by tooling.

## 9. Registry and index integration

Additive (same pattern as technique):

```json
{
  "version": 3,
  "skills": { ... },
  "knowledge": { ... },
  "techniques": { ... },
  "papers": {
    "<cat>/<slug>": {
      "category": "workflow",
      "scope": "global",
      "path": "~/.claude/papers/<cat>/<slug>/",
      "installed_at": "2026-04-24",
      "version": "0.1.0",
      "status": "draft",
      "examines_snapshot": [
        {"kind":"technique","ref":"workflow/safe-bulk-pr-publishing","resolved_version":"0.1.0-draft"}
      ]
    }
  }
}
```

`index.json` adds `kind: "paper"` entries with `status`, `examines_count`, and `proposed_builds_count` alongside the standard fields.

## 10. Slash commands (v0 minimum)

- `/hub-paper-compose <slug>` — interactive authoring. Premise is first prompt ("what if"). Then examines (with hub-find integration). Then perspectives (≥2 required). Optional external_refs (suggests `/hub-research` if empty). Optional proposed_builds.
- `/hub-paper-verify <slug>|--all` — structural lint per §6.
- `/hub-paper-list [--status ...]` — list local papers.
- `/hub-paper-show <slug>` — body + expanded examines (inline atom descriptions).
- `/hub-find --kind paper <query>` — unified search integration.

Deferred to v0.2: `/hub-paper-publish`, `/hub-paper-spawn-build` (auto-scaffold example/ from proposed_builds entry).

## 11. Failure mode (explicit)

If the first pilot paper reads like any of the following, **retract the `paper/` layer**:

- A blog post with extra YAML ceremony.
- An RFC that should have been an RFC.
- A README section that should have been on the technique it references.
- A skill description stretched across multiple files.

The layer earns its keep only if it produces **something a technique or knowledge entry could not have held**. The pilot test this.

## 12. Open issues

- **Q1.** `examines[]` allowing `kind: paper`? → NO in v0. Revisit after ≥5 real papers. Citation graphs matter but cycle risks + premature complexity outweigh the benefit today.
- **Q2.** `proposed_builds[]` should link to `example/` when implemented? → YES, proposed. Add optional `example_ref: <ref>` to each proposed_build once status→implemented.
- **Q3.** External refs reachability check? → NO in v0 lint. Maybe a weekly CI job, separate scope.
- **Q4.** Reviewer field in frontmatter for transition `draft → reviewed`? → Deferred. Social workflow first, metadata later.
- **Q5.** Language policy? → Same as hub-wide convention: English for `PAPER.md` body that ships in the hub. (Per feedback from the technique rollout.)

## 13. Pilot candidate

**Paper 1 (meta)**: *"Does a technique/ middle layer in a skill hub produce durable composition value beyond hub-merge?"*

- Premise:
  - **IF** a skills-hub adds a `technique/` layer that composes atoms by reference (not by copy),
  - **THEN** the layer produces distinct downstream value — reusable recipes that survive atom updates, cross-domain stress-test (n=2+), and a path for papers/apps to cite recipes as a unit — that cannot be reproduced by `hub-merge` alone.
- Examines:
  - `technique/workflow/safe-bulk-pr-publishing` (pilot #1, linear shape)
  - `technique/debug/root-cause-to-tdd-plan` (pilot #2, branching shape)
  - `docs/rfc/technique-layer.md` (RFC §4 path-category finding as evidence)
  - `docs/rfc/technique-schema-draft.md` (schema as subject)
- Perspectives (≥2 required):
  - **Maintainability** — how does technique fare when a composed atom is renamed/moved? (See §4 finding.)
  - **Cognitive load** — does a user searching `/hub-find "safe pr publish"` benefit from a technique hit vs 4 separate atom hits?
  - **Research integration** — how does a paper cite a technique? (This very paper, recursively.)
  - **Rollout cost** — the 13-PR chain that shipped this layer; is the pattern replicable?
- External refs (to gather via `/hub-research`):
  - Any prior work on "composition layers between primitive and application" in developer tool ecosystems.
  - UNIX philosophy on stdin/stdout vs libraries.
  - Functional composition literature.
- Proposed builds:
  - `/hub-paper-*` commands themselves (the paper's output is also its own tooling — self-referential pilot).
  - A 3rd technique in a domain untouched by the first two (e.g. `security/...`) to further stress the schema's generality.
  - A `/hub-make` variant that accepts a paper's `proposed_builds[]` list and scaffolds each one.

**Why this pilot**: it uses the hub's actual, shipped-this-session evidence as subject matter. If even a self-referential paper about a shipped feature can't articulate value beyond what the RFC already says, the `paper/` layer should be retracted — which is itself a useful finding (§11).

## 14. Relationship to current rollout-stage work

- `hub-research` (existing skill) feeds `external_refs[]`.
- `hub-make` (existing skill) can consume `proposed_builds[]`.
- `hub-find --kind paper` extension required.
- No new indexes or lint infra beyond mirror-of-technique.

The paper layer rides on existing plumbing. It introduces **one new concept** (premise-driven structure) and **one new verification behavior** (≥2 perspectives, refs resolve, but nothing more).

---

## Request to confirm before step 2

Before authoring pilot 1, confirm:

1. **Verify scope**: structure-only (premise present, examines resolve, ≥2 perspectives). No substance checks. ← proposed
2. **No paper-nesting in v0**: `examines[].kind` ∈ {skill, knowledge, technique} only. ← proposed
3. **Pilot target**: the meta-paper above (technique layer as subject). ← proposed, but open to an outside-the-session topic if you'd rather start with something that isn't self-referential.

If all three are acceptable, step 2 (author pilot 1) proceeds. Any single "no" redirects the schema.
