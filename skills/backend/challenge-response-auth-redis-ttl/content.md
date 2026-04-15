# Challenge-Response Login Backed by Redis TTL

Two-step login where the server issues a short-lived random challenge the client must sign/hash alongside the password.

## Flow

1. Client POSTs `{loginId}` → server generates 32-byte random challenge.
2. Server stores `auth:challenge:{loginId}` in Redis with TTL (e.g. 60s) and attempt counter.
3. Client POSTs `{loginId, challenge, response}` — response = HMAC/hash(password, challenge).
4. Server fetches challenge from Redis; if missing/expired → reject.
5. Server computes expected response; if mismatch → increment attempt; if attempts > max (e.g. 3) → invalidate key + lock.
6. On success → delete challenge key, issue JWT.

## Constants worth exposing

- `CHALLENGE_LENGTH_BYTES = 32`
- `CHALLENGE_EXPIRY_MINUTES = 1`
- `MAX_CHALLENGE_ATTEMPTS = 3`
- Redis key prefix: `auth:challenge:`

## Why

- Password never travels in plaintext over the wire.
- Replay impossible outside the 60s window.
- Distinct from OAuth2: no external IdP, no refresh complexity for internal-only apps.

## Pitfalls

- Clock skew between client/server if challenge includes timestamp — prefer opaque random bytes.
- Emit a distinct error code for "challenge creation failed" vs "wrong response" so clients can retry without confusing UX.
