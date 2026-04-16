---
name: saga-pattern-data-simulation
description: Async step-walker with LIFO compensation stack for generating realistic saga execution traces in browser simulations.
category: workflow
triggers:
  - saga pattern data simulation
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-data-simulation

The core simulation engine across all three apps follows an identical async step-walker pattern: a `for` loop iterates through an ordered `steps[]` array, each entry holding a `{name, comp}` pair (forward action name and its compensating action name). On each iteration the walker sets the step status to "running," awaits a `setTimeout` delay (600–700ms for forward steps, 400–500ms for compensation), then either marks the step "done" and pushes its index onto a `completed[]` stack, or — if the current index matches a `failAt` sentinel — marks it "failed" and enters the compensation phase. The `failAt` value is either -1 (no failure) or a random index from `Math.floor(Math.random() * 3) + 1`, always skipping step 0 so at least one step completes before failure, giving the compensation path something to unwind.

Compensation traversal is strictly LIFO: `for (let j = completed.length - 1; j >= 0; j--)` walks the completed stack in reverse, setting each step to "compensating" then "compensated" with its own async delay. Critically, the failed step itself is never compensated — only previously-committed steps are unwound. This matches real-world saga semantics where the failing step's side effect never persisted. The timeline app extends this model to multi-saga comparison by pre-defining four saga instances (`S-1001` through `S-1004`) with per-step metadata including target service index and latency-in-ms, enabling cross-saga visual correlation. One saga is left in a partial "pending" state to demonstrate in-flight visibility.

To generate realistic traces, vary three knobs: step count (4–8), failure injection point (weighted toward later steps for more dramatic compensation chains), and per-step latency distribution (normal distribution around 100–300ms with occasional 400ms+ outliers for payment/shipping services). Adding a `retryCount` field per step and an exponential backoff before declaring failure adds another dimension of realism without complicating the core walker loop.
