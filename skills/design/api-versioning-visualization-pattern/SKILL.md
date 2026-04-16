---
name: api-versioning-visualization-pattern
description: Three-panel visual encoding for API version lifecycle — timeline, traffic flow, and deprecation health
category: design
triggers:
  - api versioning visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# api-versioning-visualization-pattern

API versioning UIs require a consistent three-color semantic scheme that maps directly to version lifecycle states: green (#6ee7b7) for active/stable versions, amber (#facc15) for sunset/deprecated-but-live versions, and red (#f87171) for EOL/legacy versions. This palette must be applied uniformly across every visual element — timeline dots, particle trails, card borders, progress bars, chart segments, and status badges — so that a user scanning any panel instantly recognizes version health without reading labels. The dark background (#0f1117) with card surfaces (#1a1d27) provides sufficient contrast for all three signal colors while keeping the UI visually quiet around the data.

The pattern decomposes into three complementary views. First, a **vertical timeline** with left-border rail and dot markers shows the chronological evolution of versions, each node carrying version tag, release date, status badge, and a click-to-expand changelog categorized by ADD/CHANGE/REMOVE/FIX/DEPRECATE tags. Second, a **canvas-based particle router** animates live request flow from a client cluster through a central gateway node that fans out to versioned endpoint targets — particle color matches the target version's lifecycle color, and per-endpoint request counters provide cumulative traffic split. Third, a **deprecation dashboard** combines traffic-share summary cards (one per version, border-top colored by status), per-consumer migration progress bars (percentage migrated to the latest version), and a stacked bar chart showing daily traffic distribution across versions over a 7-day window.

The key compositional rule is that each view answers a different question — timeline answers "what changed and when," the traffic router answers "where is traffic going right now," and the deprecation dashboard answers "who hasn't migrated yet." All three share the same version model (version tag, status enum, color) and the same semantic color map so they can be embedded side-by-side in a single operations portal without visual dissonance.
