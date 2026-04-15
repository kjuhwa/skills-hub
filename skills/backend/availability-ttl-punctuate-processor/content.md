# availability-ttl-punctuate-processor

## When to use
A Kafka Streams processor keeps a state store (e.g. "latest availability per resource"). Entries for decommissioned or idle resources never get new events, so event-time TTL won't fire. Without cleanup the store grows unbounded.

## Shape
Schedule a wall-clock `punctuate` inside `Processor.init`; iterate the store and delete entries older than the TTL.

```java
public void init(ProcessorContext ctx) {
    this.store = ctx.getStateStore("availability-latest");
    ctx.schedule(
        Duration.ofHours(1),
        PunctuationType.WALL_CLOCK_TIME,
        now -> evictOlderThan(now - TTL_MS));
}

public void process(Record<K, V> r) {
    V prev = store.get(r.key());
    if (prev == null || changed(prev, r.value())) {
        store.put(r.key(), r.value());
        ctx.forward(r);
    }
}
```

## Rules
- Emit downstream only when the value **changed** — dramatically reduces topic volume and prevents downstream "latest" collections from flapping.
- Use WALL_CLOCK, not STREAM_TIME — STREAM_TIME won't advance if the input topic is silent.
- Evict defensively: a separate tombstone forward on eviction keeps downstream stores in sync.

## Counter / Caveats
- Wall-clock punctuate doesn't survive consumer rebalances cleanly — newly-assigned partitions take up to the punctuate interval before first cleanup. Size the interval accordingly.
- Don't mix TTL logic with business logic in the same processor if you can help it; a dedicated "janitor" processor reading the same store is easier to reason about.
