# baseball-fan-dashboard Design Document

> **Summary**: KBO 야구 카드 대시보드 — Next.js 14 App Router 기반 단일 페이지 SSR + GitHub Actions 크롤러 + JSON 캐시 + 타순별 등급 카드 그리드의 Pragmatic 모듈 아키텍처.
>
> **Project**: 마구마구 편의성앱 (KBO 야구 카드 대시보드)
> **Version**: 0.1.0 (Phase 1 MVP)
> **Author**: Design Agent
> **Date**: 2026-05-09
> **Status**: Draft
> **Planning Doc**: [baseball-fan-dashboard.plan.md](../../01-plan/features/baseball-fan-dashboard.plan.md)
> **PRD**: [baseball-fan-dashboard.prd.md](../../00-pm/baseball-fan-dashboard.prd.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 (Schema) | [docs/01-plan/schema.md](../../01-plan/schema.md) | ❌ (본 문서 §3에 통합) |
| Phase 2 (Conventions) | [docs/01-plan/conventions.md](../../01-plan/conventions.md) | ❌ (본 문서 §10에 통합) |
| Phase 3 (Mockup) | [docs/02-design/mockup/baseball-fan-dashboard.md](../mockup/baseball-fan-dashboard.md) | N/A (Do phase 초입에 컨셉 페이지 1~2장 권장) |
| Phase 4 (API) | [docs/02-design/api/baseball-fan-dashboard.md](../api/baseball-fan-dashboard.md) | ❌ (본 문서 §4에 통합) |

> **Note**: Greenfield 프로젝트로 Schema/Convention/API를 모두 본 Design 문서에 통합합니다. 향후 분리 필요 시 `/phase-N-*` 스킬로 추출하세요.

---

## Context Anchor

> Plan Context Anchor에서 복사. Design→Do→Check→Report 전 단계 전파.

| Key | Value |
|-----|-------|
| **WHY** | KBO 팬이 마이팀 정보 탐색에 3~4탭·5~10분을 쓰는 마찰을 30초 단일 화면 판독으로 제거 |
| **WHO** | Persona B (이수연 유형) — 25~40세 직장인 캐주얼 KBO 팬. 점심·통근·쉬는 시간 모바일로 짧게 확인. 마이팀 우선 + 카드 등급 직관성 선호. |
| **RISK** | R1 크롤링 차단 (20) > R2 라인업 타이밍 (16) > R5 비시즌 DAU (15) > R4 번아웃 (12) > R3 IP 클레임 (10) |
| **SUCCESS** | (1) 크롤러 7일 95%+ (2) 모바일 Lighthouse 80 (3) FCP < 2s (4) hallway test 70%+ "재방문 의향" (5) DAU 500 (배포 후 2주) |
| **SCOPE** | Phase 0 POC → **Phase 1 MVP (본 Design)**: F1 일정 + F2 마이팀 + F3 라인업 카드 + F4 선수 모달 + F5 단일 페이지 + F6 순위 배너 → Phase 2/3 |

---

## Design Anchor (Pencil MCP — Phase 0/Do 초입에 권장)

> Pencil MCP가 활성화되어 있다면 Do phase 시작 전 컨셉 페이지 1~2장 후 `/design-anchor capture baseball-fan-dashboard`로 토큰 잠금 권고.
> File: `docs/02-design/styles/baseball-fan-dashboard.design-anchor.md` (현재 미생성)

| Category | Tokens (제안 — 캡처 후 확정) |
|----------|----------|
| **Colors** | bg-deep: `#0F1320` / bg-card: `#1a1a2e` → `#16213e` (linear 135deg) / text: `#F7F8FA` / muted: `rgba(255,255,255,0.6)` / accent: `#E63946`(레어 빨강) |
| **Grade Colors** | elite: `#7B2FBE` (보라) / rare: `#E63946` (빨강) / special: `#F4A261` (노랑·주황) / normal: `#457B9D` (파랑) |
| **Typography** | `Pretendard Variable` (한글) → fallback `system-ui`. 사이즈: caption 11px / body 13px / heading 16px / display 22px |
| **Spacing** | 4px 단위 grid. card: 100×140 (모바일) / 120×170 (태블릿+) / 섹션 간격 16px / 카드 간격 8px |
| **Radius** | card: 8px / badge: 4px / button: 6px / modal: 16px (top corners) |
| **Tone** | Vintage card-game × neo-fan-dashboard. 절제된 다크 테마 + 등급 색상 글로우만 강조. |
| **Layout** | mobile-first 1-column. 헤더 sticky. 순위 배너 sticky-toggle. 카드 그리드 3열(모바일)/5열(데스크탑). 모달 bottom-sheet (모바일) / center-dialog (데스크탑). |

> ⚠️ **IP 안전**: 위 토큰은 일반적인 다크 카드 게임 UI 패턴이며 마구마구 에셋과 무관함. 컨셉 페이지에서 마구마구 스크린샷을 *시각적 영감*으로만 활용하고 픽셀 단위 모방은 금지.

---

## 1. Overview

### 1.1 Design Goals

1. **30초 판독성**: 마이팀 사용자는 첫 진입 후 30초 안에 (a) 마이팀이 오늘 경기하는지 (b) 선발 라인업 컨디션이 좋은지를 카드 색상만으로 판단할 수 있어야 한다.
2. **그린필드 단순성**: 외부 BaaS·인증·DB 없이 Next.js + JSON 캐시만으로 MVP 완성. 트래픽 증가 시 Supabase 마이그레이션 경로를 열어둠.
3. **크롤링 회복탄력성**: 2개 데이터 소스(KBO + statiz) 병렬 실행, 한 소스 장애가 서비스 중단으로 이어지지 않음. 마지막 성공 캐시는 항상 서빙 가능.
4. **IP 안전**: 코드/UI/메타 어디에도 마구마구·네오위즈·넷마블 문자열 없음(grep CI). 카드 스타일은 일반 다크 게임카드 패턴으로 독자 구현.
5. **모바일 우선**: iPhone SE(375×667) 기준 모든 핵심 정보가 1~2 스크롤 안에 들어옴. 터치 타깃 44×44px 최소.
6. **점진적 확장**: feature 모듈 경계로 Phase 2 기능(공유, WAR, 알림)을 기존 코드 수정 없이 추가할 수 있어야 함.

### 1.2 Design Principles

- **Single Source of Truth**: 등급은 빌드/크론 시점에 한 번 산출되어 JSON에 박아둠. UI는 표시만. 등급 산출 로직 중복 금지.
- **Server is Cache**: Next.js API Route는 비즈니스 로직 0%, JSON 캐시 서빙 + Edge Cache 헤더만. 무거운 작업은 모두 GitHub Actions cron에서 사전 처리.
- **Offline-First UX**: localStorage(마이팀) + SWR stale-while-revalidate로 네트워크 끊겨도 최근 데이터 표시. 오프라인 배지는 명시적으로 표시.
- **Color is Decoration, Text is Truth**: 등급 색상은 보조 신호. 모든 등급에 텍스트 배지(ELITE/RARE/SPECIAL/NORMAL) 병기 (WCAG + 색맹 사용자).
- **No JS Heroics**: 클라이언트 JS 200KB(gzip) 한도. 차트/애니메이션은 CSS만으로 구현, 라이브러리 신중 선택.
- **Fail Loud (in dev), Fail Soft (in prod)**: 개발 환경은 throw + Sentry 강한 알림, 프로덕션은 fallback UI + Discord 알림.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

세 가지 옵션을 비교한 후 Pragmatic Balance를 채택했습니다.

| Criteria | Option A: Minimal | Option B: Clean | **Option C: Pragmatic** |
|----------|:-:|:-:|:-:|
| **Approach** | 단일 라우트(`app/page.tsx`) + lib에 모든 로직 | 4-Layer (Presentation/Application/Domain/Infra) 엄격 분리 + DI | feature 모듈 + 얇은 layer 경계 |
| **New Files** | 12~15 | 50~70 | 28~35 |
| **Modified Files** | N/A (greenfield) | N/A | N/A |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low (한 파일에 다수 책임) | High | High |
| **Effort** | 1~2주 | 5~6주 | 3~4주 |
| **Testability** | Low | Very High | High |
| **확장성 (Phase 2/3)** | 매번 리팩토링 필요 | 좋음 | 좋음 (feature 추가만) |
| **그린필드 적합성** | 빠른 PoC 한정 | 오버엔지 | 적합 |
| **Recommendation** | hotfix·hackathon | 장기 엔터프라이즈 | **MVP 기본 선택 ✅** |

**Selected**: **Option C — Pragmatic Balance**

**Rationale**:
- Plan에서 Project Level을 Dynamic으로 결정했고, MVP 4주 + 점진적 확장 계획에 부합.
- Option A는 등급 산출/크롤러/UI가 같은 파일에 섞여 Phase 2 추가 시 부담. Option B는 4주 일정에 무리 + 단일 페이지 SPA 규모에 과한 추상화.
- Option C는 `features/{도메인}/` 모듈 경계로 Phase 2의 share-card·alerts·favorites 추가가 기존 모듈 수정 없이 가능.
- 4-Layer 대신 **3-Layer** (UI / Service / Data)로 단순화 — Domain은 `types/`로 별도 파일만.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Mobile-first)                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js Client (SWR + localStorage)                         │   │
│  │   ┌─────────────┐  ┌────────────┐  ┌──────────────────┐    │   │
│  │   │ TeamSelect  │  │ Standings  │  │ Schedule         │    │   │
│  │   └─────────────┘  └────────────┘  └──────────────────┘    │   │
│  │   ┌─────────────────────────────┐  ┌──────────────────┐    │   │
│  │   │ LineupGrid (PlayerCard×9)   │  │ PlayerModal      │    │   │
│  │   └─────────────────────────────┘  └──────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (SWR fetch)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge (Next.js App Router)                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  API Routes (Edge Runtime, Cache-Control: s-maxage=600)      │   │
│  │   /api/standings  /api/games  /api/lineup/[team]             │   │
│  │   /api/player/[id]  /api/health                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Static Assets (JSON cache from /data/)                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────▲────────────────────────────────────────┘
                             │ git push → Vercel rebuild
                             │ (or runtime read from /data/*.json)
┌────────────────────────────┴────────────────────────────────────────┐
│                  GitHub Actions Cron (5 workflows)                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  schedule.yml (07:00)  → kbo-crawler → /data/games-{date}.json│   │
│  │  standings.yml (10min) → kbo-crawler → /data/standings.json   │   │
│  │  lineup.yml    (30min) → kbo-crawler → /data/lineups/...      │   │
│  │  stats.yml     (06:00) → statiz-crawler → /data/players/...   │   │
│  │  grades.yml    (06:30) → compute-grades → in-place update     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           ▼ (실패/지연 시)                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Discord Webhook  ←  notify-discord.ts                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       External Data Sources                          │
│  ┌──────────────────────────────────────┐  ┌────────────────────┐   │
│  │  KBO 공식 (koreabaseball.com)         │  │  스탯티즈           │   │
│  │  - 일정 / 순위 / 라인업               │  │  - 시즌 성적        │   │
│  │  - HTML scraping (Cheerio)           │  │  - wRC+ / FIP       │   │
│  └──────────────────────────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

> **No BaaS in MVP**: Plan의 Dynamic level이지만 bkend.ai 대신 JSON 파일 + GitHub Actions를 채택. 인증/실시간 CRUD가 없고 데이터가 모두 외부 크롤링 결과이므로 BaaS 가치가 낮음. Phase 2에서 즐겨찾기·알림 도입 시 Supabase로 마이그레이션.

### 2.2 Data Flow

```
[Cron Trigger]
   │
   ▼
[Crawler Adapter]  (KBO·statiz 병렬, retry 3회, 3~5s delay)
   │  ├─ 성공: 정규화된 도메인 객체 반환
   │  └─ 실패: 마지막 캐시 유지 + Discord 알림
   ▼
[Normalizer]  (raw HTML → typed Domain object)
   │
   ▼
[Compute Grades]  (Player[] + recent 10g stats → Grade)
   │
   ▼
[Persist to /data/*.json]  (git commit + push)
   │
   ▼
[Vercel Auto Deploy or Runtime fs.read]
   │
   ▼
[API Route /api/*]  (Edge Cache 10min)
   │
   ▼
[SWR Client Hook]  (stale-while-revalidate)
   │
   ▼
[React Component]
   │
   ▼
[localStorage]  (마이팀만)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `app/page.tsx` (Dashboard) | features/team-selection, league-standings, game-schedule, lineup-card, player-modal | 단일 페이지 컨테이너 |
| `features/lineup-card` | lib/grade, types/player, lib/api-client | 라인업 카드 그리드 |
| `features/player-modal` | features/lineup-card (트리거), lib/api-client | 카드 클릭 시 상세 모달 |
| `features/team-selection` | lib/storage(localStorage), lib/constants(팀 목록) | 마이팀 선택 UI |
| `lib/grade` | types/stat, lib/constants | 등급 산출 알고리즘 (순수 함수) |
| `lib/api-client` | SWR | 데이터 페칭 |
| `app/api/lineup/[team]` | scripts/crawler 결과(JSON) | 라인업 캐시 서빙 |
| `scripts/crawler/kbo` | cheerio, axios, lib/normalizer | KBO HTML 크롤러 |
| `scripts/crawler/statiz` | cheerio, axios, lib/normalizer | 스탯티즈 크롤러 |
| `scripts/compute-grades` | lib/grade, /data/players/*.json | 매일 오전 등급 일괄 산출 |
| `scripts/notify-discord` | DISCORD_WEBHOOK_URL | 장애 알림 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// types/team.ts
export type TeamCode = 'LG' | 'KT' | 'SSG' | 'NC' | 'KIA' | 'DOOSAN' | 'LOTTE' | 'SAMSUNG' | 'HANWHA' | 'KIWOOM';

export interface Team {
  code: TeamCode;
  name: string;          // "LG 트윈스"
  shortName: string;     // "LG"
  primaryColor: string;  // "#C30452" (팀 컬러 hex)
  logoUrl?: string;      // public/logos/{code}.svg (자체 SVG)
}

// types/player.ts
export type Position =
  | 'P'   // 투수 (선발/불펜 통합)
  | 'C'   // 포수
  | '1B' | '2B' | '3B' | 'SS'
  | 'LF' | 'CF' | 'RF'
  | 'DH';

export type Grade = 'elite' | 'rare' | 'special' | 'normal';

export interface Player {
  id: string;           // KBO 고유 ID (예: "78529")
  name: string;         // "김도영"
  teamCode: TeamCode;
  position: Position;
  uniformNumber?: number;
  photoUrl?: string;    // null이면 PositionAvatar SVG 사용
  isPitcher: boolean;   // P이면 true (등급 산출 분기용)
}

// types/game.ts
export type GameStatus = 'scheduled' | 'in_progress' | 'final' | 'cancelled' | 'postponed';

export interface Game {
  id: string;             // "20260509-LG-KT-1" (date-home-away-doubleheader)
  date: string;           // ISO date "2026-05-09"
  startTime: string;      // "18:30" (KST)
  homeTeam: TeamCode;
  awayTeam: TeamCode;
  stadium: string;        // "잠실" (구장 약칭)
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  doubleHeader?: 1 | 2;   // 1차전/2차전
  cancelReason?: string;  // "우천 취소" 등
}

// types/stat.ts
export interface BatterSeasonStat {
  playerId: string;
  season: number;          // 2026
  games: number;
  ab: number;              // 타수
  hits: number;
  hr: number;
  rbi: number;
  avg: number;             // 0.342
  obp: number;
  slg: number;
  ops: number;
  wrcPlus: number | null;  // 스탯티즈 출처
  updatedAt: string;       // ISO
}

export interface PitcherSeasonStat {
  playerId: string;
  season: number;
  games: number;
  ip: number;              // innings pitched
  era: number;
  fip: number | null;
  whip: number;
  k9: number;
  bb9: number;
  updatedAt: string;
}

export interface RecentGameStat {
  playerId: string;
  date: string;            // 경기 날짜
  // 타자
  ab?: number; hits?: number; hr?: number; rbi?: number; ops?: number;
  // 투수
  ip?: number; er?: number; k?: number; bb?: number; fip?: number;
}

// types/lineup.ts
export interface LineupSlot {
  battingOrder: number;    // 1~9 (지명타자 포함). 투수는 0 또는 별도 필드
  playerId: string;
  position: Position;
  grade: Grade;
  gradePercentile: number; // 0~100, UI 툴팁용
  gradeBasis: string;      // "최근 10경기 wRC+ 백분위 92" (설명용)
}

export interface Lineup {
  gameId: string;
  teamCode: TeamCode;
  startingPitcher: LineupSlot;     // battingOrder=0
  battingOrder: LineupSlot[];      // 9~10명 (DH 포함)
  status: 'confirmed' | 'pending'; // 라인업 미확정 표시용
  fetchedAt: string;
  source: 'kbo' | 'statiz' | 'cache';
}
```

### 3.2 Entity Relationships

```
[Team] 1 ──── N [Player]
   │
   └── 1 ──── N [Game]  (homeTeam | awayTeam)
                │
                └── 1 ──── 2 [Lineup]  (home + away)
                              │
                              └── 1 ──── N [LineupSlot] ──── 1 [Player]

[Player] 1 ──── N [BatterSeasonStat | PitcherSeasonStat]
         1 ──── N [RecentGameStat]
```

### 3.3 Storage Schema (JSON Cache)

> **Why JSON, not DB**: MVP 데이터 사이즈 작음(전체 압축 후 < 5MB), 읽기 전용, Vercel Edge Cache 활용 최적, 배포 = 데이터 갱신 통합. Phase 2에 Supabase 마이그레이션 시 같은 인터페이스 유지.

```
/data/
├── teams.json                     # 10팀 마스터 (정적)
├── players.json                   # 전체 선수 마스터 (~700명)
├── standings.json                 # 현재 순위 (10팀)
├── games/
│   └── {YYYY-MM-DD}.json          # 일자별 경기 목록
├── lineups/
│   └── {YYYY-MM-DD}/
│       └── {teamCode}.json        # 마이팀 + 상대팀 라인업
├── players/
│   └── {playerId}.json            # 시즌·역대·최근 10경기
└── _meta/
    ├── last-crawl.json            # 소스별 마지막 성공/실패 시각
    └── grade-version.json         # 등급 산출 버전 (FAQ 페이지 노출)
```

**파일 명명 규칙**: 모두 kebab-case + UTC가 아닌 KST 날짜 사용. 자정 넘어가는 경기는 시작 시간 기준 일자로 분류.

---

## 4. API Specification

> **No bkend.ai BaaS**: MVP는 Next.js API Routes + JSON 캐시. 모든 GET, 인증 없음. 응답 셰입은 `{ data, error, meta }`로 통일.

### 4.1 Endpoint List

| Method | Path | Description | Cache |
|--------|------|-------------|-------|
| GET | `/api/health` | 헬스체크 + 마지막 크롤 시각 | no-cache |
| GET | `/api/teams` | 10팀 마스터 | s-maxage=86400 (24h) |
| GET | `/api/standings` | 현재 리그 순위 (10팀) | s-maxage=600 (10min) |
| GET | `/api/games?date=YYYY-MM-DD` | 해당 일자 전체 경기 (default=today, KST) | s-maxage=600 |
| GET | `/api/games?range=week` | 이번 주 경기 (월~일) | s-maxage=3600 |
| GET | `/api/games?range=month` | 이번 달 경기 | s-maxage=3600 |
| GET | `/api/lineup/[team]?date=YYYY-MM-DD` | 특정 팀의 특정 일자 라인업 | s-maxage=300 (5min, 라인업 갱신 잦음) |
| GET | `/api/player/[id]` | 선수 시즌·역대·최근 10경기 | s-maxage=3600 (1h) |

### 4.2 Detailed Specification

#### `GET /api/standings`

**Request**: 파라미터 없음

**Response 200 OK**:
```json
{
  "data": [
    {
      "rank": 1,
      "teamCode": "LG",
      "teamName": "LG 트윈스",
      "wins": 28,
      "losses": 17,
      "draws": 1,
      "winPct": 0.622,
      "gamesBehind": 0.0,
      "streak": "W3"
    }
    // ... 9 more
  ],
  "meta": {
    "updatedAt": "2026-05-09T08:30:00+09:00",
    "source": "kbo"
  },
  "error": null
}
```

**Error 503 Service Unavailable** (모든 캐시 만료 + 크롤러 실패):
```json
{
  "data": null,
  "error": {
    "code": "STALE_CACHE",
    "message": "데이터 갱신이 지연되고 있습니다. 마지막 업데이트: 12시간 전",
    "details": { "lastSuccess": "2026-05-08T20:00:00+09:00" }
  },
  "meta": { "fallback": "stale-cache" }
}
```

#### `GET /api/games?date=2026-05-09`

**Request Query**:
- `date` (optional): `YYYY-MM-DD`. default = today KST
- `range` (optional): `week` | `month`. date 무시.

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "20260509-LG-KT-1",
      "date": "2026-05-09",
      "startTime": "18:30",
      "homeTeam": "LG",
      "awayTeam": "KT",
      "stadium": "잠실",
      "status": "scheduled",
      "homeScore": null,
      "awayScore": null
    }
    // ... up to 5 games per day
  ],
  "meta": { "updatedAt": "...", "totalGames": 5 },
  "error": null
}
```

#### `GET /api/lineup/[team]?date=2026-05-09`

**Request Path**: `team` = TeamCode (LG, KT, ...)
**Request Query**: `date` (optional, default=today KST)

**Response 200 OK (라인업 확정)**:
```json
{
  "data": {
    "gameId": "20260509-LG-KT-1",
    "teamCode": "LG",
    "startingPitcher": {
      "battingOrder": 0,
      "playerId": "60100",
      "position": "P",
      "grade": "rare",
      "gradePercentile": 78,
      "gradeBasis": "최근 10등판 FIP 백분위 78 (3.21)"
    },
    "battingOrder": [
      { "battingOrder": 1, "playerId": "78529", "position": "3B", "grade": "elite", "gradePercentile": 95, "gradeBasis": "..." },
      // ... 8 more
    ],
    "status": "confirmed",
    "fetchedAt": "2026-05-09T17:30:00+09:00",
    "source": "kbo"
  },
  "meta": {},
  "error": null
}
```

**Response 200 OK (라인업 미확정)**:
```json
{
  "data": {
    "gameId": "20260509-LG-KT-1",
    "teamCode": "LG",
    "startingPitcher": null,
    "battingOrder": [],
    "status": "pending",
    "fetchedAt": "2026-05-09T15:00:00+09:00",
    "source": "kbo"
  },
  "meta": { "expectedAt": "2026-05-09T17:00:00+09:00" },
  "error": null
}
```

**Response 404 Not Found** (해당 팀이 해당 일자에 경기 없음):
```json
{ "data": null, "error": { "code": "NO_GAME", "message": "해당 일자에 경기가 없습니다." } }
```

#### `GET /api/player/[id]`

**Response 200 OK**:
```json
{
  "data": {
    "player": {
      "id": "78529",
      "name": "김도영",
      "teamCode": "KIA",
      "position": "3B",
      "uniformNumber": 7,
      "isPitcher": false
    },
    "currentSeason": {
      "season": 2026,
      "games": 38,
      "ab": 145,
      "hits": 51,
      "hr": 9,
      "rbi": 28,
      "avg": 0.352,
      "obp": 0.421,
      "slg": 0.621,
      "ops": 1.042,
      "wrcPlus": 178
    },
    "careerSeasons": [
      { "season": 2025, "ops": 0.945, "wrcPlus": 152, "games": 141 },
      { "season": 2024, "ops": 0.978, "wrcPlus": 165, "games": 144 }
      // ...
    ],
    "recentTen": [
      { "date": "2026-05-08", "ab": 4, "hits": 2, "hr": 1, "rbi": 2, "ops": 1.250 },
      // ... 9 more
    ],
    "currentGrade": { "grade": "elite", "percentile": 95, "basis": "최근 10경기 wRC+ 195" }
  },
  "error": null
}
```

### 4.3 Common Response Shape

모든 응답은 다음 셰입을 따릅니다:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;        // 한국어, 사용자에게 표시 가능
    details?: unknown;
  } | null;
  meta?: {
    updatedAt?: string;
    source?: 'kbo' | 'statiz' | 'cache';
    fallback?: 'stale-cache';
    [key: string]: unknown;
  };
}
```

**Error Codes 정의** (§6에서 상세):
- `STALE_CACHE` — 캐시 만료 + 크롤러 실패 (503)
- `NO_GAME` — 해당 조건에 경기 없음 (404)
- `PLAYER_NOT_FOUND` — 선수 ID 없음 (404)
- `INVALID_TEAM` — 팀 코드 잘못됨 (400)
- `INVALID_DATE` — 날짜 형식 잘못됨 (400)
- `INTERNAL` — 내부 에러 (500, Sentry 자동 전송)

---

## 5. UI/UX Design

### 5.1 Screen Layout

#### 모바일 (375px 기준)

```
┌──────────────────────────────────────┐
│ [☰] KBO 카드 대시보드     [⚙️] [LG]  │ ← Sticky 헤더 (48px)
├──────────────────────────────────────┤
│ ▼ 리그 순위 (접힘 가능)              │
│ 1.LG 28-17  2.KT 24-18 ... [v 펼침] │ ← Standings Banner (collapsed: 32px)
├──────────────────────────────────────┤
│ 오늘 [이번 주] [이번 달]              │
│ ┌────────────────────────────────┐   │
│ │ 18:30  LG vs KT  잠실  ●예정    │   │
│ │ 14:00  KIA vs SSG 광주  완료6:3 │   │ ← Schedule (~120px)
│ │ ...                            │   │
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│ ▼ 마이팀 라인업 (LG)  vs KT  18:30   │
│ ┌─────────┐                          │
│ │ ELITE   │  ← Starting Pitcher Card │
│ │ [P]     │     (full width 320px)   │
│ │ 손주영  │                          │
│ │ FIP 2.84│                          │
│ └─────────┘                          │
│ ┌──────┐┌──────┐┌──────┐             │
│ │RARE 1││ELITE2││NORM 3│             │ ← Batting Cards (3열×3행)
│ │ 3B   ││ SS   ││ CF   │     100×140 │
│ │김도영 ││오스틴││홍창기│              │
│ │OPS.95││OPS.92││OPS.71│             │
│ └──────┘└──────┘└──────┘             │
│ ... (총 9~10장)                      │
├──────────────────────────────────────┤
│ © 2026 — KBO 공식 아님 / 비상업       │ ← Footer (40px)
└──────────────────────────────────────┘

[모달: PlayerModal — bottom sheet]
```

#### 데스크탑 (≥1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] KBO 카드 대시보드                              [⚙ 설정] [LG ▾]  │
├────────────────────────────────────────────────────────────────────────┤
│ Standings: 1.LG 2.KT 3.SSG 4.NC ... (한 줄 가로 스크롤 가능)            │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 오늘 경기 (좌측 30%)      │ 마이팀 라인업 (우측 70%)                    │
│  18:30 LG-KT 잠실 [●예정] │  ┌───────────────────────────────────────┐ │
│  14:00 KIA-SSG 광주 6:3   │  │  P: 손주영 (RARE, FIP 2.84)            │ │
│  17:00 NC-한화 창원       │  └───────────────────────────────────────┘ │
│  ...                      │  ┌───┐┌───┐┌───┐┌───┐┌───┐               │ │
│                           │  │ 1 ││ 2 ││ 3 ││ 4 ││ 5 │ (5열×2행)      │ │
│                           │  └───┘└───┘└───┘└───┘└───┘               │ │
│                           │  ┌───┐┌───┐┌───┐┌───┐                    │ │
│                           │  │ 6 ││ 7 ││ 8 ││ 9 │                    │ │
│                           │  └───┘└───┘└───┘└───┘                    │ │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### 5.2 User Flow

```
[첫 방문]
URL 접속
  ├─ localStorage.myteam 있음?
  │    YES ▶ 마이팀 대시보드 (Standings + Today + Lineup) 즉시 표시
  │    NO  ▶ 팀 선택 화면 (10팀 그리드, 한 화면)
  │           └─ 팀 클릭 ▶ localStorage 저장 ▶ 대시보드 전환 (no reload)
  ▼
[대시보드 사용]
순위 배너 토글 ▶ 펼침/접힘 (높이 절약)
일정 탭 클릭   ▶ 오늘/이번 주/이번 달 전환 (URL 쿼리 갱신)
카드 클릭     ▶ PlayerModal 슬라이드업
              ▶ 시즌 탭 / 역대 탭 전환
              ▶ X·배경·Escape·스와이프다운 ▶ 닫기
새로고침 버튼 ▶ SWR 재검증 트리거
설정 (마이팀) ▶ 팀 변경 화면 ▶ localStorage 갱신 ▶ 대시보드 즉시 갱신
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `Header` | `components/layout/Header.tsx` | sticky 헤더, 로고, 마이팀 배지, 설정 버튼 |
| `Footer` | `components/layout/Footer.tsx` | 법적 면책 고지(R3 IP 완화), GitHub 링크 |
| `TeamSelectionScreen` | `features/team-selection/TeamSelectionScreen.tsx` | 첫 방문 10팀 선택 + localStorage 저장 |
| `MyTeamSettings` | `features/team-selection/MyTeamSettings.tsx` | 헤더 ⚙ 클릭 시 팀 변경/초기화 모달 |
| `StandingsBanner` | `features/league-standings/StandingsBanner.tsx` | 10팀 순위 배너, 마이팀 하이라이트, 토글 |
| `ScheduleTabs` | `features/game-schedule/ScheduleTabs.tsx` | 오늘/이번 주/이번 달 탭 |
| `ScheduleList` | `features/game-schedule/ScheduleList.tsx` | 경기 목록 카드, 더블헤더·취소 처리 |
| `LineupSection` | `features/lineup-card/LineupSection.tsx` | 마이팀 라인업 컨테이너 (헤더 + 그리드 + placeholder) |
| `PlayerCard` | `features/lineup-card/PlayerCard.tsx` | 단일 카드 (등급 색상, 글로우, 이름, 스탯) |
| `LineupGrid` | `features/lineup-card/LineupGrid.tsx` | 9~10장 카드 그리드 (모바일 3열/데스크 5열) |
| `LineupPlaceholder` | `features/lineup-card/LineupPlaceholder.tsx` | 라인업 미확정 시 뿌연 placeholder + 새로고침 |
| `PlayerModal` | `features/player-modal/PlayerModal.tsx` | bottom-sheet/dialog 모달 |
| `SeasonStatTab` | `features/player-modal/SeasonStatTab.tsx` | 시즌 성적 표 + 최근 10경기 스파크라인 |
| `CareerStatTab` | `features/player-modal/CareerStatTab.tsx` | 역대 시즌 테이블 (5시즌 + "전체" 토글) |
| `MiniSparkline` | `components/ui/MiniSparkline.tsx` | 최근 10경기 막대 (CSS만, 라이브러리 X) |
| `GradeBadge` | `components/ui/GradeBadge.tsx` | ELITE/RARE/SPECIAL/NORMAL 텍스트 배지 |
| `OfflineBanner` | `components/layout/OfflineBanner.tsx` | localStorage 비활성화/캐시 만료 안내 |
| `ToastProvider` | `components/ui/Toast.tsx` | 새로고침 결과·에러 toast |

### 5.4 Page UI Checklist (Gap Detector 검증 대상)

> 본 체크리스트는 Phase Check(gap-detector)에서 *반드시* 한 항목씩 코드 존재 여부를 검사합니다. 누락 항목은 Critical로 카운트.

#### Page 1: Team Selection Screen (첫 방문 전용)

- [ ] Heading: "응원하는 팀을 선택해주세요" (h1)
- [ ] Grid: 10팀 버튼 (2열 모바일 / 5열 데스크탑) — 각 버튼은 팀 로고(또는 SVG) + 팀 약칭(예: "LG")
- [ ] Touch target: 각 팀 버튼 ≥ 88×88px (44px 최소 + 여백)
- [ ] Behavior: 팀 클릭 시 즉시 dashboard로 전환 (페이지 새로고침 없음, history.pushState)
- [ ] Side effect: `localStorage.setItem('baseball_myteam', '<TeamCode>')` 호출
- [ ] Skip: "그냥 둘러보기" 텍스트 링크 (마이팀 없이 전체 뷰)

#### Page 2: Dashboard (메인)

- [ ] Header: 로고 + "KBO 카드 대시보드" 타이틀 + 마이팀 배지(팀 컬러) + ⚙ 설정 아이콘 버튼 (44×44px)
- [ ] Standings Banner: 10팀 순위 (rank, 약칭, W-L, GB), 마이팀은 강조 색상 보더, 토글 펼침/접힘 화살표
- [ ] Standings 데이터: rank 1~10, wins, losses, gamesBehind 수치 표시
- [ ] Schedule Tabs: "오늘" / "이번 주" / "이번 달" 3개 탭, active 탭 강조
- [ ] Schedule List: 각 경기는 시간 + 홈팀-원정팀 + 구장 + 상태 배지(예정/진행 중/완료/취소) 표시
- [ ] Schedule 마이팀 강조: 마이팀 경기 카드는 팀 컬러 보더 + 배경 살짝 강조
- [ ] Schedule 완료 경기: 최종 스코어 표시 (예: "LG 5 - 3 KT")
- [ ] Schedule 취소: "우천 취소" 텍스트 + 회색 처리
- [ ] Schedule 더블헤더: "DH1" / "DH2" 레이블 표시
- [ ] Lineup Section Header: "마이팀 라인업" + "vs <상대팀>" + 경기 시작 시간 + 라인업 갱신 시각
- [ ] Lineup — Starting Pitcher: 별도 가로 폭 큰 카드 (full width 모바일 / 좌측 데스크탑)
- [ ] Lineup — Batting Cards: 9~10장 카드, 타순 1~9 표시 (DH 포함 시 10)
- [ ] Each PlayerCard: 등급 텍스트 배지 (ELITE/RARE/SPECIAL/NORMAL), 타순 번호, 선수 사진 또는 포지션 SVG, 한글 이름, 포지션 약칭, 대표 스탯 1개 (타자: OPS, 투수: ERA·FIP)
- [ ] Each PlayerCard 보더: 등급별 색상 (보라/빨강/노랑/파랑)
- [ ] PlayerCard 글로우: ELITE/RARE/SPECIAL은 box-shadow glow (NORMAL 제외)
- [ ] Lineup Placeholder (미확정): 9장 흐린 placeholder + "라인업 미확정 — 경기 시작 2시간 전 공개 예정" 텍스트 + 새로고침 버튼
- [ ] Lineup 갱신 버튼: SWR mutate 호출, 클릭 시 로딩 인디케이터
- [ ] Footer: "© 2026 / KBO 공식 서비스 아님 / 비상업적 팬 프로젝트 / GitHub 링크"
- [ ] Footer 면책: "네오위즈·넷마블의 마구마구와 무관" — *참고: 코드/UI에 "마구마구" 단어 사용 금지지만, 면책 고지에는 유일하게 허용 (법적 명확성). grep CI에서 footer만 화이트리스트.*

#### Page 3: PlayerModal

- [ ] Modal Header: 선수명 + 팀 약칭 + 포지션 + 등급 배지 + 닫기 X 버튼 (44px)
- [ ] Tab Switcher: "시즌 성적" / "역대 기록" 2개 탭
- [ ] Season Tab — Batter: AVG / OPS / wRC+ / HR / RBI 5개 지표 셀 (값 + 라벨)
- [ ] Season Tab — Pitcher: ERA / FIP / WHIP / K/9 / BB/9 5개 지표 셀
- [ ] Season Tab — Mini Sparkline: 최근 10경기 막대 차트 (CSS만, 등급 색상)
- [ ] Career Tab: 연도별 시즌 테이블 — 시즌, 경기수, 주요 지표, 정렬 가능
- [ ] Career Tab — 토글: "최근 5시즌" / "전체" 토글 버튼
- [ ] Modal Close: X 클릭 / 배경 클릭 / Escape / 모바일 스와이프 다운 4가지 닫기 방식
- [ ] Focus Trap: 모달 내부에서 Tab 순환, 닫기 후 트리거 버튼으로 포커스 복귀
- [ ] ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 적용

#### Page 4: Settings Modal (마이팀 변경)

- [ ] Heading: "마이팀 변경"
- [ ] 현재 팀 표시 + "변경" 버튼 → 10팀 그리드 (Page 1과 동일)
- [ ] "마이팀 초기화" 버튼 (위험 액션, 빨간색) → 확인 다이얼로그 → localStorage.removeItem
- [ ] 닫기 X 버튼

#### State 5: Empty / Error / Stale

- [ ] Empty (마이팀 오늘 경기 없음): "오늘은 마이팀 경기가 없습니다" + 다음 경기 일자 표시
- [ ] Error (크롤러 완전 실패 + stale cache): "데이터 갱신 지연 — 마지막 업데이트 N시간 전" 배너 + 새로고침 버튼
- [ ] localStorage 비활성화: "시크릿 모드에서는 마이팀 설정이 탭을 닫으면 사라집니다" 정보 배너

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | HTTP | Message (한국어) | Cause | Handling |
|------|:----:|------------------|-------|----------|
| `STALE_CACHE` | 503 | 데이터 갱신이 지연되고 있습니다 | 크롤러 24h 이상 실패 | UI: "데이터 갱신 지연" 배너 + 새로고침 버튼. Discord 알림 자동 발송. |
| `NO_GAME` | 404 | 해당 일자에 경기가 없습니다 | 마이팀이 해당 일자 경기 없음 | UI: "오늘은 경기 없음 — 다음 경기 5/12(금)" |
| `PLAYER_NOT_FOUND` | 404 | 선수 정보를 찾을 수 없습니다 | playerId 비정상 | 모달 내부에 메시지 + 닫기 버튼 |
| `INVALID_TEAM` | 400 | 팀 코드가 올바르지 않습니다 | localStorage 조작 등 | 팀 선택 화면으로 폴백 + Sentry 로그 |
| `INVALID_DATE` | 400 | 날짜 형식이 올바르지 않습니다 | URL 쿼리 조작 | 오늘 날짜로 폴백 |
| `INTERNAL` | 500 | 서비스에 일시적인 문제가 있습니다 | 예상치 못한 에러 | Sentry 자동 전송 + 사용자에게 toast |
| `RATE_LIMITED` | 429 | (외부 소스 차단 시 내부 발생) | KBO/statiz가 요청 차단 | 크롤러 측 처리, 클라이언트엔 stale 응답 |

### 6.2 Error Response Format

```typescript
{
  data: null,
  error: {
    code: "STALE_CACHE",
    message: "데이터 갱신이 지연되고 있습니다",
    details: {
      lastSuccess: "2026-05-08T20:00:00+09:00",
      ageHours: 14
    }
  },
  meta: { fallback: "stale-cache" }
}
```

### 6.3 Error Boundary 전략

| Layer | 처리 방식 |
|-------|----------|
| **Crawler (Server-side)** | try/catch → retry(3) → 실패 시 마지막 캐시 유지 + Discord 알림. 빌드는 실패 안 함. |
| **API Route** | try/catch → JSON 응답 표준화. 5xx는 Sentry, 4xx는 로그만. |
| **SWR Hook** | `error` 분기 → 컴포넌트가 fallback UI 렌더 |
| **React Component** | `<ErrorBoundary>` (`app/error.tsx`) — 페이지 단위 폴백 |
| **Global** | `<Suspense>` + `<ErrorBoundary>` 이중 안전망 |

### 6.4 Discord Alert Threshold

| Severity | Trigger | Message Template |
|----------|---------|------------------|
| INFO | 일일 크롤 성공 요약 | `[INFO] 2026-05-09 일일 크롤 완료: KBO 5/5 statiz 4/4` |
| WARNING | 1회 retry 후 성공 | `[WARN] KBO standings 크롤 1회 실패 후 성공 (소요 12s)` |
| CRITICAL | 3회 retry 모두 실패 | `[CRITICAL] KBO lineup 크롤 3회 실패 → stale cache 사용. 사이트 구조 변경 의심.` |

---

## 7. Security Considerations

> **Threat Model**: 인증 없는 공개 사이트, 사용자 데이터 0(서버 저장), 외부 데이터 소스 의존. 주요 위협은 (1) 크롤링 차단/IP 클레임 (2) localStorage 조작 (3) XSS via 동적 데이터.

- [x] **Input Validation**: API Route는 모두 zod 스키마로 query/path 파라미터 검증. 잘못된 팀 코드/날짜 형식은 400 반환.
- [x] **XSS Prevention**: React 기본 escape에 의존. HTML 직접 삽입(`dangerouslySetInnerHTML`) 0건. 외부 데이터(선수명·구장명)도 모두 React 렌더링 경로 통과.
- [x] **CSP Header**: `next.config.js`에서 `Content-Security-Policy: default-src 'self'; img-src 'self' https:; script-src 'self' https://va.vercel-scripts.com; ...` 설정.
- [x] **HTTPS Only**: Vercel 자동 적용. HSTS 1년.
- [x] **Rate Limiting**: 외부 사용자에 대한 rate limit은 Vercel Edge에서 IP당 분당 60req로 제한 (Phase 2에서 도입). MVP는 캐시 의존이라 부담 적음.
- [x] **Secrets**: `DISCORD_WEBHOOK_URL`, `SENTRY_DSN` 등은 GitHub Actions Secrets + Vercel Environment에 저장. `.env.example`에 더미 값.
- [x] **Crawler Etiquette** (R1 완화): User-Agent 명시 (`baseball-fan-dashboard/0.1 (+contact)`), 요청 간 3~5초 delay, robots.txt 준수, 차단 감지 시 24h backoff.
- [x] **IP Compliance** (R3 완화): 코드/UI/메타에서 "마구마구"·"Magumagu"·"네오위즈"·"넷마블" 문자열 0건 (footer 면책 텍스트 1곳만 화이트리스트). CI grep 검사로 강제.
- [x] **localStorage 검증**: `baseball_myteam` 값을 항상 `TEAM_CODES.includes(value)`로 검증. 잘못된 값이면 팀 선택 화면으로 폴백.
- [x] **CORS**: API Route는 same-origin만 허용 (Phase 2 모바일 앱 도입 시 확장).

---

## 8. Test Plan

> **CRITICAL**: 본 섹션은 *무엇을* 테스트할지만 정의. 테스트 코드는 Do phase에서 모듈 구현과 동시에 작성. Check phase는 실행만.

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Unit Tests | 순수 함수 (`computeGrade`, `normalizeKboGame`, `formatKstDate`) | Vitest | Do (모듈별) |
| L1: API Tests | `/api/*` 엔드포인트 셰입·상태 코드 | Playwright `request` | Do |
| L2: UI Action Tests | 페이지별 인터랙션 (팀 선택, 카드 클릭, 모달 열고 닫기) | Playwright | Do |
| L3: E2E Scenarios | 첫 방문 → 마이팀 설정 → 카드 클릭 → 모달 → 닫기 멀티 페이지 | Playwright | Do |
| L4 (선택): Performance | Lighthouse CI | Lighthouse CI | Check |
| L5 (선택): a11y | axe-core (Playwright 통합) | axe | Check |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Test Description | Expected Status | Expected Response |
|---|----------|--------|-----------------|:--------------:|-------------------|
| 1 | `/api/health` | GET | 헬스체크 정상 | 200 | `.data.lastCrawl` 존재 |
| 2 | `/api/teams` | GET | 10팀 모두 반환 | 200 | `.data.length === 10`, 각 팀에 `code`, `name`, `primaryColor` |
| 3 | `/api/standings` | GET | 순위 10개 반환 | 200 | `.data.length === 10`, rank 1~10, sorted by rank |
| 4 | `/api/games` | GET | 오늘 경기 목록 | 200 | `.data` 배열 (0~5개), `meta.updatedAt` 존재 |
| 5 | `/api/games?date=2026-05-09` | GET | 특정 일자 경기 | 200 | `.data[].date === "2026-05-09"` |
| 6 | `/api/games?range=week` | GET | 주간 경기 | 200 | 7일 이내 경기, sorted by date+startTime |
| 7 | `/api/lineup/LG?date=2026-05-09` | GET | LG 라인업 (확정) | 200 | `.data.battingOrder.length` ∈ [9,10], `.data.startingPitcher.position === "P"` |
| 8 | `/api/lineup/LG?date=<미확정>` | GET | 라인업 미확정 | 200 | `.data.status === "pending"`, `.data.battingOrder.length === 0` |
| 9 | `/api/lineup/INVALID?date=...` | GET | 잘못된 팀 코드 | 400 | `.error.code === "INVALID_TEAM"` |
| 10 | `/api/lineup/LG?date=invalid` | GET | 잘못된 날짜 | 400 | `.error.code === "INVALID_DATE"` |
| 11 | `/api/lineup/LG?date=<no-game>` | GET | 해당일 경기 없음 | 404 | `.error.code === "NO_GAME"` |
| 12 | `/api/player/78529` | GET | 선수 상세 (타자) | 200 | `.data.player.isPitcher === false`, `.data.currentSeason.ops` 존재, `.data.recentTen.length ≤ 10` |
| 13 | `/api/player/60100` | GET | 선수 상세 (투수) | 200 | `.data.player.isPitcher === true`, `.data.currentSeason.era` 존재 |
| 14 | `/api/player/INVALID` | GET | 선수 없음 | 404 | `.error.code === "PLAYER_NOT_FOUND"` |
| 15 | `/api/standings` (cache stale) | GET | 모든 캐시 만료 + 크롤러 실패 시뮬 | 503 | `.error.code === "STALE_CACHE"`, `.meta.fallback === "stale-cache"` |
| 16 | `/api/standings` Cache-Control | GET (response header) | Edge Cache 헤더 | 200 | `Cache-Control` 헤더에 `s-maxage=600` 포함 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result | Data Verification |
|---|------|--------|----------------|-------------------|
| 1 | TeamSelection | 페이지 로드 | 10팀 버튼 모두 표시 (2열 모바일) | localStorage.myteam === null |
| 2 | TeamSelection | "LG" 버튼 클릭 | Dashboard로 전환, 페이지 새로고침 없음 | localStorage.myteam === "LG" |
| 3 | TeamSelection | "그냥 둘러보기" 클릭 | Dashboard 전환, myteam 저장 안 함 | localStorage.myteam === null |
| 4 | Dashboard | 페이지 로드 (myteam=LG) | Standings + Schedule + Lineup 모두 표시 | API 3개 호출, 모두 200 |
| 5 | Dashboard | Standings 토글 클릭 | 배너 펼침/접힘 전환 | aria-expanded 변경 |
| 6 | Dashboard | "이번 주" 탭 클릭 | 7일치 경기 표시 | URL에 `?range=week` 추가 |
| 7 | Dashboard | 마이팀 경기 카드 강조 확인 | LG 경기 카드만 보더 강조 | className에 `is-myteam` |
| 8 | Dashboard | 라인업 카드 9~10장 표시 | 카드 그리드 모바일 3열 | querySelector('.player-card').length ∈ [9,10] |
| 9 | Dashboard | 카드별 등급 색상 확인 | 보더 색상이 등급에 맞음 | computed style border-color match |
| 10 | Dashboard | ELITE 카드 글로우 확인 | box-shadow 존재 | getComputedStyle.boxShadow !== "none" |
| 11 | Dashboard | 라인업 미확정 상태 | placeholder 9장 + 안내 텍스트 + 새로고침 버튼 | text "라인업 미확정" 존재 |
| 12 | Dashboard | 새로고침 버튼 클릭 | SWR mutate 트리거, loading state | API 재호출 |
| 13 | PlayerModal | 카드 클릭 | 모달 슬라이드업 표시 | `role="dialog"` 보임 |
| 14 | PlayerModal | "역대 기록" 탭 클릭 | 시즌 테이블 표시 | tab `aria-selected="true"` |
| 15 | PlayerModal | X 버튼 클릭 | 모달 닫힘 | dialog 사라짐, 포커스 카드로 복귀 |
| 16 | PlayerModal | Escape 키 | 모달 닫힘 | 동일 |
| 17 | PlayerModal | 배경 클릭 | 모달 닫힘 | 동일 |
| 18 | PlayerModal | "전체" 토글 (역대 탭) | 5시즌 → 전체 시즌 전환 | tr 개수 증가 |
| 19 | Settings | ⚙ 클릭 → "변경" → 다른 팀 클릭 | 마이팀 즉시 변경, 대시보드 갱신 | localStorage.myteam 변경 |
| 20 | Settings | "초기화" 클릭 → 확인 | 팀 선택 화면으로 이동 | localStorage.myteam === null |

### 8.4 L3: E2E Scenario Tests

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | First-visit Onboarding (TS-01) | (1) URL 접속 — localStorage 비어있음 (2) 팀 선택 화면 로드 ≤ 2s (3) "LG" 클릭 (4) 대시보드 즉시 표시 (5) 새로고침 (6) LG 대시보드 그대로 | localStorage.myteam === "LG", 화면 깜빡임 없음, FCP < 2s |
| 2 | Lineup Card Grades (TS-02) | (1) myteam=LG 상태 (2) Lineup 섹션 진입 (3) 9장 카드 표시 (4) 등급 배지(ELITE/RARE/SPECIAL/NORMAL) 텍스트 확인 (5) 보더 색상 매칭 확인 | 9장 모두 등급 배지 존재, 색상 hex 일치 |
| 3 | Empty Lineup (TS-03) | (1) myteam=LG (2) 라인업 미확정 상태 (3) Lineup 섹션 진입 (4) placeholder + 안내 + 새로고침 버튼 확인 (5) 새로고침 클릭 (6) loading → 결과 표시 | 빈 데이터 에러 없이 placeholder UI, 새로고침 동작 |
| 4 | Crawler Failure Fallback (TS-04) | (1) crawler 응답 모킹 = 실패 (2) 대시보드 접속 (3) stale cache 데이터 표시 (4) "데이터 갱신 지연 N시간" 배너 표시 | 503 없이 stale 표시, 배너 텍스트 존재 |
| 5 | Player Modal Drilldown (US-05) | (1) Dashboard (2) ELITE 카드 클릭 (3) Modal 슬라이드업 (4) "시즌 성적" 탭 OPS/AVG/wRC+ 표시 (5) "역대 기록" 탭 클릭 (6) 5시즌 표시 (7) "전체" 토글 (8) Escape로 닫기 | 모달 정상 표시, 탭 전환 ok, 역대 데이터 존재 |
| 6 | Mobile Responsive Lineup | iPhone SE (375×667) 에뮬 (1) Dashboard 진입 (2) 카드 그리드 3열 확인 (3) 카드 터치 (4) 모달 bottom-sheet 슬라이드업 (5) 스와이프 다운으로 닫기 | 카드 3열 레이아웃, 터치 타깃 ≥ 44px, bottom-sheet 동작 |
| 7 | Abuse: localStorage 조작 (TS-05) | (1) DevTools `localStorage.setItem('baseball_myteam', 'INVALID')` (2) 새로고침 | 팀 선택 화면으로 안전 폴백, 500 없음, Sentry 로그 |
| 8 | a11y: 모달 포커스 트랩 | (1) 카드 클릭 → 모달 (2) Tab 키 반복 (3) 모달 내부에서만 포커스 순환 (4) Escape (5) 트리거 카드로 포커스 복귀 | 포커스 외부로 새지 않음, 복귀 정확 |

### 8.5 Seed Data Requirements

테스트는 실시간 크롤링 없이 fixture JSON으로 실행합니다.

| Entity | Minimum Count | Key Fields | Location |
|--------|:------------:|-----------|----------|
| Team | 10 | code, name, primaryColor | `tests/fixtures/teams.json` |
| Player | ~30 (각 팀 3명) | id, name, teamCode, position, isPitcher | `tests/fixtures/players.json` |
| Game | 5 (오늘) + 14 (이번 주) | id, date, startTime, homeTeam, awayTeam, status | `tests/fixtures/games-2026-05-09.json` |
| Standings | 10 | rank, teamCode, wins, losses, gamesBehind | `tests/fixtures/standings.json` |
| Lineup | 1 (LG, confirmed) + 1 (LG, pending) + 1 (KT, confirmed) | full battingOrder + startingPitcher | `tests/fixtures/lineups/...` |
| BatterSeasonStat | 20 | playerId, ops, wrcPlus 분포 (등급 4단계 모두 커버) | `tests/fixtures/players/{id}.json` |
| PitcherSeasonStat | 10 | playerId, era, fip 분포 (등급 4단계 모두 커버) | `tests/fixtures/players/{id}.json` |

> **Do phase 우선 작업**: `src/lib/db/seed.ts` 구현 → fixture 파일 작성 → 모듈별 테스트는 fixture 의존.
> **Check phase**: seed 적용 후 테스트 실행, 외부 네트워크 호출 0건.

---

## 9. Clean Architecture (3-Layer Pragmatic)

> Pragmatic Balance 채택. 4-Layer는 MVP 규모에 과해 3-Layer로 단순화.

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **UI (Presentation)** | React components, hooks (`useMyTeam`, `useLineup`), 페이지 라우트 | `src/components/`, `src/features/*/`, `src/app/` |
| **Service (Application)** | API Route 핸들러, SWR fetcher, 비즈니스 orchestration | `src/app/api/`, `src/services/`, `src/lib/api-client.ts` |
| **Data (Infrastructure)** | 크롤러, JSON 캐시 access, 외부 데이터 소스 어댑터 | `src/lib/data/`, `scripts/crawler/` |

> Domain types는 `src/types/`에 분리되어 모든 레이어가 import 가능. (Domain 레이어가 별도 폴더는 아님 — 4-Layer 단순화)

### 9.2 Dependency Rules

```
┌──────────────────────────────────────────────────────────┐
│         Allowed Direction (Pragmatic 3-Layer)             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   UI Layer ──→ Service Layer ──→ Data Layer              │
│                                                          │
│   types/ (Domain)  ←─ 모든 레이어 자유롭게 import 가능   │
│                                                          │
│   Rule:                                                   │
│     1. UI는 Service만 호출. Data 레이어 직접 import 금지.│
│     2. Service는 Data를 호출. UI 컴포넌트 import 금지.    │
│     3. Data는 외부(fs, axios, cheerio)와 types만 사용.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `src/app/api/*` (API Route) | `src/services/*`, `src/lib/data/*`, `src/types/*` | `src/components/*`, `src/features/*` (UI) |
| `src/components/*`, `src/features/*` (UI) | `src/services/*` (via SWR fetcher), `src/lib/api-client`, `src/types/*`, `src/lib/grade` (순수 함수) | `src/lib/data/*` (raw fs access), `scripts/*` |
| `src/services/*` | `src/lib/data/*`, `src/types/*` | `src/components/*`, `src/features/*` |
| `src/lib/data/*` | `node:fs`, `axios`, `cheerio`, `src/types/*` | 모든 UI/Service 레이어 |
| `src/lib/grade` | `src/types/*`만 | 그 외 모두 (순수 함수) |
| `scripts/crawler/*` | `axios`, `cheerio`, `src/lib/data/*`, `src/types/*` | UI 레이어 전체 |

### 9.4 This Feature's Layer Assignment

| Component / Module | Layer | Location |
|-----|-------|----------|
| `PlayerCard`, `LineupGrid`, `StandingsBanner`, `PlayerModal` | UI | `src/features/lineup-card/`, `src/features/league-standings/`, `src/features/player-modal/` |
| `useMyTeam`, `useLineup`, `usePlayer` (SWR hooks) | UI (hooks) | `src/features/{feature}/hooks/` |
| `/api/standings/route.ts`, `/api/lineup/[team]/route.ts` 등 | Service | `src/app/api/` |
| `lineupService.getByTeamAndDate()`, `playerService.getDetail()` | Service | `src/services/lineup.ts`, `src/services/player.ts` |
| `apiClient.fetcher` (SWR fetcher) | Service | `src/lib/api-client.ts` |
| `readJsonCache(path)`, `writeJsonCache(path, data)` | Data | `src/lib/data/cache.ts` |
| `KboCrawler.fetchSchedule()`, `StatizCrawler.fetchPlayerStats()` | Data | `scripts/crawler/kbo.ts`, `scripts/crawler/statiz.ts` |
| `computeGrade(stats, lookups)` | Pure (lib) | `src/lib/grade.ts` |
| `normalizeKboGame(rawHtml)` | Data adapter | `src/lib/data/normalizer.ts` |
| `Team`, `Player`, `Game`, `Lineup`, `Grade` 타입 | Domain (types) | `src/types/` |

---

## 10. Coding Convention Reference

> Greenfield이므로 Plan §8.2를 본 섹션에 통합. `/phase-2-convention` 미실행 상태.

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `PlayerCard`, `LineupGrid` |
| Functions/Variables | camelCase | `computeGrade()`, `myTeamCode` |
| Constants | UPPER_SNAKE_CASE | `TEAM_CODES`, `GRADE_PERCENTILES`, `CACHE_TTL_SEC` |
| Types/Interfaces | PascalCase | `Player`, `LineupSlot`, `ApiResponse<T>` |
| Files (component) | PascalCase.tsx | `PlayerCard.tsx`, `LineupGrid.tsx` |
| Files (utility/hook) | camelCase.ts | `computeGrade.ts`, `useMyTeam.ts` |
| Files (route) | Next 컨벤션 (`page.tsx`, `route.ts`, `layout.tsx`) | — |
| Folders | kebab-case | `lineup-card/`, `player-modal/`, `team-selection/` |
| API path | kebab-case | `/api/lineup`, `/api/player` |
| Test file | `*.test.ts(x)` (단위) / `*.spec.ts` (E2E) | `computeGrade.test.ts`, `onboarding.spec.ts` |

### 10.2 Import Order

```typescript
// 1. React / Next
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. External libraries
import useSWR from 'swr';
import { z } from 'zod';

// 3. Absolute internal — types & lib (가장 안전한 import)
import type { Player, Grade } from '@/types';
import { computeGrade } from '@/lib/grade';
import { apiClient } from '@/lib/api-client';

// 4. Absolute internal — components & features (UI)
import { GradeBadge } from '@/components/ui/GradeBadge';
import { PlayerCard } from '@/features/lineup-card/PlayerCard';

// 5. Relative imports (같은 모듈 내)
import { useLineup } from './hooks/useLineup';

// 6. Styles
import styles from './LineupGrid.module.css';
```

ESLint `import/order` 룰로 강제. `eslint-plugin-import` + `eslint-plugin-import-helpers` 사용.

### 10.3 Environment Variables

| Variable | Scope | Usage | Required |
|---------|-------|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | Client | OG meta, canonical URL | ✅ |
| `NEXT_PUBLIC_VERCEL_ENV` | Client | dev/preview/prod 분기 | auto |
| `DISCORD_WEBHOOK_URL` | Server (Actions) | 장애 알림 | ✅ |
| `KBO_USER_AGENT` | Server (Actions) | 크롤러 식별 | ✅ |
| `STATIZ_USER_AGENT` | Server (Actions) | 크롤러 식별 | ✅ |
| `SENTRY_DSN` | Both | 에러 추적 | optional |
| `SENTRY_AUTH_TOKEN` | Server (CI) | 소스맵 업로드 | optional |
| `CRAWL_RETRY_MAX` | Server (Actions) | 재시도 횟수 (default 3) | optional |
| `CRAWL_RETRY_DELAY_MS` | Server (Actions) | 요청 간 딜레이 (default 4000) | optional |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server | Phase 2 도입 시 | ❌ (MVP) |

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase, 한 파일 = 한 컴포넌트 |
| File organization | feature-based modules (`features/{도메인}/`) |
| State management | React useState (로컬) + SWR (서버 상태) + localStorage (마이팀만) |
| Error handling | API: zod validation + standardized JSON. Client: SWR `error` 분기 + ErrorBoundary. |
| Date handling | KST 고정. `date-fns-tz` + `format(date, 'yyyy-MM-dd', { timeZone: 'Asia/Seoul' })` |
| Styling | Tailwind utility classes + CSS variables (등급 색상). 컴포넌트 전용 스타일은 `*.module.css`. |
| Translation | 한국어 only (Phase 2까지 i18n 도입 안 함) |
| Logging | Server: structured JSON `{ level, source, action, ms, result }` to stdout. Client: Sentry. |
| Forbidden Words | "마구마구"·"Magumagu"·"네오위즈"·"넷마블" — grep CI에서 검출 시 build fail (footer 면책 텍스트 1곳만 화이트리스트 코멘트로 허용) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
baseball-fan-dashboard/
├── public/
│   ├── logos/                       # 10팀 SVG 로고 (자체 제작 또는 KBO 공식 fair use)
│   │   └── {team-code}.svg
│   └── avatars/
│       └── position-{P|C|1B|...}.svg # 사진 없는 선수용 폴백 아바타
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 헤더/푸터/메타/Sentry init
│   │   ├── page.tsx                 # 단일 페이지 대시보드 (서버 컴포넌트)
│   │   ├── error.tsx                # 글로벌 ErrorBoundary
│   │   ├── globals.css              # Tailwind base + CSS 변수
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── teams/route.ts
│   │       ├── standings/route.ts
│   │       ├── games/route.ts
│   │       ├── lineup/[team]/route.ts
│   │       └── player/[id]/route.ts
│   ├── features/
│   │   ├── team-selection/
│   │   │   ├── TeamSelectionScreen.tsx
│   │   │   ├── MyTeamSettings.tsx
│   │   │   └── hooks/useMyTeam.ts        # localStorage hook
│   │   ├── league-standings/
│   │   │   └── StandingsBanner.tsx
│   │   ├── game-schedule/
│   │   │   ├── ScheduleTabs.tsx
│   │   │   └── ScheduleList.tsx
│   │   ├── lineup-card/
│   │   │   ├── LineupSection.tsx
│   │   │   ├── LineupGrid.tsx
│   │   │   ├── LineupPlaceholder.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   └── hooks/useLineup.ts
│   │   └── player-modal/
│   │       ├── PlayerModal.tsx
│   │       ├── SeasonStatTab.tsx
│   │       ├── CareerStatTab.tsx
│   │       └── hooks/usePlayer.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── OfflineBanner.tsx
│   │   └── ui/
│   │       ├── GradeBadge.tsx
│   │       ├── MiniSparkline.tsx
│   │       ├── Tabs.tsx              # shadcn/ui wrap
│   │       ├── Dialog.tsx            # shadcn/ui wrap
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── grade.ts                  # 등급 산출 알고리즘 (순수 함수)
│   │   ├── storage.ts                # localStorage 헬퍼 + 검증
│   │   ├── api-client.ts             # SWR fetcher + 표준 에러 처리
│   │   ├── constants.ts              # TEAM_CODES, GRADE_PERCENTILES, CACHE_TTL
│   │   ├── date.ts                   # KST 헬퍼 (date-fns-tz)
│   │   └── data/
│   │       ├── cache.ts              # readJsonCache / writeJsonCache
│   │       └── normalizer.ts         # raw HTML → typed Domain
│   ├── services/
│   │   ├── standings.ts              # standingsService
│   │   ├── games.ts
│   │   ├── lineup.ts
│   │   └── player.ts
│   └── types/
│       ├── team.ts
│       ├── player.ts
│       ├── game.ts
│       ├── stat.ts
│       ├── lineup.ts
│       └── api.ts                    # ApiResponse<T>, ErrorCode
├── data/                              # JSON 캐시 (git-tracked)
│   ├── teams.json
│   ├── players.json
│   ├── standings.json
│   ├── games/
│   ├── lineups/
│   ├── players/
│   └── _meta/
├── scripts/
│   ├── crawler/
│   │   ├── kbo.ts                   # KBO 사이트 크롤러
│   │   ├── statiz.ts                # 스탯티즈 크롤러
│   │   └── index.ts                 # 메인 진입점 (action별 분기)
│   ├── compute-grades.ts            # 등급 일괄 산출
│   ├── notify-discord.ts            # 장애 알림
│   └── check-forbidden-words.ts     # IP 금지어 grep
├── tests/
│   ├── fixtures/                     # seed data
│   │   ├── teams.json
│   │   ├── players.json
│   │   ├── games-2026-05-09.json
│   │   ├── standings.json
│   │   └── lineups/
│   ├── unit/
│   │   ├── grade.test.ts
│   │   ├── normalizer.test.ts
│   │   └── storage.test.ts
│   └── e2e/
│       ├── onboarding.spec.ts        # TS-01
│       ├── lineup-card.spec.ts       # TS-02
│       ├── empty-lineup.spec.ts      # TS-03
│       ├── crawler-fallback.spec.ts  # TS-04
│       ├── player-modal.spec.ts      # US-05
│       ├── mobile-responsive.spec.ts
│       └── a11y.spec.ts
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + Test + Build + grep
│       ├── crawl-schedule.yml        # 매일 07:00 KST
│       ├── crawl-standings.yml       # 10분 간격
│       ├── crawl-lineup.yml          # 30분 간격
│       ├── crawl-stats.yml           # 매일 06:00
│       └── compute-grades.yml        # 매일 06:30
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 11.2 Implementation Order

> 구현 시 **반드시 순서를 지키세요**. 하위 레이어 → 상위 레이어 → 통합.

1. **Foundation (M0)** — 프로젝트 초기 설정. Next.js 14 App Router + TypeScript strict + Tailwind + ESLint/Prettier + Vitest + Playwright. `tsconfig`, `tailwind.config`, `eslint.config`, `next.config.js` 작성. Sentry 초기화. `.env.example` 작성.
2. **Domain Types (M1)** — `src/types/` 전체 작성 (team, player, game, stat, lineup, api). 단위 테스트 없음 (순수 타입).
3. **Constants & Helpers (M2)** — `lib/constants.ts` (TEAM_CODES, GRADE_PERCENTILES), `lib/date.ts` (KST), `lib/storage.ts` (localStorage with validation).
4. **Grade Algorithm (M3)** — `lib/grade.ts` 구현. 단위 테스트 100% 커버리지 필수 (4단계 분기, 데이터 부족 케이스, 타자/투수 분기).
5. **Test Fixtures (M4)** — `tests/fixtures/` JSON 작성. seed.ts 스크립트.
6. **Data Layer (M5)** — `lib/data/cache.ts` (fs read/write), `lib/data/normalizer.ts` (raw HTML → typed). 단위 테스트.
7. **Crawler (M6)** — `scripts/crawler/kbo.ts`, `statiz.ts`. retry/delay/User-Agent 적용. 단위 테스트는 fixture HTML 모킹.
8. **Compute Grades Script (M7)** — `scripts/compute-grades.ts`. M5 + M3 결합. 일괄 실행.
9. **API Routes (M8)** — `app/api/*` 6개 엔드포인트. zod validation + 표준 응답 셰입. L1 테스트 작성.
10. **UI Components — Common (M9)** — `components/ui/` (GradeBadge, MiniSparkline, Tabs, Dialog, Toast). `components/layout/` (Header, Footer, OfflineBanner).
11. **UI Features — Team Selection (M10)** — `features/team-selection/`. L2 테스트 작성.
12. **UI Features — Standings + Schedule (M11)** — `features/league-standings/`, `features/game-schedule/`. L2 테스트.
13. **UI Features — Lineup Card (M12)** — `features/lineup-card/` 전체 (Section, Grid, PlayerCard, Placeholder). 핵심 UX. L2 테스트 + 등급 색상 visual 검증.
14. **UI Features — Player Modal (M13)** — `features/player-modal/`. focus trap, 닫기 4-way. L2 테스트.
15. **Single Page Composition (M14)** — `app/page.tsx`에서 위 features 조합. 마이팀 분기.
16. **GitHub Actions (M15)** — 5개 cron workflow + ci.yml(lint+test+build+grep).
17. **E2E Tests (M16)** — `tests/e2e/` 7개 spec. 마지막에 fixture+크롤러 모킹으로 실행.
18. **Production Polish (M17)** — Sentry 통합, OG 메타, sitemap, robots.txt, Vercel 배포 설정, 도메인 연결, 성능 튜닝(Lighthouse 80점 목표).

### 11.3 Session Guide

> Design 구조에서 자동 생성. Module Map은 `/pdca do baseball-fan-dashboard --scope module-N` 단위로 사용.

#### Module Map

| Module | Scope Key | Description | Files Created | Estimated Turns |
|--------|-----------|-------------|:-------------:|:---------------:|
| Foundation | `module-0-foundation` | Next.js 14 init, Tailwind, ESLint, Vitest, Playwright, Sentry, env templates, Prettier, husky | ~15 | 25-35 |
| Domain & Lib | `module-1-domain` | M1 types + M2 constants/date/storage + M3 grade algorithm + M3 단위 테스트 | ~10 | 25-35 |
| Data Layer | `module-2-data` | M4 fixtures + M5 cache/normalizer + 단위 테스트 + seed.ts | ~12 | 30-40 |
| Crawler & Grades | `module-3-crawler` | M6 KBO/statiz 크롤러 + M7 compute-grades + crawler 단위 테스트(fixture 모킹) | ~10 | 35-45 |
| API Routes | `module-4-api` | M8 6개 API Routes (health/teams/standings/games/lineup/player) + zod + L1 테스트 | ~14 | 35-45 |
| UI Common | `module-5-ui-common` | M9 components/ui + components/layout + globals.css 카드 스타일 토큰 | ~12 | 30-40 |
| Team Selection | `module-6-team-selection` | M10 TeamSelectionScreen + MyTeamSettings + useMyTeam hook + L2 테스트 | ~7 | 25-35 |
| Standings + Schedule | `module-7-standings-schedule` | M11 두 feature + L2 테스트 | ~10 | 30-40 |
| **Lineup Card** ⭐ | `module-8-lineup-card` | M12 핵심 UX 전체 (Section/Grid/PlayerCard/Placeholder/useLineup) + L2 테스트 + 등급 visual 검증 | ~12 | 45-60 |
| Player Modal | `module-9-player-modal` | M13 Modal/Tabs/focus trap/usePlayer + L2 테스트 | ~10 | 35-45 |
| Page Composition | `module-10-page` | M14 app/page.tsx 통합 + 마이팀 분기 + offline banner 통합 | ~3 | 15-25 |
| CI/Cron | `module-11-cicron` | M15 5 cron workflows + ci.yml + grep 스크립트 | ~8 | 25-35 |
| E2E Tests | `module-12-e2e` | M16 7 Playwright spec + fixture-based mocking | ~9 | 40-55 |
| Production Polish | `module-13-polish` | M17 Sentry, OG, sitemap, Vercel deploy, Lighthouse 튜닝 | ~10 | 30-40 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns | Deliverable |
|---------|-------|-------|:-----:|-------------|
| Session 1 | PM + Plan + Design (현재) | 전체 | ~80 | 본 문서까지 완료 |
| Session 2 | Do | `--scope module-0-foundation,module-1-domain` | 50-70 | 프로젝트 부팅 + 도메인 + grade 알고리즘 동작 (테스트 통과) |
| Session 3 | Do | `--scope module-2-data,module-3-crawler` | 65-85 | 크롤러 동작 + 등급 산출 일괄 실행 가능 |
| Session 4 | Do | `--scope module-4-api,module-5-ui-common` | 65-85 | API Route 응답 + UI 공통 컴포넌트 |
| Session 5 | Do | `--scope module-6-team-selection,module-7-standings-schedule` | 55-75 | 마이팀 + 순위 + 일정 화면 동작 |
| Session 6 | Do | `--scope module-8-lineup-card,module-9-player-modal` | 80-105 | **핵심 UX 완성** (라인업 카드 + 모달) |
| Session 7 | Do | `--scope module-10-page,module-11-cicron` | 40-60 | 단일 페이지 통합 + CI/Cron 자동화 |
| Session 8 | Do | `--scope module-12-e2e,module-13-polish` | 70-95 | E2E + 프로덕션 배포 |
| Session 9 | Check | `/pdca analyze` | 30-40 | Match Rate ≥ 90%, gap-detector 통과 |
| Session 10 | (Iterate if needed) | `/pdca iterate` | 30-50 | <90% 시 자동 개선 |
| Session 11 | QA | `/pdca qa` | 30-50 | L1~L3 테스트 종합 실행 |
| Session 12 | Report | `/pdca report` | 25-35 | 완료 보고서 + 메모리 저장 |

> **Phase 0 POC**는 별도 트랙. Module-3-crawler를 Phase 0에서 7일 안정성 검증 후 Phase 1 본 구현 진입 권고.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-09 | Initial draft. Pragmatic 3-Layer 아키텍처 채택. 14개 모듈 + 12개 세션 가이드. Plan §3 22 FR + PRD §9 등급 알고리즘 + PRD §11 5 test scenario 매핑 완료. | Design Agent |
