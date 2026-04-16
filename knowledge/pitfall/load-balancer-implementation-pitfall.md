---
name: load-balancer-implementation-pitfall
description: Common failure modes when implementing load-balancer simulations—connection lifecycle bugs, threshold flicker, and weighted-random bias.
category: pitfall
tags:
  - load
  - auto-loop
---

# load-balancer-implementation-pitfall

The most dangerous bug in load-balancer simulations is forgetting to decrement the active connection count after a request completes. The least-connections algorithm selects the server with the fewest active connections, so if connections are only incremented on dispatch but never decremented on completion, every server converges to the same count and the algorithm silently degrades to round-robin. In a real system this manifests as hot servers staying hot despite "least connections" being enabled. The fix requires a simulated response lifecycle: schedule a decrement after a randomized delay (representing response time), and ensure the decrement fires even if the visualization tab is backgrounded (use `setTimeout`, not frame-based timers, for connection lifecycle).

Health-status thresholds without hysteresis cause status flicker—a node at 85.1% CPU alternates between "healthy" and "degraded" on every tick because random jitter pushes it across the boundary in both directions. This creates noisy alerts and unusable dashboards. The fix is a hysteresis band: transition to "degraded" at 85% but only recover to "healthy" below 80%. The same applies to the down/degraded boundary. Without this, dashboards using CSS class swaps (green ↔ yellow ↔ red) will produce a strobing effect that obscures real incidents. In production load balancers, this maps directly to health-check flapping, where a node is repeatedly pulled in and out of the pool.

Weighted-random distribution has a subtle sample-size bias: with weights [3,2,2,1,1] and only 20 requests, the actual distribution can deviate significantly from the target ratio (33%/22%/22%/11%/11%). Developers often test with small request counts, see uneven distribution, and assume the algorithm is broken. The variance only converges to the expected distribution at ~200+ requests. Additionally, implementing weighted random with a naive linear scan of the cumulative weight array is O(N) per request; for large server pools (50+ nodes), this becomes a bottleneck—binary search over the cumulative array reduces it to O(log N). A second pitfall is using `Math.floor(Math.random() * totalWeight)` with integer weights, which introduces off-by-one bias at the boundaries if the weight array isn't constructed carefully (the last server gets one fewer chance if the total is exclusive).
