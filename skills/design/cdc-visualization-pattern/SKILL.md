---
name: cdc-visualization-pattern
description: Dark-themed real-time visualization pattern for CDC event streams using canvas particles, side-by-side table diffs, and SVG topology graphs.
category: design
triggers:
  - cdc visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# cdc-visualization-pattern

CDC visualizations follow a three-view pattern that maps directly to the CDC pipeline lifecycle. The **stream monitor** uses an HTML5 canvas with a particle system where each CDC event (INSERT/UPDATE/DELETE) spawns a colored dot traveling left-to-right, with a trailing fade effect (`rgba` overlay at 0.15 alpha per frame). Operation types are color-coded consistently across all views: green (#6ee7b7) for inserts, yellow (#f0c674) for updates, and red (#f07178) for deletes. A scrolling event log beneath the canvas provides textual detail while aggregated counters (INS/UPD/DEL) give at-a-glance throughput. This dual-channel approach — ambient animation plus structured log — prevents the operator from needing to choose between situational awareness and forensic detail.

The **table diff viewer** renders before/after snapshots side-by-side, cell-diffing by matching rows on a stable `id` column and comparing serialized field values. Changed cells get a green-tinted background, deleted rows are struck-through in red, and inserted rows appear in blue (#7ec8e3). A clickable dot timeline at the bottom allows scrubbing through the event history, with each dot colored by operation type and highlighted with a `box-shadow` glow when active. This pattern lets operators replay a sequence of mutations to understand how a table evolved, which is critical when debugging CDC lag or replication anomalies.

The **topology map** uses SVG with quadratic Bézier curves connecting a left-to-right pipeline: sources (databases) → connector (Debezium) → broker (Kafka) → sinks (Elasticsearch, Redis, Warehouse). Animated `<circle>` elements travel along `<animateMotion>` paths to show data flow, with a gaussian blur glow filter for visual salience. Nodes are laid out in column groups by type using proportional x-coordinates (12%/35%/55%/85% of viewport width), and each type gets a distinct color (source green, connector yellow, broker blue, sink purple). Hover interactions surface per-node metadata like event rate and consumer lag. The entire dark theme (#0f1117 background, #1a1d27 panels, #2a2d37 borders) is shared across all three views for visual cohesion.
