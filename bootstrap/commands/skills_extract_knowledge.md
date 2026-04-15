---
description: Extract both executable skills and non-executable knowledge from a session, git diff, or commit range
argument-hint: [--from session|diff|commit <sha>|range <A>..<B>] [--auto-split] [--only skill|knowledge] [--dry-run] [--scope global|project] [--category <cat>] [--link <skill-slug>] [--min-confidence high|medium|low]
---

# /skills_extract_knowledge $ARGUMENTS

Analyze a source (session / git diff / commits) and split the material into two artifact classes:

- **Skills** — reusable, executable procedures → `~/.claude/skills/<slug>/SKILL.md`
- **Knowledge** — non-executable facts, decisions, pitfalls, domain context → `~/.claude/skills-hub/knowledge/<category>/<slug>.md`

This extends `/skills_extract` (which only emits skills) so durable engineering knowledge is no longer discarded.

## Preconditions

- `~/.claude/skills-hub/registry.json` must exist. If missing, create as `{ "version": 2, "skills": {}, "knowledge": {} }`.
- If registry exists with `version: 1` (or no version field), **migrate**:
  - Add `version: 2`
  - Add `knowledge: {}` if absent
  - Add `linked_knowledge: []` to every existing skill entry
  - Write back atomically (temp file + rename).
- Ensure `~/.claude/skills-hub/knowledge/{api,arch,pitfall,decision,domain}/` directories exist.

## Pipeline (7 stages)

### 1. Collect
Based on `--from`:
- `session` (default): use current conversation transcript.
- `diff`: `git diff HEAD` (uncommitted working changes). `source.ref` = `WORKTREE`.
- `commit <sha>`: `git show --stat <sha>` + `git log -1 --format=%B <sha>` + `git show <sha>`.
- `range <A>..<B>`: iterate `git log A..B --format=%H` and treat each commit as a chunk.

### 2. Chunk
- Commits → one chunk per commit.
- Session → heuristic topic split (header shifts, long gaps, distinct problem threads).
- Diff → one chunk per file-group with related hunks.

### 3. Classify
For each chunk, emit JSON:

```json
{
  "verdict": "skill" | "knowledge" | "both" | "drop",
  "reason": "...",
  "skill_draft":    { "name": "...", "trigger": "...", "steps": [...] } | null,
  "knowledge_draft":{ "category": "api|arch|pitfall|decision|domain",
                      "summary": "...", "fact": "...", "evidence": [...] } | null,
  "confidence": "high" | "medium" | "low",
  "suggested_links": ["<skill-slug>"]
}
```

Rules:
- "이렇게 실행하라" (입력→절차→산출) → **skill**
- "이것은 이렇다 / 왜 그렇다" (선언·제약·교훈·결정) → **knowledge**
- 혼재 → **both** (두 파일, 양방향 `linked_*` 로 연결)
- 일회성·맥락-의존 파편 → **drop**
- 동일 slug가 registry에 있으면 `supersedes` 필드 채움.
- Drop confidence가 `--min-confidence` 미만이면 verdict 강등 → `drop`.
- **`both` verdict 처리**: `suggested_links` 는 비워둔다. Persist 단계가 동일 청크에서 나온 skill ↔ knowledge 쌍을 자동으로 양방향 연결한다 (knowledge slug는 skill과 충돌하면 `k-` prefix 강제).
- **중복 억제**: 이전 청크들의 `knowledge_draft.summary` 목록을 컨텍스트로 전달한다. 의미가 겹치면 현재 청크는 **skill only** 로 다운그레이드하고 `suggested_links` 에 기존 knowledge slug를 넣는다.
- **Caveats 결손 시 강등**: `knowledge_draft` 의 `## Counter / Caveats` 섹션 근거가 비어있으면 confidence 최대 `medium` 으로 제한 (근거 부재 = 반증 가능성 미확인).

### 4. Draft
- Skill: 기존 `/skills_extract` 템플릿(`SKILL.md` + `content.md`, `source_project`/`version: 0.1.0-draft`).
- Knowledge: §Template 섹션 참조.
- 파일은 이 단계에서 실제로 쓰지 않고 메모리 버퍼에 준비.

### 5. Preview
사용자에게 표 출력. 기본 모든 non-drop 후보 `[x]`:

