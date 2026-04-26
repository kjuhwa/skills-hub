---
version: 0.3.0-draft
name: cross-domain-threshold-cliff-universality
description: "Tests whether 3 threshold-cliff papers share universal cliff sharpness — discontinuity ratio clustering test."
type: hypothesis
status: draft
category: arch
tags:
  - cross-domain
  - threshold-cliff
  - universality
  - cliff-sharpness
  - meta-corpus

premise:
  if: "3 threshold-cliff papers (#1196 quorum decision, #1197 killswitch trip, #1198 vote quorum) reach status=implemented and we measure discontinuity ratios per cliff"
  then: "discontinuity ratios cluster within 10× across the 3 domains — common cliff-sharpness pattern, not domain-specific accident"

examines:
  - kind: paper
    ref: arch/quorum-decision-latency-cliff
    note: "threshold-cliff #1 — atomic consensus (existence sub-question)"
  - kind: paper
    ref: arch/killswitch-trip-threshold-calibration
    note: "threshold-cliff #2 — single-component circuit (calibration sub-question)"
  - kind: paper
    ref: testing/quorum-vote-threshold-by-consumer-reliability
    note: "threshold-cliff #3 — distributed vote (variant sub-question)"
  - kind: paper
    ref: arch/cross-domain-pareto-generator-universality
    note: "sibling universality paper (#1210) — same framework applied to threshold-cliff"

perspectives:
  - by: corpus-curator
    view: "if cliff sharpness clusters across 3 domains, universality of threshold-cliff joins Pareto in the meta-shape category. Two universality papers form forming-cluster (1 → 2)."
  - by: skeptic
    view: "cliff sharpness depends on noise floor + measurement window — quorum has microsecond-level cliff, killswitch has minute-level. The 10× tolerance may be too generous; tighter would refute likely."
  - by: empiricist
    view: "3 threshold-cliff papers (#1196-#1198) shared sub-question intent (existence, calibration, variant) by author design. Methodology may already converge; universality test partly tautological."

experiments:
  - name: cliff-sharpness-comparison
    status: planned
    method: "After 3 papers reach implemented, compute discontinuity ratio per paper. Compare ratios across 3 domains via clustering (max-min)/median. Full protocol in body."
    measured: "discontinuity ratio per domain; cross-domain spread; smearing-mechanism breakdown per domain"
    result: null
    supports_premise: null
    refutes: "implicit assumption that the 3 threshold-cliff papers measured the same shape but with vastly different sharpness"
    confirms: null

requires:
  - kind: paper
    ref: arch/quorum-decision-latency-cliff
    note: "threshold-cliff #1 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: arch/killswitch-trip-threshold-calibration
    note: "threshold-cliff #2 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: testing/quorum-vote-threshold-by-consumer-reliability
    note: "threshold-cliff #3 — must reach implemented before cross-domain comparison"
  - kind: paper
    ref: arch/cross-domain-pareto-generator-universality
    note: "sibling universality paper — pairs to start universality cluster forming (1 → 2)"
---

# Cross-Domain Threshold-Cliff Universality

