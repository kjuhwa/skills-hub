---
name: event-sourcing-implementation-pitfall
description: Common traps in event-sourcing demos — unbounded stores, full-replay cost, missing idempotency, and event schema drift.
category: pitfall
tags:
  - event
  - auto-loop
---

# event-sourcing-implementation-pitfall

The most visible pitfall across these apps is **unbounded event accumulation**. The timeline and replay apps push events into a plain array with no compaction or snapshotting. In the timeline app, `rebuildState()` iterates every event on every render — O(n) per frame. For a demo with 50 events this is invisible, but in production event stores with millions of events, full replay without periodic snapshots makes projections unacceptably slow. The stream app partially mitigates this by capping the DOM feed at 80 children, but the `counts` accumulator still grows monotonically with no way to reset or checkpoint. Any real implementation must introduce snapshot intervals (e.g., persist the projected state every N events) and replay only from the last snapshot forward.

A second pitfall is **missing idempotency and ordering guarantees**. The timeline assigns `seq: events.length + 1` locally, which works in a single-browser context but falls apart when events arrive from multiple producers or are replayed out of order. The replay app's hardcoded log sidesteps this, but in distributed systems, events can arrive duplicated or reordered. None of the apps carry an idempotency key (e.g., a UUID per event) or check for duplicate sequence numbers before appending. A production fold function must be idempotent — applying the same event twice should not double a deposit or re-apply a coupon discount.

Third, **event schema evolution** is entirely absent. All three apps define event types as hardcoded string constants with implicit payload shapes. When a `MoneyDeposited` event later needs a `currency` field, or `CouponApplied` gains a `maxDiscount` cap, old events in the store won't carry those fields. The projection functions don't validate or version payloads — they'll silently produce `NaN` balances or `undefined` references if the shape drifts. Production event stores require explicit schema versioning (e.g., `v1/MoneyDeposited`) and upcaster functions that transform old event shapes into the current schema before projection, or the entire replay pipeline becomes fragile to any domain model change.
