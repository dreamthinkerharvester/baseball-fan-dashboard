---
name: kia-fan-service PRD 완성 현황
description: baseball-fan-dashboard 피벗 PRD v1.0 작성 완료. KIA 단일팀 세이버 전용. 비치헤드=P1(세이버 호기심 팬). 최대 리스크=캐주얼 이탈+Statiz 차단.
metadata:
  type: project
---

kia-fan-service PRD v1.0이 `docs/00-pm/kia-fan-service.prd.md`에 작성 완료됨 (2026-06-11).

**Why:** baseball-fan-dashboard를 KIA 단일팀 세이버 전용 서비스로 피벗. 피벗 델타 섹션(0) 포함 12개 섹션 PRD 생성.

**How to apply:** 다음 작업(/pdca plan 등) 시 이 PRD를 기준 문서로 참조. [[baseball-fan-dashboard PRD 완성 현황]] 원본과 비교해 변경 내용 파악.

핵심 결정 사항:
- 피벗 기준: baseball-fan-dashboard.prd.md v1.0 (2026-05-09) → kia-fan-service (2026-06-11)
- 비치헤드: P1 김도현 유형 (27~35세 세이버 호기심 팬) — 점수 19/20
- MVP 범위: F1(KIA 즉시 진입·팀선택 제거) + F2(세이버 온리 카드+토글+인라인 툴팁) + F3(Myth-Buster 패널) + F5(KIA 경기·순위·결과 시각화)
- North Star: D30 기준 주 3회+ 재방문율 >30%
- 최대 리스크 3종: R1 Statiz 세이버 수집 실패(Score 20) / R2 캐주얼 팬 클래식 숨김 거부(Score 15) / R3 세이버 용어 진입장벽(Score 16)
- 피벗 REMOVED: team-selection, MyTeamSettings, 다중팀 로직, 클래식 디폴트 표시, 범용 브랜딩
- 피벗 CHANGED: 세이버 디폴트, KIA 레드/블랙 브랜딩(#C8102E), 카드 대표 스탯 wRC+/FIP
- 피벗 ADDED: 세이버 온리 토글, Myth-Buster 패널, 관전 포인트 카드, 공유 카드, kia-player-storybook 탭 통합
- 피벗 REUSED: lineup-card, player-modal, league-standings, game-schedule, recent-games, GHA 크롤러, JSON 캐시, assets-magu(IP 검토 조건부), kia-player-storybook
- 기술 갭: WAR·wOBA·Barrel% 미수집 (Phase 2 목표). MVP에서 "집계 중" 뱃지로 처리.
- Phase 0 Exit Gate 3개 필수: 크롤러 95%+ / 클래식 숨김 거부율 <40% / 토글 UX 직관성 70%+
- assets-magu 선수 사진: 내부 무드보드/프로토타입 한정. 공개 배포 전 IP 검토 필수.
