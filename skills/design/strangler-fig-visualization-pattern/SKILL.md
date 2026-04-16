---
name: strangler-fig-visualization-pattern
description: Side-by-side legacy/modern pane visualization with traffic routing overlay for strangler-fig migration progress
category: design
triggers:
  - strangler fig visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# strangler-fig-visualization-pattern

When visualizing a strangler-fig migration, render the legacy monolith and the new microservice(s) as two spatially-separated panes (left=legacy, right=modern) connected by a routing facade/proxy layer drawn between them. Each capability or route is a node that physically migrates from the legacy pane to the modern pane over time — use position interpolation rather than color-only state changes so the "strangling" metaphor is visually literal. Render percentage-of-traffic as edge thickness on the facade layer, and use a vine/growth motif (gradient from brown→green, or dashed→solid edges) to reinforce that the new system is progressively overtaking the old.

Always include a third overlay showing the facade/router decision logic — a horizontal bar split by percentage allocation per endpoint, updated live. This is the single most informative element because strangler-fig's defining characteristic is the routing shim, not the endpoints themselves. Provide per-capability drill-down panels that show: current routing %, error rate delta between legacy and modern, and a "retirement readiness" score (derived from traffic %, parity test pass rate, and soak time).

For timeline-style views, use a Gantt-like horizontal band per capability with three phases color-coded: `proxied` (facade added, 0% to modern), `migrating` (1–99% to modern), `retired` (100% + legacy code deleted). Never show binary "old vs new" states — the whole point of strangler-fig is the intermediate coexistence period, and the visualization must make that middle phase the most prominent.
