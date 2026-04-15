# 멀티테넌트 컨텍스트 — Worker 안전 세팅/정리

## 왜 중요한가
`@KafkaListener` 컨슈머 스레드와 `ThreadPoolTaskExecutor` 풀 스레드는 **재사용**된다. ThreadLocal 기반 TenantContext를 set만 하고 clear하지 않으면 다음 메시지가 이전 테넌트로 실행되어 **교차 테넌트 데이터 유출**로 이어진다.

## 패턴
```java
public void process(RequestUnit unit) {
    if (!admissionControl.tryAcquire()) { queue.reOffer(unit); return; }
    try {
        TenantContextHolder.INSTANCE.setTenantId(unit.organizationId());
        JobExecutionResult r = executor.execute(unit.organizationId(), unit);
        resultHandler.handle(unit.organizationId(), unit.jobId(),
                             unit.resourceId(), r);
        progressTracker.recordCompletion(unit.jobId(), unit.resourceId(), r.success());
    } finally {
        admissionControl.release();
        TenantContextHolder.INSTANCE.clear();
    }
}
```

## 규칙
- `set` 과 `clear`는 **같은 메서드의 try-finally**로 묶는다 (헬퍼 함수 중첩 시 누락 빈발).
- `AdmissionControl.release()` 역시 finally (예외 경로에서도 카운터 복구).
- 테스트: `@AfterEach`에서 항상 `TenantContextHolder.clear()` 호출해 테스트 간 오염 방지.
- 백오프/재투입(`reOffer`) 경로에서는 **acquire 성공 전까지 컨텍스트를 건드리지 않는다** (조기 set/clear 불균형 방지).

## 안티패턴
- MDC나 SecurityContextHolder 방식 그대로 `try/finally` 없이 setTenantId 호출.
- 비동기 `CompletableFuture.supplyAsync(...)`로 throw된 후 상위 catch에서 clear — 별도 스레드여서 무효.
