---
name: saga-pattern-data-simulation
description: Generating realistic saga execution traces with compensation chains, timeouts, and partial-failure scenarios for demos
category: workflow
triggers:
  - saga pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-data-simulation

Saga simulation data must model a sequence of local transactions where each step has: a participant service, a forward action, a compensating action, an expected duration, and a failure probability. Generate traces by walking the step list forward, rolling a random number against each step's failure probability, and if a step fails, reversing direction and emitting compensation events for every previously-committed step in LIFO order. Seed the RNG deterministically (e.g., from a saga correlation ID) so the same scenario replays identically — critical for debugging demos and regression tests.

For orchestrator simulations, model the orchestrator as a state machine holding `{sagaId, currentStep, completedSteps[], status}` and emit command/reply pairs on each transition. For choreography simulations, model each participant as an independent consumer that reacts to specific event types and publishes the next event — this naturally produces the emergent-behavior trace without central coordination. Include realistic latencies drawn from a log-normal distribution (most steps fast, occasional slow ones) rather than uniform delays, and inject network-partition scenarios where reply messages are lost, forcing timeout-driven retries or compensations.

Seed a library of canonical scenarios: the happy path (all steps commit), the mid-saga failure (step 3 of 5 fails, triggering compensation of steps 1-2), the compensation-failure case (compensation itself throws, requiring manual intervention / DLQ routing), the timeout cascade (slow step causes orchestrator timeout while the step eventually commits — the split-brain problem), and the idempotency violation (duplicate event causes double-compensation). Each scenario should carry metadata tags so the UI can offer a scenario-picker dropdown. Timestamps in the generated trace must be monotonically increasing but realistic — a saga spanning 4 participants typically takes 200ms–3s end-to-end in production, not microseconds.
