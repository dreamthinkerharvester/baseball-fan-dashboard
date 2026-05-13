---
name: baseball-fan-dashboard PRD 완성 현황
description: PRD v1.0 작성 완료. 비치헤드, MVP 범위, 리스크 우선순위 확정.
type: project
---

PRD v1.0이 `docs/00-pm/baseball-fan-dashboard.prd.md`에 작성 완료됨 (2026-05-09).

**Why:** discovery/strategy/research 3개 분석 문서를 종합해 11개 섹션 PRD 생성. 한국어 출력.

**How to apply:** 다음 작업(/pdca plan 등) 시 이 PRD를 기준 문서로 참조할 것. 버전 변경 시 이 메모리 업데이트.

핵심 결정 사항:
- 비치헤드: Persona B (34세 직장인 캐주얼 팬, 이수연 유형) — 점수 18/20
- MVP 범위: F1(일정) + F2(마이팀 선택) + F3(라인업 카드 9장) + F4(선수 상세 모달) + F5(단일 페이지 밀집)
- North Star: 마이팀 설정 유저의 경기일 재방문율 (목표 60%)
- 최대 리스크: R1 크롤러 차단 (Impact 5 × Prob 4 = Score 20)
- IP 전략: "마구마구" 브랜드명 UI/코드/마케팅 완전 배제. 카드 등급 색상은 독자 CSS로 구현.
- 기술 스택: Next.js App Router + Tailwind + Supabase + GitHub Actions + Vercel
- 카드 등급 기준: 타자 wRC+ 백분위, 투수 FIP 백분위 (최근 10경기 이동 평균)
- Phase 0 필수: 크롤러 POC 7일 연속 95% 성공률 달성 후 Phase 1 착수
