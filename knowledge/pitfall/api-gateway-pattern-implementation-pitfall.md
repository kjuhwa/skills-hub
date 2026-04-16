---
name: api-gateway-pattern-implementation-pitfall
description: Common traps when modeling gateway policy chains, retries, and upstream health in demo/simulation apps
category: pitfall
tags:
  - api
  - auto-loop
---

# api-gateway-pattern-implementation-pitfall

The biggest pitfall is treating the policy chain as independent stages and summing their latencies — real gateways short-circuit (auth fail skips everything downstream) and share state (rate-limit counters feed circuit-breaker decisions). If the simulation evaluates every stage unconditionally, reject reasons become wrong (you'll show "rate-limited" for requests that should have 401'd first) and total latency inflates. Always model the chain as an early-exit pipeline where each stage returns `{decision, reason, latencyMs}` and downstream stages run only on `allow`. Related trap: forgetting that transform/rewrite stages mutate the request, so logging the *original* request on the upstream lane makes debugging impossible — log the post-transform request with a diff back to the original.

Retry and circuit-breaker interaction is the second landmine. Naive retry loops multiply load on an already-failing upstream and keep the circuit breaker's error-rate window pinned above threshold forever, so the breaker never closes even after the upstream recovers. Simulations must (a) count retries as *separate* attempts in the breaker's window, (b) apply jittered exponential backoff, and (c) respect the breaker's half-open probe semantics — only one trial request at a time, not a flood. If your latency-dashboard shows p99 climbing monotonically while error-rate stays flat, you almost certainly have unbounded retries feeding a closed breaker.

Third, route matching order and specificity bugs are easy to ship and hard to spot. Prefix routes (`/api/*`) will swallow traffic meant for more specific routes (`/api/v2/users`) if evaluated in declaration order instead of by specificity, and header/method predicates are often checked *after* path match so a wrongly-matched path never falls through to the correct route. Always sort routes by specificity (exact > regex > longest-prefix > prefix) at load time and surface the matched route ID on every token in the visualization — if users can see "this /api/v2/users request matched route `api-catchall`," the bug diagnoses itself. Never silently fall back to a default route without labeling it as such.
