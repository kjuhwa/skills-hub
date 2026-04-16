---
name: websocket-implementation-pitfall
description: Common failure modes in WebSocket visualizations and simulations — unbounded DOM growth, cosmetic-only reconnection, missing backpressure, and timer lifecycle leaks.
category: pitfall
tags:
  - websocket
  - auto-loop
---

# websocket-implementation-pitfall

The most insidious pitfall in WebSocket UIs is **unbounded DOM/memory growth**. All three apps mitigate this differently: the pulse monitor caps its log at 50 children (`if (logEl.children.length > 50) logEl.lastChild.remove()`), the frame flow clears all `.frame` SVG groups when vertical space is exhausted, and the chat sim has no cap at all — meaning a long-running session will accumulate thousands of message divs until the browser tab crashes. The fix is to enforce a hard ceiling on rendered elements and evict from the oldest end, but developers routinely forget this because the problem doesn't surface in short demo sessions. For canvas-based rendering, the rolling buffer (`pts.shift()`) naturally bounds memory, making canvas the safest choice for high-frequency data.

The second pitfall is **cosmetic reconnection logic that masks real protocol complexity**. All three apps simulate disconnection with a random probability check and a `setTimeout` auto-recovery — there is no actual WebSocket object, no `onclose` handler, no exponential backoff, no message queue that buffers during downtime. In production, a reconnection strategy must: (1) use exponential backoff with jitter to avoid thundering-herd reconnection storms, (2) re-authenticate or re-subscribe to channels after reconnect, (3) reconcile missed messages (sequence numbers or server-side replay), and (4) surface the reconnection count and duration to the user, not just a binary connected/reconnecting badge. A third pitfall is **timer lifecycle management**: none of the apps clear their `setInterval` handles on teardown. In a single-page app where these components mount and unmount, orphaned timers continue firing against stale DOM references, causing silent errors and memory leaks. Always store interval IDs and clear them in a cleanup/unmount hook.
