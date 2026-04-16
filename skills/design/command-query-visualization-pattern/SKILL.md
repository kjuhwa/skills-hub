---
name: command-query-visualization-pattern
description: Canvas/SVG pipeline and chart visualization distinguishing commands from queries by color, shape, and motion.
category: design
triggers:
  - command query visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# command-query-visualization-pattern

The command-query visualization pattern uses a dual-color semantic encoding — orange (#f97316) for commands (state-mutating operations) and teal/green (#6ee7b7) for queries (read-only operations) — applied consistently across canvas animations, SVG bar charts, and DOM log feeds. Pipeline views render named stages (Client → Bus → Handler → Store → Projector) as rounded rectangles connected by directional arrows, with animated circular packets labeled "C" or "Q" traversing the stages using `requestAnimationFrame`. A sinusoidal y-offset (`Math.sin(progress * PI * 4) * 12`) gives packets a wave motion that visually distinguishes concurrent flows without overlap. All three apps share a dark theme (#0f1117 background, #1a1d27 panels) with monospace-style feeds for technical readability.

For time-series monitoring, a sliding-window stacked bar chart (SVG `<rect>` elements, 40-bar window shifting every 1 second) shows command vs. query throughput over time. Each bar splits into a command segment (bottom, orange with alpha) and a query segment (top, teal with alpha), scaled against a dynamic max. The live event feed uses `prepend` for reverse-chronological ordering and caps DOM children at 50 to prevent memory growth. Key stats — total commands, total queries, C:Q ratio, and rolling average latency — are rendered as a top-line stat bar giving operators an instant read on system balance.

The reusable skeleton is: (1) define domain-specific operation names for commands and queries separately, (2) color-code every visual element by operation type using the orange/teal convention, (3) bound all collections (particles filtered at `progress > 1.05`, feed capped at 50, chart window at 40, latency buffer at 100), and (4) use dual timers — a fast timer (300ms) for event generation and a slower timer (1s) for window advancement — to decouple event granularity from visualization frame rate.
