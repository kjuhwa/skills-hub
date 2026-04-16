---
name: bff-pattern-visualization-pattern
description: Animated canvas-based flow visualization showing client-to-BFF-to-microservice request routing with particle effects.
category: design
triggers:
  - bff pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# bff-pattern-visualization-pattern

The BFF flow visualization uses a three-column node layout (clients → BFF layers → backend services) rendered on an HTML5 Canvas. Each column represents a tier in the BFF architecture: client devices (mobile, web, IoT) on the left, per-client BFF proxies in the middle, and shared microservices on the right. Nodes are drawn as rounded rectangles with tier-specific color coding (green for clients, amber for BFFs, indigo for services). Static connection lines between tiers use low-alpha strokes to convey the routing topology without visual clutter, while a `bffRoutes` map defines which services each BFF fans out to.

Request flow is animated via a particle system driven by `requestAnimationFrame`. Each particle interpolates linearly between a source and target node, with a glow effect (`shadowBlur`) matching the tier color. When a client-to-BFF particle completes, it cascades into multiple BFF-to-service particles with staggered `setTimeout` delays, visually demonstrating the BFF aggregation pattern — one inbound request fans out to N downstream calls. An auto-fire interval sends random client requests every 3 seconds to keep the visualization alive without user interaction.

The color palette (`#0f1117` background, `#1a1d27` card surfaces, `#6ee7b7` accent green, `#f59e0b` amber, `#818cf8` indigo) and dark-theme styling are shared across all three BFF apps and form a cohesive design system. Typography uses Segoe UI at small sizes (0.7–0.85rem) for a compact monitoring aesthetic. This same node-and-edge rendering approach extends to the Builder app's SVG variant, where nodes become draggable and connectable, proving the layout model works across both Canvas 2D and SVG renderers.
