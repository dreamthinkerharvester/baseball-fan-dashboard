# Design: KIA Player Storybook

> **Summary**: 8개 모듈의 인터페이스·핵심 알고리즘·블로그 마크다운 템플릿·UI 와이어프레임·API 시그니처 확정.
>
> **Version**: 0.1.0
> **Date**: 2026-05-11
> **Status**: Draft
> **Upstream**: [PRD](../../00-pm/kia-player-storybook.prd.md) · [Plan](../../01-plan/features/kia-player-storybook.plan.md)

---

## Context Anchor (Plan 복사)

| Key | Value |
|-----|-------|
| **WHY** | 야구 블로그 글 1편당 자료 수집 시간 30~60분 → 5분 이내로 압축 |
| **WHO** | 사용자 본인 (KIA 팬 블로거) — 외부 사용자 0명 |
| **CORE VALUE** | 4 데이터 영역 + 이미지 풀 → 마크다운 초안, LLM 미사용 |
| **RISK** | R3 명예훼손 (15) > R1 API quota (9) > R2 나무위키 (6) > R4 신인 데이터 (4) |
| **SCOPE** | F1 today · F2 prime · F3 news · F4 narrative · F5 draft · F6 image-slot |

---

## 1. 모듈 인터페이스 (TypeScript 시그니처)

### 1.1 M1 `src/types/storybook.ts`

```typescript
import type { Player } from "./player";

// F1: 당일 기록
export interface TodayPerformance {
  played: boolean;                          // 출전 여부
  date: string;                             // "2026-05-11"
  vs: { teamCode: string; teamName: string } | null;
  batter?: BatterTodayStat;
  pitcher?: PitcherTodayStat;
  seasonTrend?: { before: number; after: number; metric: "AVG" | "ERA" };
  fallbackRecent5?: BatterTodayStat[] | PitcherTodayStat[]; // 결장 시
}

export interface BatterTodayStat {
  date: string;
  ab: number; h: number; hr: number; rbi: number; bb: number; so: number;
  avg: number; ops: number;
}

export interface PitcherTodayStat {
  date: string;
  ip: number; er: number; k: number; bb: number; h: number;
  era: number; whip: number;
}

// F2: 전성기
export interface PrimeSeason {
  year: number;
  metric: "WAR" | "ERA" | "OPS";            // 어떤 지표로 선정됐는지
  value: number;
  rookieFlag: boolean;                       // 3년 미만 신인이면 true
  highlights: { kpi: string; value: string }[]; // ["WAR 8.2", "OPS 1.067", "30-30 클럽"]
  rank?: { metric: string; rankInLeague: number }; // 리그 순위 (있으면)
}

// F3: 뉴스
export interface NewsClip {
  title: string;                             // HTML 태그 제거됨
  publisher: string;                         // "스포츠동아"
  date: string;                              // "2024-09-28"
  url: string;
}

// F4: 서사
export interface NarrativeEvent {
  year: number;
  text: string;                              // "광주 동성고 → KIA 1차 지명"
  source: "namu" | "kbo" | "user";
  sourceUrl?: string;
}

// F5 + F6: 블로그 초안
export interface Storybook {
  player: Pick<Player, "id" | "name" | "teamCode" | "position" | "isPitcher">;
  generatedAt: string;
  today: TodayPerformance;
  prime: PrimeSeason | null;                 // 데이터 부족 시 null
  news: NewsClip[];
  narrative: NarrativeEvent[];
  draft: {
    markdown: string;                        // 1500~2500자
    charCount: number;
    imageSlots: ImageSlot[];                 // 3개 placeholder 위치
  };
  imagePool: string[];                       // ["/assets/baseball/0E0TLuZL.jpeg", ...]
}

export interface ImageSlot {
  index: 1 | 2 | 3;
  placeholder: string;                       // "<!-- IMG_SLOT_1 -->"
  suggestedSection: "today" | "prime" | "narrative";
}
```

### 1.2 M3~M7 Service 시그니처

