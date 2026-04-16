---
name: distributed-tracing-data-simulation
description: Patterns for generating realistic simulated distributed trace data including hierarchical span trees, service dependency graphs, and time-bucketed latency distributions.
category: workflow
triggers:
  - distributed tracing data simulation
tags:
  - auto-loop
version: 1.0.0
---

# distributed-tracing-data-simulation

The trace-waterfall-viewer generates span trees using a recursive `addSpan(parent, start, depth)` function capped at `depth > 4`, where each span picks a random service from a fixed registry, computes duration as a fraction of remaining trace time (`5 + random * (total - start) * 0.5`), and spawns 0-3 child spans at staggered offsets. The root span always fans out to 3 children, mimicking a gateway-to-microservice fan-out. Total trace duration is randomized between 80-300ms. Each span carries `{id, parent, service, start, duration, depth, color}` — a minimal but complete model that maps directly to OpenTelemetry's span schema (traceId, spanId, parentSpanId, serviceName, startTime, duration). The `uid()` function produces 8-character hex IDs via `Math.random().toString(16).slice(2,10)`, suitable for display but not collision-resistant at scale.

The service-topology-map defines a static adjacency list (`edges = [[0,1],[0,3],...]`) modeling gateway-centric fan-out with shared cache dependencies, plus per-node metadata (`rps`, `color`, `radius`). Animated request flow is simulated by spawning particles on edges in staged `setTimeout` waves (0ms, 300ms, 500ms) to mimic cascading downstream calls. The heatmap simulates a sliding-window latency distribution: an 8-service x 30-bucket matrix initialized with `Math.random()*100`, shifted left every 2 seconds with a new random bucket appended — modeling a 30-minute p99 latency window at 1-minute granularity. Across all three apps, the key simulation principle is: keep the service registry canonical and shared, generate just enough structural realism (parent-child depth, fan-out degree, time-staggered cascades) to exercise the visualization, and normalize all values to percentages or bounded ranges so the rendering layer needs no domain-specific scaling logic.
