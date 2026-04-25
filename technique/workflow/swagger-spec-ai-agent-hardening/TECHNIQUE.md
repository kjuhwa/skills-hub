---
version: 0.2.0-draft
name: swagger-spec-ai-agent-hardening
description: "Spring Boot springdoc spec hardening for AI agents — baseline, bulk-annotate, externalize, runtime-inject, gap-guard"
category: workflow
tags:
  - swagger
  - openapi
  - springdoc
  - ai-agent
  - bulk-annotation
  - spec-optimization

composes:
  - kind: skill
    ref: workflow/swagger-ai-optimization
    version: "*"
    role: canonical-pipeline
  - kind: skill
    ref: workflow/bucket-parallel-java-annotation-dispatch
    version: "*"
    role: bulk-scaling
  - kind: skill
    ref: workflow/openapi-customizer-property-name-enricher
    version: "*"
    role: runtime-injection
  - kind: skill
    ref: backend/springdoc-yaml-externalization
    version: "*"
    role: long-text-externalization
  - kind: skill
    ref: workflow/swagger-spec-baseline-from-git
    version: "*"
    role: re-run-restore
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: gap-guard

recipe:
  one_line: "Optimize a Spring Boot OpenAPI spec for AI consumption — bulk-annotate via subagent buckets, externalize long text, runtime-inject patterns, guard AI-filled gaps with the review checklist."
  preconditions:
    - "Spring Boot + springdoc project producing swagger.json that an AI agent will consume"
    - "Spec has 100+ @Operation methods or 500+ @Schema fields needing bulk annotation"
    - "AI agent expects rich operationId / @Schema / @ApiResponse / x-filterable-fields metadata"
  anti_conditions:
    - "Hand-curated small spec (≤30 endpoints) — bulk-dispatch overhead is unjustified"
    - "Non-Spring framework (FastAPI, Express, etc.) — springdoc-specific atoms don't apply"
    - "Static spec maintained outside code — runtime-customizer pattern is wasted"
    - "Spec consumed only by humans — AI-agent optimization adds no value"
  failure_modes:
    - signal: "AI fills schema gaps with hallucinated values that pass static lint but break consumers"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Annotate every AI-generated value inline; output a review checklist; require human review before publish"
    - signal: "Bulk annotation across 200+ files corrupts unrelated code paths or merges conflict"
      atom_ref: "skill:workflow/bucket-parallel-java-annotation-dispatch"
      remediation: "Disjoint file buckets per subagent; leader merges sequentially and runs unit tests after each merge"
    - signal: "Re-running optimization regenerates the spec, losing diffable history"
      atom_ref: "skill:workflow/swagger-spec-baseline-from-git"
      remediation: "Restore swagger-before.json baseline from git; re-diff to show only intentional changes"
  assembly_order:
    - phase: baseline
      uses: re-run-restore
    - phase: bulk-annotate
      uses: bulk-scaling
      branches:
        - condition: "annotation work complete"
          next: externalize
        - condition: "any subagent failed"
          next: review
    - phase: externalize
      uses: long-text-externalization
    - phase: runtime-enrich
      uses: runtime-injection
    - phase: optimize
      uses: canonical-pipeline
      branches:
        - condition: "AI filled gaps"
          next: review
        - condition: "no gaps"
          next: done
    - phase: review
      uses: gap-guard

binding: loose

verify:
  - "every composes[].ref is installed in the hub"
  - "every composes[].version range intersects the installed version"
  - "the baseline restore step runs before any annotation work begins"
  - "the gap-guard review checklist is produced as a side artifact, not buried in commit messages"
---

# Swagger Spec → AI-Agent Hardening

> A multi-phase pipeline that turns a Spring Boot springdoc OpenAPI spec into an AI-agent-friendly artifact. Restores the prior spec from git as a diff baseline, dispatches bulk annotation work to disjoint subagent buckets, externalizes long-form text out of Java annotations into YAML sidecars, runtime-injects per-property patterns/examples without source changes, runs the canonical optimization pipeline, and gates AI-filled gaps through an explicit review checklist.

<!-- references-section:begin -->
## Composes

**skill — `workflow/swagger-ai-optimization`**  _(version: `*`)_
canonical-pipeline

**skill — `workflow/bucket-parallel-java-annotation-dispatch`**  _(version: `*`)_
bulk-scaling

**skill — `workflow/openapi-customizer-property-name-enricher`**  _(version: `*`)_
runtime-injection

**skill — `backend/springdoc-yaml-externalization`**  _(version: `*`)_
long-text-externalization

**skill — `workflow/swagger-spec-baseline-from-git`**  _(version: `*`)_
re-run-restore

**knowledge — `pitfall/ai-guess-mark-and-review-checklist`**  _(version: `*`)_
gap-guard

<!-- references-section:end -->

## When to use

- Spring Boot + springdoc project producing a swagger.json that downstream AI agents (LLM tool callers, MCP servers, codegen pipelines) will consume
- Spec has 100+ `@Operation` methods or 500+ `@Schema` fields — manual annotation is impractical
- AI agents expect rich metadata: stable `operationId`, populated `@Schema(description, example)`, `@ApiResponse` with realistic codes, `x-filterable-fields` extension
- The optimization will be re-run on each release, producing a diff against the prior baseline

## When NOT to use

