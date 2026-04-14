# Multi-Environment Routing via a Single Env Flag

## Problem

Trading, payment, and partner APIs almost always ship two tiers — production and sandbox/virtual — with *different* base URLs, *different* credentials, and (often) *different* per-operation transaction IDs. Scattering `if (isProd) ... else ...` across callsites produces drift: one endpoint ends up pointing at prod with a sandbox key, or vice versa. In financial integrations that silently becomes a real-money incident.

## Pattern

Centralize tier selection into one immutable config object, loaded once at startup. The config resolves every tier-dependent value (URLs, secrets, per-call IDs) from the same flag. Callers ask the config; they never re-check the flag themselves.

Three properties matter:

1. **One switch, many outputs.** `ENV=prod` vs `ENV=sandbox` flips base URL, WS base, rate-limiter quotas, and any "transaction ID" style per-operation codes together. No partial overrides at callsites.
2. **OS env wins over dotfile.** `System.getenv` is read first; `.env` fills in gaps. This lets CI and containers override without editing files.
3. **Missing required keys fail fast.** A `must(key)` helper raises on load, not on first use — a broken deploy dies at boot, not during a 9am trade.

## Example (sanitized)

```java
public class Config {
    public final boolean production;
    public final String appKey;
    public final String appSecret;
    public final String trIdQuote;   // per-operation ID, env-scoped
    public final String trIdOrder;

    public static Config load() {
        Dotenv env = Dotenv.configure().ignoreIfMissing().load();
        boolean production = "prod".equalsIgnoreCase(get(env, "APP_ENV", "prod"));
        return new Config(
            production,
            must(env, "APP_KEY"),
            must(env, "APP_SECRET"),
            get(env, "TRID_QUOTE", ""),
            get(env, "TRID_ORDER", "")
        );
    }

    public String restBase() {
        return production
            ? "https://api.example.com"
            : "https://sandbox.example.com";
    }

    public String wsBase() {
        return production
            ? "wss://stream.example.com"
            : "wss://sandbox-stream.example.com";
    }

    private static String must(Dotenv e, String k) {
        String v = get(e, k, null);
        if (v == null || v.isBlank()) throw new IllegalArgumentException("missing: " + k);
        return v;
    }

    private static String get(Dotenv e, String k, String def) {
        String v = System.getenv(k);
        if (v == null || v.isBlank()) v = e == null ? null : e.get(k);
        return v == null ? def : v;
    }
}
```

Rate-limiter / retry budgets can be initialized from the same flag in the constructor so the HTTP layer automatically runs with sandbox-appropriate ceilings.

## When to Use

- Any SDK/client talking to a vendor that has a sandbox tier.
- Payment, trading, KYC, telecom, or government APIs where prod and test use **different** per-operation IDs (not just different URLs).
- Apps run from both developer laptops (dotfile) and CI/containers (env vars).

## Pitfalls

- **Silent partial-override.** Don't let individual call sites read `APP_ENV` and branch — they will drift. Keep all branching inside `Config`.
- **Putting secrets in `get()` with a default.** Defaults hide missing secrets. Use `must()` and fail at boot.
- **Forgetting per-operation IDs.** Many vendor APIs use different transaction/route IDs in sandbox vs prod. Model those as fields, not as constants.
- **Reading env at call time.** `System.getenv` lookups during hot paths are fine but cache via an immutable `Config` — it makes the active tier auditable in logs.
