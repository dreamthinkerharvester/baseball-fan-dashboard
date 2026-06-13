---
name: baseball-fan-dashboard project context
description: KBO 야구팬 대시보드 앱 (마구마구 편의성앱) 초기 discovery 핵심 결정사항
type: project
---

마구마구 편의성앱은 KBO 팬을 위한 정보 집약형 단일 페이지 웹 대시보드다.
마구마구 카드 게임 UI를 영감으로 삼아 선수 라인업을 카드 형태로 표시하되, 마구마구 실제 에셋(로고, 이미지, 캐릭터) 직접 사용은 IP 리스크로 배제.

**Why:** KBO 공식 API 미공개라 크롤링 의존. 가장 큰 기술 리스크는 크롤링 안정성(Score 20).

**How to apply:** 구현 제안 시 항상 크롤링 fallback 전략(KBO 앱 트래픽 역공학 등)을 함께 제시. IP 관련 에셋 사용 요청 시 독자 디자인으로 재안내.

## MVP Scope (Phase 1, 검증 후 착수)
1. 리그 순위 배너 (10팀, 상단 고정)
2. 오늘 전 구장 일정 타임라인
3. 마이팀 선택 (localStorage, 로그인 불필요)
4. 마이팀 오늘 라인업 — 마구마구 카드 스타일 9장 타순 순서
5. 카드 등급 색상 — 엘리트(보라)/레어(빨강)/스페셜(노랑)/노멀(파랑), 최근 10경기 OPS 기준

## Phase 0 선행 실험 (착수 전 필수)
- KBO 크롤러 POC: 일정, 순위, 라인업 3종 (1주)
- 라인업 공개 타이밍 수동 모니터링 (2주)
- 정보 집약형 vs 탭 분리형 hallway test (5명)

## Top Opportunity Priority
O1(일정) = O2(라인업) > O4(순위) > O7(마이팀 뷰) > O3(선수 컨디션)

## Discovery 산출물 위치
`docs/00-pm/baseball-fan-dashboard.discovery.md`

## 피벗: kia-fan-service (2026-06-11 결정)

baseball-fan-dashboard를 KIA 타이거즈 단일팀 팬 서비스로 피벗. 핵심 차별점은 세이버메트릭스 온리 모드(클래식 스탯 숨기기). 기존 크롤러/데이터 파이프라인(data/players.json, standings.json, games/, lineups/)과 UI 컴포넌트(lineup-card, league-standings, game-schedule, player-modal, recent-games) 최대 재활용. 공용 에셋(public/assets-magu: KIA 선수 9명 SD사진, 팀 로고 10종) 활용.

**Why:** KIA 팬베이스가 KBO 1위(2025 인기구단 1위, 관여도 최고). 가장 큰 신규 리스크는 "캐주얼 팬이 클래식 스탯 숨김에 거부감을 가질 수 있다" (Impact 5 × Risk 4 = Score 20, 최우선 검증).

**How to apply:** 세이버메트릭스 온리 모드 관련 제안 시 반드시 토글/교육 레이어 함께 제시. 완전 숨김보다 점진적 공개 UX를 우선 검토.
