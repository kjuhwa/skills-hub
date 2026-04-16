---
name: object-storage-implementation-pitfall
description: Common bugs in object-storage visualization — bubble sizing distortion, hover desync with animated radius, latency chart clipping, and lifecycle cost accumulation drift.
category: pitfall
tags:
  - object
  - auto-loop
---

# object-storage-implementation-pitfall

**Bubble/treemap proportionality distortion:** The bucket-viz sizes circles via `Math.max(12, sqrt(size/total) * 120)`, which clamps small objects to a 12px minimum radius. When a bucket contains a few massive objects alongside many tiny ones, the floor makes sub-1% objects appear visually equivalent to 5-10% objects, destroying the proportional mapping that makes the visualization useful. This is the object-storage version of the classic treemap minimum-cell-size problem. The same distortion appears if you use CSS Grid `fr` units with a floor (`Math.max(w*100, 10)`) for a flat treemap layout. Fix by either rendering sub-threshold objects as a grouped "other" cluster, or switching to a squarified treemap that maintains proportionality at the cost of uniform shape.

**Hover hit-testing desync and animation drift:** If objects pulse or orbit (as in galaxy-style visualizations where radius oscillates via `r * (1 + 0.3 * sin(t))`), hover detection must test against the *rendered* radius, not the base radius. The bucket-viz correctly tests against `o.r` because it doesn't animate radius, but adding any size animation without updating the hit-test breaks hover — users see their cursor inside the visual circle but get no tooltip. Similarly, the collision-push physics (`push = (minDist - dist) * 0.3`) can push objects outside the canvas bounds if many objects cluster in a corner; the boundary reflection (`if x < r then vx *= -1`) only checks velocity, not position, so objects can escape by one frame's worth of push displacement. The latency-monitor's SVG polyline has its own issue: with a fixed `maxY = 250` for the Y axis, any spike above 250ms clips off the top of the chart silently, giving a false ceiling to latency readings.

**Lifecycle cost accumulation drift:** The lifecycle-sim adds daily tier costs to a running `totalCost` variable every time `render()` is called, but `render()` is also invoked on `reset()` and initial load. This means the first render inflates the cost total before day 1 begins. Over many play/pause/reset cycles, the accumulated total drifts from the true integral of daily costs. A subtler issue: the `reset()` function sets every object back to `tier: 'hot'` but doesn't regenerate randomized transition thresholds — replaying always produces the same lifecycle sequence, which misleads users into thinking the simulation is deterministic when the initial seed was random. For any object-storage cost simulation, separate the cost-computation step from the render step, and re-seed transition parameters on reset to avoid stale-state replay.
