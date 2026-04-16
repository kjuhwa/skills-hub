---
name: api-versioning-data-simulation
description: Generate synthetic API version traffic, changelog events, and consumer migration progress for realistic demos
category: workflow
triggers:
  - api versioning data simulation
tags:
  - auto-loop
version: 1.0.0
---

# api-versioning-data-simulation

The data layer for API versioning simulations requires three distinct generators. The **version registry** is a static array of version objects, each carrying a semver tag, release date, lifecycle status (active | deprecated | EOL), a human description, and a changelog array where each entry is prefixed with a verb tag (ADD, CHANGE, REMOVE, FIX, DEPRECATE). Versions should span 2–4 years with realistic cadence — major versions every 12–18 months, minors every 3–6 months — and each successive version should remove or rename things from the prior one to create genuine migration friction (e.g., snake_case to camelCase, XML removal, auth scheme changes). The status field drives all downstream color and behavior decisions.

For **live traffic simulation**, a stochastic particle spawner assigns each request to a versioned endpoint using weighted probability that reflects real-world adoption curves: ~45% to the latest major version's primary endpoint, ~25% split across the latest version's secondary endpoints, ~20% to the previous deprecated version, and ~10% to legacy. Particle speed is randomized (1.5–2.5x base) to simulate variable latency. The spawn rate is coupled to a user-controlled speed slider via `Math.random() < 0.15 * speedMultiplier`, giving smooth scaling from idle to burst traffic without frame drops. Cumulative counters per endpoint feed the stats panel.

The **consumer migration model** defines 4–6 named consumers (Mobile App, Web Dashboard, Partner SDK, Internal CLI, Legacy Batch) each with a v3-adoption percentage. The spread should be deliberately uneven — at least one consumer at 100% (internal tooling migrates first), one below 20% (legacy batch jobs are always last), and the rest distributed between 45–92%. For daily usage charts, a 7-day array of `[v3_count, v2_count, v1_count]` tuples should show a clear upward trend for the latest version and decay for older ones, with the total sum per day staying roughly constant (~540–570 requests) to avoid implying overall traffic growth that would confuse the migration signal.
