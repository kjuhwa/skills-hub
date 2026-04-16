---
name: distributed-tracing-visualization-pattern
description: Reusable UI patterns for rendering distributed trace data as waterfall timelines, service topology graphs, and latency heatmaps on a dark observability dashboard.
category: design
triggers:
  - distributed tracing visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# distributed-tracing-visualization-pattern

All three distributed-tracing visualizations share a common dark-theme observability shell (background `#0f1117`, borders `#2a2d37`, accent `#6ee7b7`) with a fixed service color palette mapped by index to a canonical service list (`api-gateway`, `auth-svc`, `user-svc`, `order-svc`, `payment-svc`, `inventory-svc`, etc.). The waterfall viewer renders spans as horizontally-positioned `div` bars whose `left%` and `width%` are derived from `span.start / trace.total` and `span.duration / trace.total`, with depth-based indentation on the label column. The topology map uses a canvas-based radial layout where nodes are placed at `i/n * 2PI` offsets from center, edges are simple line segments, and animated particles interpolate along edges to show request flow. The heatmap uses a canvas grid where each cell is colored via a two-stop linear interpolation (`dark-teal -> green -> red-orange`) keyed to a 0-100 normalized latency value, with rows representing services and columns representing time buckets that shift left on a `setInterval` to simulate a sliding time window.

The interaction pattern is consistent: a fixed-position tooltip (`position:fixed`, `pointer-events:none`, `z-index:99`) that tracks `mousemove` with a 12-14px X offset follows the cursor over interactive elements (span bars, canvas nodes, heatmap cells). Each tooltip renders service name in the service's accent color, plus domain-specific metrics (span duration/start, node RPS, bucket p99 latency). The tooltip is toggled via a `.hidden` CSS class rather than DOM creation/destruction. All three apps use a "generate-then-render" pipeline: a data-generation function produces a domain model (trace with spans, topology with edges, or time-bucketed latency matrix), followed by a pure render pass that maps that model to DOM or canvas. This separation makes it straightforward to swap simulated data for real OpenTelemetry collector payloads without touching the rendering layer.
