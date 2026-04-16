---
name: crdt-visualization-pattern
description: Side-by-side replica panels with convergence indicator for visualizing CRDT merge semantics
category: design
triggers:
  - crdt visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# crdt-visualization-pattern

CRDT visualizations need to show multiple replicas evolving independently, then converging to an identical state after merges. The effective layout is a horizontal row of replica panels (2-4 replicas for clarity), each rendering its own local view of the data structure — a counter value for G/PN-Counter, a rendered document for RGA/LSEQ text weaves, or a set of elements for OR-Set gardens. Above or below the replicas, a global "convergence status" badge flips between Diverged (red) and Converged (green) by deep-equality-checking the visible states after every tick.

Each replica panel should expose three affordances: (1) a local mutation control (increment button, text input, add/remove item), (2) a network toggle to simulate partition, and (3) a visible operation log or vector clock so the user can see causality. Merges are triggered either on a timer (gossip-style) or via explicit "sync" buttons between pairs of replicas. The key pedagogical moment is showing that after any sequence of concurrent operations followed by full sync, every replica arrives at the same state — so highlight the convergence transition with a brief animation.

For OR-Set and text CRDTs specifically, render tombstones and unique tags visibly (e.g., as faded strikethroughs or subscript IDs) so the user understands *why* remove-add-remove doesn't revert to "gone." For counters, show the per-replica contribution vector (`[3, 1, 2]` summing to 6) rather than just the merged total, since the vector is the actual CRDT payload.
