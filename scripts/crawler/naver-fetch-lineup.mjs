#!/usr/bin/env node
// Fetch real KBO lineup from Naver Sports preview API + download player photos.
// Produces:
//   data/lineups/{date}/{teamCode}.json  — confirmed lineup with grades
//   data/players.json                     — KIA player master (Naver IDs + photoUrl)
//   data/players/{naverId}.json           — per-player detail (mock stats)
//   public/assets/players/{naverId}.png   — player photos
//
// Usage:
//   node scripts/crawler/naver-fetch-lineup.mjs <gameId>
//   default: 20260514OBHT02026 (KIA 5/14 game)

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const gameId = process.argv[2] ?? '20260514OBHT02026';
const date = `${gameId.slice(0, 4)}-${gameId.slice(4, 6)}-${gameId.slice(6, 8)}`;
// gameId format: YYYYMMDD + AA + HH (away+home team codes 2-letter naver) + 02026
const awayCode = gameId.slice(8, 10);  // OB
const homeCode = gameId.slice(10, 12); // HT

// Naver KBO team code → our internal TeamCode
const TEAM_MAP = {
  HT: 'KIA',
  OB: 'DOOSAN',
  HH: 'HANWHA',
  WO: 'KIWOOM',
  NC: 'NC',
  LT: 'LOTTE',
  SK: 'SSG',
  KT: 'KT',
  SS: 'SAMSUNG',
  LG: 'LG',
};

// Naver position number → our Position
const POS_MAP = {
  '1': 'P', '2': 'C', '3': '1B', '4': '2B', '5': '3B', '6': 'SS',
  '7': 'LF', '8': 'CF', '9': 'RF', '0': 'DH',
};

const PHOTO_BASE = 'https://sports-phinf.pstatic.net/player/kbo/default';
const API = `https://api-gw.sports.naver.com/schedule/games/${gameId}/preview`;

console.log(`[naver-fetch-lineup] gameId=${gameId} date=${date}`);
console.log(`  away=${awayCode}(${TEAM_MAP[awayCode] ?? '?'}) home=${homeCode}(${TEAM_MAP[homeCode] ?? '?'})`);

const resp = await fetch(API, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Referer': `https://m.sports.naver.com/game/${gameId}/lineup`,
    'Accept': 'application/json',
  },
});
if (!resp.ok) {
  console.error(`[naver-fetch-lineup] API failed: ${resp.status}`);
  process.exit(1);
}
const json = await resp.json();
const pv = json?.result?.previewData;
if (!pv) {
  console.error('[naver-fetch-lineup] previewData missing in response');
  process.exit(1);
}

const homeTeamCode = TEAM_MAP[homeCode];
const awayTeamCode = TEAM_MAP[awayCode];
if (!homeTeamCode || !awayTeamCode) {
  console.error(`[naver-fetch-lineup] unknown team code: ${homeCode}/${awayCode}`);
  process.exit(1);
}

// Helper: deterministic grade based on backnum (placeholder until real stats integration)
function makeGrade(seed) {
  const rng = mulberry(seed);
  const pct = 25 + Math.floor(rng() * 70);
  let grade = 'normal';
  if (pct >= 85) grade = 'elite';
  else if (pct >= 65) grade = 'rare';
  else if (pct >= 45) grade = 'special';
  return { grade, percentile: pct };
}
function mulberry(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lineupToOurFormat(teamLineup, teamCode) {
  const fl = teamLineup?.fullLineUp ?? [];
  const starter = fl.find((p) => p.positionName === '선발투수');
  const batters = fl
    .filter((p) => p.positionName !== '선발투수' && typeof p.batorder === 'number')
    .sort((a, b) => a.batorder - b.batorder);

  return {
    starter,
    batters,
    bullpen: teamLineup?.pitcherBullpen ?? [],
    candidates: teamLineup?.batterCandidate ?? [],
  };
}

const home = lineupToOurFormat(pv.homeTeamLineUp, homeTeamCode);
const away = lineupToOurFormat(pv.awayTeamLineUp, awayTeamCode);

// Collect ALL unique players from home (KIA — main user) → master roster
const homeAllPlayers = [
  ...(home.starter ? [home.starter] : []),
  ...home.batters,
  ...home.bullpen,
];
// Dedupe by playerCode
const seen = new Set();
const homeUnique = homeAllPlayers.filter((p) => {
  if (!p?.playerCode || seen.has(p.playerCode)) return false;
  seen.add(p.playerCode);
  return true;
});
console.log(`  ${homeTeamCode} unique players: ${homeUnique.length}`);

// Download photos
await mkdir('public/assets/players', { recursive: true });
const photoResults = [];
for (const p of homeUnique) {
  const url = `${PHOTO_BASE}/${p.playerCode}.png`;
  const out = `public/assets/players/${p.playerCode}.png`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(out, buf);
      photoResults.push({ code: p.playerCode, name: p.playerName, ok: true });
    } else {
      photoResults.push({ code: p.playerCode, name: p.playerName, ok: false, status: r.status });
    }
  } catch (e) {
    photoResults.push({ code: p.playerCode, name: p.playerName, ok: false, error: e.message });
  }
}
const okCount = photoResults.filter((r) => r.ok).length;
console.log(`  photos downloaded: ${okCount}/${photoResults.length}`);
photoResults.filter((r) => !r.ok).forEach((r) => console.log(`    ✗ ${r.name} (${r.code}) ${r.status ?? r.error ?? '?'}`));

