# collection-routing-by-period

## When to use
Time-series data is written to multiple rollup tiers (raw, 1-minute, hour, day, monthly suffix). The query side must pick the narrowest tier that still covers the requested window, without hardcoding collection names at call sites.

## Shape
A single resolver maps `(Period.Mode, fromTs, toTs)` → collection name. Callers pass only the Mode enum; routing lives in one place.

```java
String getTimeSeriesMetricCollectionName(Period.Mode mode, long fromMs, long toMs) {
    return switch (mode) {
        case LIVE, REAL, RAW  -> RAW_VIEW;
        case MIN_1, MIN_5,
             MIN_15, MIN_30   -> ONE_MIN_COLLECTION;
        case HOUR, HOUR_3     -> HOUR_COLLECTION + suffixFor(fromMs);
        case DAY, DAY_3,
             MONTH, MONTH_2   -> DAY_COLLECTION;
    };
}
```

## Rules
- **Never** let repositories hardcode raw-view names; always go through the resolver.
- Use a **view** (not a collection) for raw, so retention/TTL changes don't require code updates.
- Monthly suffix on the hot tier (hour) keeps index size bounded and enables drop-collection retention.
- Live mode ⇒ raw view; multi-line charts (equalizer/multi/topN) may still aggregate from raw — document exceptions explicitly.

## Counter / Caveats
- If the query window straddles a monthly suffix boundary, the resolver must return *both* collections (union via `$unionWith` or two queries merged client-side).
- Tiering breaks down for backfills that write out-of-order timestamps; route by event-time bucket, not wall-clock.
