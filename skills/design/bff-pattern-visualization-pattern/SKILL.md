---
name: bff-pattern-visualization-pattern
description: Three-tier canvas/SVG flow diagram showing client-to-BFF-to-microservice request routing with animated particle traces and glow-on-select feedback.
category: design
triggers:
  - bff pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# bff-pattern-visualization-pattern

The core visual encoding is a three-column left-to-right topology: clients on the left (each color-coded by platform — Web/#60a5fa, Mobile/#f472b6, IoT/#fbbf24), BFF nodes in the center (uniform accent color #6ee7b7), and backend microservices on the right (neutral #94a3b8). Dashed connector lines (#334155, stroke-dasharray 4,4) show static wiring, while the active request path is revealed through animated particles that lerp along the connectors. Each client maps to exactly one BFF (1:1 affinity), but each BFF fans out to a subset of services (1:N mapping stored in a `bffToSvc` adjacency list). Clicking a client node triggers a two-phase animation: phase 1 spawns particles from client→BFF, then after a 500ms delay phase 2 fans particles from BFF→each downstream service — visually demonstrating the aggregation/fan-out responsibility of the BFF layer.

For side-by-side comparison (as in the comparator app), use dual SVG panels: one showing direct client-to-service wiring (N round trips, sequential animation) and another inserting the BFF intermediary (1 round trip, parallel fan-out). Animated line segments (`requestAnimationFrame` tick advancing x2/y2 from source to target) replace particles in SVG mode. The key metric to surface beneath each panel is total latency and round-trip count — e.g., "Total: 340ms (3 round trips)" vs "Total: 170ms (1 round trip, parallel fan-out)". This dual-panel before/after layout is the most effective encoding for demonstrating BFF value because it makes the sequential-vs-parallel tradeoff visually self-evident.

Nodes are rendered as rounded rectangles (`roundRect` r=6-8, or SVG `rect` rx=6) with a translucent fill (color + `22` alpha) and solid 2px stroke. Active/selected nodes get a `shadowBlur=18` glow in the node's color. The dark background (#0f1117) with card panels (#1a1d27) and muted text (#94a3b8 secondary, #e2e8f0 primary) follows a consistent dark-mode palette across all three apps. Reuse this exact palette and node style for any BFF-domain visualization.
