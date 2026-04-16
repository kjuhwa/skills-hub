---
name: saga-pattern-visualization-pattern
description: Visualizing distributed saga execution with participant swimlanes, compensation arrows, and state transitions across services
category: design
triggers:
  - saga pattern visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# saga-pattern-visualization-pattern

Saga-pattern visualizations need to represent two orthogonal axes simultaneously: the horizontal time axis showing step progression (T1→T2→T3...→Tn) and the vertical participant axis showing each service/microservice involved in the transaction (OrderService, PaymentService, InventoryService, ShippingService). Render each participant as a swimlane with a distinct color band, and place local transaction boxes on each lane at the time they executed. Forward-flow arrows use solid lines in the saga's primary color (e.g., blue #3b82f6); compensation arrows use dashed lines in a warning color (e.g., amber #f59e0b) flowing right-to-left to visually communicate "undo" semantics.

For orchestrator-flow mode, add a central orchestrator lane at the top that fans out command arrows to participants and receives reply arrows back — this makes the hub-and-spoke topology explicit. For choreography mode, eliminate the orchestrator lane and instead draw event-publication arrows between participant lanes directly, with event-name labels on each arrow (OrderCreated, PaymentProcessed, InventoryReserved). Each step box should encode state via color: pending (gray), executing (pulsing blue), committed (green), compensating (animated amber), compensated (striped amber), failed (red). A right-side timeline panel lists events in chronological order with timestamps and correlation IDs for debugging.

The timeline-debugger variant adds scrubbing controls: a playhead that moves through the saga execution, with the ability to pause, rewind to a specific step, and inspect the saga log at that moment. Include a "what-if" toggle that simulates failure injection at any step — clicking a step box opens a panel to mark it as failed, then re-renders the cascade of compensations that would execute. Always show the saga's current overall state (RUNNING, COMPENSATING, COMPLETED, ABORTED) as a prominent badge, and surface the "pivot transaction" (the last non-compensatable step) with a distinctive marker since it's the semantic point-of-no-return.
