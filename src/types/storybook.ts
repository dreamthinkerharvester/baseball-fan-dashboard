// Design Ref: kia-player-storybook.design.md §1 — Storybook domain types.

import type { Player } from './player';

export interface BatterTodayStat {
  date: string;
  ab: number;
  h: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  avg: number;
  ops: number;
}

export interface PitcherTodayStat {
  date: string;
  ip: number;
  er: number;
  k: number;
  bb: number;
  h: number;
  era: number;
  whip: number;
}

export type TodayStat = BatterTodayStat | PitcherTodayStat;

export interface SeasonTrend {
  before: number;
  after: number;
  metric: 'AVG' | 'ERA';
}

export interface TodayPerformance {
  played: boolean;
  date: string;
  vs: { teamCode: string; teamName: string } | null;
  batter?: BatterTodayStat;
  pitcher?: PitcherTodayStat;
  seasonTrend?: SeasonTrend;
  fallbackRecent5?: TodayStat[];
}

export interface SeasonRecord {
  year: number;
  war?: number;
  ops?: number;
  avg?: number;
  era?: number;
  fip?: number;
  hr?: number;
  sb?: number;
  rbi?: number;
  k?: number;
  ip?: number;
  ab?: number;
  rankInLeague?: { metric: string; rank: number };
}

export interface PrimeHighlight {
  kpi: string;
  value: string;
}

export interface PrimeSeason {
  year: number;
  metric: 'WAR' | 'ERA' | 'OPS';
  value: number;
  rookieFlag: boolean;
  highlights: PrimeHighlight[];
  rank?: { metric: string; rankInLeague: number };
}

export interface NewsClip {
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface NarrativeEvent {
  year: number;
  text: string;
  source: 'namu' | 'kbo' | 'user' | 'naver';
  sourceUrl?: string;
}

export interface ImageSlot {
  index: 1 | 2 | 3;
  placeholder: string;
  suggestedSection: 'today' | 'prime' | 'narrative';
}

export interface StorybookDraft {
  markdown: string;
  charCount: number;
  imageSlots: ImageSlot[];
}

export type StorybookPlayer = Pick<
  Player,
  'id' | 'name' | 'teamCode' | 'position' | 'isPitcher'
>;

export interface Storybook {
  player: StorybookPlayer;
  generatedAt: string;
  today: TodayPerformance;
  prime: PrimeSeason | null;
  news: NewsClip[];
  narrative: NarrativeEvent[];
  draft: StorybookDraft;
  imagePool: string[];
  errors?: string[];
}
