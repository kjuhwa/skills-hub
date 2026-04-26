---
version: 0.2.0-draft
name: binary-narrowing-causal-isolation
description: "Halve the suspect set per probe — log2(N) probes to isolate one cause out of N candidates. Domain-agnostic (commits, files, modules, config flags, dependencies)."
category: debug
tags:
  - debug
  - bisect
  - root-cause
  - search-cost
  - logarithmic
  - non-cost-displacement

composes:
  - kind: skill
    ref: debug/investigate
    version: "*"
    role: probe-orchestrator
    note: each probe is an investigation step that produces evidence (rule-in or rule-out)
  - kind: skill
    ref: ai/ai-subagent-scope-narrowing
    version: "*"
    role: scope-shrinker
    note: narrowing scope per probe is the meta-pattern; this technique is the search-cost discipline on top
  - kind: skill
    ref: agents/new-ml-backend-dependency-audit
    version: "*"
    role: phase-0-narrowing-instance
    note: a concrete instantiation — audit narrows the dependency suspect set before any integration code is written
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: inconclusive-probe-guard
    note: when a probe is inconclusive, mark "still-suspect", do NOT guess to keep the search progressing

recipe:
  one_line: "Given N candidate causes, halve the suspect set per probe — log2(N) probes isolate the one. Mark inconclusive probes as still-suspect, never guess to keep narrowing."
  preconditions:
    - "Failure has a finite, enumerable suspect set (N commits, N files, N modules, N flags, N deps) — not an open-ended causal universe"
    - "Each probe can be run on a subset of suspects and produces a deterministic pass/fail (or rule-in/rule-out)"
    - "Probes are roughly equal in cost (the log2(N) bound assumes uniform probe cost)"
    - "Suspect set size N is large enough that linear scan is painful (N ≥ ~16 — log2 wins decisively past this)"
  anti_conditions:
    - "Suspect set is small (N ≤ 4) — linear scan is faster end-to-end (no overhead of partition logic)"
    - "Suspect set is open-ended (the cause might not be in the enumerable list) — narrowing finds nothing"
    - "Probes are non-deterministic (flaky test, intermittent bug) — a single probe can't reliably split the set"
    - "Probes are coupled (rule-out of A depends on B's state) — binary partition assumption breaks"
  failure_modes:
    - signal: "Probe returns inconclusive; agent guesses 'probably in the left half' to keep narrowing — loses the rule-out invariant"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Inconclusive probe MUST keep both halves in suspect set; either re-design the probe or split the inconclusive subset further. Never let speculative narrowing pretend evidence exists."
    - signal: "Suspect set was assumed-finite but cause was outside it (e.g. environment, not code); log2(N) probes complete and find nothing"
      atom_ref: "skill:debug/investigate"
      remediation: "Always start with a 'is the cause even in this set?' sanity probe. If a known-good full-set still fails, the suspect set is wrong — re-scope before binary-narrowing."
    - signal: "Probes are non-uniform cost (one half is cheap to test, other half is expensive); log2(N) bound is misleading"
      atom_ref: "skill:ai/ai-subagent-scope-narrowing"
      remediation: "Weighted partition — split by probe cost not by count. Cheap-to-test halves first; expensive halves only after cheap ones rule out."
    - signal: "Coupled suspects (A only fails when B is also broken); binary partition rules out both A-half and B-half wrongly"
      atom_ref: "skill:debug/investigate"
      remediation: "Detect coupling via a 'rule-in both halves' probe before partitioning. If coupled, factor the coupled pair out as a single combined suspect, then narrow the rest."
  assembly_order:
    - phase: enumerate-suspects
      uses: probe-orchestrator
    - phase: sanity-probe
      uses: probe-orchestrator
      branches:
        - condition: "full-set probe reproduces failure"
          next: partition
        - condition: "full-set probe does NOT reproduce"
          next: rescope
    - phase: partition
      uses: scope-shrinker
    - phase: probe-half
      uses: probe-orchestrator
      branches:
        - condition: "probe deterministic pass/fail"
          next: narrow
        - condition: "probe inconclusive"
          next: split-further-or-redesign
    - phase: narrow
      uses: scope-shrinker
      branches:
        - condition: "suspect set size > 1"
          next: probe-half
        - condition: "suspect set size == 1"
          next: confirm-cause
    - phase: split-further-or-redesign
      uses: inconclusive-probe-guard
    - phase: rescope
      uses: probe-orchestrator
    - phase: confirm-cause
      uses: probe-orchestrator

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique describes a LOGARITHMIC search shape (log2(N) probes), distinct from cost-displacement crossover"
  - "the technique requires deterministic probes — flaky probes are an anti-condition, not a degraded mode"
---

# Binary-Narrowing Causal Isolation

> Given a failure and N enumerable suspect causes, isolate the one in **log2(N) probes** by halving the suspect set per probe. Domain-agnostic — applies to git bisect (suspects = commits), file/module subtraction (suspects = files), config flag flipping (suspects = flags), dependency-audit (suspects = libs), mock-vs-real swap (suspects = collaborators).

