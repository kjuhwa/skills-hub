# Domain/Category Endpoint Registry for Large Vendor APIs

## Problem

Wrapping a vendor API that exposes 100+ endpoints (trading, logistics, telecom, government, payments) creates a sprawl problem: where does "place-limit-order-for-futures-overseas" live? If each endpoint is a free-floating class, you end up with a 300-entry flat directory, duplicated request/response boilerplate, inconsistent logging, and no way to enumerate "all the quote-related endpoints" at runtime.

Ad-hoc `class Foo { static JsonNode call(...) }` one-offs make it worse: each author reinvents headers, error handling, and logging.

## Pattern

Three enforced conventions on top of one shared base class.

### 1. Three-level package hierarchy: `{domain}/{category}/{Action}{Entity}`

```
api/
  auth/                    OAuthTokenIssue, OAuthTokenRefresh
  domestic/
    stock/
      quote/               InquirePrice, InquireAskingPrice
      order/               OrderCash, CancelOrder
      ranking/             RankingByVolume
    futures/
      order/               ...
  overseas/
    stock/
      quote/               ...
  bond/
    quote/                 ...
```

Rules:
- **Domain** = top vendor axis (market/region, service family).
- **Category** = verb group (`quote`, `order`, `realtime`, `analysis`).
- **Action+Entity** = class name, verb-first (`InquirePrice`, not `PriceInquiry`). Consistent naming lets you predict the class from the API doc title.

### 2. Shared `BaseApiEndpoint` that owns transport + logging

Every endpoint extends one base class that implements:
- `executeGet` / `executePostJson` / `executePostForm` with uniform status-code checks.
- `createHeaders(token, trId)` helpers that never get copy-pasted.
- `requireParam(params, key, label)` for input validation.
- Structured request/response/error logging keyed by endpoint name — so one log filter shows every call to a given endpoint across categories.

Subclasses contain only vendor-specific URL, param shape, and response parsing.

### 3. Single central registry

```java
class ApiService {
    private final Map<String, ApiEndpoint> endpoints = new LinkedHashMap<>();

    private void initializeEndpoints() {
        register(new InquirePrice(config));
        register(new OrderCash(config));
        register(new CancelOrder(config));
        // ... one line per endpoint, grouped by package in source
    }

    public JsonNode executeEndpoint(String name, Map<String, Object> params) {
        var ep = endpoints.get(name);
        if (ep == null) throw new IllegalArgumentException("unknown endpoint: " + name);
        return ep.execute(addAccessToken(params));
    }
}
```

With this, callers address endpoints by **name string** (e.g. from a config file or a queue entry), which unlocks:
- Data-driven workflows (queue of `[{name, params}, ...]` executed sequentially).
- Threshold-conditional chaining (if endpoint A returns X, execute endpoint B).
- Runtime introspection (`listEndpoints(category="quote")`).

## When to Use

- Wrapping a vendor API with more than ~30 endpoints, especially one that keeps growing.
- Any place where callers want to discover endpoints at runtime or configure workflows by name.
- Teams with multiple authors adding endpoints concurrently — the conventions act as automatic code review.

## Pitfalls

- **Mirroring the vendor's doc structure exactly.** Vendors organize by doc-writer convenience, not query-verb. Choose your own three-level axis (domain/category/action) and stick to it.
- **Base class doing too much.** If the base tries to own retry, caching, and response parsing, subclasses become escape-hatch-heavy. Keep the base to transport + logging + auth headers.
- **Registry filled reflectively at startup.** Tempting, slow, and breaks shaded JARs. Explicit `register(...)` lines are greppable and trivially testable.
- **Silent name collisions.** `register(name, ep)` should throw on duplicate names, not overwrite.
- **No `getApiDocs()` hook.** A base-class hook that returns the endpoint's parameter/response schema pays off fast — it's what powers auto-generated docs, dry-run UIs, and LLM agents that call your wrapper.
- **Mixing legacy and modern call styles.** If your CLI has both `quote:price` (legacy direct call) and `api:execute InquirePrice` (registry), route both through the same endpoint object so behavior stays consistent.
