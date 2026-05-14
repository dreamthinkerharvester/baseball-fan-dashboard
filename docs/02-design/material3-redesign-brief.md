# Material 3 Redesign Brief — KBO Baseball Fan Dashboard

> **목적**: 현재 다크 테마 + Tailwind 기반 UI를 Material 3 Design System으로 리디자인한 시안(Figma/HTML/SVG/PNG 등) 제작을 위한 요청 명세서.
>
> **수신**: 디자인 시안 제작자 (사용자가 외부에서 작업, 결과물 가져와서 코드에 적용)
> **작성일**: 2026-05-14
> **현재 라이브 URL**: https://baseball-fan-dashboard.vercel.app

---

## 1. 프로젝트 한 줄

> **KBO 마이팀 라인업의 컨디션을 30초 안에 카드 색상으로 판독하고, 선수별 블로그 초안까지 만들 수 있는 정보 밀집형 모바일 대시보드.**

기술 스택: Next.js 14 App Router · Tailwind 3 · TypeScript strict · 다크 테마 · Pretendard 한글 폰트.

---

## 2. 사용자 컨텍스트 (페르소나)

- **Persona B — 25~40세 직장인 캐주얼 KBO 팬**
- 점심·통근·쉬는 시간에 모바일로 짧게 (30초~1분) 확인
- 마이팀(현재 KIA) 정보 우선. 데이터가 많이 보이되 한눈에 컨디션이 판독되길 원함
- "정보 밀집 + 시각적으로 즉각" = Football Manager 25 UX 톤 선호 (사용자 명시)

---

## 3. 핵심 변경 목표

