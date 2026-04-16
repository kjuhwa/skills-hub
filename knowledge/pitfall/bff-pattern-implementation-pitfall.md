---
name: bff-pattern-implementation-pitfall
description: Common failure modes when implementing BFF layers including fan-out amplification, coupling drift, and per-client divergence.
category: pitfall
tags:
  - bff
  - auto-loop
---

# bff-pattern-implementation-pitfall

The most dangerous pitfall in BFF implementations is **fan-out amplification without backpressure**. As the flow visualizer makes clear, a single client request to a BFF can cascade into 3–4 downstream service calls (mobile BFF hits user, order, and product services). In production, this means one slow service blocks the entire aggregated response. The simulation's random-walk latency model hides this because each BFF's latency is independent — in reality, a BFF's P99 latency converges toward the *maximum* of its downstream calls, not the average. Teams that build BFFs without per-service circuit breakers or timeout budgets discover this when a single degraded service takes down all BFF responses.

A second pitfall is **BFF coupling drift** — the tendency for per-client BFFs to diverge in implementation while silently duplicating business logic. The builder app's preset shows mobile and web BFFs both connecting to user and order services with nearly identical edges, which mirrors real projects where two BFFs independently implement the same data aggregation, caching, and error mapping. Over time, bug fixes applied to one BFF are missed in the other. The architectural promise of "tailored per-client" devolves into "duplicated and inconsistent." Teams should extract shared aggregation into a common library or a thin shared-BFF base layer, reserving per-client BFFs only for genuinely divergent response shaping (field selection, pagination strategy, payload size).

A third pitfall is **observability fragmentation**. The dashboard app treats each BFF as an independent metric channel, but in practice cross-BFF correlation is critical — if mobile and web BFFs both spike simultaneously, the root cause is almost certainly a shared downstream service, not two independent BFF issues. Teams that build per-BFF dashboards without a correlated aggregate view waste time investigating BFF-layer symptoms instead of the actual service-layer cause. The aggregated throughput card in the dashboard is a step toward this, but production systems need distributed tracing (request ID propagation through the BFF into downstream calls) to move from "all BFFs are slow" to "order-svc is the bottleneck."
