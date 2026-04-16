---
name: event-sourcing-visualization-pattern
description: Timeline-scrubber UI with append-only event log and projection state reconstruction for event-sourced systems
category: design
triggers:
  - event sourcing visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# event-sourcing-visualization-pattern

Event-sourced systems are best visualized with three synchronized panels: (1) an immutable event log rendered as a vertical or horizontal timeline with distinct icons per event type (Deposit, Withdraw, Transfer, AccountOpened), (2) a scrubber/playhead that lets users move to any point in history, and (3) one or more projection panels showing derived state (account balances, ledger totals, read models) computed by folding events from t=0 up to the playhead position. Use color coding by aggregate ID so events belonging to the same entity share a hue across panels, and render projection cells with a brief flash animation when their value changes as the scrubber advances — this makes the causal relationship between an event and state mutation visceral.

For race/replay visualizations (projection-race style), render multiple projection lanes side-by-side consuming the same event stream at different speeds or with artificial lag, so viewers see eventual consistency emerge. Always surface the event sequence number and version monotonically; never reorder by wall-clock timestamp since event-sourced systems rely on logical ordering. Include a "rebuild from zero" button that visibly replays every event into a fresh projection — this is the signature demonstration that differentiates event sourcing from CRUD and should be front-and-center in any teaching UI.

Keep the event log strictly append-only in the DOM (no mutations to existing rows, ever) and render new events with a subtle fade-in from the tail. Tooltip each event with its payload JSON and the resulting state delta so users can inspect cause and effect without leaving the timeline view.