// Build players.json: keep existing non-KIA, replace KIA entries
let masterPlayers = [];
try {
  masterPlayers = JSON.parse(await readFile('data/players.json', 'utf8'));
} catch {
  masterPlayers = [];
}
const nonKia = masterPlayers.filter((p) => p.teamCode !== homeTeamCode);
const newKia = homeUnique.map((p) => ({
  id: p.playerCode,
  name: p.playerName,
  teamCode: homeTeamCode,
  position: POS_MAP[p.position] ?? POS_MAP[p.pos] ?? 'P',
  uniformNumber: p.backnum ? Number(p.backnum) : undefined,
  isPitcher: p.positionName === '선발투수' || /투수/.test(p.hitType ?? ''),
  photoUrl: photoResults.find((r) => r.code === p.playerCode && r.ok)
    ? `/assets/players/${p.playerCode}.png`
    : undefined,
}));
await writeFile('data/players.json', JSON.stringify([...nonKia, ...newKia], null, 2) + '\n');
console.log(`  data/players.json: ${nonKia.length} (other) + ${newKia.length} (${homeTeamCode}) entries`);

// Build lineup file
const lineupSlots = home.batters.map((p) => {
  const { grade, percentile } = makeGrade(Number(p.playerCode));
  return {
    battingOrder: p.batorder,
    playerId: p.playerCode,
    position: POS_MAP[p.position] ?? 'DH',
    grade,
    gradePercentile: percentile,
    gradeBasis: `최근 폼 백분위 ${percentile}`,
  };
});
const startingPitcher = home.starter
  ? (() => {
      const { grade, percentile } = makeGrade(Number(home.starter.playerCode) + 1);
      return {
        battingOrder: 0,
        playerId: home.starter.playerCode,
        position: 'P',
        grade,
        gradePercentile: percentile,
        gradeBasis: `최근 등판 백분위 ${percentile}`,
      };
    })()
  : null;

const lineup = {
  gameId,
  teamCode: homeTeamCode,
  startingPitcher,
  battingOrder: lineupSlots,
  status: 'confirmed',
  fetchedAt: new Date().toISOString(),
  source: 'naver-preview-api',
};
await mkdir(`data/lineups/${date}`, { recursive: true });
await writeFile(`data/lineups/${date}/${homeTeamCode}.json`, JSON.stringify(lineup, null, 2) + '\n');
console.log(`  data/lineups/${date}/${homeTeamCode}.json: ${lineupSlots.length} batters + ${startingPitcher ? '1' : '0'} pitcher`);

// Generate per-player detail JSON (mock stats — real stats integration is later milestone)
await mkdir('data/players', { recursive: true });
for (const p of homeUnique) {
  const isPitcher = p.positionName === '선발투수' || /투수/.test(p.hitType ?? '');
  const seed = Number(p.playerCode);
  const rng = mulberry(seed);
  const detail = {
    player: {
      id: p.playerCode,
      name: p.playerName,
      teamCode: homeTeamCode,
      position: POS_MAP[p.position] ?? 'DH',
      uniformNumber: p.backnum ? Number(p.backnum) : undefined,
      isPitcher,
      photoUrl: photoResults.find((r) => r.code === p.playerCode && r.ok)
        ? `/assets/players/${p.playerCode}.png`
        : undefined,
    },
    currentSeason: isPitcher
      ? {
          playerId: p.playerCode, season: 2026,
          games: 5 + Math.floor(rng() * 10),
          ip: Number((20 + rng() * 60).toFixed(1)),
          era: Number((2 + rng() * 3).toFixed(2)),
          fip: Number((2.5 + rng() * 2.5).toFixed(2)),
          whip: Number((1 + rng() * 0.4).toFixed(2)),
          k: Math.floor(20 + rng() * 50),
          bb: Math.floor(5 + rng() * 20),
          k9: Number((6 + rng() * 5).toFixed(2)),
          bb9: Number((1.5 + rng() * 3).toFixed(2)),
          updatedAt: `${date}T06:00:00+09:00`,
        }
      : {
          playerId: p.playerCode, season: 2026,
          games: 25 + Math.floor(rng() * 15),
          ab: 80 + Math.floor(rng() * 80),
          hits: 20 + Math.floor(rng() * 30),
          hr: Math.floor(rng() * 12),
          rbi: Math.floor(10 + rng() * 30),
          avg: Number((0.22 + rng() * 0.13).toFixed(3)),
          obp: Number((0.30 + rng() * 0.12).toFixed(3)),
          slg: Number((0.32 + rng() * 0.30).toFixed(3)),
          ops: Number((0.65 + rng() * 0.40).toFixed(3)),
          wrcPlus: Math.floor(80 + rng() * 100),
          updatedAt: `${date}T06:00:00+09:00`,
        },
    careerSeasons: [],
    recentTen: [],
    currentGrade: (() => {
      const { grade, percentile } = makeGrade(seed);
      return { grade, percentile, basis: `최근 10경기 백분위 ${percentile}` };
    })(),
  };
  await writeFile(`data/players/${p.playerCode}.json`, JSON.stringify(detail, null, 2) + '\n');
}
console.log(`  data/players/{code}.json: ${homeUnique.length} files`);

console.log(`\n[naver-fetch-lineup] ✅ Done. Source: ${API}`);
