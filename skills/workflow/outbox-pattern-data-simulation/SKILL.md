---
name: outbox-pattern-data-simulation
description: Tick-based and streaming simulation strategies for generating realistic outbox event flow — including failure injection, relay race modeling, and bounded queue management.
category: workflow
triggers:
  - outbox pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# outbox-pattern-data-simulation

The core simulation loop uses a 1-second `setInterval` tick that generates 0–3 random events per cycle (`rnd(0,3)`), models relay processing of 0–4 pending items per cycle, and applies a configurable failure probability (7–10%) to each relay attempt. Events are typed from a domain-specific vocabulary (e.g., `OrderCreated`, `PaymentProcessed`, `ItemShipped`) rather than generic labels, which makes the simulation output meaningful for domain observers. Each event carries a short random ID (`Math.random().toString(36).slice(2,8)`), a status enum (`pending → sent | failed`), and a timestamp. The arrival rate being variable (0–3) while the drain rate is also variable (0–4) creates natural queue depth oscillation — sometimes pending count rises, sometimes it drains — which is critical for realistic dashboard behavior. A fixed arrival rate would produce monotonic trends that mislead observers about real system dynamics.

The relay simulation uses a find-first strategy (`events.find(x => x.status === 'pending')`) that processes the oldest pending event first, modeling FIFO outbox polling. The failure branch sets status to `failed` and increments the failed counter but does not re-enqueue for retry — this is a deliberate simplification that exposes the "stuck message" pitfall. In the flow visualizer, the equivalent pattern uses chained `setTimeout` calls (600–800ms delays) to separate the poll phase from the publish phase, creating a window where the message is "in-flight" — neither pending nor sent. This temporal gap is the exact window where duplicate polling occurs in production systems. The simulator's click-to-emit model (`emit(svc)` on button click) layers user-driven bursts on top of the tick-based background, stress-testing the queue under mixed load patterns.

Bounded queue management prevents memory growth: the dashboard caps the `events` array at 50 entries per tick (`events = events.slice(0, 50)`), the simulator caps both tables at 15 visible rows, and the flow visualizer caps the event log at 40 DOM children (removing `log.lastChild` when exceeded). The throughput history uses a fixed-length ring buffer (`new Array(60).fill(0)` with `push/shift`) rather than an unbounded array, ensuring constant memory regardless of runtime duration. These caps mirror the production concern of outbox table truncation — in both simulation and production, you must decide a retention policy or the data structure grows without bound.
