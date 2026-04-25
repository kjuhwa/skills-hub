---
doc: technique-schema-draft
status: draft-v0.1
author: kjuhwa@nkia.co.kr
date: 2026-04-24
---

# `technique/` — Middle-Layer Schema Draft (v0.1)

## 1. Why

Today the hub has **atomic units** (`skills/`, `knowledge/`) and **finished artifacts** (`example/`). In practice, most real work requires combining 2–N atoms in a specific order or with specific conditions to produce a result. The combination itself cannot be stored as a reusable unit anywhere, so users hand-assemble the same sets over and over.

`technique/` is the missing **middle layer**:

```
knowledge  ─┐
skill      ─┼──►  technique  ──►  example (instance)
research   ─┘
```

- A technique **references** skills/knowledge without duplicating them (no content copy).
- Gaps in coverage are filled by `hub-research` and folded into the technique body.
- An `example` is a one-off artifact produced by executing a technique; the technique is the **reproducible recipe**.

## 2. Boundary with existing concepts

| Concept | Location | Unit | Reusability | Composition |
|---|---|---|---|---|
| skill | `skills/{cat}/{slug}/SKILL.md` | atomic procedure | high | single |
| knowledge | `knowledge/{cat}/{slug}.md` | atomic fact/lesson | high | single |
| **technique** | `technique/{cat}/{slug}/TECHNIQUE.md` | **composition recipe** | **high** | **multiple references** |
| example | `example/{cat}/{slug}/` | finished artifact | low (demo) | artifact only |
| hub-merge | command | merge (copy/absorb) | — | one-time |

Difference from `hub-merge`: merge **absorbs and destroys** the source skills; a technique leaves the atoms intact and only **references** them. That preserves atom independence so other techniques can reuse the same atoms.

## 3. Directory and file layout

```
technique/
  <category>/
    <slug>/
      TECHNIQUE.md         ← frontmatter + body (required)
      verify.sh            ← composition check script (optional)
      resources/           ← auxiliary assets (optional: images, samples)
```

Categories reuse the existing `CATEGORIES.md`. No new categories are introduced for techniques (use tags for fine-grained attributes).

## 4. Frontmatter schema

```yaml
---
version: 0.1.0                  # semver, draft-0 allowed
name: <slug>                    # must match the directory name
description: <single line, ≤120 chars>   # when to use it, 1 sentence
category: <one of CATEGORIES.md>
tags: [<string>, ...]

composes:                       # the core field: which atomic units are combined
  - kind: skill                 # skill | knowledge
    ref: workflow/autoplan      # kind-root-relative physical path
                                # ※ can diverge from frontmatter category,
                                #   so use the actual path (pilot finding)
    version: "^1.0.0"           # semver range (loose) or exact value (pinned)
    role: orchestrator          # short label (≤30 chars) — this atom's job in the composition
    note: optional long-form prose if you need to explain the role in narrative
  - kind: knowledge
    ref: workflow/batch-pr-conflict-recovery
    version: "*"                # any version allowed
    role: failure-mode

requires_research:              # optional: external research gaps
  - topic: "GitHub GraphQL rate limit"
    rationale: "hub-research needed to confirm current quota"

binding: loose                  # loose (default) | pinned
                                #   loose: passes as long as the version range is satisfied
                                #   pinned: exactly that version/commit only

verify:                         # optional runtime sanity checks
  - "every composes.ref is currently installed"
  - "every composes[].version range intersects the installed version"
  - cmd: "./verify.sh"          # custom verification
---
```

## 5. Binding mode (the key tradeoff)

| Mode | Behaviour | Pros | Cons |
|---|---|---|---|
| `loose` (default) | references by semver range, re-validates installed version at use time | absorbs downstream skill updates automatically | downstream breaking changes require technique re-verification |
| `pinned` | locked to a specific version (or commit SHA) | 100 % reproducibility | grows stale as downstream skills evolve |

**Recommendation**: start every technique at `loose`. Reserve `pinned` for production/audit paths. `hub-precheck` should warn when a `pinned` technique references a version that no longer exists in the hub.

## 6. Lifecycle

```
draft (.technique-draft/)   ──►  publish (technique/)   ──►  outdated (auto-flagged)
     ▲                                                              │
     └─── hub-refactor, hub-split ────────────────────────────────┘
```

- `.technique-draft/`: local staging area, mirroring `.skills-draft/`/`.knowledge-draft/`.
- Publish promotes to `technique/{cat}/{slug}/`.
- **Outdated detection**: when a referenced skill/knowledge has a new major version, the technique is tagged `outdated: true` in `index.json`. `hub-precheck` surfaces the report.

## 7. Registry integration

`~/.claude/skills-hub/registry.json` extension:

```json
{
  "version": 3,                 // bump 2 → 3
  "skills": { ... },
  "knowledge": { ... },
  "techniques": {               // new section
    "<cat>/<slug>": {
      "category": "workflow",
      "scope": "global",
      "path": "~/.claude/techniques/<cat>/<slug>/",
      "installed_at": "2026-04-24",
      "version": "0.1.0",
      "source_commit": "<sha>",
      "pinned": false,
      "composes_snapshot": [    // resolved versions at install time
        {"kind":"skill","ref":"workflow/autoplan","resolved_version":"1.2.3"},
        {"kind":"knowledge","ref":"workflow/batch-pr-conflict-recovery","resolved_version":"0.1.0"}
      ]
    }
  }
}
```

`composes_snapshot` provides post-hoc traceability — in `loose` mode it is the single source of truth for "what resolved to what at install time" when debugging a broken technique.

## 8. index.json integration

Add a `technique` kind to the master/lite/category indexes. Search (`hub-find`) matches skills/knowledge/techniques uniformly but renders a `kind: technique` badge on result rows for differentiation.

## 9. Verification rules (publish and precheck)

1. Every `composes[].ref` resolves to an **actual file** in the hub (checked against the filesystem, independent of declared category).
2. Every `version` range has a **non-empty intersection** with the installed version.
3. No circular references: a technique **must not** reference another technique (v0 permits flat 1-depth only; nesting is deferred to v0.2).
4. `description` is required and ≤120 chars.
5. `name` equals the containing directory name.
6. If `verify.sh` exists it must exit 0.
7. `ref` is kind-root-relative physical path (e.g. `workflow/parallel-build-sequential-publish` or `pitfall/gh-pr-create-race-with-auto-merge`).

## 10. Slash commands (implemented in step 3, listed here for reference)

- `/hub-technique-compose <slug>` — draft authoring workflow (skill/knowledge selection → frontmatter generation)
- `/hub-technique-list` — installed technique list
- `/hub-technique-show <slug>` — body + composition expansion
- `/hub-technique-install <ref>` — install from remote
- `/hub-technique-verify <slug>` — validate `composes[]` state
- Existing `/hub-find`, `/hub-status`, `/hub-precheck` are **extended** to read the new section

## 11. Open issues

