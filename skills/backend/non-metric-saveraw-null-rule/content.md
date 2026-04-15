# non-metric-saveraw-null-rule

## When to use
Your data-collection policy applies to multiple measurement types. METRIC rows honor a `saveRaw` toggle (keep raw samples or only aggregates). Non-METRIC rows (Availability / Trait) have no raw stream — but defaulting their `saveRaw` to `false` silently semantically-overloads the field.

## Shape
Treat `saveRaw` as `Boolean`, not `boolean`. For non-METRIC types, **set it to `null`** during every write path (create, common-policy update, individual-policy update).

```java
if (type != MeasurementType.METRIC) {
    policy.setSaveRaw(null);
} else if (policy.getSaveRaw() == null) {
    policy.setSaveRaw(defaultSaveRawFor(intervalType));
}
```

## Rules
- `null` means "N/A for this type"; `false` means "METRIC type, explicitly don't save raw". Never collapse the two.
- Apply the rule on *every* update path — common-policy edits, individual-policy edits, interval changes.
- When the interval type changes and the new type is METRIC, recompute `saveRaw` instead of keeping the previous value.

## Counter / Caveats
- If your persistence layer maps `null` to `false` (some Mongo codecs or JPA defaults), add an explicit `@Field(write = ALWAYS)` or equivalent so null survives serialization.
