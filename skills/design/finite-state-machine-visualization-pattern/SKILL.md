---
name: finite-state-machine-visualization-pattern
description: Render FSM states and transitions using Canvas circles/Bezier curves or SVG paths with current-state highlighting, animated transition dots, and accept-state double-ring indicators.
category: design
triggers:
  - finite state machine visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# finite-state-machine-visualization-pattern

FSM visualization splits into two proven approaches depending on interactivity needs. For drag-and-drop or animated simulations, use an HTML5 Canvas with a `requestAnimationFrame` loop: store each state as an object carrying `{x, y}` coordinates, draw states as circles (30 px radius works well), and render transitions as quadratic Bezier curves with arrowhead markers. Highlight the active state with a distinct fill (`#6ee7b7` convention) and animate a dot traveling along the Bezier path using a 0-to-1 `t` interpolation value incremented each frame. For static or SVG-based renderers (e.g., regex-to-NFA diagrams), position states linearly across the viewport (`spacing = width / (n - 1 || 1)`), draw self-loops as short quadratic arcs curving above the node, and mark accept/final states with a concentric double circle. Both approaches share three UI obligations: (1) a real-time state label bound to `fsm.current`, (2) a transition-history log that `prepend()`s entries so the newest appears first, and (3) button/control rendering that queries `availableEvents(currentState)` so only valid transitions are clickable. When the FSM controls a physical metaphor (traffic lights, vending machines), replace the graph with domain-appropriate widgets—colored bulbs, LED glow via CSS `box-shadow`—but keep the history log and state label identical, because users still need the abstract state name alongside the concrete visual.

Reuse checklist: define a `StateMap` object keyed by state name with rendering metadata (position, color, duration, shape), a `TransitionTable` (array of `{from, to, event}` or nested object `{[state]: {[event]: nextState}}`), and a `draw(currentState, animProgress)` function that loops over both collections. This three-piece contract lets you swap Canvas for SVG or for a physical-widget renderer without touching simulation logic.
