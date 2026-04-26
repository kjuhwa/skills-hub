---
version: 0.3.0-draft
name: cross-domain-necessity-universality
description: "Tests whether 3 necessity papers share universal ordering-criticality — out-of-order violation cost clustering."
type: hypothesis
status: draft
category: arch
tags:
  - cross-domain
  - necessity
  - universality
  - ordering-criticality
  - meta-corpus

premise:
  if: "3 necessity papers (#1160 phase-ordering, #1174 anchor-phase, #1204 figma-inference-order) reach status=implemented and we measure violation cost (out-of-order outcome vs in-order baseline) per paper"
  then: "violation cost clusters within ±2× across 3 domains — common ordering-criticality, not domain-specific accident"

examines:
  - kind: paper
    ref: workflow/soft-convention-phase-ordering-necessity
    note: "necessity #1 — phase ordering (existence sub-question)"
  - kind: paper
    ref: workflow/safe-bulk-pr-anchor-phase-necessity
    note: "necessity #2 — anchor phase (calibration sub-question)"
  - kind: paper
    ref: frontend/figma-prop-inference-precedes-gen-necessity
    note: "necessity #3 — figma-inference order (variant sub-question)"
  - kind: paper
    ref: arch/cross-domain-pareto-generator-universality
    note: "sibling universality #1 (Pareto)"
  - kind: paper
    ref: arch/cross-domain-threshold-cliff-universality
    note: "sibling universality #2 (threshold-cliff)"

perspectives:
  - by: corpus-curator
    view: "if cost clusters across 3 necessity domains, universality cluster completes (3 papers) becoming the 5th stable 3-paper cluster. Meta-shape category itself stable — corpus reaches new structural depth."
  - by: skeptic
    view: "necessity violation cost varies wildly by domain — phase-ordering may be 10× recoverable while anchor-phase may be irrecoverable. ±2× tolerance may be too generous; smaller would refute likely."
  - by: empiricist
    view: "3 necessity papers authored independently across workflow + frontend, less batch-shared methodology than #1196-#1198. Less prone to author-coordination bias."

experiments:
  - name: necessity-violation-cost-comparison
    status: planned
    method: "After 3 necessity papers reach implemented, extract violation cost ratio per paper. Compare across 3 domains via clustering (max-min)/median. Full protocol in body."
    measured: "violation cost ratio per domain; cross-domain spread; recoverability classification per domain"
    result: null
    supports_premise: null
    refutes: "implicit assumption that necessity is identical structure across domains"
    confirms: null

requires:
  - kind: paper
    ref: workflow/soft-convention-phase-ordering-necessity
    note: "necessity #1 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: workflow/safe-bulk-pr-anchor-phase-necessity
    note: "necessity #2 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: frontend/figma-prop-inference-precedes-gen-necessity
    note: "necessity #3 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: arch/cross-domain-pareto-generator-universality
    note: "sibling universality paper — pairs to complete universality cluster"
  - kind: paper
    ref: arch/cross-domain-threshold-cliff-universality
    note: "sibling universality paper — pairs to complete universality cluster (3 → stable)"
---

# Cross-Domain Necessity Universality

