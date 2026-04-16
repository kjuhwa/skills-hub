---
name: saga-pattern-visualization-pattern
description: Reusable visual encoding patterns for rendering saga orchestration flows across DOM, SVG, and Canvas renderers.
category: design
triggers:
  - saga pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-visualization-pattern

All three saga-pattern apps converge on a four-state color vocabulary that should be treated as a visual constant: committed/done uses green (#6ee7b7), failed uses red (#f87171), compensated uses amber or purple (#fbbf24 / #a78bfa), and pending uses blue (#38bdf8). Each state maps to a filled-circle icon, a left-border accent on step cards, or a stroke color on canvas nodes. Compensation paths are always visually distinct from forward paths — the timeline app uses dashed stroke lines for compensation edges while the simulator draws downward arrows from the failed forward node to a mirrored compensation row below. This forward-row / compensation-row dual-lane layout is the strongest reusable structure: forward steps flow left-to-right on top, compensation steps mirror them below, and a vertical "failure bridge" arrow connects the failure point to the compensation chain.

Three rendering strategies emerge for different fidelity needs. DOM step-cards (orchestrator) are simplest: a vertical list of `div.step` elements with CSS class swaps (`running`, `done`, `failed`, `compensated`) driving border-color, icon, and progress-bar-fill transitions. SVG lane-based timelines (timeline) place horizontal service lanes at fixed Y intervals and plot each saga's steps as circles at `(baseX + stepIndex * offset, laneY)`, enabling multi-saga comparison on a single canvas with click-to-inspect detail panels. Canvas node-graph rendering (simulator) uses `roundRect` nodes with `drawArrow` helpers for directed edges, offering pixel-level control for animation but requiring manual hit-testing. All three apps share a scrollable log panel with per-line color classes (`ok`, `err`, `comp`) and auto-scroll-to-bottom behavior as the saga executes.

The reusable pattern is: define a `SagaStep` model with `{name, compensation, status, latency?}`, a `statusColors` map, and a `render(steps, mode)` dispatcher that routes to DOM-card, SVG-lane, or Canvas-node rendering. Each renderer reads the same step array and color map, making the visualization layer swappable without changing the saga execution engine.