```typescript
// M3 today.ts
export async function buildToday(playerId: string, date: string): Promise<TodayPerformance>;

// M4 prime.ts — 순수 함수 (no I/O, 100% testable)
export function detectPrimeSeason(
  seasons: SeasonRecord[],
  isPitcher: boolean
): PrimeSeason | null;

// M5 news.ts
export async function fetchNewsClips(
  playerName: string,
  yearRange: { from: number; to: number },
  options?: { limit?: number; useCache?: boolean }
): Promise<NewsClip[]>;

// M6 narrative.ts
export async function buildNarrative(
  player: Pick<Player, "name" | "id">
): Promise<NarrativeEvent[]>;

// M7 draft.ts — 순수 함수
export function buildDraft(input: {
  player: Storybook["player"];
  today: TodayPerformance;
  prime: PrimeSeason | null;
  news: NewsClip[];
  narrative: NarrativeEvent[];
}): Storybook["draft"];
```

---

## 2. 핵심 알고리즘: 전성기 자동 감지 (M4 prime.ts)

### 2.1 입력

```typescript
interface SeasonRecord {
  year: number;
  war?: number;
  ops?: number;
  avg?: number;
  era?: number;
  fip?: number;
  hr?: number; sb?: number; rbi?: number; // 타자
  k?: number; ip?: number;                 // 투수
  rankInLeague?: { metric: string; rank: number };
}
```

### 2.2 결정 트리

```
1. seasons.length < 3 → return { rookieFlag: true, year: 최신 시즌, metric: 가장 두드러진 지표 }

2. isPitcher === true:
   a. WAR 데이터 모든 시즌에 있음 → max(war) 시즌 선정, metric="WAR"
   b. WAR 결손 → min(era) 시즌 선정 (단 ip ≥ 100 필터), metric="ERA"
   c. 둘 다 결손 → 최신 시즌 fallback + rookieFlag=true

3. isPitcher === false (타자):
   a. WAR 있음 → max(war) 시즌, metric="WAR"
   b. WAR 결손 → max(ops) 시즌 (단 ab ≥ 100 필터), metric="OPS"
   c. 동률 (WAR 차이 < 0.1) → ops 더 높은 쪽 → 그것도 동률이면 더 최근 연도

4. highlights 자동 추출:
   - 30-30 (HR ≥ 30 AND SB ≥ 30): "30-30 클럽"
   - 40-40 (HR ≥ 40 AND SB ≥ 40): "역대급 40-40"
   - 4할: AVG ≥ 0.4 → "신드롬 시즌"
   - 200K (투수): K ≥ 200 → "탈삼진 머신"
   - rankInLeague.rank === 1 → "리그 {metric} 1위"
   - 항상 max 3개
```

### 2.3 동률 처리 명시적 케이스

```typescript
// 동률 = WAR 차이 < 0.1
// 예: 2023 WAR 7.1 vs 2024 WAR 7.15 → 2024 선택
// 둘 다 정확히 7.10 → OPS 비교 → 그것도 같으면 더 최근 연도
```

### 2.4 테스트 케이스 (15+개)

| # | 입력 | 기대 |
|---|------|------|
| T1 | 3년 미만, WAR 데이터 있음 | rookieFlag: true |
| T2 | 타자, WAR 최고 시즌 명확 | WAR로 선정 |
| T3 | 타자, WAR 동률 (0.05 차이) | OPS로 타이브레이크 |
| T4 | 타자, WAR/OPS 모두 동률 | 더 최근 연도 |
| T5 | 투수, WAR 결손 | ERA로 fallback (ip ≥ 100 조건) |
| T6 | 투수, IP < 100 시즌만 있음 | 최신 시즌 + rookieFlag |
| T7 | 30-30 시즌 | highlights에 "30-30 클럽" 포함 |
| T8 | 40-40 시즌 | "역대급 40-40" |
| T9 | 4할 타자 | "신드롬 시즌" |
| T10 | 200K 투수 | "탈삼진 머신" |
| T11 | 리그 WAR 1위 | "리그 WAR 1위" |
| T12 | highlights 4개+ 후보 | max 3개로 절단 |
| T13 | 빈 배열 | null |
| T14 | 단일 시즌 | rookieFlag + 그 시즌 |
| T15 | WAR 음수 | 양수 중 max, 양수 없으면 0에 가까운 max |

---

## 3. 블로그 마크다운 템플릿 (M7 draft.ts)

### 3.1 마스터 템플릿

