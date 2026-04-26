---
version: 0.3.0-draft
name: connection-pool-throughput-saturation
description: "Tests whether DB connection pool throughput saturates at max_clients × 1.5-2 — saturation variant paper."
type: hypothesis
status: draft
category: arch
tags:
  - connection-pool
  - throughput
  - saturation
  - non-cost-displacement
  - cluster-completion

premise:
  if: "we sweep DB connection pool size from 1 to 256 across 3 query mixes (read-heavy, write-heavy, mixed) and measure throughput per setting"
  then: "throughput saturates at pool size = max_concurrent_clients × 1.5-2 with plateau thereafter; no inversion past saturation, distinct from cost-displacement"

examines:
  - kind: paper
    ref: arch/thread-pool-throughput-saturation
    note: "saturation #1 — concurrency (existence)"
  - kind: paper
    ref: arch/cache-hit-ratio-saturation-curve
    note: "saturation #2 — cache memory (calibration)"

perspectives:
  - by: db-author
    view: "operators size connection pools by intuition. Paper measures whether saturation is at fixed multiple of concurrent client count, enabling principled sizing across DB engines."
  - by: skeptic
    view: "DB connection pool has hard capacity from server-side max_connections. Predict: throughput saturates BUT past max_connections shows degradation (locking, query queueing on server). Inversion likely."
  - by: corpus-curator
    view: "third saturation paper — completes cluster as 9TH STABLE 3-paper cluster. Sub-question coverage: existence (#1218 concurrency) + calibration (#1219 cache) + variant (this paper, network resource)."

experiments:
  - name: pool-size-sweep-vs-throughput
    status: planned
    method: "DB connection pool sizes {1,2,4,8,16,32,64,128,256} × 3 query mixes (read/write/mixed). 60s steady-state benchmark per setting. Record throughput + connection wait + server-side lock count."
    measured: "throughput per (size, mix); saturation point as multiple of concurrent clients; inversion magnitude past max_connections"
    result: null
    supports_premise: null
    refutes: "implicit assumption that connection pool follows same saturation as thread pool (#1218); DB server-side limits may force inversion"
    confirms: null

requires:
  - kind: paper
    ref: arch/thread-pool-throughput-saturation
    note: "first saturation paper — pairs to complete cluster"
  - kind: paper
    ref: arch/cache-hit-ratio-saturation-curve
    note: "second saturation paper — pairs to complete cluster (3 → stable)"
---

# Connection Pool Throughput Saturation

> Tests whether DB connection pool throughput saturates at max_concurrent_clients × 1.5-2 with no inversion. **Third saturation-shape paper** — completes the saturation cluster as the **9TH STABLE 3-PAPER CLUSTER**.

## Introduction

DB connection pool sizing is a recurring operational question. Common heuristics: 2× max workers, 1× max workers, 100 connections per service tier. These are convention not measurement.

The principled answer depends on:
- **max_concurrent_clients** — how many requests are simultaneously in-flight
- **DB server-side limits** — max_connections, query queue, lock contention

