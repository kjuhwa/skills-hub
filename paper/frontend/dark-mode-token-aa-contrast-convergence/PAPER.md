---
version: 0.3.0-draft
name: dark-mode-token-aa-contrast-convergence
description: "Tests whether Claude's dark-mode mirror converges to AA in ≤3 iterations — convergence threshold variant."
type: hypothesis
status: draft
category: frontend
tags:
  - dark-mode
  - contrast
  - convergence
  - threshold-satisfaction
  - non-cost-displacement

premise:
  if: "we run dark-mode-token-mirror-via-claude (#1202 batch) with AA contrast lint as the gate across 20 representative light-mode token sets"
  then: "Claude converges to AA-passing dark mirror in ≤3 iterations on average; failures (>5 iter) cluster on tokens whose AA satisfaction requires brand-palette-external hues"

examines:
  - kind: technique
    ref: frontend/dark-mode-token-mirror-via-claude
    note: "the technique whose contrast-iteration convergence this paper tests"
  - kind: paper
    ref: frontend/figma-claude-react-iteration-convergence
    note: "sibling — pixel-diff sub-question vs this threshold sub-question"

perspectives:
  - by: technique-author
    view: "the technique mandates AA gate but doesn't bound iteration count. The paper measures whether the loop is fast (≤3) or stalls when brand constraints conflict with contrast math."
  - by: skeptic
    view: "AA contrast is a binary threshold; iteration may oscillate around it without converging if Claude flips between two near-AA values. Convergence is hypothesis, not given."
  - by: corpus-curator
    view: "second convergence paper, joining #1201. Sub-question pair: asymptotic decay (#1201, pixel diff → 0) vs threshold satisfaction (this paper, contrast ≥ 4.5:1). Cluster starts forming."

experiments:
  - name: aa-iteration-vs-convergence-rate
    status: planned
    method: "20 light token sets × 5 palette categories. Run dark-mirror loop with AA gate; cap at 10 iter. Record iter-to-AA + failure causes. Full protocol in body."
    measured: "iter-to-AA per token; failure rate at iter cap; failure causes (brand-conflict, oscillation, palette-exhaustion)"
    result: null
    supports_premise: null
    refutes: "implicit assumption that AA satisfaction is always reachable within Claude's iteration budget"
    confirms: null

requires:
  - kind: technique
    ref: frontend/dark-mode-token-mirror-via-claude
    note: "the technique under test"
  - kind: paper
    ref: frontend/figma-claude-react-iteration-convergence
    note: "first convergence paper — establishes pixel-diff sub-question; this paper adds threshold-satisfaction sub-question"
---

# Dark-Mode Token AA-Contrast Convergence

> Tests whether Claude's dark-mode token mirror loop converges to AA contrast within ≤3 iterations on average. **Second convergence-shape paper** — joins #1201 (pixel-diff convergence) to start the convergence cluster forming. Sub-question pair: asymptotic decay (#1201) vs threshold satisfaction (this paper).

## Introduction

