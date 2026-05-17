// Design Ref: §4 — Lineup detail.
// 우선순위: 오늘 confirmed → 최근 N일 빈도 합성 (frequency) → 단일 fallback → NO_GAME

import { loadGames, loadLineup } from '@/lib/data/cache';
import { todayKstString } from '@/lib/date';
import { err, ok } from '@/types';

import type {
  ApiResponse,
  FrequencyBackup,
  Lineup,
  LineupSlot,
  PitcherPoolEntry,
  TeamCode,
} from '@/types';

const FREQ_WINDOW_DAYS = 7;
const FREQ_MIN_SAMPLES = 2; // 최소 2일치 라인업이 있어야 빈도 합성

export interface LineupQuery {
  team: TeamCode;
  date?: string;
}

export async function getLineup(query: LineupQuery): Promise<ApiResponse<Lineup>> {
  const date = query.date ?? todayKstString();

  // Step 1: 오늘 라인업 캐시 — confirmed면 그대로 반환 (가장 정확)
  const today = await loadLineup(date, query.team);
  if (today && today.data.status === 'confirmed' && today.data.battingOrder.length > 0) {
    return ok(today.data, { updatedAt: today.fetchedAt, source: today.data.source });
  }

  // Step 2: 오늘 경기가 있는지 확인 (없으면 frequency만)
  const games = await loadGames(date);
  const teamHasGame = games?.data.some(
    (g) => g.homeTeam === query.team || g.awayTeam === query.team,
  ) ?? false;

  // Step 3: 최근 N일 빈도 합성 시도 (사용자 요청 — 최근 일주일 많이 나온 빈도)
  const frequency = await getLineupFrequency(query.team, date, FREQ_WINDOW_DAYS);
  if (frequency.data) return frequency;

  // Step 4: 단일 fallback (가장 최근 confirmed 1일)
  const fallback = await getLineupFallback(query.team, date);
  if (fallback.data) return fallback;

  // Step 5: 경기 있는데 라인업 0 → pending
  if (teamHasGame) {
    const pending: Lineup = {
      gameId: '',
      teamCode: query.team,
      startingPitcher: null,
      battingOrder: [],
      status: 'pending',
      fetchedAt: new Date().toISOString(),
      source: 'cache',
    };
    return ok(pending, { source: 'cache' });
  }

  return err('NO_GAME', '최근 라인업 데이터가 없습니다.');
}

/**
 * 최근 windowDays 일 라인업을 모아 타순별(1~9)·선발투수별 최빈 선수를 추출해 합성.
 * 데이터가 FREQ_MIN_SAMPLES 미만이면 null 반환 → 호출자는 단일 fallback으로 진행.
 */
