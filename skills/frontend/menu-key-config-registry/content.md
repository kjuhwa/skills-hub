# Menu Key Config Registry

## Problem

A sidebar or drawer menu typically encodes the same key string in three places:

1. The menu item list (`{ key: 'summary', label: '...' }`)
2. The drawer/content switch (`case 'summary': return <Summary />`)
3. The default-expanded subset (`selectedSubMenu: ['summaryGroup']`)

String-based coupling drifts: someone renames the key in (1), forgets (3), and the menu silently collapses on first render. Add a fourth touchpoint (analytics, feature flags) and the drift compounds.

## Pattern

Per domain, define one file with a union type and a config object:

```ts
// constants/menu/serverDetailMenuList.ts
export type ServerDetailMenuKey =
  | 'summaryGroup' | 'summary'
  | 'performanceGroup' | 'cpu' | 'memory' | 'disk'
  | 'eventsGroup' | 'alarms'

export const serverDetailConfig = {
  summaryGroup:    { key: 'summaryGroup' as const,    parent: null },
  summary:         { key: 'summary' as const,         parent: 'summaryGroup' },
  performanceGroup:{ key: 'performanceGroup' as const,parent: null },
  cpu:             { key: 'cpu' as const,             parent: 'performanceGroup' },
  memory:          { key: 'memory' as const,          parent: 'performanceGroup' },
  disk:            { key: 'disk' as const,            parent: 'performanceGroup' },
  eventsGroup:     { key: 'eventsGroup' as const,     parent: null },
  alarms:          { key: 'alarms' as const,          parent: 'eventsGroup' },
} satisfies Record<ServerDetailMenuKey, { key: ServerDetailMenuKey; parent: ServerDetailMenuKey | null }>
```

Then all three call sites read from it:

```ts
// 1. Menu items
const items = [
  { key: serverDetailConfig.summaryGroup.key, label: tt('요약'), children: [
    { key: serverDetailConfig.summary.key, label: tt('상세') },
  ]},
  { key: serverDetailConfig.performanceGroup.key, label: tt('성능'), children: [
    { key: serverDetailConfig.cpu.key, label: 'CPU' },
    { key: serverDetailConfig.memory.key, label: 'Memory' },
    { key: serverDetailConfig.disk.key, label: 'Disk' },
  ]},
]

// 2. Drawer switch
switch (selected) {
  case serverDetailConfig.summary.key: return <Summary {...p} />
  case serverDetailConfig.cpu.key:     return <Cpu {...p} />
  // ...
}

// 3. Default expanded
const selectedSubMenu = [
  serverDetailConfig.summaryGroup.key,
  serverDetailConfig.performanceGroup.key,
]
```

## Why

- Renaming a key is a single edit; TypeScript drags all call sites along.
- A missing case in the switch becomes a TypeScript exhaustiveness error if the switch is typed `ServerDetailMenuKey`.
- `parent` encoded in the config lets you derive `selectedSubMenu` programmatically instead of hand-maintaining it.

## Apply per domain

One file per menu tree (serverDetailMenuList, networkDetailMenuList, dbDetailMenuList, …). Don't try to unify across domains — each domain's key set diverges naturally, and a union across domains makes autocomplete noisy.

## Pitfalls

- Using a plain `Record<string, ...>` instead of `satisfies Record<MenuKey, ...>` — you lose the exhaustiveness guarantee.
- Mixing display concerns (labels, icons) into the config. Keep the config for *keys and structure only*; labels go through `tt()` at the render site because translations can change independently.
- Forgetting `as const` on each `key` field — the type widens to `string` and you lose the link back to the union.
- Exporting the config under a name that collides with the component (`serverDetail` used as both). Prefix with `Config` to disambiguate.
