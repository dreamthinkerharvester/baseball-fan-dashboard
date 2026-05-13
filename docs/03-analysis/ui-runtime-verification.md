# UI Runtime Verification — Live Browser Test

> **상태**: ✅ ALL FLOWS VERIFIED
>
> **수행일**: 2026-05-09
> **방법**: Playwright headless Chromium (iPhone 14 Pro 390×844 viewport, KST locale)
> **서버**: `pnpm dev` (Next.js 14.2.35, http://localhost:3000)
> **시드**: `pnpm seed:dev` (tests/fixtures → data/)

---

## 검증 항목 결과

| # | Flow | Status | 측정값 |
|:-:|------|:------:|--------|
| 1 | First visit → Team Selection 화면 | ✅ | heading=1, 10팀 버튼, "그냥 둘러보기" link |
| 2 | LG 클릭 → Dashboard 전환 | ✅ | localStorage="LG", lineup heading 표시 |
| 3 | Standings Banner 렌더 | ✅ | "리그 순위" 표시 |
| 4 | Schedule Section 렌더 | ✅ | "경기 일정" 표시 |
| 5 | Lineup Cards 그리드 | ✅ | **20장 [data-grade] 카드** (LG + KT 양팀 합산) |
| 6 | 카드 클릭 → Modal 슬라이드업 | ✅ | dialog=1, 시즌/역대 탭 모두 노출 |
| 7 | Escape → Modal 닫힘 | ✅ | dialog=0 (포커스 트리거로 복귀) |
| 8 | Reload → myTeam 유지 | ✅ | 새로고침 후 즉시 dashboard |
| 9 | Console errors | ✅ | **0건** |
| 10 | Page errors | ✅ | **0건** |
| 11 | Failed requests | ✅ | **0건** |

**총평**: PRD §11 TS-01~TS-05 + US-05 시나리오 모두 실제 브라우저에서 동작 확인.

---

## 검증 중 발견·수정된 2 critical 이슈

### 🐛 Issue #1: CSP가 Next.js dev mode를 막음

**증상**:
```
Evaluating a string as JavaScript violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"
```

→ React hydration 실패 → useEffect 미실행 → useMyTeam.ready 영구 false → 팀 선택 화면 영영 안 뜸.

**원인**: 우리의 `next.config.js` CSP가 `'unsafe-eval'` 미허용. Next.js HMR이 eval() 사용하므로 dev에서 charge.

**수정**: `next.config.js`에 dev/prod 분기:

```js
const isDev = process.env.NODE_ENV === 'development';
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),     // ← 핵심
  'https://va.vercel-scripts.com',
].join(' ');
```

또한 SWR/HMR WebSocket용으로 `connect-src`에 `ws: wss:` 추가.

**임팩트**: 이 버그가 있는 한 어떤 사용자도 dev 환경에서 앱을 사용할 수 없었음. PDCA Check phase에서 정적 검증만으로는 절대 발견 불가.

### 🐛 Issue #2: 503 에러 — production data/ 시드 부재

**증상**: API Routes (/api/standings, /api/games, /api/lineup) 모두 503 STALE_CACHE 반환. UI는 빈 상태 ("순위 불러오기 실패", "라인업 불러오는 중…" 멈춤).

**원인**: production `data/` 디렉토리에 `teams.json`, `players.json`만 있고 시계열 캐시(standings, games, lineups)는 부재. crawler가 채우는데, 로컬 dev에서는 crawler 실행 전.

**수정**: 새 스크립트 `scripts/seed-dev.mjs` + package.json scripts:

```json
"dev": "next dev",
"dev:seed": "node scripts/seed-dev.mjs && next dev",
"seed:dev": "node scripts/seed-dev.mjs"
```

`seed-dev.mjs`는 `tests/fixtures/*` → `data/*`로 idempotent 복사 (이미 존재하면 보존). 첫 dev 실행 시 한 번 `pnpm seed:dev` → 그 후 `pnpm dev`.

---

## 운영 시 필요 변경 (없음)

CSP 수정은 dev에서만 unsafe-eval 허용 — production 빌드는 strict 그대로. 자동 분기되므로 별도 액션 X.

`pnpm seed:dev`는 dev 전용 — production에서는 GH Actions cron이 data/ 채움.

---

## 검증 환경

- **OS**: Windows 11
- **Node**: 24.15.0
- **Next.js**: 14.2.35
- **pnpm**: 9.7.0
- **Browser**: Chromium (Playwright bundled)
- **Viewport**: 390×844 (iPhone 14 Pro)
- **Locale/TZ**: ko-KR / Asia/Seoul

---

## 최종 검증 매트릭스

| 단계 | 결과 |
|------|------|
| typecheck | ✅ 0 errors |
| lint | ✅ "No ESLint warnings or errors" |
| check:forbidden | ✅ 0 IP 위반 |
| test | ✅ **125/125** (114 기존 + 11 crawler-kbo) |
| build | ✅ First Load JS 118 kB |
| **Live browser smoke** | ✅ **모든 핵심 흐름** + 0 console errors |

## Plan SC 최종 갱신

| SC | 이전 | 현재 |
|---|:---:|:---:|
| SC-1 TypeScript strict | ✅ | ✅ |
| SC-2 ESLint 0 경고 | ✅ | ✅ |
| SC-3/SC-7 등급 100% coverage | ✅ | ✅ |
| SC-4 Lighthouse 80 | ⏳ | ⏳ (배포 후) |
| SC-5 hallway test 70%+ | ⏳ | ⏳ (휴먼) |
| SC-6 IP grep 0건 | ✅ | ✅ |
| SC-8 L1+L2+L3 자동화 | ✅ | ✅ |
| SC-9 gap-detector ≥ 90% | ✅ 94% | ✅ 94% |
| SC-10 Critical 0 | ✅ | ✅ |
| SC-11 Vercel 배포 | ⏳ | ⏳ |
| SC-12 면책 + Privacy | ✅ | ✅ |
| **SC-NEW Live UI runtime** | — | ✅ **NEW** (smoke test) |

---

## 다음 단계

1. ✅ 코드 + 빌드 + 단위 테스트 + UI 동작 모두 확인 완료
2. ⏳ Vercel deploy + Lighthouse 측정 (사용자 액션)
3. ⏳ Phase 0 POC 후속: KBO 스케줄 옵션 결정 (A/B/C/D), 스탯티즈 시즌 통계 selector
4. ⏳ Phase 2 PDCA cycle 시작 (SNS 공유, 카카오 로그인, push 알림 등)
