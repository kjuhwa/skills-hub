---
name: pub-sub-data-simulation
description: Generate realistic publisher bursts, subscription group fan-out, and lag scenarios for pub-sub demos
category: workflow
triggers:
  - pub sub data simulation
tags:
  - auto-loop
version: 1.0.0
---

# pub-sub-data-simulation

Pub-sub simulations need three independent clocks: a publisher tick (bursty, poisson-distributed), a broker delivery tick (steady), and per-subscriber consume ticks (variable, some intentionally slow). Drive publishers from a scenario script that emits to named topics with routing keys drawn from a weighted distribution — uniform keys hide the hot-partition problem that real pub-sub systems exhibit. Include at least one wildcard subscription and one exact-match subscription per topic so matching logic is exercised.

Model subscription groups as the unit of fan-out: N groups each receive every message, but within a group only one consumer gets it (competing consumers). The simulator should expose a "slow consumer" toggle per subscriber that inflates its consume latency, producing a growing lag that cascades into visible backlog. Seed scripted scenarios for the canonical failure modes: publisher burst, subscriber crash + redelivery, poison message + DLQ routing, and a rebalance event where in-flight messages get reassigned.

Keep the simulator deterministic under a seed (for reproducible demos and tests) but allow a "live" mode with wall-clock jitter. Emit a structured event log (publish, enqueue, deliver, ack, nack, redeliver, dlq) that the visualization consumes — this decouples sim from render and lets the same scenario feed unit tests, the canvas, and a throughput chart without duplication.
