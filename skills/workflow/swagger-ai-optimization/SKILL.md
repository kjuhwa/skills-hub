---
name: swagger-ai-optimization
description: Spring Boot + springdoc 프로젝트의 Swagger/OpenAPI 스펙을 AI Agent용으로 최적화 (operationId, @Schema, @ApiResponse, x-filterable-fields 전수 적용)
triggers:
  - swagger ai 최적화
  - openapi ai optimization
  - MCP 연동 준비
  - swagger operationId 전수 부여
  - AI 이해도 테스트
scope: user
category: workflow
version: 1.0.0
---

# Swagger AI 최적화 워크플로우

Lucida 계열 Spring Boot 프로젝트에서 검증된 13단계 워크플로우. AI Agent(Claude, GPT, Gemini)가 스펙만 보고 API를 정확히 선택·호출하도록 스펙 품질을 B(30/36) → A+(36/36)로 끌어올린다.

## When to Activate

- Spring Boot 프로젝트에서 "Swagger 최적화", "OpenAPI AI 최적화", "MCP 연동 준비" 요청
- 컨트롤러에 @Operation만 있고 operationId/@Schema/@ApiResponse가 미적용 상태
- Lucida 프로젝트(lucida-domain-*, lucida-widget 등)의 AI 친화성 개선

## 프로젝트 사전 조건

- Spring Boot 3.x + springdoc-openapi (대부분 `lucida-framework-defaults-starter`에 포함)
- application.yml의 `spring.application.name` 확인 필수 (스펙 추출 경로에 사용)
- Gradle/Maven 빌드 가능 상태

## 13-Phase 워크플로우

```
Part A: 단일 프로젝트 최적화 (Phase 1~8)
  1. Before spec 추출 + 베이스라인 측정 (tiktoken)
  2. 5-Agent 병렬 분석 (보편/범용/실용/토큰/AI이해도)
  3. 구조 정리 — @Hidden, @SecurityScheme, operationId 전수
  4. 내용 보강 — description, @Parameter on @PathVariable, @ApiResponses
  5. DTO @Schema 전수 — description + example + format
  6. After spec 추출 + 26개 AI 이해도 테스트
  7. Marp PPT 보고서
  8. CI/Prune/Prompt Caching/MCP (필수)

Part B: x-filterable-fields 확장 (Phase 9~13)
  9. lucida-ui 컬럼 정의 파싱 → { field, tt()키, filterType }
 10. lucida-meta messages_ko_kr.properties → 한국어 라벨 매핑
 11. x-filterable-fields 생성 및 @Extension 적용
 12. 응답 DTO title + enum 불일치 정정
 13. 검증 + GridFilter 정확도 재테스트
```

## 핵심 실행 전략: 병렬 에이전트 분산

대규모 프로젝트는 컨트롤러/DTO가 수십 개이므로 **반드시 병렬 에이전트로 분산**한다. 단일 에이전트로 200+ @Operation에 operationId를 추가하려 하면 중간에 멈추거나 품질이 저하된다.

### 분산 전략 (17개 컨트롤러 기준)

1. Agent/Config 컨트롤러 (27 ops)
2. CustomMonitor 컨트롤러 (62 ops — 별도 에이전트 할당)
3. CustomScript 컨트롤러 (27 ops)
4. Host/Measurement/MeasDef (32 ops)
5. 나머지 8개 컨트롤러 (52 ops)

DTO도 같은 전략으로 그룹화:
- Root DTO (~24 파일)
- configuration/ (7 파일)
- custommonitor/ + custommonitortemplate/ (20 파일)
- customscript/ (12 파일)

## ROI 우선순위 (실측 기반)

| 작업 | 실측 효과 | 투입 |
|------|:---------:|:----:|
| @Hidden (Dev 컨트롤러) | AI 후보 풀 -42%, L1 +3점 | 1줄 |
| @Schema (DTO 핵심 필드) | 파라미터 정확도 20%→100% | 10개 필드 |
| operationId 명시적 | 유사 API 구분 강화 | 1~128자, camelCase 동사+명사 |
| description "Use when/Do not use" | L2 +2점 | 50~80 단어 |
| @Parameter on @PathVariable | 타입 혼동 제거 | 2줄/필드 |

## 실전 팁

1. **@SecurityScheme은 새 클래스 만들지 말 것** — Bean 충돌(ConflictingBeanDefinitionException) 위험. 기존 `@Configuration` 클래스나 `@SpringBootApplication` 클래스에 어노테이션 추가.

2. **@Schema는 필드가 실제 선언된 클래스에 추가** — 상위 DTO가 아닌 중첩 엔티티에 선언된 필드는 해당 클래스에 직접 추가해야 spec에 반영됨.

3. **Windows Python 콘솔 인코딩** — `python -X utf8 스크립트.py` 사용. 그냥 실행하면 CP949 인코딩 오류 발생.

4. **토큰 50K 초과 시** — Prompt Caching 필수 (비용 80% 절감). 100K+면 MCP 서버로 분할 고려.

5. **tiktoken 정확도** — 근사치(len//4)는 Korean 텍스트에서 15~20% 과소평가. 정확한 측정에는 `pip install tiktoken` 필수.

## 핵심 검증 명령어

```bash
# Phase 3 검증
grep -rn 'operationId' src/main/java/**/controller/ | wc -l
grep -rn '@Hidden' src/main/java/**/controller/
grep -rn '@SecurityScheme' src/main/java/

# Phase 4 검증
grep -rn '@Parameter(description' src/main/java/**/controller/
grep -rn '@ApiResponses' src/main/java/**/controller/ | wc -l

# Phase 5 검증
grep -rn '@Schema' src/main/java/**/dto/ | wc -l

# 빌드
./gradlew compileJava

# 토큰 측정 (tiktoken 설치 후)
python -X utf8 scripts/measure-tokens.py docs/swagger-after.json
```

## 산출물 체크리스트

```
docs/
├── swagger-before.json
├── swagger-after.json
├── swagger-ai-test-prompt.md          ← 26개 시나리오
├── swagger-ai-test-results.md         ← Before/After 비교 표
├── swagger-ai-test-results-before.md  ← Before 상세
├── swagger-ai-test-results-after.md   ← After 상세
├── x-filterable-fields-mapping.json   ← Part B 매핑
└── report/
    ├── slides.md
    └── output.pptx

scripts/
├── measure-tokens.py
├── prune-swagger.py
└── prompt-caching-example.py

.github/workflows/openapi-quality-gate.yml
.spectral.yaml
```

## 등급 판정 기준

| 등급 | /36 | 판정 |
|:----:|:---:|------|
| A+ | 36 | MCP 연동 준비 완료 |
| A | 34-35 | 우수 |
| B | 30-33 | L2 개선 필요 |
| C | 26-29 | description 보강 필요 |
| D | ≤25 | 전면 재작업 |

A+ 미달 시 L3 파라미터 오답 항목의 @Schema description/example을 정밀 보강.
