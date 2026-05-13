# Phase 0 POC 결과 — 크롤러 selector 검증

> **상태**: 부분 통과 (1/3 소스 정밀 selector 확보, 2/3 후속 작업 명시)
>
> **수행일**: 2026-05-09
> **목적**: Plan R1 (Score 20) 완화 — 실 KBO/스탯티즈 HTML 보고 selector 정밀 조정

---

## TL;DR

| 소스 | 상태 | 결론 |
|------|:----:|------|
| KBO 순위 (TeamRank) | ✅ **확정** | `table.tData[summary*="순위"]` + 12 컬럼 위치 인덱싱. 11개 테스트로 검증. |
| KBO 스케줄 (Schedule) | ⚠️ **JSON 전환 필요** | 초기 HTML은 thead만, tbody는 AJAX 로드. JSON 엔드포인트 발견 (`/ws/Schedule.asmx/GetScheduleList`)이나 401 인증 필요. |
| 스탯티즈 (statiz) | ⚠️ **URL 패턴 변경** | 기존 placeholder URL `/stat.php` 404. 루트는 OK, `/player/?p_no={ID}` 패턴 사용. |

---

## 1. KBO 순위 (TeamRank) — ✅ 확정

### URL
```
https://www.koreabaseball.com/Record/TeamRank/TeamRank.aspx
```

### 실제 HTML 구조 (캡처: `tests/fixtures/html/kbo-standings.html`, 54.5KB)

```html
<table summary="순위, 팀명,승,패,무,승률,승차,최근10경기,연속,홈,방문" class="tData">
  <thead>
    <tr>
      <th>순위</th><th>팀명</th><th>경기</th><th>승</th><th>패</th><th>무</th>
      <th>승률</th><th>게임차</th><th>최근10경기</th><th>연속</th><th>홈</th><th>방문</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td><td>KT</td><td>35</td><td>23</td><td>11</td><td>1</td>
      <td>0.676</td><td>0</td><td>6승1무3패</td><td>1승</td><td>11-0-6</td><td>12-1-5</td>
    </tr>
    <!-- 9 more rows -->
  </tbody>
</table>
```

### 주의사항 (트랩)

페이지에 `class="tData"` 테이블이 **2개** 존재:
1. 순위표 (12 컬럼) ← 우리가 원하는 것
2. 팀간승패표 (11 컬럼) — selector 충돌!

**해결**: `summary` 속성으로 좁힘 → `table.tData[summary*="순위"] tbody tr`.

### 적용된 selector

```typescript
KBO_SELECTORS.standings = {
  rows: 'table.tData[summary*="순위"] tbody tr',
  columnIndex: {
    rank: 0, teamName: 1, games: 2,
    wins: 3, losses: 4, draws: 5,
    winPct: 6, gamesBehind: 7, recent10: 8,
    streak: 9, home: 10, away: 11,
  },
};
```

### 검증

`tests/unit/crawler-kbo.test.ts` (11 케이스) — 실 HTML 픽스처로 검증:
- 10팀 반환
- 순위 1~10 순차
- 모든 teamCode가 유효 (10팀 화이트리스트)
- winPct ↔ wins/losses 일치 (오차 ±0.01)
- rank 1팀 shape 정합

---

## 2. KBO 스케줄 (Schedule) — ✅ **옵션 A 구현 완료**

> **2026-05-09 추가 진행**: Playwright option (A) 구현 + 실 테스트 통과 + GitHub Actions 통합. 운영 즉시 사용 가능.

### 결과

```
$ KBO_SCHEDULE_BROWSER=1 pnpm crawl:schedule:browser
{"source":"kbo","action":"schedule","method":"playwright","result":"ok",
 "totalGames":135,"datesWritten":27,"ms":3899}
```

5월 한 달 분 **135 경기를 27개 날짜 파일에 자동 분배**. 실행 시간 4초 (Vercel cron 60초 한도 내).

### 구현된 모듈

| 파일 | 역할 |
|------|------|
| `scripts/crawler/kbo-playwright.ts` | Playwright 헤드리스 chromium으로 schedule 페이지 hydrate. dynamic import로 production deps 미오염. |
| `scripts/crawler/kbo.ts` `parsePlayCell()` `parseScheduleDayCell()` | 실 hydrated HTML 구조에 맞는 위치/구조 기반 파서. `<td.play>` 안의 `<span>AWAY</span><em><span class="lose">1</span>vs<span class="win">5</span></em><span>HOME</span>` 패턴 정확 추출. |
| `scripts/crawler/index.ts` `runSchedule()` | 게임을 실제 date별로 분배 → 다중 cache 파일 작성. KBO_SCHEDULE_BROWSER 환경변수로 opt-in. |
| `.github/workflows/crawl-schedule.yml` | `playwright install --with-deps chromium` 추가 + KBO_SCHEDULE_BROWSER=1 적용 |

### 적용 비용

- 런타임 메모리: ~150MB (chromium headless)
- 한 요청 시간: ~4초 (페이지 로드 2s + hydration wait 2s)
- GH Actions 추가 시간: chromium install ~30초 (cache로 한 번만)

**결론**: KBO 스케줄 크롤링 차단 우회 완료. R1.2 → ✅.

