---
name: strangler-fig-data-simulation
description: Synthesize realistic strangler-fig migration data with capability inventory, routing weights, and parity metrics
category: workflow
triggers:
  - strangler fig data simulation
tags:
  - auto-loop
version: 1.0.0
---

# strangler-fig-data-simulation

Seed the simulation with a capability inventory (20–80 endpoints/features) tagged by `legacy_complexity` (1-5), `coupling_score`, and `business_criticality`. Generate migration order deterministically from these tags — low-coupling/low-criticality capabilities migrate first (seams are cheapest), high-criticality/high-coupling ones last. For each capability, simulate a routing weight timeline that ramps from 0% → 100% over a variable window (canary 1% → 5% → 25% → 50% → 100%), with realistic pauses and occasional rollbacks to 0% when a synthetic "parity failure" fires.

Emit three parallel time-series per capability: (1) traffic split %, (2) error rate on new vs legacy (new should start higher, converge), (3) latency p50/p99 comparison. Inject realistic anomalies: shadow-traffic discrepancies during the proxied phase, "forgotten caller" incidents where a hidden consumer hits the legacy path after cutover, and data-drift events where the new service and legacy diverge on edge-case inputs. These are the actual failure modes practitioners encounter, not generic noise.

Always include a "facade/proxy" metadata layer describing the routing rule (header-based, percentage-based, user-cohort, or feature-flag) because the routing mechanism determines what kinds of failures are plausible. Store retirement events as discrete markers — the moment legacy code is deleted is the terminal event and should be visually distinct from the 100%-traffic-migrated event (they are not the same; there's usually a soak period between them).
