---
name: command-query-data-simulation
description: Simulated command and query event generation with prefix-based classification, weighted distribution, and latency modeling.
category: workflow
triggers:
  - command query data simulation
tags:
  - auto-loop
version: 1.0.0
---

# command-query-data-simulation

The command-query data simulation pattern generates realistic CQ traffic by maintaining two separate name pools — commands (CreateOrder, UpdateCart, DeleteUser, ResetPassword, SavePrefs) and queries (GetDashboard, FindUser, ListOrders, SearchProducts, CountSessions) — selected uniformly at random. The command/query split uses a weighted coin flip (45% commands, 55% queries) reflecting the typical read-heavy skew of real systems. Latency is modeled with distinct uniform ranges: commands at 20–100ms (simulating write-path overhead, validation, and persistence) and queries at 5–35ms (simulating cached or indexed reads). This two-distribution approach is critical; a single latency range would mask the performance asymmetry that is the entire point of CQ separation.

For static analysis simulation, the separator app classifies arbitrary method signatures using a prefix-matching engine against two curated verb lists — 13 command prefixes (set, update, delete, remove, create, add, insert, save, put, post, send, reset, clear) and 13 query prefixes (get, find, fetch, list, count, is, has, check, search, load, read, query, select). The classifier normalizes input to lowercase alpha characters, tries command prefixes first, then query prefixes, then falls back to heuristics: presence of `=` or the `void` keyword implies a command; everything else defaults to query. Each classification carries a human-readable reason string ("prefix: set" or "mutator pattern") enabling auditability of the separation logic.

The reusable simulation recipe is: (1) define separate command and query operation catalogs with domain-appropriate names, (2) apply an asymmetric probability split reflecting expected read/write ratio, (3) model latency per-type with non-overlapping or minimally-overlapping ranges, (4) for classification tasks use ordered prefix matching with a fallback chain (verb prefix → structural heuristic → safe default to query), and (5) cap all accumulating data structures (latency buffers, feed entries, chart windows) with explicit size limits to support unbounded runtime.
