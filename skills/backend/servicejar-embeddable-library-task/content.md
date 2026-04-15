# ServiceJar: Embeddable Library JAR Alongside BootJar

Produce two artifacts from one codebase: a fat `bootJar` for standalone deployment, and a plain `serviceJar` library that a host Spring Boot app can import.

## Shape

```groovy
tasks.register('serviceJar', Jar) {
    dependsOn tasks.named('classes')
    from(sourceSets.main.output)

    exclude('com/example/app/Application.class')
    exclude('com/example/app/config/OpenAPIConfig.class')
    exclude('com/example/app/config/WebConfig.class')
    exclude('application.env', 'application.yml', 'public')

    archiveFileName = "${artifactId}-service-${version}.jar"
    destinationDirectory = layout.buildDirectory.dir('libs')
}
```

## Steps

1. List all classes that MUST NOT ship to the host (main class, web config, OpenAPI config, thread pool config, interceptors).
2. Exclude bundled resources that would collide with the host (`application.yml`, `public/`, XMLs).
3. Keep `bootJar` untouched so standalone deployment still works.
4. Publish both artifacts to your internal Maven repo under different classifiers or filenames.

## Why

Host app (on-prem management service) already owns the main class, web stack, and resources; bringing them in twice causes bean conflicts and resource duplication.
