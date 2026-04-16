---
name: backpressure-data-simulation
description: Strategies for generating realistic backpressure scenarios with controllable producer/consumer imbalance, wave propagation, and load-shedding behavior.
category: workflow
triggers:
  - backpressure data simulation
tags:
  - auto-loop
version: 1.0.0
---

# backpressure-data-simulation

The three apps demonstrate three complementary simulation strategies. The **rate-imbalance model** (pipeline app) uses two independent slider-driven rates — producer and consumer — and a bounded queue (`MAX=40`). Each tick, the producer emits items probabilistically (`Math.random() < 0.6`), and if backpressure is enabled, the effective producer rate is throttled to `Math.min(producerRate, consumerRate + (MAX - queue.length) / 4)`. This formula is the key reusable piece: it creates a soft feedback loop where the producer slows proportionally to remaining queue headroom, rather than hard-stopping at capacity. Items that arrive when the queue is full increment a `dropped` counter, giving a clear load-shedding metric. The **wave-propagation model** (waves app) treats N nodes as a 1D spring system where each node's velocity is updated by `(left.p - self.p) * 0.15 + (right.p - self.p) * 0.15` with a damping factor of 0.96. A constant `inflow` of 0.008 at node[0] plus user-triggered bursts (+0.7 to the first 8 nodes) creates realistic pressure fronts that travel through the chain and decay. This models how backpressure propagates across microservice hops with latency. The **multi-service dashboard model** randomizes per-service in/out rates each tick (`±random offset`), accumulates `queue += max(0, in - out)`, and triggers two automatic responses when thresholds are hit: load-shedding at 100% capacity (`in -= 30%`) and probabilistic consumer scale-up at 50% (`out += 15` with 30% chance). This three-layer approach — random perturbation, deterministic accumulation, threshold-triggered response — produces realistic bursty behavior without needing real traffic data.
