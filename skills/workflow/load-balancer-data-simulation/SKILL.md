---
name: load-balancer-data-simulation
description: Real-time server metric simulation with multi-algorithm comparison lanes and statistical fairness tracking
category: workflow
triggers:
  - load balancer data simulation
tags:
  - auto-loop
version: 1.0.0
---

# load-balancer-data-simulation

The simulation pattern maintains a state matrix — one row per algorithm, one column per server — where each cell tracks `{ load, total }`. On every tick (400ms interval), a randomized batch of 1–3 requests is dispatched simultaneously across all algorithm lanes, and each lane's picker function selects a target server independently. Load drains probabilistically each tick (`Math.random() > 0.4` → decrement), modeling variable response times without needing real async I/O. This create-drain loop produces realistic oscillating load curves that expose how each algorithm handles bursty, uneven traffic.

The dashboard variant adds per-node metrics (CPU%, RPS, latency) with bounded random walks (`cpu += (Math.random() - 0.48) * 6`, clamped to 5–99) and derives health status from thresholds: >88% CPU = critical, >70% = warning, else healthy. A 60-sample rolling history array feeds a canvas sparkline of aggregate RPS, providing temporal context. The `renderCards()` function rebuilds DOM each tick with inline-styled progress bars whose color matches the status tier — a pattern that avoids framework overhead while keeping the UI responsive at 1Hz updates.

The fairness comparison is the most reusable element: after each tick, the simulator computes standard deviation (σ) of current load across servers for each algorithm and displays it as a stat card. Lower σ means better distribution. This side-by-side "algorithm race" pattern — identical traffic stream, different routing strategies, same metric — is directly applicable to benchmarking any selection algorithm (cache eviction, task scheduling, shard routing). The key is ensuring all lanes receive the exact same request sequence so the comparison is controlled.
