---
name: retry-strategy-data-simulation
description: Three simulation modes for retry data — real-time probabilistic, shared-sequence deterministic, and pure curve computation with jitter bands.
category: workflow
triggers:
  - retry strategy data simulation
tags:
  - auto-loop
version: 1.0.0
---

# retry-strategy-data-simulation

Retry simulations split into three tiers depending on what you need to demonstrate. **Tier 1: Real-time probabilistic** (Simulator) runs actual `setTimeout` calls with computed delays, deciding success/failure per-attempt via `Math.random() * 100 > failRate`. This produces authentic timing artifacts (GC jitter, event-loop delays) that make the timeline feel real, but results are non-reproducible. The delay formula branches on strategy: `base * 2^attempt` (exponential with ±20% built-in jitter via `0.8 + random * 0.4`), `base * (attempt+1)` (linear), or flat `base` (fixed). **Tier 2: Shared-sequence deterministic** (Battle) pre-generates a single failure array and replays it across all strategies, computing elapsed time arithmetically (`elapsed += fn(base, attempt-1)`) instead of actually waiting. The 200ms `setTimeout` is purely for animation pacing, not delay simulation. This mode is essential for fair A/B/C comparison — real-time mode would give each strategy different random outcomes. The delay-accumulation formula `fn(base, attempt-1)` (note: `attempt-1` not `attempt`) correctly models that the first attempt has zero wait. **Tier 3: Pure curve computation** (Composer) generates a delay table with jitter bands (`lo = delay * (1 - jPct/100)`, `hi = delay * (1 + jPct/100)`) and a decorrelated jitter mode (`random * max(base, prevDelay * 3)`) that models AWS-style decorrelated backoff. The cap parameter (`Math.min(d, cap)`) is applied before jitter calculation, and cumulative delay is summed for total-budget visibility. This tier feeds chart rendering with no stochastic execution at all.
