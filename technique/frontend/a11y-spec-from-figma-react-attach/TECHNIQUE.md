---
version: 0.2.0-draft
name: a11y-spec-from-figma-react-attach
description: "Extract Figma a11y annotations (role, label, focus order) and attach to React component as ARIA attributes; designer-spec → runtime parity."
category: frontend
tags:
  - figma
  - react
  - a11y
  - aria
  - accessibility

composes:
  - kind: skill
    ref: frontend/figma-code-connect-react
    version: "*"
    role: figma-binding
  - kind: skill
    ref: design/design-review
    version: "*"
    role: a11y-review-loop
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-aria-guard

recipe:
  one_line: "Read Figma component a11y annotations (Stark/A11y plugin); emit React component with ARIA attributes (role, aria-label, tabindex, focus order); a11y testing tool validates output."
  preconditions:
    - "Figma a11y annotations exist (Stark plugin or equivalent)"
    - "React component template exists (or generated from same Figma source)"
    - "a11y testing tool in CI (axe-core, lighthouse-ci)"
  anti_conditions:
    - "Figma file lacks a11y annotations — extraction has no signal"
    - "Component is presentational only (decorative div with no semantic role)"
    - "a11y already hand-curated and audited — auto-attach risks regression"
  failure_modes:
    - signal: "Figma a11y annotation references non-existent React element (e.g. button-role on missing slot)"
      atom_ref: "skill:frontend/figma-code-connect-react"
      remediation: "Validate slot-to-element mapping before attach; reject orphan annotations"
    - signal: "AI invents ARIA attributes not in Figma annotation (e.g. aria-describedby with no source)"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Each emitted ARIA attribute must trace to a Figma annotation source; flag invented ones"
    - signal: "axe-core finds violations not present in Figma annotation; designer assumed default"
      atom_ref: "skill:design/design-review"
      remediation: "Round-trip: surface axe violations to designer; iterate until Figma annotation + axe both pass"
  assembly_order:
    - phase: fetch-figma-a11y-annotations
      uses: figma-binding
    - phase: validate-slot-mapping
      uses: a11y-review-loop
    - phase: emit-aria-attributes
      uses: figma-binding
    - phase: ai-guard
      uses: ai-aria-guard
    - phase: axe-validate
      uses: a11y-review-loop

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique requires axe-core or equivalent validation step, not just emit"
---

# A11y-Spec from Figma → React Attach

> Extract Figma a11y annotations (Stark plugin) → emit React with ARIA attributes (role, label, tabindex, focus order) → axe-core validates. Designer's a11y intent becomes runtime behavior with auto-validation.

## When to use
- Figma has a11y annotations (Stark or equivalent)
- React component template exists
- a11y testing in CI (axe-core, lighthouse-ci)

## When NOT to use
- Figma lacks a11y annotations
- Decorative-only component (no semantic role)
- a11y already hand-curated

## Glue summary
| Added element | Where |
|---|---|
| Slot-to-element mapping validation before attach | Pre-emit |
| Trace-to-Figma rule (no invented ARIA attributes) | AI guard |
| axe-core validation as gate | Post-emit |
| Round-trip to designer on axe violations | Recovery |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
