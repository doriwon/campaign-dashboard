# 캠페인 대시보드

마케팅 캠페인 성과를 조회하고 분석할 수 있는 대시보드입니다.
글로벌 필터를 기준으로 차트와 테이블이 실시간으로 동기화됩니다.

---

## 실행 방법

```bash
npm install
npm run dev
```

> `npm run dev` 실행 시 Next.js(3000)와 json-server(3001)가 동시에 실행됩니다.
> 브라우저에서 http://localhost:3000 접속

---

## 기술 스택 선택 근거

### Next.js 14 (App Router) + TypeScript

- 서버/클라이언트 컴포넌트 분리로 확장성 확보
- TypeScript strict 모드로 런타임 에러 사전 방지

### TanStack Query (React Query)

- 서버 상태와 클라이언트 상태를 명확히 분리
- `queryClient.setQueryData`로 캐시 직접 수정 → 캠페인 등록/상태 변경 즉시 반영
- staleTime 설정으로 불필요한 재요청 방지
- Redux를 쓰지 않은 이유: 서버 데이터 캐싱이 주 목적인데 Redux는 이를 직접 다루지 않아 React Query가 더 적합

### Zustand

- 글로벌 필터처럼 여러 컴포넌트가 구독하는 상태 관리에 적합
- Redux 대비 보일러플레이트 최소화, 이 규모에서 충분

### Recharts

- React 친화적 API로 LineChart / PieChart / BarChart 모두 일관된 방식으로 구현
- ResponsiveContainer로 반응형 처리 간결

### React Hook Form + Zod

- 6개 필드 폼을 useState 없이 관리, 리렌더링 최소화
- `refine`으로 교차 필드 검증(집행금액 ≤ 예산, 종료일 ≥ 시작일) 처리
- `crypto.randomUUID()` 사용으로 외부 uuid 패키지 불필요

### json-server + concurrently

- `npm run dev` 한 번으로 Next.js + mock API 동시 실행
- REST API 형식 그대로 사용해 실제 API 전환 시 fetcher만 교체하면 됨

---

## 폴더 구조

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx              # QueryClient Provider
│
├── components/
│   ├── dashboard/                 # 대시보드 도메인 컴포넌트
│   │   ├── CampaignModal.tsx
│   │   ├── CampaignRanking.tsx    # 선택과제
│   │   ├── CampaignTable.tsx
│   │   ├── DailyTrendChart.tsx
│   │   ├── GlobalFilter.tsx
│   │   └── PlatformChart.tsx      # 선택과제
│   └── LoadingSpinner.tsx         # 범용 UI 컴포넌트
│
├── hooks/
│   ├── useCampaigns.ts
│   ├── useDailyStats.ts
│   └── useFilteredData.ts         # 핵심 데이터 파이프라인
│
├── lib/
│   ├── api.ts                     # fetch 기반 API 클라이언트
│   └── metrics.ts                 # CTR / CPC / ROAS 순수 함수
│
├── store/
│   └── filterStore.ts             # Zustand 글로벌 필터
│
├── types/
│   └── index.ts                   # Campaign, DailyStat 인터페이스
│
└── utils/
    └── safe.ts                    # null safety, 0 나누기 방어
```

컴포넌트 분리 기준:

- `dashboard/`: 대시보드 도메인에 종속된 컴포넌트
- `components/` 루트: 도메인과 무관한 범용 UI 컴포넌트 (LoadingSpinner 등)

---

## 아키텍처 설계

### 상태 분리 원칙

| 상태 종류                            | 위치           | 이유                 |
| ------------------------------------ | -------------- | -------------------- |
| 서버 데이터 (campaigns, daily_stats) | TanStack Query | 캐싱, 자동 동기화    |
| 글로벌 필터 (기간/상태/매체)         | Zustand        | 여러 컴포넌트 구독   |
| 테이블 로컬 상태 (검색/정렬/페이지)  | useState       | 다른 컴포넌트와 무관 |
| 모달 open/close                      | useState       | 로컬 인터랙션        |

### 핵심: 단일 데이터 파이프라인

`useFilteredData` 훅 하나에서 모든 필터링과 집계를 처리합니다.
모든 차트와 테이블이 이 훅에서 파생된 데이터를 사용해 동기화를 보장합니다.

```
[json-server]
    ↓ GET /campaigns, /daily_stats
