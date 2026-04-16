---
name: connection-pool-implementation-pitfall
description: Sizing recommendations that ignore query hold-time tail and waiter-queue dynamics mislead operators
category: pitfall
tags:
  - connection
  - auto-loop
---

# connection-pool-implementation-pitfall

The most common pitfall in connection-pool sizers is applying Little's Law (`pool_size = arrival_rate × mean_hold_time`) with the mean instead of a high percentile. Real query hold times are heavy-tailed (log-normal or Pareto), so sizing to the mean produces a pool that runs fine at p50 and collapses into unbounded waiter queues at p95. Always size against p95 or p99 hold time, and separately report the expected waiter-queue length at p99 — if the recommended pool makes waiters > 0 at p99, the recommendation is misleading even when the math "checks out."

A second trap is ignoring validation and reaper overhead. A pool with `testOnBorrow=true` effectively doubles every acquire round-trip, and aggressive `idleEvictor` settings can churn 10–30% of the pool per minute under low load, meaning the apparent available capacity is lower than `max - inUse`. Visualizers that only render acquire/release without surfacing validation/eviction time produce sizer recommendations that are 15–25% too low. Always include validation spans as first-class events and subtract their aggregate duration from effective capacity before reporting headroom.

The third trap is per-tenant fairness: FIFO waiter queues under Zipfian tenant load let one noisy neighbor monopolize the pool because their requests keep arriving faster than small tenants'. A sizer that recommends a single number for a multi-tenant pool is almost always wrong — it needs either per-tenant sub-pools (bulkheads) or a weighted-fair-queue waiter policy, and the visualization needs to color waiters by tenant so the starvation is visible. Reporting only aggregate `inUse/max` hides this failure mode entirely, which is why production incidents still happen on pools the sizer called "healthy."