```markdown
# {playerName}, {oneLineHook}

<!-- IMG_SLOT_1 -->

## 오늘의 경기

{today.played
  ? `${today.date} vs ${today.vs.teamName}. ${batterOrPitcherStatLine}.
     시즌 ${metric} ${today.seasonTrend.before} → ${today.seasonTrend.after}.`
  : `${today.date} 경기에는 결장. 최근 5경기는 ${recent5Summary}.`}

{multiHitNote OR pitcherQualityNote}

---

## 다시 보는 전성기 — {prime.year}시즌

<!-- IMG_SLOT_2 -->

{prime.rookieFlag
  ? `${playerName}은 데뷔 ${seasonCount}년차로 아직 전성기를 향해 가는 중이다.
     ${currentSeasonHighlight}로 가능성을 보여주고 있다.`
  : `${prime.year}년 ${playerName}은 ${primeStatLine}.
     ${prime.highlights.map(h => h).join(" · ")}는 그 해의 상징적 기록이다.`}

{newsQuoteBlock(top2NewsClips)}

---

## {playerName}의 길

<!-- IMG_SLOT_3 -->

{narrative.map(e => `- **${e.year}**: ${e.text}`).join("\n")}

---

## 마무리 — 다음 경기 관전 포인트

{nextGameHint OR currentSeasonOutlook}

---

> *본 글은 데이터 기반 자동 생성 초안입니다. 인용 출처는 본문 링크를 참조하세요.*
```

### 3.2 헬퍼 함수 (draft.ts 내부)

```typescript
function oneLineHook(today: TodayPerformance, prime: PrimeSeason | null): string;
// 예: "4타수 3안타 1홈런 — 5월의 황태자"
//     "결장하고도 빛난 이름"
//     "복귀 첫 등판, 5이닝 무실점"

function batterStatLine(b: BatterTodayStat): string;
// 예: "4타수 3안타 1홈런 3타점"

function pitcherStatLine(p: PitcherTodayStat): string;
// 예: "5이닝 1자책 7K 2BB"

function newsQuoteBlock(clips: NewsClip[]): string;
// 예: "> ([출처](url)) {publisher} {date} — \"{title}\""

function recent5Summary(records: BatterTodayStat[]): string;
// 예: "타율 0.350 (20타수 7안타), 홈런 2개"
```

### 3.3 글자 수 검증

빌드 후 `markdown.length` 가 1500~2500 범위 밖이면:
- 1500 미만 → narrative 이벤트 자세히 풀어 쓰기 (year + text 추가 설명)
- 2500 초과 → highlights 1개로 축약 + news 1개로 축약

검증 함수: `validateDraftLength(md: string): { ok: boolean; reason?: string }`.

---

## 4. 네이버 뉴스 검색 쿼리 전략 (M5 news.ts)

### 4.1 검색 쿼리 패턴

```typescript
// Primary: 선수명 + 전성기 시즌 연도 키워드
const primary = `"${playerName}" ${prime.year}`;

// 결과 부족 시 (< 5건) Fallback:
const fallback1 = `${playerName} 활약`;  // 더 넓은 검색
const fallback2 = `${playerName} 인터뷰`;
```

### 4.2 호출 파라미터

```http
GET https://openapi.naver.com/v1/search/news.json
  ?query={encoded query}
  &display=20
  &start=1
  &sort=sim  ← 정확도 우선 (date 정렬 시 최신 잡문 우려)
Headers:
  X-Naver-Client-Id: {NAVER_NEWS_CLIENT_ID}
  X-Naver-Client-Secret: {NAVER_NEWS_CLIENT_SECRET}
```

### 4.3 결과 필터링

```typescript
const BLOCK_KEYWORDS = ["음주", "음주운전", "스캔들", "폭행", "성범죄", "도박", "마약"];
const PREFERRED_PUBLISHERS = ["스포츠동아", "스포츠경향", "마이데일리", "OSEN", "엑스포츠뉴스"];

function filterClips(raw: NaverNewsItem[]): NewsClip[] {
  return raw
    .filter(item => !BLOCK_KEYWORDS.some(kw => item.title.includes(kw) || item.description.includes(kw)))
    .map(stripHtmlTags)
    .map(item => ({
      title: item.title,
      publisher: extractPublisher(item.originallink),
      date: parsePubDate(item.pubDate),                  // "Sat, 28 Sep 2024..." → "2024-09-28"
      url: item.originallink || item.link,
    }))
    .sort((a, b) => {
      const aPref = PREFERRED_PUBLISHERS.indexOf(a.publisher);
      const bPref = PREFERRED_PUBLISHERS.indexOf(b.publisher);
      if (aPref !== -1 && bPref === -1) return -1;
      if (bPref !== -1 && aPref === -1) return 1;
      return 0;                                          // 그 외는 sim 순서 유지
    })
    .slice(0, 10);
}
```

