# triple-env-file-split-loader

Partition environment variables by **change frequency** into three sibling files, then load them in a fixed precedence order. Keeps diffs small at release time and makes audit of per-env overrides easy.

## File roles

| File       | Contains                                                  | Changes |
|------------|-----------------------------------------------------------|---------|
| `.env`     | Site-specific: domain, data paths, ports, credentials     | Per install |
| `.version` | Image tags, component versions (`VER_*`)                  | Per release |
| `.memory`  | Container memory/CPU limits (`MEM_*`)                     | Rare, capacity planning |

All three are loaded into the same shell environment; compose reads them via `env_file:` and `${VAR}` substitution.

## Loader

```sh
# load-env.sh
ENV_FILE="${1:-./.env}"
VER_FILE="${2:-./.version}"
MEM_FILE="${3:-./.memory}"

load() {
  [ -f "$1" ] || return 0
  set -a
  . "$1"
  set +a
}

load "$ENV_FILE"
load "$VER_FILE"
load "$MEM_FILE"
```

Downstream scripts gate on a required var (e.g. `DATA_VOLUME_PATH`) and call `load-env.sh` lazily if it is unset.

## Why split
- Release PRs touch only `.version` → reviewer focus on what actually changed.
- Capacity tuning PRs touch only `.memory` → same.
- Site config (`.env`) can stay out of git, while `.version` / `.memory` are committed.

## Gotcha
Order matters: site env first, then versions, then memory — later files must be allowed to reference earlier vars (e.g. `MEM_*` may reference deployment tier set in `.env`).
