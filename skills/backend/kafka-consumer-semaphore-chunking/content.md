# kafka-consumer-semaphore-chunking

## When to use
A Kafka listener hands off work to an async executor (e.g. MongoDB bulk writes, alarm evaluation). Under load the executor queue grows unbounded, leading to OOM or consumer-lag spikes followed by rebalance storms.

## Shape
Bound in-flight work with a `Semaphore` sized to the executor, and chunk the batch so a single poll can't monopolize the pool.

```java
Semaphore inflight = new Semaphore(poolSize + queueCapacity - 2);

for (List<Msg> chunk : chunks(messages, 300)) {
    inflight.acquireUninterruptibly();
    CompletableFuture
        .runAsync(() -> process(chunk), executor)
        .whenComplete((r, e) -> inflight.release());
}
```

## Rules
- Permits = `poolSize + queueCapacity - 2`. Leaves a small safety margin so the consumer thread itself never blocks the pool.
- `acquireUninterruptibly()` (not `tryAcquire`) — we want to slow the consumer, not drop messages.
- Release in `whenComplete` (both success and failure paths), never in the task body.
- Chunk size (300 here) is empirical — large enough to amortize Mongo bulk cost, small enough that one chunk ≪ one poll.
- Separate executors per workload class (alarm vs non-metric) — one stuck consumer shouldn't starve the other.

## Counter / Caveats
- This pattern *pauses* Kafka poll via blocking — ensure `max.poll.interval.ms` is higher than worst-case chunk latency, else you'll rebalance.
- For truly unbounded bursts, combine with Kafka pause/resume on the container instead of relying solely on semaphore blocking.
