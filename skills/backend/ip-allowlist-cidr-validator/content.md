# IP Allow-List Validator (CIDR + Wildcards + Ranges)

Validate a client IP against a user-supplied allow-list that accepts mixed notations:

- Plain IPv4: `192.168.10.5`
- CIDR: `192.168.10.0/24`
- Octet wildcard: `192.168.*.*`
- Octet range: `192.168.10-20.*`

## Building blocks

- `CidrMatcher` — thin wrapper over Apache commons-net `SubnetUtils` for CIDR.
- `IpAllowValidator.isValidAllowIpList(List<String>)` — syntax check for persistence layer.
- `IpAllowValidator.matches(String ip, List<String> allowList)` — runtime check at login.

## Steps

1. Parse each entry: detect `/` (CIDR), `*`/`-` (wildcard/range), else plain.
2. Normalize plain IPv4 to four octets; reject IPv6 unless explicitly supported.
3. For wildcard/range: compare octet-by-octet against the candidate IP.
4. Short-circuit on first match; empty list defaults to "allow all" OR "deny all" per policy — document explicitly.
5. Enforce on auth filter BEFORE password check so brute-force probes don't reveal the policy.

## Dependencies

```
implementation 'commons-net:commons-net:3.6'
```

## Test cases to cover

- `0.0.0.0/0` catch-all.
- `/32` single host.
- Invalid CIDR prefix (`/33`).
- Range with inverted bounds (`20-10`) — reject.
- Wildcard in non-last octet (`192.*.10.5`).
