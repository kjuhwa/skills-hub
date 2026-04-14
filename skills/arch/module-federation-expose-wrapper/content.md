# Module Federation Expose Wrapper Pattern

## Problem

In a multi-remote Module Federation setup where each remote defines its own webpack `@/` alias pointing at its own `src/`, any direct import from remote A's source into remote B resolves the alias against the wrong root and breaks the build. Even when paths work, tightly coupling remotes defeats the purpose of independent deploys.

## Pattern

Six files, one direction of flow:

```
remote-A/src/layout/FooPanel.tsx                        (1. implementation)
remote-A/src/remote-components/exposes/FooPanel.tsx     (2. expose wrapper)
remote-A/modulefederation.config.js                      (3. MF registration)
shared/types/remoteAppProps.d.ts                         (4. MF name constant)
shared/remote-components/imports/remote-a/FooPanel.tsx   (5. RemoteApp wrapper)
remote-B/src/pages/Consumer.tsx                          (6. consumer import)
```

### 1. Implementation (remote A)
Uses only `@/` (local) and `@shared/*` imports. Never imports from another remote.

### 2. Expose wrapper
Thin wrapper that pulls in the component's styles and provides any contexts the expose boundary loses (e.g. Router). Example:

```tsx
import FooPanel from '../../layout/FooPanel'
import '../../index.scss'
import { MemoryRouter } from 'react-router-dom'

const Component = (props: any) => (
  <MemoryRouter>
    <FooPanel {...props} />
  </MemoryRouter>
)
export default Component
```

### 3. modulefederation.config.js
```js
exposes: {
  './FooPanel': './src/remote-components/exposes/FooPanel.tsx',
}
```

### 4. Shared constants
```ts
// shared/types/remoteAppProps.d.ts
export const MF_NAME_REMOTE_A = 'remoteA'
export const MF_REMOTE_A_FOO_PANEL = 'FooPanel'
```

### 5. Shared RemoteApp wrapper
```tsx
// shared/remote-components/imports/remote-a/FooPanel.tsx
import RemoteApp from '@shared/components/remote/RemoteApp'
import { MF_NAME_REMOTE_A, MF_REMOTE_A_FOO_PANEL } from '@shared/types/remoteAppProps'

const FooPanel = (props: any) => (
  <RemoteApp appInfo={[MF_NAME_REMOTE_A, MF_REMOTE_A_FOO_PANEL]} {...props} />
)
export default FooPanel
```

### 6. Consumer (remote B)
```tsx
import FooPanel from '@shared/remote-components/imports/remote-a/FooPanel'
```

## Why each layer

- **Expose wrapper** isolates the expose boundary concerns (styles, Router) from the pure implementation.
- **Shared constants** keep MF scope/module names from drifting across config and consumers.
- **RemoteApp wrapper in shared** means consumers import a normal React component — no knowledge of MF plumbing leaks out.

## Pitfalls

- Forgetting `MemoryRouter` in the expose wrapper: consumer in a different port/origin gets a Router context error at runtime.
- Putting the RemoteApp wrapper in the consumer remote instead of `shared/`: duplicates wiring and makes future consumers rewire from scratch.
- Skipping the MF name constant and hardcoding strings in both the config and the RemoteApp wrapper: rename safety disappears.
- Importing `'../../customstyles.scss'` and friends inside the implementation itself rather than the expose wrapper: pulls styles into standalone dev builds where they may conflict.
