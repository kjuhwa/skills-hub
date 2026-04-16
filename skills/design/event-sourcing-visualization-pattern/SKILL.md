---
name: event-sourcing-visualization-pattern
description: Dual-panel layout pairing a scrollable event log with a live-projected aggregate state, using Canvas/SVG for temporal or distributional charts.
category: design
triggers:
  - event sourcing visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# event-sourcing-visualization-pattern

All three event-sourcing apps share a consistent visualization architecture: a dark-themed monospace UI (`#0f1117` background, `#6ee7b7` accent) with a scrollable event feed on one side and a computed projection on the other. The timeline app uses a Canvas horizontal timeline with sequenced dots, the replay app uses a range slider for temporal navigation, and the stream monitor uses an SVG pie chart plus a Canvas sparkline for events/sec. The reusable pattern is: always render the raw event log (with sequence number, type, and payload) alongside the derived state so the user can see causality — events on the left, projection on the right.

The event feed component follows a fixed structure: prepend or append `<div>` elements with color-coded event types, auto-scroll to the latest entry, and cap the DOM at a fixed child count (e.g., 80 nodes) to prevent memory bloat. Each event is rendered with its sequence marker (`#N`), a colored type label, and a compact payload summary. The projection panel re-runs the fold/reduce from scratch on every render — a deliberate choice in small demos that mirrors the "replay from zero" property of event sourcing and makes the state-derivation logic transparent and testable. Charts (Canvas 2D for timelines and rate graphs, inline SVG for proportional breakdowns) are drawn procedurally on each cycle with `clearRect` or full `innerHTML` replacement rather than a retained scene graph.

CSS across all three apps is intentionally minimal and structurally identical: a flex or grid container, `.scroll-box` with `max-height` and `overflow-y: auto`, `.card`/`.panel` wrappers with `border-radius: 6px` and `#1a1d27` fill, and button styling with a translucent border (`#6ee7b744`). This uniformity means the layout skeleton is directly copy-pasteable for any new event-sourcing visualization — swap the event types, the projection function, and the chart, and the shell works unchanged.
