---
name: connection-pool-visualization-pattern
description: Rendering connection pool state as discrete slot arrays with color-coded lifecycle phases and waiter queues
category: design
triggers:
  - connection pool visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# connection-pool-visualization-pattern

Connection pools visualize best as a fixed-length array of slot cells where each cell represents a physical connection. Each slot surfaces four orthogonal dimensions at once: occupancy (idle/active/validating/closed), lease age (via fill intensity or a mini-progress bar inside the cell), tenant or query tag (via hue), and health (via border color — green healthy, amber validating, red broken). Next to the pool grid, render a separate "waiter queue" lane as a horizontal strip of pill-shaped tokens ordered left-to-right by arrival time, so starvation and FIFO violations are visible at a glance. Avoid pie charts or aggregate bar graphs for the pool itself — they hide per-connection identity, which is the whole point.

Pair the slot grid with three always-visible scalar gauges anchored above it: `inUse/max`, `waiting`, and `p99 acquire latency`. When a connection transitions (acquire, release, invalidate, reap), animate only the affected slot with a sub-200ms flash on the border — never reflow the grid. Slot position must be stable across the whole session so operators build muscle memory for "slot 7 is the one that keeps dying." For pools larger than ~64 connections, switch to a wrapped grid with row labels (partition, shard, or connection-id range) rather than shrinking cells; readability of an individual slot trumps fitting the whole pool on one screen.

Timeline view is the natural companion: a horizontal swimlane per slot with acquire/release spans as filled rectangles, overlaid with validation/eviction events as vertical tick marks. This makes pool-exhaustion episodes obvious — you see vertical bands where every lane is simultaneously filled — and lets users scrub time to correlate with the app-side query that caused the spike. Keep the slot grid and timeline on the same color scale so tenant/query identity carries between views.
