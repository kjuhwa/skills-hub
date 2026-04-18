# Demo Recording Guide

How to re-record the README hero assets. Follow this when releasing a major bootstrap version or when the demo drifts from current behaviour.

## What to record

**Inside a Claude Code session** — not a plain shell. Slash commands (`/hub-find`, `/hub-install`, `/hub-list`, `/hub-doctor`, `/hub-precheck`) are the canonical user experience, and that's what the hero demo should show. Use ScreenToGif to capture the Claude Code window.

> Previous iterations tried `asciinema` (Unix-only, fails on Windows with `ModuleNotFoundError: No module named 'fcntl'`) and shell wrappers in `~/.claude/skills-hub/bin/`. The shell wrappers only cover three commands (`hub-search`, `hub-precheck`, `hub-index-diff`). Slash commands inside Claude Code cover **everything** and match the actual UX.

| Asset | Length | Story | Viewer |
|---|---|---|---|
| **Teaser GIF** — `docs/demo-hub-find.gif` | ~20 s | Golden path: `/hub-find` → `/hub-install` → `/hub-list` → `/hub-doctor`. Silent, auto-loops. | Skimmer / mobile |
| **Full walkthrough GIF** — `docs/demo-core-8.gif` | ~60 s | Core 8 tour covering `/hub-find`, `/hub-suggest`, `/hub-install`, `/hub-list`, `/hub-precheck`, `/hub-doctor`. | Interested desktop viewer |

---

## Prerequisites

- Claude Code installed and working (`claude` CLI on `PATH`, or IDE integration).
- `~/.claude/skills-hub/` already installed — run `/hub-doctor` first, all 11 checks should pass.
- Terminal/IDE font readable at 640 px wide. **Consolas 14 pt** or **Cascadia 14 pt**, window **100×30**, dark theme.
- Anonymised prompt — no `C:\Users\<your-name>\...` in the scrollback. Before recording:
  ```bash
  cd ~              # hides full path
  clear             # wipe scrollback
  ```

---

## Recording tool — ScreenToGif

1. Download: https://www.screentogif.com/ → portable zip, no install needed.
2. Extract and run `ScreenToGif.exe` → click **Recorder**.
3. Position the capture frame **over the Claude Code window only** — no taskbar, no other windows.
4. Settings panel:
   - **Frame rate**: 12 fps.
   - **Capture**: Direct (Windows).
   - **Hotkeys**: `F7` start/pause, `F8` stop.
5. After `F8` → **Editor** opens.
6. Trim the first 0.5 s and last 0.5 s. Delete any frame where you mistyped.
7. **File → Save as → GIF** → check **Compress** → set **Quality 80**.

---

## Asset 1 — Teaser GIF (20 s, `docs/demo-hub-find.gif`)

Golden path only. Silent, tight, auto-loops cleanly. No titles, no multiple scenes.

### Pre-recording setup

In Claude Code (new session is fine):
```
/hub-doctor     # confirm all green; if any red, fix before recording
```
Then clear the session (or open a fresh one) so the scrollback is empty and the cursor sits at an empty prompt.

### Shooting script

Record one take. Target 18–22 s end-to-end.

```
[0.0 s]  empty Claude Code prompt

[0.5 s]  type:  /hub-find "카프카 컨슈머 튜닝"
[2.5 s]  Claude renders ranked results
         — top hit: kafka-batch-consumer-partition-tuning
         hold ~2 s so viewer can read

[5.5 s]  type:  /hub-install kafka-batch-consumer-partition-tuning
[7.5 s]  Claude confirms install: "installed to ~/.claude/skills/..."

[10.0 s] type:  /hub-list --kind skills
[12.0 s] Claude shows one-row table with the just-installed skill

[14.5 s] type:  /hub-doctor
[17.0 s] Claude shows: "Summary: 11 passed"

[19.5 s] hold last frame 0.5 s
[20.0 s] END → loop
```

### Export

- Filename: `docs/demo-hub-find.gif`
- Size target: **≤ 3 MB**. If larger: 10 fps, or crop window tighter.

---

## Asset 2 — Full walkthrough GIF (60 s, `docs/demo-core-8.gif`)

Six acts, ~10 s each. Same tool, same Claude Code session, longer take.

### Shooting script

```
# ── Act 1 (0:00–0:10)  Find ───────────────────────────────────────────
type: /hub-find "스프링 카프카" -n 3
hold ~2 s while Claude renders top 3 results

# ── Act 2 (0:10–0:20)  Suggest (pre-implementation auto-check) ────────
type: /hub-suggest Spring Boot 에서 JWT refresh token 구현
hold ~2 s — Claude proposes matching skill + 3-way prompt:
   ① 참조만  / ② 설치  / ③ 건너뛰기

# ── Act 3 (0:20–0:30)  Install ────────────────────────────────────────
type: /hub-install jwt-refresh-rotation-spring@1.0.0
hold ~2 s — Claude confirms install + pin=true

# ── Act 4 (0:30–0:40)  List ───────────────────────────────────────────
type: /hub-list --kind skills
hold ~2 s — two-row table showing both installed skills

# ── Act 5 (0:40–0:50)  Precheck ───────────────────────────────────────
type: /hub-precheck --skip-lint
hold ~2 s — lint PASS + regenerate 3 indexes + ALL PASS summary

# ── Act 6 (0:50–1:00)  Doctor ─────────────────────────────────────────
type: /hub-doctor
hold on "Summary: 11 passed" for 3 s (final frame)
```

### Dry-run first

Run the whole sequence **without ScreenToGif** to confirm:
- Every command outputs cleanly at your window width.
- No Claude "thinking" takes longer than 2–3 s (if so, simplify the query).
- Total runtime lands in 55–65 s.

If `/hub-precheck` takes ~2 s to regenerate indexes, that's fine — viewers are reading. If it takes 10 s, swap to `/hub-index-diff HEAD~1` (faster, smaller output).

### Export

- Filename: `docs/demo-core-8.gif`
- Size target: **≤ 8 MB**. If larger: 10 fps + tighter crop + higher compression.

---

## Where to save

```
~/.claude/skills-hub/remote/docs/demo-hub-find.gif
~/.claude/skills-hub/remote/docs/demo-core-8.gif
```

Then ping the maintainer (me). I'll:
1. Uncomment the hero block in `README.md` and wire in real paths.
2. Open the PR and squash-merge.
3. Verify rendering at GitHub desktop scale + mobile scale.

---

## Re-recording trigger

Re-record when:
- Bootstrap version bumps **minor or major** (v2.6.x → v2.7.0). Patches don't qualify.
- A command shown in the demo changes flags or output format.
- The "Core N" mental model grows or shrinks (currently Core 8).

Archive old GIFs to `docs/archive/<old-version>/` rather than deleting — existing issue threads may still link to them.
