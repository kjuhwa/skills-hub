# Explicitly Disable Testcontainers Reuse

Force per-run container lifecycle so tests never inherit prior container state.

## Shape

```groovy
tasks.named("test", Test) {
    environment 'TESTCONTAINERS_REUSE_ENABLE', 'false'
}
```

## Why

Testcontainers reads `~/.testcontainers.properties`; if a developer enabled reuse locally, CI inherits a running container across jobs, leading to flaky tests where Mongo/Kafka state from the previous suite bleeds in.

Setting the env var in the Gradle task makes the Test JVM ignore the reuse flag regardless of host config — no `~/.testcontainers.properties` required.

## When NOT to use

- Heavy shared fixture you intentionally cache across suites (e.g., 30s Kafka+Schema Registry boot).
- In that case, set reuse=true and guard with explicit `withLabel("project", "myproject")` to scope reuse.
