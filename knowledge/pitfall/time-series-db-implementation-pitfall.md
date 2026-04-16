---
name: time-series-db-implementation-pitfall
description: Common failure modes in TSDB front-end tools including unbounded buffer growth, resolution-unaware rendering, and misleading capacity models.
category: pitfall
tags:
  - time
  - auto-loop
---

# time-series-db-implementation-pitfall

The most critical pitfall in TSDB live-monitoring UIs is unbounded memory growth from uncapped data buffers. In the live-monitor pattern, the `shift()`-on-overflow approach works for a single dashboard instance, but if the max window size is configured too large or multiple series are added dynamically, the arrays grow without limit until the browser tab crashes. A subtler variant occurs when the ingest interval (`setInterval` at 200ms) and the render loop (`requestAnimationFrame` at ~16ms) are decoupled — if the tab is backgrounded, browsers throttle `requestAnimationFrame` to ~1fps but `setInterval` continues, causing the data buffer to fill without being drawn. When the tab is foregrounded, the render loop must suddenly process a backlog, causing visible frame drops. The fix is to gate data ingestion on document visibility (`document.hidden`) or use a single `requestAnimationFrame`-driven loop for both ingestion and rendering.

A second pitfall lies in resolution-unaware chart rendering. The query sandbox generates a fixed 12-point result set regardless of the time range in the query (`now() - 1h` vs `now() - 30d`), which means the visualization density is identical for one hour of data and one month. In a real TSDB, a query spanning 30 days at 5-minute resolution returns 8,640 points — rendering each as an SVG `<circle>` with a `<title>` tooltip creates thousands of DOM nodes, causing severe rendering lag. The pattern should dynamically adjust point count based on the query's time range and the chart's pixel width (target ~1 point per 2–4 pixels), or switch from SVG to Canvas when the result set exceeds a threshold (~500 points).

The retention planner's capacity model introduces a deceptive accuracy pitfall. The formula `rate × 86400 × days × 16 bytes` assumes constant ingest rate and fixed point size, but real TSDB workloads exhibit strong diurnal patterns (10x traffic spikes during business hours) and variable point sizes due to tag cardinality and string-valued labels. The 16-byte assumption covers only a bare timestamp+value pair — with tags, a typical Prometheus or InfluxDB point is 100–200 bytes. Additionally, the compression ratio is hardcoded at 8:1, but actual ratios vary from 3:1 (high-entropy random metrics) to 20:1 (monotonic counters) depending on the data shape. Presenting these estimates without confidence intervals or input fields for bytes-per-point and compression ratio gives users false confidence in their capacity plan, potentially leading to under-provisioned storage that triggers emergency retention policy changes in production.
