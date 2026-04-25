---
version: 0.2.0-draft
name: backpressure-vs-rate-limit-comparison
description: "Backpressure vs rate-limit: hypothesis backpressure wins for variable consumers, rate-limit wins for untrusted producers"
category: data
tags: [backpressure, rate-limit, flow-control, hypothesis, tradeoff]
type: hypothesis

premise:
  if: A system needs to control producer rate to match consumer capacity
  then: >-
    Backpressure beats rate-limit (≥30% lower drops) at σ/μ≥0.3. Rate-limit wins
    (≥50% lower overflow) at ≥10% untrusted. Below (σ/μ<0.2, untrusted<5%) both
    within 10% — choice is moot.

examines:
  - kind: skill
    ref: workflow/backpressure-data-simulation
    role: backpressure-shape
  - kind: knowledge
    ref: pitfall/backpressure-implementation-pitfall
    role: backpressure-counter-evidence
  - kind: knowledge
    ref: pitfall/rate-limiter-implementation-pitfall
    role: rate-limit-counter-evidence
  - kind: knowledge
    ref: pitfall/dead-letter-queue-implementation-pitfall
    role: overflow-failure-mode

perspectives:
  - name: Producer Trust
    summary: Backpressure assumes cooperative producers that read the signal and slow. Untrusted producers ignore it. Rate limiting works on hostile producers because the cap is enforced consumer-side.
  - name: Consumer Variability
    summary: Backpressure adapts to consumer capacity in real time. Rate limiting requires a static cap; if consumer slows below the cap, backpressure recovers but rate limiting wastes capacity.
  - name: Failure Mode Asymmetry
    summary: Backpressure failure → buffer overflow → DLQ. Rate-limit failure → dropped requests at producer → silent customer impact. Different observability surface.
  - name: Hybrid Practicality
    summary: >-
      Production systems often combine both — rate limit for the outer perimeter
      (untrusted), backpressure for inner pipelines (trusted). The paper's claim is
      about default choice when only one is allowed.

external_refs: []

proposed_builds:
  - slug: producer-control-decision-table
    summary: Knowledge-entry decision table mapping (producer-trust × consumer-capacity-variability × cost-tolerance) to recommended technique. Backed by benchmark data from the next experiment.
    scope: poc
    requires:
      - kind: knowledge
        ref: pitfall/backpressure-implementation-pitfall
        role: seed-data-point
      - kind: knowledge
        ref: pitfall/rate-limiter-implementation-pitfall
        role: seed-data-point

experiments:
  - name: backpressure-vs-rate-limit-workload-replay
    hypothesis: >-
      4-cell matrix (σ/μ ∈ {0.1, 0.5} × untrusted ∈ {0%, 25%}): backpressure ≥30%
      lower drops at σ/μ≥0.3 trusted; rate-limit ≥50% lower overflow at ≥10%
      untrusted; crossover (σ/μ≈0.2, untrusted≈5%) <10% delta.
    method: >-
      Synthesize 4 workload generators (one per matrix cell). Run each 5 min through both
      mechanisms. Measure drop rate, p99 latency, throughput, DLQ depth. Compute deltas.
    status: planned
    built_as: null
    result: null
    supports_premise: null
    observed_at: null

outcomes: []

status: draft
retraction_reason: null
---

# Backpressure vs Rate Limiting: Which Tool When?

## Introduction

(see frontmatter)

### Background

The hub has both the backpressure technique (`technique/data/producer-consumer-backpressure-loop`) and pitfalls for both backpressure and rate limiting. What is missing is the **decision rule** for when to pick which. Most teams default to one based on familiarity rather than the problem shape.

### Prior art

Useful sources via `/hub-research`: AWS API Gateway vs SQS-with-Lambda case studies, the "Tail at Scale" paper, Netflix's Hystrix retrospective.

## Methods

(planned — see `experiments[0].method` in frontmatter for the full design. This section becomes substantive when `status: implemented` and is checked for length by `_audit_paper_imrad.py` at that point.)

## Results

(pending — experiment status: planned. Run `/hub-paper-experiment-run <slug>` once the experiment completes to populate this section from `experiments[0].result`.)

## Discussion

(see frontmatter)

### Limitations

- The premise's "trusted producer" axis is binary; real systems have gradients (semi-trusted internal services)
- Paper treats latency and drop-rate as primary; production also cares about cost, observability, ops complexity
- 4 workload classes are a simplification of real distributions

<!-- references-section:begin -->
## References (examines)

**skill — `workflow/backpressure-data-simulation`**
backpressure-shape

**knowledge — `pitfall/backpressure-implementation-pitfall`**
backpressure-counter-evidence

**knowledge — `pitfall/rate-limiter-implementation-pitfall`**
rate-limit-counter-evidence

**knowledge — `pitfall/dead-letter-queue-implementation-pitfall`**
overflow-failure-mode


## Build dependencies (proposed_builds)

### `producer-control-decision-table`  _(scope: poc)_

**knowledge — `pitfall/backpressure-implementation-pitfall`**
seed-data-point

**knowledge — `pitfall/rate-limiter-implementation-pitfall`**
seed-data-point

<!-- references-section:end -->

## Provenance

- Authored 2026-04-25, batch of 10
- Sibling: `paper/parallel-dispatch-breakeven-point` (related cost-model paper)
- Body migrated to IMRaD structure 2026-04-25 per `docs/rfc/paper-schema-draft.md` §5 by `_migrate_paper_to_imrad.py`. Pre-IMRaD body is preserved in git history; no semantic claims were rewritten during the migration. For hypothesis-type drafts, Methods + Results sections are stubs until the experiment completes.
