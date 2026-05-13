// Design Ref: §3.1 — Game entity.

import type { TeamCode } from './team';

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'final'
  | 'cancelled'
  | 'postponed';

export interface Game {
  id: string;
  date: string; // YYYY-MM-DD (KST)
  startTime: string; // HH:MM (KST)
  homeTeam: TeamCode;
  awayTeam: TeamCode;
  stadium: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  doubleHeader?: 1 | 2;
  cancelReason?: string;
}

export interface StandingsRow {
  rank: number;
  teamCode: TeamCode;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  winPct: number;
  gamesBehind: number;
  streak?: string; // "W3" | "L2"
}
