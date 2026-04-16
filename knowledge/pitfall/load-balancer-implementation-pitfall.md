---
name: load-balancer-implementation-pitfall
description: Common failure modes when building load balancer simulators and visualizations
category: pitfall
tags:
  - load
  - auto-loop
---

# load-balancer-implementation-pitfall

(see below)
description: Common failure modes when building load balancer simulators and visualizations
content: The most common pitfall is confusing scheduling granularity with rendering granularity — developers tie request completion to `requestAnimationFrame` callbacks, so at 30fps the simulation runs at half speed and least-connections looks artificially stable. Always maintain a logical clock that advances by a fixed dt per tick and run N ticks per frame when playback speed > 1×; never let the render loop drive state changes. A related trap: using `Date.now()` for hash inputs or jitter makes runs non-reproducible, which destroys the ability to compare algorithms fairly. Seed every random source and expose the seed in the URL.

Consistent-hash implementations repeatedly get virtual-node count wrong. With fewer than ~50 vnodes per backend, the ring is visibly lumpy and the "balanced distribution" claim fails — viewers see 3 backends getting 60%/25%/15% of keys and conclude the algorithm is broken. Use 100–200 vnodes minimum, and when visualizing the ring, render vnodes as thin tick marks rather than full-sized nodes so the density is readable. Another subtle bug: when a backend is removed, implementations often rebuild the entire sorted hash array instead of splicing out just that backend's vnodes, which is O(N log N) per failure and makes rapid failure/recovery animations stutter. Keep the ring as a sorted array with a removal index map.

Health-check visualizations frequently mislead by conflating "failed health check" with "backend down." Real systems use consecutive-failure thresholds (e.g. 3 failed checks before eviction) and hysteresis on recovery (e.g. 2 successful checks before re-admission) — skipping this produces flappy animations where a single jittered probe kills a backend, which is both inaccurate and confusing. Model the state machine explicitly: `healthy → suspect (1-2 fails) → unhealthy (threshold) → recovering (1 success) → healthy`, and render the intermediate states with distinct colors so the viewer understands why a struggling backend isn't immediately evicted. Finally, don't forget to decrement active-connection counters on simulated request completion even when the backend has been marked unhealthy — orphaned counters are a classic simulator bug that makes least-connections route to a dead backend forever.
