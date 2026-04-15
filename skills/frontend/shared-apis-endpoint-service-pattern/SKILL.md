---
name: shared-apis-endpoint-service-pattern
description: Module Federation 모노레포에서 REST 엔드포인트를 추가할 때 `endpoint 상수 → services 메서드 → commonApiService 호출` 3계층 레이어링으로 도메인 일관성을 유지하는 패턴.
category: frontend
tags: [api, services, endpoint, module-federation, monorepo, layering]
triggers:
  - 엔드포인트 추가
  - widgetEndPoint
  - shared/apis
  - commonApiService
  - API 레이어 추가
  - endpoint constant
version: 1.0.0
---

# Shared APIs: Endpoint + Service Layer Pattern

## Purpose

MFA 모노레포의 `shared/apis/` 하위에서 각 remote 가 동일한 방식으로 HTTP 호출을 하도록 **3계층 규약**을 강제한다. URL 하드코딩/중복 axios 인스턴스/타입 드리프트를 제거한다.

## When to Activate

- remote 에서 새 REST 엔드포인트 호출이 필요
- "axios.get(...) 직접 호출" 하려는 코드가 PR 에 등장
- 엔드포인트 경로가 여러 파일에 복붙되는 상황

## 3-Layer Flow

```
Step 1. shared/apis/endpoint/<domain>EndPoint.ts
        → 경로 상수만 모음 (오타·중복 원천 차단)
        예: export const WIDGET_ENDPOINT = {
              LIST:   '/api/widget/list',
              DETAIL: '/api/widget/:id',
            } as const

Step 2. shared/apis/<vendor>/<domain>/<domain>Services.ts
        → 엔드포인트 상수를 사용하는 서비스 메서드
        - 요청 payload 타입, 응답 타입을 명시
        - 공통 axios 인스턴스 재사용 (인터셉터/토큰/에러처리 일원화)

Step 3. 호출 측에서
        commonApiService.<domain>Service.myMethod(payload)
        → remote 는 엔드포인트 상수도, axios 도 직접 import 하지 않는다
```

## Rules

- remote 코드가 `shared/apis/` 밖으로 HTTP 호출 우회하면 금지
- 엔드포인트 경로 변경은 `endpoint/*.ts` 한 파일만 수정하면 되도록 유지
- path param 은 함수로 감싸거나 template 사용 (단순 문자열 replace 는 오타 취약)
- 응답 타입은 `shared/models/...` 의 DTO 를 재사용, services 레이어 안에서 새로 선언하지 말 것

## Checklist

- [ ] `endpoint/<domain>EndPoint.ts` 에 상수 추가
- [ ] `<domain>Services.ts` 에 메서드 추가 (payload/response 타입 명시)
- [ ] 호출 측은 `commonApiService.<domain>Service.*` 만 사용
- [ ] axios 또는 fetch 를 remote 내부에서 직접 쓰지 않음
- [ ] 엔드포인트 문자열이 services 파일 외부에 중복 존재하지 않음

## Notes

- 이 레이어링 덕분에 공통 인터셉터(토큰 리프레시, 공용 에러 토스트, 다국어 메시지) 를 한 곳에서 유지 가능
- mocking / 테스트 시 `commonApiService` 레벨에서 stub 하면 충분
