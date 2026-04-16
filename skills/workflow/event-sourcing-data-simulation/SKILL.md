---
name: event-sourcing-data-simulation
description: Generate domain-typed events from a fixed catalog and fold them through a pure projection function to produce deterministic aggregate state.
category: workflow
triggers:
  - event sourcing data simulation
tags:
  - auto-loop
version: 1.0.0
---

# event-sourcing-data-simulation

Each app defines its event universe as a small, closed set of typed events — the timeline uses `AccountCreated | MoneyDeposited | MoneyWithdrawn | AccountLocked`, the replay uses `ItemAdded | QtyChanged | ItemRemoved | CouponApplied`, and the stream uses `OrderPlaced | PaymentReceived | ItemShipped | OrderCancelled | RefundIssued`. Events are generated either round-robin (timeline cycles through `types[idx % length]` with matching payloads), from a hardcoded log (replay has a pre-built 10-event sequence), or randomly (`types[Math.random()*5|0]`). The reusable pattern is: define a `types[]` array, a corresponding `payloads[]` or inline generator, and an `emit()` function that pushes `{seq, type, data, ts}` objects into an append-only array.

State projection is always a pure left-fold over the event array. The timeline's `rebuildState()` initializes `{balance:0, owner:null, locked:false, txCount:0}` and pattern-matches each event type to mutate the accumulator. The replay's `project(n)` does the same over a cart object up to cursor position `n`, returning `{cart, discount}`. The stream doesn't project a single entity but maintains running `counts[type]++` and a 30-slot ring buffer for per-second rate tracking. The key constraint is that the projection function takes **only** the event array (or a slice of it) and returns the full state — no external mutable dependencies. This makes each projection independently testable: feed it a known event sequence, assert the output. For simulation purposes, time-based emission uses nested `setInterval` (one for event bursts at 400ms, one for rate-window rotation at 1000ms), while user-driven emission is button-bound. Both patterns keep the event store as plain in-memory arrays, which is sufficient for demos up to a few thousand events before DOM or Canvas performance becomes the bottleneck.