> Tests whether 3 threshold-cliff papers (#1196/#1197/#1198) share universal cliff sharpness across atomic consensus, single-component circuits, and distributed votes. **Second cross-domain universality paper** — joins #1210 (Pareto generator) to start the universality cluster forming (1 → 2).

## Introduction

The corpus has 3 threshold-cliff papers, each in a distinct domain:

- `#1196 quorum-decision-latency-cliff` — atomic consensus (cliff at N/2+1 available peers)
- `#1197 killswitch-trip-threshold-calibration` — single circuit (cliff at error rate %)
- `#1198 quorum-vote-threshold-by-consumer-reliability` — distributed vote (cliff at quorum count)

All three predict discontinuous behavior at a threshold. The question this paper tests: **is the cliff sharpness comparable across domains, or do they share only the binary structure but differ wildly in how sharp the discontinuity is?**

Sharpness is operationalized as **discontinuity ratio** = (median behavior just past threshold) / (median behavior just below). The 3 papers each report this internally; cross-domain comparison was not within their scope.

### Universality cluster sub-question pair (forming)

This paper joins #1210 (cross-domain Pareto generator universality) as the second universality paper. Each tests a different shape category for cross-domain consistency:

| Paper | Shape under universality test | Sub-question |
|---|---|---|
| #1210 cross-domain-pareto-generator-universality | Pareto distribution | Existence (do 3 Pareto papers share generator?) |
| **this paper** | Threshold-cliff | Calibration (do 3 threshold-cliffs share sharpness?) |

A future 3rd universality paper (variant sub-question) would complete the cluster — natural candidate: necessity universality across #1160/#1174/#1204.

### Why the same pre-registration logic applies

Identical to #1210's framework: 3 dependency papers all status=draft. Filing this paper now (before measurements) coordinates methodology and prevents post-hoc rationalization. The pre-registration pattern is itself a corpus convention now — cross-domain universality papers file BEFORE dependencies measure.

If both this paper and #1210 land with positive results, the universality category gains forming-cluster status (2 papers, calibration + existence sub-questions covered). A 3rd universality paper would close the triad.

### Why universality (NOT cost-displacement)

Cost-displacement framing for this question would have been "as more domains tested, generalization confidence grows but per-domain fit degrades; crossover at optimal domain count." Wrong shape.

The actual claim is **binary cluster-test**: discontinuity ratios cluster within tolerance, or they don't. Per #1188's verdict rule, deliberately framed around the actual shape.

## Methods

After all 3 threshold-cliff papers reach `status: implemented`:

1. **Extract empirical discontinuity per paper**:
   - #1196: median consensus latency at quorum / at quorum-1
   - #1197: false-trip rate at threshold / at threshold-1%
   - #1198: false-pass rate at quorum / at quorum-1
2. **Normalize to dimensionless ratio** — cliff is "x times sharper at threshold", domain-independent measure
3. **Compute clustering ratio** — (max - min) / median across 3 domains
4. **Smearing mechanism breakdown** — per domain, list which mechanism (failure-detector timeout, optimistic over-collection, network jitter, fleet variance) most dominates the smear

Hypothesis confirmed if clustering ratio < **1.0** (i.e., spread of discontinuity ratios within 1× of median).

### What this paper is NOT measuring

- **Same threshold value across domains** — only sharpness; threshold positions are domain-specific (N/2+1 vs error% vs vote count)
- **Causal explanation** — measures whether cliffs are equally sharp, not why
- **Cost displacement** — no smooth trade-off claim; just binary cluster-test
- **Other cliff types** — only the 3 papers in scope; threshold-cliff techniques without papers (e.g., feature-flag-killswitch from #1140) excluded

## Results

`status: draft` — all 3 dependency papers are status=draft. Result populates after they close.

Expected output table (template):

| Paper | Domain | Threshold | Discontinuity ratio | KS goodness-of-fit | Top smearing mechanism |
|---|---|---|---:|---|---|
| #1196 | atomic consensus | N/2+1 | TBD | TBD | TBD |
| #1197 | single circuit | error% | TBD | TBD | TBD |
| #1198 | distributed vote | quorum count | TBD | TBD | TBD |
| **Clustering ratio** | — | — | TBD | — | — |

## Discussion

### What this paper opens (universality cluster forming)

If clustering holds (ratio < 1.0), the corpus gains:
- Second cross-domain universality paper after #1210
- Empirical evidence that threshold-cliff is a transferable shape — operators in new domains can default to "expect 10×-ish discontinuity"
- Universality cluster enters forming-cluster regime (1 → 2 papers)

If clustering fails (ratio > 2.0), the corpus learns:
- Threshold-cliff structure (binary discontinuity) is universal but sharpness is domain-specific
- Universality may be a sub-property limit, not a cross-shape generalization
- New universality papers should test more axes (sharpness + position + smearing) for partial universality

### What would refute the hypothesis

- Clustering ratio > 2.0 → cliff sharpness varies more than 1× of median across domains; no common pattern
- One domain dominates the spread (e.g., killswitch ratio is 100× quorum) → universality is partial; pair-wise comparison may still hold for matching domains
- Smearing mechanism dominance differs entirely (#1196 = failure-detector, #1197 = sliding-window, #1198 = consumer-reliability) → universality must account for smearing per-domain; common pattern obscured

### What partial-support would look like

- Clustering ratio in [0.5, 1.5] → universality is moderate, useful as guidance but not as default
- 2 of 3 domains cluster (#1196 + #1198 close, #1197 outlier) → universality holds within distributed-quorum cliffs; single-component cliffs are distinct

## Limitations (planned)

- **N=3 cliff papers is the minimum for cluster claim** — same limitation as #1210; meta-cluster of 5+ would be stronger
- **All 3 papers authored by same person** — methodology bias may inflate apparent universality
- **Calendar-bound on dependency closure** — cannot accelerate without compromising pre-registration
- **Discontinuity ratio is one of multiple sharpness measures** — slope at threshold, second derivative, transition width are alternatives that may give different conclusions
- **3 dependency papers may shape findings indirectly** — if measurement methodology converges across the 3 (because shared author), apparent universality is partly self-fulfilling

## Provenance

- Authored: 2026-04-26 (post-#1210 cross-domain Pareto universality)
- Worked example #15 of paper #1188's verdict rule — universality framing, not cost-displacement
- **Second cross-domain universality paper** — joins #1210 to start the universality cluster forming (1 → 2)
- Status `draft` — calendar-bound on 3 dependency papers (#1196, #1197, #1198) reaching implemented
- Pre-registers via same framework as #1210 — corpus convention now: universality tests file BEFORE dependencies measure
- Sibling paper opportunity: cross-domain necessity universality across #1160/#1174/#1204 → 3rd universality paper completes cluster (5th stable 3-paper cluster)
