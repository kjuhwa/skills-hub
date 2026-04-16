---
name: time-series-db-implementation-pitfall
description: Common simulation traps: floating-point timestamp drift, unbounded in-memory buffers, and misleading downsampling math
category: pitfall
tags:
  - time
  - auto-loop
---

# time-series-db-implementation-pitfall

The most insidious pitfall in browser-based TSDB simulators is floating-point timestamp arithmetic. Accumulating `nowTs += 0.1` every frame causes drift that breaks bucket alignment after a few minutes — samples land in the wrong 5m/1h bucket and rollups silently diverge from raw data. Always use integer millisecond timestamps and advance by integer deltas; derive display values (e.g., seconds since start) by division at render time only. A related trap is using `Date.now()` for simulation time — if the user switches tabs, `requestAnimationFrame` pauses and the simulated clock jumps, creating a massive fake gap that confuses the retention visualization.

The second pitfall is unbounded growth. Developers instinctively `samples.push(newSample)` and the array grows until the tab crashes after ~10 minutes of simulation. TSDB simulators must enforce retention at the data-structure level, not just visually — evict samples outside the max retention window on every tick, and cap per-series buffers at a hard limit (e.g., 10k points) even if retention would allow more. For downsampling tiers, store rollups as separate ring buffers; never recompute rollups from raw samples on each render, because the whole point is showing that real TSDBs pre-aggregate.

The third pitfall is downsampling math that looks right but lies. Using simple averages for rollups hides spikes — a 1-second spike of 1000 averaged into a 1h bucket with 3599 normal samples barely moves the mean, so the anomaly "disappears" at coarser tiers. Real TSDBs store min/max/sum/count per bucket (or t-digest quantiles) precisely to avoid this. Simulators that only show mean rollups teach the wrong mental model; always display at least min/max/avg as three overlaid lines in the downsampled tier panel, and let users toggle between them to see how spike visibility degrades with aggregation. Also beware off-by-one bucket boundaries — a sample at exactly `t=3600s` belongs to the next hour bucket, not the current one; getting this wrong causes rollup totals to mismatch raw sums by exactly one sample per boundary.
