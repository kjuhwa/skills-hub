---
name: lantern-implementation-pitfall
description: Common failure modes when building lantern-themed apps: additive glow blowout, timezone drift, and cipher key leakage
category: pitfall
tags:
  - lantern
  - auto-loop
---

# lantern-implementation-pitfall

The most frequent visual regression is "glow blowout" — once you enable `globalCompositeOperation = 'lighter'` for halos, stacking more than ~40 overlapping lanterns saturates every pixel to white and the paper bodies disappear into a featureless bloom. The fix is not lowering halo alpha globally (that makes sparse scenes look dead); it's capping per-pixel accumulation by rendering halos into an offscreen buffer, applying a `pow(x, 0.7)` tone-map, then compositing back. Also watch for iOS Safari silently dropping `lighter` under low-power mode — feature-detect and fall back to `source-over` with pre-brightened sprites.

Timezone drift bites all three apps because `releasedAt` is generated in UTC but the festival view wants local-time diurnal bias, the explorer wants local-time tooltips, and the cipher app timestamps decoded messages in the viewer's zone. If any layer uses `new Date(releasedAt).getHours()` without an explicit IANA zone, the 19:00–23:00 release cluster smears across the day for users outside the festival's home zone and the scene looks wrong. Always carry `{releasedAt: ISO-UTC, originZone: IANA}` together and resolve with `Intl.DateTimeFormat`, never the host locale.

Cipher key leakage is the subtle one: it's tempting to store `cipherKey` on the same `Lantern` object that the festival and explorer views render, because it keeps one data model. But any `JSON.stringify(lantern)` for debug logs, devtools snapshots, or share-links then exposes the key and makes the cipher app trivial. Keep `cipherKey` in a parallel `Map<id, key>` that only the cipher app loads, and have festival/explorer consume a `PublicLantern` projection that strips it at the corpus-loader boundary — not at render time, which is too late once it's in component state.
