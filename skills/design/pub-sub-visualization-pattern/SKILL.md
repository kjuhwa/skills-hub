---
name: pub-sub-visualization-pattern
description: Reusable visual encoding for publisher-subscriber message flow using topic-colored particles, node graphs, and fan-out animation.
category: design
triggers:
  - pub sub visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# pub-sub-visualization-pattern

All three apps share a core visual vocabulary: each topic is assigned a distinct color from a fixed palette (greens for user/order events, blues for payments/metrics, reds for alerts/failures, yellows for inventory/warnings). This topic-color binding is the primary encoding — it carries through node borders, particle fills, connection lines, column accents, and glow effects. The palette is defined once as a lookup map (`{ topicName: '#hex' }` or parallel arrays) and every visual element resolves color through that single source. When rendering nodes, publishers are drawn larger or with a ring halo to distinguish them from subscribers, which are smaller or semi-transparent. DOM-based variants (topic-board) use a `border-left` accent on message cards keyed to `--tc` CSS custom properties set at publish time.

Message delivery is animated as particle interpolation along the path publisher → broker → subscriber(s). Progress is a normalized `0→1` float incremented per frame (`+0.02` to `+0.025`), and position is linearly interpolated (`sx + (dx - sx) * t`). On arrival at the broker, the particle "fans out" by spawning one child particle per matching subscriber — this fan-out moment is the key visual that teaches pub-sub semantics. Adding `ctx.shadowColor` and `shadowBlur` on the particle creates a glow trail that reinforces the topic color. The constellation variant adds drift physics (small random velocity with boundary bounce) so nodes move organically, making the connection lines feel alive. A stats HUD (`N publishers · M subscribers · K topics · T messages`) provides real-time throughput context without cluttering the canvas.

The reusable skeleton is: (1) define a topic-color registry, (2) lay out publisher/broker/subscriber nodes with type-differentiated shapes, (3) draw faint connection lines between topic-matched pairs, (4) animate particles along those lines with progress interpolation and fan-out on broker arrival, (5) overlay a live stats counter. This pattern works for any pub-sub topology — swap topic names and subscriber routing rules to adapt to MQTT, Kafka, Redis Pub/Sub, or custom event buses.
