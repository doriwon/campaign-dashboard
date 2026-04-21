# AI 활용 내역

## 사용 도구

| 도구                       | 활용 방식                                            |
| -------------------------- | ---------------------------------------------------- |
| Claude (claude.ai)         | 전체 코드 초안 생성, 아키텍처 설계 검토, 버그 디버깅 |
| ChatGPT (GPT-5.4 Thinking) | 완성된 코드를 커밋 단위로 분리, 코드 상세 리뷰       |

두 도구를 역할에 따라 분리해서 활용했습니다.
Claude는 섹션별 전체 코드 출력과 구조 설계에 강점이 있어 초안 생성과 버그 해결에 사용했고,
ChatGPT는 완성된 코드를 가져와 커밋 단위로 쪼개고 각 단계별로 다시 테스트하는 용도로 활용했습니다.

---

## 개발 방식

```
Claude로 섹션별 전체 코드 생성
    ↓
브라우저에서 직접 테스트
    ↓
추가/삭제/수정 사항 정리
    ↓
최종 완성본을 ChatGPT로 가져가서 커밋 단위 분리
    ↓
작은 단위로 다시 테스트하며 순서대로 커밋
```

AI를 단순 코드 생성기로 쓰기보다는,
구현 속도를 높이되 최종 판단과 수정은 직접 수행하는 보조 도구로 활용했습니다.

---

## 주요 활용 사례

### 1. 아키텍처 설계 검토

`useFilteredData` 훅 하나에서 필터링과 집계를 모두 처리하는 구조에 대해
Claude에 문제점과 대안을 물었습니다.

Claude 응답: 훅이 비대해질 수 있고, 기능별로 분리하는 방향 제안

직접 판단:
이 프로젝트 규모에서는 응집도가 더 중요하다고 판단해 단일 훅 구조 유지.
글로벌 필터를 기준으로 차트와 테이블이 동시에 바뀌어야 하는 요구사항 특성상,
로직을 분산하면 오히려 동기화 문제가 생긴다고 판단.

---

### 2. 날짜 입력 UX 문제 해결

초기에는 날짜 input을 store와 직접 연결했는데 다음 문제가 있었습니다.

- 타이핑 중 불완전한 값이 바로 store에 반영됨
- blur 시점 복원 방식이 React 렌더링 지연으로 어색하게 동작
- 종료일/시작일 교차 검증 로직이 추가될수록 코드가 복잡해짐

Claude에 여러 번 구조를 물어보며 다음 대안을 비교했습니다.

- store 직접 제어 유지
- local state 분리 후 blur 반영
- onChange 시점 검증 + 유효한 값만 store 반영

최종적으로 채택한 방향:

- `localStart` / `localEnd` 로컬 state로 타이핑 중 임시값 관리
- onChange에서 유효성 검사 통과 시에만 store 반영
- 에러 메시지로 즉시 피드백 제공
- blur 복원 방식 제거 (어색한 UX 원인)

---

### 3. Recharts 타입 오류 수정

Claude가 생성한 Recharts 코드 초안에서 TypeScript 오류가 발생했습니다.

```ts
// Claude 생성 (오류)
formatter={(value: number) => value.toLocaleString()}

// 직접 수정
formatter={(value: unknown) =>
  typeof value === "number" ? value.toLocaleString("ko-KR") : "-"
}
```

`PieChart onClick` 타입 오류도 마찬가지로 직접 수정했습니다.

```ts
// Claude 생성 (오류)
const handlePieClick = (data: { name: string }) => { ... }

// 직접 수정
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
const handlePieClick = (data: PieSectorDataItem) => {
  if (!data.name) return;
  togglePlatform(data.name as Platform);
};
```

---

### 4. 데이터 누락 버그 직접 발견

Claude 생성 코드에서 `StatsAccumulator` 타입에 `conversions`를 추가했지만
폴백 객체에 반영이 누락된 것을 직접 발견했습니다.

```ts
// 누락된 상태
const stats = statsByCampaign.get(c.id) ?? {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversionsValue: 0,
    // conversions 누락
};

// 직접 수정: EMPTY_STATS 상수로 통일
const EMPTY_STATS: StatsAccumulator = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversionsValue: 0,
    conversions: 0,
};
const stats = statsByCampaign.get(c.id) ?? { ...EMPTY_STATS };
```

이 버그로 전환수 기준 차트가 "데이터 없음"으로 표시되는 문제가 있었고
직접 원인을 추적해 수정했습니다.

---

### 5. Zod API 버전 변경 대응

Claude가 생성한 Zod 코드가 구버전 API를 사용하고 있어 직접 수정했습니다.

```ts
// Claude 생성 (Zod v3 방식, 오류)
platform: z.enum(["Google", "Meta", "Naver"], {
  errorMap: () => ({ message: "매체를 선택해주세요" }),
}),
budget: z.number({ invalid_type_error: "숫자를 입력해주세요" })

// 직접 수정 (Zod v4 방식)
platform: z.enum(["Google", "Meta", "Naver"], {
  error: "매체를 선택해주세요",
}),
budget: z.number({ error: "숫자를 입력해주세요" })
```

추가로 `.int()` 순서를 조정해 max/min 에러가 먼저 표시되도록 수정했습니다.

---

### 6. 캠페인 등록 후 데이터 유지 문제

Claude가 제안한 코드에 `api.postCampaign` 호출이 포함되어
json-server가 `db.json`에 실제로 쓰는 문제가 발생했습니다.

과제 요구사항 "브라우저 세션 내 유지 (새로고침 시 초기화 허용)"를 직접 확인하고
POST 호출을 제거, `queryClient.setQueryData` 캐시에만 추가하도록 수정했습니다.

---

### 7. 직접 발견하고 수정한 UI 버그

Claude/ChatGPT 코드에서 발견하고 직접 수정한 UI 버그들:

- 도넛 차트 수치 패널 숫자 길이에 따라 차트 위치가 밀리는 문제
  → 고정 너비로 해결
- 캠페인 랭킹 막대바가 80% 지점에서 끊기는 문제
  → `margin right` 조정
- 로딩 중 "데이터 없습니다" 텍스트가 표시되는 문제
  → `LoadingSpinner` 공통 컴포넌트 추가, 로딩 상태 분리
- 전환수 선택 시 차트가 사라지는 문제
  → early return 구조를 JSX 조건부 렌더링으로 변경해 토글 버튼 유지

---

## AI 활용 효과

| 작업                         | AI 없이 예상 시간 | AI 활용 후 |
| ---------------------------- | ----------------- | ---------- |
| 데이터 구조 / 상태 흐름 설계 | 약 3시간          | 약 1.5시간 |
| Recharts 차트 구현 3종       | 약 4시간          | 약 2시간   |
| 폼 유효성 검사 구조          | 약 2시간          | 약 40분    |
| 커밋 단위 분리 / 문서 초안   | 약 1.5시간        | 약 30분    |

---

## 결론

Claude는 전체 코드 초안 생성과 버그 디버깅에,
ChatGPT는 완성된 코드를 커밋 단위로 쪼개고 리뷰하는 데 활용했습니다.

AI가 생성한 코드를 그대로 사용한 경우는 없으며,
모든 코드는 직접 브라우저에서 테스트하고 수정한 뒤 커밋했습니다.
타입 오류, 데이터 누락, UX 이슈는 직접 발견하고 해결했습니다.
