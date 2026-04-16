---
name: backpressure-visualization-pattern
description: Reusable visual encoding patterns for rendering backpressure state across pipeline, wave, and dashboard views using Canvas and CSS.
category: design
triggers:
  - backpressure visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# backpressure-visualization-pattern

All three apps share a three-tier color semaphore — `#6ee7b7` (healthy/green), `#f59e0b` (warning/amber), `#f87171` (critical/red) — mapped to queue-fill thresholds at 50% and 80%. This ratio-to-color mapping is the core visual primitive: a single `pct = queue / max` value drives bar fills, node marker colors, wave-crest tints, and status badge classes. Any backpressure UI should expose this fill-ratio as the primary metric and let color thresholds derive from it, not from raw counts. The pipeline app (Canvas-based producer→queue→consumer layout) shows that drawing the backpressure *signal itself* — the dashed amber "slow down" arrow from queue back to producer — is as important as showing the queue level. Without a visible feedback path, users cannot distinguish a system that is passively overflowing from one actively throttling. The wave app reinforces this by encoding pressure propagation as a physics simulation (spring-force diffusion across N nodes with velocity damping), making latency-of-propagation visible. The dashboard app complements these with a card-grid pattern: each service gets an independent bar + in/out/queue metrics + status badge, making it trivial to spot which stage is the bottleneck. The reusable layout formula is: per-stage card with a `bar-bg > bar-fill` div pair (CSS transition on width, background-color set by threshold), a three-column metric row (in-rate, out-rate, queue-depth), and a status chip. Dark background (`#0f1117` body, `#1a1d27` cards) with `system-ui` font at small sizes (0.7–0.85rem) keeps the information-dense display scannable.
