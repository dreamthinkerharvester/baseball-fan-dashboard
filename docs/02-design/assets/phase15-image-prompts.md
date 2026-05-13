# Phase 1.5 — Image Prompts (사용자 생성 가이드)

> **목적**: Phase 1.5 F1 비주얼 에셋 통합을 위해 사용자가 외부 이미지 생성기 (Midjourney / Nano Banana / DALL-E 등)에 그대로 복붙해서 만들 수 있도록 정형화된 프롬프트 모음.
>
> **IP 안전 원칙** — 모든 프롬프트는 마구마구 / 네오위즈 / 넷마블 IP를 일체 언급하지 않으며 "generic baseball-card-game aesthetic, original art" 패턴만 사용. `pnpm check:forbidden` 0건 유지 전제.
>
> **Date**: 2026-05-10
> **Plan Ref**: [phase15-assets-search.plan.md §F1](../../01-plan/features/phase15-assets-search.plan.md)
> **Design Anchor**: `globals.css:6-30` (등급 토큰), `tailwind.config.ts:8-30` (테마 토큰)

---

## 사용 방법

1. 아래 프롬프트 블록을 복사하여 이미지 생성 도구에 붙여넣기
2. 출력된 이미지를 §출력 위치의 정확한 경로 + 파일명으로 저장
3. 모두 도착하면 메인 Claude 에이전트에게 "이미지 도착했어" 라고 말하면 F1 통합 작업 자동 시작

---

## 프롬프트 #1 — 등급별 카드 배경 텍스처 4종

**출력**: 4 PNG, 600×900px, 투명 코너, `public/cards/bg-{elite,rare,special,normal}.png`

```
4 vertical card-shaped background textures, 600x900px each, dark theme, no text, no logos.

1) ELITE: deep purple (#7B2FBE) hexagonal lattice pattern, soft inner glow at top edge,
   subtle starfield, 8% noise, vignette darker at corners.

2) RARE: crimson red (#E63946) brushed-metal diagonal stripes 35deg,
   faint flame ember particles bottom-right, 6% noise.

3) SPECIAL: amber-gold (#F4A261) circuit-line pattern radiating from center,
   warm halo, 5% noise.

4) NORMAL: navy blue (#457B9D) clean grid pattern 8px cells, no glow,
   matte finish, 4% noise.

Common: corners with 8px rounded mask, flat 2D, no perspective, no characters,
generic baseball-card-game aesthetic, original art (NOT referencing any
existing game IP), exportable PNG with transparent corners.
```

---

## 프롬프트 #2 — 포지션 아바타 SVG-friendly 10종

**출력**: 10 SVG (또는 256×256 PNG), `public/avatars/{P,C,1B,2B,3B,SS,LF,CF,RF,DH}.svg`

```
10 monochrome line-art icons for baseball positions, 256x256px each,
single color #F7F8FA on transparent background, 4px stroke,
flat geometric style, no shading, no characters, no faces.

Labels in lower-right corner (12px font, same color):
- P (pitcher: figure mid-pitch silhouette)
- C (catcher: crouched silhouette + mask)
- 1B / 2B / 3B (basemen: figure with glove + base diamond)
- SS (shortstop: figure between bases)
- LF / CF / RF (outfielders: figure with glove toward sky)
- DH (bat-only silhouette)

Inkscape-friendly, geometric primitives only.
```

---

## 프롬프트 #3 — KBO 10팀 IP-safe 모노그램

**출력**: 10 SVG (또는 128×128 PNG), `public/teams/{LG,KT,SSG,NC,KIA,DOOSAN,LOTTE,SAMSUNG,HANWHA,KIWOOM}.svg`

