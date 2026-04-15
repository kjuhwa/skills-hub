# measurement-grouping-combiner

## When to use
A metric batch arrives keyed by `(resourceId, metricId, bucketTs)` with multiple field contributions (value, count, min, max, saveRaw flags). You need one row per key — but across several granularities (raw, 1-min, 5-min, hour, day, tabular) the shape differs slightly.

## Shape
Group by key into `Map<String, List<T>>`, then call a per-granularity `combine…ByKey` that constructs a single merged object from the list.

```java
Map<String, List<Metric1Min>> byKey = rows.stream()
    .collect(groupingBy(Metric1Min::keyOf));

List<Metric1Min> merged = byKey.values().stream()
    .map(this::combine1MinMeasurementDataByKey)
    .toList();
```

## Rules
- One `combine…ByKey` per granularity — don't try to share across raw and aggregated; they merge different fields.
- Keep the combiner **pure** (no Mongo, no side effects) so it's trivially unit-testable.
- Define `keyOf` as a static on the data class — callers shouldn't reconstruct it.

## Counter / Caveats
- For very large batches prefer a streaming fold over grouping-to-list; the intermediate `List<T>` can dominate heap.
- If combiners diverge only in one field, extract that field into a strategy object rather than copy-pasting.
