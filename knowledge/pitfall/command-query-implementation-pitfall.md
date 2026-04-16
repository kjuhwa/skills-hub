---
name: command-query-implementation-pitfall
description: Common failure modes when building CQS/CQRS visualizations and analyzers — false positives in mutation detection, misleading ratios, and animation-state desync.
category: pitfall
tags:
  - command
  - auto-loop
---

# command-query-implementation-pitfall

The most subtle pitfall in command-query separation tooling is false-positive mutation detection. The CQS analyzer uses regex heuristics like `/this\.\w+\s*[=+\-]/` and `.filter(.*=` to detect state changes, but this breaks on legitimate query patterns — for example, `this.items.filter(i => i.id === id)` used as a pure filter-and-return (no reassignment) would not trigger the mutation regex, yet `const x = this.items.filter(...)` where the result is assigned to a local variable could be misread depending on context. The `console.log` heuristic flags logging as a side effect, which is technically correct per strict CQS but overly aggressive for real-world code where observability logging in queries is standard practice. Any analyzer built on this pattern must decide upfront whether to follow strict Bertrand Meyer CQS (any observable effect is a side effect) or practical CQS (only domain-state mutations count).

The second pitfall lies in the timeline and ratio statistics. The rolling window cap of 30 entries means the displayed command-to-query ratio only reflects recent activity, not lifetime totals. If a user dispatches 50 commands followed by 50 queries, the ratio will show a query-heavy skew because the early commands have been shifted out. This is misleading for capacity planning or auditing use cases. The fix is to maintain separate lifetime counters alongside the visible window, but all three apps omit this — the stats panel tracks only the current entries array length.

The third pitfall is animation-state desync in the bus simulator. Particles are animated with `setInterval` and removed from the DOM when they exit the viewport, but the handler log entry is appended immediately at dispatch time — not when the particle arrives. This means the log shows "handled" results before the visual animation completes, breaking the mental model that the bus is actually routing the message. In more complex implementations with failure injection or retry logic, this desync becomes a real usability problem: users see success logged while the particle is still in transit, or worse, see a failure logged after the particle has already disappeared. The animation completion callback must drive the log append, not the dispatch call.
