---
name: cqrs-implementation-pitfall
description: Common CQRS pitfalls around eventual consistency illusion, event store unbounded growth, and misleading synchronous projections.
category: pitfall
tags:
  - cqrs
  - auto-loop
---

# cqrs-implementation-pitfall

The most dangerous pitfall visible in these implementations is the **synchronous read-model update disguised as eventual consistency**. In the event-flow app, `sendCommand()` updates `readModel` immediately in the same call stack, yet the particle animation creates a visual illusion of propagation delay. In production, this mismatch trains developers to expect instant read-after-write consistency, which CQRS explicitly does not guarantee. When the system moves to an actual async event bus (Kafka, RabbitMQ, EventStoreDB), queries issued immediately after a command will return stale data. Any CQRS implementation must surface this gap honestly—either by introducing actual async projection with a visible sync delay, or by clearly labeling the simulation as simplified. Failing to do so leads to UI bugs where users submit a command and see stale state on redirect.

The second pitfall is **unbounded event store growth**. The command-query-split app appends to `eventStore` without any compaction, snapshotting, or archival strategy. In production event-sourced CQRS, the event log grows indefinitely, and replaying thousands of events to rebuild a projection on every read becomes a latency cliff. The latency monitor's sliding window (`push/shift` capped at 60 points) accidentally demonstrates the correct pattern—bounded retention—but applies it only to metrics, not to the event store itself. Real implementations need snapshot strategies (persist projected state every N events), event archival policies, and projection catch-up mechanisms to avoid O(n) replay costs on service restart.

A third subtle pitfall is **conflating command validation with projection logic**. The event-flow app checks `readModel.orders > 0` before allowing `CancelOrder`, meaning the read model is being used for write-side validation. In true CQRS, the write model (aggregate) owns invariant enforcement, not the read projection. Reading from a projection to validate a command introduces a race condition under eventual consistency: the projection may be stale, allowing invalid commands (double-cancel) or rejecting valid ones (order exists but projection hasn't caught up). Command validation must use the write-side aggregate's own state, loaded from the event stream, never from the query-side projection.
