// Design Ref: §3.1 — Team entity. KBO 10팀 고정 코드.

export type TeamCode =
  | 'LG'
  | 'KT'
  | 'SSG'
  | 'NC'
  | 'KIA'
  | 'DOOSAN'
  | 'LOTTE'
  | 'SAMSUNG'
  | 'HANWHA'
  | 'KIWOOM';

export interface Team {
  code: TeamCode;
  name: string;
  shortName: string;
  primaryColor: string; // hex
  logoUrl?: string;
}