- **Q1.** Should technique-to-technique composition be allowed? → No in v0. Risk of coupling and cycles. Revisit in v0.2.
- **Q2.** Should `loose` mode carry a lockfile? → `composes_snapshot` is judged sufficient. No separate lockfile.
- **Q3.** Link examples to techniques? → Proposal: add optional `produced_by_technique: <ref>` field to `example/` frontmatter. Separate PR, outside this doc's scope.
- **Q4.** Add a category? → Not needed. Existing categories + tags cover the space.
- **Q5.** (Found in pilot #2) `composes[]` is currently an **unordered set**. A linear pipeline can be expressed via role labels like "phase-0-anchor"; a branching decision tree is expressed only in prose. v0 accepts this (free-text `role` is sufficient). A formal phase/branch DSL is deferred to v0.2 pending more pilots.

## 12. Pilot candidates (input to step 2)

Once this schema is approved, the first technique comes from one of these pairings:

- `workflow/autoplan` + `workflow/batch-pr-conflict-recovery` → **"Safe bulk PR automation"**
- Alternative: the already-installed `swagger-ai-optimization` alone — useful as a negative test case (a single skill is **not** a technique, which itself verifies the schema)

---

**Next step.** Confirm the following three points from this draft:
1. Default binding (`loose` proposed)
2. v0 nesting ban (proposed)
3. Pilot-candidate selection

Once confirmed, proceed to step 2 (author the first pilot technique).

---

## 13. v0.2 amendment — LLM-consumption optimization (proposed 2026-04-26)

> **Why**: v0.1 stores composition correctly (`composes[]` resolves, version ranges intersect, no nesting). It does not store the **decision-time signal** an LLM needs at code-write time — "should I apply *this* technique here?" That answer lives in the body (`## When to use`, `## When NOT to use`, `## Known limitations`), which is unstructured prose and requires a full read. v0.2 makes the decision signal machine-extractable: `recipe.one_line` (action-oriented), `recipe.preconditions[]`, `recipe.anti_conditions[]`. Same posture and self-corrective gate as paper §15.

### 13.1 New frontmatter fields

```yaml
recipe:                              # populated when authoring under v0.2
  one_line: <≤200 chars — "use this when X to get Y; do not use when Z">
  preconditions:                     # observable conditions for use
    - <each condition the caller must verify before applying>
  anti_conditions:                   # observable disqualifiers
    - <each condition that disqualifies use>
  failure_modes:                     # advisory: signal → atom mapping
    - signal: <observable failure during application>
      atom_ref: <kind:ref pointing to a composes[] entry>
      remediation: <one-line recovery>
  assembly_order:                    # advisory: explicit phase sequence
    - phase: <step name>
      uses: <role from composes[] or "ad-hoc">
      branches:                      # optional decision tree
        - condition: <when this branch fires>
          next: <next phase or "done">
```

### 13.2 New verification rules

**Required** (FAIL — `/hub-technique-verify` enforces when `recipe:` block is present):

R1. `recipe.one_line` non-empty (≥1 char after strip).
R2. `recipe.preconditions` length ≥ 1.
R3. `recipe.anti_conditions` length ≥ 1.

**Advisory WARN** (informational, never FAIL):

A1. `recipe.failure_modes` empty when any `composes[].ref` starts with `pitfall/` (the technique cites a pitfall but doesn't tell the caller what failure to watch for).
A2. `recipe.assembly_order` empty when `composes[].length >= 3` (likely a pipeline whose order matters; surface it).
A3. `recipe.failure_modes[i].atom_ref` does not match any `composes[].ref` (failure tagged to an atom not in the recipe — likely typo).

**Backward compatibility**: techniques without a `recipe:` block (all 19 current) remain valid v0.1 techniques. `/hub-technique-verify` continues to apply v0.1 rules 1-7. The R1-R3 rules fire only when `recipe:` is present.

### 13.3 Injection contract

When `/hub-find`, `/hub-suggest`, or pre-implementation hook surfaces a technique:

| Has `recipe.one_line`? | What gets shown |
|---|---|
| yes (v0.2-compliant) | `recipe.one_line` — action-first |
| no (v0.1 only) | `description` — current behavior |

Mirrors paper §15.3 verdict-first contract. The same three rendering surfaces (text / JSON / HTML in `hub_search.py`) get updated.

### 13.4 Why these specific fields (LLM-consumption rationale)

- **`recipe.one_line`** — highest-bandwidth field for injection. One imperative sentence that tells the LLM what to do and skip the body.
- **`recipe.preconditions[]`** — the first question LLM asks at decision time: "do current circumstances justify this technique?" Each entry is one observable check.
- **`recipe.anti_conditions[]`** — the symmetric question: "is there any circumstance here that disqualifies it?" Currently buried in body `## When NOT to use`. Promoting to frontmatter prevents the LLM from missing it.
- **`recipe.failure_modes[]`** — when the technique misbehaves, which atom is the canonical place to look? Pitfall-citing techniques carry this knowledge in roles like "counter-evidence" but the *signal → atom* mapping is opaque. Structured form makes troubleshooting a metadata read.
- **`recipe.assembly_order[]`** — the schema explicitly accepts `composes[]` as an unordered set (§11 Q5). For multi-atom techniques the order matters; encoding it as a structured list lets LLM apply the technique without inferring sequence from body diagrams.

### 13.5 What is still NOT verified (intentionally)

Carrying the v0.1 stance: **structure only, never substance**.

- `recipe.one_line` non-empty does not mean it's *correct*. Reviewer judgement.
- `recipe.preconditions` accuracy is not checked — the lint cannot decide whether "error rate observable per-flag" is a good or bad precondition.
- `recipe.failure_modes[i].remediation` is not validated against any external reality; it's a claim the author makes.

### 13.6 Self-corrective gate

If `recipe.one_line` adoption stays below 30 % across published techniques after 90 days (= 2026-07-25 from this amendment merge), the v0.2 fields are a candidate for retraction. Same stance as §11 (technique layer retraction) and paper §15.6 (v0.3 retraction). The amendment earns its keep only if authors find the LLM-injection win worth the extra fields.

### 13.7 Why v0.2 not v0.1.x

v0.1.x amendments would be additive without changing what `/hub-find` *shows*. v0.2 changes the injection contract (§13.3) — for v0.2-compliant techniques, search displays `recipe.one_line` instead of `description`. Consumer-facing behaviour change → minor version bump.

### 13.8 Migration

- All v0.2 fields OPTIONAL on existing v0.1 techniques. No migration required.
- New `_audit_technique_v02.py` reports per-technique compliance + corpus adoption rate. Informational only — same posture as `_audit_paper_v03.py`.
- `/hub-technique-compose` v0.2 generates `recipe:` block by default at compose time.
- `/hub-technique-extract-recipe <slug>` (proposed): heuristic backfill — reads body `## When to use` / `## When NOT to use` / `## Known limitations` and proposes draft `recipe:` block for author review (mirror of `/hub-paper-extract-verdict`).

### 13.9 Migration plan (3-PR series, mirrors paper v0.3 rollout)

This amendment ships in three sequential PRs:

1. **§13 schema amendment** (this PR) — defines the `recipe:` block and the verification rules. No code change.
2. **`_audit_technique_v02.py`** — informational reporter wired into `precheck.py`. Establishes baseline (which techniques opt-in, by how much).
3. **Dogfood 2-3 techniques** — populate `recipe:` on the most-cited techniques (`workflow/safe-bulk-pr-publishing`, `debug/root-cause-to-tdd-plan` per the citation graph). Validates the field shapes against real techniques before the convention spreads.

After the 3 PRs land, `/hub-find` injection contract update (paper §15.3 analogue) ships separately to swap `description` for `recipe.one_line` on v0.2-compliant techniques in the search render path.
