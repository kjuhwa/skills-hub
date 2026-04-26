---
version: 0.2.0-draft
name: figma-react-pixel-diff-iteration-loop
description: "Render Claude-generated React in headless browser, diff against Figma export, feed delta back as next-round prompt. Convergence by N=3-5."
category: frontend
tags:
  - figma
  - react
  - pixel-diff
  - feedback-loop
  - convergence

composes:
  - kind: skill
    ref: frontend/figma-code-connect-react
    version: "*"
    role: figma-binding
  - kind: skill
    ref: design/design-review
    version: "*"
    role: visual-review-loop
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-output-guard

recipe:
  one_line: "Round-by-round loop where each round renders Claude's React in headless browser, computes pixel + token-violation diff vs Figma export, and feeds annotated delta to Claude as the next round's prompt. Cap at N=5."
  preconditions:
    - "Figma export available as PNG at known viewport"
    - "Headless browser pipeline (Playwright/Puppeteer) ready"
    - "Pixel diff tool tolerant to anti-aliasing noise (or token-violation as primary metric)"
  anti_conditions:
    - "Figma reference is ambiguous — convergence to wrong fixed point"
    - "Component requires runtime data binding — diff against static export misleading"
    - "No iteration budget — single-shot is the constraint"
  failure_modes:
    - signal: "Claude chases anti-aliasing noise past N=5; pixel diff stops decreasing"
      atom_ref: "skill:design/design-review"
      remediation: "Cap iteration at N=5; switch to token-violation only past N=3"
    - signal: "Figma export from wrong frame; diff baseline incorrect"
      atom_ref: "skill:frontend/figma-code-connect-react"
      remediation: "Bind Figma node ID at fetch time, not by name; verify export hash"
    - signal: "AI invents component or prop in iteration N+1 not present in N"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Diff component tree, not just visual; reject iterations with prop-set divergence"
  assembly_order:
    - phase: render-current
      uses: figma-binding
    - phase: compute-diff
      uses: visual-review-loop
    - phase: ai-guard
      uses: ai-output-guard
      branches:
        - condition: "diff above threshold and N < cap"
          next: feedback-to-claude
        - condition: "diff converged or cap reached"
          next: accept
    - phase: feedback-to-claude
      uses: visual-review-loop

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique caps iteration at finite N (≤5 typical)"
---

# Figma → React Pixel-Diff Iteration Loop

> Headless render of Claude's React → pixel diff vs Figma export → diff annotation back to Claude → next round. Convergence shape per `paper/frontend/figma-claude-react-iteration-convergence` (#1201). Cap at N=5 to avoid noise-chasing.

## When to use
- Figma export available as PNG at known viewport
- Headless browser pipeline ready
- Diff tool tolerant to anti-aliasing

## When NOT to use
- Figma reference ambiguous (wrong fixed point)
- Component requires runtime data
- No iteration budget

## Glue summary
| Added element | Where |
|---|---|
| Iteration cap at N=5 (per convergence paper #1201) | Loop control |
| Switch to token-violation past N=3 | Mid-loop |
| Component-tree diff to reject prop-set divergence | AI guard |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
- Paired with paper #1201 (figma-claude-react-iteration-convergence) which tests the convergence claim
