# Plan: KIA Player Storybook

> **Summary**: 기아 선수명 입력 → 당일 기록 + 전성기 시즌 + 과거 뉴스 + 선수 서사 + 이미지 풀을 합성해서 1500자+ 블로그 초안 마크다운을 생성하는 신규 기능.
>
> **Version**: 0.1.0 (Phase 1 MVP — KIA만)
> **Date**: 2026-05-11
> **Upstream PRD**: [../../00-pm/kia-player-storybook.prd.md](../../00-pm/kia-player-storybook.prd.md)
> **Reuses**: baseball-fan-dashboard v1 (크롤러 + player 데이터 모델 + Pragmatic 3-Layer)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 야구 블로그 글 1편당 자료 수집 시간 30~60분 → 5분 이내로 압축 |
| **WHO** | 사용자 본인 (KIA 팬 블로거) — 외부 사용자 0명 |
| **CORE VALUE** | 선수 1명 입력 → 4 데이터 영역 + 이미지 풀 + 블로그 초안 마크다운, LLM 미사용으로 토큰 비용 0 |
| **RISK** | R1 네이버 뉴스 API quota (영향=Medium, 대응=7일 캐시) · R2 나무위키 fetch 차단 (Medium, KBO 공식 fallback) · R3 선수 명예훼손 (High, 제외 키워드 + 출처 명시 강제) · R4 신인 데이터 부족 (Low, "전성기 아직" 라벨) |
| **SCOPE** | F1 당일 + F2 전성기 자동감지 + F3 뉴스 클립 + F4 서사 + F5 블로그 초안 마크다운 + F6 이미지 추천 |

---

## 1. 모듈 분할 (Modules)

총 **7개 모듈**, 예상 **2세션** (각 1.5~2시간).

| # | 모듈명 | 핵심 역할 | 의존성 | 산출물 |
|---|--------|----------|--------|--------|
| **M1** | `domain` | 타입 정의 (`Storybook`, `PrimeSeason`, `NewsClip`, `NarrativeEvent`, `DraftBlock`) | — | `src/types/storybook.ts` |
| **M2** | `kia-roster` | KIA 선수 전체 목록 수집 스크립트 1회 실행 + 캐시 | M1 + 기존 crawler | `scripts/crawler/kia-roster.ts` · `data/players/` 확장 |
| **M3** | `service-today` (F1) | 당일 박스스코어 → `Today` 빌더. 결장 시 최근 5경기 fallback | M1 + 기존 crawler | `src/services/storybook/today.ts` |
| **M4** | `service-prime` (F2) | 통산 시즌 기록 → WAR/OPS/ERA 기준 best year. **순수 함수, 100% 커버리지 강제** | M1 + 스탯티즈 fetch | `src/services/storybook/prime.ts` |
| **M5** | `service-news` (F3) | 네이버 뉴스 검색 → 필터링 + 출처 정리 + 7일 캐시 | M1 + Naver API | `src/services/storybook/news.ts` · `data/storybook/cache/news/` |
| **M6** | `service-narrative` (F4) | 나무위키 / KBO 선수페이지 fetch → 타임라인 이벤트 6~10개 추출 + 30일 캐시 | M1 + 신규 fetch util | `src/services/storybook/narrative.ts` · `data/storybook/cache/narrative/` |
| **M7** | `service-draft` (F5 + F6) | M3~M6 + 이미지 풀 → 1500~2500자 마크다운 템플릿 채우기 | M3·M4·M5·M6 + 이미지 풀 | `src/services/storybook/draft.ts` |
| **M8** | `ui` | `/storybook` 페이지 + 4섹션 패널 + 이미지 갤러리 + 복사/다운로드 버튼 | M3~M7 + 기존 API 라우트 | `src/app/storybook/page.tsx` · `src/components/storybook/*` · `src/app/api/storybook/[id]/route.ts` |

> 합계 8개 모듈로 정정 (M7+UI를 분리). M2는 1회성 스크립트이므로 모듈 비용은 가볍다.

### 1.1 의존성 그래프

```
M1 (domain)
 ├─→ M2 (kia-roster) ─┐
 ├─→ M3 (today)       │
 ├─→ M4 (prime)       │── M7 (draft) ─→ M8 (UI)
 ├─→ M5 (news)        │
 └─→ M6 (narrative) ──┘
```

**병렬 가능**: M3, M4, M5, M6 — 서로 독립. 한 세션에 4명이 짜는 게 아니라면 순차 진행이지만 테스트는 독립.

---

## 2. 일정 (Sessions)

### 세션 1 (~2시간) — 백엔드 코어
- M1 domain (~10분)
- M2 kia-roster (~30분, 크롤링 1회 실행 포함)
- M3 today (~25분)
- M4 prime (~30분, 100% 테스트 포함)
- M5 news (~25분, 네이버 API 키 사전 필요)

