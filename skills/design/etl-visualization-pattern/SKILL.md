---
name: etl-visualization-pattern
description: Multi-stage ETL flow visualization with source → transform → sink node representation and inter-stage queue depth indicators
category: design
triggers:
  - etl visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# etl-visualization-pattern

ETL applications benefit from a left-to-right directed acyclic graph (DAG) visualization where each node represents a pipeline stage (Extract, Transform, Load) and edges represent data flow between stages. Each node should expose live metrics as overlay badges: records/sec throughput, error count, and current batch size. Inter-stage edges should render as animated paths (dashed stroke-dashoffset animation) whose speed is proportional to current throughput, giving an intuitive sense of flow velocity. Use distinct color semantics per stage type — typically blue for extract (sources), amber for transform (processing), and green for load (sinks) — with a red overlay state when any stage enters error or backpressure.

Queue depth between stages is the most important ETL health signal and deserves first-class rendering. Place a small capacity gauge on each edge showing the buffer fill percentage; when fill exceeds ~80% flip the edge color to amber, and above ~95% to red to indicate imminent backpressure. For transform nodes, expose an expandable panel showing the transform function's input/output schema diff so users can see field-level changes (added, dropped, renamed, coerced). This pattern generalizes across pipeline-visualizer, transform-playground (single-node focus mode), and throughput-monitor (aggregated cross-stage rate panel).

Persist selected node and zoom/pan state in URL query params so deep-links into a pipeline view are shareable. For high-cardinality pipelines (20+ stages) provide a minimap and automatic layout via dagre or elkjs rather than hand-positioned nodes — manual coordinates break the moment a stage is added or reordered.