### 4.4 캐시 키 & TTL

- 키: `news:${playerName}:${prime.year}`
- TTL: 7일
- 위치: `data/storybook/cache/news/{key}.json`
- 형식: `{ cachedAt: ISO, clips: NewsClip[] }`

---

## 5. 나무위키 정제 셀렉터 (M6 narrative.ts)

### 5.1 fetch 전략

```typescript
// 1차: 나무위키
const namuUrl = `https://namu.wiki/w/${encodeURIComponent(playerName)}`;
// 차단/구조변경 위험. 2차 fallback 필수.

// 2차: KBO 공식 선수페이지
const kboUrl = `https://www.koreabaseball.com/Player/Result.aspx?playerId=${playerId}`;
```

### 5.2 나무위키 정제 알고리즘

나무위키 페이지 구조 → 타임라인 변환:

```typescript
// 1. cheerio로 HTML 파싱
// 2. h2 헤딩 텍스트가 다음 중 하나면 그 섹션의 첫 paragraph 추출:
const SECTIONS = ["선수 경력", "프로 입단 전", "아마추어 시절", "고등학교", "프로 데뷔", "{N}년 시즌"];

// 3. 연도 정규식 매칭:
const YEAR_RE = /(\d{4})년/g;

// 4. 각 매칭마다:
//    - 연도 추출
//    - 그 문장(.) 또는 인근 문장 1개
//    - text 길이 100자로 제한

// 5. 결과 정렬 (year asc) + 중복 제거 (같은 year의 첫 항목 유지)

// 6. max 10개 events
```

### 5.3 폴백 처리

| 케이스 | 동작 |
|--------|------|
| 나무위키 404 | KBO 공식 fetch |
| 나무위키 차단 (403/429) | 30일 캐시 hit 시 캐시 사용 / miss 시 KBO |
| KBO도 실패 | `[]` 반환 + UI에 "선수 서사 자료가 충분하지 않습니다. 직접 보충해주세요." 안내 |
| events.length < 3 | 사용자 보충 안내 추가 |

### 5.4 캐시

- 키: `narrative:${playerId}`
- TTL: 30일
- 위치: `data/storybook/cache/narrative/{playerId}.json`

---

## 6. UI 와이어프레임 (M8 ui)

### 6.1 페이지: `/storybook` (또는 `/storybook?player=78529`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Storybook — 블로그 초안 빌더                          [홈으로]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔍 [김도영               ] [생성하기]   ← 검색창 + 버튼          │
│                                                                  │
│  최근 사용: 김도영 · 나성범 · 이의리  ← 사이드: localStorage 캐시 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
   ↓ 생성하기 클릭 후 ↓ (로딩 스피너 2~5초)

┌─────────────────────────────────┬──────────────────────────────┐
│  📊 결과 패널 (4섹션)            │  🖼️ 이미지 풀 (26장)         │
│                                  │                              │
│  ┌─────────────────────────────┐ │  ┌────┬────┬────┐            │
│  │ 1. 오늘의 경기 (F1)         │ │  │ 📷 │ 📷 │ 📷 │            │
│  │   김도영, 4타수 3안타 ...   │ │  ├────┼────┼────┤            │
│  └─────────────────────────────┘ │  │ 📷 │ 📷 │ 📷 │            │
│                                  │  ├────┼────┼────┤            │
│  ┌─────────────────────────────┐ │  │ ...                       │
│  │ 2. 전성기 — 2024 시즌 (F2)  │ │  └────┴────┴────┘            │
│  │   WAR 8.2 · OPS 1.067 ...   │ │                              │
│  └─────────────────────────────┘ │  슬롯 1 [비어있음] (선택)    │
│                                  │  슬롯 2 [📷 BHr7Rlam]        │
│  ┌─────────────────────────────┐ │  슬롯 3 [비어있음]           │
│  │ 3. 과거 뉴스 (F3) 5건       │ │                              │
│  │   • 2024-09-28 스포츠동아   │ │  이미지 클릭 → 첫 빈 슬롯에   │
│  │   • 2024-10-05 ...          │ │  자동 채움                   │
│  └─────────────────────────────┘ │                              │
│                                  │                              │
│  ┌─────────────────────────────┐ │                              │
│  │ 4. 선수 서사 (F4) 8개       │ │                              │
│  │   2022 → 광주 동성고 ...   │ │                              │
│  └─────────────────────────────┘ │                              │
│                                  │                              │
└──────────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📝 블로그 초안 마크다운 미리보기 (1820자)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ # 김도영, 4타수 3안타 1홈런 — 5월의 황태자                │   │
│  │                                                            │   │
│  │ ![](https://.../BHr7Rlam.jpeg)  ← IMG_SLOT_1 자동삽입됨   │   │
│  │                                                            │   │
│  │ ## 오늘의 경기                                             │   │
│  │ 2026-05-11 vs LG. 4타수 3안타 ...                         │   │
│  │ ...                                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [📋 복사]  [⬇ .md 다운로드]  [🔄 재생성]                       │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 모바일 (375px)

- 1열 레이아웃
- 이미지 풀은 4섹션 아래로 이동
- 마크다운 미리보기는 접기/펴기 토글

### 6.3 컴포넌트 트리

```
app/storybook/page.tsx
└── components/storybook/
    ├── PlayerSearchBox.tsx        검색·최근 사용 표시
    ├── ResultPanel.tsx              4섹션 컨테이너
    │   ├── TodaySection.tsx
    │   ├── PrimeSection.tsx
    │   ├── NewsSection.tsx
    │   └── NarrativeSection.tsx
    ├── ImageGallery.tsx             3열 grid + 슬롯 상태
    ├── DraftPreview.tsx             marked.js로 markdown→HTML
    └── DraftActions.tsx             복사·다운로드·재생성 버튼
