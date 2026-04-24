# RFC: `paper/` — Hypothesis-Driven Exploration Layer

- **Status**: draft v0.1
- **Target repo**: `kjuhwa/skills-hub`
- **Author**: kjuhwa@nkia.co.kr
- **Date**: 2026-04-24
- **Local evidence**: 2 pilots (one meta, one domain), 4 slash commands authored + validated, schema doc with explicit retraction criteria

> **Reviewer note**: this RFC follows the `technique/` layer rollout that landed in #1058–#1070 / tags v2.6.14–v2.6.17. It proposes adding **one more axis** to the hub — not another enforcement layer, but an exploration layer for "what if" hypotheses. Detailed read-before-merge: [`docs/rfc/paper-schema-draft.md`](./paper-schema-draft.md).

## 1. Problem

The hub's existing primitives all live on the **enforcement axis** — a reviewer or lint rule can say pass/fail:

| Primitive | Pass/fail test |
|---|---|
| skill | Does it run? Does the frontmatter parse? |
| knowledge | Does the frontmatter parse? |
| technique | Do `composes[]` refs resolve? Is there no nesting? |
| example | Does the build work? |

There is no first-class place for **"what if" arguments** — essays that examine multiple entries together, apply multiple perspectives, incorporate external research, and propose new builds. Those arguments cannot be pass/fail'd: they are judgment calls. Forcing them through the technique verify gate would flatten the exploratory content they exist to hold.

Today such arguments live in scattered places: RFCs (but RFCs propose changes to the hub itself), blog posts (no structure, no cite-able references to the corpus), session transcripts (ephemeral). None of those produce a durable, cite-able artifact that other hub content can reference.

## 2. Proposal

Add `paper/` as a first-class hub directory on a **new axis** — exploration, not enforcement:

```
atom (knowledge/skill)  →  technique (recipe, verifiable)  ←  enforcement axis
                                   ↓
                            paper (hypothesis + angles + external research)  ←  exploration axis
                                   ↓
                            example / app (concrete instantiation)
```

Key property: papers **use** the enforcement axis (they cite techniques/atoms by path) but are **not reducible** to it. Their value is in what they propose, not in whether the proposal runs today.

### Directory

```
paper/
  <category>/
    <slug>/
      PAPER.md           # required
      resources/         # optional
      notes/             # optional
```

Categories reuse `CATEGORIES.md`.

### Frontmatter (core fields)

```yaml
---
version: 0.1.0
name: <slug>
description: <≤120 chars>
category: <CATEGORIES.md>
tags: [...]

premise:                # REQUIRED — what makes this a paper
  if: <condition>
  then: <predicted outcome>

examines:               # hub refs being analyzed
  - kind: skill | knowledge | technique
    ref: <kind-root-relative path>
    role: <free-text>

perspectives:           # ≥2 required — multi-angle analysis
  - name: <short label>
    summary: <1-2 lines>

external_refs: []       # URLs from hub-research (may be empty)
proposed_builds: []     # downstream apps/experiments (may be empty)
status: draft           # draft | reviewed | implemented | retracted
---
```

### Verification scope — structure only

The `/hub-paper-verify` command checks:

1. `premise.if/then` non-empty
2. `examines[]` non-empty + every `ref` resolves on disk
3. `perspectives[]` length ≥ 2
4. `description` ≤ 120 chars
5. `name` == folder
6. `status` in enum

It **deliberately does not check**:

- Claim correctness
- Perspective accuracy
- External-ref URL reachability or quality
- Whether `proposed_builds[]` actually exist

A paper either asserts correct things or it doesn't. That is a reviewer job, not a lint job. This is the single most important design choice in this RFC — see §11.

## 3. Pilot Evidence (n=2)

Two pilots authored locally, both pass the proposed `/hub-paper-verify` rules. Subjects deliberately chosen to stress-test:

| | Paper 1 (meta) | Paper 2 (domain) |
|---|---|---|
| Subject | The `technique/` layer itself | Parallel subagent dispatch economics |
| Self-reference | Strong (cites work shipped this session) | None (cites pre-existing corpus) |
| Examines | technique × 2 + skill × 1 + knowledge × 1 | skill × 3 + knowledge × 1 |
| Premise type | "Does the layer produce durable value?" — meta | "Does the pattern have a break-even point?" — cost model |
| Perspectives | 4 (maintainability / cognition / research integration / rollout cost) | 4 (cost model / instrumentation / cognition / failure modes) |
| Proposed builds | 3 | 3 |
| Verify | PASS (all 6 rules) | PASS (all 6 rules) |

**Finding**: the same frontmatter schema absorbs both paper shapes without modification. The `premise.if/then` pattern works for both "does the layer yield X?" (existential claim) and "does the pattern break at Y?" (threshold claim). The `perspectives[]` free-text `name` field carries the angle labels — `Maintainability` / `Rollout Cost` in paper 1 vs `Cost Model` / `Failure Modes` in paper 2. No DSL needed in v0.

