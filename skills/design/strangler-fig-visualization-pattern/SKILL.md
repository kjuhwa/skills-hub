---
name: strangler-fig-visualization-pattern
description: Canvas-based visual encoding of strangler fig lifecycle stages with host-tree decay and aerial root growth animation.
category: design
triggers:
  - strangler fig visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# strangler-fig-visualization-pattern

Render the strangler fig's biological lifecycle on an HTML5 Canvas by modeling two competing visual elements: a host tree that fades in opacity as a `progress` scalar (0→1) advances, and a set of radial aerial roots that extend downward with sinusoidal wiggle. Initialize 8 root objects evenly distributed around a central axis, each carrying individual `speed`, `width`, and `wiggle` parameters to break visual symmetry. The host tree trunk shrinks via `ellipse` radius reduction proportional to progress while its fill alpha decays (`1 - progress * 0.8`), and the fig's own canopy fades in after the 40% threshold as a translucent green circle whose radius scales with `(progress - 0.4) / 0.6`. Map the continuous progress value to discrete lifecycle stage labels (Seedling → Epiphyte → Wrapping → Strangling → Free-standing) using `Math.floor(progress * 5)`.

For the ecosystem layer, place the strangler fig as a central radial structure (ellipse trunk + spoke-like root lines + translucent core) and populate organisms around it using species-typed particle objects. Each particle orbits with phase-offset sinusoidal drift and is bounded by two invisible radii: an outer boundary (280px) that pulls particles inward via velocity damping (`vx -= dx * 0.002`), and an inner exclusion zone (60px) that repels them outward. Color-code species and implement hover detection via Euclidean distance from mouse coordinates, highlighting the hovered organism with a white fill and a ring stroke in the species color. This two-zone attractor/repeller model produces naturalistic flocking without a full boids implementation.

Use a shared dark palette (`#0f1117` background, `#1a1d27` panels, `#6ee7b7` accent for fig-colored elements) across all views. UI controls (speed slider, reset button, stats panel) are fixed-position overlays with compact typography (11-14px) so the canvas remains the primary visual. The `requestAnimationFrame` loop drives both the growth animation and the ecosystem simulation, with speed controlled by a user-adjustable multiplier applied to the time delta.
