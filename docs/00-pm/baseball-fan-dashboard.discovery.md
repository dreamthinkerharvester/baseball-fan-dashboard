# Discovery Report: Baseball Fan Dashboard (마구마구 편의성앱)

**작성일**: 2026-05-09
**Product Stage**: New (Greenfield)
**프레임워크**: 5-Step Discovery Chain (Teresa Torres, Alberto Savoia)

---

## Product Stage: New

유저 베이스 없음. 데이터 없음. 가설 단계.
KBO 공식 API 미공개 → 크롤링 의존. 마구마구 IP는 UI 영감으로만 참조 (에셋 직접 사용 불가).

---

## Step 1: Brainstormed Opportunities (야구팬 Job-to-Be-Done)

> "How Might We..." 프레임으로 KBO 팬이 평일/경기일에 겪는 고통과 미충족 욕구를 탐색.

| # | Opportunity (Pain / Unmet Desire) | JTBD 요약 | 팬 유형 |
|---|----------------------------------|-----------|---------|
| O1 | 오늘 우리 팀 경기 있어? 몇 시야? | 일정 확인을 위해 여러 앱·사이트를 전전함 | 캐주얼 팬 |
| O2 | 오늘 선발 누구야? 라인업 빨리 보고 싶다 | 경기 직전 라인업을 한 눈에 파악 못 함 | 코어 팬 |
| O3 | 이 선수 요즘 잘 하고 있어? 컨디션이 궁금해 | 최근 성적 트렌드를 직관적으로 보고 싶음 | 코어 팬 |
| O4 | 순위 지금 어떻게 돼? 게임차 얼마야? | 리그 순위를 바로 못 찾아서 답답함 | 모든 팬 |
| O5 | 선수 통산 기록이 어떻게 돼? 역대와 비교하고 싶다 | 기록의 역사적 맥락을 한 화면에서 못 봄 | 통계 팬 |
| O6 | 오늘 전 구장 스코어 한 번에 보고 싶다 | 멀티 게임 상황을 실시간으로 추적 못 함 | 멀티팀 팬 |
| O7 | 마이팀 정보만 깔끔하게 보고 싶다 | 불필요한 정보가 많아 원하는 것만 집중 불가 | 마이팀 팬 |
| O8 | 선수 카드 느낌으로 선수를 보면 더 재밌을 텐데 | 데이터 대시보드가 너무 삭막함, 재미 없음 | 게임 경험 팬 |
| O9 | 피치 by 피치 상황을 텍스트로 따라가고 싶다 | 라이브 중계 앱 없이 경기 상황 파악 어려움 | 출근 중 팬 |
| O10 | 예전 선수 기록이랑 지금 선수 비교하고 싶다 | 레전드 vs 현역 비교 기능이 어디에도 없음 | 올드팬 |
| O11 | 부상자 명단, DL 현황 빠르게 확인하고 싶다 | 부상 정보가 분산되어 있어 찾기 힘듦 | 판타지 팬 |
| O12 | 직관 전 오늘 선수 최근 상태 카드로 훑고 싶다 | 직관 준비용 단일 뷰가 없음 | 직관 팬 |

---

## Step 2: Key Assumptions (리스크 식별)

### Product Risk

| # | Assumption | Category | 무엇이 틀릴 수 있나 | Confidence |
|---|-----------|----------|-------------------|:----------:|
| A1 | KBO 공식 사이트 / STATIZ 크롤링으로 안정적 데이터 수집 가능 | Feasibility | robots.txt 차단, 구조 변경, rate-limit으로 크롤러 붕괴 | 낮음 |
| A2 | 팬들이 "마구마구 카드" 비주얼을 즉각 인식하고 긍정적으로 반응 | Value | 2030 이하 팬은 마구마구 레퍼런스를 모를 수 있음 | 중간 |
| A3 | 단일 페이지에 정보 집약이 UX 개선으로 느껴짐 (information density) | Usability | 오히려 과부하로 이탈, 특히 모바일 환경 | 중간 |
| A4 | 라인업 데이터가 경기 당일 사전 공개됨 (크롤링 타이밍 가능) | Feasibility | 선발 라인업 발표 시점이 불규칙, 확정 전 빈 데이터 | 낮음 |
| A5 | 마구마구 UI 영감 사용이 IP 분쟁 없이 가능 | Viability | 네오위즈/넷마블 측에서 저작권 이의 제기 가능성 | 낮음 |
| A6 | 선수 성적 4단계 등급화(엘리트/레어/스페셜/노멀) 기준이 직관적 | Value | 어떤 지표로 등급을 나누느냐에 따라 팬 반발 가능 | 중간 |
| A7 | 유저가 "마이팀" 설정 후 지속적으로 재방문 | Viability | 온보딩 마찰로 이탈, 재방문 루프 미형성 | 중간 |

