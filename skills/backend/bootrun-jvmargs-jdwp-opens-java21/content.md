# bootRun JVM Args for JDWP + Java 21 Reflection

Bake debug port and required `--add-opens` into `bootRun` so every dev gets the same local runtime.

## Shape

```groovy
tasks.named("bootRun", org.springframework.boot.gradle.tasks.run.BootRun) {
    jvmArgs = [
        "-agentlib:jdwp=transport=dt_socket,server=y,address=8001,suspend=n",
        "-Xms4096m", "-Xmx4096m",
        "--add-opens", "java.base/java.net=ALL-UNNAMED",
        "--add-opens", "java.base/java.lang=ALL-UNNAMED",
    ]
    environment "SPRING_PROFILES_ACTIVE", "local"
    // ...local infra endpoints as environment vars
}
```

## Notes

- `suspend=n` — JVM starts without waiting for debugger attach (dev-friendly).
- `address=8001` — keep distinct from server port so IDE debug + app traffic don't collide.
- `--add-opens` is only needed when libraries reflect into `java.base` internals (common with older serialization/proxying libs on Java 17+).
- Use `environment` block for local-only credentials/hosts — never commit prod values here.
