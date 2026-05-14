/* eslint-disable */
/* ============================================================
   KBO Dashboard — Screen 1: Mobile Main Dashboard (375×844)
   ============================================================ */
const D1 = window.DATA;

function Screen1_MobileDashboard({ onOpenPlayer }) {
  return (
    <div className="phone-frame" data-screen-label="01 Mobile Dashboard" style={{ height: 844, display: "flex", flexDirection: "column" }}>
      <MobileHeader />
      <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 0 24px" }}>
        {/* Standings banner */}
        <div style={{ padding: "0 0 8px" }}>
          <div style={{ padding: "0 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>STANDINGS · 5/14</span>
            <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>← swipe</span>
          </div>
          <StandingsBanner />
        </div>

        {/* Today's matchup panel */}
        <div style={{ padding: "8px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px 6px" }}>
            <span className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>오늘의 경기</span>
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-primary)" }}>● LIVE 곧 시작</span>
          </div>
          <TeamMatchupPanel layout="stack" />
        </div>

        {/* Lineup */}
        <div style={{ padding: "4px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 4px 10px" }}>
            <span className="md-title-md">선발 라인업</span>
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>9 + P · 등급 4단계</span>
          </div>
          <LineupGrid cols={3} onPlayer={onOpenPlayer} highlightName="김도영" />

          {/* Tier distribution legend strip */}
          <div style={{ display: "flex", gap: 6, padding: "10px 0 0", flexWrap: "wrap" }}>
            <span className="chip chip-sm tier-elite"><Icon name="star" size={11} filled />ELITE 1</span>
            <span className="chip chip-sm tier-rare"><Icon name="diamond" size={11} filled />RARE 3</span>
            <span className="chip chip-sm tier-special"><Icon name="bolt" size={11} filled />SPECIAL 3</span>
            <span className="chip chip-sm tier-normal"><Icon name="circle" size={11} filled />NORMAL 3</span>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ padding: "4px 16px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 4px 10px" }}>
            <span className="md-title-md">다가오는 경기</span>
            <a className="md-label-md" style={{ color: "var(--md-sys-color-primary)", cursor: "pointer" }}>전체 보기 →</a>
          </div>
          <ScheduleList limit={5} />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div style={{
        height: 64, borderTop: "1px solid var(--md-sys-color-outline-variant)",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        background: "var(--md-sys-color-surface-container)",
      }}>
        {[
          { i: "dashboard", l: "대시보드", on: true },
          { i: "groups",    l: "선수",     on: false },
          { i: "menu_book", l: "스토리북", on: false },
          { i: "person",    l: "마이",     on: false },
        ].map(t => (
          <button key={t.l} className="btn btn-icon" style={{
            width: "100%", height: "100%", borderRadius: 0,
            display: "flex", flexDirection: "column", gap: 2,
            color: t.on ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)",
          }}>
            <Icon name={t.i} size={22} filled={t.on} />
            <span className="md-label-sm" style={{ fontWeight: t.on ? 700 : 500 }}>{t.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Screen 2: Mobile Player Bottom Sheet Modal (375×844)
   ============================================================ */
function Screen2_PlayerSheet({ initialTab = "season" }) {
  const [tab, setTab] = useState(initialTab);
  const p = D1.playerProfile;
  const tierInfo = TIER_INFO[p.tier];

  const stats = tab === "season" ? p.season2025 : tab === "career" ? p.career : p.last10;
  const spark = p.last10Spark;
  const peak = Math.max(...spark);

  return (
    <div className="phone-frame" data-screen-label="02 Player Bottom Sheet" style={{ height: 844, position: "relative", display: "flex", flexDirection: "column" }}>
      {/* Dimmed background (faux dashboard) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "var(--md-sys-color-surface)" }}>
        {/* Faux dashboard fade — show top status + standings */}
        <MobileHeader />
        <div style={{ padding: "12px 16px" }}>
          <div style={{ padding: "0 4px 6px" }}>
            <span className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>STANDINGS · 5/14</span>
          </div>
        </div>
        <StandingsBanner />
        <div style={{ height: 8 }} />
        <div style={{ padding: "0 16px" }}><TeamMatchupPanel layout="stack" /></div>
        {/* Scrim */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      </div>

      {/* Bottom sheet */}
      <div className="bottom-sheet" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "82%", display: "flex", flexDirection: "column" }}>
        <div className="drag-handle" />
        {/* Hero header */}
        <div style={{ padding: "16px 20px 0", position: "relative" }}>
          <button className="btn btn-icon" style={{ position: "absolute", right: 12, top: 8, color: "var(--md-sys-color-on-surface-variant)" }} aria-label="close">
            <Icon name="close" size={22} />
          </button>
          <div style={{
            position: "relative",
            aspectRatio: "16/9",
            borderRadius: "var(--md-sys-shape-corner-large)",
            overflow: "hidden",
            background: "var(--md-sys-color-surface-container-highest)",
          }}>
            <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%", background: "linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0))" }} />
            <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 6 }}>
              <TierChip tier={p.tier} pct={p.pct} showPct />
              <span className="num-pill" style={{ height: 24, fontSize: 12 }}>#{p.num}</span>
            </div>
            <div style={{ position: "absolute", left: 14, bottom: 12, color: "#fff" }}>
              <div className="font-brand" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: "30px" }}>{p.name}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                <span className="md-label-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{p.nameEn}</span>
                <span style={{ width: 3, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.4)" }} />
                <span className="md-label-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{p.pos}</span>
                <span style={{ width: 3, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.4)" }} />
                <span className="md-label-sm tabular" style={{ color: "rgba(255,255,255,0.85)" }}>{p.bats}</span>
              </div>
            </div>
          </div>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, paddingTop: 10, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="chip chip-sm chip-outline">{p.born}</span>
              <span className="chip chip-sm chip-outline">{p.height}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-tonal" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>
                <Icon name="auto_awesome" size={14} />스토리북
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 14 }} className="tabs">
          <button className={tab === "season" ? "active" : ""} onClick={() => setTab("season")}>시즌</button>
          <button className={tab === "career" ? "active" : ""} onClick={() => setTab("career")}>역대</button>
          <button className={tab === "last10" ? "active" : ""} onClick={() => setTab("last10")}>최근 10경기</button>
        </div>

        {/* Body */}
        <div className="thin-scroll" style={{ overflowY: "auto", padding: "16px 20px 20px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {stats.map((s) => (
              <div key={s.lbl} className="kpi-cell" style={{ background: "var(--md-sys-color-surface-container-highest)" }}>
                <div className="label">{s.lbl}</div>
                <div className="value">{s.val}</div>
              </div>
            ))}
          </div>

          {/* Sparkline mini chart */}
          <div className="card" style={{ marginTop: 14, padding: 14, background: "var(--md-sys-color-surface-container-highest)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span className="md-title-sm">최근 10경기 OPS</span>
              <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>peak .920 · avg .580</span>
            </div>
            <Sparkline values={spark} max={peak} height={42} />
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6 }}>
              <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>10G ago</span>
              <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>오늘</span>
            </div>
          </div>

          {/* Splits list */}
          <div style={{ marginTop: 14 }}>
            <div className="md-title-sm" style={{ marginBottom: 4 }}>스플릿</div>
            <div className="stat-row"><span className="lbl">vs RHP</span><span className="val tabular">.288 / .355 / .461</span></div>
            <div className="stat-row"><span className="lbl">vs LHP</span><span className="val tabular">.222 / .288 / .333</span></div>
            <div className="stat-row"><span className="lbl">홈 / 원정</span><span className="val tabular">.301 / .242</span></div>
            <div className="stat-row"><span className="lbl">득점권</span><span className="val tabular">.342 (13/38)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Screen 3: Storybook Result (375×~1500)
   ============================================================ */
