---
name: strangler-fig-implementation-pitfall
description: Common failure modes when implementing strangler fig migration visualizations and simulations — stage boundary glitches, facade consistency gaps, and ecosystem boundary collapse.
category: pitfall
tags:
  - strangler
  - auto-loop
---

# strangler-fig-implementation-pitfall

The growth visualization's most fragile point is the stage-to-progress mapping. Using `Math.floor(progress * 5)` with a clamped progress (`Math.min(t, 1)`) creates an edge case: at exactly `progress = 1.0`, the expression yields `5`, which overflows the 5-element stages array (indices 0-4). The code guards this with `Math.min(4, ...)`, but if the clamp is removed or the speed multiplier allows `t` to exceed 1.0 between frames, the stage label becomes `undefined`. A related issue: the host tree's alpha formula `1 - progress * 0.8` never reaches zero — at full progress the trunk is still 20% visible. This is biologically correct (the hollow trunk persists), but developers often "fix" this by changing the multiplier to 1.0, which causes the trunk to vanish abruptly rather than leaving the characteristic hollow shell.

In the migration simulation, the biggest pitfall is allowing the facade routing to become inconsistent with actual migration state. The current implementation re-derives all three panels from the single `migrated` Set on every render, which guarantees consistency. But a common refactoring mistake is to cache the route panel separately or animate the transition asynchronously — this can create a window where the facade shows "→ new service" but the service panel hasn't rendered the target yet, visually implying the route points to nothing. In a real strangler fig migration, this is the equivalent of routing traffic to a service that isn't deployed yet — the most dangerous failure mode of the pattern. Always derive facade state from the same source of truth as both the legacy and modern panels.

The ecosystem simulation's boundary system (attract inward at 280px, repel outward at 60px) creates a stable annular region, but the force coefficients (0.002 for attraction, 0.003 for repulsion) are asymmetric by design — repulsion is stronger to prevent organisms from overlapping the fig trunk. If these are equalized during refactoring, organisms will drift into the trunk and accumulate at the center, destroying the visual metaphor. Similarly, the velocity damping factor (0.99) is tuned to the current force magnitudes; reducing it below ~0.97 causes organisms to freeze in place, while raising it above ~0.995 causes chaotic oscillation at the boundary edges. These three constants (attract force, repel force, damping) form a coupled system and must be tuned together, not independently.
