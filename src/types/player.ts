// Design Ref: §3.1 — Player entity + Position + Grade.

import type { TeamCode } from './team';

export type Position =
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH';

export type Grade = 'elite' | 'rare' | 'special' | 'normal';

export interface Player {
  id: string;
  name: string;
  teamCode: TeamCode;
  position: Position;
  uniformNumber?: number;
  photoUrl?: string;
  isPitcher: boolean;
}
