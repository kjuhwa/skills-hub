# period-mode-enum-config

## When to use
Performance/metric services that support many time modes (REAL/RAW/MIN_1/MIN_5/MIN_15/MIN_30/HOUR/HOUR_3/DAY/MONTH/MONTH_2). Each mode carries an interval, a retention, a densify step, a formatter, and a raw-vs-aggregated flag. Without a single source of truth these constants drift between repository, service, and chart layers.

## Shape
One `enum Mode` where each constant is a tuple; overloaded constructors cover "raw" vs "aggregated" shapes.

```java
public enum Mode {
    REAL  (60_000L, false, "HH:mm:ss", Duration.ofHours(1),  "HH:mm:ss"),
    RAW   (60_000L, false, "HH:mm:ss", Duration.ofHours(1),  "HH:mm:ss"),
    MIN_15(900_000L,       "HH:mm",    Duration.ofDays(7)),
    HOUR  (3_600_000L,     "MM-dd HH", Duration.ofDays(90)),
    MONTH_2(86_400_000L,   "yyyy-MM",  Duration.ofDays(730));

    final long intervalMs;
    final boolean isFullData;
    final String dateFormat;
    final Duration expire;
    final String chartFormat;
}
```

## Rules
- Every new mode adds a row here; never read interval/retention from `application.yml` per call-site.
- `isFullData=true` means "raw — don't aggregate at query time".
- Densify interval on monthly modes = 24h, not the raw interval, to keep chart point counts bounded.
- Keep this enum on the **domain** layer; don't let it depend on Mongo/Spring types so it can be shared with the API DTOs.

## Counter / Caveats
- Enums don't version well — once persisted (e.g. in a config doc), renames become migrations. Prefer codes (`"MONTH_2"`) to ordinals.
- If you find yourself overloading more than 2 constructor shapes, reach for a small value record instead.