### GTM Risk

| # | Assumption | Category | 무엇이 틀릴 수 있나 | Confidence |
|---|-----------|----------|-------------------|:----------:|
| A8 | KBO 팬 커뮤니티(MLB파크, 에펨코리아, 팬카페)를 통해 초기 유입 가능 | Channel | 커뮤니티 홍보 차단·스팸 처리 가능성 | 중간 |
| A9 | 무료 서비스로 운영 시 지속 가능한 비용 구조 | Pricing | 서버 크롤링 비용, 클라우드 비용이 예상보다 클 수 있음 | 중간 |
| A10 | 시즌 중(3~10월) 집중 사용, 비시즌은 DAU 급락 | Market | 비시즌 retention 전략 부재 → 재활성화 비용 | 높음 |

---

## Step 3: Prioritized Assumptions (Impact × Risk)

> Impact(1-5): 이 가정이 틀리면 제품이 얼마나 망가지나
> Risk(1-5): 이 가정이 실제로 틀릴 가능성

| # | Assumption | Impact | Risk | Score | Action |
|---|-----------|:------:|:----:|:-----:|--------|
| A1 | KBO 크롤링 안정성 | 5 | 4 | **20** | Test Now |
| A4 | 라인업 데이터 사전 수집 가능 | 4 | 4 | **16** | Test Soon |
| A3 | Information density = 좋은 UX | 4 | 4 | **16** | Test Soon |
| A6 | 4단계 등급 기준이 직관적 | 4 | 3 | **12** | Monitor |
| A2 | 마구마구 비주얼 레퍼런스 인식 | 3 | 3 | **9** | Accept |
| A7 | 마이팀 설정 후 재방문 루프 | 4 | 3 | **12** | Monitor |
| A5 | IP 분쟁 리스크 | 5 | 2 | **10** | Monitor |
| A8 | 커뮤니티 채널 유효성 | 3 | 3 | **9** | Accept |
| A10 | 비시즌 DAU 급락 | 2 | 5 | **10** | Monitor |

---

## Step 4: Recommended Experiments

### Exp-1: 크롤링 안정성 검증 (A1 — Score 20, Test Now)

**Method**: Pretotype — Mechanical Turk + Concierge

| 항목 | 내용 |
|------|------|
| Hypothesis | KBO 공식 사이트 + STATIZ 크롤링으로 10팀 일정·순위·라인업을 매일 자동 수집 가능하다 |
| Method | 1주일간 크롤러 스크립트 작성 후 실제 실행. 실패율, rate-limit 횟수, 구조 변경 횟수 측정 |
| Success Criteria | 7일 연속 95% 이상 데이터 수집 성공률 달성 |
| Effort | 엔지니어 2~3일 |
| Timeline | MVP 착수 전 1주일 |
| Fallback | KBO 비공식 JSON 엔드포인트 역공학 (모바일 앱 트래픽 분석) |

---

### Exp-2: 라인업 데이터 타이밍 검증 (A4 — Score 16, Test Soon)

**Method**: Concierge (수동 모니터링)

