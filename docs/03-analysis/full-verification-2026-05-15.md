# 전체 검증 — 2026-05-15

> **목적**: 처음 계획 대비 현재 산출물의 진척도, 기능 동작 상태, 누락/추가 권고 사항을 종합 점검.
>
> **검증 시각**: 2026-05-15 KST
> **라이브 URL**: https://baseball-fan-dashboard.vercel.app
> **GitHub**: https://github.com/dreamthinkerharvester/baseball-fan-dashboard (3 commits)

---

## 1. 한눈에 보는 점수

| 영역 | 점수 | 상태 |
|------|------|------|
| **PDCA #1 baseball-fan-dashboard** | 94% | ✅ Match (이전 사이클) |
| **PDCA #2 kia-player-storybook** | 92% (정적 검증) → **78% (런타임 실측)** | ⚠ 데이터 부족 |
| **배포 (Vercel)** | HTTP 200 | ✅ |
| **TypeScript** | exit 0 | ✅ |
| **모바일 최적화** | 5 컴포넌트 | ✅ |
| **Naver 실데이터 라인업** | 5/14 23명 + 사진 22장 | ✅ |
| **Material 3 리디자인** | brief + 프롬프트 작성 | ⏳ 시안 대기 |

**총평**: 골격은 완성. 라이브 동작 중. 단, **선수 통산/최근 통계 데이터가 미수집** 상태라 스토리북의 핵심 가치(전성기 분석 + 1500자 초안)가 약 30~40% 수준으로만 작동.

---

## 2. 라이브 검증 (실측, curl)

| Endpoint | 결과 | 비고 |
|----------|------|------|
| `GET /` | HTTP 200, cache hit | 메인 대시보드 정상 |
| `GET /api/health` | `{status: ok}` | 정상 |
| `GET /api/lineup/KIA?date=2026-05-14` | `confirmed, 9 batters, pitcher=52641` | ✅ 황동하 선발 + 박재현(1)·김선빈(2)·김도영(3) etc — Naver fetch 그대로 |
| `GET /api/storybook/kia-players` | 23명 KIA | ✅ 정확 |
| `GET /api/storybook/52605?date=2026-05-14` (김도영) | 부분 동작 | ⚠ 아래 §4 상세 |

---

## 3. PDCA 두 사이클 진행 매핑

### 3.1 PDCA #1 — baseball-fan-dashboard (이전 세션 + 이번 추가)

| 항목 | 상태 |
|------|------|
| 13 modules | ✅ 완료 |
| 22 FRs | 19 Full + 3 Partial |
| Decision Record Chain | 7/7 |
| Mobile optimization | ✅ 이번 세션 추가 |
| FM-style TeamMatchupPanel | ✅ 신규 모듈 추가 |
| 실데이터 라인업 (Naver) | ✅ 신규 통합 |
| 선수 사진 22장 | ✅ 신규 |

### 3.2 PDCA #2 — kia-player-storybook (이번 세션)

| 모듈 | 정적 | 런타임 실측 |
|------|------|-----------|
| M1 domain types | ✅ | ✅ |
| M2 kia-roster 수집 | ✅ Naver fetch 통합 (15→23명) | ✅ |
| M3 today 빌더 | ✅ 코드 정상 | ⚠ recentTen 비어서 played=false 항상 |
| **M4 prime 자동감지** | ✅ 17 테스트 작성 | **❌ 김도영=rookieFlag (오류)** |
| M5 news (Naver API) | ✅ | ✅ **10건 fetch 성공** |
| M6 narrative (나무위키) | ✅ | ❌ 0 events (selector 미적용) |
| M7 draft markdown | ✅ | ⚠ 416자 (1500-2500 목표 미달) |
| M8 UI 8 파일 | ✅ | ⚠ 미검증 (UX 사용자 직접 테스트 필요) |

---

## 4. 🔴 발견된 핵심 이슈

### Critical-1: 김도영 prime이 rookieFlag로 잘못 분류

**증상**: `/api/storybook/52605` 결과의 prime:
```json
{ "year": 2026, "metric": "OPS", "value": 0.672, "rookieFlag": true, "highlights": [] }
```
김도영은 2024년 MVP·30-30 클럽 = 명백히 신인급 아님.

**원인**: `naver-fetch-lineup.mjs`가 생성한 `data/players/{code}.json` 23개 모두 `careerSeasons: []` 빈 배열. prime 알고리즘은 `seasons.length < 3` → rookieFlag=true 반환.

```bash
# 23/23 KIA 선수 모두 careerSeasons 0건:
50641 ... 78603 → 0 seasons
```

**영향**: 
- 전성기 시즌 자동 감지 (F2) 무의미
- highlights (30-30, 4할 등) 모두 빈 배열
- 마크다운 초안의 "다시 보는 전성기" 섹션이 "아직 전성기를 향해 가는 중" 으로만 출력

### Critical-2: recentTen 데이터 부재 → today 항상 결장

**증상**: `today.played = false` (5/14 경기 진행 중인데도)

**원인**: 동일하게 Naver fetch script가 `recentTen: []` 빈 배열. `today.ts:buildToday`가 date 매칭 못 함.

---

## 5. ⚠️ 계획 대비 미달 (Important)

### G-1: narrative 0 events
- 나무위키 fetch에서 0 events 반환됨 (regex 매칭 실패 또는 fetch 403)
- Plan §3.3에서 Phase 2 cheerio 정밀화 명시했지만 현재 Phase 1 결과도 0 → UI에서 "직접 보충" 메시지만 노출