## Shape claim (deliberately non-cost-displacement)

This technique's cost shape is **logarithmic search**: log2(N) probes for N candidates. It is **not** cost-displacement, **not** crossover, **not** Pareto. It is a different mathematical regime:

| Suspects N | Linear scan probes | Binary-narrowing probes | Speedup |
|---:|---:|---:|---:|
| 4 | 4 | 2 | 2× |
| 16 | 16 | 4 | 4× |
| 256 | 256 | 8 | 32× |
| 4096 | 4096 | 12 | 341× |

The speedup grows unboundedly with N — there is no crossover threshold past which one inverts. The technique is unambiguously better past the small-N preamble cost. This is **deliberately** different from the cost-displacement family (`paper/swagger-spec-hardening-size-crossover`, `paper/parallel-dispatch-breakeven-point`, `paper/ai-swagger-gap-fill-confidence-distribution`) — it is a counter-example shape, included to test the survey #1157 hypothesis that "the same author keeps reproducing cost-displacement shape" reflects authoring template rather than corpus discovery.

<!-- references-section:begin -->
## Composes

**skill — `debug/investigate`**  _(version: `*`)_
each probe is an investigation step that produces evidence (rule-in or rule-out)

**skill — `ai/ai-subagent-scope-narrowing`**  _(version: `*`)_
narrowing scope per probe is the meta-pattern; this technique is the search-cost discipline on top

**skill — `agents/new-ml-backend-dependency-audit`**  _(version: `*`)_
a concrete instantiation — audit narrows the dependency suspect set before any integration code is written

**knowledge — `pitfall/ai-guess-mark-and-review-checklist`**  _(version: `*`)_
when a probe is inconclusive, mark "still-suspect", do NOT guess to keep the search progressing

<!-- references-section:end -->

## When to use

- A failure exists, and you have enumerated N suspect causes (commits, files, modules, config flags, dependencies)
- N is large enough that linear scan is painful — past ~16 suspects, log2 wins decisively
- Each probe can run on a subset and produces a deterministic rule-in / rule-out
- Probes are roughly equal in cost (the log2(N) bound assumes uniform probe cost)

## When NOT to use

- N ≤ 4 — linear scan is faster end-to-end; partition overhead is not worth it
- Suspect set is open-ended — the cause might not be in the enumerable list (e.g. environment, infra)
- Probes are non-deterministic — flaky bug, intermittent test; a single probe can't reliably split the set
- Suspects are coupled (A fails only when B does) — binary partition wrongly rules out both halves

## Phase sequence

```
                    enumerate-suspects (N candidates)
                              │
                              ▼
                       sanity-probe (full-set)
                       │              │
              reproduces           does NOT
              failure?             reproduce?
                       │              │
                       ▼              ▼
                  partition         rescope (suspect set is wrong)
                       │
                       ▼
                  probe-half ◄────────────────┐
                  │   │   │                    │
              pass  fail inconclusive          │
                │    │     │                   │
                ▼    ▼     ▼                   │
                narrow      split-further      │
                (drop one  or redesign         │
                 half)     probe               │
                  │            │               │
                  ▼            └───────────────┘
              size > 1? ──yes──┐
                  │            │
                  no           ▼
                  │         probe-half (loop)
                  ▼
              confirm-cause (size == 1)
```

After sanity, each iteration of probe-half halves the suspect set. log2(N) iterations isolate the cause.

## Glue summary (net value added)

| Added element | Where |
|---|---|
| Sanity probe BEFORE partitioning — guards against "suspect set is wrong entirely" | Pre-loop |
| Inconclusive-probe rule: keep both halves, never guess to keep narrowing | Probe contract |
| Coupled-suspect detection: factor coupled pairs as combined suspects | Suspect modeling |
| Weighted partition by probe cost — log2(N) assumes uniform; weighted preserves bound when costs vary | Partition strategy |
| Confirm-cause as its own phase, not "the loop ends when N=1" — a final probe MUST verify the lone suspect actually causes the failure | Loop exit |

The atomic skills cover **how to investigate** (`debug/investigate`), **how to narrow scope** (`ai/ai-subagent-scope-narrowing`), and **a concrete narrowing instance** (`agents/new-ml-backend-dependency-audit`). What this technique adds is **the binary-search discipline** with explicit guards against the four ways binary search degrades (inconclusive probes, wrong suspect set, non-uniform costs, coupled suspects).

## Why log2(N) is the load-bearing claim

Most "narrowing" or "investigation" techniques don't surface a cost claim — they describe phases without committing to how the cost scales. This technique's **only** claim is that probe count is log2(N). If the claim fails (probes aren't deterministic, suspects aren't enumerable, costs are non-uniform), the technique's value evaporates and the anti-condition triggers. Sharpening this claim is the technique's contribution.

## Why "sanity probe" before partitioning

A common failure: agent enumerates a suspect set of 256 commits, runs binary narrowing, lands on commit #137 — but the bug was actually introduced by a config change, not in the commit range at all. log2(256) = 8 probes, all conclusive, all wrong, because the suspect set was wrong.