> Tests whether 3 necessity papers (#1160/#1174/#1204) share universal ordering-criticality across phase-ordering, anchor-phase, and figma-inference-order domains. **Third cross-domain universality paper** — completes the universality cluster, joining #1210 (Pareto generator) and #1211 (threshold-cliff sharpness) as the **5th stable 3-paper cluster**.

## Introduction

The corpus has 3 necessity papers spanning workflow + frontend domains:

- `#1160 soft-convention-phase-ordering-necessity` — phase ordering monotonic
- `#1174 safe-bulk-pr-anchor-phase-necessity` — anchor PR must be first
- `#1204 figma-prop-inference-precedes-gen-necessity` — inference precedes generation

All three claim that out-of-order execution produces **structurally different (worse) output**, not just slower. The question this paper tests: **is the violation cost (penalty for out-of-order) comparable across domains, or does the structural-difference claim mean different things in different contexts?**

Operationalized: **violation cost ratio** = (out-of-order outcome metric) / (in-order baseline metric).

### Universality cluster completion (3 → stable)

This paper completes the universality cluster as a 3-paper triad:

| Paper | Shape under universality test | Sub-question |
|---|---|---|
| #1210 cross-domain-pareto-generator-universality | Pareto distribution | **Existence** — do 3 Paretos share generator? |
| #1211 cross-domain-threshold-cliff-universality | Threshold-cliff sharpness | **Calibration** — do 3 cliffs share sharpness? |
| **this paper** | Necessity violation cost | **Variant / scale** — do 3 necessities share criticality? |

Per #1205's verdict ("cluster saturates at N=3 covering existence + calibration + variant"), this triad makes **universality the 5th stable 3-paper cluster**. The meta-shape category itself stabilizes — corpus reaches new structural depth.

### Why this matters beyond one cluster

The corpus's first 4 stable clusters describe properties of phenomena: threshold-cliff, necessity, Pareto, self-improvement. The 5th — universality — describes properties of CROSS-PHENOMENA RELATIONSHIPS. This is structurally novel.

If universality reaches stable-cluster status, the corpus has a permanent record of how its own meta-shape category behaves. Future cross-domain claims have a methodological precedent.

### Why the same pre-registration logic applies

Identical to #1210 and #1211: 3 dependency papers status=draft. Filing this paper now coordinates methodology + prevents post-hoc rationalization. The pre-registration pattern is now corpus convention.

### Why universality (NOT cost-displacement)

The cost-displacement framing for this question would have been "as more domains tested, generalization confidence grows but per-domain fit degrades; crossover at optimal domain count."

Wrong shape. The actual claim is **binary cluster-test**: violation cost ratios cluster within tolerance, or they don't. Per #1188's verdict rule, deliberately framed around the actual shape.

## Methods

After all 3 necessity papers reach `status: implemented`:

1. **Extract violation cost per paper**:
   - #1160: cost of phase-disordered convention (e.g., merged PR with ordering violation)
   - #1174: cost of anchor-late publishing (e.g., catalog conflicts, retract count)
   - #1204: cost of component-first inference (e.g., TS errors, fix-up PR count)
2. **Normalize each to ratio** = (out-of-order metric) / (in-order baseline)
3. **Compute clustering ratio** — (max-min) / median across 3 domains
4. **Recoverability classification** per domain — recoverable, partially recoverable, irrecoverable

Hypothesis confirmed if clustering ratio < **1.0** AND all 3 domains in same recoverability class.

### What this paper is NOT measuring

- **Identical violation cost across domains** — only similar; ±2× allowed. Strict equality is implausible.
- **Causal explanation of common cost** — measures whether costs cluster, not why.
- **Cost displacement** — no smooth trade-off; binary cluster-test.
- **Other necessity types** — only the 3 papers in scope. Necessity techniques without papers excluded.

## Results

`status: draft` — all 3 dependency papers status=draft. Result populates after they close.

Expected output table (template):

| Paper | Domain | Out-of-order cost | In-order baseline | Cost ratio | Recoverability |
|---|---|---|---|---:|---|
| #1160 | phase-ordering | TBD | TBD | TBD | TBD |
| #1174 | anchor-phase | TBD | TBD | TBD | TBD |
| #1204 | figma-inference | TBD | TBD | TBD | TBD |
| **Clustering ratio** | — | — | — | TBD | — |

## Discussion

### Why this paper opens a new corpus structural depth

If universality cluster reaches stable status (3 papers), the corpus gains:
- First **stable meta-shape cluster** — relationships across phenomena, not just phenomena
- Empirical methodology for testing cross-domain claims — Pareto, threshold-cliff, necessity all show how
- Cluster-of-clusters depth +1: cluster (single phenomena) + meta-cluster (cross-phenomena) + meta-meta (cross-meta-shape)

If universality cluster forms but no further universality follows, the methodology has demonstrated feasibility but is not generative. The line stops there.

### What would refute the hypothesis

- Cost clustering ratio > 2.0 → necessity violation costs vary too much; different mechanisms despite shared structural claim
- Recoverability classifications differ entirely (one recoverable, one irrecoverable) → necessity is structurally identical but recovery is domain-specific; universality is partial
- 2 of 3 cluster (workflow papers close, frontend outlier) → necessity universality is workflow-conditional; new domains may require independent confirmation

### What partial-support would look like

- Cost ratios cluster within ±1.5× but recoverability differs → universal cost magnitude, domain-specific recovery; useful for ordering-rule prescription, not for recovery planning
- 2 papers cluster tightly + 1 within wider envelope → universality holds for most domains, with named exceptions

## Limitations (planned)

- **N=3 necessity papers is the minimum for cluster claim** — same limitation as #1210, #1211
- **Cost metric varies per paper** — TS errors vs catalog conflicts vs convention violations; normalization is approximate
- **All 3 papers authored by same person** — methodology bias may inflate apparent universality
- **Calendar-bound** — depends on 3 papers reaching implemented; cannot accelerate
- **Recoverability is qualitative** — categorical (recoverable / partially / irrecoverable), not numeric; clustering claim weaker for this dimension

## Provenance

- Authored: 2026-04-26 (post-#1211 threshold-cliff universality)
- Worked example #16 of paper #1188's verdict rule — universality framing, not cost-displacement
- **Third cross-domain universality paper** — completes the universality cluster as the **5TH STABLE 3-PAPER CLUSTER**
- Status `draft` — calendar-bound on 3 dependency papers (#1160, #1174, #1204) reaching implemented
- Pre-registers via same framework as #1210, #1211 — corpus convention now consistent across 3 universality papers
- Sibling paper opportunity: meta-meta paper analyzing the 5 stable clusters' formation rate + saturation pattern (cluster-of-clusters dynamics extension to universality)
