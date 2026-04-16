---
name: saga-pattern-visualization-pattern
description: Canvas and DOM rendering patterns for saga orchestration flows, compensation cascades, and multi-service event timelines.
category: design
triggers:
  - saga pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-visualization-pattern

Saga visualizations require three complementary views, each mapping to a different mental model of distributed transactions. First, an **orchestrator flow view** renders saga steps as a horizontal or vertical node chain on an HTML5 Canvas — each node is a rounded rectangle carrying a service name, its forward action, and its paired compensation label. Arrows connect nodes left-to-right for the happy path; on failure, a reverse-direction arrow set appears in amber to show the compensation cascade unwinding. Node fill color encodes status in real time: idle (gray/dark), completed (green `#6ee7b7`), failed (red `#f87171`), compensating (amber `#fbbf24`). Animate transitions with `requestAnimationFrame` delays (300-500ms per step) so the viewer can follow the forward-then-reverse execution order.

Second, a **timeline view** lays out saga events vertically with a connector line, one dot per event, color-coded by status (`ok`/`fail`/`comp`). Each event card shows the originating service name, a human-readable action description, and a wall-clock timestamp. Group events by saga ID in a left sidebar list; clicking a saga card populates the right-panel timeline. This dual-panel layout (260px sidebar + fluid detail pane) lets users compare multiple saga executions side by side. Pre-load representative data sets — at least one fully-successful saga, one failing mid-chain, and one failing early — so every compensation depth is visible without simulation.

Third, a **compensation chain builder** uses a range slider (0 to N, where N = step count) to let users drag a failure injection point. DOM elements re-render on each `input` event: steps before the slider value turn green with a forward arrow (`→`), the step at the slider value turns red, and all completed steps gain a compensation label with a reverse arrow (`↩`). Steps beyond the failure point stay gray with a dot separator (`·`). A status bar below the chain reports either "All steps completed" or "Failed at step X — Y compensations triggered." This interactive model makes the inverse-order compensation guarantee tangible without running actual services.
