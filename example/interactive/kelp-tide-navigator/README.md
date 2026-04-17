# Kelp-Tide Navigator

> **Why.** Steer a submersible cartographer through drifting kelp, riding currents and timing whale-song pulses to chart temples before lantern-oil runs out.

## Features

- Turn-based drift with `stateless-turn-combat-engine` + `event-returning-pure-reducer` + `immutable-action-event-log` keeping every move replayable; state cloned via `json-clone-reducer-state-constraint`, damage model borrowed from `status-effect-enum-system`
- Timing window for whale-song rides uses `phase-window-timing-grade-with-pity`, tide cadence via `availability-ttl-punctuate-processor` metaphor, pulse schedule from `webaudio-burst-schedule-melody-with-raf-playhead`, rare-find pity loop from `gacha-soft-hard-pity`
- Hazards and rewards drawn from deterministic fixtures (`chaos-engineering-data-simulation`, `retry-strategy-data-simulation`, `backpressure-data-simulation`, `connection-pool-data-simulation`, `health-check-data-simulation`, `circuit-breaker-data-simulation`, `bulkhead-data-simulation`, `idempotency-data-simulation`, `dead-letter-queue-data-simulation`, `outbox-pattern-data-simulation`, `consistent-hashing-data-simulation`, `load-balancer-data-simulation`, `canary-release-data-simulation`, `blue-green-deploy-data-simulation`, `saga-pattern-data-simulation`, `schema-registry-data-simulation`, `rate-limiter-data-simulation`, `log-aggregation-data-simulation`, `pub-sub-data-simulation`, `oauth-data-simulation`, `object-storage-data-simulation`, `api-gateway-pattern-data-simulation`, `api-versioning-data-simulation`, `crdt-data-simulation`, `bff-pattern-data-simulation`, `actor-model-data-simulation`, `lantern-data-simulation`, `strangler-fig-data-simulation`, `raft-consensus-data-simulation`, `distributed-tracing-data-simulation`, `time-series-db-data-simulation`)
- UI follows `widget-card-composition`, `folder-coloc-style-types`, `layout-stable-hover-via-inset-shadow`, `menu-key-config-registry`, `incommensurate-sine-organic-flicker` for lantern wick flutter; oxygen/oil gauges respect `divide-by-zero-rate-guard` + `frozen-detection-consecutive-count`
- Movement input goes through `click-to-relative-direction-sign` + `canvas-event-coord-devicepixel-rescale`; autosave uses `oauth-token-env-persistence` metaphor; run report exports as `event-sourcing-visualization-pattern` log and protects from `layered-risk-gates` (kraken circuit-breaker halts run at three consecutive flounders)
- ## Skills applied
- `stateless-turn-combat-engine`, `event-returning-pure-reducer`, `immutable-action-event-log`, `json-clone-reducer-state-constraint`, `status-effect-enum-system`, `phase-window-timing-grade-with-pity`, `gacha-soft-hard-pity`, `availability-ttl-punctuate-processor`, `webaudio-burst-schedule-melody-with-raf-playhead`, `adaptive-strategy-hot-swap`, `layered-risk-gates`, `click-to-relative-direction-sign`, `canvas-event-coord-devicepixel-rescale`, `canvas-svg-dual-layer-hit-dispatch`, `incommensurate-sine-organic-flicker`, `parallax-sine-silhouette-horizon`, `lantern-visualization-pattern`, `fnv1a-xorshift-text-to-procedural-seed`, `widget-card-composition`, `folder-coloc-style-types`, `layout-stable-hover-via-inset-shadow`, `menu-key-config-registry`, `divide-by-zero-rate-guard`, `frozen-detection-consecutive-count`, `oauth-token-env-persistence`, `chaos-engineering-data-simulation`, `retry-strategy-data-simulation`, `backpressure-data-simulation`, `connection-pool-data-simulation`, `health-check-data-simulation`, `circuit-breaker-data-simulation`, `bulkhead-data-simulation`, `idempotency-data-simulation`, `dead-letter-queue-data-simulation`, `outbox-pattern-data-simulation`, `consistent-hashing-data-simulation`, `load-balancer-data-simulation`, `canary-release-data-simulation`, `blue-green-deploy-data-simulation`, `saga-pattern-data-simulation`, `schema-registry-data-simulation`, `rate-limiter-data-simulation`, `log-aggregation-data-simulation`, `pub-sub-data-simulation`, `oauth-data-simulation`, `object-storage-data-simulation`, `api-gateway-pattern-data-simulation`, `api-versioning-data-simulation`, `crdt-data-simulation`, `bff-pattern-data-simulation`, `actor-model-data-simulation`, `lantern-data-simulation`, `strangler-fig-data-simulation`, `raft-consensus-data-simulation`, `distributed-tracing-data-simulation`, `time-series-db-data-simulation`, `finite-state-machine-data-simulation`, `event-sourcing-visualization-pattern`
- ## Knowledge respected
- `actor-model-implementation-pitfall` (shared mutation), `backpressure-implementation-pitfall` (rate-limit vs feedback), `circuit-breaker-implementation-pitfall` (HALF_OPEN probe), `finite-state-machine-implementation-pitfall` (silent no-ops), `retry-strategy-implementation-pitfall` (thundering herd), `bulkhead-implementation-pitfall`, `idempotency-implementation-pitfall`, `dashboard-decoration-vs-evidence`, `json-clone-reducer-state-constraint`, `single-keyword-formulaic-llm-output`, `layered-risk-gates`, `divide-by-zero-rate-guard`

## File structure

```
kelp-tide-navigator/
  index.html    — shell, markup, inline SVG where used
  style.css     — dark-theme styling and animations
  app.js        — interactions, simulated data, render loop
  manifest.json — hub metadata
```

## Usage

```bash
# any static file server works
python -m http.server 8080
# or open index.html directly in a browser
```

## Stack

`html` · `css` · `vanilla-js` — zero dependencies, 205 lines

## Provenance

- Generated by auto-hub-loop cycle 1 on 2026-04-17
- Theme keyword: `Deep-sea cartographers chart bioluminescent currents as whale songs ripple through drifting kelp forests and sunken temples`
- Source working copy: `18-kelp-tide-navigator`
