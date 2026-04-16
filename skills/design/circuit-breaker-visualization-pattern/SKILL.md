---
name: circuit-breaker-visualization-pattern
description: Visualize circuit breaker state machine (CLOSED/OPEN/HALF_OPEN) with animated request flow and failure threshold indicators
category: design
triggers:
  - circuit breaker visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# circuit-breaker-visualization-pattern

Circuit breaker visualizations must make the three-state machine (CLOSED, OPEN, HALF_OPEN) immediately legible. Use distinct color semantics — green for CLOSED (requests flowing), red for OPEN (fail-fast rejection), amber/yellow for HALF_OPEN (probing). Render the breaker as a central node with animated request particles flowing from client → breaker → downstream service, where rejected requests visibly short-circuit back at the breaker boundary in the OPEN state. A rolling failure-rate gauge or sliding-window bar chart should sit adjacent to the state indicator, with a clear threshold line (e.g., 50% failure over 10s window) that triggers state transitions when crossed.

State transitions are the most important narrative element: animate the CLOSED→OPEN flip with a visible "trip" effect, display the OPEN-state cooldown timer as a countdown ring, and show the single probe request in HALF_OPEN as a distinct styled particle whose success/failure determines the next transition. Always surface the counters driving decisions (success count, failure count, window size, consecutive successes in HALF_OPEN) so viewers can predict transitions rather than being surprised by them.

For grid/puzzle variants, treat each cell as an independent breaker with its own state and let failures propagate to neighbors via dependency edges — this externalizes cascading failure patterns. Interactive controls should let users inject failures, adjust thresholds, and force state transitions; a timeline strip at the bottom replaying state history is essential for understanding hysteresis and flapping behavior.
