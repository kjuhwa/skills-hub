---
name: actor-model-visualization-pattern
description: Render actor systems using layered visual encoding — shape for identity, color for health state, animation for message activity, and spatial layout for hierarchy.
category: design
triggers:
  - actor model visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# actor-model-visualization-pattern

Actor-model visualizations require three distinct visual layers mapped to actor semantics. First, **identity and topology**: actors are rendered as distinct nodes (Canvas circles for flat topologies, SVG rects for hierarchical supervision trees, DOM cards for lifecycle grids) with spatial layout encoding the relationship — circular arrangements for peer-to-peer messaging, recursive tree layouts with vertical depth for supervision hierarchies, and flex-wrap grids for lifecycle monitoring dashboards. Each rendering technology suits a different interaction pattern: Canvas excels at high-frequency animation like message flight paths using linear interpolation (`x = ax + (bx-ax)*t`), SVG enables click-target hit-testing on individual tree nodes for crash injection, and DOM cards allow rich per-actor state display with CSS transition-driven health bars.

Second, **state encoding through color and opacity**: a two-color system (teal `#6ee7b7` for alive/healthy, red `#f87171` for crashed/dead) is applied consistently across stroke, fill, and connection lines. Dead actors reduce opacity to 35% to visually recede without disappearing, preserving the topology for context. Health is shown as a proportional bar fill (`width: ${health}%`), while restart counts use small badge overlays positioned at the node corner. Third, **activity animation**: message flow uses interpolated dots traveling sender-to-receiver with exponential pulse decay (`pulse *= 0.93`) on receipt to create a "heartbeat" effect on active actors. Mailbox indicators (emoji + count) provide at-a-glance queue depth. The key reusable principle: never animate topology — animate *activity within* a stable topology, so users can build spatial memory of the system while watching dynamic behavior unfold.

Across all three apps, the dark background (`#0f1117`) with monospace typography creates a terminal-like aesthetic that signals "systems infrastructure" to the viewer. This visual language is domain-appropriate and should be maintained: actor-model UIs are developer tools, not consumer products, so information density takes priority over whitespace.
