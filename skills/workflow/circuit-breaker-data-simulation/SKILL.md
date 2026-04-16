---
name: circuit-breaker-data-simulation
description: Generate realistic circuit breaker request/failure streams with configurable failure modes and recovery patterns
category: workflow
triggers:
  - circuit breaker data simulation
tags:
  - auto-loop
version: 1.0.0
---

# circuit-breaker-data-simulation

Circuit breaker simulations need request streams that exercise all three states meaningfully, not just random noise. Model requests as a Poisson arrival process with configurable RPS, then overlay failure modes: transient spikes (burst of failures then recovery — should trip and reset cleanly), sustained degradation (slow failure rate climb — tests threshold sensitivity), flapping (failures oscillating around threshold — tests hysteresis), and gray failures (timeouts vs. 5xx vs. slow responses, each counted differently). Each simulated request carries a latency, outcome (success/failure/timeout), and timestamp so the sliding window can be computed identically to production code.

The simulation clock must be decoupled from wall time — expose a speed multiplier (1x, 10x, 100x) and a step mode so users can watch individual state transitions frame-by-frame. Maintain the canonical breaker state (failure count, success count, last-failure-time, state-entered-at) in a single reducer, and emit events (REQUEST, STATE_CHANGE, PROBE_SENT, PROBE_RESULT) that both the visualization and the metrics panel subscribe to — never let the view compute state independently or drift will appear.

For the puzzle/grid variants, seed scenarios with known-good solutions: e.g., "trip breaker within 5 seconds using ≤10 requests" or "keep breaker CLOSED despite 40% failure rate." Deterministic seeds (RNG seeded from scenario ID) are essential so a shared puzzle state reproduces identically across users. Record replay logs as (timestamp, request-outcome) tuples — compact, diffable, and sufficient to reconstruct any run.