The technique `frontend/dark-mode-token-mirror-via-claude` (from the #1202 batch) feeds Claude a light-mode token map + brand constraints, asks for a dark-mode mirror, then runs an AA contrast lint as the gate. Failed contrast → re-iterate. The technique mandates the gate but doesn't bound how many iterations might be needed.

This paper measures the convergence behavior. Two non-trivial questions:

1. **Average iteration count to AA satisfaction** — is the loop fast enough to be operationally viable (≤3 ideal)?
2. **Failure causes** — when convergence fails (≥5 iterations), is it palette-conflict (brand color physically can't satisfy AA) or oscillation (Claude flips between two near-AA values)?

### Convergence cluster sub-question pair

| Paper | Sub-question variant | Endpoint |
|---|---|---|
| #1201 figma-claude-react-iteration-convergence | **Asymptotic decay** | pixel diff → 0 (continuous shrinking) |
| **this paper** | **Threshold satisfaction** | contrast ≥ 4.5:1 (binary cliff to satisfy) |

Both are convergence-shape but the endpoint differs. #1201 has continuous improvement past the threshold; this paper's loop stops at threshold-cross. The pair forms a 2-paper cluster (forming) per #1205's saturation rule.

### Why convergence (NOT cost-displacement, threshold-cliff, log-search, hysteresis, Pareto, necessity)

The cost-displacement framing for this question would have been:

> "as iterations grow, generation cost grows but contrast-failure cost shrinks; crossover at optimal iteration cap"

Wrong shape. The actual claim:

- **N=1**: Claude's first guess, may fail AA on some tokens
- **N=2-3**: per-iteration improvement on failed tokens (Claude adjusts hue/lightness)
- **N=4-5**: rare convergence cases (brand-conflict tokens may oscillate)
- **N>5**: failure cases — palette doesn't physically support AA for that token

This is **convergence with binary endpoint** — bounded sequence reaching a threshold (or failing to). Per #1188's verdict rule, this paper deliberately frames around the actual shape (convergence) rather than retrofit cost-displacement.

## Methods

For each of 20 light-mode token sets:

1. Source diversity — pick 4 from each of: warm-dominant palette, cool-dominant, neutral, high-saturation, monochrome (5 categories × 4 sets = 20)
2. Feed to `dark-mode-token-mirror-via-claude` with AA gate (4.5:1 normal text, 3:1 large text)
3. Loop up to N=10 iterations:
   - Claude proposes dark-mode token mirror
   - AA contrast lint runs against light-mode background pairings
   - Pass → record iter count, exit
   - Fail → feed contrast violations back to Claude as next-iteration prompt
4. After N=10 cap, record failure cause:
   - **Brand-conflict** — required token color outside brand palette
   - **Oscillation** — Claude flips between two ~AA values
   - **Palette-exhaustion** — all considered hues fail AA against light-mode pair

Compute median iter-to-AA across 20 sets. Hypothesis confirmed if median ≤ 3 AND failure rate at N=5 ≤ 20%.

### What this paper is NOT measuring

- **AAA contrast** — only AA (4.5:1 / 3:1). AAA may have different convergence behavior.
- **Cost displacement** — not measuring iteration cost vs failure cost trade-off; measuring convergence rate to threshold.
- **Multi-state token convergence** — single token at a time. Cross-token interaction (e.g. semantic naming locks) may shift convergence; out of scope.
- **Other AI tools** — Claude only. v0.dev / Galileo / Builder.io comparison would be a separate paper.

## Results

`status: planned` — no data yet. Result will populate when at least 5 token sets have completed 10-iteration runs.

Expected output table (template):

| Palette category | N sets | Median iter-to-AA | Failure rate at N=5 | Top failure cause |
|---|---:|---:|---:|---|
| warm-dominant | 4 | TBD | TBD | TBD |
| cool-dominant | 4 | TBD | TBD | TBD |
| neutral | 4 | TBD | TBD | TBD |
| high-saturation | 4 | TBD | TBD | TBD |
| monochrome | 4 | TBD | TBD | TBD |

## Discussion

### Why the sub-question pair matters

#1201 measures **how fast Claude approaches a fixed point** when the endpoint is continuous (pixel diff). This paper measures **how fast Claude reaches a threshold** when the endpoint is binary (AA pass/fail).

The two convergence shapes diverge at the limit:
- Continuous: Claude can keep improving indefinitely (smaller diff possible)
- Threshold: Claude either passes AA or doesn't — no "more passing" past threshold

Operational implication: continuous convergence may incentivize over-iteration (chasing diminishing returns); threshold convergence has a clean stop rule. The technique can hard-cap iteration count more confidently in the threshold case.

### What would refute the hypothesis

- Median iter-to-AA > 5 across all categories → loop is too slow for operational use; technique should pre-filter brand palettes to AA-compatible
- Failure rate at N=5 > 50% → AA satisfaction is structurally hard; technique should prescribe AAA-safe palettes from the start (not chase AA per-token)
- Convergence reached but oscillates afterward (Claude continues changing despite passing AA) → loop needs explicit stop signal, not just AA-pass; current technique under-specified

### What partial-support would look like

- Median ≤3 for warm/cool/neutral but >5 for high-saturation/monochrome → palette category determines convergence; technique gains palette-class-conditional iteration budget
- Convergence reached but in non-trivial number of cases (e.g. 30%) the failure is brand-conflict (palette physically doesn't support AA) → technique should warn at design time, not at iteration time

## Limitations (planned)

- **20 token sets is small** — palette diversity may need 50+ sets for confident convergence claim per category
- **AA only** — AAA convergence may have different shape; out of scope
- **Single Claude version** — model improvements may shift convergence; re-measure on major model versions
- **Synthetic palettes** — token sets curated, not pulled from real production design systems. Production palette diversity may be wider.
- **No designer-feedback loop** — Claude iterates against AA gate alone. Real workflows have designer reviewing borderline cases; that judgment unmodeled here.

## Provenance

- Authored: 2026-04-26 (post-#1208 self-improvement cluster completion)
- Tests technique `frontend/dark-mode-token-mirror-via-claude` from #1202 batch
- Worked example #13 of paper #1188's verdict rule — convergence framing, not cost-displacement
- **Second convergence-shape paper** — joins #1201 (pixel-diff convergence) to start the convergence cluster forming (1 → 2)
- Status `draft` until experiment runs. Closure path: 20 token sets × 10 iter cap; status transitions to `reviewed` then `implemented`.
- Sibling paper opportunity for convergence cluster completion (3rd): cross-tool convergence comparison (Claude vs v0.dev vs Galileo for same dark-mode task) — variant/scale sub-question
