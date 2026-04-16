---
name: backpressure-visualization-pattern
description: Visual patterns for rendering producer/consumer rate mismatch, queue saturation, and drop/block signals in backpressure simulators.
category: design
triggers:
  - backpressure visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# backpressure-visualization-pattern

Backpressure UIs need three synchronized visual layers: a **flow layer** (particles/items moving through pipes, conveyors, or stream windows with velocity proportional to throughput), a **buffer layer** (a bounded container — valve chamber, sliding window, belt segment — with a fill gauge that changes color at soft/hard watermarks: green < 60%, amber 60–85%, red > 85%), and a **signal layer** (upstream indicators showing PAUSE/RESUME/DROP state propagating back toward the producer). The flow-valve-simulator uses particle density, reactive-stream-window uses a scrolling time-windowed queue, and conveyor-belt-jam uses stacked items — but all three share the invariant that the buffer fill % must be the single source of truth driving both downstream slowdown and upstream signaling.

Always render the **rate mismatch explicitly**: show producer rate (items/sec in) and consumer rate (items/sec out) as two numbers or twin sparklines above the buffer. Users cannot intuit backpressure from animation alone — they need to see that 100/s in vs 30/s out causes the 70/s delta to accumulate. Include a "pressure" readout (derivative of buffer fill) so viewers see acceleration toward saturation, not just current level. Drop events should flash red at the point of loss (producer-side for reject, consumer-side for overflow) and leave a fading trail for ~500ms so rapid drops remain visible.

Use **hysteresis bands** in the visualization (resume threshold strictly below pause threshold, e.g. pause at 85%, resume at 60%) and draw both lines on the buffer gauge. Without a visible resume line, users see a paused system and assume a bug. Animate the transition between states with easing, not instant snaps — backpressure is a feedback-loop phenomenon and abrupt state changes hide the lag that makes the pattern interesting in the first place.
