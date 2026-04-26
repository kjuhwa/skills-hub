---
version: 0.3.0-draft
name: thread-pool-throughput-saturation
description: "Tests whether thread pool throughput saturates at N_cpu × 1.5-2 with no inversion — 9th distinct shape category."
type: hypothesis
status: draft
category: arch
tags:
  - thread-pool
  - saturation
  - throughput
  - non-cost-displacement
  - new-shape

premise:
  if: "we sweep thread pool size from 1 to 128 across 3 workload mixes (CPU-bound, IO-bound, mixed) and measure throughput per setting"
  then: "throughput saturates at pool size = N_cpu × 1.5-2 with plateau thereafter; no inversion (degradation past saturation), distinct from cost-displacement crossover"

examines:
  - kind: paper
    ref: workflow/parallel-dispatch-breakeven-point
    note: "sibling (#1133) — cost-displacement; this paper tests saturation as distinct"

perspectives:
  - by: parallel-author
    view: "operators conflate saturation (plateau) with crossover (inversion). The paper draws the distinction empirically — past saturation, more threads waste resource but don't degrade throughput."
  - by: skeptic
    view: "real systems show throughput degradation past N_cpu × 4 due to context-switching. Predict: saturation is idealization; real curves cross over to degradation, at higher N than expected."
  - by: corpus-curator
    view: "9th distinct shape — saturation-without-crossover. Distinct from convergence (time axis), cost-displacement (crossover), threshold-cliff (binary). First paper in new category."

experiments:
  - name: pool-size-sweep-vs-throughput
    status: planned
    method: "Thread pool size {1,2,4,8,16,32,64,128} × 3 workload mixes (CPU/IO/mixed). Per setting: 60s steady-state benchmark, record throughput + CPU usage + context switches. Look for saturation vs inversion."
    measured: "throughput per (size, workload); saturation point per workload; degradation magnitude past saturation if any"
    result: null
    supports_premise: null
    refutes: "implicit assumption that thread-pool curves always cross over to degradation"
    confirms: null

requires:
  - kind: paper
    ref: workflow/parallel-dispatch-breakeven-point
    note: "establishes cost-displacement crossover; this paper distinguishes from it"
---

# Thread-Pool Throughput Saturation

> Tests whether thread pool throughput saturates at N_cpu × 1.5-2 with plateau thereafter — distinct from cost-displacement crossover. **First paper in 9th distinct shape category** (saturation-without-crossover): #1188's census surfaced 8 categories, this paper opens a 9th.

## Introduction

Operators routinely conflate two distinct curves:

- **Cost-displacement crossover**: as parameter X grows, two costs trade off; past optimal X, total cost worsens (inversion)
- **Saturation-without-crossover**: as parameter X grows, metric approaches asymptote; past optimal X, metric plateaus (no inversion, just diminishing returns)

Thread pool throughput often *looks* like crossover (curve flattens, operators assume degradation must follow), but in well-behaved cases it actually saturates without ever inverting. Adding threads past saturation wastes resource (memory, context-switch overhead) but doesn't reduce throughput.

This paper tests whether thread pool curves are saturation-shape or crossover-shape across realistic workloads.

### Why this opens a 9th distinct shape category

Paper #1188 census surfaced 8 shape categories, all reaching stable 3-paper clusters as of #1217. This paper introduces **saturation-without-crossover** as a 9th distinct shape:

| Compared to | Distinguishing feature |
|---|---|
| Cost-displacement crossover | Saturation has NO inversion past optimal |
| Convergence (e.g., #1201) | Saturation is on PARAMETER axis, convergence on iteration/time axis |
| Threshold-cliff | Saturation is gradual, not discontinuous |
| Pareto distribution | Saturation is single-curve plateau, not distribution shape |

Operationally consequential: if curves saturate (not crossover), operators can over-provision safely. If curves crossover, over-provisioning actively degrades.

### Why saturation-without-crossover (NOT cost-displacement)

Cost-displacement framing for this question would have been:

> "as pool size grows, parallelism gain rises but coordination cost rises faster; crossover at optimal size"

Wrong shape — for well-behaved thread pools. The actual claim:

- Pool size 1-N_cpu: throughput rises linearly
- Pool size N_cpu × 1.5-2: throughput plateaus (saturation)
- Pool size > N_cpu × 2: throughput stays at plateau (no inversion to degradation)

The curve has **no crossover**. It rises, then plateaus, then stays. Resource cost grows with pool size but throughput doesn't decrease. Per #1188's verdict rule, deliberately framed around the actual shape.

### Distinct from #1133 (parallel-dispatch-breakeven-point)

Paper #1133 measured cost-displacement crossover for parallel agent dispatch (past 70% prior coverage, net negative). This paper measures saturation for thread pool throughput — different domain (concurrency primitive vs agent dispatch), different shape (saturation vs crossover).

Both are valid; they describe distinct phenomena. The corpus needs both shapes for accurate operator guidance.

## Methods

For each of 3 workload mixes:

1. **CPU-bound** — pure compute (e.g., SHA-256 hashing on 1 KB chunks)
2. **IO-bound** — sleep/network simulation (60% wait, 40% process)
3. **Mixed** — alternating CPU + IO segments

Sweep thread pool size across {1, 2, 4, 8, 16, 32, 64, 128}. For each (size, workload):

1. Run 60s steady-state benchmark
2. Record:
   - **Throughput** (ops/s)
   - **CPU usage** %
   - **Context-switch rate**
   - **Throughput delta** vs pool=1 baseline

Identify saturation point per workload (smallest size where adding threads gives < 5% throughput improvement). Verify no inversion (throughput stays within 95% of saturation peak past saturation).

Hypothesis confirmed if saturation point ∈ [N_cpu × 1.0, N_cpu × 2.5] AND throughput stays ≥ 95% of peak past 4× saturation point.

### What this paper is NOT measuring

- **Pathological workloads** — assumed well-behaved (no contention, no shared mutable state). Pathological cases may show crossover instead of saturation
- **Memory pressure** — fixed thread stack budget; OOM scenarios out of scope
- **NUMA effects** — single-socket assumption; cross-socket may complicate
- **Cost displacement** — explicitly NOT this shape; paper distinguishes from #1133 framing

## Results

`status: planned` — no data yet. Result populates when at least one workload completes 8-size sweep.

Expected output table (template):

| Workload | N_cpu | Saturation pt | Throughput at sat | Throughput at 4× sat | Inversion? |
|---|---:|---:|---:|---:|---|
| CPU-bound | TBD | TBD | TBD | TBD | TBD |
| IO-bound | TBD | TBD | TBD | TBD | TBD |
| Mixed | TBD | TBD | TBD | TBD | TBD |

## Discussion

### Why this matters for the corpus

If hypothesis lands (saturation without inversion across 3 workloads):
- 9th distinct shape category opens — saturation-without-crossover
- Corpus shape coverage extends beyond #1188's 8-category census
- Operator rule: thread pools can over-provision safely; cost is wasted resource, not lost throughput

If hypothesis fails (inversion observed):
- Saturation-without-crossover is not a distinct shape — collapses into cost-displacement at higher N
- Corpus stays at 8 categories
- Operator rule: even thread pools follow crossover; right-size carefully

Both outcomes are valuable.

### What would refute the hypothesis

- Throughput drops > 10% past 4× saturation in any workload → inversion present, shape is cost-displacement after all
- Saturation point < N_cpu × 0.5 → curve saturates before parallelism is utilized; thread pool is sub-CPU-count effective
- Saturation point > N_cpu × 4 → no real plateau; throughput keeps rising, no saturation at scale

### What partial-support would look like

- Saturation in CPU + Mixed but inversion in IO → IO-bound workloads have crossover (e.g., from socket exhaustion); category applies to subset
- Saturation point in [N_cpu, N_cpu × 4] (wider than predicted) → saturation exists but threshold is workload-conditional, not universal

## Limitations (planned)

- **3 workload mixes is small** — production diversity is wider (DB-bound, GPU-bound, lock-contended)
- **Synthetic CPU/IO simulation** — real workloads have phases not captured by alternating segments
- **Single hardware** — multi-socket / NUMA / GPU systems may show different saturation
- **No cost dimension** — measures throughput only; per-thread memory cost dominant in some scenarios
- **Bounded pool size 128** — modern servers have 200+ cores; cap may underestimate where inversion would appear

## Provenance

- Authored: 2026-04-26 (post-#1217 corpus shape coverage saturation milestone)
- Worked example #22 of paper #1188's verdict rule — saturation framing, not cost-displacement
- **First paper in 9th distinct shape category** — saturation-without-crossover, distinct from cost-displacement (no inversion), convergence (parameter axis), threshold-cliff (gradual not discontinuous)
- Status `draft` until experiment runs. Closure path: 8 sizes × 3 workloads × 60s benchmark.
- Sibling paper opportunity: 2nd saturation paper (e.g., cache hit-ratio vs cache size) → cluster forming. 3rd would form 9th stable cluster.
