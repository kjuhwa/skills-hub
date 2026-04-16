---
name: idempotency-implementation-pitfall
description: Common failure modes when implementing idempotency keys, including key scope leaks, partial execution without rollback, and time-of-check vs time-of-use races.
category: pitfall
tags:
  - idempotency
  - auto-loop
---

# idempotency-implementation-pitfall

The most dangerous pitfall is **partial execution without idempotency rollback**. As shown in the sandbox simulation, when the non-idempotent path charges $50 on every call, retried network requests silently multiply charges. But even an "idempotent" implementation can fail if the side effect (e.g., database write, payment charge) executes but the key store update fails — the next retry won't find the key and will re-execute the side effect. Real implementations must write the idempotency key and perform the side effect atomically (same database transaction, or write-ahead to the key store before executing). The simulation's simple `if(!store[key])` guard masks this because the in-memory store can't fail, but production systems with separate key stores and effect targets (e.g., Redis for keys, PostgreSQL for data) must handle the atomicity gap explicitly.

A second pitfall is **key scope confusion** — using a single static key (like `txn-abc-001` in the sandbox) across logically distinct operations. If two different payment intents share a key, the second payment is silently swallowed as a "duplicate." Idempotency keys must be scoped to (user, operation-type, intent) tuples. The visualizer's `genKey()` approach of random generation avoids collisions but loses retry capability; production systems typically use client-generated UUIDs tied to the specific user action (e.g., a checkout button click generates one UUID that persists across retries). Key TTL is another trap: if keys expire too quickly (the simulation's keys never expire), a slow retry after expiry re-executes the side effect; if keys never expire, the store grows unbounded.

A third pitfall revealed by the proof lab is **confusing idempotent-looking behavior with true idempotency**. The function `x % 5` appears idempotent when tested with inputs that are already in [0,4], but is genuinely idempotent because `(x%5)%5 === x%5` holds universally. Conversely, `x * 2` with input 0 produces `0 → 0 → 0`, looking idempotent for that single input — but it is not idempotent in general. The lesson for API design: testing idempotency with a single request/response pair is insufficient. You must verify that repeated application with the *same* key produces the *same* response *and* the same system state, across all edge cases including concurrent requests, partial failures, and key expiry boundaries.