### 세션 2 (~2시간) — 합성 + UI
- M6 narrative (~30분, 나무위키 정제 로직 까다로움)
- M7 draft (~35분, 마크다운 템플릿 설계)
- M8 ui (~50분, 검색·결과 패널·이미지 갤러리·복사 버튼)
- E2E 1개 (~15분, "김도영 → 초안 생성 → 복사")

---

## 3. 이미지 에셋 통합 (F6 신규)

### 3.1 자산 인벤토리

| 위치 | 파일 수 | 형식 | 추정 용도 |
|------|--------|------|----------|
| `docs/02-design/assets/야구/` | 26 | .jpeg (200~900KB) | 블로그 글 첨부용 이미지 풀 |

**파일명**: 해시(예: `0E0TLuZL.jpeg`). 의미 라벨 없음.

### 3.2 통합 방식 (Decision)

**옵션 비교**:

| 옵션 | 장점 | 단점 | 채택 |
|------|------|------|------|
| A. 블로그 초안에 무작위 1~2장 자동 삽입 | 즉시 사용 가능 | 컨텍스트 무관 이미지 가능성 | ❌ |
| B. 초안에 "[이미지 추천 슬롯]" placeholder + UI에 26장 갤러리 노출 | 사용자가 적절한 이미지 선택 | 한 단계 더 손이 감 | ✅ |
| C. 이미지에 메타 태그 수동 입력 후 매칭 | 정확도 ↑ | 26장 수동 라벨링 부담 | Phase 2 |

**채택: B** — 초안 마크다운에 3개의 `<!-- IMG_SLOT_1 -->` ~ `<!-- IMG_SLOT_3 -->` 주석 라인을 넣고, UI 패널 우측에 이미지 갤러리(3열 그리드) 노출. 클릭 → 마크다운 슬롯에 자동 삽입.

### 3.3 정적 서빙

- `public/assets/baseball/` 로 **심볼릭 링크 또는 복사**해서 Next.js 정적 자산 경로로 노출
- 디폴트: **복사** (next.config.js `output: 'standalone'` 빌드 시 심볼릭 링크 깨질 수 있음)
- 복사 스크립트: `scripts/copy-baseball-assets.mjs` (단순 `fs.cp -R`)
- 빌드 시 자동 실행 (`prebuild` npm script)

### 3.4 한글 폴더명 처리

`docs/02-design/assets/야구/` 의 "야구" 한글 경로를 그대로 정적 자산 URL에 노출하면 인코딩 이슈 가능. 따라서 **복사 단계에서 `public/assets/baseball/` 영문으로 변환**. 원본은 보존.

---

## 4. 데이터 흐름 (Service Layer)

```
[Client] /storybook/[playerId] click
   ↓
[API] GET /api/storybook/[id]
   ↓
[Service] Promise.all([today, prime, news, narrative])  ← 병렬 fetch
   ↓                                                    ← 각자 캐시 우선
[Service] draft.build(today, prime, news, narrative, imagePool)
   ↓
[API Response] { today, prime, news, narrative, draft, images: [...] }
   ↓
[Client] 4섹션 패널 + 갤러리 + 마크다운 미리보기 + 복사 버튼
```

**캐시 정책**:
- today: **1시간** (경기 중에는 갱신, 끝난 후엔 안정)
- prime: **무기한** (통산 기록은 시즌 종료 후 변동 없음, 시즌 중에는 매주 1회 invalidate)
- news: **7일** (네이버 API quota 보호)
- narrative: **30일** (선수 서사는 거의 정적)

---

## 5. 환경변수 (.env.local 추가)

```bash
# Naver Search News API (https://developers.naver.com)
NAVER_NEWS_CLIENT_ID=
NAVER_NEWS_CLIENT_SECRET=

# Storybook 캐시 위치 (기본값)
STORYBOOK_CACHE_DIR=./data/storybook/cache

# 이미지 풀 위치 (기본값)
STORYBOOK_IMAGE_DIR=./public/assets/baseball
```

`.env.example` 도 동시 갱신.

---

## 6. 테스트 전략

### 6.1 단위 테스트 (Vitest)

| 모듈 | 테스트 수 | 커버리지 목표 | 핵심 케이스 |
|------|----------|--------------|------------|
| M4 prime | 15+ | **100% 강제** | 정상(WAR 최고), 동률(2시즌 WAR 동일 → OPS 타이브레이크), 신인(3년 미만), 투수(ERA 최저), 데이터 결손 |
| M5 news | 10+ | 80% | 정상 5건, 제외 키워드 필터, 빈 결과, 캐시 hit, API quota 401, 출처 정리 |
| M6 narrative | 10+ | 80% | 나무위키 성공, fallback KBO, fetch 실패 → 빈 서사 + 사용자 보충 안내, 타임라인 정렬 |
| M7 draft | 12+ | 90% | 정상 합성, 결장 시 fallback, 신인 변형, 이미지 슬롯 3개 정확 삽입, 글자 수 1500~2500 검증 |

### 6.2 E2E 테스트 (Playwright)