function Screen3_Storybook() {
  const sb = D1.storybook;
  const p = D1.playerProfile;
  const [selectedThumbs, setSelectedThumbs] = useState(new Set(sb.slotsUsed));

  const toggleThumb = (i) => {
    setSelectedThumbs(s => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const markdown = `# 김도영, 조정기를 지나며 (2025.05.14)

> KIA #5 · 3B · NORMAL 38% · 작성: AI Storybook

**오늘의 경기** (5/14 vs 두산 @광주, KIA 승)
- 1회 우중간 안타, 5회 좌선상 2루타, 7회 사구
- AB 3 · H 2 · 2B 1 · RBI 1 · R 1

**전성기 — 2024**
2024년 김도영은 만 20세의 나이로 KBO 최초의 30-30 클럽에 가입하며
WAR 8.2, OPS 1.067의 시즌으로 정규시즌 MVP를 차지했다.

**과거 뉴스 5건**
1. 2024.09.18 [스포츠경향] 첫 만 20세 30-30 클럽 가입
2. 2024.07.12 [MK스포츠] 월간 MVP 4회 수상
...

**선수 서사**
2022 데뷔 → 2023 KS 우승 → 2024 MVP → 2025 조정기 → ...

— 글자수: 612자 / 토큰: 348`;

  return (
    <div className="phone-frame" data-screen-label="03 Storybook Result" style={{ minHeight: 1500, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="sticky-header" style={{ padding: "0 8px" }}>
        <div className="status-bar">
          <span className="tabular">9:41</span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="signal_cellular_4_bar" size={14} /><Icon name="wifi" size={14} /><Icon name="battery_full" size={14} />
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 12px" }}>
          <button className="btn btn-icon" aria-label="back"><Icon name="arrow_back" size={22} /></button>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span className="md-title-md" style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="auto_stories" size={20} filled style={{ color: "var(--md-sys-color-tertiary)" }} />Storybook
            </span>
            <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>김도영 · 1건 임시저장</span>
          </div>
          <button className="btn btn-icon"><Icon name="more_vert" size={22} /></button>
        </div>
      </div>

      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Search bar */}
        <div className="search-bar">
          <Icon name="search" size={20} />
          <input defaultValue="김도영" placeholder="기아 선수명 입력 (예: 김도영)" />
          <button className="btn btn-icon" style={{ width: 32, height: 32 }}><Icon name="close" size={18} /></button>
        </div>

        {/* Recently used chips */}
        <div>
          <div className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)", padding: "0 2px 6px" }}>최근 사용</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["김도영", "박재현", "김호령", "윤도현", "황동하", "김선빈"].map((n, i) => (
              <span key={n} className={`chip chip-sm ${i === 0 ? "chip-filter-selected" : "chip-outline"}`}>
                {i === 0 && <Icon name="check" size={12} />}
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Card 1 — today's game */}
        <ElevatedCard overline="① 오늘의 경기" headline={sb.today.title}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sb.today.lines.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="md-label-sm tabular" style={{ width: 18, color: "var(--md-sys-color-on-surface-variant)" }}>{i + 1}.</span>
                <span className="md-body-md">{l}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--md-sys-color-surface-container-highest)", borderRadius: 8, color: "var(--md-sys-color-on-surface)" }}>
            <span className="font-mono md-label-md tabular">{sb.today.stat}</span>
          </div>
        </ElevatedCard>

        {/* Card 2 — prime season 2024 */}
        <ElevatedCard overline="② 전성기 시즌" headline="2024 — MVP의 해" accent>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 8 }}>
            {sb.prime2024.chips.map((c, i) => (
              <span key={i} className={`chip chip-sm ${i < 3 ? "tier-special" : i < 5 ? "tier-rare" : "tier-elite"}`} style={{ fontWeight: 700 }}>
                <Icon name={i < 3 ? "show_chart" : i < 5 ? "trending_up" : "emoji_events"} size={12} filled />{c}
              </span>
            ))}
          </div>
          <p className="md-body-md" style={{ margin: 0, color: "var(--md-sys-color-on-surface)" }}>{sb.prime2024.summary}</p>
        </ElevatedCard>

        {/* Card 3 — past news */}
        <ElevatedCard overline="③ 과거 뉴스" headline="언론 보도 5건">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sb.pastNews.map((n, i) => (
              <a key={i} className="" style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--md-sys-color-outline-variant)",
                textDecoration: "none", color: "inherit", cursor: "pointer",
              }}>
                <span className="md-label-sm tabular" style={{ width: 76, color: "var(--md-sys-color-on-surface-variant)", flexShrink: 0, paddingTop: 2 }}>{n.date}</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="md-label-sm" style={{ color: "var(--md-sys-color-tertiary)", fontWeight: 600 }}>{n.src}</span>
                  <span className="md-body-md" style={{ fontWeight: 500 }}>{n.title}</span>
                </div>
                <Icon name="open_in_new" size={16} style={{ color: "var(--md-sys-color-on-surface-variant)", flexShrink: 0, marginTop: 4 }} />
              </a>
            ))}
          </div>
        </ElevatedCard>

        {/* Card 4 — narrative timeline */}
        <ElevatedCard overline="④ 선수 서사" headline="연도별 타임라인">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sb.timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === sb.timeline.length - 1 ? 0 : 10, position: "relative" }}>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 60 }}>
                  <span className="md-label-md tabular" style={{
                    background: i === sb.timeline.length - 1 ? "var(--md-sys-color-tertiary-container)" : "var(--md-sys-color-surface-container-highest)",
                    color: i === sb.timeline.length - 1 ? "var(--md-sys-color-on-tertiary-container)" : "var(--md-sys-color-on-surface)",
                    padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11,
                  }}>{t.y}</span>
                  {i < sb.timeline.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: "var(--md-sys-color-outline-variant)", margin: "6px 0 0", borderRadius: 1 }} />
                  )}
                </div>
                <div style={{ paddingTop: 2, paddingBottom: 6, flex: 1 }}>
                  <span className="md-body-md" style={{ color: i === sb.timeline.length - 1 ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-on-surface)", fontWeight: i === sb.timeline.length - 1 ? 600 : 400 }}>{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </ElevatedCard>

        {/* Image pool */}
        <ElevatedCard overline="⑤ 이미지 풀" headline={`썸네일 (${sb.images}장) · 3개 슬롯`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {Array.from({ length: sb.images }).map((_, i) => {
              const slotIdx = sb.slotsUsed.indexOf(i);
              const selected = selectedThumbs.has(i);
              return (
                <div key={i} className={`thumb ${selected ? "selected" : ""}`} onClick={() => toggleThumb(i)}>
                  <img src={`https://picsum.photos/seed/kbo-thumb-${i}/160/160`} alt="" loading="lazy" />
                  {slotIdx >= 0 && <span className="slot-tag">SLOT {slotIdx + 1}</span>}
                  {selected && (
                    <span style={{ position: "absolute", right: 4, top: 4, width: 16, height: 16, borderRadius: 99, background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="check" size={10} weight={700} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ElevatedCard>

        {/* Markdown preview */}
        <ElevatedCard overline="⑥ 마크다운 미리보기" headline="story-2025-05-14.md" mono>
          <div className="md-preview">
            <span className="md-h"># 김도영, 조정기를 지나며 (2025.05.14){"\n\n"}</span>
            <span className="md-dim">{`> KIA #5 · 3B · NORMAL 38% · 작성: AI Storybook\n\n`}</span>
            <span className="md-em">**오늘의 경기** </span>(5/14 vs 두산 @광주, KIA 승){"\n"}
            - 1회 우중간 안타, 5회 좌선상 2루타, 7회 사구{"\n"}
            - AB 3 · H 2 · 2B 1 · RBI 1 · R 1{"\n\n"}
            <span className="md-em">**전성기 — 2024**</span>{"\n"}
            2024년 김도영은 만 20세의 나이로 KBO 최초의 30-30 클럽에 가입하며{"\n"}
            WAR 8.2, OPS 1.067의 시즌으로 정규시즌 MVP를 차지했다.{"\n\n"}
            <span className="md-em">**과거 뉴스 5건**</span>{"\n"}
            1. 2024.09.18 [스포츠경향] 첫 만 20세 30-30 클럽 가입{"\n"}
            2. 2024.07.12 [MK스포츠] 월간 MVP 4회 수상{"\n"}
            ...{"\n\n"}
            <span className="md-em">**선수 서사**</span>{"\n"}
            2022 데뷔 → 2023 KS 우승 → 2024 MVP → 2025 조정기 → ...{"\n\n"}
            <span className="md-dim">— 글자수: 612자 / 토큰: 348</span>
          </div>
        </ElevatedCard>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <button className="btn btn-filled" style={{ width: "100%", height: 48 }}>
            <Icon name="content_copy" size={18} />마크다운 복사
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="btn btn-tonal" style={{ height: 44 }}>
              <Icon name="download" size={18} />.md 다운로드
            </button>
            <button className="btn btn-tonal" style={{ height: 44 }}>
              <Icon name="refresh" size={18} />재생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElevatedCard({ overline, headline, accent, mono, children }) {
  return (
    <div className="card card-elevated" style={{
      padding: 16,
      background: accent ? "color-mix(in oklab, var(--md-sys-color-tertiary-container) 24%, var(--md-sys-color-surface-container-low))" : "var(--md-sys-color-surface-container-low)",
      borderRadius: "var(--md-sys-shape-corner-large)",
    }}>
      <div className="md-label-md" style={{ color: accent ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>{overline}</div>
      <div className="md-headline-sm" style={{ marginBottom: 12, fontFamily: mono ? "var(--md-ref-typeface-mono)" : "var(--md-ref-typeface-brand)", fontSize: mono ? 18 : 22, lineHeight: "26px", fontWeight: 600, color: "var(--md-sys-color-on-surface)" }}>{headline}</div>
      {children}
    </div>
  );
}

/* ============================================================
   Screen 4: Desktop Main Dashboard (1440×900)
   ============================================================ */
function Screen4_DesktopDashboard({ onOpenPlayer }) {
  return (
    <div className="desktop-frame" data-screen-label="04 Desktop Dashboard" style={{ height: 900, display: "flex", flexDirection: "column" }}>
      {/* Desktop header */}
      <div className="sticky-header" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9,
            background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="sports_baseball" size={18} filled />
          </span>
          <span className="md-title-md" style={{ fontWeight: 700 }}>KBO 카드 대시보드</span>
          <span className="chip chip-sm" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", fontWeight: 700, marginLeft: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: "#EA0029" }} />KIA Tigers
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div className="search-bar" style={{ width: 480, height: 40 }}>
            <Icon name="search" size={20} />
            <input placeholder="선수명, 팀, 경기 검색 (예: 김도영, KIA, 5/14)" />
            <span className="chip chip-sm chip-outline">⌘K</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { i: "dashboard", l: "대시보드", on: true },
            { i: "groups",    l: "선수",     on: false },
            { i: "menu_book", l: "스토리북", on: false },
          ].map(n => (
            <button key={n.l} className="chip" style={{
              height: 36, padding: "0 12px",
              background: n.on ? "var(--md-sys-color-secondary-container)" : "transparent",
              color: n.on ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)",
              fontWeight: 600,
            }}>
              <Icon name={n.i} size={16} filled={n.on} />{n.l}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: "var(--md-sys-color-outline-variant)", margin: "0 8px" }} />
          <button className="btn btn-icon"><Icon name="notifications" size={20} /></button>
          <button className="btn btn-icon"><Icon name="settings" size={20} /></button>
          <div style={{ width: 36, height: 36, borderRadius: 99, background: "var(--md-sys-color-tertiary-container)", color: "var(--md-sys-color-on-tertiary-container)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>K</div>
        </div>
      </div>

      <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Standings — all 10 in one row */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span className="md-title-sm" style={{ color: "var(--md-sys-color-on-surface)" }}>2025 KBO 정규시즌 순위 · 5/14 기준</span>
            <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>마이팀 KIA 강조</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
            {D1.teams.map(t => (
              <div key={t.code} className="team-chip" style={{
                justifyContent: "flex-start",
                background: t.myteam ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-surface-container-high)",
                color: t.myteam ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface)",
                boxShadow: t.myteam ? "0 0 0 2px var(--md-sys-color-primary)" : "none",
              }}>
                <span className="rank tabular" style={{ color: t.myteam ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)" }}>{t.rank}위</span>
                <span className="dot" style={{ background: t.color }}>{t.shortKo.slice(0, 2)}</span>
                <span style={{ fontWeight: 600 }}>{t.shortKo}</span>
                <span className="tabular" style={{ marginLeft: "auto", color: t.myteam ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)" }}>{t.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matchup row */}
        <TeamMatchupPanel layout="row" />

        {/* Lineup + Schedule split */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div>
                <span className="md-title-md">선발 라인업 — 5/14 vs 두산</span>
                <span className="md-label-md" style={{ marginLeft: 12, color: "var(--md-sys-color-on-surface-variant)" }}>10장 · 등급 4단계 분포</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="chip chip-sm tier-elite"><Icon name="star" size={11} filled />1</span>
                <span className="chip chip-sm tier-rare"><Icon name="diamond" size={11} filled />3</span>
                <span className="chip chip-sm tier-special"><Icon name="bolt" size={11} filled />3</span>
                <span className="chip chip-sm tier-normal"><Icon name="circle" size={11} filled />3</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
              {D1.lineup.map(p => (
                <PlayerCard key={`${p.num}-${p.order}`} p={p} onClick={() => onOpenPlayer && onOpenPlayer(p)} highlight={p.name === "김도영"} />
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="md-title-md">다가오는 경기</span>
              <a className="md-label-md" style={{ color: "var(--md-sys-color-primary)", cursor: "pointer" }}>전체 →</a>
            </div>
            <ScheduleList limit={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Expose */
Object.assign(window, {
  Screen1_MobileDashboard, Screen2_PlayerSheet, Screen3_Storybook, Screen4_DesktopDashboard,
});
