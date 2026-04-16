---
name: backpressure-data-simulation
description: Deterministic rate-mismatch data generation for backpressure demos with configurable producer, buffer, and consumer dynamics.
category: workflow
triggers:
  - backpressure data simulation
tags:
  - auto-loop
version: 1.0.0
---

# backpressure-data-simulation

Drive backpressure simulations with a **tick-based engine** (e.g. 60fps or 100ms tick), where each tick the producer emits `floor(producerRate * dt + carry)` items, the buffer accepts up to `capacity - size` of them (rejecting or blocking the rest depending on strategy), and the consumer drains `floor(consumerRate * dt + carry)` items. Keep the fractional `carry` between ticks so low rates (e.g. 0.5/s) still produce integer items without drift. Expose four knobs: `producerRate`, `consumerRate`, `bufferCapacity`, and `strategy` ∈ {`drop-newest`, `drop-oldest`, `block`, `pause-signal`}. This single engine powers all three apps — flow-valve swaps buffer for a pressure vessel, conveyor-belt uses a FIFO with visual length, reactive-stream uses a sliding time window — but the tick loop is identical.

Include **scripted scenarios** alongside free-play: a "burst" scenario (producer 10/s → 200/s for 3s → 10/s) shows transient saturation and recovery; a "slow consumer" scenario (steady producer, consumer degrades from 100/s → 20/s over 10s) shows gradual backpressure onset; a "pulse" scenario (producer oscillates sin wave) shows amplitude clipping at the capacity ceiling. Each scenario should be a pure function `tick -> {producerRate, consumerRate}` so runs are reproducible and can be replayed with a seed. Record dropped-item counts, max-fill, and time-at-saturation as scenario outputs — these metrics are what teach the pattern.

Emit events for **every state transition** (`enqueue`, `drop`, `pause-upstream`, `resume-upstream`, `consumer-stall`) rather than polling buffer size, so the UI layer and any logging view read from the same stream. Timestamp events with simulation-time (not wall-clock) so pause/step/rewind controls work. Default to simulation speed multipliers of 0.25×, 1×, 4× — backpressure dynamics at real-world rates (Kafka partitions, TCP windows) are often too slow or too fast to see without time warping.
