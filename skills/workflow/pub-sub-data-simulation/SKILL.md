---
name: pub-sub-data-simulation
description: Interval-driven mock message generation with domain-typed payloads, random topic selection, and bounded retention for pub-sub demos.
category: workflow
triggers:
  - pub sub data simulation
tags:
  - auto-loop
version: 1.0.0
---

# pub-sub-data-simulation

Each app generates synthetic pub-sub traffic using a `setInterval` loop (600ms–2000ms) that selects a random topic and publishes a message. Topic selection uses the pattern `topics[Math.random() * topics.length | 0]` — the bitwise-OR truncation avoids `Math.floor` verbosity and is idiomatic in simulation code. The flow-canvas emits topic-only particles (no payload), the topic-board selects from pre-written domain payloads (`mockMsgs` keyed by topic name with 3–4 realistic examples per topic like `"Order #1042 — $59.99"` or `"Card declined: *4242"`), and the constellation fires pulses from a randomly chosen publisher node to all same-topic subscribers. This three-tier approach — no-payload, canned-payload, topology-aware — covers progressively richer simulation needs.

Retention bounding is critical for long-running demos. The topic-board caps each column at 20 DOM children by removing `lastChild` when the threshold is exceeded. The canvas apps filter out particles whose progress reaches 1.0 (`particles = particles.filter(p => p.t < 1)` or `phase !== 'done'`). Without these caps, DOM node count or array length grows unbounded and the demo degrades within minutes. The constellation also maintains a running `msgTotal` counter for the stats HUD, which only increments — it never resets — giving the user a cumulative throughput feel.

The reusable simulation recipe is: (1) define a topic registry with domain-realistic names (dot-separated like `order.created`, not generic), (2) build a `mockMsgs` map with 3+ canned payloads per topic that include realistic identifiers and values, (3) run a `setInterval` at 600ms–2s that picks a random topic and publishes, (4) provide a manual publish control (button + topic selector + optional text input) so users can inject specific messages, (5) enforce a retention cap — either max array length for particles or max DOM children for cards. This pattern produces a self-running demo that feels alive without manual interaction but still supports hands-on exploration.