```
10 simple letter monograms for KBO teams, 128x128px circular badge format,
each on team primary color background:

- LG    #C30452 / 텍스트 "LG"
- KT    #000000 / 텍스트 "KT"
- SSG   #CE0E2D / 텍스트 "SSG"
- NC    #315288 / 텍스트 "NC"
- KIA   #EA0029 / 텍스트 "KIA"
- 두산  #131230 / 텍스트 "두산"
- 롯데  #041E42 / 텍스트 "롯데"
- 삼성  #074CA1 / 텍스트 "삼성"
- 한화  #FF6600 / 텍스트 "한화"
- 키움  #570514 / 텍스트 "키움"

White Pretendard-style typography centered, 2-3 letters per team.
Flat circle badge, 4px white border, no team logos, no mascots,
no copyrighted symbols — pure typography monogram only.
```

---

## 프롬프트 #4 — 히어로 / OG 이미지

**출력**: 1 PNG, 1200×630px, `public/og-image.png`

```
1200x630px Open Graph image, dark cinematic baseball stadium silhouette at dusk,
deep navy #0F1320 to #1a1a2e gradient sky, distant stadium light towers as
warm orange #F4A261 dots, faint diamond infield outline at bottom-third,
4 floating semi-transparent rectangular cards (one in each grade color
purple #7B2FBE / red #E63946 / amber #F4A261 / blue #457B9D) hovering
above with soft glow, no text, no players, no logos, no copyrighted IP,
original composition.
```

---

## 프롬프트 #5 — 선수 실루엣 placeholder

**출력**: 3 PNG, 256×256px, 투명 배경, `public/silhouettes/{batter,pitcher,fielder}.png`

```
3 generic baseball player silhouettes 256x256px on transparent background,
solid #1a1a2e fill, no facial features, no team markings:

1) Batter mid-swing right-handed
2) Pitcher windup
3) Fielder ready stance with glove

Used as fallback when real photo is unavailable.
Style: stencil-flat, no gradient, no shadow, geometric simplification.
```

---

## 프롬프트 #6 — Favicon set

**출력**: SVG 1개 + PNG 6개, `public/icon.svg` + `public/favicon-{16,32,48,180,192,512}.png`

```
Single icon design exported in 16/32/48/180/192/512px PNG and SVG.

Concept: rounded square 32x32 base #0F1320,
centered baseball seam curve in #E63946 forming an inverted "C"
with 2 stitches dots, 2px outer glow #7B2FBE.

No text, no team marks, brand-neutral.
```

---

## 정리 — 최종 산출물 트리

```
public/
├── cards/
│   ├── bg-elite.png
│   ├── bg-rare.png
│   ├── bg-special.png
│   └── bg-normal.png
├── avatars/
│   ├── P.svg
│   ├── C.svg
│   ├── 1B.svg ... DH.svg          (총 10개)
├── teams/
│   ├── LG.svg ... KIWOOM.svg      (총 10개)
├── silhouettes/
│   ├── batter.png
│   ├── pitcher.png
│   └── fielder.png
├── og-image.png
├── icon.svg
├── favicon-16.png
├── favicon-32.png
├── favicon-48.png
├── favicon-180.png
├── favicon-192.png
└── favicon-512.png
```

**총 33개 파일** (PNG 22 + SVG 11).

---

## 통합 후 자동 적용되는 파일

| 도착 후 | 자동 수정 대상 |
|---|---|
| #1 카드 배경 4종 | `src/features/lineup-card/PlayerCard.tsx` (data-grade에 background-image 추가) |
| #2 포지션 아이콘 | `src/features/lineup-card/PlayerCard.tsx` 중앙 영역 (현 텍스트 → SVG `<Image>`) |
| #3 팀 모노그램 | `src/components/layout/Header.tsx` 마이팀 배지 + `src/features/league-standings/StandingsBanner.tsx` |
| #4 OG | `src/app/layout.tsx` metadata.openGraph.images |
| #5 실루엣 | `src/features/lineup-card/PlayerCard.tsx` photoUrl 폴백 |
| #6 Favicon | `src/app/layout.tsx` metadata.icons + `public/manifest.json` |
