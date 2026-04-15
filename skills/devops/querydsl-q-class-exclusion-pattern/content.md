# querydsl-q-class-exclusion-pattern

## When to use
Spring Boot / Gradle project with generated sources (Querydsl Q-classes, Avro, MapStruct, entities). These classes add nothing testable but drag coverage numbers and introduce Sonar false positives.

## Shape
Declare one `exclusionPatterns` list in `build.gradle` and reuse it across:
1. Jacoco report class dirs
2. Jacoco coverage verification rules
3. Sonar `sonar.exclusions` + `sonar.coverage.exclusions`
4. Test task excludes (where appropriate)

```groovy
ext {
    exclusionPatterns = [
        "**/avro/**", "**/config/*", "**/controller/*Handler*",
        "**/dto/**", "**/entity/**", "**/exception/*",
        "**/kafka/**", "**/listener/*", "**/util/*",
        "**/*Application*"
    ] + ('A'..'Z').collect { "**/**/Q${it}*" }
}

tasks.named("jacocoTestReport") {
    classDirectories.setFrom(
        files(classDirectories.files.collect { d ->
            fileTree(dir: d, exclude: exclusionPatterns)
        })
    )
}

sonar {
    properties {
        property "sonar.exclusions",           exclusionPatterns.join(",")
        property "sonar.coverage.exclusions",  exclusionPatterns.join(",")
    }
}
```

## Rules
- The `('A'..'Z').collect { "**/**/Q${it}*" }` idiom catches all Querydsl Q-classes without listing each entity.
- Keep **one** list; divergence between Jacoco and Sonar means green locally, red in CI (or vice versa).
- Add generated code to the list, not to `@Generated` annotations — Sonar's Jacoco plugin respects path excludes more reliably.

## Counter / Caveats
- If a domain class legitimately starts with `Q` (rare), use a narrower path prefix like `**/querydsl/Q*`.
- Don't exclude `**/controller/**` wholesale — only handlers/test-only controllers; real controllers *should* be covered.
