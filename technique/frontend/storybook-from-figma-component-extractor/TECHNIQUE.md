---
version: 0.2.0-draft
name: storybook-from-figma-component-extractor
description: "Extract Figma component variants and states into Storybook stories automatically — one story file per component with all variant axes mapped."
category: frontend
tags:
  - figma
  - storybook
  - component-variants
  - extraction
  - automation

composes:
  - kind: skill
    ref: frontend/figma-code-connect-react
    version: "*"
    role: figma-binding
  - kind: skill
    ref: design/design-system
    version: "*"
    role: variant-axis-modeling
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-extracted-prop-guard

recipe:
  one_line: "For each Figma component, extract variant axes (e.g. size×state×theme) and emit one Storybook .stories.tsx with all combinations as named stories. AI-extracted props marked for designer review."
  preconditions:
    - "Figma components use variant properties (not detached instances)"
    - "Storybook 7+ project with CSF3"
    - "React component already exists with prop interface (or generated from same Figma source)"
  anti_conditions:
    - "Components without variants — single story is hand-writable in seconds"
    - "Variants exceed combinatorial explosion (>50 combinations) — needs combinatorial story strategy, not full enumeration"
    - "Storybook not in the stack"
  failure_modes:
    - signal: "Figma variant axis name doesn't match React prop name; story bind fails silently"
      atom_ref: "skill:frontend/figma-code-connect-react"
      remediation: "Bind explicit Figma node ID + variant property name to React prop; reject mismatches at extract time"
    - signal: "AI invents a variant axis not present in Figma source"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Validate every emitted variant prop against Figma variant property list; flag invented ones"
    - signal: "Combinatorial explosion: 5×4×3 = 60 stories, designer review impossible"
      atom_ref: "skill:design/design-system"
      remediation: "Emit only orthogonal-axis stories + critical-combination stories; full matrix only on demand"
  assembly_order:
    - phase: fetch-figma-component
      uses: figma-binding
    - phase: extract-variant-axes
      uses: variant-axis-modeling
    - phase: ai-guard
      uses: ai-extracted-prop-guard
    - phase: emit-stories
      uses: variant-axis-modeling

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique handles combinatorial-explosion case explicitly"
---

# Storybook from Figma Component Extractor

> Extract Figma variant axes (size × state × theme) and emit one Storybook .stories.tsx per component with all valid combinations as named stories. Combinatorial explosion handled by orthogonal-axis defaulting.

## When to use
- Figma uses variant properties (not detached instances)
- Storybook 7+ with CSF3
- React component exists with prop interface

## When NOT to use
- Component has no variants
- Variant matrix exceeds practical review (>50 combos)
- Storybook not in stack

## Glue summary
| Added element | Where |
|---|---|
| Variant-axis name binding (Figma → React prop) | Extract |
| AI-invented variant guard | AI guard |
| Orthogonal-axis defaulting on combinatorial explosion | Emit |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
