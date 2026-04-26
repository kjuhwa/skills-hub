---
version: 0.2.0-draft
name: ai-swagger-gap-fill-confidence-distribution
description: "Do AI-filled @Schema values follow a Pareto distribution where 80% of consumer breakage comes from 20% of fields?"
category: workflow
tags:
  - swagger
  - openapi
  - ai-fill
  - pareto
  - hypothesis
  - distribution-shape

type: hypothesis

premise:
  if: AI authors @Schema field annotations on a Spring Boot springdoc spec via swagger-ai-optimization
  then: AI-filled values follow a Pareto-style distribution — ≥80% of downstream consumer breakage comes from ≤20% of AI-filled fields. Gap-guard's value is finding the 20%, not reviewing 100%.

examines:
  - kind: technique
    ref: workflow/swagger-spec-ai-agent-hardening
    role: subject
    note: subject technique whose gap-guard depends on fill distribution shape
  - kind: skill
    ref: workflow/swagger-ai-optimization
    role: fill-source
    note: pipeline atom that produces the AI-filled values measured here
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    role: gap-guard-atom
    note: review checklist whose ROI depends on the distribution shape
  - kind: paper
    ref: workflow/swagger-spec-hardening-size-crossover
    role: sibling-cost-displacement
    note: sibling on same technique, cost-displacement shape; this picks distribution
  - kind: paper
    ref: arch/cost-displacement-shape-cross-paper-survey
    role: orthogonal-prior
    note: third non-cost-displacement paper; tests survey bias hypothesis further

perspectives:
  - name: Pareto Distributions Observed Elsewhere
    summary: 80/20 distributions appear in defect rates, dependency citations, code-coverage gaps. AI fill is a writing process; bug distribution in writing follows Pareto. Plausible from prior art.
  - name: Field-Shape Determines Confidence
    summary: Common types (id, name, timestamp) carry strong AI priors — high confidence. Uncommon types (custom enums, polymorphic) have weak priors — confidence drops. The 20% concentrates on uncommon shapes.
  - name: Reviewer Attention Budget
    summary: Reviewer handles 100 fields/hr deep, 500/hr skim. At 1000 AI-filled fields per spec, full review = 10h, focused 20% = 2h. Pareto shape determines whether focused review captures most risk.
  - name: Counter-Argument — Uniform Risk
    summary: Distribution is not Pareto, all AI fills equally risky, full review needed. If true, the gap-guard checklist's selective focus is wrong and the technique should mandate 100% reviewer coverage.

external_refs: []

proposed_builds:
  - slug: fill-confidence-distribution-benchmark
    summary: Measure AI confidence + actual downstream consumer breakage rate per field across 5 generated specs. Plot the cumulative-breakage curve against field rank by confidence. Test Pareto fit.
    scope: poc
    requires:
      - kind: skill
        ref: workflow/swagger-ai-optimization
        role: fill-source-baseline
        note: pipeline atom whose fill outputs are scored
      - kind: technique
        ref: workflow/swagger-spec-ai-agent-hardening
        role: subject
        note: surrounding technique whose gap-guard claim is tested
  - slug: confidence-prediction-classifier
    summary: Classifier that predicts AI confidence from field shape signals (type, name, ancestor pattern). If high accuracy, focused review is automatable. If low, manual review remains necessary.
    scope: poc
    requires:
      - kind: knowledge
        ref: pitfall/ai-guess-mark-and-review-checklist
        role: gap-guard-baseline
        note: existing gap-guard the classifier might augment or replace
  - slug: focused-review-checklist
    summary: Subset of gap-guard that flags only low-confidence fields per the classifier. Reviewer focuses on the 20% most likely to break. Compare reviewer time + caught-breakage against full review.
    scope: poc
    requires:
      - kind: knowledge
        ref: pitfall/ai-guess-mark-and-review-checklist
        role: gap-guard-source
        note: full-review checklist this build narrows down

