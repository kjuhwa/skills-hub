---
name: dead-letter-queue-implementation-pitfall
description: Common DLQ design mistakes that turn the safety net into an unbounded garbage dump nobody inspects
category: pitfall
tags:
  - dead
  - auto-loop
---

# dead-letter-queue-implementation-pitfall

The dominant DLQ failure mode is treating it as a write-only sink. Teams configure the DLQ topic/queue, ship the feature, and never build the consumer-side tooling — messages accumulate for months until retention expires or storage alarms fire. Without a triage workflow, replay mechanism, and ownership assignment, the DLQ provides false confidence: failures are "captured" but never resolved, and the same poison messages cycle indefinitely when someone eventually runs a naive bulk replay.

A second pitfall is omitting failure context at enqueue time. Messages land in the DLQ with only the original payload, no error reason, no stack trace, no attempt count, no upstream consumer identity. Operators then spend hours reconstructing why each message failed by correlating logs across services. Always wrap DLQ entries in an envelope containing: original message, error class and message, full stack trace, failing consumer/processor identity, attempt number, first and last failure timestamps, and the correlation/trace ID. This metadata is the difference between 30-second triage and 30-minute forensics.

The third trap is unbounded retry loops without poison detection. Systems that blindly retry on any exception eventually DLQ a message, but if the DLQ consumer replays without checking payload-hash against a recent-failure cache, the same message re-enters the pipeline, fails identically, and returns to the DLQ — consuming broker throughput and masking real incidents. Implement poison-message detection via payload-hash deduplication with a 24-48 hour TTL, and require human or automated root-cause classification before any replay is permitted.
