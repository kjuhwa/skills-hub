---
name: event-sourcing-implementation-pitfall
description: Common failures when building event-sourced demos: mutable events, hidden snapshots, and projection non-determinism
category: pitfall
tags:
  - event
  - auto-loop
---

# event-sourcing-implementation-pitfall

The most common pitfall is treating events as mutable records — code that "fixes" a past event by editing its payload destroys the core invariant of event sourcing and makes replay produce different results than the live projection. Any correction must be expressed as a new compensating event (Reversal, Adjustment) appended to the log. Equally dangerous is storing computed state inside the event itself (e.g., `balanceAfter` on a Deposit event); this works until you change the projection logic or replay from a different starting point, at which point the embedded value and the recomputed value diverge silently.

Projection non-determinism is a subtler trap: if projections use `Date.now()`, `Math.random()`, iteration over unordered maps, or floating-point accumulation in a different order than event arrival, rebuilding from the log produces a different state than the live system. Always fold events in strict sequence order, use integer arithmetic for monetary values (cents, not dollars), and treat the projection function as pure `(state, event) => newState`. In race-style demos this shows up as two lanes disagreeing on final balance even though both consumed identical events — the bug is the projection, not the stream.

Finally, beware the snapshot shortcut: loading a cached snapshot and applying only "new" events is a valid optimization in production but catastrophic in a teaching/demo context because it hides the replay mechanic entirely. Always provide a visible "rebuild from zero" path, and if you snapshot, version the snapshot against the projection code hash so stale snapshots are detected rather than trusted.