| 항목 | 내용 |
|------|------|
| Hypothesis | 경기 당일 오전 10시~오후 2시 사이에 KBO 공식 라인업이 공개된다 |
| Method | 2주간 매 경기일 라인업 공개 시점 수동 기록. KBO 사이트, 각 팀 SNS 대조 |
| Success Criteria | 경기 80% 이상에서 시작 2시간 전까지 라인업 데이터 확보 가능 |
| Effort | 비개발 작업, 2주 |
| Timeline | 크롤러 구축 병행 |
| Fallback | "라인업 미확정" 플레이스홀더 UI 제공 |

---

### Exp-3: Information Density UX 검증 (A3 — Score 16, Test Soon)

**Method**: Fake Door + Hallway Test (로컬 프로토타입)

| 항목 | 내용 |
|------|------|
| Hypothesis | 야구팬은 한 화면에 일정·순위·라인업·선수카드를 모두 보는 것을 선호한다 |
| Method | Figma 또는 HTML 목업 2종 제작: (A) 정보 집약형 단일 페이지, (B) 탭 분리형. 지인 야구팬 5~8명 대상 5분 hallway test |
| Success Criteria | 참가자 70% 이상이 (A)를 "더 편하다"고 평가, 이탈 없이 원하는 정보 3개 이상 찾음 |
| Effort | 디자인 2일 + 테스트 반나절 |
| Timeline | 크롤러 실험과 병행, MVP 전 |

---

## Step 5: Opportunity Solution Tree

```
Outcome: DAU 기준 마이팀 팬의 일일 KBO 정보 확인 시간 단축
         (현재: 여러 사이트 탐색 5~10분 → 목표: 대시보드 1분 이내 해결)

├── O4: 리그 순위를 즉시 확인하고 싶다 [Importance: 높음 / Satisfaction: 중간]
│   ├── Solution A: 상단 고정 순위 배너 (10팀 축약 표)
│   │   └── Experiment: 크롤링 실험 (Exp-1) + 순위 위젯 목업 hallway test
│   ├── Solution B: 마이팀 순위 포커스 뷰 (게임차 강조)
│   └── Solution C: 순위 변동 애니메이션 (이번 주 등락 시각화)
│
├── O1: 오늘 경기 일정을 한눈에 파악하고 싶다 [Importance: 높음 / Satisfaction: 낮음]
│   ├── Solution A: 전체 10팀 오늘 일정 타임라인 뷰
│   │   └── Experiment: 크롤링 실험 (Exp-1) — KBO 일정 페이지 수집 성공률
│   ├── Solution B: 마이팀 "다음 경기 카운트다운" 위젯
│   └── Solution C: 홈/원정 구분 컬러 코딩 캘린더
│
├── O2: 오늘 선발 라인업을 빠르게 보고 싶다 [Importance: 높음 / Satisfaction: 낮음]
│   ├── Solution A: 마구마구 카드 스타일 라인업 카드 9장 (타순 순서)
│   │   └── Experiment: 라인업 타이밍 실험 (Exp-2) + 카드 UI 목업 (Exp-3)
│   ├── Solution B: 선수 최근 성적 기반 등급 색상 (엘리트/레어/스페셜/노멀)
│   └── Solution C: 상대 팀 선발 투수 카드 나란히 비교
│
├── O3: 이 선수 요즘 컨디션이 어때? [Importance: 중간 / Satisfaction: 낮음]
│   ├── Solution A: 최근 7경기 타율/OPS 미니 스파크라인
│   │   └── Experiment: 카드 클릭 → 모달 상세 (Exp-3 목업에 포함)
│   ├── Solution B: 카드 등급 변동 알림 (레어→엘리트 승급 시)
│   └── Solution C: 선수 역대 기록 vs 시즌 기록 오버레이
│
└── O7: 마이팀 정보만 집중해서 보고 싶다 [Importance: 높음 / Satisfaction: 낮음]
    ├── Solution A: 마이팀 선택 시 전체 뷰 → 마이팀 집중 뷰 전환
    │   └── Experiment: Fake door — "마이팀 설정" 버튼 클릭율 측정 (analytics)
    ├── Solution B: localStorage 기반 팀 설정 (로그인 불필요)
    └── Solution C: 마이팀 섹션 항상 최상단 고정
```

### Prioritized Opportunities

