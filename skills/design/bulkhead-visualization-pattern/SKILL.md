---
name: bulkhead-visualization-pattern
description: Render bulkhead compartments as isolated panels with per-pool saturation meters and a shared reject/overflow lane
category: design
triggers:
  - bulkhead visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# bulkhead-visualization-pattern

Visualize a bulkhead by mapping each isolated resource pool to its own compartment panel arranged in a grid or ship-hull layout. Every panel owns three visual channels: a capacity bar (active/queued/max slots), a saturation color ramp (green→amber→red as in-flight approaches max), and a per-pool reject counter badge. The critical design property is that panels must be visually independent — borders, gutters, and separate axes — so viewers intuit that saturation in pool A does not bleed into pool B. This is the whole point of bulkhead and the UI must reinforce it.

Add a shared overflow/reject lane that is visually distinct from the compartments (e.g., a bottom trough or side gutter). When a pool rejects, animate the request sliding from that compartment into the reject lane rather than disappearing — this makes isolation visible as "rejected here, others still flowing." Overlay a global throughput line chart that stacks per-pool contributions so the viewer can see that degrading one pool caps its band while other bands continue unaffected. Avoid a single shared queue visualization; it defeats the mental model.

For the load-dial and flood variants, add a controllable input rate per pool (slider or pressure gauge) and render incoming requests as particles entering their assigned compartment. Use a fixed legend showing pool identity, max concurrency, and queue depth so readers can correlate the policy configuration with observed saturation. Keep animation timing tied to simulated time, not wall-clock, so pause/step controls work predictably.
