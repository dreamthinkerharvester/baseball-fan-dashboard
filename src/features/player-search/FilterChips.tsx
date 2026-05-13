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
    <div className="flex flex-col gap-1">
      <span className="text-caption font-bold uppercase text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  /** active일 때 사용할 강조 색. 미지정 시 grade-elite. */
  color?: string;
  children: React.ReactNode;
}

function Chip({ active, onClick, color, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-8 items-center rounded-button border px-3 text-caption font-semibold transition',
        active
          ? 'text-text-primary'
          : 'border-text-dim/30 text-text-muted hover:border-text-dim/60',
      )}
      style={
        active
          ? {
              backgroundColor: color ?? '#7B2FBE',
              borderColor: color ?? '#7B2FBE',
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

