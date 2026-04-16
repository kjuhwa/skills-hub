---
name: chaos-engineering-data-simulation
description: Stochastic fault injection and cascading failure simulation patterns for generating realistic chaos experiment data without live infrastructure.
category: workflow
triggers:
  - chaos engineering data simulation
tags:
  - auto-loop
version: 1.0.0
---

# chaos-engineering-data-simulation

Simulating chaos experiment data requires three layered generators. The **service dependency graph generator** produces a directed acyclic graph of 8–20 services with realistic fan-out (each service depends on 1–3 others). Assign each service baseline metrics: latency (normal distribution, μ=50ms, σ=15ms), error rate (0.1%), and throughput (Poisson-distributed, λ=100 rps). Store the graph as an adjacency list with weighted edges representing call probability (0.7–1.0), so not every request traverses every path. This graph is the substrate all other simulations run against.

The **fault injection engine** selects a target node and applies one of four fault types — latency spike (multiply μ by 5–20×), error rate surge (jump to 30–80%), complete outage (100% errors, zero throughput), or resource exhaustion (gradual latency climb over 30–60 ticks). The key realism detail is **cascading propagation**: for each tick, downstream services degrade proportionally to their dependency weight on the faulted upstream. A service with `weight=0.9` on a downed upstream sees 90% of its own requests fail; one with `weight=0.3` sees only 30%. Apply a 1–3 tick propagation delay per hop to simulate network and retry latency. Each tick emits a snapshot `{ serviceId, tick, latency, errorRate, throughput, status }` into an array that feeds the visualization layer.

The **gameday scenario sequencer** orchestrates multi-phase experiments by defining a timeline: steady-state (ticks 0–20), injection (tick 21, specify fault type and target), observation (ticks 21–60), optional mitigation (tick 40, reduce fault severity by 50%), and recovery (ticks 60–80, exponential decay back to baseline with τ=5 ticks). Randomize the exact injection tick within a ±3 window to prevent visualization artifacts from perfectly aligned transitions. For multi-fault scenarios, stagger two injections 15–20 ticks apart targeting different services to simulate realistic compound failures. The sequencer outputs both the raw tick data and a summary object `{ mttd, mttr, blastRadiusPercent, peakErrorRate }` for dashboard KPI cards.
