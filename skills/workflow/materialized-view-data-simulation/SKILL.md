---
name: materialized-view-data-simulation
description: Deterministic seeded generator for base-table writes, refresh jobs, and concurrent query reads
category: workflow
triggers:
  - materialized view data simulation
tags:
  - auto-loop
version: 1.0.0
---

# materialized-view-data-simulation

Drive materialized-view simulations from a seeded PRNG so refresh races are reproducible. Generate three event streams on a shared virtual clock: (1) base-table mutations (insert/update/delete with row PKs and a monotonic `writeLsn`), (2) refresh triggers (scheduled at fixed intervals, on-demand, or threshold-driven by write count), and (3) query arrivals (Poisson-distributed, each carrying a `readAt` timestamp). Each refresh job captures a snapshot LSN at start, takes a configured duration to "rebuild", then atomically swaps — queries arriving mid-refresh must deterministically resolve against either the old or new snapshot based on isolation mode (blocking vs CONCURRENTLY).

Maintain per-row lineage: every view row stores `(sourceWriteLsn, materializedAtLsn)` so staleness = `currentWriteLsn - materializedAtLsn` is computable at any tick. For incremental-refresh demos, emit a delta log between `lastRefreshLsn` and `now`, classify each delta as applicable/non-applicable to the view definition, and animate the apply step row-by-row. Expose knobs for write rate, refresh interval, refresh duration, and query rate; log a compact event journal (JSON lines) so the same seed reproduces identical race outcomes across runs and panel screenshots.