async function getLineupFrequency(
  team: TeamCode,
  todayIso: string,
  windowDays: number,
): Promise<ApiResponse<Lineup>> {
  const today = new Date(todayIso);
  const collected: Array<{ date: string; lineup: Lineup }> = [];

  for (let d = 1; d <= windowDays; d++) {
    const past = new Date(today);
    past.setDate(past.getDate() - d);
    const iso = past.toISOString().slice(0, 10);
    const cached = await loadLineup(iso, team);
    if (
      cached &&
      cached.data.status === 'confirmed' &&
      cached.data.battingOrder.length > 0
    ) {
      collected.push({ date: iso, lineup: cached.data });
    }
  }

  if (collected.length < FREQ_MIN_SAMPLES) {
    return err('NO_GAME', '빈도 분석에 충분한 라인업이 없습니다.');
  }

  // 타순별 (1~9) 빈출 선수 추출 + 자리별 백업.
  const battingOrder: LineupSlot[] = [];
  const backups: FrequencyBackup[] = [];
  const starterPlayerIds = new Set<string>();

  for (let order = 1; order <= 9; order++) {
    const candidates = collected
      .map((c) => ({
        slot: c.lineup.battingOrder.find((s) => s.battingOrder === order),
        date: c.date,
      }))
      .filter((x): x is { slot: LineupSlot; date: string } => Boolean(x.slot));

    const ranked = rankByFrequency(candidates);
    if (ranked.length === 0) continue;

    const top = ranked[0];
    if (!top) continue;
    const starterSlot: LineupSlot = { ...top.slot, battingOrder: order };
    battingOrder.push(starterSlot);
    starterPlayerIds.add(top.slot.playerId);

    // 같은 자리(taysun)의 2~N순위 → 백업
    for (let i = 1; i < ranked.length; i++) {
      const r = ranked[i];
      if (!r) continue;
      backups.push({
        ...r.slot,
        battingOrder: order,
        freq: { appearances: r.count, lastAppearance: r.lastDate },
      });
    }
  }

  // 선발 투수 풀 — 최근 N일 모든 선발투수 등판 기록
  const pitcherCandidates = collected
    .map((c) => ({ slot: c.lineup.startingPitcher, date: c.date }))
    .filter((x): x is { slot: LineupSlot; date: string } => Boolean(x.slot));
  const pitcherRanked = rankByFrequency(pitcherCandidates);
  const pitcherPool: PitcherPoolEntry[] = pitcherRanked.map((p) => ({
    playerId: p.slot.playerId,
    grade: p.slot.grade,
    gradePercentile: p.slot.gradePercentile,
    gradeBasis: p.slot.gradeBasis,
    freq: { appearances: p.count, lastAppearance: p.lastDate },
  }));
  const startingPitcher = pitcherRanked[0]?.slot ?? null;

  if (battingOrder.length === 0) {
    return err('NO_GAME', '빈도 분석 결과 라인업이 비어있습니다.');
  }

  const sample = collected[0];
  if (!sample) {
    return err('NO_GAME', '빈도 분석 결과 라인업이 비어있습니다.');
  }
  const synth: Lineup = {
    gameId: '',
    teamCode: team,
    startingPitcher: startingPitcher ? { ...startingPitcher, battingOrder: 0 } : null,
    battingOrder,
    status: 'frequency',
    fetchedAt: new Date().toISOString(),
    source: sample.lineup.source,
    frequencyWindowDays: windowDays,
    frequencySourceDates: collected.map((c) => c.date),
    backups,
    pitcherPool,
  };

  return ok(synth, { source: 'cache' });
}

/**
 * (slot, date) 후보 배열을 playerId 빈도 내림차순으로 정렬.
 * 동률 시 더 최근 날짜 우선. 반환: count + lastDate 포함.
 */
function rankByFrequency(
  candidates: ReadonlyArray<{ slot: LineupSlot; date: string }>,
): Array<{ slot: LineupSlot; count: number; lastDate: string }> {
  const map = new Map<
    string,
    { slot: LineupSlot; count: number; lastDate: string }
  >();
  for (const c of candidates) {
    const existing = map.get(c.slot.playerId);
    if (existing) {
      existing.count += 1;
      // collected가 가장 최근부터라 c.date가 더 클 수 있음 → 비교
      if (c.date > existing.lastDate) existing.lastDate = c.date;
    } else {
      map.set(c.slot.playerId, { slot: c.slot, count: 1, lastDate: c.date });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastDate.localeCompare(a.lastDate); // 더 최근 우선
  });
}

/** 최근 windowDays 일 이내 가장 최신 confirmed 라인업 (단일). */
async function getLineupFallback(team: TeamCode, todayIso: string): Promise<ApiResponse<Lineup>> {
  const today = new Date(todayIso);
  for (let d = 1; d <= FREQ_WINDOW_DAYS; d++) {
    const past = new Date(today);
    past.setDate(past.getDate() - d);
    const iso = past.toISOString().slice(0, 10);
    const cached = await loadLineup(iso, team);
    if (cached && cached.data.status === 'confirmed' && cached.data.battingOrder.length > 0) {
      const fallback: Lineup = {
        ...cached.data,
        status: 'fallback',
        fallbackDate: iso,
      };
      return ok(fallback, { source: 'cache' });
    }
  }
  return err('NO_GAME', '최근 라인업 데이터가 없습니다.');
}
