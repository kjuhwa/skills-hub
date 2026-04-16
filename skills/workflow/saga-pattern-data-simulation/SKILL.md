---
name: saga-pattern-data-simulation
description: Generate synthetic saga execution traces with configurable failure injection, multi-service event sequences, and realistic compensation cascades.
category: workflow
triggers:
  - saga pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-data-simulation

Model each saga as an ordered array of step descriptors, where every step carries four fields: `service` (e.g. OrderSvc, InventorySvc, PaymentSvc, ShippingSvc), `action` (the forward operation like "Reserve Stock"), `compensation` (the undo operation like "Release Stock"), and `durationMs` (simulated latency, typically 200-800ms). To run a saga simulation, iterate the step array in order. For each step, emit a timestamped event `{sagaId, service, action, status: 'ok', timestamp}`. When a failure is injected — either at a fixed index or via `Math.random() < failureRate` per step — emit the failing step with `status: 'fail'`, then walk backwards from the last completed step to index 0, emitting compensation events with `status: 'comp'` and incrementing timestamps by each step's `durationMs`. This produces a realistic trace where compensation count always equals completed-step count, matching the saga pattern invariant.

For timeline and history views, pre-generate a corpus of 4-8 saga instances covering the key scenarios: full success (all steps complete, no compensations), early failure (step 1-2 fails, minimal compensation), mid-chain failure (step 3-4 fails, partial compensation), and late failure (penultimate step fails, near-full compensation). Assign each saga a monotonic ID (e.g. `S-1001`) and an order reference for domain context. Timestamps should start from a base time and increment by `durationMs + jitter(50ms)` per event so the timeline feels realistic without requiring actual async delays. Store the corpus as a plain JavaScript array — no backend needed — so the simulation is fully deterministic and reproducible.

For interactive simulation (button-driven or slider-driven), expose two modes: **normal run** that completes all steps, and **failure run** that picks a random failure index (or accepts one from a slider). On each mode switch, reset all step statuses to idle, clear the event log, and re-execute the step iterator. Log each event to both a visual element (canvas node color change, timeline dot, or chain step highlight) and a text log with format `[HH:MM:SS] ServiceName — action — STATUS`. This dual-output approach lets the user correlate the visual state with the raw event stream, which is critical for understanding compensation ordering.
