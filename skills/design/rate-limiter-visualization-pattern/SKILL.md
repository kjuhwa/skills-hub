---
name: rate-limiter-visualization-pattern
description: Visual pattern for rendering token bucket fill levels, request particle effects, and allowed/rejected event timelines in browser-based rate limiter UIs.
category: design
triggers:
  - rate limiter visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# rate-limiter-visualization-pattern

Rate limiter visualizations share a core visual vocabulary: a **bucket metaphor** rendered on Canvas or SVG where fill level maps directly to available capacity. The token-bucket visualizer draws a rectangular vessel (strokeRect) with a colored fill region whose height is `(tokens / maxTokens) * bucketHeight`, transitioning from green (#6ee7b7) when healthy to red (#f87171) when near-exhaustion (threshold < 2 tokens). Individual tokens are rendered as circles in a grid layout inside the bucket (`cols = 5, r = 14`), giving users an immediate count. Particle effects — small circles with negative velocity and decaying `life` — fly upward on each request, colored green for allowed and red for rejected, providing real-time feedback that persists for ~40 frames before filtering out via `particles.filter(p => p.life > 0)`.

The dashboard variant replaces the single-bucket view with per-endpoint cards using a three-tier color system (green < 60%, yellow 60-90%, red > 90% utilization) and horizontal progress bars (`div.bar-fill` with CSS `transition: width 0.4s`). A stacked bar chart drawn on Canvas shows the last 60 seconds of traffic history, with green bars for allowed requests stacked above red bars for blocked, scaled to `Math.max(10, maxTotal)` to prevent visual collapse at low traffic. The playground variant uses SVG to plot an event timeline where allowed requests appear as circles at y=100 and rejected at y=200 along a time axis, with optional window-shading rectangles (semi-transparent fill `#6ee7b711`) that highlight the active fixed-window boundary. All three share the dark theme palette (`#0f1117` background, `#1a1d27` panels, `#6ee7b7` accent) and monospace text for counters.

The key design decision across all three apps is **dual-channel feedback**: every request produces both a visual artifact (particle, dot, bar segment) and a textual log entry or counter update. This redundancy ensures that users can understand rate limiter behavior whether they're watching the animation or reading the numbers. Controls are always colocated with the visualization — sliders for rate/burst, number inputs for window/max, and action buttons (single request + burst/flood) — so users can immediately see cause-and-effect when tuning parameters.
