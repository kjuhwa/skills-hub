---
name: service-mesh-visualization-pattern
description: Canvas-based topology and card-grid patterns for rendering service mesh nodes, sidecar proxies, and inter-service connections with real-time health states.
category: design
triggers:
  - service mesh visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# service-mesh-visualization-pattern

Service mesh visualizations follow a two-tier rendering approach. The topology layer uses an HTML5 Canvas with services placed radially (angle-based positioning around a center point) and edges drawn between dependent services. Animated particles travel along edges to represent live traffic flow — each particle carries a `t` parameter (0→1) that interpolates between source and destination coordinates, with randomized speed to simulate variable latency. Nodes pulse using a sine-wave radius modulation and are color-coded by health state: green (`#6ee7b7`) for healthy, red (`#ef4444`) for degraded, and amber (`#fbbf24`) for warning. A stats bar summarizes node count, connection count, and sidecar proxy count.

The detail layer uses a responsive CSS grid of cards, one per sidecar proxy (e.g., `envoy-proxy-frontend`, `istio-ingress`, `order-sidecar`). Each card surfaces four mesh-specific metrics: p99 latency (ms), throughput (rps), error rate (%), and CPU utilization via a colored progress bar. Inline SVG sparklines render rolling time-series data within each card — a 20-point polyline that shifts left on each tick. The tri-color status system (healthy < 1% errors, warn < 3%, critical >= 3%) is consistent across both topology and card views, creating a unified visual language. The dark background palette (`#0f1117` base, `#1a1d27` cards, `#2a2d37` borders) is deliberate: mesh dashboards are typically monitored on NOC screens where dark themes reduce eye strain.

Both layers share a common CSS reset, Segoe UI font stack, and consistent spacing tokens. The pattern separates data model (array of service objects with name/metrics) from rendering (a `render()` function that regenerates DOM or redraws canvas), enabling the simulation engine to mutate data independently from the draw loop. This decoupling is essential because mesh topologies can have dozens of services updating at different intervals.
