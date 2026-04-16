---
name: chaos-engineering-visualization-pattern
description: Reusable visualization patterns for chaos engineering dashboards showing service topology, failure propagation, and real-time fault metrics.
category: design
triggers:
  - chaos engineering visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# chaos-engineering-visualization-pattern

Chaos engineering UIs converge on three visual layers that should be built in order: a **topology graph**, a **cascade overlay**, and a **live metric strip**. The topology layer renders services as nodes (Canvas circles or SVG `<g>` groups) arranged in either radial layout (for peer-mesh architectures) or hierarchical top-down layout (for gateway-to-database dependency chains). Edges represent dependency relationships drawn as semi-transparent lines; use `stroke-dasharray` on affected edges and a red/green binary color scheme (`#f87171` fail, `#6ee7b7` healthy) to instantly communicate blast radius without legends.

The cascade overlay animates failure propagation via expanding ring pulses on affected nodes. The reusable technique is a decay-based pulse: set `pulse = 1.0` on fault injection, decrement by `0.02` per animation frame, and render a concentric circle at `baseRadius + pulse * 20` with `opacity = pulse * 0.3`. For SVG implementations, use CSS keyframe ripples (`r: 20 → 60`, `opacity: 0.6 → 0` over 1s ease-out) and force reflow with `void el.offsetWidth` before re-adding the active class to retrigger animation on repeat clicks. This avoids the common pitfall of animations not replaying.

The live metric strip uses a sliding-window Canvas line chart: maintain a 60-element ring buffer (`push/shift`), redraw every 500ms, and overlay a horizontal dashed threshold line (e.g., 200ms latency SLO, 5% error budget) using `setLineDash([4,4])`. Apply `createLinearGradient` under the line (60% opacity top → 5% bottom) to create area-chart depth. Always clamp values with `Math.min(v/max, 1)` to prevent spikes from exceeding the chart bounds, and sync canvas pixel dimensions to `clientWidth`/`clientHeight` on each draw to avoid blurry rendering on resize.
