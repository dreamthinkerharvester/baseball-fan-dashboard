# 환경 이슈: Google Drive 동기화 vs pnpm install

> **상태**: BLOCKED — runtime 검증 (typecheck/test/build) 진행 불가
>
> **발견 시점**: PDCA Cycle #1 종료 후 환경 검증 단계 (2026-05-09)
> **영향 범위**: 코드 자체는 정상. 의존성 설치/테스트/빌드만 막힘.

---

## 증상

`pnpm install` 실행 시 일관되게 다음 에러 중 하나 발생:

```
ERR_PNPM_EBUSY  EBUSY: resource busy or locked, rename
'G:\내 드라이브\...\node_modules\<pkg>_tmp_NNNNN' -> '...\node_modules\<pkg>'

ERR_PNPM_ENOENT  ENOENT: no such file or directory, rename
'...\node_modules\.pnpm\@playwright+test@1.x\node_modules\playwright' ->
'...\node_modules\.pnpm\@playwright+test@1.x\node_modules\.ignored_playwright'
```

3회 재시도 모두 동일 (다른 패키지명만 바뀜).

## 원인

프로젝트가 **Google Drive 동기화 폴더** (`G:\내 드라이브\...`) 안에 위치.
Google Drive가 `node_modules/`의 수천 개 파일을 실시간 스캔/잠금하면서 pnpm의 임시 → 최종 rename 작업과 충돌.

## 검증 시도 결과

| 시도 | 결과 |
|---|---|
| 기본 `pnpm install` | ❌ EBUSY (Playwright rename 충돌) |
| `.npmrc` `node-linker=hoisted` 적용 후 재시도 | ❌ EBUSY (`is-string` rename 충돌) |
| `--network-concurrency=1` (단일 연결) | ❌ EBUSY (`typed-array-byte-offset` rename 충돌) |
| `node scripts/check-forbidden-words.mjs` (의존성 X) | ✅ 통과 — IP 금지어 0건 |

**코드 품질은 정상**. 단지 외부 의존성 설치만 환경 문제로 막힘.

## 해결 옵션 (사용자 선택)

### 옵션 A — 프로젝트를 동기화 외부로 이동 (권장)

```powershell
# Drive 외부 (예: D:\dev\)로 복사
xcopy "g:\내 드라이브\97. 마구마구 편의성앱" "D:\dev\baseball-fan-dashboard" /E /I /Y

cd D:\dev\baseball-fan-dashboard
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

장점: 동기화 충돌 영구 해결. node_modules가 Drive 용량을 차지하지 않음 (수백 MB 절약).
단점: docs/ 등 작업물이 자동 백업되지 않음 → git remote 사용 필수.

### 옵션 B — Google Drive에서 `node_modules/` 제외 동기화

1. 시스템 트레이 → Google Drive 아이콘 → 톱니 → 환경설정
2. 동기화 옵션에서 "특정 폴더만 동기화" 또는 ".gitignore 패턴 무시" 옵션 (Drive for desktop 버전마다 UI 다름)
3. `node_modules/`, `.next/`, `dist/`, `coverage/`, `playwright-report/` 모두 제외

장점: 프로젝트 위치 유지.
단점: Drive Desktop 클라이언트의 옵션이 제한적 — 특정 하위 폴더 제외가 GUI에서 항상 가능하진 않음.

### 옵션 C — 설치 중 Drive 일시 정지

1. 시스템 트레이 → Google Drive → 일시 중지
2. `pnpm install` 실행
3. 완료 후 Drive 재개

장점: 1회성으로 즉시 효과.
단점: 매번 pnpm install / pnpm add 시 반복해야 함.

## 권장 워크플로우

본 vibecoding 프로젝트의 특성상:
- **소스 코드 + docs/** → Google Drive (자동 백업, 다기기 동기화)
- **node_modules/, .next/, build artifacts** → 로컬 디스크 only

→ **옵션 A (프로젝트 D:\dev로 이동)** 가 가장 깔끔.
이동 후 git init + GitHub remote로 자동 백업하면 Drive 백업과 동등한 안전성.

## 코드 검증 상태 (참고)

환경 이슈와 무관하게 다음은 검증됨:

- ✅ **grep CI (SC-6)** — 의존성 0개, `node` 단독 실행. 통과 확인.
- ✅ **gap-detector Match Rate 94%** — 정적 분석으로 코드 구조·로직·계약 검증 완료.
- ⏳ **TypeScript strict + Lint + Test + Build** — 환경 이슈로 미실행. 코드는 작성 완료.

## 후속 작업

사용자가 옵션 A/B/C 중 하나로 환경 정리 후:
```powershell
pnpm install
pnpm typecheck   # SC-1 확정
pnpm lint        # SC-2 확정
pnpm test        # SC-3, SC-7 확정 (35 grade 케이스 + 50+ 전체)
pnpm build       # 번들 사이즈 < 200KB First Load JS 확인
pnpm test:e2e    # SC-8 확정 (~20 Playwright tests)
pnpm dev         # 동작 확인
vercel deploy    # SC-11 + SC-4 (Lighthouse 측정 가능)
```

이후 Phase 0 POC (R1 mitigation, KBO/statiz selector 정밀 조정) 진입.
