---
name: retry-strategy-visualization-pattern
description: Three complementary visual encodings for retry delay curves, attempt timelines, and strategy comparison races.
category: design
triggers:
  - retry strategy visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# retry-strategy-visualization-pattern

Retry strategies demand three distinct visual layers that these apps collectively establish. **Timeline view** (Simulator) uses a Canvas-based horizontal lane where each attempt is a color-coded dot (`#6ee7b7` success, `#f87171` failure) positioned proportionally to elapsed wall-clock time, with dashed connector lines between consecutive attempts to emphasize the growing gap as backoff increases. The key trick is dynamic x-axis scaling: `scale = width / Math.max(ceiling, lastAttemptTime * 1.2)` keeps the timeline readable regardless of whether fixed 500ms or exponential 30s+ delays are in play. **Curve chart** (Composer) uses SVG with a jitter band rendered as a filled polygon — trace `hi` values left-to-right, then `lo` values right-to-left, close the path — overlaid with a crisp delay line and dot markers per attempt. This band encoding instantly communicates how much variance jitter introduces at each retry level, which a bare line chart cannot. A cumulative-delay column in a companion table anchors the visual to concrete numbers. **Race lanes** (Battle) use DOM-based pip grids where each pip transitions through `wait → fail/ok` CSS classes with staggered `setTimeout(tick, 200)` to create an animated reveal. Three strategy lanes share an identical pre-rolled failure sequence (`Array.from({length: MAX}, () => Math.random() < 0.65)`), so the only variable is the backoff formula — making the winner immediately attributable to the strategy, not luck. The shared failure array is the critical design decision; without it, visual comparison is meaningless.
