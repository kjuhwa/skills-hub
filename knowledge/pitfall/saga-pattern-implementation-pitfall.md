---
name: saga-pattern-implementation-pitfall
description: Common failures when implementing sagas — non-idempotent compensations, pivot transaction confusion, lost-update races
category: pitfall
tags:
  - saga
  - auto-loop
---

# saga-pattern-implementation-pitfall

The most dangerous saga pitfall is assuming compensations are symmetric inverses of forward actions. They are not. "Charge $100" cannot be compensated by "charge -$100" if the customer has already seen the charge on their statement — you must issue a refund, which is a separate transaction with its own ID, its own audit trail, and its own possible failure modes. Compensations must be idempotent because the orchestrator will retry them on timeout, and they must be commutative with forward actions that may race in (a late-arriving "reserve inventory" command arriving after "release inventory" compensation has run must not re-reserve the already-released stock). Teams routinely ship sagas where the compensation path has never been executed in production and silently breaks the first time it's triggered.

Confusion about the pivot transaction causes data corruption. The pivot is the step after which compensation is no longer possible (e.g., "ship physical package" — you cannot un-ship a box in transit). Saga designs that place the pivot too early force expensive manual intervention for recoverable failures; designs that place it too late allow the saga to enter states that cannot be rolled back. The pivot must be explicit in the code and the runbook, not implicit. Related: compensating a step that depends on an external system (email sent, webhook fired, third-party API called) often requires a human-in-the-loop because you cannot un-send an email — design for this by gating such steps behind idempotency keys and delaying them until after the pivot whenever possible.

Concurrency races are the silent killer. Two sagas operating on overlapping resources (same customer, same inventory SKU) will interleave in ways your single-saga tests never exercise. Without a saga-aware locking strategy (semantic locks held across steps, or optimistic version checks on each local transaction), you get lost-update bugs where saga A's compensation rolls back state that saga B has already modified. Additionally, the orchestrator's own state must be persisted durably after every state transition — an orchestrator crash mid-saga with state only in memory leaves participants in an inconsistent state forever, and recovery requires reconstructing intent from event logs, which is why event-sourced orchestrators are preferred over snapshot-based ones in production.
