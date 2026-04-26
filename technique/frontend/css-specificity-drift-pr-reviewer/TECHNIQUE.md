---
version: 0.2.0-draft
name: css-specificity-drift-pr-reviewer
description: "Claude reviews CSS in PRs for specificity drift, !important usage, and selector-depth growth — surfaces violations as PR comments before merge."
category: frontend
tags:
  - css
  - specificity
  - pr-review
  - claude
  - drift-detection

composes:
  - kind: skill
    ref: design/design-review
    version: "*"
    role: visual-style-review
  - kind: knowledge
    ref: decision/semantic-design-tokens-only
    version: "*"
    role: token-discipline
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-review-guard

recipe:
  one_line: "On PR open, Claude scans diff for CSS specificity score increases, !important additions, and selector depth >3. Posts inline PR comments with severity. AI-generated reviews are themselves marked for human re-check."
  preconditions:
    - "Project has a baseline specificity profile (median, p95)"
    - "PR system supports inline review comments via API (GitHub/GitLab)"
    - "Team agrees on specificity ceiling (e.g. max selector depth, !important budget)"
  anti_conditions:
    - "Greenfield project — no baseline to drift from"
    - "Generated CSS-in-JS only (Tailwind, styled-components) where specificity is library-controlled"
    - "Project tolerates specificity wars by design (legacy migration phase)"
  failure_modes:
    - signal: "Baseline drifts upward over time; ceiling becomes meaningless"
      atom_ref: "skill:design/design-review"
      remediation: "Re-baseline quarterly with explicit changelog; ceiling adjusted by team vote, not silently"
    - signal: "False positives on legitimate cascades (e.g. theme overrides)"
      atom_ref: "knowledge:decision/semantic-design-tokens-only"
      remediation: "Allowlist token-system internal cascades; flag only application-layer drift"
    - signal: "AI review hallucinates violations that don't exist in diff"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Every flagged line linked to specific selector + diff line; reviewer confirms before action"
  assembly_order:
    - phase: extract-css-diff
      uses: visual-style-review
    - phase: compute-specificity-deltas
      uses: token-discipline
    - phase: ai-review
      uses: ai-review-guard
    - phase: post-pr-comments
      uses: visual-style-review

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique requires baseline + ceiling, not just absolute thresholds"
---

# CSS Specificity-Drift PR Reviewer

> Claude scans CSS in PR diff for specificity drift, !important growth, selector-depth creep. Posts inline review comments. AI-generated reviews themselves marked for human re-check.

## When to use
- Project has baseline specificity profile
- PR system supports inline review API
- Team agrees on specificity ceiling

## When NOT to use
- Greenfield (no baseline)
- CSS-in-JS only (library-controlled specificity)
- Legacy migration tolerating specificity wars

## Glue summary
| Added element | Where |
|---|---|
| Baseline + ceiling rule (not absolute thresholds) | Pre-scan |
| Allowlist for token-system internal cascades | Filter |
| AI-review hallucination guard | Pre-comment |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