| # | 시나리오 | 검증 |
|---|---------|------|
| E1 | `/storybook` 진입 → "김도영" 검색 → 결과 5초 이내 → "복사" 클릭 → 클립보드에 마크다운 | 핵심 경로 |
| E2 | 결장 선수 선택 → fallback 메시지 노출 | 엣지 케이스 |
| E3 | 이미지 갤러리에서 1장 클릭 → 마크다운 슬롯 1에 자동 삽입 | F6 통합 |

### 6.3 데이터 정확도 검증 (수동)

- 김도영 2024시즌이 best year로 자동 감지되는가?
- 당일 경기 기록이 KBO 공식과 일치하는가?
- 뉴스 클립 5건의 출처 링크가 모두 유효한가?

---

## 7. 성공 기준 (PRD §6 재인용 + 측정 방법 구체화)

| SC | 지표 | 목표 | 측정 |
|----|------|------|------|
| SC1 | 자료 수집 시간 | 30분 → 5분 이내 | 사용자 본인 stop-watch (3회 평균) |
| SC2 | 초안 활용률 | 70%+ | 발행글 vs 초안 텍스트 유사도 (수동 비교 3회) |
| SC3 | 당일 기록 정확도 | 100% | KBO 박스스코어 대조 (5경기) |
| SC4 | 전성기 감지 정확도 | 90%+ 일치 | KIA 핵심 선수 10명 수동 검토 |
| SC5 | 응답 속도 | 5초 이내 | 캐시 hit 시 1초 / miss 시 5초 |
| SC6 | M4 prime.ts | 100% 커버리지 | `pnpm test:coverage` |

---

## 8. 리스크 등급 (PRD §7 + 우선순위)

| ID | 리스크 | Severity | Likelihood | Score | 대응 |
|----|--------|----------|-----------|-------|------|
| R3 | 선수 명예훼손 | High | Medium | **15** | 제외 키워드 필터 + 출처 명시 강제 + 사용자가 발행 전 검토 (전제) |
| R1 | 네이버 뉴스 quota 초과 | Medium | Medium | 9 | 7일 캐시 + 결과 영구 저장 + API 키 1개 quota 25,000/일 충분 |
| R2 | 나무위키 차단/구조변경 | Medium | Low | 6 | KBO 공식 fallback + 사용자 보충 안내 + cheerio 셀렉터 격리 |
| R4 | 신인 데이터 부족 | Low | Medium | 4 | "전성기 아직" 라벨 + "현재까지의 성장" 섹션 자동 대체 |

---

## 9. 마일스톤 & Definition of Done

### M-DoD (Module-level Definition of Done)
- [ ] 타입 안전 (TS strict, no `any`)
- [ ] 단위 테스트 작성·통과
- [ ] M4 prime.ts는 100% 커버리지
- [ ] zod 입출력 검증 (API 레이어)

### F-DoD (Feature-level Definition of Done)
- [ ] E1/E2/E3 E2E 통과
- [ ] 김도영으로 수동 End-to-End 검증 → 블로그 초안 출력물 1편 발행 가능 수준
- [ ] 이미지 갤러리 3슬롯 삽입 동작
- [ ] `.env.example` 갱신
- [ ] README.md 에 `/storybook` 섹션 추가

---

## 10. 다음 단계

- **Phase: Plan ✓**
- **다음 명령**: `/pdca design kia-player-storybook`
- **Design에서 결정할 것**:
  1. 마크다운 템플릿 정확한 형태 (섹션 헤더·이미지 슬롯 위치·문체 가이드)
  2. 네이버 뉴스 검색 쿼리 전략 (선수명 + 연도 vs 선수명 + 키워드)
  3. 나무위키 정제 셀렉터 (어떤 섹션을 어떻게 타임라인으로 변환할지)
  4. UI 패널 레이아웃 와이어프레임
  5. API 라우트 시그니처 (`/api/storybook/[id]?date=YYYY-MM-DD`)

---

## 부록 A. 이미지 풀 인벤토리 (현재)

`docs/02-design/assets/야구/` 26개 .jpeg — 빌드 시 `public/assets/baseball/` 로 자동 복사.

```
0E0TLuZL · 0PvyMPV0 · 0qNZjjT6 · 16Eh4Yv6 · 24l8k5ND · 2CYDdnGY · 9itcnLTs ·
BHr7Rlam · Bo6Lq1Ai · DdFHJzZx · HRXDTotj · JBdXoZRk · LA1JoC7U · NPSkXXN0 ·
OI9tILBR · aflVbCjU · bdkwtVAt · e7xDuRCj · f8VSxhe7 · h6nwwZOB · hv2L7B5k ·
mKCoV4ZP · ralprvuX · vj5V2SzI · wCv9MWed · ye2Z1wYf
```

Phase 2 후보 작업: 이미지 의미 라벨링 (예: "김도영 홈런 세리머니", "광주 챔피언스 필드" 등) → 컨텍스트 기반 자동 매칭.

---

**End of Plan**
