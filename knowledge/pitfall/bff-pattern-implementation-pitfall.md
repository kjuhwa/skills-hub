---
name: bff-pattern-implementation-pitfall
description: Common failures when implementing Backend-for-Frontend: shared BFF drift, duplicated logic, and client-service coupling leaks.
category: pitfall
tags:
  - bff
  - auto-loop
---

# bff-pattern-implementation-pitfall

The most dangerous BFF pitfall is **shared BFF drift** — teams start with dedicated BFFs per client but gradually merge them into a single "universal" BFF to reduce code duplication. This recreates the monolithic API gateway the pattern was designed to eliminate. The routing table (Mobile→[Users,Orders], Web→[Users,Orders,Inventory], IoT→[Inventory]) shows why separation matters: each BFF calls different service subsets, applies different response shaping, and evolves at different rates. When a "shared" BFF tries to serve all clients, it accumulates conditional logic (`if mobile then strip fields`), becomes a deployment bottleneck, and couples all client release cycles together. The fix is to accept duplication in BFF layers as the lesser evil — each BFF is intentionally narrow and disposable.

The second pitfall is **business logic leaking into the BFF layer**. BFFs should only handle response aggregation, field filtering, and protocol translation — not domain rules. When latency profiles diverge unexpectedly (e.g., Mobile BFF suddenly as slow as Web BFF despite smaller payloads), it often signals that orchestration logic or data joins that belong in backend services have migrated into the BFF. The visualization pattern makes this visible: if a BFF's fan-out arrows multiply beyond its original service subset, logic is leaking. A healthy Mobile BFF calls 2 services; if it starts calling 4, audit what moved.

The third pitfall is **missing observability per BFF instance**. Because each BFF has fundamentally different latency baselines and throughput patterns (45ms/1200RPS vs 60ms/400RPS), a single aggregated dashboard hides problems. A 50ms p99 looks healthy globally but means the Mobile BFF (baseline 45ms) is degraded while the IoT BFF (baseline 60ms) is fine. Each BFF needs its own latency chart, its own alerting thresholds, and its own SLO — the dashboard pattern with per-BFF color-coded channels exists precisely because averaging across BFFs is meaningless. Teams that skip per-BFF monitoring discover problems only when client-specific bug reports arrive.
