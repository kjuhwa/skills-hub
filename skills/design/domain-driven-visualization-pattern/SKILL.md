---
name: domain-driven-visualization-pattern
description: Canvas and DOM techniques for rendering DDD tactical and strategic patterns as interactive spatial diagrams.
category: design
triggers:
  - domain driven visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# domain-driven-visualization-pattern

All three apps share a core visualization pattern: DDD concepts are rendered as **color-coded spatial elements** with drag-and-drop repositioning, where each element type maps to a specific DDD building block. The context-map uses Canvas2D to draw bounded contexts as colored circles connected by dashed relationship lines (Partnership, ACL, Shared Kernel, etc.), with label midpoint rendering for relationship types. The aggregate-builder and event-storm apps use positioned DOM nodes instead, applying CSS classes per DDD type (`root`, `entity`, `vo`, `event`, `command`, `aggregate`, `policy`) with distinct background colors (orange for domain events, blue for commands, teal for aggregates, purple for policies). Both DOM-based apps use `mousedown→mousemove→mouseup` event chains on individual elements rather than a global hit-test loop, which simplifies multi-element boards but requires per-element listener cleanup.

The reusable pattern is: define a **type registry** (`typeLabels`, `labels`) that maps short keys to display names and colors, then use that registry to drive both the palette/toolbar UI and the board rendering. New elements are created by cloning from the registry — either via palette button clicks or drag-and-drop from chip elements onto the board. Selection state is tracked as a single `sel` reference, and a dedicated **property panel** renders editable fields for the selected node (name, type, fields list). This palette→board→property-panel triad is the consistent layout skeleton across all three apps and generalizes to any DDD concept that has a type, a label, and position on a spatial canvas.

The critical DDD-specific detail is that **relationships carry typed semantics**, not just visual connections. The context-map encodes each line with a `type` field drawn from the DDD relationship vocabulary (Customer-Supplier, Conformist, Published Language), and the event-storm implicitly encodes temporal flow through left-to-right spatial ordering of command→event→policy chains. Any reuse of this pattern must preserve typed relationship metadata — a generic graph visualizer that treats all edges the same destroys the DDD value of the diagram.
