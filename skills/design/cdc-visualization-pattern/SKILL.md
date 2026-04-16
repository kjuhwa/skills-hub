---
name: cdc-visualization-pattern
description: Reusable visual patterns for rendering CDC event streams, table diffs, and pipeline health with operation-typed color coding.
category: design
triggers:
  - cdc visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# cdc-visualization-pattern

CDC visualizations share a three-color operation taxonomy — INSERT (#6ee7b7 green), UPDATE (#60a5fa blue), DELETE (#f87171 red) — that must be applied consistently across every view: particle streams, table cell highlights, changelog badges, and connector status dots. The stream-visualizer uses canvas particles flowing left-to-right with sinusoidal drift and glow halos, where each particle encodes operation type (color), table origin (tooltip), and event sequence (monotonic counter). The table-diff uses a split-panel before/after layout with CSS cell-level highlighting (`.added`, `.changed`, `.removed` classes at 15% opacity tint) and a reverse-chronological changelog beneath. The pipeline-monitor uses card grids with status dots (running/lagging/stopped) and an SVG area chart for aggregate throughput over a 60-second sliding window. All three share a dark theme (#0f1117 background, #1a1d27 panels, #2a2d37 borders) with the accent color #6ee7b7.

The key design decision is matching visualization type to CDC concern: use **particle/flow animation** for real-time event streams where volume and velocity matter more than individual records; use **side-by-side table diff** for row-level change inspection where field-level before/after comparison is the goal; use **card grid + time-series chart** for operational monitoring where connector health and throughput trends need at-a-glance status. Tooltips on hover (stream) and inline stats (cards) provide drill-down without leaving context. The pause/resume toggle on streams is essential — without it, users cannot inspect individual events in a high-throughput flow. The table-diff's "Simulate Change" button drives the mutation-then-render cycle that produces the diff highlight, making it interactive rather than passive.

When combining these patterns, ensure the operation color map is defined once and imported everywhere — divergent color assignments between views will confuse users correlating events across a stream view and a diff view. The 1-second `setInterval` tick for pipeline monitoring is a good default cadence that balances responsiveness with CPU cost on dashboard pages.
