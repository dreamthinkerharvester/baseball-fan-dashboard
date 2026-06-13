# kia-fan-service Planning Document

> **Summary**: 기존 KBO 10구단 대시보드를 KIA 타이거즈 팬 전용 + 세이버메트릭스 디폴트 서비스로 피벗
>
> **Project**: baseball-fan-dashboard → kia-fan-service (피벗)
> **Version**: 0.1.0
> **Author**: harvester
> **Date**: 2026-06-12
> **Status**: Draft
> **PRD**: [docs/00-pm/kia-fan-service.prd.md](../../00-pm/kia-fan-service.prd.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | KIA 팬은 "이 선수 진짜 잘하나, 운인가?"를 알고 싶지만 스탯티즈는 PC 전용 복잡한 표, KBO앱은 세이버 지표 부재, KIA 단일팀 전용 뷰는 어디에도 없다. |
| **Solution** | 기존 baseball-fan-dashboard를 피벗: KIA 전용 즉시 진입 + 세이버 지표(wRC+·FIP·BABIP·K%-BB%·OPS+) 디폴트 표시 + 클래식 스탯 블러 숨김/공개 토글 + Myth-Buster(체감 vs 데이터 갭) 패널. |
| **Function/UX Effect** | 팀 선택 온보딩 제거로 3초 내 가치 전달. 카드 등급 색상(기존 시스템)을 세이버 기준으로 재계산. "타율 3위지만 wRC+ 11위" 같은 역전 케이스를 첫 화면에서 발견하는 재미. |
| **Core Value** | "KIA 팬이라면 타율보다 wRC+" — 데이터가 말하는 실력 vs 팬이 체감하는 실력을 한 화면에서 비교하는, 오피니언 있는 단일팀 세이버 서비스. |

---

## Context Anchor

> Design/Do 문서로 전파되는 컨텍스트 앵커.

| Key | Value |
|-----|-------|
| **WHY** | 세이버 × 모바일 × KIA 단일팀 조합은 경쟁사 5곳 모두 비어있는 공백. 클래식 스탯으로는 선수의 실제 기여를 읽을 수 없다. |
| **WHO** | 비치헤드 = 27~35세 KIA 팬 직장인 "세이버 호기심" 세그먼트 (P1). 캐주얼 팬(P2)은 토글로 보호. |
| **RISK** | ① Statiz 세이버 크롤링 실패(Score 20 — POC 선행으로 완화) ② 캐주얼 팬의 클래식 숨김 거부(토글 상시 제공으로 완화) ③ 세이버 용어 장벽(인라인 툴팁 "리그평균=100 기준"으로 완화) |
| **SUCCESS** | Statiz 크롤러 수집 성공 + 세이버 디폴트 카드 렌더 + 블러 토글 동작 + Myth-Buster 갭 산출 + 모바일 Lighthouse 80+ |
| **SCOPE** | Phase 1 = F1 홈 + F2 세이버카드/토글 + F3 Myth-Buster + F5 일정·순위 + 크롤러 확장. 스토리북 탭·관전포인트·공유카드는 Phase 2. |

---

## 1. Overview

### 1.1 Purpose

기존 KBO 10구단 범용 카드 대시보드(baseball-fan-dashboard)를 **KIA 타이거즈 팬 전용 세이버메트릭스 대시보드**로 피벗한다. 핵심 차별화는 클래식 스탯(타율·타점·ERA)을 **의도적으로 숨기고** 세이버 지표만 디폴트로 보여주는 "세이버 온리 모드"이며, 사용자가 토글로 클래식을 공개해 두 관점을 비교할 수 있게 한다.

### 1.2 Background

- 원본 프로젝트는 Phase 1 MVP 완료 상태 (라인업 카드·순위·일정·선수 모달·크롤러 파이프라인 동작).
- kia-player-storybook 기능이 이미 완성되어 있음 (PDCA completed) — Phase 2에서 탭으로 통합.
- 사용자 결정 (2026-06-12 Checkpoint):
  1. **MVP 범위**: PRD 제안대로 (F1·F2·F3·F5 + 크롤러 확장. F4·F6·공유카드는 Phase 2)
  2. **검증 게이트**: 크롤러 POC만 수행 (Painted Door·hallway test 생략, 토글 UX로 리스크 흡수)
  3. **선수 사진**: assets-magu 일단 사용, 외부 공개 시점에 재검토 — **코드에서 교체 쉽게 추상화 필수**

### 1.3 Related Documents

- PRD: `docs/00-pm/kia-fan-service.prd.md` (피벗 델타·기능 명세·리스크 원본)
- 원본 PRD: `docs/00-pm/baseball-fan-dashboard.prd.md`
- 스토리북 PRD: `docs/00-pm/kia-player-storybook.prd.md` (Phase 2 통합 대상)
- 원본 Design: `docs/02-design/features/baseball-fan-dashboard.design.md` (재사용 컴포넌트 구조 참조)

---

## 2. Scope

### 2.1 In Scope (Phase 1 MVP)

- [ ] **FR-01** Statiz 세이버 크롤러 POC + 확장 (wRC+·FIP·BABIP·K%·BB%·OPS+ → players.json)
- [ ] **FR-02** KIA 전용 즉시 진입 홈 (팀 선택 제거 + KIA 레드/블랙 브랜딩)
- [ ] **FR-03** 세이버 온리 카드 (타자 wRC+ 메인 / 투수 FIP 메인 + 세이버 기준 등급 재계산)
- [ ] **FR-04** 클래식 스탯 블러 숨김/공개 토글 (`kia_saber_mode` localStorage)
- [ ] **FR-05** 세이버 용어 인라인 교육 툴팁 ("리그평균=100 기준" 정박)
- [ ] **FR-06** Myth-Buster 패널 (클래식 순위 − 세이버 순위 갭 스코어)
- [ ] **FR-07** KIA 경기 일정·결과·순위 시각화 (캘린더 스트립 + 순위 배너 + 최근 5경기 타임라인)
- [ ] **FR-08** 선수 사진 추상화 레이어 (assets-magu ↔ SVG 아바타 스위치 가능 구조)

### 2.2 Out of Scope (Phase 2 이후)

- 관전 포인트 카드 (F4 — 상대 선발 FIP vs KIA 타선 wRC+ 매치업)
- 공유 카드 OG 이미지 생성
- kia-player-storybook 탭 통합 (F6)
- WAR·wOBA·Barrel% 수집 (MVP에서는 "집계 중" 뱃지)
- KIA 경기 결과 "우리 시점" 3줄 요약 카드
- Supabase 마이그레이션, 브라우저 알림, 비시즌 콘텐츠

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Statiz 크롤러 확장: KIA 선수 전체의 wRC+·FIP·BABIP·K%·BB%·OPS+를 매일 06:30 수집해 `data/players.json`에 세이버 필드 추가. 실패 시 마지막 성공 캐시 서빙. **POC를 구현 1순위로 선행** | High | Pending |
| FR-02 | 팀 선택 온보딩(`team-selection`·`MyTeamSettings`) 제거, URL 진입 즉시 KIA 대시보드. KIA 레드 `#C8102E`·블랙 `#1A1A1A` 테마. 헤더에 "현재 N위 · X승 Y패" 한 줄 | High | Pending |
| FR-03 | 라인업/선수 카드 대표 스탯 교체: 타자 wRC+(메인)+BABIP+K%-BB%, 투수 FIP(메인)+BABIP+K%-BB%. 카드 등급(엘리트/레어/스페셜/노멀)을 세이버 백분위 기준으로 재계산 (wRC+ 타자 / FIP 역순 투수, 미수집 시 OPS/ERA 폴백) | High | Pending |
| FR-04 | 클래식 스탯 셀 `blur(4px)` + 자물쇠 아이콘. "클래식 스탯 보기" 토글 ON 시 블러 해제 + 스낵바. 상태는 `kia_saber_mode` localStorage 저장 (디폴트 = 숨김) | High | Pending |
| FR-05 | 지표명 탭 시 인라인 툴팁: "{지표}: {한 줄 정의}. 이 선수 {값} → 리그평균({기준}) 대비 {해석}". 8개 지표 사전 정의. aria-live 지원 | High | Pending |
| FR-06 | Myth-Buster 패널: GHA에서 매일 06:45 전체 KBO 규정타석/이닝 충족 선수의 클래식 순위·wRC+ 순위 산출 → 갭 스코어를 `data/saber_rankings.json`에 저장. UI는 갭 절대값 내림차순, +갭 초록 / −갭 주황 배지 | High | Pending |
| FR-07 | KIA 경기 캘린더 스트립(오늘±3일) + 10팀 순위에서 KIA 행 강조·게임차 진행 바 + 최근 5경기 결과 타임라인. 더블헤더/우천취소/연장 엣지 케이스 처리 | Medium | Pending |
| FR-08 | `getPlayerImage(playerId)` 단일 진입점으로 사진 소스 추상화. env 또는 config 플래그로 assets-magu ↔ SVG 아바타 전환 가능 (IP 재검토 대비) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | FCP < 2.0s, LCP < 3.5s, CLS < 0.1 (4G·모바일) | Lighthouse |
| Performance | 블러 토글 전환은 CSS transition만 (JS 재연산 0) | 코드 리뷰 + 저사양 기기 확인 |
| Reliability | Statiz 크롤러 성공률 95%+ (7일 관측), 실패 시 "집계 중" 부드러운 저하 | GitHub Actions 로그 |
| Accessibility | WCAG 2.1 AA. KIA 레드 위 화이트 텍스트 대비율 4.5:1+, 토글 터치 타깃 44px+ | Lighthouse a11y + 수동 |
| Responsive | 375px(3열 카드) → 768px → 1280px(4열) | 수동 + Playwright 뷰포트 |
| Legal | 마구마구·넷마블 브랜드명 코드/UI 사용 금지. 푸터에 비공식 팬 프로젝트 고지 | 코드 grep + UI 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01~08 전체 구현 완료
- [ ] Statiz 세이버 크롤러 POC 성공 (KIA 선수 전체 wRC+·FIP 실데이터 수집 확인)
- [ ] 세이버 디폴트 카드 + 블러 토글이 모바일에서 동작 (TS-01~03 시나리오 통과)
- [ ] Myth-Buster 갭 스코어가 실데이터로 산출·표시
- [ ] team-selection 제거 후 기존 페이지(grades·players 등) 회귀 없음
- [ ] Playwright E2E: 진입→카드→토글→모달 핵심 플로우 통과

### 4.2 Quality Criteria

- [ ] 모바일 Lighthouse 성능 80점+
- [ ] Lint 에러 0, 빌드 성공
- [ ] WAR·wOBA·Barrel% null 시 에러 없이 "집계 중" 뱃지 (TS-07)
- [ ] localStorage 비활성 환경에서도 세이버 디폴트로 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Statiz 크롤링 차단·구조 변경 (R1) | High | High | **FR-01 POC를 구현 1순위로 선행** — 실패 시 KBO 공식 데이터로 세이버 계산식 직접 구현 검토. 실패해도 "집계 중" UI로 서비스 유지 |
| 캐주얼 팬 클래식 숨김 거부 (R2) | High | Medium | 토글 상시 제공 + 진입 시 토글 위치 명확 노출. 사용자 실험은 생략(개인 프로젝트), 거부 신호 발견 시 디폴트 병렬 표시로 피벗 |
| 세이버 용어 진입장벽 (R3) | Medium | High | FR-05 인라인 툴팁 + "리그평균=100" 정박 기준 상시 표시 |
| 마구마구 IP 클레임 (R4) | High | Low | FR-08 사진 추상화로 즉시 교체 가능 구조. 브랜드명 완전 배제. 외부 공개 전 재검토 (사용자 결정) |
| 기존 기능 회귀 (피벗 파괴 범위) | Medium | Medium | 6장 Impact Analysis의 소비처 전수 확인 + 기존 E2E 테스트 유지 실행 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `data/players.json` | Schema | 세이버 필드 추가 (`wrc_plus, fip, babip, k_pct, bb_pct, ops_plus, war:null, woba:null, barrel_pct:null`) |
| `data/saber_rankings.json` | Schema (신규) | 갭 스코어 + 리그 순위 (Myth-Buster용) |
| `src/features/team-selection/` | Component | **삭제** (MyTeamSettings 포함) |
| localStorage `baseball_myteam` | Config | **제거** → `kia_saber_mode` (boolean)로 대체 |
| `src/features/lineup-card/` | Component | 대표 스탯 세이버 교체 + 등급 재계산 + 블러 토글 |
| `src/features/player-modal/` | Component | 세이버 탭 디폴트 + 클래식 탭 추가 |
| `src/features/league-standings/` | Component | KIA 행 강조 + 게임차 진행 바 |
| `src/features/game-schedule/`, `recent-games/` | Component | KIA 경기 필터링 |
| `tailwind.config.ts` | Config | `kia-red #C8102E`, `kia-black #1A1A1A` 추가 |
| `.github/workflows/` | CI | Statiz 세이버 수집 워크플로우 1개 + 갭 스코어 산출 잡 추가 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `players.json` | READ | `src/lib/data/` 로더 → grades·players 페이지, player-modal, player-search | 필드 추가만 — 기존 필드 유지로 Non-breaking. 단 스키마 타입(`src/types`) 갱신 필요 |
| `baseball_myteam` localStorage | READ | team-header, league-standings 하이라이트, team-selection | **Breaking** — 소비처 전수 수정 (KIA 고정값으로 대체) |
| team-selection 컴포넌트 | RENDER | 루트 페이지 온보딩 분기 | **Breaking** — 분기 제거, 즉시 대시보드 렌더 |
| lineup-card 등급 계산 | READ | `src/lib/` 백분위 계산 → 카드 보더 색상 | 등급 입력 지표만 교체 (클래식→세이버), 등급 체계 유지 |
| 크롤러 워크플로우 | WRITE | `data/*.json` 커밋 (GHA cron) | 신규 잡 추가 — 기존 잡과 커밋 충돌 없게 시간 분리 (06:30/06:45) |
| storybook 페이지 (`/storybook`) | READ | kia-player-storybook (completed) | Phase 1에서는 무변경 유지 — players.json 필드 추가의 영향 없음 확인 필요 |

### 6.3 Verification

- [ ] players.json 스키마 확장 후 grades·players·storybook 페이지 정상 렌더
- [ ] `baseball_myteam` 참조 코드 전수 제거 (`grep -r "myteam" src/`로 확인)
- [ ] 크롤러 신규 잡이 기존 잡의 data 커밋과 충돌하지 않음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ☐ |
| **Dynamic** (feature-based modules, 기존 구조 유지) | ☑ |
| Enterprise | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | 유지 vs 변경 | **Next.js 14 App Router (유지)** | 피벗에서 스택 변경 없음 — 재사용 극대화 |
| State Management | Context / Zustand | **useState + localStorage (유지)** | 토글 1개 상태 추가뿐. 과설계 금지 |
| Data Layer | JSON 캐시 / Supabase | **JSON 파일 캐시 (유지)** | players.json 필드 확장으로 충분. DB 이관은 Phase 3 |
| Crawler | 신규 작성 / 기존 확장 | **GHA + Cheerio 기존 파이프라인 확장** | Statiz 세이버 잡 1개 추가 |
| Styling | — | **Tailwind + KIA 커스텀 컬러** | config 추가만으로 브랜딩 전환 |
| Testing | — | **Playwright (기존) + Vitest (기존)** | 기존 E2E 회귀 + 신규 토글/갭 시나리오 |
| 사진 소스 | 직접 참조 / 추상화 | **`getPlayerImage()` 추상화 레이어** | IP 재검토 시 1곳 수정으로 전환 (사용자 결정) |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic (기존 Pragmatic 3-Layer 유지)

src/features/   ← lineup-card·player-modal 등 수정, team-selection 삭제,
                  myth-buster 신규
src/services/   ← 세이버 등급 계산·갭 스코어 로더 신규
src/lib/data/   ← players.json 로더 스키마 확장, getPlayerImage() 신규
scripts/crawler/ ← statiz-saber.ts 신규, saber-rankings.ts 신규
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] ESLint (`.eslintrc.json`) / Prettier (`.prettierrc`) / TypeScript (`tsconfig.json`) 존재
- [x] feature-based 폴더 구조 컨벤션 확립 (기존 10개 feature 모듈)
- [ ] `CONVENTIONS.md` 별도 파일 없음 — 기존 코드 스타일 따름

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| 세이버 필드 네이밍 | 없음 | snake_case JSON (`wrc_plus`) ↔ camelCase TS (`wrcPlus`) 매핑 규칙 | High |
| 등급 색상 토큰 | 다크블루 테마 | `kia-red`·`kia-black` Tailwind 토큰 + 등급 4색 재정의 | High |
| null 처리 | 없음 | 미수집 세이버 필드 = `null` + "집계 중" 컴포넌트 공통화 | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_PLAYER_IMAGE_SOURCE` | `magu` \| `avatar` 사진 소스 스위치 | Client | ☐ |
| `DISCORD_WEBHOOK_URL` | 크롤러 실패 알림 (기존 재사용 여부 확인) | CI | ☐ |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design kia-fan-service`) — 3개 아키텍처 옵션 비교 포함
2. [ ] FR-01 크롤러 POC를 Do 단계 모듈 1순위로 배치
3. [ ] 구현 (`/pdca do kia-fan-service`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-06-12 | 초안 — PRD v1.0 기반, 사용자 Checkpoint 결정 3건 반영 | harvester |
