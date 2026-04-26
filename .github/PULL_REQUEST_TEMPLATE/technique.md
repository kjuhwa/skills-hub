<!--
PR template for technique authoring. Sibling to paper.md (#1221).
Trigger via `?template=technique.md` in the GitHub PR creation URL.

Verdict rules baked in:
- #1188 (technique-shape-claim-distribution-survey): technique layer is shape-diverse;
  cost-displacement is rare in techniques (8%). The PR should make shape claim explicit.
- #1205 (cluster-formation-dynamics-from-bias-correction): batch-publishing of N techniques
  in same domain forms a sub-cluster within the technique layer.
- v0.2 §13 recipe block requirement (composes + recipe.one_line + preconditions + anti_conditions
  + failure_modes + assembly_order)
-->

## Summary

<!-- 2-3 sentences describing what this technique composes and why it exists. -->

## Composition

**composes[]** — pick atoms from the hub. Per v0.2 §13, technique must compose ≥2 atoms (skill or knowledge). No technique-to-technique nesting.

| Atom | Role |
|---|---|
| <!-- e.g. skill: workflow/safe-bulk-pr-publishing --> | <!-- e.g. orchestrator --> |
| | |

- [ ] All `composes[].ref` resolve on disk
- [ ] No technique-to-technique nesting (`kind: technique` not used in composes[])
- [ ] At least 2 atoms composed
- [ ] Each atom has `role` (≤30 chars)

## Shape claim (per paper #1188)

Per paper #1188's census, **the technique layer is shape-diverse** (cost-displacement is only 8% of techniques vs 36% of papers). The technique's primary shape claim should be explicit so future papers can cite it accurately.

**Primary shape claim** — pick one. **Don't default to cost-displacement** if the technique's actual shape is something else.

- [ ] cost-displacement crossover (justified — see "Why cost-displacement" below)
- [ ] threshold-cliff
- [ ] log-search
- [ ] hysteresis
- [ ] convergence
- [ ] necessity
- [ ] Pareto distribution
- [ ] saturation-without-crossover
- [ ] invariant-only (no shape claim — pattern only)
- [ ] structural-only (no shape claim — composition recipe only)
- [ ] other (specify): ___

### Why this shape

<!--
For shape claims (everything except invariant-only / structural-only):
explain in 1-2 sentences what the technique's claim is.
For cost-displacement: justify why crossover is the actual shape, not retrofit.
-->

## Recipe block (v0.2 §13 required)

The technique frontmatter must include a `recipe:` block with these fields:

- [ ] `recipe.one_line` (concise summary of what the technique does)
- [ ] `recipe.preconditions` (≥3 listed; when this technique applies)
- [ ] `recipe.anti_conditions` (≥3 listed; when this technique does NOT apply)
- [ ] `recipe.failure_modes` (≥3 listed; each linked to atom_ref + remediation)
- [ ] `recipe.assembly_order` (phases with branches where appropriate)

## Domain context

<!--
- Domain: <!-- e.g., backend / frontend / ai / debug -->
- Existing techniques in this domain: <!-- count from `/hub-technique-list --category <domain>` -->
- Related papers: <!-- e.g., paper that interrogates this technique's shape -->
-->

## Audits

- [ ] v0.2 technique audit (`_audit_technique_v02.py`) — passes R1-R3
- [ ] Strict-YAML audit (`_audit_paper_yaml_strict.py`) — no mid-string `: ` offenders
- [ ] All `composes[].ref` verified present on disk

## Test plan

- [ ] Reviewer confirms shape claim matches the technique's actual mechanism (not retrofit)
- [ ] Reviewer confirms `composes[]` atoms are ALL load-bearing (none are decorative)
- [ ] Reviewer spot-checks 1-2 failure_modes for atom_ref correctness

## Cross-references

- Existing siblings in domain: <!-- list adjacent techniques -->
- Paper opportunities surfaced by this technique: <!-- e.g., shape claim → testable hypothesis -->

## Follow-ups (not blocking)

<!--
- Sibling technique opportunities (gap fill in domain)
- Paper proposals interrogating this technique's shape
- Atoms that should be extracted from the technique body if reused
-->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
