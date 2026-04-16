---
name: pub-sub-implementation-pitfall
description: Fan-out semantics, ack timing, and ordering guarantees are the three places pub-sub demos silently lie
category: pitfall
tags:
  - pub
  - auto-loop
---

# pub-sub-implementation-pitfall

The most common pitfall is conflating topic subscribers with subscription groups. Naive implementations deliver each message to every subscriber, which is pub-sub only in the loosest sense — real brokers (Kafka consumer groups, Pulsar shared subs, Redis streams groups) load-balance within a group and fan-out across groups. If your demo shows three subscribers on one topic all receiving every message without a group abstraction, you've built a broadcaster, not pub-sub, and users will build wrong mental models that break when they touch real Kafka.

Ack timing is the second trap. Auto-ack on deliver makes the happy path look clean but eliminates the entire class of redelivery/duplicate-handling behavior that is the whole point of pub-sub reliability. Simulations must ack only after the subscriber's consume step completes, and must redeliver on timeout or explicit nack. A related bug: acking before persisting the side effect, which demos almost always get wrong because there is no real side effect — add a synthetic "process" step with artificial latency so the ack-before-process bug is demonstrable.

Third, ordering. Pub-sub guarantees are per-partition/per-key, not global, but demos often render a single global queue which implies total order. When you later add a second partition or a parallel consumer, ordering appears to "break" — it was never guaranteed. Render partitions explicitly from day one, and when showing a key-based routing example, highlight that messages with the same key land on the same partition and are consumed in order by one consumer, while different keys are independent. Getting this visual right prevents weeks of downstream confusion when users try to reason about exactly-once and ordering in production.
