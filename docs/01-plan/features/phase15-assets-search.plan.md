# Phase 1.5 Plan — Assets Integration + Player Search

> **Status**: Draft (PDCA Cycle #2 시작)
> **Author**: bkit-pdca
> **Date**: 2026-05-10
> **Parent**: [baseball-fan-dashboard.plan.md](./baseball-fan-dashboard.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Phase 1 MVP 코드 완성(94%) 후 (a) 비주얼 자산 부재로 모바일 카드의 변별력 약함, (b) 마이팀 외 선수 정보 탐색 동선 부재 → 사용자가 라인업에 없는 선수를 찾을 수 없음 |
| **WHO** | 동일 (Persona B) + 라인업 외 선수도 빠르게 보고 싶은 야구 팬 |
| **REFERENCE** | ma9.netmarble.net 의 검색 패턴(시즌 셀렉트 + 카테고리 탭 + 키워드)·랭킹 테이블 정보 밀도만 영감으로 차용. **IP-safe 최우선** — grep CI 0건 유지 |
| **NON-GOALS** | 마구마구 캐릭터/UI 픽셀 단위 모방, 게임 데이터 import, 실제 KBO 선수 사진 사용(라이선스 위험) |

## Scope

### F1. 비주얼 에셋 통합 (사용자 제공)

사용자가 §3 프롬프트로 생성한 6세트 통합:

| 세트 | 위치 | 적용 컴포넌트 |
|---|---|---|
| 등급별 카드 배경 4종 | `public/cards/bg-{elite,rare,special,normal}.png` | `PlayerCard.tsx` `--card-bg` 변수 |
| 포지션 아이콘 10종 | `public/avatars/{P,C,1B,2B,3B,SS,LF,CF,RF,DH}.svg` | `PlayerCard.tsx` 포지션 영역 |
| 팀 모노그램 10종 | `public/teams/{LG,KT,...}.svg` | `Header.tsx` 마이팀 배지, `StandingsBanner` |
| OG 이미지 | `public/og-image.png` | `app/layout.tsx` metadata |
| 선수 실루엣 3종 | `public/silhouettes/{batter,pitcher,fielder}.png` | `PlayerCard.tsx` photoUrl 폴백 |
| Favicon set | `public/favicon-*.png` + `public/icon.svg` | `app/layout.tsx` icons |

### F2. 선수 검색 페이지 `/players`

**Layout**: 마구마구 랭킹 테이블의 "정보 밀집 + 시즌 셀렉트 + 검색" 패턴 영감.

```
┌─ Header (sticky) ──────────────────────────────────┐
│  KBO 카드 대시보드            [LG] ⚙               │
├─ Tabs: 마이팀 │ 검색 │ 순위                          │
├─ /players ──────────────────────────────────────────┤
│  ┌ 검색 입력 (debounce 200ms) ─────────────────┐   │
│  │ 🔍 [선수명 입력...]                           │   │
│  └────────────────────────────────────────────┘   │
│  ┌ Filter Chips ─────────────────────────────────┐ │
│  │ [전체팀▼] [전포지션▼] [2025시즌▼]            │ │
│  └────────────────────────────────────────────┘   │
│  ┌ Results (list, not card) ─────────────────────┐ │
│  │  P  손주영   LG    ERA 3.21   →               │ │
│  │  CF 박해민   LG    OPS .785   →               │ │
│  │  3B 김도영   KIA   OPS 1.024  →               │ │
│  │  ...                                          │ │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

> **결정**: 검색 결과는 **리스트 형태** (카드 X). 라인업 카드의 "최근 10경기 등급"은 라인업 컨텍스트 종속이라 검색 결과에서는 의미 없음. 시즌 대표 스탯만 표시 → 클릭 시 기존 `PlayerModal` 재사용.

### F3. (Defer) Statiz 크롤러 selector 확정

이번 사이클 비포함. F1+F2 검증 후 별도 사이클로 분리. 현재 placeholder 유지.

## Architecture (Surgical)

| 신규 파일 | 책임 |
|---|---|
| `src/types/search.ts` | `PlayerSearchResult`, `SearchFilters` |
| `src/services/players-search.ts` | 메모리 인덱스 + filter 함수 (서버) |
| `src/app/api/players/search/route.ts` | GET `?q&team&position` → `Player[]` + keyStat |
| `src/app/players/page.tsx` | 검색 페이지 컨테이너 |
| `src/features/player-search/PlayerSearchPanel.tsx` | 메인 패널 (client) |
| `src/features/player-search/SearchInput.tsx` | debounce 입력 |
| `src/features/player-search/FilterChips.tsx` | 팀/포지션 셀렉트 |
| `src/features/player-search/ResultsList.tsx` | 결과 행 + 모달 트리거 |

| 수정 파일 | 변경 |
|---|---|
| `src/components/layout/Header.tsx` | 검색 메뉴 링크 1개 추가 (모바일 안전) |

**No-op 영역**: 라인업 카드/등급 산출/크롤러/JSON 캐시 인터페이스 — 외과적 변경 원칙으로 손대지 않음.

## Success Criteria

| # | Criteria | 검증 |
|---|---|---|
| SC-1 | 키워드 부분 일치 검색 (한글 정규화 포함) | unit test (`tests/unit/players-search.test.ts`) |
| SC-2 | 팀/포지션 필터 AND 조합 동작 | unit test |
| SC-3 | 결과 클릭 시 기존 `PlayerModal` 동일 UX 재사용 | E2E (다음 사이클) |
| SC-4 | 모바일 헤더에서 "검색"으로 1탭 진입 | manual |
| SC-5 | grep CI 0건 (마구마구·네오위즈·넷마블) | `pnpm forbidden-words` |
| SC-6 | typecheck + lint 0 errors | `pnpm typecheck && pnpm lint` |

## Risks

- **R1**: 검색 결과에 비투수/투수 keyStat 분기 누락 → unit test로 양 케이스 커버
- **R2**: `data/players.json` 메타에는 있는데 `data/players/{id}.json` 시즌 스탯이 없는 선수 → keyStat="—" 폴백
- **R3**: 사용자가 이미지 도착 전에 F1 작업 막힘 → F2(검색)부터 병렬 진행해 차단 회피

## Estimate

- F1 통합: 1세션 (이미지 도착 후)
- F2 검색: 1~2세션 (이번 사이클 본 작업)
- 총 2~3세션
