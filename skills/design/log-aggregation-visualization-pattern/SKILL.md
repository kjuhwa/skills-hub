---
name: log-aggregation-visualization-pattern
description: Reusable layout and rendering patterns for log-aggregation dashboards covering stream feeds, severity heatmaps, and pipeline funnel views.
category: design
triggers:
  - log aggregation visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# log-aggregation-visualization-pattern

Log-aggregation visualization divides into three complementary views that share a common time-axis and severity-color vocabulary. The **stream waterfall** renders incoming log entries as a reverse-chronological feed with severity-colored left borders (red=ERROR, amber=WARN, cyan=INFO, gray=DEBUG). It must enforce a hard DOM cap (150–300 nodes) by removing `container.lastChild` after each prepend, and should use `DocumentFragment` batching when burst rates exceed 10 entries/second. The severity distribution bar at the top uses a fixed-bucket ring buffer (e.g., 60 one-second buckets) where each bucket holds counts per level; the bar re-renders from the current bucket window on every rotation tick rather than scanning the DOM. Color mapping must be consistent across all three views — define a single `LOG_SEVERITY_PALETTE` constant consumed by the waterfall border, heatmap cell fill, and funnel stage gradient.

The **heatmap grid** maps log categories (rows) against time windows (columns), with cell intensity encoding event count on a log₁₀ or quantile scale. The key design choice is cell-size vs. bucket-width: narrower time columns (5s) reveal spikes but produce horizontal scroll on 1-hour windows, while wider columns (1min) fit a single viewport but smear bursts. A responsive approach renders at the finest granularity that fits `Math.floor(viewportWidth / minCellPx)` columns and merges buckets accordingly. Tooltips on hover must show absolute count, percentage of row total, and delta from the previous time window — operators use the delta, not the absolute, to spot emerging incidents.

The **funnel analyzer** shows log events flowing through pipeline stages (Collector → Parser → Enricher → Indexer → Storage) with width proportional to throughput at each stage. Drop-off between stages represents filtered, errored, or dropped events. The funnel must distinguish intentional filtering (e.g., debug-level suppression) from loss (e.g., queue overflow), using hatched fills for intentional drops and red fills for loss. Animation of particles or flow lines between stages conveys real-time throughput but must use an object pool (pre-allocate N particle elements, toggle visibility) rather than create/destroy cycles to avoid GC pauses that manifest as visual stutters at high event rates.
