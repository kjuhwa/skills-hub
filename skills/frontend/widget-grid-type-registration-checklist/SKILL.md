---
name: widget-grid-type-registration-checklist
description: 대시보드의 TableGrid/차트 위젯에 새로운 타입을 추가할 때 드리프트 없이 5곳(columns 매핑, fetch hook, 에디터 폼, detectType, 모델 DTO) 모두 반영하게 하는 체크리스트 스킬.
category: frontend
tags: [widget, dashboard, registry, grid, checklist]
triggers:
  - TableGridType
  - 위젯 타입 추가
  - tableGridType
  - widget type registration
  - detectType
  - columns mapping
version: 1.0.0
---

# Widget Grid Type Registration Checklist

## Purpose

대시보드에 새로운 위젯(TableGrid/차트) 타입을 추가할 때 한쪽만 고쳐서 "메뉴는 뜨는데 렌더가 빈 값"이 되는 회귀를 막기 위한 **전수 반영 체크리스트**.

## When to Activate

- `TableGridType.XXX` 같은 enum/리터럴에 신규 값 추가
- 새 차트/카드 위젯 종류 도입
- "타입 추가했는데 컬럼이 안 보인다", "optionsData 에 안 뜬다" 류 증상

## 5-Point Checklist

```
Step 1. columns 매핑 테이블 두 곳 모두 등록
        - tableGridTypeToColumns           (컬럼 정의)
        - tableGridTypeToColumnsMapping    (표시명/포맷 매핑)
Step 2. 데이터 fetch hook 분기 추가
        - fallbackUrl (타입별 기본 API 경로)
        - makeServerSideParams (타입별 쿼리 파라미터 조합)
Step 3. 에디터 폼에 분기 추가
        - optionsData 배열에 옵션 추가
        - handleChangeType 에 신규 타입 케이스
Step 4. detectType 유틸에 신규 타입 판정 조건 추가
Step 5. 모델/DTO 레이어에 신규 필드(있다면) 선언
        - shared/models/... 쪽 위젯 메인 DTO
        - 백엔드 DTO @JsonView 범위 동기화
```

## Sub-pattern: 사용자 선택형 타입 (예: CUSTOM_TABLE)

타입이 "사용자가 사전에 만든 설정 중 하나 선택" 형태인 경우 추가 작업:

```
BE
- Enum 에 API 경로 포함 (예: CUSTOM_TABLE("/api/widget/custom-table/data"))
- 위젯 엔티티/DTO 에 선택 id 필드 추가 (modify/of/ofCopy 전 생성자 모두)
- @JsonView(View.Table.class) 누락 주의

FE
- 타입 선택 시 설정 목록 API(/list) 호출 → 드롭다운 표시
- 선택된 id 저장 (customTableConfigId 등)
- 기존 filter UI (tagFilters/alarmSeverity 등) 숨김 처리
- 데이터 조회 시 id 만 전달, 컬럼은 응답의 columns 동적 사용
```

## Checklist (PR 자가점검)

- [ ] columns 매핑 2곳 모두 수정
- [ ] fetch hook 의 fallbackUrl + params 둘 다 수정
- [ ] 에디터 optionsData + handleChangeType 양쪽 수정
- [ ] detectType 분기 추가
- [ ] 모델/DTO 필드 및 @JsonView 동기화
- [ ] 사용자 선택형이면 설정 목록 API 호출 + 기존 필터 UI 숨김 처리
- [ ] 빈 옵션/빈 데이터 시 UI 무한 로딩이나 NPE 없는지 확인

## Notes

- "메뉴는 보이는데 클릭하면 빈 화면" 증상은 대부분 위 5곳 중 하나 누락
- 매핑/에디터/fetch 가 제각각 파일에 분산되므로 검색 키워드는 enum 값 그 자체 (예: `CUSTOM_TABLE`)로 전수 grep 하는 것이 가장 확실
