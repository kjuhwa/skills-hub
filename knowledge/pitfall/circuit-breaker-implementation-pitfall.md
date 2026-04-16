---
name: circuit-breaker-implementation-pitfall
description: Common failure modes in circuit breaker implementations including timer leaks, half-open race conditions, and missing counter resets.
category: pitfall
tags:
  - circuit
  - auto-loop
---

# circuit-breaker-implementation-pitfall

The most dangerous pitfall is timer/cooldown mismanagement. The visualizer app uses `setTimeout` for the OPEN→HALF_OPEN transition but must call `clearTimeout(timer)` before starting a new timer and on reset — if omitted, stale timers fire and corrupt the state machine by transitioning to HALF_OPEN while the user has already manually reset to CLOSED, or while a new OPEN period has started. The dashboard and simulator avoid this by using tick-based countdowns (`cooldown--` per interval tick), which are inherently safe from stale-timer bugs but introduce a different risk: if the interval itself is cleared and restarted, the cooldown resets silently. In production implementations, always ensure the cooldown mechanism is idempotent — a second trip to OPEN during an existing cooldown should restart the countdown, not stack a parallel one.

Half-open state is the most fragile transition point. In the visualizer, HALF_OPEN requires `HALF_OPEN_MAX` consecutive successes to recover, but a single failure immediately re-opens the circuit. If the success counter (`successes`) is not reset to zero on re-entry to HALF_OPEN (or on failure during HALF_OPEN), stale counts from a previous half-open attempt carry over, causing premature recovery. The visualizer explicitly resets `successes=0` in `startTimer` before transitioning to HALF_OPEN, but the dashboard skips this — it only resets `failures=0` on half-open entry, relying on its probabilistic success check (`Math.random() > 0.5`) instead of counting. In real systems with concurrent requests, multiple threads can enter the half-open probe simultaneously; without a semaphore or single-probe gate, a burst of requests during half-open can either flood the recovering downstream or produce contradictory success/failure signals that thrash the state.

A subtle counter-reset bug appears when transitioning CLOSED→OPEN: the failure counter should NOT be reset, because it is needed for logging and metrics, but it MUST be reset when transitioning back to CLOSED (after successful half-open recovery). The simulator resets `failures=0` on the success path inside HALF_OPEN, which is correct. However, none of the apps reset failure counts when transitioning from CLOSED directly (e.g., on manual reset the visualizer resets both counters, but the dashboard has no reset mechanism at all). In production, forgetting to reset the failure counter after recovery means the next single failure can re-trip the breaker immediately because the counter is already at `threshold - 1` from the previous incident. Always audit every state transition edge for which counters get zeroed and which persist.
