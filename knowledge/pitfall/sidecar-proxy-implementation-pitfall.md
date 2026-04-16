---
name: sidecar-proxy-implementation-pitfall
description: Common rendering, simulation, and UX pitfalls when building sidecar-proxy visualizations.
category: pitfall
tags:
  - sidecar
  - auto-loop
---

# sidecar-proxy-implementation-pitfall

The most frequent rendering issue is particle pile-up at stage boundaries. When the pipeline simulator spawns requests faster than they can traverse (especially in spike mode at 75 ms intervals), dozens of particles stack at the "Network" midpoint where speed is lowest, creating an unreadable blob. The fix is to cap concurrent in-flight particles (e.g., 40–60) and defer new spawns, or add vertical jitter so stacked particles remain individually distinguishable. A related problem occurs in the topology view: if particle speed is constant regardless of edge length, short edges appear congested while long edges look idle even at equal RPS — normalizing speed by edge pixel-length keeps visual density proportional to actual load.

Simulation fidelity degrades when fault injection is purely random. Real sidecar failures are correlated: a single upstream going unhealthy causes cascading 503s across dependent edges, not isolated 40 % per-request faults spread uniformly. Without modeling these dependency chains, the traffic sim teaches users to expect evenly distributed errors, which is the opposite of production behavior. The dashboard compounds this by assigning health status independently per service — it's possible to show Payment as HEALTHY while Order (its only consumer) is UNHEALTHY, which is topologically inconsistent and erodes operator trust.

On the UX side, the 1.5 s dashboard refresh and the 400 ms particle spawn are hardcoded intervals that fight each other when displayed side-by-side. Metric cards update in visible jumps while particles flow smoothly, creating a cognitive mismatch. Aligning the data tick to the animation frame budget (e.g., interpolating KPI values between ticks) produces a more coherent experience. Finally, the access-log panel lacks any filtering or search — once spike mode fills the 200-entry buffer in under 15 seconds, operators lose the ability to find the specific 503 they saw flash red in the pipeline, defeating the purpose of the dual-panel correlation layout.
