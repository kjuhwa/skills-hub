---
name: message-queue-visualization-pattern
description: Canvas-driven visual grammar for rendering message queue flows across conveyor, heap, and pub-sub topologies
category: design
triggers:
  - message queue visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# message-queue-visualization-pattern

Message queue visualizations share a three-zone canvas layout: producers on the left, the queue structure (FIFO lane, priority heap tree, or pub-sub grid) in the center, and consumers on the right. Each message is rendered as a colored token carrying metadata overlays — priority score, topic tag, enqueue timestamp, and retry count — so viewers can trace a single message's journey without toggling views. Use stable token IDs and monotonic color assignment per producer so the eye can follow a message across enqueue, dwell, and dequeue phases.

The queue structure itself dictates the center-zone primitive: conveyor topologies use a horizontal lane with directional arrows and a visible head/tail marker; priority heaps render a binary tree with sift-up/sift-down animations triggered on insert/extract; pub-sub grids use a matrix where topics are rows and subscribers are columns with fan-out edges lighting up on publish. Animate state transitions (enqueue, promotion, delivery, ack) with 200–400ms eases so operators perceive causality rather than teleportation, and always surface queue depth, in-flight count, and oldest-message-age as persistent HUD counters.

Keep a synchronized event log panel adjacent to the canvas showing `[t+ms] ENQUEUE msg#42 prio=7` style entries — this lets users cross-reference visual events with exact ordering during demos and debugging. Drive everything from a single authoritative event stream so replay, step-forward, and speed controls stay consistent across all three topology variants.
