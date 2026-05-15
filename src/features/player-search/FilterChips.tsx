// Phase 1.5 — Team & position filter chips.

'use client';

import clsx from 'clsx';

import { TEAM_CODES, TEAMS } from '@/lib/constants';

import type { Position, SearchFilters } from '@/types';

const POSITIONS: readonly Position[] = [
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'DH',
];

export interface FilterChipsProps {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  className?: string;
}

export function FilterChips({ filters, onChange, className }: FilterChipsProps) {
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <ChipRow label="팀">
        <Chip
          active={filters.team === null}
          onClick={() => onChange({ ...filters, team: null })}
        >
          전체
        </Chip>
        {TEAM_CODES.map((code) => (
          <Chip
            key={code}
            active={filters.team === code}
            color={TEAMS[code].primaryColor}
            onClick={() => onChange({ ...filters, team: code })}
          >
            {TEAMS[code].shortName}
          </Chip>
        ))}
      </ChipRow>

      <ChipRow label="포지션">
        <Chip
          active={filters.position === null}
          onClick={() => onChange({ ...filters, position: null })}
        >
          전체
        </Chip>
        {POSITIONS.map((p) => (
          <Chip
            key={p}
            active={filters.position === p}
            onClick={() => onChange({ ...filters, position: p })}
          >
            {p}
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  /** active일 때 사용할 강조 색. 미지정 시 primary-container. */
  color?: string;
  children: React.ReactNode;
}

function Chip({ active, onClick, color, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx('m3-chip', !active && 'm3-chip-outline')}
      style={
        active
          ? {
              backgroundColor: color ?? 'var(--md-sys-color-primary-container)',
              color: color ? '#fff' : 'var(--md-sys-color-on-primary-container)',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }
          : { cursor: 'pointer' }
      }
    >
      {children}
    </button>
  );
}