[TanStack Query]  ← 캐싱
    ↓
[useFilteredData]  ← Zustand filterStore 구독
    ↓ 5단계 파이프라인
    1) 캠페인 필터링 (날짜 겹침 + 플랫폼 + 상태)
    2) 필터된 캠페인 ID Set 추출
    3) 해당 기간 daily_stats 필터링
    4) 날짜별 합산 → chartData
    5) 캠페인별 집계 + CTR/CPC/ROAS → tableData
    ↓
[GlobalFilter] [DailyTrendChart] [CampaignTable] [PlatformChart] [CampaignRanking]
```

---

## 컴포넌트 설계

### GlobalFilter

- Zustand 필터 스토어와 직접 연결
- `localStart` / `localEnd` 로컬 state로 타이핑 중 임시값 관리
- onChange에서 유효성 검사 통과 시에만 스토어 반영, 에러는 메시지로 즉시 표시
- 종료일이 시작일보다 빠를 경우 에러 메시지 표시 + 스토어 반영 차단
- PlatformChart 클릭 시 매체 필터 양방향 연동

### CampaignTable

- 데이터 흐름: 전체 → 검색 → 정렬 → 페이지네이션 (순서 중요)
- 일괄 상태 변경: `queryClient.setQueryData`로 캐시 직접 수정 → 즉시 반영
- `CampaignRow` 분리 후 `React.memo` 적용으로 불필요한 리렌더링 방지
- 검색은 테이블 로컬 상태로만 처리 (글로벌 필터와 독립)

### CampaignModal

- React Hook Form + Zod로 유효성 관리
- 교차 필드 검증: 집행금액 ≤ 예산, 종료일 ≥ 시작일 (refine)
- 등록 성공 시 캐시에만 추가 → 새로고침 시 초기화 (요구사항 준수)
- 등록 성공 시 토스트 알림 (3초 자동 소멸)

### PlatformChart (선택)

- 도넛 조각 클릭 → `filterStore.togglePlatform` 호출로 글로벌 필터 양방향 연동
- 선택된 플랫폼 opacity로 시각적 피드백
- 수치 표 너비 고정으로 숫자 길이에 따른 레이아웃 밀림 방지

### CampaignRanking (선택)

- ROAS/CTR 내림차순, CPC 오름차순으로 정렬 기준 분기
- `value === 0` 항목 제외 (stats 없는 캠페인 랭킹 노출 방지)
- `shortName` / `fullName` 분리로 차트 표시와 툴팁 일관성 유지

---

## 데이터 예외 처리

| 케이스                      | 처리 방법                             |
| --------------------------- | ------------------------------------- |
| `conversionsValue: null`    | `safeNumber()`로 0 처리               |
| clicks/impressions/cost = 0 | `safeDivide()`로 0 나누기 방어        |
| `endDate: null`             | 테이블에서 `-` 표시                   |
| status 비정상값             | 필터 조건 적용 시 자동 제외           |
| 날짜 포맷 불일치            | dayjs 파싱 + `isValidDate` 검증       |
| 연도 4자리 초과 입력        | `hasInvalidYear`로 onChange 즉시 차단 |

---

## 트러블슈팅

### 1. 날짜 입력 UX 문제

- `type="date"` 타이핑 중 불완전한 값이 스토어에 반영되는 문제
- `localStart` / `localEnd` 로컬 state로 임시값 관리
- onChange에서 유효성 검사 통과 시에만 스토어 반영

### 2. 전환수 기준 차트 데이터 없음 표시

- `StatsAccumulator`에 `conversions` 추가 후 폴백 객체에 반영 누락
- `EMPTY_STATS` 상수로 통일해 필드 누락 방지

### 3. 캠페인 등록 후 새로고침 시 데이터 유지

- `api.postCampaign`이 `db.json`에 실제로 쓰는 문제
- POST 호출 제거, `queryClient.setQueryData` 캐시에만 추가

### 4. 도넛 차트 레이아웃 밀림

- 수치 패널의 숫자 길이에 따라 차트 위치가 밀리는 문제
- `flex-shrink-0` + 고정 너비로 해결