```

---

## 7. API 시그니처 (M8 api route)

### 7.1 메인 엔드포인트

```http
GET /api/storybook/[id]?date=YYYY-MM-DD
```

**Path params**:
- `id`: 선수 ID (예: `78529` for 김도영)

**Query params**:
- `date` (선택): 기본값은 KST 오늘. 과거 경기 데이터 생성 가능.

**Response 200**:
```json
{
  "player": { "id": "78529", "name": "김도영", "teamCode": "KIA", "position": "3B", "isPitcher": false },
  "generatedAt": "2026-05-11T18:30:00+09:00",
  "today": { ... },
  "prime": { ... },
  "news": [...],
  "narrative": [...],
  "draft": {
    "markdown": "# 김도영, ...",
    "charCount": 1820,
    "imageSlots": [
      { "index": 1, "placeholder": "<!-- IMG_SLOT_1 -->", "suggestedSection": "today" },
      ...
    ]
  },
  "imagePool": ["/assets/baseball/0E0TLuZL.jpeg", ...]
}
```

**Response 404**: `{ "error": "PLAYER_NOT_FOUND" }`
**Response 422**: `{ "error": "NOT_KIA_PLAYER", "message": "Phase 1은 KIA 선수만 지원합니다." }`
**Response 503**: 부분 실패 시 `{ ...success fields, "errors": ["news_failed", "narrative_failed"] }` (200 with partial data)

### 7.2 부차 엔드포인트

```http
GET /api/storybook/kia-players       ← KIA 선수 목록 (검색 자동완성용)
```

Response:
```json
{ "players": [{ "id": "78529", "name": "김도영", "position": "3B", "isPitcher": false }, ...] }
```

### 7.3 캐시 헤더

```typescript
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  },
});
```

---

## 8. 데이터 흐름 시퀀스 다이어그램

```
User                UI               API                Service           Cache         External
 │                   │                 │                    │                │              │
 │ 검색→생성하기      │                 │                    │                │              │
 ├──────────────────►│                 │                    │                │              │
 │                   │ GET /api/...    │                    │                │              │
 │                   ├────────────────►│                    │                │              │
 │                   │                 │ Promise.all([      │                │              │
 │                   │                 │   buildToday,      │                │              │
 │                   │                 │   detectPrime,     │                │              │
 │                   │                 │   fetchNews,       │                │              │
 │                   │                 │   buildNarrative   │                │              │
 │                   │                 │ ])                 │                │              │
 │                   │                 ├───────────────────►│                │              │
 │                   │                 │                    │ readCache?     │              │
 │                   │                 │                    ├───────────────►│              │
 │                   │                 │                    │ miss → fetch   │              │
 │                   │                 │                    ├──────────────────────────────►│
 │                   │                 │                    │◄─────────────────────────────│
 │                   │                 │                    │ writeCache     │              │
 │                   │                 │                    ├───────────────►│              │
 │                   │                 │                    │                │              │
 │                   │                 │ buildDraft(...)    │                │              │
 │                   │                 ├───────────────────►│                │              │
 │                   │                 │◄───────────────────│ Storybook      │              │
 │                   │◄────────────────│ 200 OK             │                │              │
 │                   │                 │                    │                │              │
 │  4섹션 + 갤러리   │                 │                    │                │              │
 │◄──────────────────│                 │                    │                │              │
