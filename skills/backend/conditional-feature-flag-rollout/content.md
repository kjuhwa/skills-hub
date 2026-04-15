# Feature Flag 기반 구/신 경로 공존

## 언제 쓰나
대규모 아키텍처 교체(동기→이벤트 기반 등)에서 롤백 가능성을 유지하면서 프로파일/환경별 점진적 롤아웃이 필요할 때.

## 패턴
1. 기존 Bean에 `@ConditionalOnProperty(name="feature.enabled", havingValue="false", matchIfMissing=true)`.
2. 신규 Bean에 `@ConditionalOnProperty(name="feature.enabled", havingValue="true")`.
3. 컨트롤러/서비스 진입점은 플래그 값을 주입받아 분기.

```java
@Component
@ConditionalOnProperty(name="automation.engine.enabled",
                       havingValue="false", matchIfMissing=true)
public class LegacyHandler { ... }

@Component
@ConditionalOnProperty(name="automation.engine.enabled",
                       havingValue="true")
public class EngineHandler { ... }
```

컨트롤러 분기:
```java
@Value("${automation.engine.enabled:false}") boolean engineEnabled;
public ResponseEntity<?> run(...) {
    return engineEnabled ? engine.dispatchManual(...)
                         : legacy.transferAndGather(...);
}
```

## 규칙
- `matchIfMissing=true`는 기존 경로에만(안전 기본값).
- 신규/기존 Bean이 같은 인터페이스를 구현한다면 `@Primary` 대신 `@ConditionalOnProperty`로 충돌 회피.
- 기존 경로 완전 제거 전까지는 Kafka 토픽, 테이블 스키마 등 데이터 면도 호환 유지.
- 롤백 절차: 속성 값만 되돌리면 재배포 없이 전환되도록 테스트.
