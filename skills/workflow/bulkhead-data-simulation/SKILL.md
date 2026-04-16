---
name: bulkhead-data-simulation
description: Generate synthetic per-pool request streams with independent arrival rates, service-time distributions, and failure injection
category: workflow
triggers:
  - bulkhead data simulation
tags:
  - auto-loop
version: 1.0.0
---

# bulkhead-data-simulation

Drive a bulkhead simulator from a per-pool config record: `{poolId, maxConcurrent, queueSize, arrivalRatePerSec, serviceTimeMs: {mean, stddev}, failureRate}`. Each pool runs its own Poisson-ish arrival generator (exponential inter-arrival sampling) and its own service-time sampler (lognormal or gamma works better than normal for tail realism). Maintain per-pool counters: `inFlight`, `queued`, `accepted`, `rejected`, `completed`, `failed`. Admission logic is strictly local — `if inFlight < max: admit; else if queued < queueSize: enqueue; else: reject++`. Never consult a global counter during admission; that is the bug this pattern exists to prevent.

Tick the simulation on a fixed step (e.g., 50ms simulated) rather than real-time setInterval so that replay, pause, and speed controls are deterministic. On each tick: advance service timers, move completed requests out, pull from queue into in-flight slots, then run arrivals. Emit a per-tick snapshot record to a ring buffer keyed by pool for the visualization layer to consume. For the flood and load-dial variants, expose a time-series of arrival rate so the user can script spikes (`t=5s: pool-A rate ×10`) and observe that pool-B saturation is unchanged.

Seed the RNG from a user-visible value so scenarios are reproducible — bulkhead demos are most convincing when the viewer can rerun "the same flood" with and without isolation. Inject failures by flipping a Bernoulli per completion; failures should still release the slot so you can separately demonstrate the interaction between bulkhead and retry storms.