```
=== skills_extract_knowledge dry-run ===
Source: <source desc> (<n> chunks)

[x]  # | verdict    | slug                         | category | conf   | link
[x]  1 | knowledge  | springdoc-opid-collision     | pitfall  | high   | swagger-ai-optimization
[x]  2 | skill      | add-x-filterable-fields      | workflow | high   | -
[x]  3 | both       | oauth-token-refresh-strategy | api      | medium | oauth-setup
[ ]  4 | drop       | (temp debug log)             | -        | low    | -

Select: [a]ll  [n]one  [i]nvert  numbers to toggle, or 'edit <#>' to open draft
Proceed? [y/N]
```

`--dry-run` 이면 Preview 후 즉시 종료.

### 6. Persist
승인된 것만:
1. 파일 기록 (atomic write).
2. `registry.json` 갱신:
   - Skill: `skills.<slug>` 에 entry + `linked_knowledge` 에 연결된 knowledge slug 추가.
   - Knowledge: `knowledge.<slug>` 에 entry + `linked_skills` 에 연결된 skill slug 추가.
3. 양방향 링크 일관성 검증. 불일치면 rollback.

### 7. Report
```
Created:
  skills:     2 (<list>)
  knowledge:  3 (<list>)
Skipped:      1 (already exists, identical)
Dropped:      4 (low-confidence or one-off)

Next:
  • Review: ~/.claude/skills-hub/knowledge/**
  • Commit: cd ~/.claude/skills-hub && git add . && git commit
  • Publish: /skills_publish     (skills only)
```

**절대 자동 commit/push 하지 않음.** 사용자가 직접 수행.

## Knowledge file template

Path: `~/.claude/skills-hub/knowledge/<category>/<slug>.md`

```markdown
---
name: <slug>
type: knowledge
category: api | arch | pitfall | decision | domain
tags: [<tag1>, <tag2>]
summary: "한 줄 요약 (150자 이내)"
source:
  kind: session | commit | diff
  ref: <sha 또는 session-id 또는 WORKTREE>
  repo: <origin url 또는 local path>
confidence: high | medium | low
linked_skills: [<skill-slug>, ...]
supersedes: <slug 또는 null>
extracted_at: YYYY-MM-DD
extracted_by: skills_extract_knowledge v1
---

## Fact
핵심 명제 1–2문장.

## Context / Why
- 배경, 제약, 동기
- 왜 이 결론에 도달했는가

## Evidence
- [commit <sha>] path/to/file.ext:<line>
- 이슈/로그/링크

## Applies when
- 조건 A
- 조건 B

## Counter / Caveats
- 이 지식이 깨지는 조건
- 대체될 가능성
```

## Conflict & duplicate rules

| 상황 | 동작 |
|---|---|
| 동일 slug, 내용 동일 | skip ("already exists") |
| 동일 slug, 내용 다름 | 신규는 `<slug>-v2`, 기존 frontmatter에 `supersedes: <new>` 기록 (사용자 확인) |
| skill ↔ knowledge slug 충돌 | knowledge에 `k-` prefix 강제 |
| registry에 있고 파일 없음 | `[ORPHAN REGISTRY]` 마킹 (수정 없음, `/knowledge_list --orphans` 에 노출) |

## Registry schema (v2)

```json
{
  "version": 2,
  "skills": {
    "<slug>": {
      "category": "...", "version": "...", "scope": "global|project",
      "path": "~/.claude/skills/<slug>",
      "source_commit": "...", "installed_at": "YYYY-MM-DD",
      "linked_knowledge": ["<k-slug>", ...]
    }
  },
  "knowledge": {
    "<slug>": {
      "category": "api|arch|pitfall|decision|domain",
      "scope": "global|project",
      "path": "~/.claude/skills-hub/knowledge/<category>/<slug>.md",
      "source": { "kind": "...", "ref": "..." },
      "confidence": "...",
      "linked_skills": ["<s-slug>", ...],
      "tags": [...],
      "extracted_at": "..."
    }
  }
}
```

## Rules

- Read-only until user approves at Preview.
- Never auto-commit; never push.
- Sanitize: strip absolute user paths, emails, tokens, internal hostnames.
- Slug: ascii-kebab. Non-ASCII → romanize or `k-<shorthash>` fallback.
- `--min-confidence` 기본 `medium`. `low` 후보는 명시적 요청 시에만 포함.
- Registry write는 temp + rename으로 atomic.
