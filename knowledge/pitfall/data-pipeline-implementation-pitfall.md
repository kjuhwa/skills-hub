---
name: data-pipeline-implementation-pitfall
description: Common failure modes when building data pipeline visualizations — particle leaks, DAG cycle corruption, and metric drift.
category: pitfall
tags:
  - data
  - auto-loop
---

# data-pipeline-implementation-pitfall

The most insidious bug in particle-based pipeline monitors is memory leaks from un-reaped particles. Error particles linger until their timer expires, but under sustained high error rates (>20%) they accumulate faster than they age out, causing the particle array to grow unbounded. The fix is a hard pool cap (e.g., 500) with oldest-dead-first eviction, not time-based expiry alone. A subtler variant: if the easing factor is too low, particles never reach the stage-boundary snap threshold (`Math.abs < 3`), becoming immortal ghosts that drift forever and silently inflate memory. Always stress-test with extreme easing values and sustained error bursts to catch both failure modes.

The DAG builder's most dangerous gap is the absence of cycle detection. Double-clicking two nodes in reverse order silently creates a backward edge, turning the DAG into a cyclic graph. The "Run Pipeline" command still completes because it iterates the flat edge array rather than performing a topological sort, masking the corruption entirely. In a real system this causes infinite loops or deadlocks. Every edge insertion must validate acyclicity — a DFS from the target node checking reachability of the source is O(V+E) and prevents the entire class. Additionally, the edge model stores ID pairs but never prunes dangling edges on node deletion, so extending the builder with a delete feature requires an edge-cleanup pass.

The throughput dashboard generates each metric with independent `Math.random()` calls, producing states that are physically impossible in real pipelines — 0% errors alongside 40% backpressure, or rising throughput during a cascading failure. Operators who train on uncorrelated metrics internalize wrong patterns and miss real anomalies in production where metrics co-move causally. The simulation must enforce soft coupling: when backpressure exceeds a threshold, nudge error rate upward and throughput downward. Without this, the dashboard is a random number display dressed as monitoring, actively harmful to building operational intuition.
