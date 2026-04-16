---
name: api-gateway-pattern-data-simulation
description: Generating realistic gateway traffic with route hits, filter outcomes, and downstream timing for demos and load tests
category: workflow
triggers:
  - api gateway pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# api-gateway-pattern-data-simulation

Simulated gateway traffic must be generated as a layered stream, not as flat random rows. Start with a Poisson arrival process per route (different lambdas per endpoint to mimic hot paths like `/api/v1/auth/*` vs cold admin routes), then for each synthetic request roll outcomes through the filter chain in order: auth-pass probability, rate-limit-token availability (token bucket with replenishment), transform success, and finally a downstream latency draw from a log-normal distribution per backend pool. Skipping the chain ordering produces impossible traces (e.g., a transform applied to a request that auth rejected) that immediately break trust in the demo.

Build in correlated failure modes: when a downstream pool's simulated latency crosses a threshold, the circuit breaker should flip to OPEN for a configurable window, after which a fraction of requests are short-circuited with a synthetic 503 — not random 503s sprinkled uniformly. Inject burst traffic windows (10x baseline for 30–60s) so rate-limit and bulkhead behavior is observable. Tag each generated record with `routeId`, `filterPathTaken[]`, `circuitState`, `retryCount`, and `downstreamPool` so the visualization layer can filter and replay.

Persist the simulation seed and config alongside the output so a reviewer can regenerate the exact dataset. Expose a "scenario" selector (steady-state, thundering-herd, partial-outage, cold-start) rather than raw knobs — operators reviewing the demo think in scenarios, not in lambda values.
