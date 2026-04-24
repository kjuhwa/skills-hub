---
version: 0.1.0-draft
name: parallel-dispatch-useful-output-gate
description: The correct pre-flight gate for parallel subagent dispatch is the absolute count of files that actually need work, not the coverage fraction — parallel wall-clock savings dominate until useful_output is near zero
category: decision
tags:
  - parallel
  - subagent
  - dispatch
  - gate
  - cost-model
  - pre-check
  - kind/decision
kind: decision
confidence: medium
---

# Parallel Dispatch Gate: use `useful_output`, not coverage %

## Fact

When deciding whether to dispatch a bulk task to N parallel subagents vs running serial/sampling, the decision should be gated by **absolute count of files that need real work**, not by coverage fraction.

Concrete rule:

```
useful = (1 - coverage) * N
if useful < USEFUL_MIN (e.g. 5):
    NO DISPATCH — grep or sample to find the handful of files, edit them directly.
elif (useful * work_cost) > (A * startup_cost):
    PARALLEL — the work dominates startup overhead.
else:
    SAMPLING or SERIAL — not enough work to justify parallel's fixed cost.
```

The first branch (`useful < USEFUL_MIN`) is the real gate. Coverage alone doesn't capture it.

## Why the coverage-fraction heuristic is misleading

A prior session (see `knowledge/agent-orchestration/grep-existing-annotations-before-parallel-subagent-dispatch`) observed parallel dispatch waste at ~90% coverage and proposed a 70% threshold. A cost-model benchmark (`example/workflow/coverage-gate-benchmark`, produced by `paper/workflow/parallel-dispatch-breakeven-point`) showed that 70% is not a robust constant:

- Domain D (knowledge with `tags:`): **100 % coverage**, useful = 0 → correctly NO DISPATCH.
- Domain E (skills with stable version 1.x+): **80.3 % coverage**, useful = 92 files → parallel wall-clock savings still ~75 %, **parallel is still correct**.
- Domain A–C (~37–55 % coverage, useful = many): parallel clearly correct.

At 80 % coverage with 468 total files, 92 files still need work. 92 × work_cost dominates any plausible startup cost. Coverage fraction by itself is the wrong lens; **absolute useful_output is the right lens**.

## Concrete values (benchmark defaults)

```
USEFUL_MIN = 5 files       # below this, don't dispatch — just read+edit directly
A_default  = 4 agents
alpha      = 30 s/agent    # startup overhead
v          = 5 s/file      # verify only (already-done files)
w          = 60 s/file     # full real work
```

Under these values:
- `useful * w > A * alpha` becomes `useful * 60 > 4 * 30` → `useful > 2`.
- Combined with `USEFUL_MIN = 5`, the rule says: **below 5 useful files don't dispatch at all; above 5 parallel wins across typical ranges**.

If startup cost is much higher (α=180s cold-start models) or work cost is much lower (trivial regex edits w=10s), recompute — the thresholds shift.

## How to probe `useful` cheaply

```bash
total=$(find <scope> -name "*.ext" | wc -l)
hit=$(grep -rln "<marker>" <scope> | wc -l)
useful=$((total - hit))
echo "useful=$useful  coverage=$((hit * 100 / total))%"
```

One-second probe. Run before any subagent spawn.

## How to apply

- **Step 0 of any parallel dispatch skill**: compute `useful`; if below `USEFUL_MIN`, abort to sampling/manual edit.
- **Do not** publish a "70 % coverage → switch mode" rule as a universal constant — it overfits one session.
- **Do** publish `useful < K` as the primary gate; coverage is a derived value (`useful = (1-c) * N`) that is easier to misread than raw count.

## Related

- `paper/workflow/parallel-dispatch-breakeven-point` — the paper that proposed the threshold and whose experiment refined it.
- `example/workflow/coverage-gate-benchmark` — interactive cost model showing the threshold is weight-dependent.
- `knowledge/agent-orchestration/grep-existing-annotations-before-parallel-subagent-dispatch` — the original pitfall that seeded the discussion.
- `skills/workflow/parallel-bulk-annotation`, `skills/workflow/bucket-parallel-java-annotation-dispatch` — the HOW-TO skills this gate should sit in front of.

## Provenance

Derived from the `coverage-threshold-measurement` experiment recorded in the paper's `experiments[0]`, status `completed`, observed 2026-04-24. The experiment's `result` explicitly invited a refined knowledge entry in place of the paper's original `70 %` claim; this file is that entry.
