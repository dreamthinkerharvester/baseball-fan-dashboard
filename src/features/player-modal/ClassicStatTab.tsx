// Design Ref: kia-fan-service §5.4 (FR-04) — 모달 클래식 탭.
// 세이버 온리 모드(토글 OFF)면 전체 블러 + 안내. 토글 ON이면 공개.

'use client';

import { useSaberMode } from '@/features/saber-mode/SaberModeContext';

export interface ClassicStatTabProps {
  isPitcher: boolean;
  currentSeason: Record<string, unknown>;
}

export function ClassicStatTab({ isPitcher, currentSeason }: ClassicStatTabProps) {
  const { hidden } = useSaberMode();
  const cells = isPitcher ? buildPitcherCells(currentSeason) : buildBatterCells(currentSeason);

  return (
    <div style={{ position: 'relative' }}>
      <dl
        className="grid grid-cols-3 gap-2 sm:grid-cols-5"
        aria-hidden={hidden || undefined}
        style={{
          margin: 0,
          filter: hidden ? 'blur(6px)' : 'blur(0)',
          userSelect: hidden ? 'none' : 'auto',
          transition: 'filter 0.3s ease',
          pointerEvents: hidden ? 'none' : 'auto',
        }}
      >
        {cells.map((c) => (
          <div key={c.label} className="m3-kpi-cell">
            <dt className="m3-kpi-label">{c.label}</dt>
            <dd className="m3-kpi-value" style={{ margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
              {c.value}
            </dd>
          </div>
        ))}
      </dl>

      {hidden ? (
        <div
          role="note"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
            padding: 12,
          }}
        >
          <span className="mso" aria-hidden style={{ fontSize: 28, color: 'var(--md-sys-color-on-surface-variant)' }}>
            lock
          </span>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}>
            클래식 스탯은 숨겨져 있습니다
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
            헤더의 "클래식" 토글을 켜면 세이버와 비교할 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

interface Cell {
  label: string;
  value: string;
}

function buildBatterCells(s: Record<string, unknown>): Cell[] {
  return [
    { label: 'AVG', value: fmt(s.avg, 3) },
    { label: 'OPS', value: fmt(s.ops, 3) },
    { label: 'HR', value: fmtInt(s.hr) },
    { label: 'RBI', value: fmtInt(s.rbi) },
    { label: 'SB', value: fmtInt(s.sb) },
  ];
}

function buildPitcherCells(s: Record<string, unknown>): Cell[] {
  return [
    { label: 'ERA', value: fmt(s.era, 2) },
    { label: 'W-L', value: `${fmtInt(s.w)}-${fmtInt(s.l)}` },
    { label: 'WHIP', value: fmt(s.whip, 2) },
    { label: 'K/9', value: fmt(s.k9, 1) },
    { label: 'BB/9', value: fmt(s.bb9, 1) },
  ];
}

function fmt(v: unknown, decimals: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toFixed(decimals);
}

function fmtInt(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}
