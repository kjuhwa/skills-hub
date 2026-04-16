---
name: circuit-breaker-visualization-pattern
description: Reusable visual encoding patterns for rendering circuit-breaker state machines, failure rate gauges, and trip/recovery timelines in canvas or SVG.
category: design
triggers:
  - circuit breaker visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# circuit-breaker-visualization-pattern

A circuit-breaker has exactly three states — Closed, Open, and Half-Open — and the most effective visualization encodes each as a distinct color zone (green/red/amber) on a radial gauge or state-node graph. The gauge's needle position maps to the current failure ratio against the configured threshold, so operators see proximity-to-trip at a glance. State transitions are best animated as arc sweeps rather than instant color swaps: a Closed→Open trip sweeps the gauge from green through amber to red over 300ms, giving the eye time to register the change. For a dashboard view, pair the gauge with a rolling sparkline of success/failure counts per sliding window; for a timeline view, render state intervals as colored horizontal bands on a time axis so the pattern of trip–cooldown–probe–recover is immediately legible.

The data-binding layer should separate the circuit-breaker model (state, counters, timestamps, config thresholds) from the rendering loop. Expose a `CircuitBreakerSnapshot` interface with fields `{ state, failureCount, successCount, failureRate, threshold, cooldownMs, lastStateChange }` and let the visualization poll or subscribe to snapshot updates. This decoupling lets the same rendering code drive a live dashboard (WebSocket-fed snapshots), a simulator (tick-driven snapshots), or a post-mortem timeline (array of historical snapshots). Canvas is preferred for real-time gauges with >10 fps update rates; SVG is better for the timeline view where individual state-bands need hover tooltips and click-to-zoom.

For the Half-Open probing phase, render a pulsing amber ring around the gauge center with a counter showing "probe N of M." Each probe result (success/failure) should flash a small dot on the ring perimeter — green for pass, red for fail — so the user watches the recovery attempt unfold. If the probe budget is exhausted with failures, animate the snap back to Open (red sweep); if probes pass, animate the sweep to Closed (green). This micro-animation of the Half-Open decision loop is the single most valuable visual affordance a circuit-breaker UI can provide, because it's the state operators most often misunderstand.
