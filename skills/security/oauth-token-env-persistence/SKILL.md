---
name: oauth-token-env-persistence
description: Persist OAuth access tokens to a sidecar env file (token + refresh + issue_time), refresh N minutes before expiry with a thread-safe guard, auto-inject into outgoing API calls — survives process restart without re-login.
category: security
tags: [oauth, token, refresh, dotenv, persistence, auth, thread-safety]
triggers: ["access_token", "refresh_token", "token refresh", "access_token.env", "token issue time", "bearer auto inject", "token expiry"]
source_project: kis-java-bundle
version: 0.1.0-draft
---
