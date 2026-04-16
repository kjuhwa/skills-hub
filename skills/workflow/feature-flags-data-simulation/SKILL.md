---
name: feature-flags-data-simulation
description: Generate realistic flag-rollout, dependency, and A/B-test fixtures with coherent user cohorts and evaluation traces
category: workflow
triggers:
  - feature flags data simulation
tags:
  - auto-loop
version: 1.0.0
---

# feature-flags-data-simulation

Feature-flag simulators need three correlated data streams, not independent random samples. Start with a **user population** of 10k–100k synthetic users stamped with stable attributes (country, plan-tier, device, account-age-days, a `bucketingKey` hash in `[0,1)`). Every downstream artifact — rollout percentages, A/B assignments, dependency gates — must be derived deterministically from `bucketingKey` using the same hash-mod strategy real SDKs use (e.g., `murmur3(flagKey + userId) % 10000 < rolloutBps`). This is the single most-skipped step: if the rollout simulator uses `Math.random()` while the A/B dashboard uses a hash, the same user will appear in different buckets between apps and the whole illusion collapses.

Layer a **flag catalog** on top: 50–200 flags with a realistic mix (≈60% boolean kill-switches, ≈25% multivariate experiments, ≈10% targeted-release, ≈5% archived/stale). Give each flag a `createdAt`, `lastEvaluatedAt`, an `owner` team, and — critically — a **dependency DAG** where ~30% of flags reference 1–3 parents. Generate the DAG by topological layers to guarantee no cycles; cycle-detection bugs are the #1 source of infinite loops in flag evaluators, so the fixture must be clean by construction, not by runtime check. For A/B data, simulate conversion with a baked-in **true effect size** per experiment (e.g., variant-B has +2.3% conversion) plus Gaussian noise, then let the dashboard's stats engine rediscover it — this gives you a ground-truth oracle for testing significance calculations.

Emit everything as a replayable **evaluation log**: `{ts, userId, flagKey, variant, reason, dependencyChain}`. The rollout simulator replays it to animate adoption curves, the dependency graph replays it to highlight hot paths, and the A/B dashboard aggregates it into funnels. One log, three views — and when a bug appears, you can pin it to a specific `(userId, flagKey, ts)` tuple instead of a vague "flag looked wrong."
