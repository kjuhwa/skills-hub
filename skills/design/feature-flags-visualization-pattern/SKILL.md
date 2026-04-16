---
name: feature-flags-visualization-pattern
description: Unified visualization approach for feature-flag state, dependencies, and experiment outcomes across rollout, graph, and A/B dashboards
category: design
triggers:
  - feature flags visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# feature-flags-visualization-pattern

Feature-flag UIs share three visual primitives that should be rendered consistently across apps: (1) a **flag state chip** encoding `on | off | partial(%) | targeted | archived` via color + glyph (green solid, gray outline, half-fill percentage ring, blue bullseye, strikethrough) so operators can scan hundreds of flags without reading labels; (2) a **cohort bucket bar** — a 100-unit horizontal bar segmented by variant/rule, where each segment shows rule-order on hover (first-match-wins is the dominant evaluation model in flag systems, so left-to-right ordering must mirror rule priority); and (3) a **dependency edge** with semantics baked into the stroke: solid = `requires`, dashed = `blocks`, dotted = `mutually-exclusive`, and arrowhead filled only when the parent flag is currently enabled in the selected environment.

All three apps should drive these primitives from a single `FlagEvaluationContext` object (environment, user-segment, timestamp) so the rollout simulator, the dependency graph, and the A/B dashboard agree on "what state is this flag in right now." When the user scrubs a time slider or switches environment, every primitive re-derives from the context rather than re-fetching — this keeps the rollout percentage ring, the graph node fill, and the A/B variant split visually synchronized. Avoid per-app color palettes; treat `variant-A`/`variant-B`/`control` as a reserved triad (blue/orange/gray) so a user moving between dashboards isn't forced to re-learn the legend.

Finally, annotate every visualization with the **evaluation reason** ("matched rule #2", "fell through to default", "killed by dependency X") as a tooltip or side-panel field. Feature-flag bugs are almost never "the flag is wrong" — they're "the flag evaluated to the wrong value for this user for a reason the UI didn't surface." Treating the reason string as a first-class visual citizen, not debug output, is what separates a toy flag UI from a production one.
