---
name: etl-data-simulation
description: Deterministic seeded record generator for ETL demos with configurable throughput, schema drift, and fault injection
category: workflow
triggers:
  - etl data simulation
tags:
  - auto-loop
version: 1.0.0
---

# etl-data-simulation

ETL demo apps need a synthetic record generator that produces realistic-looking rows without external dependencies. Build a `simulateExtract(seed, ratePerSec, schema)` generator that emits records on a `setInterval` driven by the configured rate, using a seeded PRNG (mulberry32 or similar) so runs are reproducible. Each record should carry a monotonic `eventId`, a jittered `emittedAt` timestamp (not just `Date.now()` — add ±50ms jitter so downstream windowing looks realistic), and payload fields derived from the schema definition. Keep the generator pure and driven by a tick counter so pause/resume and time-travel scrubbing work without re-seeding.

Layer fault injection on top of the base generator: configurable probabilities for null fields, type coercion failures (string where number expected), duplicate eventIds, late-arriving records (emittedAt in the past), and schema drift events (an unexpected extra field appears at tick N). Expose these as sliders in a dev panel — it is the fastest way to exercise the transform stage's error handling in throughput-monitor and transform-playground. Record all emitted records in a capped ring buffer (e.g. last 5000) so the UI can replay and inspect without hitting memory issues during long-running demos.

For the load stage, simulate sink latency with a configurable P50/P99 distribution rather than a single fixed delay — real sinks (databases, object stores, APIs) have long tails and the demo should surface that. Back-pressure in throughput-monitor only emerges naturally when sink latency exceeds source rate, which is what makes the visualization pattern above informative.