The sanity probe runs the failure check on the **full suspect set**. If it doesn't reproduce, the suspect set is incomplete or off-target. Cost: one extra probe up-front. Benefit: eliminates a class of confidently-wrong outcomes. The technique requires it; without it, log2(N) probes can land on a confidently false answer.

## Why inconclusive probes must keep both halves

If a probe returns inconclusive ("can't tell — environment unstable, dependency not installed, build failed for unrelated reason"), the temptation is to guess: "probably in the left half, let me proceed." This collapses the rule-out invariant — the search no longer has evidence behind its narrowing.

The technique mandates: inconclusive probe → both halves remain suspect. Either re-design the probe (change what's measured), or split the inconclusive subset itself further (recursive narrowing). The cost is +1 probe per inconclusive event. The benefit is preserving the log2(N) correctness guarantee.

## Why coupled suspects break the assumption

Binary partition assumes each suspect is independently sufficient (any one of them, alone, causes failure). Coupled suspects (A and B both broken; either alone is fine) break this — when probe rules out A-half, the failure persists because B is still in B-half. Probe rules out B-half, failure persists because A returns to A-half.

The technique requires a coupling-detection probe before partitioning: run the failure check with **both halves** active. If failure reproduces, suspects may be in either half (normal case). If failure does NOT reproduce, suspects might be coupled across halves — factor the cross-half coupled pair as a single combined suspect, then narrow the rest.

## Domain mappings

| Domain | Suspect set | Probe | Sanity probe |
|---|---|---|---|
| Git regression | N commits between known-good and known-bad | `git checkout <mid>; run failing test` | Run failing test on HEAD (must reproduce) |
| File/module isolation | N files in a feature | Disable half the files, re-run | Run with all files (must reproduce) |
| Config flag flipping | N flags | Set half to default, re-run | Run with current flags (must reproduce) |
| Dependency audit | N deps | Mock half, re-run | Run with all real deps (must reproduce) |
| Mock-vs-real swap | N collaborators | Mock half, re-run | Run with all real collaborators (must reproduce) |

The technique's value is in the **shape** that holds across all these domains — not in any one domain-specific tool (`git bisect`, `pytest --deselect`, etc.).

## Verification (draft)

```bash
#!/usr/bin/env bash
set -e
SKILLS_HUB="${SKILLS_HUB:-$HOME/.claude/skills-hub/remote}"
for ref in \
  "skills/debug/investigate/SKILL.md" \
  "skills/ai/ai-subagent-scope-narrowing/SKILL.md" \
  "skills/agents/new-ml-backend-dependency-audit/SKILL.md" \
  "knowledge/pitfall/ai-guess-mark-and-review-checklist.md"; do
  test -f "$SKILLS_HUB/$ref" || { echo "MISSING: $ref"; exit 1; }
done
echo "OK"
```

## Known limitations (v0.2 draft)

- **Cost-uniformity assumption** — log2(N) bound assumes equal-cost probes. Real probes vary widely (some take 5 seconds, some take 5 minutes). Weighted partition mitigates but does not eliminate.
- **Coupling-detection is a heuristic** — the "both halves" probe detects pairwise coupling but not higher-order (3-way A∧B∧C coupled). For complex coupling structures, the technique degrades to linear.
- **Sanity probe is necessary but not sufficient** — it confirms the suspect set CAN reproduce the failure, but not that it WILL on every probe (intermittent bugs slip through).
- **No multi-cause handling** — the technique assumes ONE cause in the suspect set. If two independent suspects both cause failure, log2(N) probes find one of them; the second remains hidden until the first is removed and the search re-runs.
- **Domain-tool integration is not specified** — `git bisect run` automates one instance; `pytest --collect-only` enumerates another. The technique provides the shape; mapping to tools is per-domain.

## Provenance

- Authored: 2026-04-26
- Deliberate counter-example to the cost-displacement template — the survey `paper/arch/cost-displacement-shape-cross-paper-survey` (#1157) hypothesizes that the same author authoring the same shape repeatedly reflects template-bias not corpus discovery. This technique is one of several deliberate non-cost-displacement contributions:
  - `technique/workflow/soft-convention-4pr-cascade` + `paper/workflow/soft-convention-phase-ordering-necessity` (#1160) — necessity shape
  - `paper/workflow/safe-bulk-pr-anchor-phase-necessity` (#1174) — necessity shape
  - `paper/workflow/ai-swagger-gap-fill-confidence-distribution` (#1176) — Pareto distribution shape
  - `technique/debug/binary-narrowing-causal-isolation` (this) — logarithmic search shape
- Shape diversity in the technique catalog is itself evidence against pure template-bias. If the same author can author multiple distinct shapes deliberately, the cost-displacement recurrence elsewhere is more likely a real signal than a template artifact.
- A sibling paper measuring real-world probe counts vs log2(N) on 5+ repro'd regressions would close the loop. Until then, the log2(N) claim is theoretical and the technique remains v0.2 draft.
