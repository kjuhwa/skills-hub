---
name: event-sourcing-data-simulation
description: Generating synthetic event streams with realistic aggregate lifecycles and out-of-order/concurrent event scenarios
category: workflow
triggers:
  - event sourcing data simulation
tags:
  - auto-loop
version: 1.0.0
---

# event-sourcing-data-simulation

Simulated event streams should be generated per-aggregate as a state machine: for a ledger, start with AccountOpened, then weight transitions toward Deposit/Withdraw with occasional Transfer events that emit two linked events (debit + credit) sharing a correlation ID. Use Poisson-distributed inter-arrival times rather than uniform spacing so timelines feel organic, and mix aggregate lifetimes — some accounts churn heavily for a short window, others receive sparse events over the full range. Always assign monotonically increasing sequence numbers per aggregate and a global sequence for the stream; downstream projections depend on both.

For race and replay demos, deliberately inject scenarios that exercise event-sourcing edge cases: out-of-order delivery (swap two adjacent global sequences while keeping per-aggregate order intact), duplicate deliveries (same event ID appears twice — projections must dedupe), and compensating events (a Withdraw followed by WithdrawReversed rather than mutating or deleting the original). Seed the RNG so simulations are reproducible, and expose a scenario selector (healthy / out-of-order / duplicates / high-contention) so viewers can toggle between them and observe projection behavior divergence.

Persist the generated stream as an append-only JSON array with `{id, aggregateId, type, sequence, globalSequence, timestamp, payload}` — never include derived state in the event record, since that defeats the purpose of event sourcing and creates a stale-snapshot trap during replay.
