---
name: message-queue-implementation-pitfall
description: Common failure modes in browser-based message queue simulations involving array mutation, unbounded growth, and timing drift.
category: pitfall
tags:
  - message
  - auto-loop
---

# message-queue-implementation-pitfall

The most dangerous pitfall in these implementations is in-place array mutation during iteration. Both the flow app and sandbox use `Array.splice(i, 1)` inside `forEach` loops to remove consumed messages and expired particles. When splice removes index `i`, the next element shifts down to `i`, but `forEach` advances to `i+1`, silently skipping one element per removal. Under low message volume this appears to work fine, but at high throughput (rapid produce + consume), messages visually "stick" in the queue or particles linger because every other removal is skipped. The fix is to iterate in reverse (`for (let i = arr.length - 1; i >= 0; i--)`) or collect indices and batch-remove after the loop.

A second pitfall is unbounded DOM growth in the monitor and sandbox apps. The monitor rebuilds the entire `innerHTML` of the stats and grid sections every tick (1 second), which triggers full DOM teardown and reconstruction of all queue cards. With 6 queues this is negligible, but scaling to 50+ queues causes visible jank because `innerHTML` assignment parses HTML, destroys old nodes, and creates new ones each cycle. The sandbox's timeline caps at 50 entries via `events.slice(0, 50)`, but the underlying `events` array grows without bound — after hours of running, it holds thousands of unreferenced event objects consuming memory. The DLQ array similarly has no cap; a sustained 15% failure rate on a busy queue will accumulate hundreds of dead letters with no eviction policy.

A subtler issue is timer drift between the produce and consume intervals. `setInterval` does not guarantee exact timing — under tab throttling (background tabs in Chrome get 1s minimum interval), both loops collapse to ~1s, destroying the carefully tuned rate asymmetry. The queue either drains instantly or fills to max depending on which timer fires first after unthrottling. Production-grade simulations should use `requestAnimationFrame` with delta-time accumulation for the visual loop and `performance.now()`-based scheduling for simulation ticks, or at minimum detect visibility changes via `document.visibilitychange` and reset queue state when the tab returns to foreground.
