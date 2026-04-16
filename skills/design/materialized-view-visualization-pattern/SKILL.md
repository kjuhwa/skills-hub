---
name: materialized-view-visualization-pattern
description: Side-by-side base-table vs materialized-view panels with staleness indicators and refresh timeline
category: design
triggers:
  - materialized view visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# materialized-view-visualization-pattern

Render materialized-view concepts using a dual-panel layout: the left panel shows the underlying base tables (rows streaming in, write timestamps, change counters) and the right panel shows the materialized view (aggregated/joined projection with last-refresh timestamp). Connect them with an animated refresh pipeline — a directional flow bar that pulses during REFRESH events and reports rows scanned, rows emitted, and duration. Color-code freshness: green when view age < refresh interval, amber when approaching the threshold, red when stale beyond SLA.

Augment with a horizontal timeline/Gantt strip that plots three overlapping series: base-table writes (ticks), refresh windows (bars), and query reads (dots colored by which snapshot they hit). This lets viewers see the core tension — writes continue while the view is frozen between refreshes, and queries land on a snapshot whose age equals `now - lastRefreshAt`. Expose controls for refresh strategy (COMPLETE vs INCREMENTAL/CONCURRENTLY), refresh cadence, and write rate so the staleness/cost tradeoff becomes visually obvious.

For graph-style variants, model the view as a DAG node whose inputs are base-table nodes and whose edges carry "last propagated delta" metadata; highlight the transitive invalidation path when an upstream table receives a write, so users see which downstream views become stale.
