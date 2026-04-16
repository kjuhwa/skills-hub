---
name: bloom-filter-visualization-pattern
description: Visualize bloom filter bit array state, hash function fan-out, and false positive regions in real time
category: design
triggers:
  - bloom filter visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# bloom-filter-visualization-pattern

When building a UI around a bloom filter, render three coupled views that update on every insert/query: (1) a bit-array grid where each cell is a colored square indicating 0/1 state, (2) animated lines or arcs connecting the queried element through its k hash functions to the specific bit positions they land on, and (3) a statistics panel showing current fill ratio (n/m), theoretical false positive rate `(1 - e^(-kn/m))^k`, and a counter of confirmed false positives encountered during probes. The bit grid should highlight collision hotspots by darkening cells touched by many inserts, making the intuition for false positives visually obvious.

Use distinct visual semantics for the three query outcomes: "definitely not present" (all k bits green/lit through empty cells), "possibly present — true positive" (all k bits lit, element was actually inserted), and "possibly present — false positive" (all k bits lit, but element was never inserted — highlight in red or amber). A history log of recent queries with these outcome badges helps users connect cause and effect. For the bloom-filter-explorer style app, add sliders for m (bit array size) and k (hash count) that trigger a full re-render with re-seeded hash functions so users can explore parameter space interactively.

For the spam-shield variant, layer domain framing on top of the raw bit-array view: show incoming messages/emails as a feed, and for each one display both the bloom filter decision ("flagged as spam" / "pass") and — during demo mode — the ground truth, so users can watch false positive rate accumulate against real traffic. Keep the bit grid visible but collapsible so the explanatory view doesn't overwhelm the operational view.
