/* eslint-disable */
/* ============================================================
   KBO Dashboard — Shared Components & Building Blocks
   ============================================================ */

const { useState, useEffect, useMemo, useRef } = React;
const D = window.DATA;

/* ---------- Icon ---------- */
const Icon = ({ name, size = 20, filled = false, weight = 400, style = {}, ...rest }) => (
  <span
    className={"mso" + (filled ? " filled" : "")}
    style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`, ...style }}
    {...rest}
  >{name}</span>
);

/* ---------- Tier Chip ---------- */
const TIER_INFO = {
  elite:   { label: "ELITE",  icon: "star",       cls: "tier-elite" },
  rare:    { label: "RARE",   icon: "diamond",    cls: "tier-rare" },
  special: { label: "SPECIAL",icon: "bolt",       cls: "tier-special" },
  normal:  { label: "NORMAL", icon: "circle",     cls: "tier-normal" },
};
const TierChip = ({ tier, pct, size = "md", showPct = false }) => {
  const t = TIER_INFO[tier];
  const small = size === "sm";
  return (
    <span className={`chip ${small ? "chip-sm" : ""} ${t.cls}`} style={{ fontWeight: 700, letterSpacing: 0.6 }}>
      <Icon name={t.icon} size={small ? 12 : 14} filled style={{ fontSize: small ? 12 : 14 }} />
      <span>{t.label}{showPct && pct != null ? ` ${pct}%` : ""}</span>
    </span>
  );
};

/* ---------- Team logo (text-mark mask, no real logos) ---------- */
const TeamLogo = ({ team, size = 56, ring = false }) => {
  const initials = (team.shortKo || team.code || "?");
  return (
    <span
      className="team-logo"
      style={{
        width: size, height: size, fontSize: Math.round(size * 0.34),
        background: team.color,
        boxShadow: ring ? `0 0 0 3px var(--md-sys-color-surface-container-low), 0 0 0 5px ${team.color}` : "inset 0 0 0 1px rgba(255,255,255,0.16)",
        color: "#fff",
      }}
    >{initials}</span>
  );
};

/* ---------- Standings banner (filter-chip row) ---------- */
const StandingsBanner = ({ all = false }) => {
  // sorted by rank already in DATA
  return (
    <div className="thin-scroll" style={{ display: "flex", gap: 8, overflowX: all ? "visible" : "auto", padding: "8px 16px", scrollSnapType: "x mandatory" }}>
      {D.teams.map((t) => (
        <button key={t.code} className={`team-chip ${t.myteam ? "myteam" : ""}`} style={{ scrollSnapAlign: "start" }}>
          <span className="rank tabular">{t.rank}위</span>
          <span className="dot" style={{ background: t.color }}>{t.shortKo.slice(0, 2)}</span>
          <span style={{ fontWeight: 600 }}>{t.shortKo}</span>
          <span className="tabular" style={{ color: t.myteam ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)", marginLeft: 2 }}>{t.pct}</span>
        </button>
      ))}
    </div>
  );
};

/* ---------- KPI grid ---------- */
const KpiGrid = ({ cols = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 8 }}>
    {D.kiaKpi.map((k) => (
      <div className="kpi-cell" key={k.label}>
        <div className="label">{k.label}</div>
        <div className="value">{k.value}</div>
        <div className="sub">{k.sub}</div>
      </div>
    ))}
  </div>
);

/* ---------- Form dot row ---------- */
const FormDots = ({ list }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {list.map((r, i) => (
      <span key={i} className={`form-dot form-${r.toLowerCase()}`}>{r}</span>
    ))}
  </div>
);

/* ---------- Today's matchup centerpiece ---------- */
const MatchupCenter = ({ compact = false }) => {
  const { away, home, time, date, venue, homeAway, forecast } = D.matchup;
  const awayTeam = D.teams.find(t => t.code === away.code);
  const homeTeam = D.teams.find(t => t.code === home.code);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
        <span className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{date} · {time}</span>
        <span className="chip chip-sm chip-filter-selected">{homeAway}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? 12 : 18 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
          <TeamLogo team={awayTeam} size={compact ? 48 : 56} />
          <div className="md-label-lg">{away.code}</div>
          <div className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{away.pct} · {away.rank}위</div>
        </div>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="font-brand" style={{ fontSize: compact ? 36 : 44, lineHeight: 1, fontWeight: 700, color: "var(--md-sys-color-on-surface)", letterSpacing: -1 }}>VS</div>
          <div className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>@광주</div>
        </div>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
          <TeamLogo team={homeTeam} size={compact ? 48 : 56} ring />
          <div className="md-label-lg" style={{ color: "var(--md-sys-color-primary)" }}>{home.code}</div>
          <div className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{home.pct} · {home.rank}위</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        <span className="chip chip-sm chip-outline"><Icon name="stadium" size={12} />{venue}</span>
        <span className="chip chip-sm chip-outline"><Icon name="wb_sunny" size={12} />{forecast}</span>
      </div>
    </div>
  );
};

/* ---------- TeamMatchupPanel (3-col on desktop, stack on mobile) ---------- */
const TeamMatchupPanel = ({ layout = "stack" /* "stack" | "row" */ }) => {
  const isRow = layout === "row";
  return (
    <div className="card" style={{
      padding: 16,
      display: "grid",
      gridTemplateColumns: isRow ? "1.1fr 1fr 0.9fr" : "1fr",
      gap: isRow ? 24 : 16,
      background: "var(--md-sys-color-surface-container)",
    }}>
      {/* Left: KPI */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="md-title-sm" style={{ color: "var(--md-sys-color-on-surface)" }}>시즌 KPI</div>
          <div className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>KIA · 44/144</div>
        </div>
        <KpiGrid cols={isRow ? 2 : 3} />
      </div>
      {/* Center: Matchup */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: isRow ? "0 8px" : 0,
        borderTop: isRow ? "none" : "1px solid var(--md-sys-color-outline-variant)",
        borderBottom: isRow ? "none" : "1px solid var(--md-sys-color-outline-variant)",
        borderLeft: isRow ? "1px solid var(--md-sys-color-outline-variant)" : "none",
        borderRight: isRow ? "1px solid var(--md-sys-color-outline-variant)" : "none",
        paddingTop: isRow ? 0 : 12, paddingBottom: isRow ? 0 : 12,
      }}>
        <MatchupCenter compact={!isRow} />
      </div>
      {/* Right: Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="md-title-sm" style={{ color: "var(--md-sys-color-on-surface)" }}>최근 5경기</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="md-label-md tabular" style={{ width: 36, color: "var(--md-sys-color-primary)" }}>KIA</span>
            <FormDots list={D.kiaForm} />
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)", marginLeft: "auto" }}>W2</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="md-label-md tabular" style={{ width: 36, color: "var(--md-sys-color-on-surface-variant)" }}>두산</span>
            <FormDots list={D.dusanForm} />
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)", marginLeft: "auto" }}>L1</span>
          </div>
        </div>
        <hr className="divider-h" style={{ margin: "4px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="md-label-md" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>예상 선발</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="num-pill" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", borderColor: "transparent" }}>#41</span>
            <span className="md-body-md" style={{ fontWeight: 600 }}>황동하</span>
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>ERA 3.42</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="num-pill" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface)", borderColor: "transparent" }}>#19</span>
            <span className="md-body-md" style={{ fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>곽빈</span>
            <span className="md-label-sm tabular" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>ERA 4.81</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Player Card (lineup grid item) ---------- */
const PlayerCard = ({ p, onClick, highlight }) => {
  const t = TIER_INFO[p.tier];
  return (
    <div className={`player-card ${p.photo ? "" : "fallback"} ${highlight ? "highlight" : ""}`} onClick={onClick}>
      {p.photo ? (
        <>
          <img src={p.photo} alt={p.name} loading="lazy" />
          <div className="grad-top" />
          <div className="grad-bottom" />
        </>
      ) : (
        <>
          <div className="silhouette"><Icon name={p.pos === "P" ? "sports_baseball" : "person"} size={110} filled /></div>
          <div className="grad-bottom" style={{ height: "55%" }} />
        </>
      )}

      <div className="top-row">
        <span className={`chip chip-sm ${t.cls}`} style={{ height: 22, padding: "0 7px", fontWeight: 700, letterSpacing: 0.5 }}>
          <Icon name={t.icon} size={11} filled style={{ fontSize: 11 }} />
          <span style={{ fontSize: 10 }}>{t.label.slice(0,3)}</span>
        </span>
        <span className="num-pill outline tabular">{typeof p.order === "number" ? p.order : "P"}</span>
      </div>

      <div className="top-row" style={{ top: 36, justifyContent: "flex-end" }}>
        <span className="num-pill tabular">#{p.num}</span>
      </div>

      <div className="bottom-row" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="md-title-sm" style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: "18px" }}>{p.name}</span>
          <span className="md-label-sm tabular" style={{ color: "rgba(255,255,255,0.78)" }}>{p.pct}%</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{
            fontFamily: "var(--md-ref-typeface-mono)",
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            padding: "2px 6px", borderRadius: 4,
            background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)",
          }}>{p.pos}</span>
          {p.hero && (
            <span style={{
              fontFamily: "var(--md-ref-typeface-mono)",
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              padding: "2px 6px", borderRadius: 4,
              background: "rgba(255,255,255,0.18)", color: "#fff",
            }}>HERO</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Lineup grid ---------- */
const LineupGrid = ({ cols = 3, onPlayer, highlightName }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 }}>
    {D.lineup.map(p => (
      <PlayerCard
        key={`${p.num}-${p.order}`}
        p={p}
        onClick={() => onPlayer && onPlayer(p)}
        highlight={highlightName && p.name === highlightName}
      />
    ))}
  </div>
);

/* ---------- Schedule list ---------- */
const ScheduleList = ({ limit = 6 }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {D.schedule.slice(0, limit).map((s, i) => {
        const homeT = D.teams.find(t => t.code === s.home);
        const awayT = D.teams.find(t => t.code === s.away);
        return (
          <div key={i} className={`sched-row ${s.myteam ? "myteam" : ""}`}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44 }}>
              <span className="md-label-md tabular" style={{ color: s.myteam ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)" }}>{s.d}</span>
              <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>({s.w})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <TeamLogo team={awayT} size={24} />
              <span className="md-body-md" style={{ fontWeight: 600 }}>{awayT.shortKo}</span>
              <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>@</span>
              <TeamLogo team={homeT} size={24} />
              <span className="md-body-md" style={{ fontWeight: 600 }}>{homeT.shortKo}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.live && (<span className="chip chip-sm" style={{ background: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-on-error-container)", height: 22, padding: "0 8px", fontWeight: 700 }}>LIVE</span>)}
              <span className="md-label-md tabular" style={{ color: "var(--md-sys-color-on-surface-variant)", width: 48, textAlign: "right" }}>{s.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Sparkline (CSS only) ---------- */
const Sparkline = ({ values, max = 1, height = 32 }) => {
  const peakIdx = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  return (
    <div className="spark" style={{ height }}>
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        return <i key={i} style={{ height: h, background: i === peakIdx ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-primary)", opacity: i === peakIdx ? 1 : 0.85 }} />;
      })}
    </div>
  );
};

/* ---------- Sticky mobile header ---------- */
const MobileHeader = ({ title = "KBO 카드 대시보드", showSearch = true, onSearchToggle }) => (
  <div className="sticky-header" style={{ padding: "0 8px" }}>
    <div className="status-bar">
      <span className="tabular">9:41</span>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center", color: "var(--md-sys-color-on-surface)" }}>
        <Icon name="signal_cellular_4_bar" size={14} />
        <Icon name="wifi" size={14} />
        <Icon name="battery_full" size={14} />
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px 12px" }}>
      <button className="btn btn-icon" aria-label="search" onClick={onSearchToggle}>
        <Icon name="search" size={22} />
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span className="md-title-md" style={{ fontWeight: 700 }}>{title}</span>
        <span className="md-label-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>5/14 · 마이팀 KIA</span>
      </div>
      <span className="chip" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", fontWeight: 700, letterSpacing: 0.5, height: 32, padding: "0 10px" }}>
        <span style={{ width: 14, height: 14, borderRadius: 99, background: "#EA0029" }} />
        KIA
      </span>
      <button className="btn btn-icon" aria-label="settings"><Icon name="settings" size={22} /></button>
    </div>
  </div>
);

/* Expose to window for cross-script access */
Object.assign(window, {
  Icon, TierChip, TIER_INFO, TeamLogo,
  StandingsBanner, KpiGrid, FormDots, MatchupCenter, TeamMatchupPanel,
  PlayerCard, LineupGrid, ScheduleList, Sparkline, MobileHeader,
});
