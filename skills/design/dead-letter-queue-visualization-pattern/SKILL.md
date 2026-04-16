---
name: dead-letter-queue-visualization-pattern
description: Triage-first DLQ UI pattern separating message inspection, flow topology, and failure forensics across three coordinated panels
category: design
triggers:
  - dead letter queue visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# dead-letter-queue-visualization-pattern

Effective DLQ visualizations reject the flat "list of failed messages" antipattern and instead split concerns across three views: (1) a triage console showing message rows with failure reason, retry count, age, and originating topic/queue, filterable by error class and time window; (2) a flow visualizer rendering the upstream producer → processor → DLQ topology as a directed graph with animated particles representing in-flight and rejected messages, where edge thickness encodes throughput and red pulses mark rejection events; (3) an autopsy report panel that expands a single message into its full lifecycle — headers, payload diff against schema, stack trace, redelivery history, and correlation IDs to distributed traces.

Color and motion must encode failure semantics, not aesthetics. Reserve red exclusively for poison messages (non-retryable), amber for transient failures still within retry budget, and gray for parked/quarantined messages awaiting human decision. Use radial or timeline layouts for retry history so operators can spot exponential backoff patterns and "stuck at attempt N" clusters. Always surface the replay/discard/quarantine action affordances directly on each message row — hiding them behind a detail drawer causes operators to batch-dismiss failures without inspection.

Cross-panel selection linking is mandatory: clicking a node in the flow graph filters the triage list; selecting a message row highlights its path in the topology and auto-opens its autopsy. This tri-panel coordination transforms DLQ inspection from reactive firefighting into systematic forensic analysis.
