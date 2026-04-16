---
name: time-series-db-visualization-pattern
description: Real-time and historical TSDB metric visualization using canvas line charts, SVG query result plots, and tiered bar charts with a dark operations-console theme.
category: design
triggers:
  - time series db visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# time-series-db-visualization-pattern

Time-series database UIs share a three-layer visualization architecture mapped to data freshness. The live-monitoring layer uses an HTML Canvas with a fixed-size sliding window (e.g., 80 points) rendered via `requestAnimationFrame`, drawing multi-series line charts with gradient fills (`color + '15'` alpha suffix) and horizontal grid lines at fixed intervals. Each series maintains its own ring buffer (`shift()` on overflow), and a stats bar computes rolling aggregates (avg, ingest rate, totals) on each tick. The query-exploration layer switches to SVG for interactive point inspection — a `<polyline>` for the trace, a `<polygon>` for the area fill, and `<circle>` elements with `<title>` tooltips per data point. Axes are computed dynamically from `min/max` of the result set with a padding constant, and Y-axis labels are interpolated at 0/25/50/75/100% of the range. The capacity-planning layer returns to Canvas for comparative bar charts where each bar represents a storage tier (hot/warm/cold), with bar height normalized to the maximum tier size and color-coded labels positioned above and below each bar.

All three layers share a unified dark theme (`#0f1117` background, `#1a1d27` card surfaces, `#6ee7b7` primary accent) that mimics operational monitoring consoles like Grafana. Stat cards use a consistent grid layout (`grid-template-columns: repeat(N, 1fr)`) with large monospaced values and muted labels beneath. Status indicators use translucent badge backgrounds (`color + '22'`) with CSS `pulse` animations to convey liveness. This pattern ensures that regardless of whether data is streaming, queried, or projected, the visual language remains consistent and operators can context-switch between tools without relearning the interface.

The key reusable technique is separating the rendering technology by interaction model: Canvas for high-frequency redraws (streaming data at 200ms intervals), SVG for low-frequency interactive results (click/hover per point), and Canvas again for comparative static charts where direct pixel control over bar positioning matters more than DOM interactivity. Each renderer is a standalone function (`draw()`, `renderChart()`, `update()`) that reads from a plain data array and writes to its target element, keeping the visualization layer stateless relative to the data layer.