### (예전 분석은 historical reference로 보존)

### AJAX 엔드포인트 발견

```
POST https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList
Content-Type: application/json

Body:
{
  "leId": 1,
  "srIdList": "0,9,6",
  "seasonId": 2025,
  "gameMonth": "10",
  "teamId": ""
}
```

### 차단

직접 호출 시 **HTTP 401 Unauthorized**. Referer + X-Requested-With 헤더 + 세션 쿠키 동봉해도 동일.

가능한 원인:
- ASMX `[ScriptMethod]` + ViewState 검증
- ASP.NET ViewStateUserKey CSRF 보호
- 추가 anti-bot 헤더 (정확히 무엇인지 미파악)

### 후속 작업 옵션 (운영 전 필수 결정)

| 옵션 | 장점 | 단점 |
|------|------|------|
| **A. Playwright 헤드리스** | hydration 후 SSR 그대로, 401 우회 | 무겁고 느림 (한 요청 ~3-5초), Vercel cron 시간 초과 위험 |
| **B. 세션/CSRF 토큰 시뮬레이션** | 가벼움, 안정 시 빠름 | 매 시즌 사이트 패치마다 재분석 필요 |
| **C. KBO 공식 모바일 앱 트래픽 역공학** | 비공식 JSON 엔드포인트가 깔끔할 수 있음 | 모바일 앱 SSL pinning 시 어려움 |
| **D. 비공식 미러** | 즉시 사용 가능 | 신뢰성·법적 리스크 |

**권장 우선순위**: A → B → C → D

### 현재 코드 상태

`scripts/crawler/kbo.ts`:
- `parseSchedule()` 위치 기반으로 구현됨 (운영 환경에서 hydrated HTML 또는 fixture로 동작)
- `parseGameCell()` "AWAY vs HOME" 와 "AWAY 5 - 3 HOME" 양쪽 패턴 처리
- KBO 초기 HTML 입력 시 0개 반환 (정상 — 전용 테스트로 확인)

---

## 3. 스탯티즈 (statiz) — ⚠️ URL 패턴 변경

### 발견 사항

| URL | 결과 |
|-----|------|
| `https://www.statiz.co.kr/` | ✅ 200 (87KB) |
| `http://www.statiz.co.kr/stat.php?mid=stat&pos=batters` | ❌ 404 |
| `https://statiz.sporki.com/` | ❌ DNS resolution failed |

### 현재 정상 패턴

루트 페이지에서 발견된 선수 페이지 패턴:
```
/player/?m=playerinfo&p_no={NUMERIC_ID}
```

예: 김도영 = `/player/?m=playerinfo&p_no=14137`

### 후속 작업

스탯티즈 selector 정밀 조정은 운영 시점에 다음 단계로 진행:
1. 정상 시즌 통계 리스트 URL 발견 (현 statiz.co.kr 메뉴 탐색)
2. 선수 상세 페이지 (`/player/?p_no={ID}`) HTML 캡처
3. wRC+ / FIP 셀 위치 매핑
4. `STATIZ_SELECTORS` + `parseBatterTable` / `parsePitcherTable` 업데이트
5. 단위 테스트 추가 (실 HTML fixture)

`scripts/crawler/statiz.ts`의 placeholder selector는 그대로 유지 — 실 HTML 확보 후 일괄 업데이트.

---

## 4. 검증 결과

POC 후 D:\dev\baseball-fan-dashboard에서:

```
pnpm typecheck → exit 0
pnpm lint      → "✔ No ESLint warnings or errors"
pnpm test      → 125/125 (114 기존 + 11 신규 crawler-kbo) ✅
pnpm build     → exit 0 (First Load JS 118 kB 유지)
```

신규 픽스처: `tests/fixtures/html/kbo-standings.html` (실 데이터, 54KB), `tests/fixtures/html/kbo-schedule-empty.html` (참조용).

---

## 5. 누적 R1 완화 진척도

| Risk | 이전 | 현재 | 다음 액션 |
|------|:---:|:---:|----------|
| **R1.1 KBO 순위 차단** | placeholder selector | ✅ 실 HTML 검증 + 테스트 | 운영 후 7일 95%+ 측정 |
| **R1.2 KBO 스케줄 차단** | placeholder selector | ⚠️ JSON 엔드포인트 발견, 401 차단 | Playwright(A) 또는 세션(B) 결정 |
| **R1.3 스탯티즈 차단** | placeholder URL | ⚠️ URL 패턴 변경 확인, 루트 OK | 시즌 통계 페이지 재탐색 |

**R1 Score**: 20 → **추정 14** (1/3 확정 + 2/3 명확한 후속 경로 확보).

---

## 6. 다음 PDCA 사이클 권장 순서

1. **운영 결정** (사용자): 스케줄 크롤 옵션 A/B/C/D 중 1개 선택
2. **Playwright 도입 (옵션 A 선택 시)**: GitHub Actions에 Playwright 의존성 추가, schedule cron 워크플로우에 hydration step 추가
3. **스탯티즈 정밀 조정**: 실 HTML 확보 후 STATIZ_SELECTORS 업데이트
4. **R1 7일 95%+ 측정**: 실제 cron 운영 시작 → Discord 알림 모니터링
5. **production 배포**: Vercel deploy
