---
name: strangler-fig-data-simulation
description: Incremental module-by-module migration simulation modeling the strangler fig pattern's facade-routing and legacy-decay lifecycle.
category: workflow
triggers:
  - strangler fig data simulation
tags:
  - auto-loop
version: 1.0.0
---

# strangler-fig-data-simulation

Model the strangler fig migration as a data array of legacy modules (e.g., Auth, Users, Orders, Payments, Inventory, Reports, Notifications, Search), each with a `name` and a `route` path. Track migration state with a `Set` of migrated indices. On each migration action (user click), add the module index to the set and re-render three synchronized panels: the Legacy Monolith (modules shown as red-bordered cards that gray out and become non-interactive once migrated), the Facade/Proxy (route entries that flip from "→ monolith" to "→ new service" with an accent-colored border), and the New Services column (migrated modules appear with a fade-in animation). Compute migration percentage as `migrated.size / data.length * 100` and display it as both a progress bar fill-width and a text label.

The simulation's reusable structure is the three-column facade pattern: legacy source, routing layer, and modern target. The facade column is the critical element — it visually proves that every route always has exactly one destination, never zero and never two. This enforces the strangler fig invariant: traffic is incrementally rerouted, never split or dropped. The `render()` function performs a full DOM rebuild on each state change (clearing innerHTML), which keeps the view function pure — state is the `Set`, view is a projection of that state. For larger simulations, replace the full rebuild with a diffing strategy, but for ≤20 modules the simplicity of full re-render is preferable.

For the ecosystem data layer, generate organism populations per species with configurable `count`, `color`, and `radius` properties. Simulation state is an array of particle objects with position (`x`, `y`), velocity (`vx`, `vy`), species reference, and a `phase` offset for desynchronized oscillation. The velocity damping factor (`*= 0.99` per frame) prevents runaway acceleration while the two-zone boundary system (attract at outer edge, repel at inner core) keeps all particles in a stable annular region. This models the ecological reality that strangler fig ecosystems create a spatial gradient — organisms cluster around the fig but don't penetrate the trunk structure.
