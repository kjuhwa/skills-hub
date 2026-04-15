# TSV-Driven Permission & Menu Bootstrap

Treat `functions.tsv` as the source of truth for the app's Function → Permission → Menu hierarchy; the service reconciles the DB against it on startup.

## File shape (resources/functions/functions.tsv)

Columns (tab-separated):
```
functionId	parentId	name	menuId	licenseTier	manual	description
```

- `functionId` — stable hierarchical key (e.g. `USER.CREATE`).
- `manual` — if true, entries added by admins are NOT deleted on startup.
- `licenseTier` — filters visibility per license (Light/Standard/Enterprise).

## Bootstrap reconciliation

1. Load TSV into memory at startup.
2. For each row: upsert Function entity by `functionId`.
3. Delete DB rows whose `functionId` is NOT in the TSV AND `manual=false`.
4. Re-sync Role→Permission links: drop permissions pointing at deleted functions.
5. Fire a `message.loaded` Kafka event so downstream consumers (menu service, i18n) rebuild caches.

## Why

- Diff-reviewable: pull requests show exactly which permissions change.
- Deterministic across environments: same TSV → same DB state.
- The `manual` column lets ops add ad-hoc entries without the startup wipe deleting them.
