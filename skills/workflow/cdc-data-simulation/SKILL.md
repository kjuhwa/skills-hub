---
name: cdc-data-simulation
description: Patterns for generating realistic CDC event data including operation weighting, connector state machines, and table mutation simulation.
category: workflow
triggers:
  - cdc data simulation
tags:
  - auto-loop
version: 1.0.0
---

# cdc-data-simulation

CDC data simulation requires three distinct generators depending on the visualization layer. For **event streams**, spawn particles/events on a probabilistic tick (`Math.random() < threshold` per animation frame) with each event carrying an operation type, source table name, monotonic sequence ID, and timestamp. The stream-visualizer picks from a flat table array (`users`, `orders`, `products`, `payments`, `sessions`) and operation array (`INSERT`, `UPDATE`, `DELETE`) with equal probability — but production-realistic simulation should weight UPDATE at 60-70%, INSERT at 15-20%, and DELETE at 10-15% using cumulative probability thresholds (e.g., `r < 0.15 → INSERT, r < 0.80 → UPDATE, else DELETE`). The velocity (`vx: 1.2 + Math.random() * 2`) and size (`4 + Math.random() * 4`) randomization give visual variety that maps intuitively to event processing speed and payload size.

For **table-level mutations**, the table-diff pattern defines schema-aware seed data (`cols` + `rows` arrays) and applies random mutations: UPDATE modifies a non-PK column in-place (40% probability), INSERT appends a row with a random ID (30%), DELETE splices a row by index (30%). The critical step is deep-cloning the "before" state via `JSON.parse(JSON.stringify(obj))` before applying mutations — this is the only way to produce accurate before/after diffs. Each mutation emits a structured changelog entry with operation type, table name, human-readable description, and timestamp, which feeds the changelog panel.

For **connector/pipeline simulation**, model each connector as a state machine with `running`, `lagging`, and `stopped` states. Running connectors fluctuate EPS (events per second) with bounded random walks (`eps += (Math.random() - 0.5) * 20`) and trend lag toward zero. Lagging connectors accumulate lag monotonically (`lag += Math.random() * 30`) while EPS degrades. Aggregate throughput feeds into a fixed-size sliding window array (`shift()` + `push()`) that backs the time-series chart. This three-tier simulation (event stream, table mutation, connector state) covers the full CDC observability stack.
