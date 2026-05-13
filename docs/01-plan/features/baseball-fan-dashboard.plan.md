# baseball-fan-dashboard Planning Document

> **Summary**: KBO 팬이 30초 안에 마이팀 라인업·일정·순위를 카드 UX로 판독하는 단일 페이지 정보 대시보드 (MVP Phase 1).
>
> **Project**: 마구마구 편의성앱 (KBO 야구 카드 대시보드)
> **Version**: 0.1.0 (Phase 1 MVP)
> **Author**: PM/Plan Agent
> **Date**: 2026-05-09
> **Status**: Draft (PRD 기반 자동 생성)
> **Upstream**: [PRD](../../00-pm/baseball-fan-dashboard.prd.md) · [Discovery](../../00-pm/baseball-fan-dashboard.discovery.md) · [Strategy](../../00-pm/baseball-fan-dashboard.strategy.md) · [Research](../../00-pm/baseball-fan-dashboard.research.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | KBO 팬이 마이팀 일정·라인업·선수 컨디션을 확인하기 위해 네이버 스포츠·KBO 공식앱·스탯티즈를 3~4탭 오가며 5~10분을 소비한다. 단일 화면에서 즉시 파악할 수 있는 도구가 없다. |
| **Solution** | "야구 카드" 스타일 라인업 시각화 + 마이팀 우선 단일 페이지 대시보드. 마이팀 9장 카드의 등급 색상으로 컨디션을 비언어적으로 전달하고, 카드 클릭으로 시즌·역대 기록까지 드릴다운한다. |
| **Function/UX Effect** | 등급 색상(보라=엘리트/빨강=레어/노랑=스페셜/파랑=노멀) 기반 즉각 판독 + 단일 페이지에 순위·일정·라인업 3요소 동시 노출 + 30초 원클릭 마이팀 온보딩(localStorage). |
| **Core Value** | "경기 전 30초 판독" — 네이버의 편의성과 스탯티즈의 데이터 깊이를 카드 UX로 결합한 KBO 팬 전용 대시보드. |

---

## Context Anchor

> Auto-generated from Executive Summary + PRD §1·§5·§8. Propagated to Design/Do/Analysis/Report for cross-session context continuity.

| Key | Value |
|-----|-------|
| **WHY** | KBO 팬이 마이팀 정보 탐색에 3~4탭·5~10분을 쓰는 마찰을 30초 단일 화면 판독으로 제거 |
| **WHO** | Persona B (이수연 유형) — 25~40세 직장인 캐주얼 KBO 팬. 점심·통근·쉬는 시간 모바일로 짧게 확인. 마이팀 우선 정보 + 카드 등급 직관성 선호. |
| **RISK** | R1 크롤링 차단 (Score 20) > R5 비시즌 DAU 급락 (15) > R2 라인업 공개 타이밍 불안정 (16) > R4 개인 번아웃 (12) > R3 IP 클레임 (10) |
| **SUCCESS** | (1) 크롤러 7일 연속 95%+ 안정 (2) 모바일 Lighthouse 80점 (3) FCP < 2s (4) hallway test 70%+ "재방문 의향" (5) DAU 500 (배포 후 2주) |
| **SCOPE** | Phase 0 (1~2주): 크롤러 POC + hallway test → Phase 1 MVP (3~4주, 본 문서): F1 일정 + F2 마이팀 + F3 라인업 카드 + F4 선수 모달 + F5 단일 페이지 + F6 순위 배너 → Phase 2+: 공유 카드 이미지, WAR 지표, 즐겨찾기 등 |

---

## 1. Overview

### 1.1 Purpose

KBO(한국 프로야구) 팬, 특히 직장인 캐주얼 팬이 점심시간이나 통근 중 짧은 시간에 마이팀의 오늘 경기·라인업·컨디션을 한 화면에서 판독할 수 있게 하는 정보 밀집형 단일 페이지 웹 대시보드를 구축한다.

### 1.2 Background

**시장 진단** (Research/PRD 근거):
- KBO는 2024년 역대 최단 경기 200만 관중 돌파 (TAM 80~100억 원/년 광고 시장)
- 주요 경쟁자: 네이버 스포츠 (편의성↑·세이버 지표 부재), 스탯티즈 (데이터 깊이↑·모바일/UX 부재), KBO 공식앱 (UI 노후), 다음 스포츠
- 공통 격차: 마이팀이 "첫 화면"인 서비스가 없다 + 세이버 데이터 × 모바일 카드 UX 결합 서비스 없음

**기회의 시그니처**: "마구마구"(2006년 네오위즈 출시, 카드 등급 색상 UX) IP를 *오마주*하는 야구 카드 UX는 한국 야구팬에게 즉시 인식되는 시각 언어. 단, 브랜드 자산은 사용 불가 (R3 IP 리스크 — PRD §7 참조).

**JTBD 정수**: "When 점심 5분 / 경기 1시간 전, I want to 마이팀 라인업 컨디션을 즉각 판독, So I can 관전 결정과 기대감을 30초로 결정"

### 1.3 Related Documents

- **PRD**: [docs/00-pm/baseball-fan-dashboard.prd.md](../../00-pm/baseball-fan-dashboard.prd.md)
- **Discovery (OST)**: [docs/00-pm/baseball-fan-dashboard.discovery.md](../../00-pm/baseball-fan-dashboard.discovery.md)
- **Strategy (JTBD/Lean Canvas)**: [docs/00-pm/baseball-fan-dashboard.strategy.md](../../00-pm/baseball-fan-dashboard.strategy.md)
- **Research (Personas/Competitors)**: [docs/00-pm/baseball-fan-dashboard.research.md](../../00-pm/baseball-fan-dashboard.research.md)
- 외부 참조:
  - KBO 공식 통계: https://www.koreabaseball.com
  - 스탯티즈: http://www.statiz.co.kr
  - WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/

---

## 2. Scope

### 2.1 In Scope (Phase 1 MVP)

- [ ] **F1 — 팀 일정 뷰**: 10팀 오늘/이번 주/이번 달 경기 일정 타임라인. 마이팀 하이라이트.
- [ ] **F2 — 마이팀 선택 + localStorage**: 1-클릭 온보딩, 새로고침 후 유지, 변경/초기화 기능.
- [ ] **F3 — 마이팀 라인업 카드 9~10장**: 타순별 카드, 등급 색상(엘리트=보라/레어=빨강/스페셜=노랑/노멀=파랑), 글로우 이펙트.
- [ ] **F4 — 선수 상세 모달**: 카드 클릭 → 시즌 성적(타자: AVG/OPS/wRC+/HR/RBI · 투수: ERA/FIP/WHIP/K9/BB9) + 역대 기록 탭.
- [ ] **F5 — 단일 페이지 정보 밀집 레이아웃**: 헤더 → 순위 배너 → 일정 → 라인업 카드. 모바일 우선.
- [ ] **F6 — 리그 순위 배너**: 10팀 승·패·게임차, 마이팀 하이라이트.
- [ ] **데이터 파이프라인**: KBO + 스탯티즈 크롤러, GitHub Actions 스케줄, 캐시 레이어 (Supabase 또는 JSON 파일).
- [ ] **등급 산출 알고리즘**: 최근 10경기 wRC+(타자)/FIP(투수) 백분위 → 4단계 등급 매핑 (PRD §9).
- [ ] **NFR**: FCP < 2s, WCAG AA, 모바일 우선 반응형, 라인업 미확정 플레이스홀더.
- [ ] **배포**: Vercel 프로덕션 + 도메인 연결 + Discord 장애 알림.
- [ ] **법적 고지**: 사이트 하단 면책 문구 ("KBO 공식 서비스 아님, 마구마구·넷마블 무관").

### 2.2 Out of Scope (Phase 2 이후)

- 로그인/회원가입 (소셜 로그인 포함) — Phase 2에서 즐겨찾기와 함께 도입
- 카드 이미지 SNS 공유 기능 (OG 이미지 자동 생성) — Phase 2
- 알림 기능 (브라우저 푸시·이메일·카카오) — Phase 2
- 경기 중 실시간 스코어 (10분 이상 지연 허용) — Phase 2
- WAR·투구궤적 등 고급 세이버 지표 — Phase 2
- 비시즌 콘텐츠 (FA 이적·드래프트 예측) — Phase 3
- 커뮤니티 기능 (댓글·게시판) — 의도적 제외 (운영 부담)
- 게임 중계 영상·하이라이트 (저작권 이슈) — 의도적 제외
- iOS/Android 네이티브 앱 — 의도적 제외 (PWA로 충분)
- "마구마구"·"Magumagu"·네오위즈/넷마블 상표명 사용 — IP 리스크로 영구 제외

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 첫 방문 시 10팀 선택 화면 표시 (2초 이내), 1클릭으로 마이팀 설정 + localStorage 저장 | High | Pending |
| FR-02 | 마이팀 설정 후 재방문 시 localStorage 복원 → 마이팀 대시보드 즉시 표시 | High | Pending |
| FR-03 | 마이팀 변경/초기화 UI 제공 (헤더 설정 아이콘) | Medium | Pending |
| FR-04 | 10팀 오늘 경기 일정 타임라인 표시 (홈팀·원정팀·시작 시간·구장·상태) | High | Pending |
| FR-05 | 일정 뷰 탭 전환 (오늘/이번 주/이번 달) | Medium | Pending |
| FR-06 | 더블헤더·우천 취소·경기 없음 상태 명시적 표시 | High | Pending |
| FR-07 | 리그 순위 배너 (10팀 승·패·승률·게임차, 마이팀 하이라이트) 상단 고정 | High | Pending |
| FR-08 | 순위 배너 접힘/펼침 토글 | Low | Pending |
| FR-09 | 마이팀 오늘 라인업 9~10장 카드 그리드 표시 (타순 순서) | High | Pending |
| FR-10 | 카드별 등급 색상·배지(ELITE/RARE/SPECIAL/NORMAL) 표시 + 엘리트/레어/스페셜에 글로우 이펙트 | High | Pending |
| FR-11 | 카드별 선수명·포지션·대표 스탯 1개(타자: OPS, 투수: ERA) 표시 | High | Pending |
| FR-12 | 라인업 미확정 시 플레이스홀더 9장 + "라인업 미확정 안내" + 새로고침 버튼 | High | Pending |
| FR-13 | 카드 클릭 → 선수 상세 모달 슬라이드업 (300ms 애니메이션) | High | Pending |
| FR-14 | 선수 상세 모달 시즌 성적 탭 (타자/투수 분기) + 최근 10경기 트렌드 미니 차트 | High | Pending |
| FR-15 | 선수 상세 모달 역대 기록 탭 (최근 5시즌 기본, 전체 토글) | Medium | Pending |
| FR-16 | 모달 닫기 (X 버튼·배경 클릭·Escape·스와이프 다운) → 대시보드 스크롤 위치 유지 | High | Pending |
| FR-17 | 등급 자동 산출: 최근 10경기 wRC+(타자) 또는 FIP(투수) 백분위 → 90+/70+/40+/그 외 → 4단계 매핑 | High | Pending |
| FR-18 | 데이터 부족(10경기 미만, 신인) 예외 처리 + "n경기 기준" 레이블 | Medium | Pending |
| FR-19 | 크롤러 (KBO + 스탯티즈) 다중 소스, 한 소스 실패 시 다른 소스 폴백 | High | Pending |
| FR-20 | 크롤링 실패 시 마지막 캐시 데이터 서빙 + "데이터 갱신 지연" 배너 + Discord 알림 | High | Pending |
| FR-21 | localStorage 비활성화 환경(시크릿 모드) 안내 배너 | Medium | Pending |
| FR-22 | 사이트 하단 법적 면책 고지 ("KBO/마구마구/넷마블 무관") | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **Performance** | FCP < 2.0s (4G 시뮬레이션) | Lighthouse Mobile (Vercel Analytics) |
| **Performance** | LCP < 3.5s | Lighthouse |
| **Performance** | CLS < 0.1 | Lighthouse |
| **Performance** | TTI < 4.0s | Lighthouse |
| **Performance** | 캐시 히트율 > 90% | Vercel Edge Cache 로그 |
| **Accessibility** | WCAG 2.1 AA 준수 (색상 대비 ≥ 4.5:1, 포커스 표시, ARIA) | axe DevTools / Lighthouse Accessibility |
| **Accessibility** | 등급은 색상만이 아닌 텍스트 배지로도 전달 | 수동 검증 |
| **Accessibility** | 모달 포커스 트랩 + Escape 닫기 + ARIA dialog | Playwright a11y 테스트 |
| **Accessibility** | 최소 터치 타깃 44px × 44px | 실기기 테스트 |
| **Browser Support** | iOS Safari / Android Chrome 최근 2버전, Desktop Chrome/Edge/Firefox 최근 2버전 | BrowserStack 또는 실기기 |
| **Responsive** | 375px (iPhone SE) → 768px → 1280px 자동 전환 | DevTools 디바이스 에뮬레이터 |
| **Data Freshness** | 라인업: 경기 시작 2시간 전부터 30분마다, 확정 후 1시간 | 크론 로그 |
| **Data Freshness** | 일정: 매일 7시 1회, 변경 감지 시 즉시 | 크론 로그 |
| **Data Freshness** | 순위: 경기 종료 후 30분 내 | 크론 로그 |
| **Reliability** | 크롤러 7일 연속 성공률 ≥ 95% | GitHub Actions 로그 + Discord 알림 메트릭 |
| **Security** | XSS 방지 (모든 동적 텍스트 escape), CSP 헤더 설정 | Lighthouse Security |
| **Legal/IP** | "마구마구"·"Magumagu"·네오위즈·넷마블 문자열 0건 | grep CI 검사 |
| **SEO** | OG 메타 태그, Sitemap, Robots.txt | Lighthouse SEO ≥ 90 |

---

## 4. Success Criteria

### 4.1 Definition of Done (Phase 1 MVP)

- [ ] FR-01 ~ FR-22 모두 구현 완료 (Priority High 22개 우선)
- [ ] 크롤러 7일 연속 95%+ 안정 동작 (Phase 0 POC 통과 전제)
- [ ] 모바일 Lighthouse 성능 점수 ≥ 80, 접근성 ≥ 90, SEO ≥ 90
- [ ] hallway test (5~8명) 70%+ "재방문 의향 있음" 응답
- [ ] L1 (API/크롤러) + L2 (UI 액션) + L3 (E2E) 자동화 테스트 통과 (PDCA QA 단계)
- [ ] gap-detector Match Rate ≥ 90% (PDCA Check 단계)
- [ ] Vercel 프로덕션 배포 완료 + 도메인 연결 + HTTPS
- [ ] 법적 면책 고지 + Privacy 페이지 게시
- [ ] README.md (프로젝트 소개·기여 가이드·라이선스) 작성
- [ ] Discord 장애 알림 웹훅 동작 확인
- [ ] grep CI: 금지 단어("마구마구"·"Magumagu"·"네오위즈"·"넷마블") 0건

### 4.2 Quality Criteria

- [ ] TypeScript strict mode (`"strict": true`) + 0 type errors
- [ ] ESLint + Prettier 0 경고 (CI 차단)
- [ ] 단위 테스트: 등급 산출 알고리즘(`computeGrade`) 100% 커버리지
- [ ] 통합 테스트: 크롤러 모듈 (KBO·statiz adapter) 모킹 기반 테스트
- [ ] E2E: TS-01~TS-05 (PRD §11) Playwright 시나리오 통과
- [ ] Build: `pnpm build` 성공 + Vercel preview 정상 배포
- [ ] Bundle 사이즈: First Load JS < 200KB (gzipped)

### 4.3 Business Success Criteria (배포 후 2주 내)

- [ ] DAU 500 달성 (커뮤니티 seeding 후)
- [ ] 마이팀 설정 전환율 ≥ 40%
- [ ] 세션당 카드 클릭 ≥ 1.0회
- [ ] 커뮤니티 자연 언급 ≥ 5건/주 (야갤·팀카페·트위터)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1 — KBO/스탯티즈 크롤링 차단** (Score 20) | High | High | (1) Phase 0에서 크롤러 안정성 POC 7일 연속 95%+ 검증 후 Phase 1 착수 (2) 다중 소스(KBO+statiz) 병렬 + 실패 시 폴백 (3) User-Agent 위장 + 요청 간 3~5초 딜레이 + robots.txt 준수 (4) 차단 감지 시 KBO 모바일 앱 트래픽 역공학으로 비공식 JSON 엔드포인트 활용 |
| **R2 — 라인업 공개 타이밍 불안정** (Score 16) | High | High | (1) 라인업 미확정 플레이스홀더 UI를 *기본값*으로 설계 (FR-12) (2) 사용자 새로고침 버튼 제공 (3) 30분 간격 자동 폴링 (4) 2주간 타이밍 모니터링 데이터 수집 후 알고리즘 튜닝 |
| **R3 — IP 클레임 (마구마구 카드 UI 유사성)** (Score 10) | High | Low | (1) 브랜드명·로고·에셋 0% 사용 (CI grep 검사) (2) 카드 디자인 독자 SVG/CSS (3) 비상업적 명시 + 후원만 허용 (4) 사이트 하단 면책 고지 (5) 네오위즈·넷마블 C&D 수신 시 24시간 내 응답 프로세스 사전 정의 |
| **R4 — 개인 번아웃 / 유지보수 중단** (Score 12) | High | Medium | (1) GitHub Actions 자동화로 수동 개입 최소화 (2) 크리티컬 버그 기준 명확화 ("크롤러 24시간 이상 실패", "프로덕션 500 에러") (3) 주 1회 배포 사이클 (4) 시즌 중 신기능 동결, 유지보수 모드 전환 옵션 (5) 오픈소스 공개로 기여자 유입 가능성 |
| **R5 — 비시즌 DAU 급락** (Score 15) | Medium | High | (1) Phase 1 범위 외 (Phase 3 콘텐츠 계획) — Phase 1 단계에서는 시즌 트래픽으로 검증 집중 (2) 비시즌 진입 전(10월) 이메일/카카오톡 옵트인 수집 UI 추가 검토 |
| **R6 — 카드 등급 알고리즘에 팬 반발** (Pre-mortem F2) | Medium | Medium | (1) 등급 산출 기준을 FAQ 페이지에 100% 공개 (wRC+ 백분위 공식 명시) (2) Discord 피드백 채널 운영 (3) 시즌 초 5경기 미만 = 등급 비활성화로 노이즈 회피 (4) 야갤 모니터링 |
| **R7 — 모바일 UX 검증 누락** (Pre-mortem F3) | High | Medium | (1) MVP 전 iPhone SE/갤럭시 중급기 실기기 테스트 의무화 (2) 터치 타깃 44px 검증 자동화 (Playwright) (3) hallway test는 모바일 디바이스로만 진행 |
| **R8 — Vercel/Supabase 무료 티어 한계 도달** | Medium | Low | (1) Vercel: 무료 100GB 대역폭 → 모니터링 알람 80% 시점 (2) Supabase: 500MB DB → 7일 단위 데이터 아카이빙 + JSON 파일 캐시 우선 사용 (3) 비용 트리거 시 본인 결제 또는 후원 활성화 |

---

## 6. Impact Analysis

> **Note**: 본 프로젝트는 **그린필드(greenfield)** 신규 프로젝트로, 기존 컨슈머가 없다. 따라서 아래는 **외부 데이터 소스에 대한 영향 분석**으로 재해석한다.

### 6.1 Changed Resources (외부 의존성)

| Resource | Type | Change Description |
|----------|------|--------------------|
| KBO 공식 사이트 (koreabaseball.com) | External Data Source | 크롤링 클라이언트 추가 — 일정·순위·라인업 페이지 GET 요청 |
| 스탯티즈 (statiz.co.kr) | External Data Source | 크롤링 클라이언트 추가 — 선수 시즌 성적·세이버 지표 페이지 GET 요청 |
| 선수 사진 (KBO 공식 또는 자체 SVG) | Asset | 선수별 사진 또는 포지션 SVG 생성 |
| Vercel 프로덕션 | Hosting | 프로젝트 신규 생성 |
| Supabase 또는 JSON 파일 | Storage | 캐시 데이터 저장소 신규 생성 |
| Discord Webhook | Notification | 장애 알림 채널 신규 생성 |
| GitHub Actions | CI/Cron | cron 스케줄 신규 등록 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| (그린필드, 기존 컨슈머 없음) | — | — | None |

### 6.3 Verification

- [ ] KBO 공식 사이트 robots.txt 확인 (스크래핑 허용 경로 식별)
- [ ] 스탯티즈 ToS 검토 (개인 비상업 사용 가능 여부 확인)
- [ ] 요청 속도 제한 준수 (소스당 동시 1 connection, 3~5초 간격)
- [ ] User-Agent 명시 (`baseball-fan-dashboard/0.1 (+contact)`)
- [ ] 데이터 캐싱으로 원본 부하 최소화 (Vercel Edge Cache 10분 TTL)
- [ ] 차단 감지 시 자동 백오프 + Discord 알림

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend/data, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems, complex architectures | ☐ |

**Selected**: **Dynamic**

**Rationale**:
- 백엔드 데이터(크롤링 + 캐시 + DB)가 핵심이므로 Starter는 부적합.
- 단일 페이지·소규모 트래픽 예상(MVP DAU 500~3,000)으로 Enterprise는 과한 추상화.
- Feature-based 모듈 구조 (`features/dashboard`, `features/lineup-card`, `features/player-modal`)가 점진적 확장에 적합.
- bkend.ai BaaS 대신 **Supabase 또는 JSON 캐시**를 사용 (KBO 데이터는 자체 크롤링이라 BaaS의 인증/CRUD 가치가 낮음).

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 14+ / Remix / SvelteKit | **Next.js 14+ (App Router)** | SSR로 SEO 기반, API Routes로 캐시 서빙, Vercel 최적화, 한국 개발 생태계 풍부 |
| Language | TypeScript / JavaScript | **TypeScript (strict)** | 데이터 모델 안전성, 등급 산출 알고리즘 정확성, 협업 가능성 |
| State Management | Context / Zustand / Redux / Jotai | **React useState + SWR + localStorage** | MVP 범위에서 글로벌 상태 최소. SWR로 데이터 페칭/캐시. 마이팀만 localStorage. |
| Data Fetching | fetch / axios / SWR / TanStack Query | **SWR (Vercel 추천)** | Stale-while-revalidate 패턴이 대시보드에 최적. 자동 재검증·캐시. |
| Styling | Tailwind / CSS Modules / styled-components | **Tailwind CSS + CSS variables** | 빠른 반응형, 카드 글로우 효과 커스텀 가능, JIT로 번들 사이즈 최소 |
| UI Components | shadcn/ui / MUI / 자체 구현 | **shadcn/ui (모달·탭) + 자체 카드** | 모달·탭은 검증된 패턴 활용, 카드는 핵심 UX라 자체 구현 |
| Form Handling | react-hook-form / native | **native (MVP에 폼 없음)** | 마이팀 선택은 버튼 클릭, 폼 라이브러리 불필요 |
| Storage | Supabase / Firebase / JSON files | **JSON 파일 캐시 (1차) → Supabase (2차)** | MVP는 JSON 파일로 충분 (크기 작음). 트래픽 증가 시 Supabase 마이그레이션 |
| Crawler | Cheerio / Playwright / Puppeteer | **Cheerio (정적) + Playwright (필요 시)** | KBO·statiz는 대부분 정적 HTML. JS 렌더링 필요 페이지만 Playwright. |
| Scheduler | GitHub Actions / Vercel Cron / 외부 cron | **GitHub Actions (cron)** | 무료, 코드와 함께 버전관리, Discord 웹훅 연동 쉬움 |
| Hosting | Vercel / Netlify / Cloudflare Pages | **Vercel** | Next.js 최적화, Edge Cache, 무료 티어 충분, 한국 CDN 양호 |
| Testing | Jest / Vitest / Playwright | **Vitest (단위) + Playwright (E2E)** | Vitest = Vite 기반 빠름. Playwright = 모바일 에뮬 + Visual 테스트 |
| Analytics | Umami (셀프) / GA4 / Plausible | **Vercel Analytics (1차) → Umami (2차)** | Vercel Analytics 무료, 프라이버시 친화. 트래픽 늘면 Umami 셀프호스팅 |
| Notification | Discord Webhook / Slack / Email | **Discord Webhook** | 무료, 즉시 알림, 모바일 푸시 자동 |
| Error Tracking | Sentry / LogRocket / 자체 | **Sentry (Free Tier)** | 무료 5k 이벤트/월로 MVP 충분 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic

Recommended Folder Structure:
┌─────────────────────────────────────────────────────────────┐
│ src/                                                        │
│ ├── app/                          # Next.js App Router      │
│ │   ├── page.tsx                  # 단일 페이지 대시보드     │
│ │   ├── layout.tsx                # 헤더 · 푸터 · 메타       │
│ │   ├── api/                      # API Routes              │
│ │   │   ├── games/route.ts        # 일정 데이터 서빙        │
│ │   │   ├── standings/route.ts    # 순위 데이터 서빙        │
│ │   │   ├── lineup/[team]/route.ts # 라인업 데이터          │
│ │   │   └── player/[id]/route.ts  # 선수 상세 데이터        │
│ │   └── globals.css               # Tailwind base + 변수    │
│ ├── features/                                               │
│ │   ├── team-selection/           # F2: 마이팀 선택 UI      │
│ │   ├── league-standings/         # F6: 순위 배너            │
│ │   ├── game-schedule/            # F1: 일정 타임라인       │
│ │   ├── lineup-card/              # F3: 라인업 카드 그리드  │
│ │   │   ├── PlayerCard.tsx                                  │
│ │   │   ├── LineupGrid.tsx                                  │
│ │   │   └── LineupPlaceholder.tsx                           │
│ │   └── player-modal/             # F4: 선수 상세 모달      │
│ ├── components/                                             │
│ │   ├── ui/                       # shadcn/ui 기반          │
│ │   └── layout/                   # 헤더, 푸터              │
│ ├── lib/                                                    │
│ │   ├── grade.ts                  # 등급 산출 알고리즘      │
│ │   ├── storage.ts                # localStorage 헬퍼       │
│ │   ├── api-client.ts             # SWR fetcher             │
│ │   └── constants.ts              # 팀 코드 · 색상 등       │
│ ├── types/                                                  │
│ │   ├── team.ts                                             │
│ │   ├── player.ts                                           │
│ │   ├── game.ts                                             │
│ │   └── stat.ts                                             │
│ └── data/                          # JSON 캐시 (1차 storage) │
│     ├── games-2026-05-09.json                               │
│     ├── standings.json                                      │
│     ├── lineups/{team}-{date}.json                          │
│     └── players/{id}.json                                   │
│                                                             │
│ scripts/                                                    │
│ ├── crawler/                                                │
│ │   ├── kbo.ts                    # KBO 사이트 크롤러       │
│ │   ├── statiz.ts                 # 스탯티즈 크롤러         │
│ │   └── index.ts                  # 메인 진입점             │
│ ├── compute-grades.ts             # 등급 일괄 산출          │
│ └── notify-discord.ts             # 장애 알림                │
│                                                             │
│ .github/workflows/                                          │
│ ├── crawl-schedule.yml            # 매일 7시: 일정 크롤링   │
│ ├── crawl-lineup.yml              # 30분 간격: 라인업       │
│ ├── crawl-standings.yml           # 경기 종료 후: 순위      │
│ ├── compute-grades.yml            # 매일 6시: 등급 산출     │
│ └── ci.yml                        # Lint · Test · Build     │
│                                                             │
│ tests/                                                      │
│ ├── unit/                         # Vitest                  │
│ │   ├── grade.test.ts                                       │
│ │   └── crawler/*.test.ts                                   │
│ └── e2e/                          # Playwright              │
│     ├── onboarding.spec.ts        # TS-01                   │
│     ├── lineup-card.spec.ts       # TS-02                   │
│     └── empty-lineup.spec.ts      # TS-03                   │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Data Flow

```
[GitHub Actions Cron]
    ↓ (스케줄 트리거)
[scripts/crawler/index.ts]
    ↓ (KBO + statiz 병렬 크롤)
[/data/*.json 또는 Supabase]
    ↓ (Vercel 빌드 시 정적 또는 SWR 페칭)
[Next.js API Routes /api/*]
    ↓ (Vercel Edge Cache 10분 TTL)
[클라이언트 SWR]
    ↓ (자동 재검증)
[React 컴포넌트 렌더링]
    ↓ (사용자 인터랙션)
[localStorage (마이팀)]
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

본 프로젝트는 그린필드이므로 모두 신규 정의 필요:

- [ ] `CLAUDE.md` 코딩 컨벤션 섹션 (신규 작성 예정)
- [ ] `docs/01-plan/conventions.md` (Phase 2 출력 — `/phase-2-convention` 스킬 활용)
- [ ] `CONVENTIONS.md` 프로젝트 루트 (선택)
- [ ] ESLint 설정 (`.eslintrc.json` — Next.js + TypeScript + a11y 플러그인)
- [ ] Prettier 설정 (`.prettierrc` — 2 spaces, single quotes, semi: true)
- [ ] TypeScript 설정 (`tsconfig.json` — strict mode)
- [ ] EditorConfig (`.editorconfig`)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 컴포넌트=PascalCase, 함수/변수=camelCase, 상수=SCREAMING_SNAKE, 파일=kebab-case (단 컴포넌트 파일은 PascalCase) | High |
| **Folder structure** | missing | `app/` (라우팅), `features/` (도메인 모듈), `lib/` (순수 헬퍼), `types/` (타입), `data/` (JSON 캐시), `scripts/` (크롤러/CI) | High |
| **Import order** | missing | (1) react/next (2) 외부 라이브러리 (3) `@/lib`, `@/types` (4) `@/components`, `@/features` (5) 상대경로 (6) 스타일/CSS — eslint-plugin-import enforcement | Medium |
| **Environment variables** | missing | `NEXT_PUBLIC_*` (클라이언트), 나머지 서버 전용 — `.env.example` 필수 | High |
| **Error handling** | missing | API Route는 항상 `{ data, error }` 셰입 반환. 클라이언트는 SWR의 `error` 분기. 크롤러는 try/catch + Discord 알림. | High |
| **Date/Timezone** | missing | 모두 KST(`Asia/Seoul`) 고정. 표시는 `date-fns-tz` + `format(date, 'yyyy-MM-dd', { timeZone: 'Asia/Seoul' })` | High |
| **Forbidden words (IP)** | missing | CI에서 `grep -E "마구마구\|Magumagu\|네오위즈\|넷마블"` 검출 시 빌드 실패 | High |
| **Color tokens** | missing | CSS variables: `--grade-elite-border`, `--grade-rare-border`, `--grade-special-border`, `--grade-normal-border` 등 정의 | High |
| **Logging** | missing | 크롤러: `console.log` 구조화 JSON (`{ source, action, ms, result }`). 클라이언트: Sentry. | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL (메타 태그·OG) | Client | ☑ |
| `DISCORD_WEBHOOK_URL` | 크롤링/장애 알림 | Server (Actions) | ☑ |
| `KBO_USER_AGENT` | 크롤러 User-Agent 식별자 | Server (Actions) | ☑ |
| `SENTRY_DSN` | 에러 추적 | Both | ☑ (선택, Phase 1 후반) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Server | ☐ (Phase 2에서 도입 시) |
| `SUPABASE_ANON_KEY` | Supabase 익명 키 | Server | ☐ (Phase 2에서 도입 시) |
| `VERCEL_ANALYTICS_ID` | Vercel Analytics | Both | ☑ (Vercel 자동 주입) |

### 8.4 Pipeline Integration

9-Phase Development Pipeline에서 본 Plan 단계가 위치하는 곳:

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 0 (PM Discovery/Strategy/Research/PRD) | ✅ 완료 | `docs/00-pm/` | `/pdca pm` |
| Phase 1 (Schema — 데이터 모델) | ☐ Plan 후 권고 | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention — 코딩 규칙) | ☐ Plan 후 권고 | `docs/01-plan/conventions.md` | `/phase-2-convention` |
| Phase 3 (Mockup — UI 프로토타입) | ☐ Design 단계와 병행 | `docs/02-design/mockups/` | `/phase-3-mockup` |
| Phase 4 (API 설계) | ☐ Design 단계 일부 | Design 문서 §4 | `/phase-4-api` |
| Phase 5 (Design System) | ☐ Design 단계 일부 | Design 문서 §5 | `/phase-5-design-system` |
| Phase 6 (UI 통합) | ☐ Do 단계 | 구현 코드 | `/phase-6-ui-integration` |
| Phase 7 (SEO·Security) | ☐ Do 단계 후반 | 구현 코드 | `/phase-7-seo-security` |
| Phase 8 (Review) | ☐ Check 단계 | `docs/03-analysis/` | `/phase-8-review` |
| Phase 9 (Deployment) | ☐ Report 후 | Vercel 배포 | `/phase-9-deployment` |

**권고 흐름**:
1. Plan 검토 완료 → Phase 1 Schema 정의 (`Team`, `Player`, `Game`, `SeasonStat`, `Lineup`)
2. Phase 2 Convention 정의 (위 §8.2 룰을 코드로 고정)
3. `/pdca design baseball-fan-dashboard` → Design 문서 (3-Architecture-Options 비교)
4. Phase 3 Mockup 병행 (Pencil MCP 사용 가능 시 `/design-anchor capture`)
5. `/pdca do baseball-fan-dashboard --scope module-1` → 모듈 단위 점진적 구현

---

## 9. Next Steps

1. [ ] **본 Plan 검토 및 승인** — 사용자 확인 (Checkpoint)
2. [ ] (선택) Phase 1 Schema 작성 — `/phase-1-schema` 또는 Design 문서 §3 통합
3. [ ] (선택) Phase 2 Convention 작성 — `/phase-2-convention`
4. [ ] **Phase 0 크롤러 POC 1~2주 실행** (R1 게이트) — Plan 외 별도 트랙
5. [ ] Design 문서 작성 — `/pdca design baseball-fan-dashboard`
   - 3가지 아키텍처 옵션 비교 (Minimal / Clean / Pragmatic)
   - 모듈 맵 + 세션 가이드 자동 생성
   - (UI 포함) Design Anchor 캡처 권고
6. [ ] Design 승인 후 → `/pdca do baseball-fan-dashboard --scope <module>`
7. [ ] 구현 후 → `/pdca analyze baseball-fan-dashboard` (Match Rate ≥ 90% 목표)
8. [ ] QA → `/pdca qa baseball-fan-dashboard` (L1~L3 자동 테스트)
9. [ ] 완료 보고 → `/pdca report baseball-fan-dashboard`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-09 | Initial draft (PRD 기반 자동 생성, PRD §1~§11 매핑) | PM/Plan Agent |
