---
name: actor-model-implementation-pitfall
description: Common failure modes when simulating actor systems in browser-based visualizations—unbounded queues, cascade amnesia, and timer drift.
category: pitfall
tags:
  - actor
  - auto-loop
---

# actor-model-implementation-pitfall

**Unbounded mailbox growth** is the most frequent pitfall. In the mailbox-sim app, the queue is capped at 8 (`if (this.mailbox.length >= 8) return`), but the message-flow app has no such cap—the mailbox counter increments on arrival and decrements on a fixed 600ms delay regardless of arrival rate. Under broadcast or flood conditions, the counter can climb indefinitely while the visual badge only shows a number, hiding the fact that the system is silently dropping the relationship between counter and actual queued work. In production actor frameworks (Akka, Erlang/OTP), unbounded mailboxes cause memory exhaustion; in visualizations, they cause misleading UIs. The fix is to model the mailbox as an explicit array with a configurable bound and a visible overflow indicator (dead-letter display or red border).

**Cascade amnesia** occurs in the supervision tree when a crash is triggered on an actor that is already mid-restart. The `crash()` function guards with `if (state[id] !== 'alive') return`, which prevents double-crash but also means that a real failure during restart—a common real-world scenario—is silently ignored. Worse, the two-phase `setTimeout` chain (1000ms + 800ms) has no cancellation handle, so if the user rapidly clicks multiple nodes, overlapping timers can leave the tree in an inconsistent state where a parent shows `alive` but a child is still `restarting`. The fix is to store timer IDs per node and cancel previous recovery timers before starting new ones, or to use a proper state machine with explicit transition guards.

**Timer drift and frame-coupling** is a subtler issue. The message-flow app advances particles by a fixed `t += 0.02` per `requestAnimationFrame` call, meaning message speed is tied to frame rate—on a 144Hz monitor messages arrive twice as fast as on 60Hz. Similarly, `setInterval`-based injection doesn't account for tab backgrounding, where browsers throttle timers to 1Hz, causing a burst of queued messages when the tab regains focus. Both problems compound: a burst of arrivals after tab-resume hits actors whose `tick()` timers were also throttled, creating an artificial backpressure spike that doesn't reflect real actor system behavior. The fix is delta-time interpolation (`t += dt / duration`) using `performance.now()` differences between frames.
