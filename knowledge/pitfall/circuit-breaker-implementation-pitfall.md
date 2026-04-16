---
name: circuit-breaker-implementation-pitfall
description: Common failure modes in circuit-breaker implementations including counter leak on state transitions, Half-Open race conditions, and threshold miscalibration in sliding windows.
category: pitfall
tags:
  - circuit
  - auto-loop
---

# circuit-breaker-implementation-pitfall

The most dangerous bug in circuit-breaker implementations is **counter leak across state transitions**. When the breaker trips from Closed to Open, the failure counter and sliding window must be fully reset. If they carry residual counts into the next Closed state (after a successful Half-Open recovery), the breaker will trip again almost immediately on the first minor hiccup — a phantom re-trip that looks like the downstream is still degraded when it's actually healthy. In canvas/SVG visualizations this manifests as a gauge that snaps to red after showing green for only a few seconds, and in the data simulation it shows up as unrealistically short Closed intervals. Always zero both `failureCount` and `windowTotal` on every Open→Half-Open and Half-Open→Closed transition, not just on Closed→Open.

The second pitfall is a **Half-Open race condition**. If the breaker enters Half-Open and multiple concurrent requests are in-flight, more than `probeBudget` requests may leak through before the state check runs. In a simulation this is modeled as a single-threaded tick loop so it never appears — but in the dashboard's real-time mode (connected to a live service), the UI may show `probeCount` exceeding the configured budget, confusing operators. The fix is to gate Half-Open entry with an atomic compare-and-swap on the state field and use a semaphore to cap in-flight probes. The visualization should clamp displayed probe count to `min(probeCount, probeBudget)` and show an overflow indicator if the backend reports a higher number.

The third pitfall is **threshold miscalibration with small sliding windows**. A window of 10 requests with a 50% threshold trips after just 5 failures — fine under high traffic, but under low traffic those 10 requests may span minutes, meaning a brief 2-second blip can trip a breaker that stays Open for a 30-second cooldown. Simulations that use fixed tick rates miss this entirely because they assume uniform request arrival. To expose it, the data simulation should support a Poisson arrival mode where inter-tick intervals vary, and the visualization's time axis must scale to real wall-clock time rather than tick count. Without this, teams calibrate thresholds in a simulator and then experience mysterious production trips under low-traffic conditions.
