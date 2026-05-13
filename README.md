# KBO 야구 카드 대시보드 (baseball-fan-dashboard)

> KBO 팬이 경기 전 30초 안에 마이팀 라인업 컨디션을 카드 색상으로 판독하고, 한 화면에서 일정·순위·선수 기록까지 드릴다운하는 정보 밀집형 단일 페이지 대시보드.

[![Status](https://img.shields.io/badge/status-Phase_1_MVP-orange)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## ✨ 무엇을 하나요

- 마이팀 1-탭 선택 → localStorage 저장 → 30초 온보딩
- 단일 페이지에 **순위 / 일정 / 라인업 카드** 3요소를 동시에
- 라인업 9~10장 카드의 보더 색상 = 최근 10경기 성적 백분위 등급
  - **엘리트 (보라)** · **레어 (빨강)** · **스페셜 (노랑)** · **노멀 (파랑)**
- 카드 클릭 → 선수 시즌 / 역대 / 최근 10경기 트렌드 모달
- 모바일 우선 · 인증 없음 · 광고 없음

## 🧭 누구를 위해

- KBO 직장인 캐주얼 팬 (Persona B)
- 점심·통근·쉬는 시간 모바일로 짧게 확인하는 사용자
- 네이버 스포츠는 정보 과다, 스탯티즈는 모바일 UX 부재 — 그 사이 공백을 메움

## 🏗️ 아키텍처 (한 줄 요약)

`Next.js 14 App Router` (SSR + Edge Cache)
+ `JSON 파일 캐시` (Phase 2에서 Supabase 마이그레이션)
+ `GitHub Actions cron` 크롤러 (KBO + 스탯티즈)
+ `Pragmatic 3-Layer` (UI → Service → Data)

## 🚀 빠른 시작

```bash
pnpm install
cp .env.example .env.local
pnpm dev
# http://localhost:3000
```

## 🧪 테스트

```bash
pnpm test          # 단위 테스트 (Vitest)
pnpm test:coverage # 커버리지 (lib/grade.ts 100% 강제)
pnpm test:e2e      # E2E (Playwright)
pnpm ci            # 전체 CI 시뮬레이션
```

## 📂 문서

| 단계 | 문서 |
|------|------|
| PM | [PRD](./docs/00-pm/baseball-fan-dashboard.prd.md) · [Discovery](./docs/00-pm/baseball-fan-dashboard.discovery.md) · [Strategy](./docs/00-pm/baseball-fan-dashboard.strategy.md) · [Research](./docs/00-pm/baseball-fan-dashboard.research.md) |
| Plan | [Plan](./docs/01-plan/features/baseball-fan-dashboard.plan.md) |
| Design | [Design](./docs/02-design/features/baseball-fan-dashboard.design.md) |

## 🛡️ 면책

<!-- forbidden-words-allow:disclaimer -->
이 서비스는 KBO 공식 서비스가 **아닙니다**. 카드 형태 UI는 일반적인 다크 테마 게임카드 패턴을 독자 구현한 것이며, 네오위즈·넷마블의 야구 카드 게임과 무관한 독립 비상업적 팬 프로젝트입니다.

## 📜 라이선스

MIT
