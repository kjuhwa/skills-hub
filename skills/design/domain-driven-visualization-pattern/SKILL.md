---
name: domain-driven-visualization-pattern
description: Canvas and card-based visual encodings for DDD strategic and tactical concepts with interactive exploration.
category: design
triggers:
  - domain driven visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# domain-driven-visualization-pattern

DDD visualizations split into two rendering strategies based on the concept layer. Strategic-level concepts (bounded contexts, context maps, relationship types like Partnership/ACL/Conformist) use a canvas-based node-and-edge graph where each bounded context is a draggable circle sized by importance, connected by dashed lines labeled with DDD relationship types (Shared Kernel, Customer-Supplier, Published Language, Open Host). Hovering edge midpoints reveals tooltip popups showing directionality (e.g., Orders → Shipping) and the integration concern (e.g., "Fulfillment request"). This spatial layout lets teams physically rearrange contexts to match their mental model during event-storming sessions.

Tactical-level concepts (aggregates, entities, value objects, domain events, repositories) use a filterable card grid with tag-based faceting across two dimensions: DDD layer (Strategic vs. Tactical) and architecture tier (Domain, Application, Infrastructure, Architecture). Each card expands into a detail panel showing the full definition and a "related terms" link set that cross-references other glossary entries. The search input filters across term name, context type, and layer simultaneously, enabling rapid lookup during design discussions.

The key reusable pattern is the dual-encoding approach: use force/spatial layouts for relationship-heavy strategic views (where position and connection matter), and use filterable card grids for definition-heavy tactical views (where searchability and categorization matter). Color-coding is consistent across both — each bounded context or layer gets a stable hue (green for Orders/Domain, blue for Inventory, purple for Identity/Application) so the same color language transfers between the map view and the glossary view.
