---
name: health-check-implementation-pitfall
description: Common failure modes in health-check dashboards — innerHTML thrashing, unbounded history buffers, misleading threshold logic, and false-healthy rendering.
category: pitfall
tags:
  - health
  - auto-loop
---

# health-check-implementation-pitfall

The most pervasive pitfall across all three apps is full DOM reconstruction on every tick. The heartbeat monitor calls `el.innerHTML = ''` and recreates all service cards every 500ms; the vitals ring does `ringsEl.innerHTML = metrics.map(...)` every 1500ms. This causes layout thrash, kills CSS transitions/animations mid-flight, resets scroll positions, and balloons GC pressure. With 6 services this is invisible, but at 50+ services or 200ms tick rates the frame budget blows out. The fix is a diff-and-patch approach: update only the text content and class names of existing DOM nodes, creating/removing elements only when the service list itself changes. The heatmap avoids this by building the DOM once at startup — but it has no mechanism for live updates, so adding real-time cell updates would immediately hit the same trap.

The second pitfall is threshold logic that conflates metric value with health state. The heartbeat monitor uses `latency > 100` as its sole down/up signal, but real health checks need hysteresis — a service flickering between 99ms and 101ms will strobe green/red every tick. All three apps lack a debounce or consecutive-failure count before state transition (e.g., "3 consecutive ticks above threshold = degraded, 5 = down"). The uptime heatmap hardcodes uptime percentages in the tooltip (`status === 'ok' ? '100%' : '97.3%' : '84.1%'`) rather than computing them from actual cell history, which means the displayed SLA number is decorative, not derived — a dangerous pattern if ported to production where operators would trust those numbers.

The third pitfall is unbounded or silently-bounded history. The heartbeat monitor's `points` array is capped at 200 entries via shift(), but there is no cap on the total number of ticks — meaning the log in the vitals ring grows to 40 entries and then silently drops the oldest via `lastChild.remove()`, with no indication to the user that history was lost. More critically, none of the apps persist state: a page refresh wipes all history. For a real health dashboard, the simulation layer must be separated from the rendering layer with an explicit ring buffer or time-series store, and the heatmap data should be fetched from a backend rather than generated client-side — otherwise the dashboard itself becomes a reliability blind spot, showing "all green" simply because it just started up.
