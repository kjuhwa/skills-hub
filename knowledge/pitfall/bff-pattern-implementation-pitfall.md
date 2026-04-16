---
name: bff-pattern-implementation-pitfall
description: Common traps when implementing BFF layers — logic duplication across BFFs, hidden sequential bottlenecks, and misleading latency metrics.
category: pitfall
tags:
  - bff
  - auto-loop
---

# bff-pattern-implementation-pitfall

The most dangerous pitfall is **BFF logic duplication**. When each client platform (Web, Mobile, IoT) gets its own BFF, shared business logic (validation, authorization, data transformation) tends to be copy-pasted across BFFs rather than extracted into a shared service or library. In these apps, the mock data definitions and service-call mappings are hardcoded per-app (`microservices`, `bffToSvc`, `mockData`) — in production this becomes divergent validation rules, inconsistent error handling, and different data contracts for the same underlying entity. The fix is to keep BFFs thin (routing, aggregation, response shaping only) and push domain logic into the downstream services or a shared SDK.

The second pitfall is **accidentally sequential fan-out**. The entire latency advantage of BFF depends on the `Math.max(...delays)` parallel model, but it's easy to introduce sequential dependencies: service B needs a token from service A, or an ORM eagerly loads related data before the next call. In the simulator, `setTimeout` callbacks fire independently (true parallelism), but real implementations using `await` in a loop instead of `Promise.all` silently degrade to sequential behavior — destroying the BFF's latency benefit while keeping its complexity cost. Always audit that fan-out calls are genuinely concurrent; add tracing spans per downstream call to detect accidental serialization.

The third pitfall is **misleading simulation metrics**. The comparator app uses `rand(80,200)` for both modes, implying identical per-service latency — but in production, the BFF adds real overhead: serialization/deserialization of the aggregated payload, memory pressure from holding multiple in-flight responses, connection pool exhaustion under load, and retry/timeout complexity that doesn't exist in direct client-to-service calls. A simulation that only models happy-path parallel fan-out overstates BFF benefits. Production-realistic simulations must include: BFF processing overhead (not just network transit), partial failure scenarios (2 of 3 services respond, BFF must decide whether to return partial data or error), and cold-start latency for BFF instances. Without these, teams adopt BFF based on optimistic projections and discover the overhead only after deployment.
