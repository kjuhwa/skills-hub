---
name: dead-letter-queue-data-simulation
description: Generating realistic DLQ failure distributions with heavy-tailed error classes, retry curves, and poison-message clustering
category: workflow
triggers:
  - dead letter queue data simulation
tags:
  - auto-loop
version: 1.0.0
---

# dead-letter-queue-data-simulation

Simulating DLQ data for visualization demos requires modeling the true statistical shape of production failures, not uniform random noise. Use a Zipfian distribution over error classes so 2-3 error types (typically schema-validation failures and downstream-timeout) dominate 70%+ of volume, with a long tail of rare errors (deserialization, auth, poison payload). Generate retry counts using a truncated geometric distribution capped at the configured max-retries (commonly 3-5), with a visible spike at the cap representing messages that exhausted retries and landed in DLQ.

Cluster failures temporally to mimic real incidents: inject burst windows (5-15 minute spans) where a single error class spikes to 10-50x baseline, representing a downstream outage or a bad deploy. Between bursts, maintain a low-rate background of diverse failures. Seed correlation IDs so multiple DLQ entries can trace back to the same upstream batch, and ensure 10-20% of messages share a payload-hash prefix to simulate poison messages that repeatedly re-enter the DLQ after naive replay.

Include metadata that makes the simulation teachable: original-topic, partition, offset, first-failure-timestamp, last-failure-timestamp, consumer-group, and a synthetic stack trace tied to the error class. For flow visualizers, emit time-series arrival events at 1-10 Hz with occasional gaps so animations show realistic rhythm rather than a constant stream.