**Self-reference risk discharged**: paper 2 cites only atoms that existed in the hub before this session (`workflow/parallel-bulk-annotation`, `ai/ai-subagent-scope-narrowing`, etc.). If the paper layer only worked for self-referential meta-content, that would be a red flag; paper 2 shows it works on external subject matter.

## 4. Observations (not required changes)

- **External refs empty at draft is common, not a bug**. Both pilots ship with `external_refs[]` empty. §6 rule 7 makes this explicit — reachability and quality of external sources is not a lint concern. `hub-research` can populate them later without changing the paper's structural validity.
- **Proposed builds length is a useful meta-signal**. Paper 1 proposes 3 builds; paper 2 proposes 3. A paper with zero proposed builds is likely a `pure-analysis` paper (tagged as such). A paper with many is likely implementable. Both are valid.
- **Retraction has real force**. §11 of the schema draft says the layer retracts if the first pilot looks like a blog post or an RFC. Paper 1 deliberately examines this in its `Limitations` section — it asserts it passes the test but admits a neutral reviewer is needed. Paper 2 adds counter-evidence: its subject (parallel dispatch threshold) genuinely could not live inside the existing pitfall knowledge entry because the pitfall is one-session observation whereas the paper generalizes to a cost curve + a gate-skill proposal.

## 5. Migration Plan

Zero-disruption, mirrors the `technique/` rollout:

1. **This PR**: merge the directory + schema + 2 pilots only. No tooling yet.
2. Follow-up PR: `bootstrap/commands/hub-paper-*.md` — four slash commands (compose, verify, list, show). Already authored, validated against both pilots offline.
3. Follow-up PR: `/hub-find --kind paper` integration + `_rebuild_index_json.py` walker for `paper/**/PAPER.md`. Same pattern as technique support in #1060.
4. Follow-up PR: `_lint_frontmatter.py` recognizes `PAPER.md` for standard frontmatter lint.
5. Follow-up PR: `README.md` refresh + bootstrap version bump (likely `bootstrap/v2.7.0` given this is a new layer, or `v2.6.18+` if staying in patch track).

Rollback at any step: removing `paper/` directory leaves everything else untouched. Absence of the optional `papers` key in `registry.json` is handled by existing readers.

## 6. Slash Commands (follow-up PR)

Authored and locally validated:

| Command | Role |
|---|---|
| `/hub-paper-compose <slug>` | Premise-first authoring (if/then required before anything else) |
| `/hub-paper-verify <slug>\|--all` | Structure-only validation per §6 |
| `/hub-paper-list [--status ...]` | Local state, grouped by status |
| `/hub-paper-show <slug>` | Body + expanded examines |

**Not in v0**: `/hub-paper-publish`, `/hub-make-from-paper` (scaffolds `example/` from `proposed_builds[]`).

## 7. Open Questions for Reviewers

1. **Nesting**: v0 forbids `examines[].kind: paper`. Academic papers cite papers — the rule is uncomfortable but mirrors the technique v0 nesting ban. Proposed revisit after ≥5 real papers exist.
2. **`kind: doc`** in `examines[]` — should papers be able to cite `docs/rfc/*` or other repo docs directly? Currently they cite them in prose. Small scope to add, low urgency.
3. **Retraction workflow** — `status: retracted` is in the enum, but the transition has no automated guardrails. Should a retracted paper's references get auto-unlinked from papers that cite it? Proposed: no in v0, revisit if cycles matter.
4. **Language policy** — both pilots are English (same convention as the technique rollout). Formally declared in schema §12 Q5.
5. **First substantive reviewer** — paper 1 explicitly acknowledges it cannot self-certify its own retraction criteria. This RFC is the request.

## 8. Local Artifacts

Placed alongside this RFC in the PR:

- `docs/rfc/paper-layer.md` (this file)
- `docs/rfc/paper-schema-draft.md` — full schema spec
- `paper/workflow/technique-layer-composition-value/PAPER.md` — pilot 1 (meta)
- `paper/workflow/parallel-dispatch-breakeven-point/PAPER.md` — pilot 2 (domain)

## 9. What This RFC Does NOT Do

- Not publishing the `/hub-paper-*` command set (deferred one PR).
- Not modifying `/hub-find`, `/hub-status`, or any existing tooling (deferred two PRs).
- Not bumping `registry.json` schema (backward-compatible additive key).
- Not enforcing anything. Directory + schema + two pilots only.
- Not making the case that all future `paper/` entries will be worth merging. The pilot-driven retraction mechanism (§11 of the schema) is the check, not this RFC's assertion.

---

**Request**: approve the directory, schema, and v0 rules. If a reviewer decides the pilots look like RFCs or blog posts rather than papers, the correct response is **retract the layer** per schema §11 — not merge anyway and hope it matures. The honest failure mode is part of the proposal.
