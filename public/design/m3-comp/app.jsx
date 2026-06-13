/* eslint-disable */
/* ============================================================
   KBO MyTeam Dashboard — App Root
   ============================================================
   Material 3 (Dark) tokens used. KIA Tigers seed.
   For reference, the M3 token set we *used* (excerpt):

   const m3Tokens = {
     colorScheme: {
       primary:           "rgb(255,179,173)",  // m3-primary-80
       onPrimary:         "rgb(105,0,17)",     // m3-primary-20
       primaryContainer:  "rgb(147,0,30)",     // m3-primary-30
       onPrimaryContainer:"rgb(255,218,213)",  // m3-primary-90
       secondary:         "rgb(151,216,156)",  // m3-secondary-80
       secondaryContainer:"rgb(25,82,38)",     // m3-secondary-30
       tertiary:          "rgb(245,201,97)",   // m3-tertiary-80
       tertiaryContainer: "rgb(91,68,0)",      // m3-tertiary-30
       error:             "rgb(242,184,181)",  // m3-error-80
       errorContainer:    "rgb(147,0,6)",      // m3-error-30
       surface:           "rgb(28,27,31)",
       surfaceContainerLow:    "rgb(28,27,31)",
       surfaceContainer:       "rgb(33,32,36)",
       surfaceContainerHigh:   "rgb(43,42,46)",
       surfaceContainerHighest:"rgb(55,53,58)",
       outline:           "rgb(147,143,149)",
       outlineVariant:    "rgb(73,71,76)",
     },
     shape:     { extraSmall: 4, small: 8, medium: 12, large: 16, extraLarge: 28, full: 9999 },
     elevation: {
       level0: "none",
       level1: "0 1px 3px 1px rgba(0,0,0,.15), 0 1px 2px 0 rgba(0,0,0,.3)",
       level2: "0 2px 6px 2px rgba(0,0,0,.15), 0 1px 2px 0 rgba(0,0,0,.3)",
       level3: "0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px 0 rgba(0,0,0,.3)",
       level4: "0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px 0 rgba(0,0,0,.3)",
       level5: "0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px 0 rgba(0,0,0,.3)",
     },
     motion: {
       standard:   "cubic-bezier(0.2, 0, 0, 1)",
       emphasized: "cubic-bezier(0.2, 0, 0, 1)",
       durShort2:  "100ms",
       durShort4:  "200ms",
       durMedium2: "300ms",
       durLong2:   "500ms",
     },
     rankTiers: {  // custom semantic tokens on top of M3 (intentional hue-shift)
       elite:   { container: "rgb(76,46,138)",  on: "rgb(232,221,255)" },  // royal purple
       rare:    { container: "rgb(138,33,98)",  on: "rgb(255,217,232)" },  // magenta-pink (≠ KIA red)
       special: { container: "rgb(94,71,0)",    on: "rgb(255,223,156)" },  // amber
       normal:  { container: "rgb(0,72,116)",   on: "rgb(195,229,255)" },  // blue
     },
   };
   ============================================================ */

const { useState: useS } = React;

function App() {
  const [_, setActivePlayer] = useS(null);

  return (
    <div className="gallery">
      <Intro />

      {/* SCREEN 1 */}
      <ScreenLabel num="01" title="모바일 메인 대시보드" vp="375 × 844" desc="검색·순위·매치업·라인업·일정을 30초 내 판독 가능한 정보 우선 순서로 적층" />
      <Screen1_MobileDashboard onOpenPlayer={setActivePlayer} />

      {/* SCREEN 2 */}
      <ScreenLabel num="02" title="선수 상세 — Bottom Sheet" vp="375 × 844" desc="extra-large 28 상단 코너만 라운드, 드래그 핸들, primary tabs, 스파크라인 (CSS-only)" />
      <Screen2_PlayerSheet initialTab="last10" />

      {/* SCREEN 3 */}
      <ScreenLabel num="03" title="스토리북 결과" vp="375 × 1500+" desc="검색 → 4개 elevated 카드 (오늘/전성기/뉴스/서사) → 이미지 풀 → 마크다운 미리보기 → 액션" />
      <Screen3_Storybook />

      {/* SCREEN 4 */}
      <ScreenLabel num="04" title="데스크톱 메인 대시보드" vp="1440 × 900" desc="검색바 inline, 순위 10팀 한 줄, 매치업 3-col, 라인업 10열" />
      <Screen4_DesktopDashboard onOpenPlayer={setActivePlayer} />

      <Footer />
    </div>
  );
}

function Intro() {
  return (
    <div style={{ width: "100%", maxWidth: 1100, paddingTop: 32, paddingBottom: 24 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 999,
        background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)",
        fontSize: 12, fontWeight: 700, letterSpacing: 0.4, marginBottom: 18 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "#EA0029" }} />
        MATERIAL 3 · KIA TIGERS SEED · DARK
      </div>
      <h1 className="font-brand" style={{ margin: 0, fontSize: 48, lineHeight: "54px", fontWeight: 700, letterSpacing: -1, color: "var(--md-sys-color-on-surface)" }}>
        KBO 마이팀 카드 대시보드
      </h1>
      <p className="md-body-lg" style={{ marginTop: 12, color: "var(--md-sys-color-on-surface-variant)", maxWidth: 760 }}>
        Football Manager 25 톤의 정보 밀집 UX를 Material 3 토큰으로 정리한 다크 우선 시안.
        4개 화면 (모바일 대시보드 / 선수 상세 / 스토리북 결과 / 데스크톱 대시보드) 을 세로로 비교 가능하게 나열.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
        <Tag>Seed #EA0029</Tag>
        <Tag>Surface 5 tier</Tag>
        <Tag>Shape 8/12/16/28</Tag>
        <Tag>Elevation L1–L5</Tag>
        <Tag>Pretendard Var (KR)</Tag>
        <Tag>Roboto Flex (EN)</Tag>
        <Tag>Tier 4 단계 (보라/마젠타/앰버/블루)</Tag>
        <Tag>WCAG AA · 터치 ≥44px</Tag>
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      padding: "5px 10px", borderRadius: 9999,
      background: "var(--md-sys-color-surface-container-high)",
      color: "var(--md-sys-color-on-surface-variant)",
      fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
      border: "1px solid var(--md-sys-color-outline-variant)",
    }}>{children}</span>
  );
}

function ScreenLabel({ num, title, vp, desc }) {
  return (
    <div className="screen-label" style={{ maxWidth: 1100, flexDirection: "column", alignItems: "stretch", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2><span className="num">{num}</span>{title}</h2>
        <span className="vp">{vp}</span>
      </div>
      {desc && <span className="md-body-sm" style={{ color: "var(--md-sys-color-on-surface-variant)", maxWidth: 760 }}>{desc}</span>}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ width: "100%", maxWidth: 1100, paddingTop: 48 }}>
      <hr className="divider-h" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", flexWrap: "wrap", gap: 8 }}>
        <span className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          IP 안전: 타사 게임 브랜드 로고/문자/픽셀 미사용 · 팀 약어 텍스트 마크만 사용
        </span>
        <span className="md-label-md tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>v1 · Material 3 Baseline · KIA Seed</span>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
