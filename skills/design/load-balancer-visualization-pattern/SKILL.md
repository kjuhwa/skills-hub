---
name: load-balancer-visualization-pattern
description: Canvas-based animated packet-flow visualization showing client→LB→server routing with algorithm switching
category: design
triggers:
  - load balancer visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# load-balancer-visualization-pattern

The core visualization pattern renders a left-to-right topology on an HTML5 Canvas: a Client node on the left, a central Load Balancer node, and multiple Server nodes stacked vertically on the right. Dashed guide lines connect LB to each server. Animated "packet" circles travel in two phases — first from Client to LB, then from LB to the selected target server — using linear interpolation (`p.t += 0.018` per frame) with `requestAnimationFrame`. Each server node displays its live connection count, and color-coding shifts from green (#6ee7b7) to yellow (#fbbf24) to red (#f87171) based on health or load thresholds. The `drawNode()` helper draws a circle with a translucent fill, a colored stroke, a monospace label, and an optional metric below.

User interaction is layered on top: a dropdown `<select>` switches between algorithms (round-robin, least-connections, random), a single-send button dispatches one packet, and a burst button fires 10 packets with staggered `setTimeout` delays (80ms apart) to stress-test distribution. The `pick()` function encapsulates algorithm selection against only alive servers (`health > 0.3`), keeping the rendering loop algorithm-agnostic. A background `setInterval` at ~1200ms provides ambient traffic so the visualization is never idle.

To reuse this pattern for other distributed-system topics (rate limiters, service mesh, DNS), replace the `servers` array with the target topology, swap `pick()` for domain-specific routing logic, and adjust the two-phase packet path to match the real data flow. The key architectural insight is separating the routing decision (`pick`) from the animation loop (`draw`) and the traffic generator (`send`/`setInterval`), making each independently replaceable.
