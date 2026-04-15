# docker-compose-service-inventory-files

Manage a fleet of Docker Compose services (platform + application tiers) from flat text inventory files, where each line is a service name and a leading `#` marks it as excluded from deployment. Enables easy per-environment on/off toggling without editing compose files.

## When to use
- 20+ compose services split across multiple `dc-*.yml` files.
- Different environments enable different subsets of services.
- Ops staff need a human-readable "what's deployed" list separate from the compose definitions.

## Shape
Three inventory files (names are illustrative — adapt to your tiers):

```
bin/
├── .platforms     # infra tier (kafka, redis, mongodb, traefik, ...)
├── .domains       # app tier (app-*, mfa-*)
└── .cores         # priority-boot subset of .domains
```

Line format:
- `service-name`           → included (IN)
- `#service-name`          → excluded (EX)

## Loader pattern (shell)

```sh
# Read inventory, strip comments/blank lines, keep commented-out lines *only*
# when listing "all known services" (for `list` command).
read_inventory_in() {
  grep -Ev '^\s*(#|$)' "$1"
}
read_inventory_all() {
  grep -Ev '^\s*$' "$1" | sed 's/^#//'
}
```

Compose invocation builds `-f file.yml ... <service...>` from the active list.

## Commands to expose
`list | list-platform | list-domain | up | up-platform | up-domain | down-* | pull-* | patch-*` — `patch` = `pull → down → up`.

## Why this shape
- Diff-friendly: toggling a service is a one-character change, easy to review.
- Decoupled from compose files: no need to split YAML per-env.
- Core tier enables staggered boot (core first, then rest).
