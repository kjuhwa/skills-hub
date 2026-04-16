---
name: canary-release-implementation-pitfall
description: Common failure modes in canary traffic shifting, metric observation windows, and premature auto-promotion logic.
category: pitfall
tags:
  - canary
  - auto-loop
---

# canary-release-implementation-pitfall

The most dangerous pitfall is **premature auto-promotion driven by insufficient observation windows**. In the dashboard simulation, traffic jumps from 5% to 50% in roughly 75 seconds. At low canary ratios the absolute number of canary requests is tiny, so error-rate samples are high-variance—a 5% canary slice serving 10 requests per tick can swing between 0% and 20% error rate on pure chance. Promotion gates that check only the latest sample or a short sliding window will auto-advance through noise. Real systems must either wait for a statistically significant sample size per tier or use a confidence-interval test (e.g., chi-squared on error counts) rather than a raw percentage threshold.

A second pitfall is **latent regression that surfaces only at higher traffic ratios**. The traffic-shifter models this with its piecewise error function (errors only above 60% canary traffic), but in production the trigger is load-dependent, not time-dependent. A canary at 5% may pass all health checks because the bug only manifests under connection-pool contention or cache-miss storms that appear at 25%+. Dashboards that display only the current tick's metrics—without overlaying the historical trajectory—mask this slow climb. Operators need a diff-view comparing "metric at 5%" vs. "metric at 25%" for the same canary build to catch load-coupled regressions.

Finally, **rollback scope confusion** is a recurring operational error. The rollback simulator models rollback as zeroing the canary error rate and disabling controls, but in a real Kubernetes progressive delivery (Argo Rollouts, Flagger) rollback also means scaling down canary ReplicaSets, reverting VirtualService weights, and—critically—draining in-flight requests before cutting over. If the rollback only zeros the traffic split without draining, users hitting the canary pod mid-rollback see connection resets. The simulator's instant state flip (`rolledBack=true`) hides this: a realistic model should include a drain period (30–60s) between the rollback trigger and final teardown, during which the canary still serves its in-flight connections but accepts no new traffic.
