# OAuth Token Persistence via Sidecar Env File

## Problem

Many vendor OAuth integrations give you a long-lived (24h) access token but rate-limit the token-issue endpoint itself. A naive "fetch a fresh token every process start" approach burns that quota, fails at CI/boot under load, and forces every restart of your CLI/worker to re-authenticate. At the same time, keeping the token only in memory loses it on every restart, and stashing it in the main `.env` (checked in? mixed with secrets?) muddles concerns.

## Pattern

Keep *issued* tokens in a dedicated sidecar env file, separate from app configuration. Three fields are enough:

```
APP_ACCESS_TOKEN=<token>
APP_REFRESH_TOKEN=<optional>
APP_TOKEN_ISSUE_TIME=<ISO-8601>
```

Three behaviors glue it together:

1. **Lazy refresh with a safety margin.** Check `now - issue_time >= ttl - margin` (e.g., `margin = 30 min`) before every outbound call. Refresh when the margin is crossed, not when expiry hits — network RTT + clock skew kill "refresh on 401" strategies.
2. **Thread-safe singleton guard.** Under concurrent load (scheduler + realtime socket + user-triggered call), many threads will notice the margin crossed at once. Guard the refresh with a lock and a double-check.
3. **Auto-inject, don't hand-carry.** Wrap outbound params at the HTTP layer — every call gets `access_token` added. Callers build business params; they never touch the token.

## Example (sanitized)

```java
public class TokenManager {
    private static final Duration REFRESH_MARGIN = Duration.ofMinutes(30);
    private static final Duration TOKEN_TTL = Duration.ofHours(24);
    private final Object lock = new Object();

    public Map<String, Object> addAccessTokenToParams(Map<String, Object> params) {
        params.put("access_token", currentToken());
        return params;
    }

    public String currentToken() {
        if (!needsRefresh()) return readTokenFile().accessToken;
        synchronized (lock) {
            if (!needsRefresh()) return readTokenFile().accessToken;  // double-check
            var fresh = authClient.issueNewToken();
            writeTokenFile(fresh.accessToken, fresh.refreshToken, Instant.now());
            return fresh.accessToken;
        }
    }

    private boolean needsRefresh() {
        var t = readTokenFile();
        if (t == null || t.accessToken.isBlank()) return true;
        return Duration.between(t.issuedAt, Instant.now()).compareTo(TOKEN_TTL.minus(REFRESH_MARGIN)) >= 0;
    }
}
```

A small standalone entry point (`TokenRefreshUtil.main`) that only refreshes + writes is useful for cron/CI warmups so production processes never do cold-start auth.

## When to Use

- CLIs / workers that restart often and authenticate against a vendor with an issuance-rate limit.
- Long-running daemons that need to survive over a day-long token TTL.
- Tools where the same token is shared across an API client + realtime socket + scheduler in one process.

## Pitfalls

- **Don't refresh on 401 alone.** By the time the 401 fires, a burst of concurrent calls are already mid-flight — each retries and stampedes the issuance endpoint. Pre-expiry check is primary.
- **Don't commit the sidecar file.** Keep `access_token.env` (or equivalent) in `.gitignore` — it carries live credentials.
- **Don't mix it with config.** Keep the app's own `.env` immutable-at-runtime; only the token file is writable by the process.
- **Clock skew is real.** Use the vendor's returned `expires_in` when available instead of a hard-coded TTL. Clocks drift between CI and prod.
- **Double-check under lock.** A plain synchronized block without re-reading state causes every waiter to refresh again.
