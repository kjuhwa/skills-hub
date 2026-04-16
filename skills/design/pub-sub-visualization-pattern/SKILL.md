---
name: pub-sub-visualization-pattern
description: Canvas-based layout for rendering publishers, broker topics, and subscriber fan-out with animated message flow
category: design
triggers:
  - pub sub visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# pub-sub-visualization-pattern

Pub-sub visualizations share a recurring three-column topology: publishers on the left, a central topic/broker column (often split into per-topic lanes), and subscribers on the right grouped by subscription group. Each topic lane should be rendered as a horizontal swimlane with a visible backlog depth indicator (unacked count) and a retention window marker so viewers can distinguish a slow consumer from a dropped message. Use SVG or Canvas with a fixed coordinate grid keyed off topic name so subscriber reordering does not reflow the publisher side.

Animate message flow as discrete tokens traveling along bezier paths from publisher → topic → each matched subscriber, with the token carrying its routing key/headers as a tooltip. Fan-out must be visualized as parallel token emission at the topic node (not sequential), otherwise users misread pub-sub as point-to-point. Color-code tokens by topic and fade them on ack; use a red pulse on the subscriber node when a NACK or redelivery occurs. Keep the broker node "fat" (tall rectangle) to visually accommodate multiple topic partitions stacked vertically.

For scale, cap visible in-flight tokens (e.g., 50) and render aggregate throughput counters on edges when exceeded — trying to animate every message at 10k msg/s kills the browser. Persist a mini-timeline strip below the canvas showing publish rate vs. consume rate per topic so lag is visible at a glance, which is the single most important diagnostic signal in pub-sub systems.
