---
name: blue-green-deploy-implementation-pitfall
description: Common mistakes when modeling blue-green deployments that break the mental model or hide real failure modes
category: pitfall
tags:
  - blue
  - auto-loop
---

# blue-green-deploy-implementation-pitfall

The most frequent pitfall is treating cutover as instantaneous — rendering a binary 0%/100% flip instead of showing in-flight request drain. Real blue-green deployments have a tail of requests still hitting the old stack for seconds-to-minutes after the router switches, and simulations/visualizations that omit this hide the most important operational concern (long-lived connections, streaming responses, websockets). Always model and render a non-zero drain phase where blue's request-rate decays exponentially rather than dropping to zero.

A second pitfall is conflating blue-green with canary or rolling deployments. Blue-green specifically means two complete, independent environments with atomic traffic switching at the router — not gradual pod replacement within one fleet. If your simulation shows green instances slowly replacing blue instances in the same pool, you've built a rolling deploy, not blue-green. Keep the two environments as fully separate entities with their own instance counts, versions, and health states; traffic shifting happens at the load balancer layer only.

Third, don't forget database and stateful-service coupling. Blue-green works cleanly for stateless services but breaks when blue and green share a schema that one has migrated and the other hasn't. Visualizations should surface a "shared dependency" indicator (database, cache, message queue) beneath both stacks, and simulations should include a failure scenario where green expects schema v2 while blue still writes v1 — the cutover succeeds but rollback becomes impossible without data loss.
