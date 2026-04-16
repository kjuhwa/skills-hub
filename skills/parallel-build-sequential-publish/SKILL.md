---
name: parallel-build-sequential-publish
description: Build multiple independent projects in parallel via executor agents, then publish to a shared git repo sequentially
category: workflow
triggers:
  - build multiple projects
  - parallel agent build
  - batch publish examples
  - hub-make all
tags:
  - parallel
  - agents
  - git
  - publishing
  - workflow
version: 1.0.0
---

# Parallel Build → Sequential Publish

Pattern for building N independent projects simultaneously using executor agents, then publishing them to a shared git repository one at a time.

## When to Use

- `/hub-make` with "all" or multiple selections
- Any batch creation where projects are independent but share a publish target

## Build Phase (Parallel)

Spawn one executor agent per project. Each agent:
- Creates files in its own directory (`project-N/`)
- Has no git operations — pure file creation
- Returns a completion summary

```
Agent(subagent_type="executor", name="build-A", run_in_background=true, prompt="Build X in dir-A/...")
Agent(subagent_type="executor", name="build-B", run_in_background=true, prompt="Build Y in dir-B/...")
Agent(subagent_type="executor", name="build-C", run_in_background=true, prompt="Build Z in dir-C/...")
```

## Verify Phase (Parallel)

After all agents complete, validate each project:

```bash
node --check dir-A/app.js && echo "A OK"
node --check dir-B/app.js && echo "B OK"
# ... parallel bash calls
```

## Publish Phase (Sequential)

Git operations on the same repo clone MUST be sequential:

```
For each project:
  1. git checkout main && git reset --hard origin/main
  2. git checkout -b example/<slug>
  3. Copy files + write manifest + README
  4. Update catalog (example/README.md)
  5. git add + commit + push
  6. gh pr create
```

## Critical Constraints

1. **Agents cannot do git publish** — executor agents may lack Bash permissions; keep git operations in the main context
2. **One branch at a time** — `git checkout` switches the entire working tree; parallel branch creation on the same clone causes conflicts
3. **Reset to origin/main between publishes** — each branch must fork from the latest main, not from a sibling branch
4. **Catalog updates per-branch** — each PR independently adds its catalog row; merge order doesn't matter since rows append

## Anti-Pattern

Do NOT try to parallelize git publishing by:
- Using multiple agent instances against the same repo clone
- Creating all branches before committing (uncommitted changes conflict)
- Batching all examples into a single branch/PR (defeats independent review)
