---
name: outbox-pattern-visualization-pattern
description: Three complementary visual encodings for the transactional outbox pipeline — flow animation, throughput dashboard, and interactive event simulator.
category: design
triggers:
  - outbox pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# outbox-pattern-visualization-pattern

The outbox pattern maps naturally to a 4-node directed pipeline: **Service → DB+Outbox → Relay → Broker**. The flow visualizer renders these as rounded rectangles on an HTML5 Canvas with a consistent color scheme (blue `#58a6ff` for Service, orange `#f0ad4e` for DB/Outbox, purple `#da70d6` for Relay, teal `#6ee7b7` for Broker) connected by dashed arrows. Messages in transit are animated particles that arc between nodes using sinusoidal vertical offset (`Math.sin(t*PI) * -30`), with a label above each dot indicating the operation phase (write, poll, pub). An auto-mode toggle fires `sendEvent` on a tick counter followed by a delayed `runRelay`, modeling the real-world asynchrony between the business transaction and the relay poller. The SVG variant (used in the simulator) achieves the same effect with `<animateMotion>` along a line path, which is lighter-weight and compositor-friendly. Both approaches use a fixed `0.6–0.8s` animation duration that keeps visual pacing readable without stalling the UI.

The dashboard layer complements flow animation with aggregate health metrics. Five KPI counters (Total, Pending, Sent, Failed, Events/sec) update on a 1-second interval. Throughput history is stored as a 60-sample ring buffer rendered as a bar chart with dynamic height scaling (`v/max * (h-20)`). The outbox queue view lists the 20 most recent events with color-coded status spans (pending/sent/failed), capped to prevent DOM bloat. A simulated 7% failure rate injects realistic error pressure so the dashboard always displays a mix of states rather than an unrealistic 100% success view. This failure injection makes the dashboard useful as a teaching tool — operators learn to read failure spikes against throughput trends.

The interactive simulator bridges flow and dashboard by letting users click domain-specific service buttons (Orders, Payments, Users, Shipping, Inventory) that emit typed events (`order.created`, `payment.completed`, etc.) into the pipeline. Each click triggers a chained `setTimeout` cascade — `0ms → 700ms → 700ms` — modeling the write-poll-publish latency. The simulator maintains two parallel tables: an Outbox Table (id, event type, status) and a Broker Topics table (topic, id, timestamp), showing state on both sides of the relay. A 10% failure rate on the relay step means some messages stop at PENDING and never appear in the topics table, visually demonstrating message loss without dead-letter handling. Seeding the first three services on load (`svcs.slice(0,3).forEach` with staggered timeouts) ensures the UI is never empty on first render.
