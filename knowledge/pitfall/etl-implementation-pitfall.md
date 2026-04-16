---
name: etl-implementation-pitfall
description: Common ETL demo mistakes: unbounded buffers, missing backpressure propagation, and wall-clock-coupled timers
category: pitfall
tags:
  - etl
  - auto-loop
---

# etl-implementation-pitfall

The most common mistake in ETL demo apps is unbounded in-memory buffers between stages. A generator running at 1000 rec/sec feeding a slower transform stage will OOM the browser tab within minutes if the intermediate queue is a plain array with unlimited push. Always cap inter-stage queues (e.g. 10k records) and implement an explicit drop-oldest, drop-newest, or block-producer policy — and surface the choice in the UI, because each has visibly different downstream effects that are worth demonstrating.

Second pitfall: failing to propagate backpressure. If the transform stage stalls, the extract stage must slow down or the queue cap triggers drops — simply letting the generator keep emitting at full rate while the queue silently drops records produces misleading throughput-monitor charts (input rate looks healthy, output rate collapses, and users can't tell why). Wire a `canAccept()` check from each downstream stage back to its producer, and visualize the paused-producer state distinctly from the normal running state.

Third pitfall: coupling timers to `Date.now()` / wall clock. When the user pauses the pipeline, drags a time scrubber, or opens devtools (which can throttle intervals in inactive tabs), wall-clock-driven ETL logic produces impossible numbers — million-record spikes when a throttled tab resumes, negative latencies after scrubbing backward. Drive the simulation from a virtual clock that advances explicitly per tick, and compute all rates/latencies against that virtual clock. This also makes tests deterministic and lets throughput-monitor's historical replay actually work.
