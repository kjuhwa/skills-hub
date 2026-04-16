---
name: api-versioning-data-simulation
description: Three-mode simulation engine covering static version history, interval-driven drift sampling, and interactive negotiation rule resolution.
category: workflow
triggers:
  - api versioning data simulation
tags:
  - auto-loop
version: 1.0.0
---

# api-versioning-data-simulation

API versioning simulations decompose into three complementary data generation modes. **Static history mode** populates a version registry array where each entry carries a version string, release date, lifecycle status (active/deprecated/sunset), description, endpoint list, breaking-change boolean, and consumer count. Realistic data follows a decay curve: latest versions (v3.1-v3.2) hold 89-142 consumers, deprecated versions (v2.5-v3.0) drop to 12-34, and sunset versions (v1.0-v2.0) reach zero. This models the long tail that real API platforms experience.

**Interval-driven drift mode** defines a client pool (e.g., 8 clients: Mobile iOS, Web App, Partner A, Legacy Batch) each pinned to a specific version. A `tick()` function fires every 900ms, randomly selects a client, increments per-version counters, and derives drift health: `latestPct = v4Count / totalRequests`. Thresholds at 70% and 40% trigger healthy/warning/critical states. The log buffer is capped (40 entries, FIFO) to prevent DOM bloat while showing enough history for pattern recognition. This mode reveals how real drift accumulates — legacy batch jobs and slow-updating partners drag down the latest-version adoption percentage.

**Interactive negotiation mode** implements a version availability matrix (v1-v3 available, v4 unreleased) with deprecation rules: v1-v2 return 200 + sunset warning headers, v3 returns 200 OK, v4 returns 404 with fallback guidance. A `negotiate()` function accepts a strategy type (URL path `/v3/users`, custom header `X-API-Version: 3`, Accept header `application/vnd.api.v3+json`, or query param `?version=3`) and resolves the request against the matrix. A history counter per strategy type feeds back into the frequency visualization. To extend: add content-negotiation weight scoring or version-range matching (e.g., `Accept: vnd.api.v3.1-v3.5+json`).
