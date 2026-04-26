---
version: 0.3.0-draft
name: killswitch-trip-threshold-calibration
description: "Tests whether killswitch trip threshold is traffic-class-conditional rather than universal — threshold-cliff paper."
type: hypothesis
status: draft
category: arch
tags:
  - killswitch
  - threshold-cliff
  - circuit-breaker
  - calibration
  - non-cost-displacement

premise:
  if: "we sweep the killswitch trip threshold (1%–50% error rate) across multiple synthetic traffic-classes and error-mixes, measuring false-trip and missed-trip rates"
  then: "an optimal threshold band exists per-traffic-class, NOT a single universal value — high-volume low-error services need lower thresholds; low-volume bursty services need higher"

examines:
  - kind: technique
    ref: arch/feature-flag-killswitch-with-circuit-state
    note: "the technique whose threshold-cliff trip mechanism this paper calibrates"

perspectives:
  - by: technique-author
    view: "the technique describes the cliff mechanism (trip + circuit state) but punts on threshold value. Operators today guess. The paper closes that with traffic-class-conditional bands."
  - by: skeptic
    view: "traffic-class is too coarse a partition. Real services blend high/low volume, transient/persistent errors, and downstream/upstream causes. A band per class may not generalize to mixed workloads."
  - by: corpus-curator
    view: "second threshold-cliff paper, paired with #1196 (quorum cliff existence). Together they cover both threshold-cliff sub-questions: does the cliff exist (#1196), and where do we put it (this paper)."

experiments:
  - name: threshold-vs-trip-rate-by-traffic-class
    status: planned
    method: "Simulate 4 traffic-classes (high-vol-low-err, high-vol-bursty, low-vol-low-err, low-vol-bursty). Sweep trip threshold {1, 2, 5, 10, 20, 50}%. Record false-trip and missed-trip rates per class."
    measured: "false-trip rate, missed-trip rate, recovery-time post-trip; optimal threshold per class"
    result: null
    supports_premise: null
    refutes: "implicit assumption that one threshold (often 5%) suits all traffic shapes"
    confirms: null

requires:
  - kind: technique
    ref: arch/feature-flag-killswitch-with-circuit-state
    note: "the technique under test"
  - kind: paper
    ref: arch/technique-shape-claim-distribution-survey
    note: "survey that surfaced this paper opportunity (Finding 4) and motivates non-cost-displacement framing"
---

# Killswitch Trip Threshold Calibration

> Tests whether the killswitch trip threshold of `technique/arch/feature-flag-killswitch-with-circuit-state` should be a single universal value or a traffic-class-conditional band. Worked example #4 of paper #1188's verdict rule. Second threshold-cliff sibling paper paired with #1196 (quorum cliff existence) — together they cover both sub-questions of the threshold-cliff shape: **does the cliff exist** (#1196) and **where do we put it** (this paper).

## Introduction

The technique `feature-flag-killswitch-with-circuit-state` requires that an error-rate above some threshold trips the circuit OPEN (manual half-open re-arm). The technique describes the mechanism without specifying the threshold value:

> Per-flag circuit breaker — error rate above threshold trips OPEN, manual half-open re-arm prevents auto-flapping.

Operators today guess — common defaults are 5%, 10%, sometimes 50%. This paper tests whether one default suffices or whether the optimal value depends on traffic-class.

### Why threshold-cliff (NOT cost-displacement)

The cost-displacement framing for this question would have looked like:

> "as threshold grows, false-trip cost shrinks but missed-trip cost grows; crossover at optimal threshold"

That framing is **partially right but wrong about the shape's structure**. The actual claim:

- Below the trip threshold: circuit CLOSED, all requests served (latency = normal)
- Above threshold: circuit OPEN, requests fail-fast (latency = ~0, but availability = 0)

There IS a tradeoff between false-trip cost (lost availability when threshold too low) and missed-trip cost (cascading failure when threshold too high). But the underlying mechanism is a **discontinuous trip**, not a smooth cost curve. The threshold determines WHERE the cliff sits, not whether it exists. A crossover-shaped paper would suggest a single optimal value; a threshold-cliff paper says the cliff exists per-class and asks where each class needs it.

### Pairing with #1196 (quorum cliff existence)

The two threshold-cliff papers cover complementary sub-questions:

| Paper | Sub-question | Cliff position | Calibration target |
|---|---|---|---|
| #1196 quorum-decision-latency-cliff | does the cliff exist? | structurally fixed at N/2+1 | none — cliff position is given |
| **This paper** | where do we put the cliff? | designer-chosen | per-traffic-class threshold band |

#1196 measures whether real systems exhibit the structural cliff sharply or smear it. This paper assumes cliffs exist and measures the design space. Together they characterize threshold-cliff as a coherent shape: structural existence (#1196) plus design-space calibration (this paper).

## Methods

For each of 4 synthetic traffic-classes:

