---
name: cdc-data-simulation
description: Client-side CDC event simulation using randomized DML operations against in-memory table snapshots with before/after state capture.
category: workflow
triggers:
  - cdc data simulation
tags:
  - auto-loop
version: 1.0.0
---

# cdc-data-simulation

All three apps simulate CDC events without a backend by maintaining in-memory data structures that mirror database tables. The stream monitor generates events on a 300ms `setInterval`, randomly selecting 1–3 events per tick with a uniform distribution across INSERT, UPDATE, and DELETE operations and across a set of table names (users, orders, products, payments, sessions). Each event is a particle with randomized vertical position, speed (2–5px/frame), and size (3–7px radius), creating organic-feeling traffic without any real data source. This timer-plus-random approach is the simplest CDC simulator: it only needs an operation type, a table name, and a synthetic row ID.

The table diff viewer uses a richer simulation that actually mutates in-memory row arrays. It stores mock data as arrays of objects with typed columns, then on each "Next Change Event" click: for UPDATE, it picks a random non-primary-key column and appends `_v` to strings or re-randomizes numbers; for INSERT, it generates a new row with an auto-incrementing ID offset by `events.length` to avoid collisions; for DELETE, it splices a random row (guarding against emptying the table). Critically, it captures a deep-cloned `before` snapshot before mutating and an `after` snapshot afterward, which mirrors the structure of real CDC change events from systems like Debezium (which emit `{before, after, op}` envelopes). This enables the diff renderer to compute cell-level changes by comparing the two snapshots.

The topology map takes a static approach — nodes and links are declared as constant arrays with metadata properties like `rate` (events/sec for sources) and `lag` (ms for sinks). The simulation here is purely visual: animated SVG circles traveling along Bézier paths at staggered durations (1.5s + 0.3s per link index) create the illusion of data flowing through the pipeline. This three-tier simulation strategy — timer-driven random events, snapshot-mutation-with-envelope, and static-topology-with-animated-flow — covers the common needs of CDC demos and development without requiring Kafka, Debezium, or any database connectivity.
