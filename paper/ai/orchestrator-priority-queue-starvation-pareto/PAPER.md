---
version: 0.3.0-draft
name: orchestrator-priority-queue-starvation-pareto
description: "Tests whether priority-queue starvation distributes Pareto — top 20% of task classes account for ~80%. Pareto paper."
type: hypothesis
status: draft
category: ai
tags:
  - orchestrator
  - priority-queue
  - starvation
  - pareto-distribution
  - non-cost-displacement

premise:
  if: "we simulate orchestrator-priority-queue-preemption (#1206 batch) with mixed task-class priorities for 10K dispatches across 5 workload scenarios"
  then: "starvation events distribute Pareto — top 20% of task classes account for ≥75% of starved tasks; aging mitigation reduces but does not flatten the long tail"

examines:
  - kind: technique
    ref: ai/orchestrator-priority-queue-preemption
    note: "the technique whose starvation distribution this paper measures"
  - kind: paper
    ref: workflow/ai-swagger-gap-fill-confidence-distribution
    note: "sibling Pareto paper #1 — confidence distribution (existence sub-question)"
  - kind: paper
    ref: frontend/css-token-violation-severity-pareto
    note: "sibling Pareto paper #2 — severity distribution (calibration sub-question)"

perspectives:
  - by: technique-author
    view: "the technique mandates aging to prevent starvation but doesn't measure how skewed starvation is across classes. The paper tests whether aging fixes the tail or just shifts it."
  - by: skeptic
    view: "starvation may be uniform if priority distribution is uniform. Pareto is hypothesis, not default. The paper assumes long-tail; that needs measurement."
  - by: corpus-curator
    view: "third Pareto paper, completing the cluster (#1176 confidence + #1203 severity + this starvation). Pareto becomes the third stable 3-paper cluster after threshold-cliff and necessity."

experiments:
  - name: starvation-distribution-by-task-class
    status: planned
    method: "Simulate 10K dispatches × 5 workloads. Mix task classes + priorities. Track starved tasks (wait > deadline); bucket by class; compute cumulative % at top 20%. Full protocol in body."
    measured: "starvation count per class per scenario; top 20% cumulative %; Gini; aging effectiveness (with/without)"
    result: null
    supports_premise: null
    refutes: "implicit assumption that starvation distributes uniformly across task classes"
    confirms: null

requires:
  - kind: technique
    ref: ai/orchestrator-priority-queue-preemption
    note: "the technique under test"
  - kind: paper
    ref: workflow/ai-swagger-gap-fill-confidence-distribution
    note: "first Pareto paper — pairs with this to form the third stable cluster"
  - kind: paper
    ref: frontend/css-token-violation-severity-pareto
    note: "second Pareto paper — pairs with this to complete the Pareto sub-question triad"
---

# Orchestrator Priority-Queue Starvation Pareto

