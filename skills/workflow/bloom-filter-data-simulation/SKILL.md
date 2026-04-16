---
name: bloom-filter-data-simulation
description: Generate deterministic insert/query streams that reliably demonstrate false positives at chosen fill levels
category: workflow
triggers:
  - bloom filter data simulation
tags:
  - auto-loop
version: 1.0.0
---

# bloom-filter-data-simulation

Demo apps need to reliably *show* false positives, which are probabilistic and may not occur in small random datasets. Use a two-phase simulation: (1) insertion phase populates the filter with a known wordlist (e.g., 500 spam tokens, dictionary words, or synthetic IDs) to a target fill ratio — compute how many inserts are needed from the formula n = -(m · ln(1-fill))/k rather than hardcoding counts so the demo stays correct across slider changes. (2) Query phase streams a mix of inserted-elements (guaranteed true positives) and never-inserted elements drawn from the same alphabet/distribution, so false positives occur at roughly the theoretical rate within a few hundred queries.

Seed all hash functions and the query stream from a single deterministic PRNG seed exposed in the UI (or persisted to localStorage). This makes false-positive events reproducible — critical for teaching, debugging, and comparing parameter choices side-by-side. For the false-positive-lab app specifically, provide a "sweep" mode that runs N queries silently, bins results by actual vs. theoretical FPR, and plots the delta — this turns a toy into a proper experimental instrument.

For the spam-shield simulation, build a corpus generator that emits realistic-looking messages: some with tokens that were "trained" into the filter (true spam), some with neutral tokens (true ham), and some with tokens that coincidentally hash-collide with spam tokens (false-positive ham). Label ground truth for each so the UI can compute precision/recall live. Avoid pulling from remote APIs — keep corpora bundled and small so the demo runs offline and deterministically.
