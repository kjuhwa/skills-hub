---
name: api-gateway-pattern-visualization-pattern
description: Visual layout for rendering API gateway routing, filter chains, and downstream service fan-out in a single dashboard
category: design
triggers:
  - api gateway pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# api-gateway-pattern-visualization-pattern

API gateway visualizations should arrange three horizontal swim lanes: client/ingress on the left, the gateway core (route matcher, filter chain, rate limiter, circuit breaker) in the center, and the downstream service mesh on the right. Each request is rendered as an animated token that traverses the lanes, changing color when it hits a filter (auth=blue, rate-limit=amber, transform=violet, reject=red). Persistent overlays show per-route RPS, p95 latency, and active circuit-breaker state so operators can correlate a slow downstream with upstream queue buildup without switching views.

The filter chain itself deserves a dedicated stacked-bar component: each filter is a row, width proportional to its average execution time, with a translucent error-rate band layered on top. Route matching should be visualized as a trie or predicate-tree collapse: hovering a path shows which predicates matched (Host, Path, Method, Header) and which were short-circuited. Avoid pie charts for traffic distribution — use a Sankey from routes to backend pools so weighted/canary splits are immediately legible.

Color encoding must be reserved exclusively for request lifecycle state (pending/forwarded/retried/failed/timed-out). Do not also use color for service identity — use shape or lane position instead, or the dashboard becomes unreadable when a single failing backend dyes half the canvas red.
