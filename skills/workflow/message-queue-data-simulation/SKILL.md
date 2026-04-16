---
name: message-queue-data-simulation
description: Synthetic workload generator for exercising queue backpressure, priority inversion, and fan-out scenarios
category: workflow
triggers:
  - message queue data simulation
tags:
  - auto-loop
version: 1.0.0
---

# message-queue-data-simulation

Message queue demos need simulated workloads that expose characteristic behaviors of each topology. Build a pluggable producer driver with three profiles: steady-rate (constant λ for conveyor/FIFO demos), bursty-priority (Poisson bursts with skewed priority distributions for heap demos), and topic-fanout (weighted topic selection with variable subscriber counts for pub-sub demos). Parameterize each profile with sliders — arrival rate, priority skew, burst size, topic cardinality — so users can provoke edge cases like starvation, head-of-line blocking, or slow-subscriber backpressure on demand.

Consumer simulation is equally important: model service time as a distribution (exponential for realistic jitter, fixed for deterministic demos) and let users inject failure modes like nack-with-requeue, consumer crash, or slow-consumer drag. For priority heaps, seed scenarios that demonstrate priority inversion — low-priority messages starving when a high-priority firehose arrives — and expose an age-based promotion knob so users can see how aging policies resolve it. For pub-sub, seed scenarios where one slow subscriber backs up the whole fan-out to motivate per-subscriber buffering.

Always drive simulation from a seedable PRNG so the same scenario replays identically, and ship 4–6 named preset scenarios (`steady`, `burst`, `starvation`, `slow-consumer`, `topic-hotspot`, `crash-recovery`) as entry points. Record every simulated event to an append-only log that the visualization layer consumes, keeping simulation and rendering decoupled so the same workload can drive multiple topology views side-by-side.
