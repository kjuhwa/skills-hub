---
name: idempotency-implementation-pitfall
description: Common failure modes when implementing idempotency keys, idempotent functions, and idempotent state machines — race conditions, storage leaks, and silent data corruption.
category: pitfall
tags:
  - idempotency
  - auto-loop
---

# idempotency-implementation-pitfall

The most dangerous pitfall in key-based idempotency is the **check-then-store race condition**. If two identical requests arrive concurrently and both pass the `if (!store[key])` check before either writes, both execute the side effect — defeating the entire purpose. In the browser simulation this is masked by JavaScript's single-threaded event loop and the `setTimeout` serialization, but in a real distributed system (multiple server instances, shared database), you must use an atomic compare-and-swap operation (e.g., `INSERT ... ON CONFLICT DO NOTHING` in PostgreSQL, or `putIfAbsent` in Redis) rather than a read-then-write sequence. A second key-vault pitfall is **unbounded key storage**: the demo's `store` object grows forever. Production systems need a TTL-based eviction policy (typically 24–48 hours) — but setting the TTL too short means late retries get re-processed, while setting it too long bloats storage. Stripe, for example, expires idempotency keys after 24 hours.

For function-level idempotency, the pitfall is **assuming mathematical idempotency transfers to systems**. `Math.abs` is idempotent in isolation, but `abs(x)` applied to a database column in a non-transactional UPDATE can still cause issues if an intermediate observer reads a partially-applied batch. The `x % 7` case in the lab is particularly deceptive: it *appears* to stabilize for certain inputs (e.g., values already < 7) but drifts for others — developers mistake "works for my test input" for idempotency when the property doesn't hold universally. Always prove idempotency for the entire input domain, not just the happy path.

State-machine idempotency fails when **the transition has external side effects that aren't guarded by the state check**. The demo's `dispatch()` correctly checks state *before* transitioning, but in production, if the SUBMIT handler sends an email and the state write fails, a retry will re-send the email because the state still reads DRAFT. The fix is to make the side effect and state write atomic (same transaction), or to make the side effect itself idempotent (e.g., using a deduplication key on the email send). Another subtle bug: if state comparisons use mutable objects instead of enum/string equality, reference-vs-value comparison can cause `current === expected` to return false even when logically equal, turning every dispatch into a "new" transition.