1. **High-vol low-err** — 10K req/s baseline, 0.1% baseline error rate
2. **High-vol bursty** — 10K req/s baseline, 0.1% baseline + spike to 30% for 10s windows
3. **Low-vol low-err** — 100 req/s baseline, 0.1% baseline error rate
4. **Low-vol bursty** — 100 req/s baseline, 0.1% baseline + spike to 30% for 10s windows

For each class, sweep trip threshold across {1%, 2%, 5%, 10%, 20%, 50%}. For each threshold setting, run simulation for 1000 windows and record:

- **False-trip rate** — circuit trips during a transient that would have self-recovered
- **Missed-trip rate** — error spike sustained without trip, downstream cascades
- **Recovery time** — wall-clock from trip event to manual half-open re-arm

Compute optimal threshold per class as the value minimizing (false-trip + missed-trip) at the available data. Hypothesis confirmed if optimal thresholds differ by ≥2× across classes (i.e., one universal threshold doesn't fit).

### What this paper is NOT measuring

- **Auto half-open re-arm** — the technique requires manual re-arm to prevent flapping; this paper inherits that.
- **Cross-circuit dependencies** — single circuit, single flag. Real systems have many circuits with shared dependencies; out of scope.
- **Adaptive thresholds** — fixed thresholds per class. Adaptive (e.g., learned online) is a different technique entirely.
- **Cost displacement** — there is no "as threshold grows, cost X shrinks but cost Y grows linearly with crossover" claim. The shape is cliff position calibration, not smooth cost trade-off.

## Results

`status: planned` — no data yet. Result will populate when at least one traffic-class is swept.

Expected output table (template):

| Traffic class | Threshold | False-trip rate | Missed-trip rate | Recovery time | Combined cost |
|---|---:|---:|---:|---:|---:|
| high-vol low-err | 1% | TBD | TBD | TBD | TBD |
| high-vol low-err | 2% | TBD | TBD | TBD | TBD |
| high-vol low-err | 5% | TBD | TBD | TBD | TBD |
| high-vol low-err | 10% | TBD | TBD | TBD | TBD |
| ... | ... | TBD | TBD | TBD | TBD |
| low-vol bursty | 50% | TBD | TBD | TBD | TBD |

## Discussion

### Why this paper exists in the non-cost-displacement column

Paper #1188 found 8/22 papers (36%) frame as cost-displacement crossover, while only 2/25 techniques (8%) do. Threshold-cliff appears in 3/25 techniques and was 0/22 papers until #1196 opened the category. This paper is the second threshold-cliff paper, paired with #1196 to cover both sub-questions.

If the hypothesis lands (optimal thresholds differ by ≥2× across classes), the corpus gains:

- A second worked example of threshold-cliff at the paper layer
- A practical rule for killswitch threshold sizing (per-traffic-class, not universal)
- Evidence that paper #1188's bias-correction methodology generalizes — same shape, different sub-question, both productive

### What would refute the hypothesis

- Optimal threshold within ±20% across all 4 classes → universal default works; technique can prescribe one value (e.g. "5%")
- High-vol classes have wildly different optima from low-vol classes but same within volume bucket → calibration axis is wrong; volume matters but not error-mix
- Combined cost is monotonically decreasing with threshold (no minimum) → false-trip cost dominates; technique should prescribe the highest tolerable threshold

### What partial-support would look like

- 3 of 4 classes cluster around one threshold but bursty-low-vol needs significantly higher → most services share a default with named exceptions for bursty traffic
- Optimal threshold band is wide (e.g. 5%–15%) within each class → calibration matters but precision doesn't; rough buckets suffice

## Limitations (planned)

- **Synthetic traffic** — 4 classes are stylized. Real production traffic blends classes within a single service; combined-class behavior unmeasured here.
- **Single error type** — paper treats all errors as equivalent for trip purposes. Real systems distinguish 5xx from timeout from saturation; threshold may need to be per-error-class too.
- **Fixed window size** — sliding-window vs tumbling-window vs exponential decay would each give different trip behavior; this paper holds window mechanics constant.
- **No multi-flag interaction** — one circuit, one flag. Cross-flag interaction (e.g. flag A trips, traffic shifts to flag B which then trips too) is out of scope.

## Provenance

- Authored: 2026-04-26
- Files against issue #1189 (one of 5 untested-shape paper opportunities surfaced by #1188 Finding 4)
- Tests technique `arch/feature-flag-killswitch-with-circuit-state`
- Worked example #4 of paper #1188's verdict rule (siblings: #1194 log-search, #1195 hysteresis, #1196 quorum cliff existence)
- Second threshold-cliff paper, paired with #1196 to cover the shape's two sub-questions
- One sibling threshold-cliff opportunity remaining: #1193 (contract-test quorum vote)
- Status `draft` until experiment runs. Closure path: simulate 4 traffic-classes; status transitions to `reviewed` then `implemented`.