> Tests whether priority-queue starvation in `technique/ai/orchestrator-priority-queue-preemption` (#1206 batch) distributes Pareto across task classes. **Third Pareto-shape paper in the corpus** — completes the Pareto cluster, joining #1176 (AI confidence) and #1203 (CSS violation severity).

## Introduction

The technique `orchestrator-priority-queue-preemption` mandates aging — paused task priority increases over time so it eventually overtakes new arrivals. The technique claims aging prevents starvation, but doesn't quantify how skewed starvation is across task classes when aging is applied (or absent).

This paper measures the distribution shape and tests whether aging fixes the long tail or just shifts the offending classes.

### Pareto cluster sub-question completion

Three Pareto papers cover three complementary sub-questions of the distribution-shape category:

| Paper | Domain | Sub-question |
|---|---|---|
| #1176 ai-swagger-gap-fill-confidence-distribution | AI inference | **Existence** — does AI confidence on swagger gap-fills distribute long-tail? |
| #1203 css-token-violation-severity-pareto | Frontend CSS | **Calibration** — what are the dominant kinds; can token coverage prioritize? |
| **this paper** | Orchestrator | **Variant / scale** — does starvation distribute per task class; does aging flatten the tail? |

This completes the Pareto cluster as a stable 3-paper cluster (per #1205's verdict: 3 papers covering existence/calibration/variant triad = stable).

### Why Pareto (NOT cost-displacement, threshold-cliff, log-search, hysteresis, convergence, necessity)

The cost-displacement framing for this question would have been:

> "as priority spread grows, starvation cost grows but throughput cost shrinks; crossover at optimal spread"

Wrong shape. The actual claim is about the **distribution of starvation across task classes**, not a per-spread trade-off:

- If Pareto: focus aging-tuning on the top 20% of starved classes (high leverage)
- If uniform: aging must work for every class equally (no prioritization signal)
- If bimodal: two dominant starved classes need bespoke aging rules

Per paper #1188's verdict rule, this paper deliberately frames around the actual shape (distribution) rather than retrofit cost-displacement.

## Methods

For each of 5 workload scenarios:

1. **Uniform mix** — equal task class probability, uniform priority
2. **Heavy-interactive** — 80% interactive (high-priority short tasks), 20% batch
3. **Heavy-batch** — 20% interactive, 80% batch (low-priority long tasks)
4. **Bursty** — quiet baseline + periodic spikes of urgent arrivals
5. **Skewed-priority** — exponential priority distribution (few very high, many low)

Per scenario: simulate 10K dispatches through orchestrator-priority-queue-preemption. Track each task's wait time + completion / starvation status. Run twice — with aging enabled, with aging disabled.

Bucket starved tasks (wait > deadline) by task class. Compute:
- Starvation count per class
- Cumulative % at top 20% of classes
- Gini coefficient (alternative concentration measure)
- Aging effectiveness — Δ in cumulative-top-20% with vs without aging

Hypothesis confirmed if median scenario has cumulative ≥75% at top 20% (with aging on).

### What this paper is NOT measuring

- **Predictive starvation per class** — descriptive of observed simulation, not predictive across all workloads
- **Cost displacement** — no smooth trade-off; the claim is per-class skew, not cross-axis cost trade
- **Aging-parameter calibration** — fixed aging rate per simulation. Optimal rate per class would be a different paper
- **Multi-orchestrator coordination** — single orchestrator. Multi-leader starvation may behave differently

## Results

`status: planned` — no data yet. Result will populate when at least one scenario simulation completes 10K dispatches.

Expected output table (template):

| Scenario | Aging | Top class | Top class % | Top 20% cumulative | Gini |
|---|---|---|---:|---:|---:|
| uniform | off | TBD | TBD | TBD | TBD |
| uniform | on | TBD | TBD | TBD | TBD |
| heavy-interactive | off | TBD | TBD | TBD | TBD |
| heavy-interactive | on | TBD | TBD | TBD | TBD |
| heavy-batch | off | TBD | TBD | TBD | TBD |
| heavy-batch | on | TBD | TBD | TBD | TBD |
| bursty | off | TBD | TBD | TBD | TBD |
| bursty | on | TBD | TBD | TBD | TBD |
| skewed-priority | off | TBD | TBD | TBD | TBD |
| skewed-priority | on | TBD | TBD | TBD | TBD |

## Discussion

### What this paper completes

Paper #1188 found Pareto in 1/22 papers initially. Adding #1203 made it 2 (forming cluster). This paper makes it 3 — **completes the third stable 3-paper cluster** after threshold-cliff (#1196/#1197/#1198) and necessity (#1160/#1174/#1204).

If the hypothesis lands (cumulative ≥75% at top 20%), the corpus gains:
- Third worked example of Pareto distribution at the paper layer
- A practical orchestrator-tuning rule: prioritize aging tuning on the top 20% of starved task classes
- Continued evidence that #1188's bias-correction methodology generalizes — worked example #11

### Why the aging-effectiveness sub-measurement matters

The technique claims aging prevents starvation. The paper tests:
1. **Without aging**: Pareto holds; the long tail is the natural shape
2. **With aging**: does Pareto FLATTEN (uniform-ish) or SHIFT (different classes starved at lower rate)?

Two distinct outcomes:
- **Flatten**: aging works as designed; long tail compresses toward median
- **Shift**: aging just changes which classes get starved; total starvation count may be similar but kind distribution changes

Both outcomes are useful findings. Flatten = aging is robust. Shift = aging is partially effective; needs class-aware tuning.

### What would refute the hypothesis

- Cumulative % at top 20% < 50% with aging on → starvation is more uniform than predicted; the technique's anti-starvation works robustly without per-class tuning
- Top 20% cumulative > 90% even with aging → aging doesn't help at all; technique's aging mechanism is broken or insufficient
- Hypothesis holds for some scenarios but not bursty → bursty workloads need different anti-starvation mechanism (e.g. dedicated priority lane), aging insufficient

### What partial-support would look like

- Pareto holds in 4 of 5 scenarios but uniform in heavy-interactive → starvation distribution depends on workload; technique should warn that interactive-heavy workloads behave differently
- Cumulative ≥ 75% at top 20% but Gini drops significantly with aging → distribution remains Pareto but compressed; aging shrinks the tail magnitude even if not flattening shape

## Limitations (planned)

- **Synthetic workloads** — 5 scenarios are stylized. Production orchestrators see continuously-varying mixes that the 5-scenario sweep may not capture.
- **Single-orchestrator simulation** — multi-orchestrator coordination (with leader-election or sharded queues) may shift starvation distribution.
- **Fixed aging rate** — single aging-rate per simulation. Adaptive aging (per-class learned rate) is a different technique.
- **No real-system anchor** — purely simulation. A follow-up could replay production trace from a real orchestrator (e.g. Airflow, Prefect) to test against simulation findings.
- **Class taxonomy is fixed** — buckets predefined. Real workloads may have unmodeled classes that fall outside the buckets.

## Provenance

- Authored: 2026-04-26 (post-#1206 ten-orchestrator-technique batch)
- Tests technique `ai/orchestrator-priority-queue-preemption` from #1206 batch
- Worked example #11 of paper #1188's verdict rule — Pareto framing, not cost-displacement
- **Third and final Pareto-shape sibling paper** — completes the third stable 3-paper cluster (after threshold-cliff and necessity)
- Status `draft` until experiment runs. Closure path: simulate 5 scenarios × 10K dispatches each; status transitions to `reviewed` then `implemented`.
- Sibling paper opportunity: cross-domain Pareto generator paper (do AI confidence, CSS violation, and orchestrator starvation share a common generator?) — now possible with 3 Pareto data points
