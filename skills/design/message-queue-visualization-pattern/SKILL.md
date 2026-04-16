---
name: message-queue-visualization-pattern
description: Canvas-based producer-consumer flow visualization with animated message transit, queue-depth bars, and particle effects for consumption events.
category: design
triggers:
  - message queue visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# message-queue-visualization-pattern

Message queue visualizations work best when they render three distinct spatial zones on a single canvas: a producer region (left), a queue rail (center), and a consumer region (right). Each message is represented as a small rounded-rect card carrying a short ID or topic label, and messages animate horizontally from producer to their slot in the queue rail using eased interpolation (`x += (targetX - x) * 0.12`). When a message is consumed, it is removed from the queue array and a burst of small particles spawns at its last position, giving tactile feedback that processing occurred. A stats line (`Queue: N | Processed: N`) updates every frame to keep the mental model grounded. The dark theme (`#0f1117` background, `#1a1d27` card surfaces, `#6ee7b7` accent) is shared across all three apps and creates strong contrast for the green message cards against the dark rail.

For dashboard-style monitoring, pair a throughput sparkline (canvas line chart with area fill at 8% opacity) with horizontal bar-tracks showing per-queue depth as a percentage. Each bar uses a track/fill pattern (`#2a2e3a` track, `#6ee7b7` fill) with CSS `transition: width 0.5s` for smooth depth changes. A scrollable event log (monospace, prepend-latest, cap at ~40 entries) and a 2x2 KPI grid (enqueued, dequeued, errors, throughput-%) complete the four-panel layout. The grid uses `grid-template-columns: 1fr 1fr` with 12px gaps, and each card has consistent border-radius (10px) and padding (14px). A blinking "LIVE" indicator (`animation: blink 1s infinite` toggling opacity) signals real-time data flow.

For interactive routing exercises, present a message card with a type label and body text, then offer shuffled queue-name buttons as routing targets. Correct routing triggers a `scale(1.05)` pulse with green border; incorrect routing triggers a `shake` keyframe animation and red border (`#f87171`), and the misrouted message is logged into a visible Dead Letter Queue list with a red left-border accent. This three-variant pattern (flow animation, monitoring dashboard, routing game) covers the full spectrum of message-queue educational UIs.
