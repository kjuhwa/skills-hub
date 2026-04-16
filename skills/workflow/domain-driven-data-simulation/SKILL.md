---
name: domain-driven-data-simulation
description: Techniques for seeding and simulating DDD domain models with realistic bounded-context, aggregate, and event-flow mock data.
category: workflow
triggers:
  - domain driven data simulation
tags:
  - auto-loop
version: 1.0.0
---

# domain-driven-data-simulation

Each app initializes with a **hardcoded mock dataset** that represents a canonical e-commerce domain: the context-map seeds 5 bounded contexts (Order, Inventory, Shipping, Billing, Customer) with 6 typed relationships; the aggregate-builder seeds an Order aggregate root with LineItem entity, Money value object, and OrderPlaced event; the event-storm seeds an 11-note flow from `Place Order` through `StockReserved` and `PaymentConfirmed` to `OrderShipped`. The shared simulation pattern is: define domain objects as flat JavaScript arrays of plain objects with `{type, name/text, x, y, ...metadata}` shape, then iterate the array to instantiate visual elements. No API calls, no async loading — the mock data *is* the application state, mutated in place by drag and field-edit interactions.

The reusable workflow is a **three-layer seeding strategy**: (1) a type enum layer that defines valid DDD element kinds and their visual properties, (2) a seed data layer that instantiates specific domain examples using those types, and (3) a relationship/flow layer that connects seeds into meaningful DDD structures (context relationships, aggregate containment, event causality chains). The context-map uses an explicit `relations[]` array with `{from, to, type}` indexes; the event-storm encodes flow implicitly through spatial row-grouping (y=30 is the order row, y=140 is inventory, y=250 is payment); the aggregate-builder has no explicit connections, relying on visual proximity. For robustness, explicit relationship arrays are preferable to spatial inference.

The DDD-specific constraint is that mock data must respect **aggregate consistency boundaries**: the Order root owns LineItem and Money, not the other way around. Seed data that places a Value Object as a peer of an Aggregate Root (as the builder does with Money at the same board level as Order) can mislead users about containment semantics. Effective simulation should encode parent-child ownership so that moving an aggregate root also moves its owned entities and value objects, reinforcing the DDD principle that nothing outside the aggregate references its internals directly.
