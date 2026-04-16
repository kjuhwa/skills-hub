---
name: log-aggregation-data-simulation
description: Synthetic log event generation with realistic severity distributions, temporal correlation, and pipeline-stage attrition for testing log-aggregation UIs.
category: workflow
triggers:
  - log aggregation data simulation
tags:
  - auto-loop
version: 1.0.0
---

# log-aggregation-data-simulation

Simulating log data for aggregation dashboards requires three layers of realism that naive `Math.random()` approaches miss. **Severity distribution** should follow a power-law: ~60% DEBUG, ~25% INFO, ~10% WARN, ~4% ERROR, ~1% FATAL in steady state. The generator uses a weighted-random picker with these base weights, but modulates them with a **temporal incident model**: at random intervals (Poisson-distributed, λ ≈ 1 per 5 minutes), an "incident window" of 30–120 seconds activates, during which ERROR weight jumps 8× and WARN weight jumps 4×, simulating a real outage burst. Without this incident model, heatmaps look uniformly warm and waterfall feeds lack the spikes that test scroll-back and DOM eviction behavior.

**Cross-category correlation** is the second critical layer. Real log sources are not independent — a database timeout spike co-occurs with application-layer errors and queue backpressure warnings within the same time window. The simulator should define 3–5 "failure scenarios" (e.g., `db-slow`, `deploy-rollback`, `network-partition`), each specifying which categories spike together and their relative timing offsets (e.g., `DBSlow` leads `AppError` by 2–5 seconds, which leads `QueueFull` by 5–10 seconds). When an incident window fires, it selects a scenario and cascades the correlated spikes, giving the heatmap cross-row hot-bands that test co-occurrence highlighting features.

**Pipeline attrition simulation** feeds the funnel view. Each simulated event carries a `stageReached` field determined by probabilistic gates per stage: Collector→Parser (99.5% pass), Parser→Enricher (97% — parse failures), Enricher→Indexer (95% — enrichment lookup misses), Indexer→Storage (98% — index conflicts or throttling). During incident windows, the Enricher and Indexer pass rates drop to 80% and 85% respectively, creating visible funnel narrowing that tests the loss-vs-filter distinction in the UI. The generator emits events as a JSON stream over WebSocket or SSE, with each event containing `{timestamp, severity, category, message, stageReached, incidentId?}`, allowing the dashboard to replay or throttle the feed for development testing.