experiments:
  - name: gap-fill-distribution-measurement
    hypothesis: Across 5 specs (300+ AI-filled fields each), cumulative-breakage-by-rank curve fits Pareto — 80% breakage in top 20% by inverse-confidence. Random ordering produces near-linear control.
    method: |-
      Generate 5 specs via swagger-ai-optimization × varying source
      annotation density. Per AI-filled field, record AI confidence + LLM
      tool-caller breakage. Rank by inverse confidence; plot cumulative.
    status: planned
    built_as: null
    result: null
    supports_premise: null
    observed_at: null

outcomes: []

status: draft
retraction_reason: null
---

# AI-Swagger Gap-Fill Confidence Distribution

## Introduction

The `workflow/swagger-spec-ai-agent-hardening` technique (#1149) requires a gap-guard review checklist (`knowledge/pitfall/ai-guess-mark-and-review-checklist`) for any AI-filled @Schema annotation, on the rationale that AI gap-fills produce silent consumer breakage. The technique does not specify *whether* the breakage distributes uniformly across fields or concentrates on a long tail.

This paper interrogates the distribution shape. The premise predicts Pareto — 80% of breakage from 20% of fields — which would mean the gap-guard's value lies in finding the 20%, not reviewing 100%.

### Background

The subject technique cites the gap-guard checklist as a hard publish gate (phase 5). The checklist is per-field — every AI-filled value gets inline marked and added to a review-checklist sidecar. For specs with hundreds of fields, this produces meaningful reviewer load. The technique justifies the load on the grounds that "AI fills schema gaps with hallucinated values that pass static lint but break consumers." But how concentrated is the breakage?

Sibling paper `workflow/swagger-spec-hardening-size-crossover` (#1155) examined the same technique on a **cost-displacement axis** — when does the technique pay off as N endpoints grows. This paper picks a **distribution shape axis** — what's the structure of breakage incidence within a single spec.

This is the **third deliberate non-cost-displacement paper** (after #1160 phase-ordering necessity and #1174 anchor-phase necessity). The shape is also distinct from those two — it's a probability-distribution claim (Pareto), not a binary necessity claim. Three deliberately diverse shapes contributes to testing the survey paper's (#1157) selection-bias hypothesis.

### What this paper sets out to test

Whether AI-filled @Schema breakage follows a Pareto distribution that concentrates risk on a small fraction of fields, and whether AI confidence (a measurable per-field signal) predicts which fields end up in the high-risk 20%.

## Methods

(planned — see `experiments[0].method` for the measurement skeleton)

The experimental harness generates 5 OpenAPI specs via `swagger-ai-optimization` against synthetic Spring Boot projects of varying source annotation density:

| Spec | Source annotation density | AI-fill rate (predicted) |
|---|---:|---:|
| dense | 80% pre-annotated | low (~5%) |
| medium-dense | 60% pre-annotated | medium (~20%) |
| medium | 40% pre-annotated | medium-high (~40%) |
| sparse | 20% pre-annotated | high (~60%) |
| empty | 0% pre-annotated | very high (~95%) |

Per spec, target 300+ AI-filled fields. Per field, record:

- **AI confidence**: model's per-field confidence score during fill (or proxy via log-prob if direct score unavailable)
- **Breakage flag**: does a downstream LLM tool-caller's output deviate from expected schema when this field is involved?
- **Field shape**: type, name pattern, ancestor pattern (for classifier training in build [2])

Rank fields per spec by inverse confidence. Plot cumulative breakage against rank. Test Pareto fit (80% breakage in top 20% by rank).

### Pareto fit test

A clean Pareto would show:
- Top 20% of fields contain ≥80% of breakages
- Bottom 80% of fields contain ≤20% of breakages
- Cumulative-breakage curve hugs the y-axis until ~20% rank, then flattens

A uniform distribution (counter-argument) would show:
- Cumulative-breakage curve is roughly linear
- Top 20% contains roughly 20% of breakages

The experiment scores each spec on Pareto-deviation from these two extremes. Aggregate across 5 specs.

## Results

(pending — experiment status is `planned`; this paper is in draft state. Will be populated when the benchmark runs and `/hub-paper-experiment-run` closes the loop.)

## Discussion

(pending)

The expected finding shape: a Pareto-like curve with 70-90% breakage in the top 20% of inverse-confidence-ranked fields. If supported, the technique's gap-guard checklist could be refined into a focused-review variant — reviewer scans only the low-confidence 20%, halving reviewer time without losing coverage.

If refuted (uniform breakage distribution), the technique's full-review approach is correct — every AI-filled field carries similar risk and the reviewer cannot safely skip any subset. The classifier (build [2]) would be useless and would not ship.

If unexpectedly bimodal (some fields are 0-confidence guaranteed-broken, others are 100-confidence guaranteed-correct, nothing in between), gap-guard could be replaced by a binary auto-reject rule for the 0-confidence subset. That would be a stronger refute of the per-field review approach.

### Limitations

- 5 specs is small N. Pareto fit confidence intervals will be wide.
- AI confidence as a per-field signal may not be directly available from the model; log-prob proxies introduce noise.
- "Downstream LLM tool-caller breakage" is one breakage proxy; alternatives (codegen quality, doc-reviewer flagged items) might shift the distribution.
- Synthetic Spring Boot projects may not match production diversity — production teams have idiosyncratic naming, custom enums, etc. that the synthetic harness oversimplifies.
- The classifier (build [2]) is only useful if confidence prediction is accurate. Low classifier accuracy means the focused-review variant doesn't ship even if Pareto holds.

### Future work

1. Run benchmark first to establish the distribution shape. Decide whether to invest in classifier (build [2]) and focused-review (build [3]) based on Pareto fit strength.
2. If Pareto holds, propose `recipe.failure_modes` refinement to the subject technique — distinguish "low-confidence field" from "high-confidence field" failure incidence.
3. Replicate against 2-3 real production specs (anonymized) to validate synthetic findings.
4. Tie back to survey paper (#1157). This paper is the **third** deliberate non-cost-displacement shape (after #1160 necessity, #1174 necessity). Three diverse shapes from one author = strong evidence that author can diversify deliberately = bias hypothesis weakened.

<!-- references-section:begin -->
## References (examines)

**technique — `workflow/swagger-spec-ai-agent-hardening`**
subject technique whose gap-guard rationale depends on fill-rate distribution shape

**skill — `workflow/swagger-ai-optimization`**
pipeline atom that produces the AI-filled values measured here

**knowledge — `pitfall/ai-guess-mark-and-review-checklist`**
review checklist whose ROI depends on the distribution shape

**paper — `workflow/swagger-spec-hardening-size-crossover`**
sibling paper on same technique with cost-displacement shape; this paper picks distribution shape instead

**paper — `arch/cost-displacement-shape-cross-paper-survey`**
third deliberate non-cost-displacement paper; tests survey's bias hypothesis further


## Build dependencies (proposed_builds)

### `fill-confidence-distribution-benchmark`  _(scope: poc)_

**skill — `workflow/swagger-ai-optimization`**
pipeline atom whose fill outputs are scored

**technique — `workflow/swagger-spec-ai-agent-hardening`**
surrounding technique whose gap-guard claim is tested

### `confidence-prediction-classifier`  _(scope: poc)_

**knowledge — `pitfall/ai-guess-mark-and-review-checklist`**
existing gap-guard the classifier might augment or replace

### `focused-review-checklist`  _(scope: poc)_

**knowledge — `pitfall/ai-guess-mark-and-review-checklist`**
full-review checklist this build narrows down

<!-- references-section:end -->

## Provenance

- Authored 2026-04-26
- Subject: `paper/from-technique` against `technique/workflow/swagger-spec-ai-agent-hardening` (#1149)
- Status: draft — `experiments[0]` is planned; the paper will move to `status=implemented` once the distribution-fit benchmark runs
- **Third deliberate non-cost-displacement shape** (after #1160 phase-ordering necessity, #1174 anchor-phase necessity). This one is a Pareto-distribution claim — also distinct from the two prior necessity claims.
- Sibling on the same subject technique: `paper/workflow/swagger-spec-hardening-size-crossover` (#1155, cost-displacement shape on size axis). The two papers test the same technique from two completely different angles.