| Before | After (Material 3) |
|---|---|
| 다크 단색 톤 (#0F1320) + 임의 액센트 | M3 Color Roles 5축 (primary/secondary/tertiary/error/surface) + dark theme tonal palette |
| 손으로 짠 elevation·shadow | M3 5단계 elevation 토큰 |
| 임의 border-radius 8/12 | M3 shape scale (extra-small 4 / small 8 / medium 12 / large 16 / extra-large 28) |
| 폰트 사이즈 임의 (text-xs ~ text-lg) | M3 type scale (Display/Headline/Title/Body/Label, L·M·S) |
| 단순 hover scale | M3 motion (emphasized / standard easing, duration tokens) |
| 카드·배지 임의 색상 | M3 surface tonal layers + colored chips |

**고급스러움 = M3의 절제된 elevation + tonal nuance + 의미 있는 motion**

---

## 4. 절대 유지할 코어 (변경 금지)

1. **등급 4단계 색상 시스템 + 의미** — `ELITE/RARE/SPECIAL/NORMAL` (보라/빨강/노랑/파랑). 색상은 M3 톤으로 변환하되 **4단계 위계와 의미는 보존**.
2. **WCAG 텍스트 라벨 동반** — 색상 단독 의존 금지. 모든 등급은 텍스트 배지 함께.
3. **모바일 우선** — iPhone SE(375×667) 기준 핵심 정보 1~2 스크롤 안에. 터치 타깃 ≥ 44×44.
4. **Pretendard Variable 한글** — M3 typography scale에 매핑하되 영문은 Roboto Flex.
5. **다크 모드 기본** — 야구 카드 게임의 시각 언어. 라이트 모드는 Phase 2.
6. **IP 안전** — 마구마구·네오위즈·넷마블 로고/문자/픽셀 모방 0건.
7. **선수 사진** — 네이버에서 fetch한 `/assets/players/{code}.png` 22장 그대로 활용.

---

## 5. 현재 화면 구조 (리디자인 대상)

### 5.1 메인 대시보드 `/`
```
┌─────────────────────────────────────────┐
│ HEADER (sticky)                          │
│  🔍 검색  KBO 카드 대시보드     [KIA] ⚙ │
├─────────────────────────────────────────┤
│ 리그 순위 (10팀 칩 가로 스크롤, 마이팀↑)│ ← StandingsBanner
├─────────────────────────────────────────┤
│ 매치업 헤더 (3-col)                      │ ← TeamMatchupPanel (신규 v2)
│  ┌────────┬─────────┬─────────────┐    │
│  │ 시즌    │ 오늘 VS │ 최근 5 폼   │    │
│  │ KPI 6개 │ 상대팀  │ W L 점 표시 │    │
│  └────────┴─────────┴─────────────┘    │
├─────────────────────────────────────────┤
│ 마이팀 라인업 (선발 1 + 타순 9)          │ ← LineupGrid
│  ┌───┬───┬───┬───┬───┐                 │
│  │P  │1  │2  │3  │4  │ ← 5열 데스크    │
│  ├───┼───┼───┼───┼───┤   3-4열 모바일  │
│  │5  │6  │7  │8  │9  │                 │
│  └───┴───┴───┴───┴───┘                 │
├─────────────────────────────────────────┤
│ 경기 일정 (오늘/이번주/이번달 탭)        │ ← ScheduleList
└─────────────────────────────────────────┘
```

### 5.2 선수 모달 (카드 클릭 시 bottom-sheet)
- 선수 사진 + 이름 + 등급 + 등번호
- 탭: 시즌 / 역대 / 최근 10경기
- 핵심 스탯 표 + 최근 10경기 mini sparkline

### 5.3 스토리북 `/storybook`
```
┌─────────────────────────────────────────┐
│ HEADER  📝 Storybook                     │
├─────────────────────────────────────────┤
│ 🔍 [선수명 입력]  최근사용: A B C       │
├──────────────────────┬──────────────────┤
│ 결과 패널 (4섹션)    │ 이미지 풀 (26장) │
│ ① 오늘의 경기        │ ┌──┬──┬──┐       │
│ ② 전성기 시즌        │ │📷│📷│📷│       │
│ ③ 과거 뉴스 5건      │ ├──┼──┼──┤       │
│ ④ 선수 서사 타임라인 │ │📷│📷│📷│       │
│                      │ 슬롯 1·2·3       │
├──────────────────────┴──────────────────┤
│ 📝 마크다운 미리보기 (1500~2500자)      │
│ [📋 복사] [⬇ .md] [🔄 재생성]          │
└─────────────────────────────────────────┘
```

---

## 6. Material 3 토큰 — 제안 (디자이너 자유 조정)

### 6.1 Color Roles (Dark Theme)

| Role | 후보 시드 | 비고 |
|------|----------|------|
| **Seed (primary 도출 베이스)** | `#EA0029` (KIA 타이거즈 빨강) | 마이팀이 KIA일 때. 다른 팀 선택 시 그 팀 컬러로 dynamic theming 검토 |
| **Primary** | KIA Red → M3 dark Primary 80 톤 | CTA·Active 상태·Brand accent |
| **Secondary** | 야구 그라운드 그린 계열 (`#316B3A` seed) | 정보성 강조, 필터 칩 |
| **Tertiary** | 빈티지 카드 톤 (gold/amber, `#C9A961` seed) | 등급 ELITE 강조·rare moments |
| **Error** | M3 기본 (`#F2B8B5`) | 부정적 결과(L 표시·서버 에러) |
| **Surface** | M3 dark surface (`#1C1B1F` base) + tonal layers 1~5 | 카드·시트·배경 |

### 6.2 등급 4단계 — M3 톤 매핑 (코어 보존, 톤만 M3화)

| 등급 | 의미 | 현재 색상 | M3 매핑 권고 |
|------|------|---------|-------------|
| **ELITE** | 보라 / 최상위 | `#7B2FBE` | Tertiary container + label (gold tint) 또는 별도 ColorRole 추가 (`role-elite`) |
| **RARE** | 빨강 / 상위 | `#E63946` | Primary container (KIA 시즌엔 primary와 충돌 → 다른 시드 필요) |
| **SPECIAL** | 노랑 / 중위 | `#F4A261` | Tertiary 또는 별도 (warning-amber) |
| **NORMAL** | 파랑 / 평균 | `#457B9D` | Secondary container |

> ⚠ **충돌 주의**: KIA primary와 RARE 빨강이 둘 다 빨강. 디자이너 권한으로 RARE를 M3 Error/Primary와 시각적으로 분리하는 방안 필요 (예: tonal 채도 차별화, 또는 RARE를 magenta-pink 계열로 미세 시프트).

### 6.3 Typography (한글 우선)

| M3 Role | 한글 (Pretendard) | 영문 (Roboto Flex) | 용도 |
|---------|------------------|-------------------|------|
| Display L 57 | Pretendard ExtraBold | Display | 영웅 헤더 (옵션) |
| Headline M 28 | Pretendard SemiBold | Headline | 페이지 타이틀 |
| Title M 16 | Pretendard SemiBold | Title | 섹션 헤더 |
| Body M 14 | Pretendard Regular | Body | 본문 텍스트 |
| Label L 14 | Pretendard Medium | Label | 버튼·칩 |
| Label S 11 | Pretendard Medium | Label | KPI 라벨·캡션 |

### 6.4 Shape Scale

- Card: `medium` (12) 또는 `large` (16) — FM 카드 톤
- Modal sheet: `extra-large` top (28) only
- Chip / Badge: `small` (8) 또는 `extra-small` (4)
- Button: `full` (pill) — M3 trend

### 6.5 Elevation (Dark Theme)

| Level | 사용처 |
|-------|--------|
| 0 | 페이지 배경 |
| 1 | 일반 카드 (라인업 카드 휴면 상태) |
| 2 | hover / focused 카드 |
| 3 | 모달 sheet, 매치업 패널 (3-col) |
| 4 | 헤더 sticky |
| 5 | 토스트, 임시 알림 |

### 6.6 Motion

- **Standard easing** `cubic-bezier(0.2, 0, 0, 1)` — 카드 hover, 입력 포커스
- **Emphasized easing** `cubic-bezier(0.2, 0, 0, 1)` — 모달 enter/exit
- Duration: short2 (100ms · 칩 토글), medium2 (300ms · 카드 hover), long2 (500ms · 모달 open)

---

## 7. 컴포넌트별 리디자인 명세

### 7.1 PlayerCard (라인업 카드 9~10장) ⭐ 핵심

**현재 상태**: 선수 사진 풀블리드 배경 + 등급 배지 좌상단 + 등번호 우상단 + 이름 하단 + 포지션 칩.

**Material 3 요청**:
- 카드 컨테이너: M3 **Filled Card** (surface-container) elevation 1 → hover 2
- 사진 크기: 카드 영역의 60~70% (현재 95% opacity·풀블리드보다 약간 절제)
- 사진 마스크: 상단 둥근 corner 16px (medium-large), 사진 아래로 그라데이션
- 등급 배지: M3 **Filled Tonal Chip** (etiquette · 등급별 tonal color)
- 등번호: 우상단 outline chip 또는 overline
- 이름: Title S 14 SemiBold, 사진 아래 정렬
- 포지션 + 등급%: Label S 11, 두 칩 가로 정렬
- Pressed/Hover: elevation 변화 + ripple (M3 specs)

### 7.2 TeamMatchupPanel (매치업 헤더)

**현재**: 3-col 그라데이션 카드 — 시즌 KPI / VS 매치 / 최근 폼.

**Material 3 요청**:
- 외부 컨테이너: **Elevated Card** elevation 3, shape large 16
- 상단 1.5px 컬러 스트립 → 팀 컬러 (KIA 빨강) 유지
- 좌측 KPI 6셀: M3 **Statistic** 또는 small filled cards (surface-container-low), 라벨은 Label S
- 중앙 VS: 양팀 로고 둥근 마스크 + 큰 VS 문자 Display M
- 우측 폼 5개: M3 Filled Chip cluster (W=secondary, L=error, D=outline)
- 모바일: 3-col → 세로 stack (1-col), 매치업 카드는 항상 상단

### 7.3 StandingsBanner (10팀 가로 스크롤)

**현재**: 10팀 칩 + 마이팀 강조 border.

**Material 3 요청**:
- 각 팀 셀: **Filter Chip** style, selected=마이팀
- 마이팀 칩: Primary tonal + ring 강조
- 순위 숫자: 칩 안에 Label S 정렬
- 좌우 스크롤 indicator (M3 default)

### 7.4 GradeBadge

**현재**: 작은 outlined badge (ELITE/RARE/SPECIAL/NORMAL).

**Material 3 요청**:
- M3 **Filled Tonal Chip** (size sm)
- 색상: §6.2 매핑 사용
- 아이콘 선택적 추가 (ELITE에 star, RARE에 ◆ 등) — 색맹 보조

### 7.5 ScheduleList (경기 일정)

**현재**: 일정 list (날짜·시간·홈팀@어웨이 · 상태배지 · 구장).

**Material 3 요청**:
- 각 경기: **List Item** (3-line variant) — 좌측 팀 로고 양쪽 / 본문 매치업 / 우측 상태
- 마이팀 경기: surface-container-high 강조 + 좌측 border 2px primary
- 탭(오늘/주/월): **Segmented Button** group

### 7.6 PlayerModal (선수 상세)

**현재**: bottom-sheet on mobile, center dialog on desktop.

**Material 3 요청**:
- 모바일: **Bottom Sheet** (modal, drag handle, top corner 28 extra-large)
- 데스크톱: **Dialog** (center, elevation 3)
- 헤더: 선수 사진 (Aspect 4:3) + 이름 + 등급 칩
- 탭: **Tabs** (M3 primary tabs, scrollable on overflow)
- 콘텐츠: Surface-container 카드들로 정보 그룹화
- 닫기: Top-right outlined icon button

### 7.7 Storybook UI (`/storybook`)

**현재**: 검색 박스 + 4섹션 결과 + 이미지 갤러리 + 마크다운 미리보기 + 액션 3버튼.

**Material 3 요청**:
- **검색**: M3 **Search Bar** (full-width on mobile, dock to header on desktop)
- **결과 4섹션**: 각각 Elevated Card, section title은 **Overline** + Headline S
- **이미지 갤러리**: 슬롯 3개 + 풀 26장 → **Image Grid** + selected ring 표시
- **마크다운 미리보기**: Code block style, surface-container-lowest 배경
- **액션 버튼**: 
  - 주요(복사): **Filled Button** primary
  - 보조(다운로드/재생성): **Tonal Button**

---

## 8. 모바일 우선 (필수)

- **Breakpoints**: < 640 mobile / 640-1024 tablet / > 1024 desktop
- **터치 타깃**: 모든 인터랙티브 ≥ 44×44
- **헤더**: 모바일은 검색 아이콘만, 데스크톱은 검색 바
- **라인업 그리드**: 모바일 3열 / 태블릿 5열 / 데스크톱 5~10열
- **매치업 패널**: 모바일 1열 stack / 데스크톱 3열
- **모달**: 모바일 bottom sheet / 데스크톱 center dialog
- **이미지 갤러리**: 모바일 4열 / 데스크톱 3열 (3열에서 더 큰 썸네일)

---

## 9. 접근성

- **WCAG 2.1 AA** 모든 텍스트 ↔ 배경 대비비 4.5:1+
- **색상 단독 정보 전달 금지** — 등급은 항상 텍스트 배지 동반
- **포커스 링**: M3 정의 outline (2px primary on focus-visible)
- **모션 환경설정**: `prefers-reduced-motion` 존중 (애니메이션 ↓)
- **스크린리더**: aria-label 한국어 정확
- **터치 타깃** 44×44 보장 (M3 권장)

---

## 10. 톤앤매너 (3개 키워드)

1. **Information Dense** — FM 25 같은 정보 밀집. 빈 공간보다 데이터 우선.
2. **Premium Subtle** — M3의 절제된 elevation·motion으로 고급감. 화려한 그라데이션·그림자 남용 X.
3. **Korean Baseball Heritage** — KIA 빨강·야구 그라운드 그린·빈티지 카드 골드 같은 한국 야구 색채.

**참고 비주얼**:
- Football Manager 25 portal/match screens (사용자가 첨부)
- M3 docs https://m3.material.io/
- 야구 카드 게임 빈티지 톤 (마구마구는 IP상 금지, 영감만)

---

## 11. 산출물 (제작자가 가져올 형식 — 선택)

- (a) **Figma 파일** — 페이지별 프레임 + 컴포넌트 라이브러리 + 토큰 JSON
- (b) **HTML 정적 시안** — 페이지별 단일 HTML, Tailwind 임시 사용 OK
- (c) **PNG/JPG 시안** — 모바일 + 데스크톱 각각 핵심 4화면 (대시보드/모달/스토리북/스토리북-결과)
- (d) **M3 토큰 JSON** — `theme.dark.colorScheme.{primary, onPrimary, primaryContainer, ...}` 형식

**최소 필요**: (c) 모바일 4화면 + (d) 토큰 JSON. 그러면 코드 측에서 Tailwind config 매핑 + 컴포넌트 재구성 가능.

---

## 12. 코드 측 후속 작업 (제작자 산출물 받은 후)

1. M3 토큰 → Tailwind theme.extend.colors / borderRadius / boxShadow 매핑
2. 컴포넌트 8종 재구현 (PlayerCard / MatchupPanel / StandingsBanner / GradeBadge / ScheduleList / PlayerModal / Storybook page / DraftActions)
3. M3 motion 적용 (existing `transition-transform`을 token 기반 duration·easing으로)
4. 다크 모드 surface tonal 시스템 (1~5단계) 도입
5. dynamic theming 옵션 (마이팀 변경 시 primary 시드 재계산)

---

## 13. 비포·애프터 화면 우선순위

만약 시안 4장만 만들 수 있다면:

| Priority | 화면 | 화면 크기 |
|----------|------|----------|
| ⭐⭐⭐ | 메인 대시보드 (KIA, 라인업 보임) | 375×844 모바일 |
| ⭐⭐⭐ | 선수 모달 (김도영 클릭) | 375×844 모바일 |
| ⭐⭐ | 스토리북 결과 (김도영 검색 후 4섹션 + 갤러리) | 375×1500 모바일 long |
| ⭐⭐ | 메인 대시보드 데스크톱 (라인업 5열 + 매치업 3-col) | 1440×900 데스크톱 |

---

## 14. 절대 빠지면 안 되는 디테일 5개

1. **마이팀 KIA**가 시각적으로 가장 강조될 것 (마이팀 우선 원칙)
2. **라인업 9~10장 카드**의 등급 색상이 한눈에 분포 파악되어야 함 (FM 5경기 폼 같이)
3. **선수 사진**이 카드의 메인 — 사진 없을 때(아데를린 같은 fallback) 우아하게 처리
4. **오늘 경기 / 매치업 정보**가 라인업 위에 상시 노출 (페이지 진입 시 첫 화면에)
5. **모바일에서 30초 안에 마이팀 상황 판독** 가능한 정보 우선순위

---

**End of Brief**
