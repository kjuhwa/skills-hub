---
name: circuit-breaker-data-simulation
description: Tick-based probabilistic state machine for generating realistic circuit-breaker event streams with configurable failure injection and recovery profiles.
category: workflow
triggers:
  - circuit breaker data simulation
tags:
  - auto-loop
version: 1.0.0
---

# circuit-breaker-data-simulation

The simulation engine models a downstream dependency as a Bernoulli process: each tick (representing one request) succeeds with probability `1 - failureRate` and fails otherwise. The circuit-breaker wraps this with the standard three-state machine — Closed (counting failures in a sliding window), Open (rejecting all calls for a cooldown period), and Half-Open (allowing a limited probe budget). Configure via `{ windowSize, failureThreshold, cooldownTicks, probeBudget, probeSuccessMin }`. On each tick, emit a structured event `{ tick, state, outcome, failureCount, windowTotal, stateAge }` to feed dashboards or log panels. To simulate realistic incident scenarios, schedule failure-rate ramps: e.g., at tick 200 ramp `failureRate` from 0.02 to 0.80 over 20 ticks (simulating a downstream degradation), hold for 100 ticks, then ramp back down (simulating a fix). This produces the characteristic Closed→Open→cooldown→Half-Open→(re-trip or recover) lifecycle that exercises all visual states.

For multi-breaker simulations (e.g., a service mesh dashboard), instantiate N independent state machines with correlated failure injection — when one dependency degrades, inject a smaller sympathetic failure bump into others to simulate cascading pressure. Each machine's event stream merges into a single ordered timeline, tagged by `serviceId`. This lets a timeline visualization show how a single upstream outage ripples through multiple circuit breakers at different trip thresholds. Use a seeded PRNG (e.g., mulberry32) so runs are reproducible for demos and regression testing of the visualization layer.

Edge-case generators are critical for testing: (1) a "flapping" profile where failure rate oscillates around the threshold, causing rapid Open↔Half-Open cycling; (2) a "slow burn" where failures creep up just below threshold for hundreds of ticks before finally tripping; (3) a "thundering herd" where all N breakers trip within the same 5-tick window. Each profile stresses different rendering paths and exposes bugs in counter reset logic and cooldown timer handling that normal random testing misses.
