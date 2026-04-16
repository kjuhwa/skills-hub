---
name: chaos-engineering-implementation-pitfall
description: Common failure modes when building chaos engineering simulations and dashboards — cascade math errors, unrealistic recovery curves, and misleading blast radius metrics.
category: pitfall
tags:
  - chaos
  - auto-loop
---

# chaos-engineering-implementation-pitfall

The most dangerous pitfall in chaos simulation is **unbounded cascade amplification**. If downstream degradation is computed as a simple product of upstream error rate × dependency weight without clamping, a service with three degraded upstreams can exceed 100% error rate (e.g., 0.8 × 0.5 + 0.7 × 0.4 + 0.9 × 0.3 = 0.95, but add any noise and you clip past 1.0). Always clamp computed error rates to [0, 1] and throughput to [0, baseline]. A subtler variant: forgetting to cap latency causes simulated p99 values to reach absurd magnitudes (500,000ms) that break chart axis scaling. Define a max-latency ceiling (e.g., 30,000ms representing a timeout) and treat anything above it as a failed request instead.

The second pitfall is **instant recovery modeling**. Real systems don't snap back — connection pools refill gradually, circuit breakers have half-open probe periods, and caches are cold after an outage. If your simulation jumps from "100% error" to "0.1% error" in a single tick, the gameday timeline looks unrealistically clean and trains operators to expect faster recovery than reality delivers. Model recovery as an exponential decay: `errorRate(t) = peakError × e^(-(t-recoveryStart)/τ)` with τ calibrated to 5–10 ticks. Also simulate a "thundering herd" burst at recovery start where throughput temporarily spikes 2–3× baseline as queued retries flush through.

The third pitfall affects the visualization layer: **blast radius percentage that counts transitively-healthy services as affected**. If service A depends on B depends on C, and you inject a fault into C, a naive graph traversal marks both A and B as "in blast radius." But if B has a fallback (cached response, default value), it may remain healthy — and so will A. Blast radius should be computed from the actual simulated health state at observation end, not from graph reachability alone. Display both numbers if needed ("3 of 12 services reachable from fault; 2 of 12 actually degraded") so operators learn to distinguish topological exposure from realized impact. Conflating the two leads to over-scoped runbooks and unnecessary escalations during real incidents.
