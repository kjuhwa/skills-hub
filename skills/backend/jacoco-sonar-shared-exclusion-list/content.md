# Single Exclusion List Reused Across Quality Tools

Define coverage/quality exclusions ONCE in `ext` and reuse in every tool to prevent drift.

## Shape

```groovy
ext {
    exclusionPatterns = [
        "**/*Application*.*",
        "**/config/**", "**/constants/**",
        "**/dto/**", "**/entity/**",
        "**/repository/**", "**/service/**",
        // ...
    ] + ('A'..'Z').collect { "**/**/Q${it}*" }   // QueryDSL Q-classes
    testExclusionPatterns = ["**/temp/**"]
}
```

## Steps

1. List exclusions once in `ext.exclusionPatterns` (arrays, not strings).
2. `jacocoTestReport` → `fileTree(dir: dir, exclude: project.ext.exclusionPatterns)`.
3. `jacocoTestCoverageVerification` → `excludes = project.ext.exclusionPatterns`.
4. `sonar` → `property "sonar.exclusions", project.ext.exclusionPatterns.join(",")`.
5. Test exclusions go in a SEPARATE list and feed `test.exclude` + `sonar.test.exclusions`.

## Why it matters

Drift between JaCoCo and Sonar exclusions produces reports that disagree on coverage %, triggering false-positive quality gate failures.
