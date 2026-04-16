---
name: crdt-data-simulation
description: Seeded pseudo-random operation generator driving multi-replica CRDT scenarios with partition windows
category: workflow
triggers:
  - crdt data simulation
tags:
  - auto-loop
version: 1.0.0
---

# crdt-data-simulation

CRDT demos need reproducible, interesting operation sequences — not just random noise. Use a seeded PRNG (mulberry32 or similar) to generate a script of `{replicaId, op, payload, timestamp}` tuples. Bias the distribution so concurrent operations on the same element actually occur (~30% conflict rate), since random ops on a large keyspace rarely collide and the merge behavior becomes invisible. Include deliberate "partition windows" where a chosen replica's network toggle is off for N ticks while it still accepts local writes — this produces the divergence that makes convergence dramatic on reconnect.

Structure the simulation as a tick loop: each tick, advance the PRNG, pick a replica (weighted), pick an operation (increment/add/remove/insert), apply locally, then probabilistically gossip to a random connected peer. Keep the tick rate adjustable (pause, step, 1x, 4x) so users can slow down around interesting moments. Emit the op log to a scrolling panel so every state change is traceable back to a concrete `(replica, op, causal-dot)` tuple.

For each CRDT type, preseed 2-3 canonical scenarios that showcase the invariant: for counters, a "concurrent increments during partition" scenario; for OR-Set, an "add-remove-add on different replicas" scenario that proves remove-wins-by-tag not remove-wins-by-value; for text CRDTs, "concurrent insertion at the same position" to show interleaving via identifier ordering. Canned scenarios teach faster than random play.
