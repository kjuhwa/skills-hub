---
name: api-versioning-visualization-pattern
description: Dark-themed multi-view visualization for API version lifecycle, drift health, and negotiation strategy rendering.
category: design
triggers:
  - api versioning visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# api-versioning-visualization-pattern

API versioning UIs share a three-layer visual architecture: a **timeline layer** that plots versions along a vertical axis with status-colored dots (teal for active, amber for deprecated, red for sunset) connected by a continuous left-side rail; a **drift health layer** that renders canvas-based bar charts of per-version request distribution alongside a traffic-light health indicator (green >70% on latest, amber 40-70%, red <40%); and a **negotiation layer** that uses a two-panel request-builder/result-viewer layout with horizontal frequency bars comparing strategy usage (URL path, custom header, Accept header, query param). All three share a dark palette (#0f1117 background, #1a1d27 cards, #2d3348 borders, #e2e8f0 text, #6ee7b7 teal accent) and Segoe UI typography.

Each view maps domain state to color consistently: version status badges use the same green/amber/red triple across timeline cards, drift monitor tags, and negotiation response codes. The timeline cards support hover-translate (4px) and slide-in detail panels showing endpoint lists, consumer counts, and breaking-change flags. The drift monitor appends a live request log (capped at 40 entries) with color-tagged version labels and timestamps, auto-pruning oldest entries. The negotiator renders monospace HTTP response blocks (method, path, headers, status, resolution note) beside an SVG bar chart whose bar widths scale proportionally to the max strategy count (180px cap). Filtering controls (status toggles, version selectors, strategy dropdowns) sit in a fixed header row above each visualization.

To reuse this pattern: define a `VERSION_COLORS` map keyed by lifecycle status, wire a shared dark CSS token set, and compose your dashboard from timeline + drift + negotiation panels as independent components that all read from the same version registry data source.