```

---

## 9. 에러 처리 & 부분 실패

| 영역 | 실패 시 동작 | UI 표시 |
|------|------------|---------|
| today | 빈 객체 + `played: false` | "오늘 경기 데이터 없음" |
| prime | `null` | "전성기 데이터 부족 — 신인이거나 자료 미수집" |
| news | 빈 배열 | "관련 뉴스 검색 결과 없음" |
| narrative | 빈 배열 | "선수 서사 자료 수집 실패 — 직접 보충해주세요" |
| draft | 항상 생성 시도 (위 부분 데이터로) | "데이터 일부 누락. 초안 검토 후 보완 필요" 경고 |
| 전체 (예: DB 손상) | 500 + Sentry | "잠시 후 다시 시도" 토스트 |

**핵심 원칙**: 부분 실패는 200 OK + `errors[]` 배열로 반환. 사용자가 일부 자료라도 활용 가능.

---

## 10. 빌드/배포 변경사항

### 10.1 package.json scripts 추가

```json
{
  "scripts": {
    "prebuild": "node scripts/copy-baseball-assets.mjs && pnpm crawl:kia-roster",
    "crawl:kia-roster": "tsx scripts/crawler/kia-roster.ts",
    "storybook:test": "vitest run src/services/storybook"
  }
}
```

### 10.2 scripts/copy-baseball-assets.mjs (신규)

```javascript
import { cp, mkdir, readdir } from "fs/promises";
import { join } from "path";

const SRC = "docs/02-design/assets/야구";
const DEST = "public/assets/baseball";

await mkdir(DEST, { recursive: true });
const files = await readdir(SRC);
for (const f of files) {
  if (f.endsWith(".jpeg") || f.endsWith(".jpg") || f.endsWith(".png")) {
    await cp(join(SRC, f), join(DEST, f));
  }
}
console.log(`Copied ${files.length} baseball assets to ${DEST}`);
```

### 10.3 .gitignore 추가

```
data/storybook/cache/
public/assets/baseball/  ← 빌드 산출물 (원본은 docs/에 보존)
```

---

## 11. 코딩 규약 (기존 baseball-fan-dashboard 동일)

- TypeScript strict 모드
- ESLint + Prettier
- 함수 1개 ≤ 50줄 권장
- 순수 함수 우선 (M4 prime, M7 draft)
- I/O는 service 레이어로 격리
- zod로 API 입출력 검증 (특히 외부 fetch 결과)

---

## 12. Out of Scope 재확인

- ❌ LLM 호출 (할루시네이션 + 비용)
- ❌ 자동 블로그 발행 (티스토리/네이버 API)
- ❌ 타구단 (KT/LG/...) — Phase 2
- ❌ 이미지 자동 매칭 (Phase 2)
- ❌ 다국어
- ❌ 인증·과금

---

## 13. 다음 단계

- **Phase: Design ✓**
- **다음 명령**: `/pdca do kia-player-storybook`
- **Do에서 첫 모듈**: M1 domain → M2 kia-roster (스크립트 1회 실행) → M3 today
- **사전 조건**: Naver News API 키 `.env.local` 추가 (M5 시작 전까지만 있으면 됨)

---

**End of Design**
