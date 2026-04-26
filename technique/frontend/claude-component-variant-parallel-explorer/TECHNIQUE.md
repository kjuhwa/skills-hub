---
version: 0.2.0-draft
name: claude-component-variant-parallel-explorer
description: "Claude generates N radically different React component variants in parallel; designer reviews + picks one. Bias-correction by parallel exploration."
category: frontend
tags:
  - claude
  - react
  - variant-exploration
  - parallel
  - design-review

composes:
  - kind: skill
    ref: design/design-shotgun
    version: "*"
    role: parallel-variant-generation
  - kind: skill
    ref: frontend/figma-code-connect-react
    version: "*"
    role: figma-binding
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-output-guard

recipe:
  one_line: "Spawn N Claude subagents in parallel, each producing a radically different React variant from the same Figma reference. Designer reviews all variants, picks one, others archived for future reference."
  preconditions:
    - "Component is exploratory — no settled visual contract yet"
    - "Designer has time for parallel review (not single-iteration approval)"
    - "N=3-5 variants is the sweet spot — too many drowns review, too few constrains exploration"
  anti_conditions:
    - "Component is well-specified, only one valid implementation — parallel exploration is wasted budget"
    - "No designer in the loop — variants accumulate without selection"
    - "Single-Claude-instance environment — parallel dispatch is impossible"
  failure_modes:
    - signal: "All N variants converge on same approach — Claude's prior dominates randomness"
      atom_ref: "skill:design/design-shotgun"
      remediation: "Vary the system prompt per variant (minimal/maximal/animation-first/data-density-first); prevent prompt collision"
    - signal: "Variants drift from Figma reference; binding to design tokens is inconsistent"
      atom_ref: "skill:frontend/figma-code-connect-react"
      remediation: "Each variant must pass figma-code-connect mapping; non-matching variants rejected pre-review"
    - signal: "AI-invented props or component names not in design system"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Mark every AI-generated prop/name; designer reviews before accept"
  assembly_order:
    - phase: spawn-variants
      uses: parallel-variant-generation
    - phase: bind-figma
      uses: figma-binding
    - phase: ai-guard
      uses: ai-output-guard
    - phase: designer-review
      uses: parallel-variant-generation
      branches:
        - condition: "one variant accepted"
          next: archive-others
        - condition: "all rejected"
          next: respawn-or-handcraft

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique requires N≥3 parallel variants, not single-shot generation"
---

# Claude Component-Variant Parallel Explorer

> Spawn N Claude subagents in parallel — each generates a radically different React variant of the same component. Designer reviews all, picks one. Trade single-iteration cost for design-space coverage.

## When to use
- Component is exploratory; no settled visual contract
- Designer has time for parallel review
- 3–5 variants give the right exploration/review balance

## When NOT to use
- Well-specified component with one valid implementation
- No designer in the loop
- Single-Claude-instance environment (no parallel dispatch)

## Glue summary
| Added element | Where |
|---|---|
| Per-variant system prompt diversity (minimal/maximal/animation-first) | Spawn time |
| Figma-binding gate before designer review | Pre-review |
| AI-prop guard | Pre-review |
| Archive non-selected variants for future reference | Post-review |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
