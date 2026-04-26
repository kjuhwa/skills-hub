---
version: 0.3.0-draft
name: backpressure-hysteresis-gap-calibration
description: "Tests whether optimal high-water/low-water gap is 1.5×–3× per-cycle batch size — hysteresis shape paper."
type: hypothesis
status: draft
category: data
tags:
  - backpressure
  - hysteresis
  - calibration
  - non-cost-displacement
  - producer-consumer

premise:
  if: "we measure pause/resume oscillation rate at varying high-water/low-water gap sizes under realistic producer/consumer rate distributions"
  then: "an optimal gap exists at ~1.5×–3× per-cycle batch size — smaller gaps oscillate, larger gaps waste buffer capacity, monotonic-but-bounded between"

examines:
  - kind: technique
    ref: data/producer-consumer-backpressure-loop
    note: "the technique that requires non-zero gap but doesn't specify size"

perspectives:
  - by: technique-author
    view: "the technique requires gap but punts on size — leaving it to the operator. The paper closes that with a per-batch-size rule of thumb that survives realistic rate variance."
  - by: skeptic
    view: "the optimum is too domain-conditional for one rule. Rate variance, signal latency, and batch granularity each shift the optimum independently. A multiplier rule may mislead."
  - by: corpus-curator
    view: "first hysteresis paper in the corpus (was 0/22 in #1188). Closes the layer-gap. Worked example of #1188's verdict rule — non-cost-displacement framing on a technique with non-crossover shape."

experiments:
  - name: gap-size-vs-oscillation-rate
    status: planned
    method: "Simulate producer-consumer at gap multipliers (0.5×–5× of batch size) across 3 rate distributions. Record oscillation rate and buffer utilization. Full protocol in body Methods."
    measured: "oscillation rate per gap multiplier per rate distribution; buffer utilization at each setting"
    result: null
    supports_premise: null
    refutes: "implicit assumption that any non-zero gap suffices for hysteresis"
    confirms: null

requires:
  - kind: technique
    ref: data/producer-consumer-backpressure-loop
    note: "the technique under test"
  - kind: paper
    ref: arch/technique-shape-claim-distribution-survey
    note: "the survey that surfaced this paper opportunity (Finding 4) and motivates non-cost-displacement framing"
---

# Backpressure Hysteresis Gap Calibration

> Tests the optimal gap size between high-water and low-water thresholds in `technique/data/producer-consumer-backpressure-loop`. Worked example of paper #1188's verdict rule — hysteresis shape, not cost-displacement crossover. First hysteresis paper in the corpus, closes the 0/22 layer-gap surfaced by #1188 Finding 4.

## Introduction

The technique `producer-consumer-backpressure-loop` requires that the high-water and low-water thresholds have a non-zero gap to prevent oscillation:

> Pause at 80% / resume at 60% requires a 20-point gap before reversal. The producer steady-states in one of two regimes (running or paused) and switches only at the wider boundaries. The exact gap is per-domain — the technique requires a non-zero gap, not a specific value.

That last sentence punts on the question this paper addresses: **what gap size is optimal?**

### Why the question matters

A gap that's too small still oscillates — the buffer drains slightly past low-water, the producer resumes, and within one batch refills past high-water. A gap that's too large wastes buffer capacity — the producer stays paused long after the consumer could absorb more, leaving the buffer half-empty for extended windows.

The hypothesis: the optimum exists at roughly **1.5× to 3× the producer's per-cycle batch size**. Below 1.5×, the next single batch refills past high-water before the resume signal even propagates. Above 3×, the producer pauses unnecessarily long for normal variance.

### Why the shape is hysteresis, not crossover

This paper is deliberately framed around the **hysteresis** shape, following paper #1188's verdict rule. The cost-displacement framing would have looked like:

- "as gap grows, latency cost grows but oscillation cost shrinks; crossover at optimal gap"

That framing is technically defensible but **wrong about the shape**. The actual shape is:

- Below threshold (~1.5× batch): oscillation rate spikes
- At optimum (1.5×–3× batch): oscillation rate near-zero, capacity utilization high
- Above threshold (>3× batch): capacity wasted, but oscillation stays at zero

It's a **stable plateau between two cliffs**, not a smooth crossover. Cost-displacement would suggest a single optimal point with smooth tradeoff on both sides. Hysteresis says the optimum is a band, with sharp boundaries.

This is the kind of shape distinction paper #1188 warned about — defaulting to crossover lens distorts the technique's actual claim.

## Methods

For each of 3 producer/consumer rate distributions:

