---
name: domain-driven-data-simulation
description: Structured command-event-state triplets for simulating aggregate lifecycles and context relationships.
category: workflow
triggers:
  - domain driven data simulation
tags:
  - auto-loop
version: 1.0.0
---

# domain-driven-data-simulation

DDD data simulation is built around three interconnected data models. First, the context graph model defines bounded contexts as `{ id, name, x, y, r, color }` nodes and inter-context relations as `{ from, to, type, label }` edges where `type` is a DDD-specific relationship pattern (Partnership, Customer-Supplier, Shared Kernel, Conformist, ACL, Published Language, Open Host). This graph is the minimum viable context map — each relation carries both the DDD pattern name and a domain-specific label describing what actually flows across the boundary (e.g., "Stock reservation", "Auth verification").

Second, the aggregate lifecycle model uses ordered arrays of `{ cmd, evt, state }` triplets grouped by aggregate type. Each step represents a command that produces a domain event and a resulting state snapshot. The simulation walks through these steps sequentially, prepending events to a stream and replacing the state display — exactly mirroring event-sourced aggregate reconstruction. Multiple aggregate types (Order, Customer, Product) share the same stepping mechanism but carry distinct lifecycle shapes: Order follows create→confirm→ship→deliver; Product follows define→restock→discount→discontinue. This reveals how different aggregates have fundamentally different state machines.

Third, the ubiquitous language model structures terms as `{ term, ctx, def, related, layer }` where `ctx` distinguishes Strategic from Tactical DDD and `layer` maps to architecture tiers (Domain, Application, Infrastructure, Architecture). The `related` array creates a term graph enabling cross-referencing. The reusable pattern here is: always tag domain terms with both their DDD classification level and their architecture tier — this dual-axis tagging prevents the common mistake of conflating strategic design decisions with tactical implementation choices.
