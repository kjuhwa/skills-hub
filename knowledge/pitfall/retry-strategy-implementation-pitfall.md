---
name: retry-strategy-implementation-pitfall
description: Common implementation mistakes across retry apps — uncapped exponential growth, inconsistent jitter formulas, missing total-budget guards, and unfair comparison conditions.
category: pitfall
tags:
  - retry
  - auto-loop
---

# retry-strategy-implementation-pitfall

**Uncapped exponential blowup.** The Simulator and Battle apps compute `base * 2^attempt` with no delay cap. At attempt 7 with a 500ms base, that's 64 seconds; at attempt 10, it's 512 seconds. Only the Composer introduces `Math.min(d, cap)`. Any retry visualization or real system that omits a cap will produce delays that overflow reasonable UX or server timeout budgets. Always apply a cap *before* jitter, not after — otherwise jitter can push the delay above the cap, defeating its purpose. The Composer gets this right by capping first, then computing `lo`/`hi` jitter bands from the capped value.

**Jitter inconsistency.** Each app implements jitter differently: Simulator uses multiplicative `d * (0.8 + random * 0.4)` (always-on ±20%), Visualizer uses additive `d + random * d * 0.3` (0–30% upward only, toggled by checkbox), and Composer uses symmetric `d * (1 ± jPct/100)` (configurable percentage). In a real system, mixing these formulas across services causes correlated retry storms — the whole point of jitter is de-correlation, but if service A uses ±20% and service B uses 0–30% additive, their retry peaks can still align. Pick one formula (symmetric percentage with configurable range is the most predictable) and enforce it system-wide.

**No total timeout budget or circuit breaker.** None of the apps track a cumulative timeout ceiling — they retry until `maxRetries` regardless of total elapsed time. In production, a request that has already waited 45 seconds across 5 retries should not attempt retry 6 even if `maxRetries` allows it, because the caller has likely already timed out. The Composer's cumulative column hints at this problem (you can watch the total climb past any sane HTTP timeout) but doesn't enforce a budget. Additionally, the Battle's `genFailures()` hardcodes a 65% failure probability with no configuration, making it impossible to test edge scenarios like "fails exactly 3 times then recovers" or "permanent failure" — both of which are critical for validating that a retry strategy degrades gracefully rather than amplifying load on an already-failing service.
