---
name: rate-limiter-implementation-pitfall
description: Timer drift, floating-point token decay, capacity resize races, and algorithm-switching state leaks in browser-based rate limiter implementations.
category: pitfall
tags:
  - rate
  - auto-loop
---

# rate-limiter-implementation-pitfall

**Timer and clock pitfalls** are the most insidious problem in browser-based rate limiters. `setInterval` is not guaranteed to fire at exact intervals — under heavy load or background tabs, a 50ms interval can drift to 80-200ms, causing token refill or leak rates to deviate from configured values. If refill uses fixed-increment logic (`tokens += refillRate/20` per tick), a delayed tick simply under-refills rather than catching up, making the limiter stricter than intended. The sliding-window algorithm using `Date.now()` for timestamp comparison (`now - t < winMs`) breaks if the system clock jumps backward (NTP correction), leaving stale timestamps permanently inside the window and reducing available capacity to zero. The fix is delta-based refill (`elapsed * rate`) with `performance.now()` for durations, and wall-clock `Date.now()` only for user-facing display. The playground's leaky-bucket drain calculation `(now - leakyLast) / winMs * maxReq` correctly uses elapsed-time drain but stores `leakyLast = Date.now()` rather than a monotonic source, leaving it vulnerable to the same clock-jump issue.

**Floating-point precision decay** silently corrupts long-running simulations. The token bucket accumulates `refillRate * dt` as a float every animation frame — after thousands of cycles, rounding errors can drift the actual token count by 0.1-0.5 from the expected value. The `Math.min(tokens, maxTokens)` ceiling prevents overflow but doesn't correct underfill drift. Similarly, particle `life` decremented by fractional amounts each frame means particles don't expire at exactly `life === 0`; they pass through to negative values caught by `> 0` filters, causing 1-2 frame lifetime variance. For token counts in production, periodically snap to integers or use integer arithmetic with a scaling factor (e.g., store millitokens as integers).

**Capacity resize races and algorithm-switching state leaks** create contradictory visual states. Reducing `maxTokens` while `tokens > newMax` requires explicit clamping — the visualizer handles this (`tokens = Math.min(tokens, maxTokens)`) but the dashboard's per-endpoint counters do not truncate `used` when `limit` decreases, allowing utilization bars to exceed 100% until natural decay catches up. The playground has a subtler issue: switching algorithms via tab buttons calls `resetAll()` which clears all state, but if a burst `setTimeout` chain is mid-flight (15 requests at 80ms intervals = 1.2s total), those queued `fire()` calls execute against the new algorithm's fresh state rather than being cancelled. This means a burst started under "fixed window" can bleed requests into "sliding window" after a tab switch, producing confusing timeline dots. The fix is to store a generation counter incremented on reset and have each `setTimeout` callback check that the generation hasn't changed before firing.
