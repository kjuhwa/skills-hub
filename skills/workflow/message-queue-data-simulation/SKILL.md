---
name: message-queue-data-simulation
description: Client-side message queue simulation using array-based FIFO queues, randomized topic generation, tick-driven depth fluctuation, and topic-to-queue routing maps.
category: workflow
triggers:
  - message queue data simulation
tags:
  - auto-loop
version: 1.0.0
---

# message-queue-data-simulation

The core data model for simulating a message queue in the browser is a plain JavaScript array acting as a FIFO buffer. Messages are pushed with `queue.push(msg)` and consumed with `queue.shift()`. Each message object carries an `id` (random base-36 slug via `Math.random().toString(36).slice(2,6)`), a `topic` drawn from a predefined list (e.g., `['order.created','user.signup','payment.done','email.send','log.info']`), and positional fields (`x`, `targetX`, `y`) for animation. A `layoutQueue()` function recalculates target positions after every mutation so the visual stays in sync with the data. Capping the array length (e.g., `if (queue.length >= 12) return`) simulates backpressure — the producer is rejected when the queue is full.

For dashboard-style simulation, a `tick()` function runs on `setInterval` (1.5s) and mutates multiple parallel queues. Each tick generates a random delta (`Math.floor(Math.random() * 40 + 5)`) representing batch throughput, shifts depth values with bounded random walks (`depths[i] = Math.max(0, Math.min(100, depths[i] + Math.floor(Math.random() * 21 - 10)))`), and increments global counters for enqueued/dequeued totals. Errors are injected probabilistically (`Math.random() < 0.1`) and logged as named-queue events, which drives both the error KPI counter and the event log. A rolling time-series array (`tpData`) stores the last 30 throughput samples, pushing new and shifting old to create a sliding window for the sparkline chart.

For topic-based routing simulation, a `queueMap` object maps queue names to arrays of representative message strings (e.g., `orders: ['New order placed','Order cancelled',...]`). A `pick()` function selects a random queue and a random message from it, producing a `{queue, text}` pair. The player's selection is validated against the correct queue; mismatches increment a dead-letter counter and reset a streak multiplier, while correct routes award `10 + streak * 2` points. This scoring model incentivizes consecutive correct routing, mirroring real-world operational goals where consecutive successful deliveries indicate healthy routing configuration.
