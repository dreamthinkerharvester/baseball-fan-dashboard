# kia-fan-service Design Document

> **Summary**: KBO 10구단 대시보드를 KIA 전용 + 세이버메트릭스 디폴트 서비스로 피벗 — 실용 균형(Option C) 아키텍처
>
> **Project**: baseball-fan-dashboard → kia-fan-service
> **Version**: 0.1.0
> **Author**: harvester
> **Date**: 2026-06-12
> **Status**: Draft
> **Planning Doc**: [kia-fan-service.plan.md](../../01-plan/features/kia-fan-service.plan.md)
> **PRD**: [kia-fan-service.prd.md](../../00-pm/kia-fan-service.prd.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 세이버 × 모바일 × KIA 단일팀 조합은 경쟁사 5곳 모두 비어있는 공백. 클래식 스탯으로는 선수의 실제 기여를 읽을 수 없다. |
| **WHO** | 비치헤드 = 27~35세 KIA 팬 직장인 "세이버 호기심" 세그먼트 (P1). 캐주얼 팬(P2)은 토글로 보호. |
| **RISK** | ① Statiz 크롤러 로그인 장벽 (이미 구현됐으나 비활성 — POC 1순위) ② 클래식 숨김 거부 (토글 상시 제공) ③ 세이버 용어 장벽 (인라인 툴팁) |
| **SUCCESS** | Statiz 수집 성공 + 세이버 디폴트 카드 + 블러 토글 동작 + Myth-Buster 갭 산출 + Lighthouse 80+ |
| **SCOPE** | Phase 1 = 크롤러 확장 + KIA 홈 + 세이버 카드/토글/툴팁 + Myth-Buster + 일정·순위. 스토리북 탭·관전포인트·공유카드는 Phase 2. |

---

## 1. Overview

### 1.1 Design Goals

1. **기존 구조 존중**: feature-based 모듈(`src/features/*`) + Service + JSON 캐시 3-Layer를 그대로 유지. 신규 개념은 "세이버 토글 Context 1개 + myth-buster 모듈 1개"로 최소화.
2. **세이버 우선은 이미 절반 구현됨**: `src/lib/grade.ts`가 이미 wRC+→OPS, FIP→ERA 폴백 구조 — 등급 로직은 거의 무수정, **표시 레이어만 교체**.
3. **데이터 없으면 무의미**: Statiz 크롤러(이미 존재, 로그인 장벽으로 비활성)의 POC를 module-1로 선행. 실패 시 FIP 직접 계산 폴백 경로를 설계에 포함.
4. **IP 스위치 가능**: 선수 사진은 `getPlayerImage()` 단일 진입점 + env 플래그로 magu ↔ SVG 아바타 전환.

### 1.2 Design Principles

- 외과적 변경: 피벗으로 미사용되는 것(team-selection)만 삭제, 그 외 dead code 정리는 범위 밖
- 클래식 스탯은 "삭제"가 아니라 "블러" — 데이터는 항상 로드, 표시만 제어 (토글 즉각 반응)
- 미수집 세이버 필드는 `null` + "집계 중" 공통 컴포넌트 — 빈 값/에러 노출 금지

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | myTeam 상수화만, team-selection 잔류 | 도메인 분리 + 전략 패턴 + 테마 재설계 | team-selection 삭제 + Context 1개 + 신규 모듈 1개 |
| **New Files** | ~6 | ~22 | ~12 |
| **Modified Files** | ~8 | ~25 | ~15 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low (dead code) | High | High |
| **Effort** | 1세션 | 4-5세션 | 2-3세션 |
| **Risk** | 기술부채 | 회귀 범위 큼 | Low (balanced) |

**Selected**: **Option C — Pragmatic Balance** — **Rationale**: 사용자 선택 (2026-06-12 Checkpoint 3). 기존 feature 구조가 이미 좋으므로 경계만 깨끗하게, 과설계 없이.

### 2.1 Component Diagram

```
┌──────────────────────────── Client (Next.js App Router) ────────────────────────────┐
│                                                                                      │
│  src/app/page.tsx ──(온보딩 분기 삭제, 즉시 렌더)──▶ _dashboard.tsx                    │
│                                                        │                             │
│   ┌─ SaberModeProvider (신규 Context: kia_saber_mode) ─┤                             │
│   │                                                    ▼                             │
│   │  Header(KIA 고정) → StandingsBanner(KIA 강조+게임차 바)                            │
│   │  → MatchupHeader → KiaRecent10(상시) → MythBusterPanel(신규)                      │
│   │  → LineupSection(세이버 카드+블러 토글) → ScheduleList(KIA 필터)                    │
│   │                                                                                  │
│   └─ SaberTooltip(신규 공통): 지표명 탭 → 인라인 정의                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
                    │ SWR fetch
                    ▼
┌─────────── API Routes (기존 + 1 신규) ───────────┐    ┌──── GitHub Actions (cron) ────┐
│ /api/players /api/player/[id] /api/lineup        │    │ 기존: schedule·standings 크롤  │
│ /api/standings /api/games                        │    │ 신규: crawl:saber (Statiz)    │
│ /api/saber-rankings (신규 — Myth-Buster)         │    │ 신규: crawl:saber-rankings    │
└──────────────┬───────────────────────────────────┘    │       (갭 스코어 산출)          │
               ▼                                        └───────────┬───────────────────┘
┌─────────── Service + JSON 캐시 (기존 구조 유지) ──────────────────────▼───────────────┐
│ src/services/* → src/lib/data/cache.ts → data/players.json, data/players/*.json,     │
│ data/standings.json, data/games/*, data/saber_rankings.json(신규)                    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[매일 06:30 GHA] Statiz 크롤 (STATIZ_OPT_IN=1)
  → KIA 선수 세이버 스탯 (wRC+·FIP·BABIP·K%·BB%·OPS+)
  → 선수 상세 캐시(seasonStats)에 병합 + 커밋
[매일 06:45 GHA] 갭 스코어 산출
  → 전체 KBO 규정타석/이닝 선수의 클래식 순위·세이버 순위 계산
  → data/saber_rankings.json 커밋
[런타임] 카드 렌더 → 세이버 메인 스탯 표시, 클래식 셀은 항상 로드 + CSS blur
  → 토글 ON → .revealed 클래스 → blur 해제 (JS 재연산 0)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| MythBusterPanel | /api/saber-rankings → saber_rankings.json | 갭 스코어 표시 |
| PlayerCard (세이버) | seasonStats.wrcPlus/fip (Statiz) + grade.ts | 메인 스탯 + 등급 |
| SaberModeProvider | localStorage `kia_saber_mode` | 블러 토글 전역 상태 |
| crawl:saber-rankings | crawl:saber 산출물 | 순위 계산은 세이버 수집 후 |
| getPlayerImage | NEXT_PUBLIC_PLAYER_IMAGE_SOURCE | magu ↔ avatar 스위치 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/types/stat.ts — 기존 타입 확장 (필드 추가만, Non-breaking)
interface BatterSeasonStat {
  // ...기존 필드 (avg, obp, slg, ops, wrcPlus 등) 유지...
  babip: number | null;      // 신규 — Statiz
  kPct: number | null;       // 신규 — K%
  bbPct: number | null;      // 신규 — BB%
  opsPlus: number | null;    // 신규
  war: number | null;        // Phase 2 — 항상 null, "집계 중"
  woba: number | null;       // Phase 2
  barrelPct: number | null;  // Phase 2
}

interface PitcherSeasonStat {
  // ...기존 필드 (era, fip, whip, k9, bb9) 유지...
  babip: number | null;
  kPct: number | null;
  bbPct: number | null;
  war: number | null;        // Phase 2
}

// src/types/saber.ts — 신규
interface SaberRankingEntry {
  playerId: string;
  name: string;
  teamCode: TeamCode;        // KIA 외 포함 (리그 전체 순위 산출용)
  isPitcher: boolean;
  classicMetric: 'avg' | 'era';
  classicValue: number;
  classicRank: number;       // 리그 순위 (규정 충족자 기준)
  saberMetric: 'wrcPlus' | 'fip';
  saberValue: number;
  saberRank: number;
  gapScore: number;          // classicRank - saberRank (+: 저평가, -: 고평가)
  qualified: boolean;        // 규정 타석/이닝 충족
}

interface SaberRankings {
  updatedAt: string;
  season: number;
  entries: SaberRankingEntry[];  // KIA 선수만 저장 (산출은 리그 전체로)
}

// src/types/saber.ts — 세이버 용어 사전 (정적)
interface SaberGlossaryItem {
  key: 'wrcPlus' | 'fip' | 'babip' | 'kPct' | 'bbPct' | 'opsPlus' | 'war' | 'woba';
  label: string;             // "wRC+"
  oneLiner: string;          // "리그평균 100 기준, 득점 기여도"
  anchor: number | null;     // 100 (wRC+), 4.20 (FIP 리그평균 동적) 등
  interpret: (value: number) => string;  // "리그 평균보다 27% 더 득점에 기여"
}
```

### 3.2 Entity Relationships

```
[Player] 1 ─── 1 [PlayerDetailCache (data/players/{id}.json)]
                    ├── seasonStats: BatterSeasonStat | PitcherSeasonStat (세이버 필드 확장)
                    ├── recentGames: RecentGameStat[]
                    └── currentGrade: GradeResult (기존 grade.ts — wRC+/FIP 우선 유지)

[SaberRankings (data/saber_rankings.json)] 1 ─── N [SaberRankingEntry] ── playerId ──▶ [Player]
```

### 3.3 Storage Schema (JSON 캐시 — DB 없음)

| 파일 | 변경 | 내용 |
|------|------|------|
| `data/players.json` | 무변경 | 로스터 마스터 (id·name·teamCode·position) |
| `data/players/{id}.json` | 필드 추가 | seasonStats에 babip·kPct·bbPct·opsPlus (+war 등 null) |
| `data/saber_rankings.json` | **신규** | SaberRankings (Myth-Buster 데이터) |
| `data/standings.json`, `data/games/*` | 무변경 | 기존 크롤러 산출물 |

> Do 단계 확인사항: 선수 상세 캐시의 실제 경로·구조는 `src/lib/data/cache.ts`의 `loadPlayerDetail()` 구현 기준으로 확정.

---

## 4. API Specification

### 4.1 Endpoint List (모두 인증 없음 — 공개 읽기 전용)

| Method | Path | Description | 상태 |
|--------|------|-------------|------|
| GET | /api/players | 선수 목록 | 기존 무변경 |
| GET | /api/player/[id] | 선수 상세 (세이버 필드 포함됨) | 기존 — 응답에 신규 필드 자연 포함 |
| GET | /api/lineup?team=KIA | 라인업 | 기존 — KIA 고정 호출 |
| GET | /api/standings | 순위 | 기존 무변경 |
| GET | /api/games?range=day\|week\|month | 일정 | 기존 — 클라이언트에서 KIA 필터 |
| GET | **/api/saber-rankings** | Myth-Buster 갭 스코어 | **신규** |

### 4.2 Detailed Specification

#### `GET /api/saber-rankings`

**Response (200):**
```json
{
  "updatedAt": "2026-06-12T06:45:00Z",
  "season": 2026,
  "entries": [
    {
      "playerId": "79402", "name": "김도영", "teamCode": "KIA", "isPitcher": false,
      "classicMetric": "avg", "classicValue": 0.351, "classicRank": 3,
      "saberMetric": "wrcPlus", "saberValue": 168.2, "saberRank": 1,
      "gapScore": 2, "qualified": true
    }
  ]
}
```

**Error Responses:**
- `503`: saber_rankings.json 미생성/만료 → `{ "error": { "code": "DATA_NOT_READY", "message": "집계 중입니다" } }` — UI는 "집계 중" 뱃지
- 캐시 파일 읽기는 기존 `tryReadJsonCache` 패턴 재사용

---

## 5. UI/UX Design

### 5.1 Screen Layout (메인 대시보드 — 모바일 375px 기준)

```
┌──────────────────────────────────────┐
│ Header: KIA 타이거즈 로고 ·            │ ← KIA 레드 #C8102E 포인트
│ "현재 2위 · 41승 25패" 한 줄           │
│            [클래식 스탯 보기 ⬡ 토글]    │ ← 헤더 우측 상시 노출
├──────────────────────────────────────┤
│ StandingsBanner: KIA 행 강조 +        │
│ 게임차 진행 바 (1위와의 거리)            │
├──────────────────────────────────────┤
│ KIA 경기 캘린더 스트립 (오늘±3일)        │
├──────────────────────────────────────┤
│ KiaRecent10 (최근 10경기 — 상시 렌더)   │
├──────────────────────────────────────┤
│ ⚡ Myth-Buster 패널 (신규)             │
│ 김도영: 타율 3위 ↔ wRC+ 1위 (+2) 🟢   │
│ ○○○: 타율 5위 ↔ wRC+ 14위 (-9) 🟠   │
├──────────────────────────────────────┤
│ LineupSection: 선발 + 타순 1~9 카드     │
│ ┌────────┐ 카드: wRC+ 142 (메인)      │
│ │ 사진    │      BABIP .312 K-BB% 18.2│
│ │ 등급보더 │      [타율 .3▒▒ blur+🔒]  │
│ └────────┘                           │
├──────────────────────────────────────┤
│ ScheduleList (KIA 경기만)             │
├──────────────────────────────────────┤
│ Footer: "비공식 독립 팬 프로젝트" 고지    │
└──────────────────────────────────────┘
```

### 5.2 User Flow

```
URL 진입 → (팀 선택 없음) 즉시 KIA 대시보드
  → 카드의 wRC+ 탭 → 툴팁 "리그평균 100 기준…"
  → 헤더 토글 ON → 클래식 셀 블러 해제 + 스낵바 → 세이버 vs 클래식 비교
  → Myth-Buster에서 역전 케이스 발견 → 카드 클릭 → 모달 (세이버 탭 디폴트)
```

### 5.3 Component List

| Component | Location | Responsibility | 상태 |
|-----------|----------|----------------|------|
| SaberModeProvider | `src/features/saber-mode/SaberModeContext.tsx` | `kia_saber_mode` 전역 상태 + localStorage 동기화 | 신규 |
| SaberToggle | `src/features/saber-mode/SaberToggle.tsx` | 헤더 토글 스위치 (44px 터치) + 스낵바 | 신규 |
| ClassicStatCell | `src/features/saber-mode/ClassicStatCell.tsx` | blur(4px)+🔒 ↔ revealed 공통 셀 | 신규 |
| SaberTooltip | `src/components/ui/SaberTooltip.tsx` | 지표명 탭 → 한 줄 정의 (aria-live) | 신규 |
| PendingBadge | `src/components/ui/PendingBadge.tsx` | null 필드 "집계 중" 공통 뱃지 | 신규 |
| MythBusterPanel | `src/features/myth-buster/MythBusterPanel.tsx` | 갭 스코어 목록 + 배지 | 신규 |
| saberGlossary | `src/lib/saber-glossary.ts` | 8개 지표 정의 사전 | 신규 |
| getPlayerImage | `src/lib/player-image.ts` | magu ↔ avatar env 스위치 | 신규 |
| PlayerCard | `src/features/lineup-card/PlayerCard.tsx` | 메인 스탯 → wRC+/FIP, 클래식 셀 블러 | 수정 |
| PlayerModal | `src/features/player-modal/` | 세이버 탭 디폴트 + 클래식 탭(블러 연동) | 수정 |
| StandingsBanner | `src/features/league-standings/` | KIA 행 강조 + 게임차 진행 바 | 수정 |
| ScheduleList | `src/features/game-schedule/` | KIA 경기 필터 고정 | 수정 |
| page.tsx / _dashboard.tsx | `src/app/` | 온보딩 분기 삭제, MythBuster 배치, KiaRecent10 상시 | 수정 |
| team-selection 모듈 전체 | `src/features/team-selection/` | — | **삭제** |

### 5.4 Page UI Checklist

#### 메인 대시보드 (/)

- [ ] Header: KIA 로고/워드마크 + 오늘 날짜 + "현재 N위 · X승 Y패" 텍스트
- [ ] Header: "클래식 스탯 보기" 토글 스위치 (디폴트 OFF=숨김, 44px+ 터치 타깃)
- [ ] StandingsBanner: 10팀 가로 스크롤, KIA 행 글로우 강조, KIA 게임차 진행 바
- [ ] 캘린더 스트립: 오늘±3일 7칸, 홈/원정 구분, 결과(W/L/D) 색상, 우천취소 "취소" 배지
- [ ] KiaRecent10: 최근 10경기 W-L 요약 + 경기별 행 (myTeam 조건 없이 상시 렌더)
- [ ] MythBusterPanel: 갭 절대값 내림차순 목록, 각 행 = 선수명 + "타율 리그 N위 ↔ wRC+ 리그 M위 (갭 ±K)" + 한 줄 해석
- [ ] MythBusterPanel: +갭 초록 배지("저평가") / −갭 주황 배지("고평가") / 갭 0 "일치" 묶음 하단
- [ ] MythBusterPanel: 규정 미달 선수 제외 주석, 데이터 없으면 "집계 중"
- [ ] LineupCard(타자): wRC+ 메인 수치 + BABIP·K%-BB% 보조 + 등급 보더 4색 + 클래식 셀(타율) blur+🔒
- [ ] LineupCard(투수): FIP 메인 + BABIP·K%-BB% 보조 + 클래식 셀(ERA·승수) blur+🔒
- [ ] 지표명(wRC+·FIP·BABIP·K%-BB%·OPS+) 탭 → SaberTooltip: "{정의}. 이 선수 {값} → {해석}"
- [ ] 토글 ON → 모든 ClassicStatCell blur 해제 (transition 0.3s) + 스낵바 "클래식 스탯이 표시됩니다…"
- [ ] WAR·wOBA·Barrel% 위치에 PendingBadge "집계 중" (null 에러 없음)
- [ ] Footer: "이 서비스는 KBO·KIA 타이거즈의 공식 서비스가 아닙니다. 독립 팬 프로젝트입니다."

#### 선수 모달

- [ ] 탭 순서: "세이버" (디폴트 활성) → "클래식" → "역대"
- [ ] 세이버 탭: wRC+/FIP·BABIP·K%·BB%·OPS+ 표 + 각 지표 SaberTooltip 연동
- [ ] 클래식 탭: 토글 OFF 상태면 전체 블러 + 중앙 "클래식 스탯 보기 토글을 켜세요" 안내
- [ ] 등급 산출 근거 박스: 기존 gradeBasis 문구 유지 (세이버 지표 기준 명시)

#### 기존 페이지 회귀 (grades, players, storybook, about)

- [ ] 4페이지 렌더 정상 (players.json·상세 캐시 필드 추가의 영향 없음)
- [ ] team-selection 삭제 후 import 에러 0

---

## 6. Error Handling

### 6.1 Error Cases

| Case | 처리 | UI |
|------|------|-----|
| saber_rankings.json 없음/만료 | API 503 DATA_NOT_READY | MythBusterPanel → "집계 중" 패널 |
| 세이버 필드 null (미수집/Phase2) | 정상 응답, 값만 null | PendingBadge "집계 중" |
| Statiz 크롤 실패 | 마지막 성공 캐시 유지 + Discord 알림 (기존 패턴) | `updatedAt` 오래됨 → 헤더에 "어제 기준" 표기 |
| localStorage 비활성 | isStorageAvailable() 기존 가드 | 세이버 디폴트 고정, 토글은 세션 내만 유지 |
| 비시즌 | games 비어있음 | "시즌 종료 — 최종 성적 보기" 배너 (기존 status 패턴 재사용) |

### 6.2 Error Response Format (기존 패턴 유지)

```json
{ "error": { "code": "DATA_NOT_READY", "message": "집계 중입니다" } }
```

---

## 7. Security Considerations

- [ ] 인증 없음 (공개 읽기 전용) — 기존과 동일, 공격면 최소
- [ ] Statiz 로그인 크리덴셜: GHA Secrets만 사용, 코드/로그에 노출 금지
- [ ] 크롤링 rate-limit 준수 (기존 크롤러 딜레이 정책 유지)
- [ ] "마구마구"·"넷마블" 문자열 코드/UI 부재 확인 (`grep` 게이트)
- [ ] XSS: 크롤 데이터는 JSON 직렬화만, dangerouslySetInnerHTML 금지

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Unit | grade.ts 세이버 경로, 갭 스코어 산출, saber-glossary interpret | Vitest | Do |
| L1: API | /api/saber-rankings, /api/player/[id] 세이버 필드 | Playwright request | Do |
| L2: UI Action | 토글·블러·툴팁·Myth-Buster 렌더 | Playwright | Do |
| L3: E2E | 진입→카드→토글→모달 여정 | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Test Description | Expected Status | Expected Response |
|---|----------|--------|-----------------|:--------------:|-------------------|
| 1 | /api/saber-rankings | GET | 갭 스코어 목록 반환 | 200 | `.entries[]`에 gapScore·classicRank·saberRank 존재 |
| 2 | /api/saber-rankings | GET | 데이터 미생성 시 | 503 | `.error.code` = "DATA_NOT_READY" |
| 3 | /api/player/[id] | GET | 세이버 필드 포함 | 200 | seasonStats에 babip·kPct·bbPct 키 존재 (null 허용) |
| 4 | /api/player/[id] | GET | Phase2 필드 null | 200 | war·woba·barrelPct === null, 에러 없음 |
| 5 | /api/lineup?team=KIA | GET | 기존 회귀 | 200 | 기존 응답 형태 유지 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result | Data Verification |
|---|------|--------|----------------|-------------------|
| 1 | / | 첫 로드 (localStorage 클리어) | 팀 선택 화면 없음, KIA 대시보드 즉시 | 헤더에 "KIA" + 순위 텍스트 |
| 2 | / | 로드 | 클래식 셀 blur + 🔒 표시 | `filter: blur` 스타일 적용 확인 |
| 3 | / | 토글 클릭 | 블러 해제 + 스낵바 표시 | localStorage `kia_saber_mode` 갱신 |
| 4 | / | 새로고침 (토글 ON 후) | 토글 상태 유지 | revealed 상태로 로드 |
| 5 | / | wRC+ 텍스트 탭 | 툴팁 표시 ("리그평균 100…") | aria-live 영역 갱신 |
| 6 | / | MythBusterPanel 로드 | 갭 내림차순 + 배지 색상 | fixture 데이터 순서 일치 |
| 7 | / | 카드 클릭 | 모달 — 세이버 탭 활성 | wRC+/FIP 표 렌더 |
| 8 | 모달 | 클래식 탭 (토글 OFF) | 블러 + 안내 문구 | — |

### 8.4 L3: E2E Scenario Tests

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 비치헤드 여정 | 진입 → Myth-Buster 확인 → 카드 wRC+ 탭(툴팁) → 토글 ON → 클래식 비교 → 모달 | 전 단계 에러 0, 데이터 실렌더 |
| 2 | 캐주얼 복원 여정 | 진입 → 토글 ON → 새로고침 → 클래식 보임 유지 | localStorage 영속 |
| 3 | 데이터 미수집 저하 | saber_rankings 비운 fixture → 진입 | "집계 중" 표시, 크래시 없음 |
| 4 | 기존 회귀 | /grades → /players → /storybook → /about 순회 | 4페이지 정상, 콘솔 에러 0 |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| KIA 타자 (상세 캐시) | 9 | wrcPlus·babip·kPct·bbPct 실값 + war=null |
| KIA 투수 (상세 캐시) | 2 | fip·babip·kPct·bbPct 실값 |
| saber_rankings.json | 11 entries | gapScore 양수·음수·0 각 1개 이상, qualified=false 1개 |
| games (오늘±3일) | 7일치 | W/L/취소 각 1개 이상 |

> 크롤러 POC 성공 시 실데이터 사용. 실패 시 `data/fixtures/`에 수동 시드 작성 후 UI 개발 진행 (파이프라인과 분리).

---

## 9. Clean Architecture

### 9.1 Layer Assignment (Dynamic — 기존 Pragmatic 3-Layer)

| Component | Layer | Location |
|-----------|-------|----------|
| SaberModeContext·Toggle·ClassicStatCell·MythBusterPanel·SaberTooltip | Presentation | `src/features/`, `src/components/ui/` |
| 갭 스코어 산출 로직 (computeGapScores) | Application | `src/services/saber.ts` (신규) |
| SaberRankingEntry·Glossary 타입 | Domain | `src/types/saber.ts` (신규) |
| saber_rankings 로더, getPlayerImage | Infrastructure | `src/lib/data/cache.ts` 확장, `src/lib/player-image.ts` |
| Statiz 크롤러 확장 | Infrastructure (CI) | `scripts/crawler/statiz-saber.ts`, `scripts/crawler/saber-rankings.ts` |

### 9.2 Dependency Rules

기존 규칙 유지: features → services → lib/data → data/*.json. **갭 스코어 산출은 크롤 타임(GHA)에 수행** — 런타임 API는 읽기만 (성능 NFR).

---

## 10. Coding Convention Reference

| Item | Convention Applied |
|------|-------------------|
| JSON 필드 | snake 없이 **camelCase** (기존 stat.ts의 wrcPlus 관례 따름 — Plan §8.2의 snake_case 제안 폐기) |
| 컴포넌트/파일 | PascalCase.tsx, 폴더 kebab-case (기존 관례) |
| null 처리 | `value === null` → PendingBadge. `undefined` 금지 (타입에 명시적 null) |
| 색상 토큰 | tailwind.config.ts에 `kia.red #C8102E`·`kia.black #1A1A1A` 추가. 등급 4색은 PRD §6 기준 재정의 (elite=KIA레드 글로우·rare=주황·special=노랑·normal=회색) |
| Design Ref 주석 | 핵심 결정 지점에 `// Design Ref: §N — 근거` |

---

## 11. Implementation Guide

### 11.1 File Structure (신규/수정만)

```
src/
├── features/
│   ├── saber-mode/                    # 신규
│   │   ├── SaberModeContext.tsx
│   │   ├── SaberToggle.tsx
│   │   └── ClassicStatCell.tsx
│   ├── myth-buster/                   # 신규
│   │   ├── MythBusterPanel.tsx
│   │   └── useSaberRankings.ts
│   ├── team-selection/                # 삭제 (폴더 전체)
│   ├── lineup-card/PlayerCard.tsx     # 수정 — 세이버 메인 스탯
│   ├── player-modal/                  # 수정 — 탭 재구성
│   ├── league-standings/              # 수정 — KIA 강조+게임차 바
│   ├── game-schedule/                 # 수정 — KIA 필터
│   └── recent-games/                  # 수정 — 상시 렌더
├── components/ui/
│   ├── SaberTooltip.tsx               # 신규
│   └── PendingBadge.tsx               # 신규
├── services/saber.ts                  # 신규 — 갭 스코어 로더
├── lib/
│   ├── saber-glossary.ts              # 신규
│   ├── player-image.ts                # 신규 — getPlayerImage()
│   ├── constants.ts                   # 수정 — MY_TEAM='KIA', 등급색
│   └── grade.ts                       # 소폭 수정 — basis 문구
├── app/
│   ├── page.tsx                       # 수정 — 온보딩 분기 삭제
│   ├── _dashboard.tsx                 # 수정 — MythBuster 배치
│   ├── layout.tsx                     # 수정 — 메타데이터 KIA
│   └── api/saber-rankings/route.ts    # 신규
scripts/crawler/
├── statiz-saber.ts                    # 신규 (기존 statiz 모듈 확장)
└── saber-rankings.ts                  # 신규 — 갭 스코어 산출
.github/workflows/crawl.yml            # 수정 — saber 잡 2개 추가
tailwind.config.ts                     # 수정 — KIA 토큰
tests/e2e/                             # onboarding.spec 재작성 + saber.spec 신규
```

### 11.2 Implementation Order

1. [ ] **module-1**: Statiz POC → 크롤러 확장 → 타입 확장 → saber_rankings 산출
2. [ ] **module-2**: team-selection 제거 + KIA 고정 + 브랜딩 (breaking change 먼저 격리)
3. [ ] **module-3**: 세이버 카드 + 토글 + 툴팁 + 사진 추상화
4. [ ] **module-4**: Myth-Buster + 일정·순위 강화 + 모달 탭
5. [ ] **module-5**: E2E 갱신 + 회귀 + Lighthouse

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| 데이터 파이프라인 | `module-1` | Statiz POC (STATIZ_OPT_IN), babip·kPct·bbPct·opsPlus 수집, saber_rankings.ts 갭 산출, GHA 잡, 타입 확장, 실패 시 fixture 시드. **POC 실패 시 FIP 직접 계산 폴백 결정** | 40-50 |
| KIA 전용 진입 | `module-2` | team-selection 폴더 삭제, useMyTeam 소비처 5곳 KIA 고정, page.tsx 분기 제거, tailwind KIA 토큰, layout 메타데이터, 푸터 고지 | 30-40 |
| 세이버 표시 레이어 | `module-3` | SaberModeContext·Toggle·ClassicStatCell·SaberTooltip·PendingBadge·saber-glossary·getPlayerImage, PlayerCard 개조 | 40-50 |
| Myth-Buster + 시각화 | `module-4` | MythBusterPanel, /api/saber-rankings, 모달 탭 재구성, StandingsBanner 게임차 바, ScheduleList KIA 필터, KiaRecent10 상시화 | 40-50 |
| 검증 | `module-5` | E2E 재작성(onboarding→entry), saber.spec, 회귀 4페이지, a11y 대비율, Lighthouse | 30-40 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Do | `--scope module-1,module-2` | 70-90 |
| Session 2 | Do | `--scope module-3,module-4` | 80-100 |
| Session 3 | Do+Check | `--scope module-5` + analyze | 60-80 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-06-12 | 초안 — Option C 선택, 코드 조사 결과 반영 (Statiz 비활성·grade.ts 세이버 우선 기구현 확인) | harvester |
| 0.2 | 2026-06-12 | **레이아웃 재편 (사용자 요청)** — §5.1 대체: 정보 밀집형. ① 출전순 전체 로스터 표 (`roster-table` 모듈, 타자/투수 분리, 세이버=금색·클래식=블러, "최근 근황" 컬럼)가 주인공 ② 데스크탑 2열 그리드 (Myth-Buster\|최근10경기, 일정\|라인업카드) ③ 크롤러 확장: games·hr·rbi·w/l/sv/hold·recentForm(최근 5G 요약/최근 등판)·lastGameDate ④ 운세 심층화: `lib/saju.ts` (천간 오행 + 일진 간지 + 상생상극 5등급 + 별자리 일일 + 행운 숫자/방위/색/아이템). SaberCardEntry에 name·position·uniformNumber·games·recentForm 추가 | harvester |
