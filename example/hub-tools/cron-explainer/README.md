# Cron Explainer

> **Why.** Spring `@Scheduled`, Quartz, and Kubernetes CronJobs all speak *almost* the same cron dialect, but 5-field (standard), 6-field (Quartz with seconds), and 7-field (Quartz with optional year) diverge on subtle edges. "Does `0 */2 * * 1-5` fire at 12pm on Saturday?" is a question that takes four tabs and a unit test to answer. This tool takes the expression, parses it, and shows (a) English, (b) the next ten firing times, (c) a one-year heatmap of firing density.

## Features

- **Auto-detect** 5 / 6 / 7-field expressions.
- **Field explainer** — every field rendered in English with the set of matching values.
- **Next 10 firings** — iterates from *now* forward, respects day-of-week / day-of-month "or" semantics (Quartz `?`).
- **1-year heatmap** — 53 × 7 grid, firing density per day. Instantly see which weeks the schedule silently skips.
- **Preset library** — business hours · every minute · nightly · weekly · monthly · workday morning.
- **Zero deps** — single HTML file. Opens with `file://`.

## Usage

```
start cron-explainer\browser\index.html
```

## Supported syntax

- `*` any · `,` list · `-` range · `/` step
- `?` (day-of-month / day-of-week) — Quartz's "no specific value"
- `L` last (day-of-month only, basic)
- Day-of-week: `0-7` where 0 and 7 both mean Sunday; also `SUN MON ...`
- Month: `1-12` or `JAN FEB ...`

## File structure

```
cron-explainer/
├── README.md
├── manifest.json
└── browser/
    └── index.html
```
