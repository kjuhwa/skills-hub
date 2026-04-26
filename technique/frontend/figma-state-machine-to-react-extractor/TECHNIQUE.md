---
version: 0.2.0-draft
name: figma-state-machine-to-react-extractor
description: "Extract Figma variant transitions as a finite state machine; emit React state code (XState or useReducer) preserving all transitions."
category: frontend
tags:
  - figma
  - react
  - state-machine
  - xstate
  - extraction

composes:
  - kind: skill
    ref: frontend/figma-code-connect-react
    version: "*"
    role: figma-binding
  - kind: skill
    ref: design/propagate-design-change
    version: "*"
    role: change-propagation
  - kind: knowledge
    ref: pitfall/ai-guess-mark-and-review-checklist
    version: "*"
    role: ai-transition-guard

recipe:
  one_line: "Read Figma component variants + interactive prototype links; extract states and transitions as a state-machine; emit React code (XState or useReducer) with all transitions preserved."
  preconditions:
    - "Figma component uses variant properties for states (not separate frames)"
    - "Figma prototype links connect variants (not just static designs)"
    - "Target React state library decided (XState recommended for ≥5 states)"
  anti_conditions:
    - "Component has 1-2 trivial states — useState suffices, FSM overhead unjustified"
    - "Stateless presentation component — extraction has no signal"
    - "Designer hasn't modeled transitions in Figma prototype mode"
  failure_modes:
    - signal: "Extracted state machine missing transitions designer assumed implicit"
      atom_ref: "skill:frontend/figma-code-connect-react"
      remediation: "Round-trip: render extracted FSM diagram for designer; iterate until parity"
    - signal: "AI invents transitions or states not in Figma prototype"
      atom_ref: "knowledge:pitfall/ai-guess-mark-and-review-checklist"
      remediation: "Validate every emitted transition has Figma prototype-link source; flag synthesized ones"
    - signal: "Designer changes Figma prototype but emitted React code stale"
      atom_ref: "skill:design/propagate-design-change"
      remediation: "FSM extraction runs on Figma webhook; diff against checked-in code; PR opened on mismatch"
  assembly_order:
    - phase: fetch-figma-prototype
      uses: figma-binding
    - phase: extract-states-and-transitions
      uses: change-propagation
    - phase: ai-guard
      uses: ai-transition-guard
    - phase: emit-react-state-code
      uses: change-propagation

binding: loose

verify:
  - "every composes[].ref resolves on disk"
  - "the technique requires Figma prototype-link source for every transition"
---

# Figma State-Machine to React Extractor

> Read Figma variants + prototype links → extract finite state machine → emit React state code (XState/useReducer). Designer's interaction model becomes runtime behavior with no manual transcription.

## When to use
- Figma component uses variant properties for states
- Prototype links connect variants
- Target state library decided (XState for ≥5 states)

## When NOT to use
- Trivial 1-2 state component (useState suffices)
- Stateless presentation
- No prototype mode in Figma

## Glue summary
| Added element | Where |
|---|---|
| Round-trip FSM diagram for designer review | Pre-emit |
| AI-invented-transition guard | AI guard |
| Webhook-triggered re-extraction on Figma change | Propagation |

## Provenance
- Authored 2026-04-26 in batch with 9 sibling Figma+Claude+React+CSS techniques
