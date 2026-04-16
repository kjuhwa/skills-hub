---
name: connection-pool-data-simulation
description: Generating realistic connection pool workloads with bursty arrivals, long-tail query durations, and failure injection
category: workflow
triggers:
  - connection pool data simulation
tags:
  - auto-loop
version: 1.0.0
---

# connection-pool-data-simulation

Realistic connection pool simulation requires three independent stochastic processes layered on top of each other: (1) arrival rate — use a piecewise-Poisson process with time-of-day envelopes (e.g., 5× base rate during synthetic "business hours") plus occasional burst spikes modeled as a compound Poisson to reproduce the thundering-herd that actually exhausts pools in production; (2) query hold time — sample from a log-normal or Pareto distribution, not exponential, because real query latencies have a heavy tail and that tail is what causes `maxWait` timeouts; (3) failure/validation events — inject connection drops at a configurable rate (default 0.1%) plus correlated outages (drop 20% of the pool within a 2-second window) to exercise reaper and validation logic.

Tenant and query-tag dimensions should be seeded from a Zipfian distribution so a small number of tenants dominate traffic — this is what surfaces unfair-share behavior that round-robin or FIFO pools hide under uniform load. Include a "noisy neighbor" knob that lets one tenant emit long-running queries (10× the median hold time) so visualizations and sizer calculations can be stress-tested against the scenario operators actually care about. Every simulated event must carry `{t, tenant, queryTag, expectedDurationMs, willFail}` so downstream components (visualizer, tycoon scoring, sizer recommendation) consume the same stream.

Determinism matters: seed every RNG from a single user-controllable string so bug reports and tycoon-mode high scores are reproducible. Expose playback speed (0.1×–100×) and a "jump to next pool exhaustion" control — users rarely want to watch steady-state, they want to inspect the interesting moments. Persist the scenario as a JSON document (envelope params, seed, duration, tenant mix) rather than pre-computed events so scenarios stay compact and replay exactly across app versions.