| # | Opportunity | Importance | Satisfaction | Opportunity Score* |
|---|------------|:----------:|:------------:|:------------------:|
| 1 | O1: 오늘 일정 확인 | 5 | 2 | **0.60** |
| 2 | O2: 라인업 조회 | 5 | 2 | **0.60** |
| 3 | O4: 리그 순위 확인 | 5 | 3 | **0.50** |
| 4 | O7: 마이팀 집중 뷰 | 4 | 2 | **0.48** |
| 5 | O3: 선수 컨디션 확인 | 4 | 2 | **0.48** |

> *Opportunity Score = Importance × (1 - Satisfaction/5), normalized 0-1

### Top Solutions (우선 구현 대상)

| Opportunity | Solution | Perspective | Key Assumption |
|------------|----------|-------------|----------------|
| O1: 일정 확인 | 전체 10팀 오늘 일정 타임라인 | PM: 최소 마찰 정보 접근 | 크롤링 안정성 (A1) |
| O2: 라인업 조회 | 마구마구 카드 스타일 9장 타순 표시 | Designer: 노스탤지어 + 정보 통합 | 라인업 타이밍 (A4) |
| O4: 순위 확인 | 상단 고정 순위 배너 | Engineer: 가장 단순한 구현 | 크롤링 안정성 (A1) |
| O7: 마이팀 뷰 | localStorage 팀 설정 + 집중 뷰 전환 | PM: 로그인 없이 개인화 | 재방문 루프 (A7) |
| O3: 선수 컨디션 | 카드 클릭 → 상세 모달 (시즌+역대) | Designer: 카드 인터랙션 | 등급 기준 직관성 (A6) |

---

## MVP Scope 권고

### Phase 0 — 실험 선행 (1~2주)
- [ ] KBO 크롤러 POC (일정, 순위, 라인업 3종)
- [ ] 라인업 공개 타이밍 수동 모니터링
- [ ] 정보 집약형 vs 탭 분리형 목업 hallway test 5명

### Phase 1 — MVP (2~4주)
우선순위 5개 기능 (제품 오너 명시):
1. 리그 순위 배너 (10팀, 상단 고정)
2. 오늘 전 구장 일정 타임라인
3. 마이팀 선택 (localStorage, 로그인 불필요)
4. 마이팀 오늘 라인업 — 마구마구 카드 스타일 9장 (타순 순서)
5. 카드 등급 색상 (엘리트/레어/스페셜/노멀, 최근 10경기 OPS 기준)

### Phase 2 — 검증 후 추가
- 카드 클릭 → 선수 시즌 + 역대 기록 모달
- 전 구장 실시간 스코어
- 최근 7경기 스파크라인

### Out of Scope (현재)
- 로그인 / 회원가입
- 알림 푸시
- 마구마구 실제 에셋 직접 사용 (IP 리스크)
- 경기 중계 / 영상

---

## IP 리스크 노트

마구마구 UI 참조 전략:
- **허용**: 카드 레이아웃 개념(직사각형 카드, 등급 컬러 시스템) — 일반적 UI 패턴
- **불허**: 마구마구 로고, 폰트, 실제 카드 이미지, 캐릭터(마구돌이) 직접 사용
- **권고**: 독자 디자인 언어로 "마구마구에서 영감받은" 카드 UI 구현. 네오위즈/넷마블 상표 언급 금지.

---

## Attribution

- Opportunity Solution Tree: Teresa Torres, *Continuous Discovery Habits*
- Pretotype methods: Alberto Savoia, *The Right It*
- JTBD interview: Intercom JTBD framework
- KBO 팬 행동 데이터: [2025 KBO 리그 팬 성향 조사](https://koreabaseball.com/MediaNews/Notice/View.aspx?bdSe=11811)
- 마구마구 카드 등급 참조: [나무위키 — 마구마구/게임 요소](https://namu.wiki/w/%EB%A7%88%EA%B5%AC%EB%A7%88%EA%B5%AC/%EA%B2%8C%EC%9E%84%20%EC%9A%94%EC%86%8C)
