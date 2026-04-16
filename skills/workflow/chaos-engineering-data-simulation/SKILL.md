---
name: chaos-engineering-data-simulation
description: Patterns for simulating realistic chaos engineering fault injection, failure cascade, and metric degradation without real infrastructure.
category: workflow
triggers:
  - chaos engineering data simulation
tags:
  - auto-loop
version: 1.0.0
---

# chaos-engineering-data-simulation

Chaos engineering simulations model three layers of data: **baseline metrics**, **fault modifiers**, and **cascade propagation**. Baseline metrics use bounded random walks — latency at `40 + Math.random() * 15` ms, error rate at `0.05 + Math.random() * 0.1`%, throughput at `1200 + Math.random() * 100` req/s. These ranges create realistic jitter without trends. Fault modifiers are either additive (latency injection adds `180 + random * 80` ms) or multiplicative (packet loss multiplies throughput by `0.4`). The key insight is that some faults compound across metrics: packet loss should simultaneously degrade throughput AND add latency from retries, not just affect one dimension. Track active faults in a `Set` for O(1) toggle and allow multiple simultaneous faults to stack their effects.

For service-level simulation, model a node state machine with three states: `alive → killed → recovering`. Kill selection uses uniform random sampling from the alive pool at a fixed cadence (e.g., `setInterval(killRandom, 1500)`), with an intensity parameter controlling batch size (1–10 nodes per wave). Recovery uses jittered timers: `baseDelay + Math.random() * jitterRange` (e.g., 2000 + random * 3000 ms) to prevent synchronized recovery thundering herds. Use `splice()` to remove from the alive array during batch kills to prevent double-kills in the same wave.

For blast radius computation, build a reverse dependency map (`dependents[serviceId] → [consumers]`) on-demand from the service topology, then run BFS from the failed node using a `Set` for visited tracking. This correctly handles diamond dependencies (multiple paths to the same service) and is safe against circular dependencies. Express blast radius as `affected.size / total * 100` percent. The simulation should classify severity by fault count: 0 faults = nominal (green), 1 = degraded (amber), 2+ = critical (red). This simple heuristic maps well to real incident severity levels and avoids over-engineering complex health scoring.
