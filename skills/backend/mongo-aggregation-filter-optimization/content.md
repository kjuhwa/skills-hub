# mongo-aggregation-filter-optimization

## When to use
You have a Mongo aggregation that unwinds an array of sub-documents (e.g. `data[].ts`, `data[].v`) only to match a time window or predicate, then re-groups. If the array is large, `$unwind` multiplies documents N× before any filter runs — memory and pipeline cost explodes.

## Shape
Push the predicate into an inline `$project`/`$addFields` using `$filter`, so the array shrinks **before** any `$unwind`/`$group`.

```js
// Before
[ { $match: { _id: {$in: ids} } },
  { $unwind: "$data" },
  { $match: { "data.ts": {$gte: from, $lte: to} } },
  { $group: ... } ]

// After
[ { $match: { _id: {$in: ids} } },
  { $addFields: {
      data: { $filter: {
        input: "$data",
        as: "d",
        cond: { $and: [ { $gte: ["$$d.ts", from] },
                        { $lte: ["$$d.ts", to] } ] }
      } } } },
  { $group: ... } ]
```

## Rules of thumb
- If the outer doc count × array length is large, `$filter` wins by orders of magnitude.
- Pair with a covering index on the outer `$match` key; `$filter` is not index-assisted, so prune docs first.
- Keep the `$filter` result empty-array-safe: downstream `$unwind` should use `preserveNullAndEmptyArrays` only if you need empty bucket rows.
- If you can compute the aggregate without unwind (avg/max via `$reduce` or `$avg` over the filtered array), drop `$unwind` entirely.

## Counter / Caveats
- For very small arrays (<10 elements) the savings are negligible; readability of `$unwind` may win.
- `$filter` runs per-doc in the pipeline — a covering index on the outer match remains the dominant cost factor.