1. **Constant rate** — producer rate = X msgs/s, consumer rate = X msgs/s, no variance
2. **Bursty producer** — producer rate spikes 5× X for 10% of windows
3. **Variable consumer** — consumer rate varies 0.5×–2× X (e.g. downstream service latency variance)

For each distribution, sweep gap multipliers across {0.5×, 1×, 1.5×, 2×, 3×, 5×} of the producer's per-cycle batch size B. For each gap setting, run simulation for 10K cycles and record:

- **Oscillation rate** — pause/resume cycles per unit time
- **Buffer utilization** — mean fill ratio (target: high, sustained)
- **Producer wait time** — mean time spent paused per cycle

Compute the optimum per distribution: the gap that minimizes oscillation while maintaining ≥70% utilization.

### What this paper is NOT measuring

- **Optimum across all possible domains** — only 3 rate distributions. Production may have other shapes (long-tail latency, periodic spikes).
- **Multi-producer / multi-consumer** — the technique's known-limitations exclude these; this paper inherits the exclusion.
- **Disk-backed queues** — in-memory bounded buffer assumption per technique #1187. Disk queues have different overflow recovery.
- **Cost displacement** — there is no "as gap grows, cost X grows but cost Y shrinks" claim. The hypothesis is that a stable plateau exists between two regimes, not that two costs trade off smoothly.

## Results

`status: planned` — no data yet. Result will populate when at least one rate distribution has been swept.

Expected output table (template):

| Distribution | Gap mult | Oscillation rate | Utilization | Producer wait |
|---|---:|---:|---:|---:|
| Constant | 0.5× | TBD | TBD | TBD |
| Constant | 1× | TBD | TBD | TBD |
| Constant | 1.5× | TBD | TBD | TBD |
| Constant | 2× | TBD | TBD | TBD |
| Constant | 3× | TBD | TBD | TBD |
| Constant | 5× | TBD | TBD | TBD |
| Bursty | ... | TBD | TBD | TBD |
| Variable | ... | TBD | TBD | TBD |

## Discussion

### Why this paper exists in the non-cost-displacement column

Paper #1188 found 8/22 papers (36%) frame as cost-displacement crossover, while only 2/25 techniques (8%) do. Hysteresis appears in 1/25 techniques and **0/22 papers** — a complete layer-gap. This paper directly closes that gap.

If the hypothesis lands (mean optimum within 1.5×–3× across all 3 distributions), the corpus gains:

- One concrete worked example of the hysteresis shape at the paper layer
- A practical rule for backpressure tuning (1.5×–3× batch size)
- Evidence that paper #1188's bias-correction methodology produces non-template papers reliably

### What would refute the hypothesis

- Optimum varies by more than 5× across distributions → no single rule of thumb; gap is fully domain-conditional, technique can't surface a default
- Optimum is below 1× batch size in any distribution → batch granularity isn't the right denominator; needs different framing
- Smooth crossover detected (no plateau, oscillation rises monotonically with gap shrinkage AND capacity waste rises monotonically with gap growth) → the shape was actually crossover; technique's hysteresis claim is misleading

### What partial-support would look like

- Optimum within 1.5×–3× for constant + variable but not bursty → bursty distributions need a different rule (perhaps 5× peak batch instead of 3× mean)
- Stable plateau exists but with different bounds (e.g. 2×–4×) → the rule of thumb shifts but the shape (hysteresis) is confirmed

## Limitations (planned)

- **Simulation, not production** — synthetic distributions may miss real-world tail behavior. A follow-up could re-measure on a real backpressure deployment.
- **3 distributions is small** — production rate shapes are diverse. The 3-distribution sweep is a starting point, not coverage.
- **Single batch-size assumption** — the rule expresses gap as multiplier of batch size, assuming batch is the dominant unit. Variable batch sizes within a stream could shift the rule.
- **No signal-latency factor** — the technique requires the signal channel to be faster than the data channel. If signal latency approaches data latency, the gap calibration may not hold.

## Provenance

- Authored: 2026-04-26
- Files against issue #1191 (one of 5 untested-shape paper opportunities surfaced by #1188 Finding 4)
- Tests technique `data/producer-consumer-backpressure-loop`
- Worked example of paper #1188's verdict rule — hysteresis framing, not cost-displacement
- Status `draft` until experiment runs. Closure path: simulation across 3 rate distributions, status transitions to `reviewed` then `implemented`.
- Sibling paper opportunities (also from #1188 Finding 4): #1189 (feature-flag-killswitch threshold-cliff), #1190 (multi-peer-quorum threshold-cliff), #1192 / #1194 (binary-narrowing log2(N), worked example #1), #1193 (contract-test threshold-cliff).
