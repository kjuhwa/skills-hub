---
name: chaos-engineering-visualization-pattern
description: Reusable visual encoding patterns for rendering fault injection topology, blast radius propagation, and gameday scenario timelines in canvas/SVG dark-themed dashboards.
category: design
triggers:
  - chaos engineering visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# chaos-engineering-visualization-pattern

Chaos engineering visualizations converge on three complementary views. The **topology fault map** renders services as circular nodes on a canvas, colored by health state (green #6ee7b7 → amber #f59e0b → red #ef4444), with animated dashed edges showing dependency links. When a fault is injected, the affected node pulses and a ripple animation propagates outward along edges to downstream dependents, making cascading failure visually immediate. Node radius encodes request volume; a thicker red border indicates the node is the injection target. Use `requestAnimationFrame` with a per-frame delta to drive the ripple wavefront at a consistent speed regardless of frame rate.

The **blast radius heat grid** uses a 2D matrix where rows are services and columns are time buckets (typically 1-second ticks). Each cell is a rectangle filled on a three-stop gradient (healthy → degraded → down) based on simulated error rate or latency percentile at that tick. Hovering a cell reveals a tooltip with exact metrics. This view answers "how far did the fault spread and how fast?" at a glance. Render with SVG `<rect>` elements for crisp scaling, and batch DOM updates by building the full SVG string before insertion rather than appending cell-by-cell.

The **gameday timeline** is a horizontal swim-lane chart. Each lane represents a phase (steady-state, injection, observation, rollback, recovery) drawn as a colored horizontal bar on a shared time axis. Vertical marker lines denote key events — fault start, first alert fired, runbook triggered, full recovery. This pattern doubles as both a planning tool (before the gameday) and a post-mortem artifact (after). Implement the time axis as a linear scale mapping Unix timestamps to pixel offsets, and overlay event markers as SVG `<line>` elements with attached `<text>` labels rotated -45° to avoid overlap.