- Hand-curated small spec (≤30 endpoints) — bulk-dispatch overhead is unjustified
- Non-Spring framework (FastAPI, Express, etc.) — the springdoc-specific atoms don't apply; pick a different pipeline
- Static spec maintained outside the code (hand-edited YAML) — the runtime-customizer pattern is wasted
- Spec consumed only by humans — the optimization layers add no value over what springdoc emits by default

## Phase sequence

```
[0] Baseline       → restore swagger-before.json from prior commit
[1] Bulk-annotate  → N parallel executors on disjoint file buckets
[2] Externalize    → move long descriptions into resources/api-docs/*.yaml
[3] Runtime-enrich → OpenApiCustomizer injects patterns/examples by name
[4] Optimize       → canonical pipeline (operationId, x-filterable, sidecars)
[5] Review         → gap-guard checklist surfaces AI-filled gaps
```

### [0] Baseline

Before any annotation runs, restore the prior swagger spec artifact from git: `git show <prior-sha>:<path>/swagger-before.json > /tmp/swagger-before.json`. This becomes the diff anchor. Without it, every re-run looks like a full rewrite and the review burden is unbounded.

### [1] Bulk-annotate

For 200+ files, single-process annotation is slow and error-prone. Dispatch N executors with disjoint file buckets per `bucket-parallel-java-annotation-dispatch`. Leader merges sequentially after each subagent finishes and runs unit tests at every merge boundary — failures are caught at the earliest reproducible commit.

### [2] Externalize

Long `@Operation(description=...)` and `@RequestBody(examples=...)` strings clutter Java sources and resist review. `springdoc-yaml-externalization` moves them to `resources/api-docs/<controller>.yaml`, injected at runtime via a single `OperationCustomizer`. The Java code reverts to short references; long-form text lives where copywriters can edit it without recompiling.

### [3] Runtime-enrich

Many DTO fields share name patterns (`resourceId`, `agentId`, etc.) that should carry the same `pattern` + `example` + `x-discovery-*` extensions. Modifying every DTO is wasteful. `openapi-customizer-property-name-enricher` walks `components.schemas` at runtime and post-injects extensions matching configured patterns. The DTO source stays untouched.

### [4] Optimize

The canonical `swagger-ai-optimization` pipeline runs last, after the source-tree changes have settled. It produces operationId stability, `@Schema` enrichment, `@ApiResponse` coverage, `x-filterable-fields` extraction, canonical enum/identifier DTOs, typed response wrapper, and 5 sidecar files. The output is the diffable artifact compared against [0]'s baseline.

### [5] Review

Where AI fills gaps that the source spec left underspecified, the gap-guard checklist forces the human review loop. Every AI-generated value is inline-marked (e.g., `# ai-guess: 2026-04-26`), and a sidecar `review-checklist.md` accumulates review-required items. The checklist must be empty before the spec ships.

## Glue summary

| Added element | Where |
|---|---|
| Baseline restore from prior commit | Phase 0, before any work |
| Disjoint file buckets + sequential merge with unit-test gate | Phase 1 dispatch policy |
| Long-text externalization to per-controller YAML | Phase 2, removed from Java |
| Pattern-matched runtime extension injection | Phase 3, no source changes |
| AI-filled gap inline marking + review checklist | Phase 5 gate |

## Failure modes (mapped to atoms)

| Failure signal | Caused by | Remediation |
|---|---|---|
| AI hallucinates schema values | `pitfall/ai-guess-mark-and-review-checklist` (when not applied) | Inline marker + review checklist must be empty pre-publish |
| Bulk annotation corrupts unrelated paths | `skill/bucket-parallel-java-annotation-dispatch` (mis-bucketed) | Disjoint file buckets; leader runs unit tests at each merge |
| Re-run loses diff history | `skill/swagger-spec-baseline-from-git` (skipped) | Restore baseline before annotation; diff against it |

## When the technique is succeeding (success signals)

- After a re-run, the diff against the prior baseline is small and readable — only the intentional changes appear
- Bulk-annotation merges land sequentially with all unit tests green
- The `review-checklist.md` is empty by the time the spec is published; AI-filled gaps were either accepted or replaced
- Long descriptions live in `resources/api-docs/*.yaml`, not in Java annotation strings
- DTO source has no per-field `pattern` / `example` strings; those come from the runtime customizer

## Known limitations

- Phase 3's pattern matcher relies on field-name conventions (`resourceId`, etc.). A codebase with inconsistent naming gets uneven coverage; consider a name-normalization pass first.
- Phase 1's bucket size determines parallelism. Too small and overhead dominates; too large and a single subagent's timeout stalls the batch. Start at 50 files/bucket.
- Phase 5's gap-guard relies on humans actually reading the checklist. If the team treats it as a rubber stamp, the silent-failure risk returns.
- The technique assumes springdoc as the spec generator. Other spec generators (Swagger Codegen direct, manual YAML) require different runtime-injection paths.

## Why exists

Each composed atom solves one specific problem: bulk dispatch, long-text relocation, runtime injection, baseline restoration, AI-gap gating, canonical pipeline. None of them mention the others. A team faced with "make our 800-endpoint Spring Boot spec usable for an LLM tool caller" would otherwise wire these six together every time, in slightly different orders, with subtly different failure-mode handling. This technique is the canonical wiring — six atoms, fixed phase sequence, explicit gate between AI-fill and publish.
