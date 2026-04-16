---
name: service-mesh-data-simulation
description: Timer-driven simulation of sidecar proxy metrics, circuit breaker state machines, and traffic particle systems for realistic service mesh behavior without a live control plane.
category: workflow
triggers:
  - service mesh data simulation
tags:
  - auto-loop
version: 1.0.0
---

# service-mesh-data-simulation

The data simulation layer models three distinct service mesh behaviors using client-side timers. For traffic metrics, a `setInterval` at 1500ms jitters each sidecar's p99 latency (±5ms), throughput (±100 rps), error rate (±0.3%), and CPU (±4%), all clamped to sensible bounds (`Math.max`/`Math.min`). This random-walk approach produces realistic-looking dashboard fluctuations without needing Prometheus or an actual Envoy data plane. Sparkline history is maintained as a fixed-length array with `shift()`/`push()` to create a sliding window effect — a cheap ring buffer that avoids unbounded memory growth, critical when simulating many proxies.

For circuit breaker simulation, each service maintains a finite state machine with three states: `closed` (normal), `open` (tripped), and `half-open` (probing). The transition logic mirrors real Istio/Envoy outlier detection: failures increment a counter, and when a threshold is reached (default 5), the breaker opens with a cooldown timer (8 ticks). After cooldown expires, the breaker enters half-open and requires a streak of 3 consecutive successes to close. Fault injection is toggled per-service via click handlers, raising the failure probability from 5% to 70% — simulating what `istioctl experimental fault inject` would do in a real mesh. State transitions are logged to a prepended, capped event log (max 60 entries) with timestamps.

For topology traffic, a particle system spawns objects on each edge with a progress parameter `t` that advances by a randomized speed (0.005–0.015 per frame). When `t` exceeds 1, the particle resets to the source. New particles are probabilistically spawned (`Math.random() < 0.02`) to simulate bursty microservice traffic. This combination of random-walk metrics, FSM-based circuit breaking, and particle-based traffic flow covers the three primary observability concerns of a service mesh — telemetry, resilience, and topology awareness — entirely client-side.
