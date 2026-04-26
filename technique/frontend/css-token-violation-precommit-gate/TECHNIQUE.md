---
version: 0.2.0-draft
name: css-token-violation-precommit-gate
description: "Detect raw CSS values (hex, px, rem) outside the design token set; block commits at pre-commit hook with named violations."
category: frontend
tags:
  - css
  - design-tokens
  - precommit
  - lint
  - violation-gate

composes:
  - kind: knowledge
    ref: decision/semantic-design-tokens-only
    version: "*"
    role: token-purity-rule
  - kind: skill
    ref: design/figma-token-to-tailwind-theme
    version: "*"
    role: canonical-token-source
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-violation-flag

recipe:
  one_line: "Pre-commit hook scans staged .css/.tsx/.scss for raw color/spacing/font values not in the canonical token set; lists violations by file:line and blocks commit until resolved or explicitly waived."
  preconditions:
    - "Project has a canonical token map (Figma-derived or hand-curated)"
    - "Build supports pre-commit hooks (husky, lefthook, etc.)"
    - "Team agrees on token-purity as enforceable rule, not advisory"
  anti_conditions:
    - "Prototype phase — token set still evolving, false-positive rate too high"
    - "Cross-team boundary where one team uses tokens and another doesn't"
    - "Generated CSS files (e.g. from Tailwind) — would re-flag every build"
  failure_modes:
    - signal: "False positives on intentional ad-hoc values (e.g. transform percentages)"
      atom_ref: "knowledge:decision/semantic-design-tokens-only"
      remediation: "Allowlist non-color non-spacing properties; tokenize only color/spacing/font/radius/shadow"
    - signal: "Token map outdated; valid tokens flagged as violations"
      atom_ref: "skill:design/figma-token-to-tailwind-theme"
      remediation: "Token map auto-pulls from canonical source on hook trigger; staleness check before scan"
    - signal: "AI-generated CSS includes plausible token names that don't exist"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Hook validates token-name existence; unknown tokens flagged separately from raw-value violations"
  assembly_order:
    - phase: load-token-map
      uses: canonical-token-source
    - phase: scan-staged-files
      uses: token-purity-rule
    - phase: classify-violations
      uses: ai-violation-flag
      branches:
        - condition: "violations found"
          next: block-commit
        - condition: "clean"
          next: allow-commit

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique blocks at pre-commit, not at post-merge audit"
---

# CSS Token-Violation Pre-Commit Gate

> Pre-commit hook scans staged CSS/JSX for raw values not in the design token set. Violations listed file:line, commit blocked until fixed or explicitly waived. Catches drift at the moment of authoring, not at PR review.

## When to use
- Project has a canonical token map
- Build supports pre-commit hooks
- Team treats token purity as enforceable

## When NOT to use
- Prototype phase with evolving token set
- Cross-team boundary with mixed enforcement
- Generated CSS files (would re-flag every build)

## Glue summary
| Added element | Where |
|---|---|
| Pre-commit blocking (not advisory PR comment) | Local hook |
| Token-name existence check (catches AI-invented tokens) | Hook step |
| Auto-refresh of token map before scan | Hook step |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
