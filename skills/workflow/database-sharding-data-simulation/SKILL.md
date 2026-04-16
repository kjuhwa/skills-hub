---
name: database-sharding-data-simulation
description: Stochastic data-generation strategies for simulating shard routing, load skew, hot-shard spikes, and latency degradation.
category: workflow
triggers:
  - database sharding data simulation
tags:
  - auto-loop
version: 1.0.0
---

# database-sharding-data-simulation

Realistic shard simulations require three distinct data-generation strategies matching the router, rebalancer, and monitor use cases. For **routing simulation**, generate query keys as random 8-char alphanumeric strings, hash each with a multiplicative rolling hash (`h = (h*31 + charCode) >>> 0`), and map the result to a ring position via modulo-360. The nearest-shard lookup then walks clockwise from the hashed angle to the first shard boundary. To stress-test routing, inject bursts of keys that cluster within a narrow angular range (e.g., keys "aaa0"–"aaa9" all hash near 140°) to expose uneven distribution in consistent-hash schemes.

For **load-skew simulation**, initialize N shards (typically 5–8) with a random record distribution where one or two shards receive 1.5–2× the average load. Calculate per-shard skew as `(count - avg) / avg * 100` and flag any shard exceeding 30% skew as "hot." The rebalance pass redistributes using integer floor-division with remainder: `base = floor(total / N)`, first `total % N` shards get `base + 1`. Animate the before/after state to show convergence toward uniform distribution and the residual ±1 record variance inherent in integer division.

For **health-metric simulation**, generate per-shard telemetry at 500ms intervals: QPS as a base uniform random in [200, 800] with a 5% probability spike to base + 2000, latency as base uniform in [5, 30]ms plus an additional [0, 60]ms penalty when QPS exceeds 800 (simulating connection-pool saturation), and active connections as `floor(QPS / 12) + random(0, 8)`. Maintain an 80-point rolling window per shard for time-series charting. This model captures the key real-world correlation: latency degrades non-linearly once QPS crosses a saturation threshold, which is the primary signal operators watch for when deciding whether to add shards or trigger rebalancing.
