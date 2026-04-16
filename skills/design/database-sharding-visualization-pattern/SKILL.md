---
name: database-sharding-visualization-pattern
description: Canvas-based visual encoding patterns for shard topology, load distribution, and health monitoring in database-sharding UIs.
category: design
triggers:
  - database sharding visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# database-sharding-visualization-pattern

Shard visualizations follow a three-tier encoding model drawn from consistent-hash ring routers, rebalancer dashboards, and health monitors. The first tier is **topology mapping**: render shards as nodes on a consistent-hash ring (positioned at equal angular intervals, e.g., 5 shards at 72° apart) and animate query routing as particles traveling from the ring center to the nearest clockwise shard. The hash function maps keys to angles via `(h*31 + charCode) >>> 0 % 360`, and nearest-shard lookup computes minimal angular distance with clockwise bias. This gives operators an immediate spatial intuition for key distribution and hotspot formation.

The second tier is **load-distribution cards**: render each shard as a grid card showing record count, fill-bar height proportional to load, and a "HOT" badge when skew exceeds 30% above the mean. Statistical overlays (average, standard deviation, percentage skew) let operators judge whether rebalancing is needed before triggering it. The rebalance algorithm itself uses floor-division with remainder distribution (`base = total / n; remainder = total % n; first remainder shards get base+1`), and the UI animates the transition so operators can visually confirm convergence.

The third tier is **real-time health telemetry**: per-shard cards display QPS, p50 latency, and active connections, updated every 500ms. A canvas-based time-series chart maintains an 80-point rolling buffer of latency history per shard, drawing color-coded polylines over a grid overlay. Health status uses a three-level threshold (ok ≤30ms, warn 30–60ms, crit >60ms) rendered as colored left-border accents and dot indicators. All three tiers share a dark theme (#0f1117 background, #c9d1d9 text) with a cyclic 6–8 color palette (teal, blue, pink, amber, purple, orange) for shard identity, ensuring visual consistency across the routing, balancing, and monitoring views.