This paper tests whether pool throughput saturates at a fixed multiple of concurrent clients (analogous to thread pool saturation in #1218) or whether DB server-side constraints force inversion (degradation past saturation).

### Saturation cluster sub-question triad COMPLETE

| Paper | Sub-question | Domain |
|---|---|---|
| #1218 thread-pool-throughput-saturation | **Existence** (saturation in concurrency) | Thread pool |
| #1219 cache-hit-ratio-saturation-curve | **Calibration** (saturation point as % of working-set) | Cache memory |
| **this paper** | **Variant** (cross-resource to network/DB) | Connection pool |

Per #1205's verdict ("cluster saturates at N=3 covering existence + calibration + variant"), this triad makes saturation the **9th stable 3-paper cluster**.

### Three-domain saturation evidence

If hypothesis lands across all 3 domains (concurrency + memory + network), saturation-without-crossover has structural backing across **distinct resource types**:

| Resource | Parameter | Metric |
|---|---|---|
| Concurrency (CPU) | thread pool size | throughput |
| Memory | cache size | hit-ratio |
| Network/IO | connection pool size | throughput |

Three-domain consistency would be the strongest evidence yet that saturation-without-crossover is a real shape category, not domain-specific behavior.

### Why saturation (NOT cost-displacement)

Cost-displacement framing for this question would have been:

> "as pool size grows, parallelism gain rises but coordination cost rises faster; crossover at optimal pool size"

Wrong shape if saturation holds. The actual claim:

- Pool size 1-N_clients: throughput rises
- Pool size = N_clients × 1.5-2: throughput saturates
- Pool size > saturation: throughput plateaus (no inversion)

Operators get to over-provision safely. Per #1188's verdict rule, deliberately framed around the actual shape.

### Why DB connection pool is the right variant axis

Connection pool differs from thread pool in critical ways:

- **Server-side limits**: DB has max_connections; thread pool doesn't have OS-equivalent hard cap
- **Coupled resource**: each connection consumes server memory + lock manager slot
- **Query-side queuing**: server may queue beyond pool limits, distinct from in-process queue

If saturation holds despite these differences, the shape category is robust. If inversion shows (likely if pool > server max_connections), the technique should warn that connection pools have a hard ceiling thread pools don't.

## Methods

For each of 3 query mixes:

1. **Read-heavy** — 90% SELECT, 10% INSERT (typical web app)
2. **Write-heavy** — 30% SELECT, 70% INSERT/UPDATE (event-sourcing or audit log)
3. **Mixed** — 50/50

For each pool size in {1, 2, 4, 8, 16, 32, 64, 128, 256}:

1. Run 60s steady-state benchmark
2. Record:
   - Throughput (queries/s)
   - Connection wait time (queue at pool exhaustion)
   - Server-side lock count
   - CPU usage on DB server

Identify saturation point per mix (smallest size where adding connections gives < 5% throughput improvement). Verify behavior past saturation (plateau vs inversion).

Hypothesis confirmed if saturation ∈ [N_clients × 1.0, N_clients × 2.5] AND throughput stays ≥ 95% of peak past saturation across all 3 mixes.

### What this paper is NOT measuring

- **Cross-DB-engine variation** — single engine (PostgreSQL or MySQL); other engines may differ
- **Connection pooler middleware** — direct connection only; PgBouncer / RDS Proxy out of scope
- **Application-side variation** — single client process. Distributed clients may show different saturation
- **Cost displacement** — explicitly NOT this shape

## Results

`status: planned` — no data yet. Result populates when at least one query mix completes 9-size sweep.

Expected output table (template):

| Mix | Saturation pt | Throughput at sat | Throughput at 4× sat | Inversion? |
|---|---:|---:|---:|---|
| read-heavy | TBD | TBD | TBD | TBD |
| write-heavy | TBD | TBD | TBD | TBD |
| mixed | TBD | TBD | TBD | TBD |

## Discussion

### What this paper completes (9th stable cluster)

If hypothesis lands (saturation across 3 query mixes, no inversion within tested range):
- Third saturation paper covering variant sub-question
- Saturation reaches stable 3-paper cluster status — **9th stable cluster**
- Three-domain evidence (concurrency + memory + network) for saturation-without-crossover shape
- Practical operator rule: connection pool can be sized at N_clients × 2 safely

### What this implies for the corpus

| Cluster taxonomy | Categories | Count |
|---|---|---:|
| Phenomena clusters | threshold-cliff, necessity, Pareto, self-improvement, convergence, hysteresis, log-search, **saturation** | **8** |
| Meta-shape cluster | universality | 1 |
| **Total stable** | — | **9** |

The corpus extends from 8 stable clusters (corpus shape coverage saturated point at #1217) to 9. **Saturation-without-crossover is a real category**, not just a single-paper anomaly.

### What would refute the hypothesis

- Inversion past max_connections in any mix → pool throughput is cost-displacement, not saturation; technique should warn that connection pools have hard ceilings
- Saturation point > N_clients × 4 → no operational saturation within tested range
- Pattern-conditional behavior (read saturates, write inverts) → saturation is workload-conditional in DB domain; technique should specify mix-aware sizing

### What partial-support would look like

- Saturation in 2 of 3 mixes, write-heavy shows mild inversion → partial support; technique notes write-heavy as edge case
- Saturation point varies wide (1.5× for read, 4× for mixed) → calibration is workload-conditional; technique provides per-mix rules

## Limitations (planned)

- **3 query mixes is small** — production diversity is wider
- **Single DB engine** — engine-conditional behavior unmeasured
- **Synthetic queries** — real workloads have phases not captured by steady-state benchmarks
- **Bounded pool size 256** — production pools sometimes go higher; cap may underestimate where inversion appears
- **Single-region DB** — multi-region replication may shift saturation

## Provenance

- Authored: 2026-04-26 (post-#1219 saturation cluster forming)
- Worked example #24 of paper #1188's verdict rule — saturation variant framing
- **Third and final saturation-shape paper** — completes the saturation cluster as the **9TH STABLE 3-PAPER CLUSTER**
- Three-domain saturation evidence: concurrency (#1218) + memory (#1219) + network (this paper)
- Status `draft` until experiment runs. Closure path: 9 sizes × 3 query mixes × 60s.
- Sibling paper opportunity: 4th saturation paper extending to GPU domain (e.g., GPU thread/warp saturation) — would extend cluster past N=3 with new domain (variant within variant)
