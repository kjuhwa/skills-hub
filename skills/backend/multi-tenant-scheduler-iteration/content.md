# Scheduled iteration across every MongoDB tenant

## What this skill does
Gives a repeatable shape for `@Scheduled` services (trash archive, auto-lock, stale cleanup, bulk recalc) in a **database-per-tenant** MongoDB setup. The job enumerates databases, filters MongoDB-internal ones and known meta DBs, then runs the per-tenant work inside a `try/finally` that sets and clears `TenantContextHolder` so every Mongo call routes to the right DB.

## Skeleton

```java
@Scheduled(cron = "...")
public void runForAllTenants() {
    int totalProcessed = 0;
    try {
        List<String> tenantIds = getAllTenantIds();
        log.info("Found {} tenants to process", tenantIds.size());

        for (String tenantId : tenantIds) {
            try {
                TenantContextHolder.INSTANCE.setTenantId(tenantId);
                int processed = doTenantWork();          // per-tenant body
                totalProcessed += processed;
                log.debug("Tenant {} completed. Processed: {}", tenantId, processed);
            } catch (Exception e) {
                log.error("Error processing tenant {}", tenantId, e);   // swallow, keep going
            } finally {
                TenantContextHolder.INSTANCE.clear();
            }
        }
    } finally {
        TenantContextHolder.INSTANCE.clear();             // belt-and-braces
    }
    log.info("Completed for all tenants. Total: {}", totalProcessed);
}

private List<String> getAllTenantIds() {
    Set<String> excluded = Set.of("admin", "config", "local", "yorkie-meta");
    List<String> ids = new ArrayList<>();
    mongoClient.listDatabaseNames().forEach(n -> { if (!excluded.contains(n)) ids.add(n); });
    return ids;
}
```

## Rules that keep this safe
- **Always clear in `finally`** — leaking a TenantContext leaks tenant data into whatever runs next on that thread.
- **Catch per tenant**, not outside the loop — a broken tenant must not abort the batch.
- **Filter system DBs explicitly** (`admin`, `config`, `local`) plus any app-meta DBs you know about. Treat the excluded list as config, not a constant, if the app adds meta DBs over time.
- **Emit a single summary INFO line** after the loop. Per-tenant lines stay at DEBUG so production logs don't explode with tenant counts.
- **Expose a manual-trigger endpoint** that reuses the same method — ops needs it for disaster recovery and for smoke-testing config changes.

## Scaling caveats
- The loop is sequential. With N tenants × per-tenant latency, total runtime is N-bounded. For hundreds of tenants consider a bounded `Executor` — but keep each worker's `TenantContextHolder` local (it's `ThreadLocal`-style) and still clear in `finally`.
- If the work can itself fail partway through a tenant, make the per-tenant body idempotent (query → update-multi with a filter that excludes already-processed rows).

## When not to use
- Shared-collection multi-tenancy (tenant discriminator column). That model needs a single query with a tenant filter, not a per-DB loop.
- Single-tenant apps — no iteration needed.
