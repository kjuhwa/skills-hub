---
name: time-series-db-data-simulation
description: Simulating realistic TSDB ingest streams, query result sets, and storage capacity projections using trigonometric wave functions with noise for metric plausibility.
category: workflow
triggers:
  - time series db data simulation
tags:
  - auto-loop
version: 1.0.0
---

# time-series-db-data-simulation

Time-series data simulation for TSDB tools follows three distinct generation patterns matched to the monitoring context. For live ingest simulation, each metric series is driven by a sine or cosine wave keyed to `Date.now()` with a unique period (e.g., `/2000`, `/3000`, `/1500`) to prevent visual correlation, combined with a baseline offset and a `Math.random()` noise term scaled to 8–12% of the signal range. This produces data that looks organically variable without being random — CPU oscillates around 40% with ±20 swing, memory drifts around 55% with ±15 swing, and disk IO centers at 20% with ±18 swing. Points are generated in batches (3 per tick at 200ms) to simulate realistic ingest rates of ~15 pts/sec per series, and the sliding window discards old data to maintain constant memory pressure.

For query result simulation, the generator accepts a metric name, aggregation function, and count parameter, then produces time-bucketed rows at fixed intervals (5-minute buckets via `300000ms` offsets). Each metric type has its own value profile: temperatures range 15–28°C, CPU 15–75%, request counts 400–1400 req, and latencies 12–52ms. The query parser uses a regex (`/(avg|max|min|sum|count)\((\w+)\)/i`) to extract the aggregation function and metric name from a SQL-like input string, falling back to sensible defaults when the parse fails. This allows the sandbox to respond dynamically to arbitrary user-typed queries while always producing plausible-looking result sets.

For capacity projection simulation, the model computes storage consumption from first principles: `ingest_rate × seconds_per_day × retention_days × bytes_per_point` (using 16 bytes/point as a realistic TSDB data point size covering timestamp + float64 value). Downsampled tiers apply a compression factor (5% for 5-minute averages, 1% for hourly aggregates) to the raw calculation, reflecting real-world rollup ratios. Cost is derived at `$0.023/GB/month` (S3-class pricing), and a savings percentage is computed by comparing the tiered total against a hypothetical all-raw-retention scenario. This arithmetic model lets users interactively explore the storage/cost tradeoff space via range sliders without needing a backend.
