# multi-resource-or-batch-query

## When to use
A multi-line chart (N resources) otherwise triggers N round-trips. On a warm cache this is tolerable; on cold cache or for tabular exports (hundreds of resources) it dominates latency.

## Shape
Build one pipeline that matches all resources via `$or` (or `$in`) and keys the output by resourceId so the service layer can de-multiplex.

```java
List<Criteria> perResource = resourceIds.stream()
    .map(id -> Criteria.where(META_RESOURCE_ID).is(id)
                       .and("ts").gte(from).lte(to))
    .toList();

Aggregation agg = newAggregation(
    match(new Criteria().orOperator(perResource.toArray(new Criteria[0]))),
    project("ts", "v").and(META_RESOURCE_ID).as("key")
);
```

## Rules
- Prefer `$in` when the predicate is identical per-resource; use `$or` only when per-resource windows differ.
- Project a synthetic `key` field so the Java side doesn't have to re-derive the resource identity.
- Combine with `$filter` on the inner array so the `$or` match + array prune happen in one doc pass.
- For >500 resources, split into chunks of 100–200; `$or` beyond that stops using indexes efficiently.

## Counter / Caveats
- Batching breaks per-resource error isolation — one malformed resourceId fails the whole pipeline. Validate inputs up-front.
