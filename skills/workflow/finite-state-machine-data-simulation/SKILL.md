---
name: finite-state-machine-data-simulation
description: Drive FSM execution via event-triggered or timer-driven tick loops, with transition lookup, countdown management, and emergency/interrupt state preservation.
category: workflow
triggers:
  - finite state machine data simulation
tags:
  - auto-loop
version: 1.0.0
---

# finite-state-machine-data-simulation

FSM simulation engines fall into two execution models that share a common transition-lookup core. Event-driven FSMs (interactive simulators, regex testers) expose a `trigger(event)` function that searches the transition table for a match on `(currentState, event)`, updates `current`, and fires a render pass. Time-driven FSMs (traffic lights, process controllers) use `setInterval(tick, 1000)` where `tick()` decrements a per-state countdown and calls `enter(states[current].next)` when it hits zero. Both models must implement the same `enter(stateName)` function that (a) validates the target state exists, (b) updates `current`, (c) resets any countdown from `states[stateName].duration`, and (d) appends a log entry. For character-by-character processing (regex/string matching), use a 500 ms interval that reads one input symbol per tick, looks up `transitions[state][symbol]`, and falls through to a REJECT sink state on undefined keys, updating a tape visualization cell from `active` to `done` as it advances.

Interrupt/override states (emergency modes, pause, manual advance) require a `preInterrupt` variable that captures `states[current].next` before entering the override state. When the override expires, resume via `enter(preInterrupt || defaultState)`. This pattern must guard against re-entrant interrupts: if the user triggers emergency while already in emergency, `preInterrupt` would be overwritten with `null` (since the emergency state's `next` is null), silently losing the original resume target. Defend by checking `if (current !== 'EMERGENCY') preEmergency = states[current].next` before entering the override. For regex-style FSMs, always define the implicit REJECT sink state explicitly in the state map—even if filtered from the visualization—so that transition lookups never silently produce `undefined`.
