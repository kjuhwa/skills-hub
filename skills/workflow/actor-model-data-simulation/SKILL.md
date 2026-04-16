---
name: actor-model-data-simulation
description: Simulate actor system behavior using timer-driven state mutation with probabilistic failure injection and staged restart recovery.
category: workflow
triggers:
  - actor model data simulation
tags:
  - auto-loop
version: 1.0.0
---

# actor-model-data-simulation

Actor-model simulations decompose into three concurrent loops operating at different frequencies. The **render loop** runs at display refresh rate (requestAnimationFrame for Canvas) or on-demand after state mutation (SVG/DOM re-render). The **state mutation loop** runs on a 1000–1500ms interval, advancing actor state machines through transitions (`idle → processing → waiting → overloaded`) with health deltas tied to state (`overloaded` loses 15 health points, others gain 5). The **failure injection loop** runs at 2000–3000ms, selecting random leaf nodes or actors and crashing them with a probability gate (typically 40–50%). This three-loop architecture keeps concerns separated: rendering never triggers state changes, state changes never trigger crashes, and crashes propagate through the data model before triggering a re-render.

The crash-and-restart cycle follows a staged pattern: (1) mark the target actor `alive=false`, (2) cascade the kill to children if modeling supervision, (3) schedule a `setTimeout` at 1200–2000ms to simulate restart latency, (4) on timeout, set `alive=true`, increment restart counters, and trigger re-render. Message simulation uses object pooling — messages are plain objects `{from, to, t, label}` where `t` progresses 0→1 at 0.02/frame, and completed messages are spliced from the array. Actor data structures track cumulative metrics (`processed`, `restarts`, `totalCrashed`) to enable dashboard-style summary stats computed via array reduction (`actors.filter(a => a.alive).length`).

The critical design decision is keeping actors as **plain mutable objects in a flat array** (or recursive tree for supervision), not class instances. This enables cheap serialization, simple iteration, and direct property mutation without accessor overhead. State transitions use random selection from an enum array (`STATES[Math.random() * STATES.length | 0]`) rather than formal state machine libraries — appropriate for visualization-grade fidelity where the goal is plausible behavior, not protocol-correct actor semantics.
