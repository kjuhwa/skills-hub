---
name: oauth-data-simulation
description: Generate realistic mock OAuth tokens, scopes, and expiry timelines for interactive front-end demos without a real auth server.
category: workflow
triggers:
  - oauth data simulation
tags:
  - auto-loop
version: 1.0.0
---

# oauth-data-simulation

Build mock JWTs by constructing separate header and payload objects, Base64url-encoding each with `btoa(JSON.stringify(obj))` plus the standard `+→-`, `/→_`, strip-`=` replacements, then joining with a dot separator and appending a dummy signature segment (`mock-signature-xyz`). Use realistic claim values: `sub` as a prefixed user ID, `iss` as an HTTPS auth domain, `aud` as a client app identifier, `iat` set to `now - offset`, `exp` set to `now + ttl`, and `jti` as a random unique token ID. This lets the decode path use the exact same `atob`-and-parse logic that real JWT inspection tools use, so the demo doubles as a teaching tool.

For scope simulation, define scopes as `resource:action` pairs (e.g., `profile:read`, `repos:write`, `admin`) and map each API endpoint to the set of scopes it requires using an `every()` check — the endpoint unlocks only when all its required scopes are active. Maintain active scopes in a `Set` and toggle membership on user interaction, then re-derive the full endpoint access matrix on each change. Embed the active scope list into a live token-preview JSON string so the user sees the exact claim shape their scope selection produces.

For token lifetime visualization, compute a timeline bar where `iat` and `exp` define the full span and the current timestamp (`now`) is plotted as a marker between them. The elapsed fraction `(now - iat) / (exp - iat)` drives a filled progress overlay. Color-code the status: green for valid (exp > now), orange/red for expired. This pattern makes token rotation and refresh window concepts tangible — a second marker for a refresh threshold (e.g., 75% of lifetime) can be added to demonstrate proactive refresh strategies.
