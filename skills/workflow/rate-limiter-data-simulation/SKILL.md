---
name: rate-limiter-data-simulation
description: Simulation workflow for generating realistic rate-limiter traffic including token refill, sliding-window expiry, leaky-bucket drain, and multi-endpoint contention.
category: workflow
triggers:
  - rate limiter data simulation
tags:
  - auto-loop
version: 1.0.0
---

# rate-limiter-data-simulation

Rate limiter simulations require implementing at least three distinct algorithm engines that share a common request-arrival interface but differ in internal state management. The **token bucket** uses a continuous refill model: `tokens = Math.min(maxTokens, tokens + refillRate * dt)` where `dt` is the real elapsed seconds since the last frame (via `performance.now()` delta), making it frame-rate independent. Requests succeed if `tokens >= 1` and decrement the counter. The **fixed window** tracks a window start timestamp and a counter; when `now - fixedWindowStart > winMs`, the window resets (`fixedWindowStart = now; fixedCount = 0`). The **sliding window** maintains a log array of admission timestamps, filtering stale entries each check (`slidingLog.filter(t => now - t < winMs)`) and admitting if `slidingLog.length < maxReq`. The **leaky bucket** computes drain as `dt = (now - leakyLast) / winMs * maxReq`, subtracts from the queue level, and admits if `leakyQueue < maxReq`. Each algorithm produces a boolean `ok` result that feeds into the shared event/counter system.

Traffic generation follows two patterns: **user-triggered** (single fire + burst of 15-20 requests at 60-80ms spacing via `setTimeout` chains) and **ambient background** (a `setInterval` at 800ms-1000ms with a probability gate like `Math.random() < 0.3`, or a per-endpoint random count `Math.floor(Math.random() * (limit * 0.06)) + 1`). The dashboard's multi-endpoint simulation adds a periodic **capacity recovery** pass (`setInterval` at 3000ms reducing `used` by 30% of limit), mimicking real sliding-window expiry without tracking individual timestamps — a deliberate simplification that trades accuracy for visual clarity. Events are stored in a bounded array (`events.slice(-200)` or `history.shift()/push()` ring buffer of 60 entries) to prevent memory growth during long-running sessions.

The critical simulation detail is **clock source selection**: the token-bucket visualizer uses `performance.now()` for frame deltas (monotonic, sub-millisecond), while the playground uses `Date.now()` for window timestamp comparisons (wall-clock, subject to NTP jumps). This split is intentional — refill rates need jitter-resistant monotonic time, while window boundaries need wall-clock alignment for user comprehension. Multi-endpoint simulations should reset counters independently per endpoint and track both `used` (current window utilization) and `blocked` (cumulative rejects) as separate counters to support both real-time gauges and historical trend charts.
