---
version: 0.2.0-draft
name: figma-token-tailwind-pipeline-with-drift-guard
description: "Figma design token → Tailwind v4 theme pipeline with explicit drift-detection between token source and runtime CSS."
category: frontend
tags:
  - figma
  - tailwind
  - design-tokens
  - drift-detection
  - pipeline

composes:
  - kind: skill
    ref: design/figma-token-to-tailwind-theme
    version: "*"
    role: token-to-theme-conversion
  - kind: knowledge
    ref: decision/semantic-design-tokens-only
    version: "*"
    role: token-purity-rule
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-generated-token-guard

recipe:
  one_line: "Pull Figma tokens, convert to Tailwind v4 theme, generate CSS, then diff CSS-in-source vs CSS-from-tokens to catch drift before merge."
  preconditions:
    - "Figma file exposes design tokens via REST/Tokens Studio plugin"
    - "Tailwind v4 (CSS-first config) is the target — earlier versions need additional adapter"
    - "CI can run a CSS comparison step before merge"
  anti_conditions:
    - "Static design system with no Figma source — pipeline overhead unjustified"
    - "Tailwind v3 or earlier — CSS-first theme block is v4-only"
    - "Tokens edited directly in source code, not Figma — drift direction inverted"
  failure_modes:
    - signal: "Designer edits Figma but pipeline runs on stale fetch — CSS diverges silently"
      atom_ref: "skill:design/figma-token-to-tailwind-theme"
      remediation: "Token fetch must run on every PR, not on schedule. Cache invalidates per branch."
    - signal: "Engineer adds raw color hex in CSS bypassing token system"
      atom_ref: "knowledge:decision/semantic-design-tokens-only"
      remediation: "Lint rule forbids non-token color/spacing values in any .css/.tsx file"
    - signal: "AI-generated CSS includes plausible but invented token names"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Validate every token reference against the canonical token map; mark unmatched as TODO"
  assembly_order:
    - phase: fetch-tokens
      uses: token-to-theme-conversion
    - phase: generate-theme
      uses: token-to-theme-conversion
    - phase: drift-check
      uses: token-purity-rule
      branches:
        - condition: "drift detected"
          next: ai-guess-review
        - condition: "no drift"
          next: merge
    - phase: ai-guess-review
      uses: ai-generated-token-guard
    - phase: merge
      uses: token-purity-rule

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique includes a drift-check phase, not just one-shot conversion"
---

# Figma Token → Tailwind Pipeline with Drift Guard

> Pulls Figma tokens, converts to Tailwind v4 theme, then explicitly diffs the generated CSS against any CSS in source. Drift-detection is the differentiator — most pipelines stop at conversion and let drift accumulate silently.

## When to use
- Figma file is the canonical source of design tokens
- Tailwind v4 with CSS-first theme block
- CI can run a comparison step before merge

## When NOT to use
- Static design system with no Figma source
- Tailwind v3 or earlier (CSS-first theme is v4-only)
- Tokens edited in source code rather than Figma

## Glue summary

| Added element | Where |
|---|---|
| Drift-check between Figma-source tokens and CSS-in-source | CI step before merge |
| AI-guess guard for invented token names | When AI generates CSS |
| Token purity rule (no raw hex/spacing values) | Lint enforcement |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
