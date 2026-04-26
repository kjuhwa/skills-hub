---
version: 0.2.0-draft
name: dark-mode-token-mirror-via-claude
description: "Mirror light-mode design tokens to dark-mode via Claude — preserving semantic meaning, contrast ratios, and brand identity."
category: frontend
tags:
  - figma
  - dark-mode
  - design-tokens
  - claude
  - contrast

composes:
  - kind: skill
    ref: design/figma-token-to-tailwind-theme
    version: "*"
    role: token-source
  - kind: knowledge
    ref: decision/semantic-design-tokens-only
    version: "*"
    role: semantic-preservation-rule
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-token-guard

recipe:
  one_line: "Feed light-mode token map + brand constraints to Claude; emit dark-mode mirror preserving semantic name, contrast ratio (≥WCAG AA), and brand color identity. Designer reviews before merge."
  preconditions:
    - "Light-mode token set is the canonical source"
    - "Brand color constraints (primary hue, accent palette) defined as inputs to Claude"
    - "Designer available for review (Claude output is draft, not final)"
  anti_conditions:
    - "Dark mode is the primary mode — light is the mirror, invert direction"
    - "Custom contrast requirements (e.g. AAA, low-vision spec) — Claude defaults to AA"
    - "Brand identity changes between modes (rare, but explicitly out of scope)"
  failure_modes:
    - signal: "Mirrored tokens fail contrast checks; AA threshold violated"
      atom_ref: "skill:design/figma-token-to-tailwind-theme"
      remediation: "Run contrast lint after Claude emit; reject tokens below AA; iterate with constraint reminder"
    - signal: "Semantic name drift (e.g. 'surface-elevated' becomes 'surface-raised' in dark)"
      atom_ref: "knowledge:decision/semantic-design-tokens-only"
      remediation: "Lock semantic names; Claude only emits color values, never name changes"
    - signal: "AI invents brand-incompatible colors (e.g. shifts hue beyond brand palette)"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Constrain Claude to brand palette as hard constraint; flag any out-of-palette hue for designer review"
  assembly_order:
    - phase: load-light-tokens
      uses: token-source
    - phase: claude-emit-dark-mirror
      uses: semantic-preservation-rule
    - phase: contrast-lint
      uses: token-source
      branches:
        - condition: "AA passes"
          next: ai-guard
        - condition: "AA fails"
          next: re-iterate
    - phase: ai-guard
      uses: ai-token-guard
    - phase: designer-review
      uses: semantic-preservation-rule

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique enforces AA contrast as gate, not advisory"
---

# Dark-Mode Token Mirror via Claude

> Feed light-mode tokens + brand constraints to Claude → emit dark-mode mirror with semantic names locked, contrast ≥ AA, brand palette respected. Designer reviews; Claude output is draft.

## When to use
- Light-mode is canonical source
- Brand constraints defined
- Designer available for review

## When NOT to use
- Dark is primary (invert direction)
- Custom contrast requirements (AAA, low-vision)
- Brand identity changes between modes

## Glue summary
| Added element | Where |
|---|---|
| Semantic name lock (Claude emits values only, never names) | Pre-emit |
| AA contrast lint as gate | Post-emit |
| Brand palette as hard constraint | Pre-emit |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
