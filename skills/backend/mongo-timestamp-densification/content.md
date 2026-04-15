# mongo-timestamp-densification

## When to use
A line chart needs one point per interval but the underlying collection has gaps (no data = no row). Pure `$group` returns only present buckets, producing visual holes.

## Shape
Two-stage strategy: MongoDB does the heavy lifting with `$dateTrunc` + `$densify`; Java fills any residual gaps in a simple loop (needed for LIVE-mode windows where `$densify` bounds are tricky).

```js
[ { $match: ... },
  { $addFields: { bucket: { $dateTrunc: { date: "$ts", unit: "minute", binSize: 5 } } } },
  { $group:     { _id: "$bucket", avg: { $avg: "$v" } } },
  { $densify:   { field: "_id", range: { step: 5, unit: "minute", bounds: [from, to] } } },
  { $sort:      { _id: 1 } } ]
```

```java
for (long t = from; t <= to; t += intervalMs) {
    result.computeIfAbsent(t, k -> emptyPoint(k));
}
```

## Rules
- Choose `binSize` = chart's target x-step; don't over-densify (1-second bins for a 2-month chart is pathological).
- `$densify` requires Mongo 5.3+.
- Skip the Mongo stage for raw views — densifying raw data adds noise; fill in Java only.

## Counter / Caveats
- `$densify` fills with nulls, not zeros. Downstream `$project` must handle null aggregates or the UI sees NaN.
- For multi-series (multi-resource) charts, densify per-series (`partitionByFields`) — otherwise series share gaps and alignment breaks.