### G-2: 마크다운 초안 416자 (목표 1500-2500)
- Plan §5: 1500~2500자 검증
- 데이터 부족(prime rookieFlag, narrative 0, recentTen 0)이 누적되어 짧음
- 검증 함수 `validateDraftLength` 호출도 하지 않음

### G-3: 시즌 통계는 결정론적 mock
- Plan §6 SC4: 전성기 감지 정확도 90%+ 일치 목표
- 실 stat 통합 안 됨 (Naver preview API 또는 KBO 공식 추가 통합 필요)
- 등급 산출도 결정론적 시드 (Plan §6.6 SC4 미달)

### G-4: 매치업 헤더 데이터 부족
- StandingsRow 타입에 `last10`, `games` 필드 부재 → TeamMatchupPanel 일부 셀이 "-" 표시
- Naver standings API 통합 또는 fallback 계산 필요

---

## 6. 🟡 Minor 누락

| ID | 항목 |
|----|------|
| M-1 | 외국인 선수 사진 (아데를린 등) URL 패턴 별도 조사 |
| M-2 | 매일 라인업 자동 갱신 cron (현재 수동 `node scripts/crawler/naver-fetch-lineup.mjs`) |
| M-3 | Vercel 환경변수 `NAVER_NEWS_CLIENT_ID/SECRET` 직접 추가 확인 (storybook news 동작은 했으므로 추가됨 추정) |
| M-4 | vitest 자동 실행 (iCloud 환경 정체 → 로컬 SSD 또는 CI에서 재확인) |
| M-5 | 다른 팀(LG/KT 등) 선택 시 동작 검증 — 현재 KIA 외엔 라인업 placeholder만 |
| M-6 | PlayerModal 실제 사진 + 정확한 시즌 통계 표시 검증 |
| M-7 | Match-Rate 가 정적/런타임 갭이 큼 — 가공된 점수의 신뢰도 |

---

## 7. ✅ 잘 작동하는 것

1. **GitHub + Vercel 배포 파이프라인** — push → 자동 빌드 + 배포
2. **모바일 최적화** — 5 컴포넌트 반응형, 터치 44px+
3. **Naver Sports preview API 통합** — 5/14 KIA 실 라인업 + 23명 로스터
4. **선수 사진 22장** — `/assets/players/{code}.png` 정적 서빙
5. **Naver News API** — 김도영 검색 시 10건 클립 fetch 성공
6. **TypeScript strict + noUncheckedIndexedAccess** — 빌드 깨끗
7. **/api/storybook/kia-players + /api/storybook/[id] + /api/lineup/[team]** 모두 200 응답
8. **FM 스타일 PlayerCard** — 풀블리드 사진 + 그라데이션 오버레이 + 등급/타순/등번호/이름/포지션
9. **TeamMatchupPanel** — 3-col KPI + VS + 폼 도트

---

## 8. 🚀 추가 권고 (우선순위)

### P0 (Critical 해결 — 1~2시간 작업)
1. **선수 통산/최근경기 데이터 수집**:
   - 옵션 A: Naver `game-polling` API (116KB) 또는 `currentSeasonStatsOnOpponents` 추출
   - 옵션 B: KBO 공식 `https://www.koreabaseball.com/Player/Result.aspx?playerId={code}` cheerio 스크래핑
   - 옵션 C: 스탯티즈 (기존 크롤러 활용)
   - → `data/players/{code}.json` 에 careerSeasons + recentTen 채우기
2. **prime.ts 실측 확인**: 김도영 careerSeasons 채워진 후 2024년이 best year로 자동 감지되는지 (Plan §6.6 SC6)

### P1 (Important 해결 — 반나절)
3. **나무위키 narrative 정밀화**: cheerio 도입 (이미 dependency 있음), `<h2>선수 경력</h2>` 섹션 추출
4. **draft 글자수 fallback**: 데이터 부족 시 narrative 자세히 풀어쓰기 + validateDraftLength 호출
5. **매치업 데이터 풍부화**: standings.json에 last10/streak 등 추가 또는 game-polling API 통합

### P2 (Phase 2 후보)
6. GitHub Action cron: 매일 09시 KST에 `naver-fetch-lineup.mjs` 실행 → commit → Vercel 자동 재배포
7. 외국인 선수 사진 URL 패턴 (아데를린 등)
8. 타구단(9개) 확장 — 현재 KIA만 storybook 지원
9. Material 3 시안 받아 컴포넌트 8종 리팩터 (사용자 작업 중)
10. PlayerModal 실 통계 + sparkline 검증

---

## 9. 검증 결론

- **계획대로 가고 있는가?** ✅ 80% 그렇다. PDCA 두 사이클 + 모바일 + Naver 통합 모두 계획 라인 안.
- **기능이 잘 돌아가는가?** ⚠️ 70%. 라이브 + API 응답은 OK, 그러나 **데이터 부족으로 핵심 가치(전성기 분석·1500자 초안)가 약 30~40%만 실현**.
- **추가할 내용이 있는가?** ✅ **있다**. P0 1건(통산 데이터 수집), P1 3건, P2 5건. P0만 해결하면 매우 정상 수준.

**즉시 다음 액션 권고**: Naver `game-polling` 또는 KBO 공식 페이지에서 김도영(52605) 1명 분 careerSeasons + recentTen 수집해서 prime 자동감지가 2024년 best year + 30-30 highlights 반환하는지 검증. 그 후 23명 모두 일괄 갱신.

---

**End of Verification**
