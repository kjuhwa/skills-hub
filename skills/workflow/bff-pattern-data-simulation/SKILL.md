---
name: bff-pattern-data-simulation
description: Stochastic latency simulation modeling per-service delays, BFF overhead, and sequential-vs-parallel aggregation to generate realistic request traces.
category: workflow
triggers:
  - bff pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# bff-pattern-data-simulation

The simulation models two request modes. In "without-BFF" mode, the client calls N microservices sequentially — each service incurs an independent random delay (`rand(80,200)` ms) and total latency is the sum of all delays, representing N network round trips. In "with-BFF" mode, the client makes a single call to the BFF (overhead `rand(10,30)` ms), then the BFF fans out to all services in parallel — total latency is `bffOverhead + Math.max(...serviceDelays)`, representing one round trip where the bottleneck is the slowest downstream service. This max-of-parallel vs sum-of-sequential model is the essential BFF latency formula and should be preserved in any simulation.

Per-platform differentiation is achieved by varying the service subset each BFF calls. The Web BFF aggregates all 4 services (User, Product, Cart, Recommend), while Mobile BFF calls only 2 (User, Product) — reflecting real-world BFF tailoring where mobile clients need leaner payloads. Individual service latencies use `rand(40,180)` for normal operation. A rolling window of the last 20 request latencies is maintained per client type, and average latency is computed as `sum/count` for the bar chart. This windowed averaging smooths out variance while keeping the chart responsive to recent trends.

The simulated response payload is constructed by merging mock data objects keyed by service name (`{User: {name,tier}, Product: {items,featured}, ...}`). Each BFF aggregates only the services it called, producing a client-specific composite response — this demonstrates the BFF's data-shaping responsibility. The simulation drives three synchronized output channels: a chronological request log (tagged by client type with color-coded badges), an aggregated JSON response preview, and a comparative bar chart. To extend this pattern, add failure injection (random service timeouts), cache-hit modeling (skip service call, return cached slice), or rate-limiting simulation per BFF tier.
