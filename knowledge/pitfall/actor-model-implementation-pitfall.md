---
name: actor-model-implementation-pitfall
description: Common mistakes when simulating mailboxes, supervision strategies, and message transport in the browser
category: pitfall
tags:
  - actor
  - auto-loop
---

# actor-model-implementation-pitfall

The biggest trap is treating message arrays as shared state instead of per-actor queues — once you push directly into `to.mailbox` at `send()` time instead of at arrival (`t >= 1`), you lose the visualization of transport latency and any drop-in-flight semantics. The mailbox-theater code correctly defers `m.to.mailbox.push()` until arrival; copying the send() shape without that delay collapses the whole model. Similarly, processing with `setTimeout(() => state='idle', 300)` is *not* a real mutex — a second message can still be shifted on the next tick because the guard is only `mailbox.length > 0`, so fast speeds produce overlapping "busy" flips that under-represent true serialization.

Supervision strategies are easy to mis-implement: `rest-for-one` must restart the crashed sibling and everyone *after* it in `siblings.slice(idx)`, not everyone before. The supervision-tree code also has a subtle bug where `targets.forEach(t => { if (t.status !== 'crashed') t.status = 'crashed'; t.status = 'restarting'; })` unconditionally overwrites to `'restarting'`, making the first-line check dead code — acceptable for a visualization but wrong if you consume `status` elsewhere. Finally, for ping-pong, always gate the re-send on a `running` flag inside the `setTimeout` callback (not before scheduling it), otherwise pressing Stop leaves orphan timers that resurrect traffic 200ms later. And cap in-flight/log arrays (`log.children > 60`, `history > 60`) — unbounded arrays will tank framerate within a minute at high speed settings.
