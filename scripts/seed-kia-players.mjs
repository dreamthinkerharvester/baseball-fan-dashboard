#!/usr/bin/env node
// Seed: 14 KIA player detail JSONs with realistic but mock data.
// Run once: node scripts/seed-kia-players.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = 'data/players';

// [id, name, position, isPitcher, grade, percentile, currentSeason, careerYears, recent10Profile]
const KIA = [
  { id: '78530', name: '나성범', pos: 'RF', isP: false,
    season: { games: 35, ab: 132, hits: 42, hr: 8, rbi: 26, avg: 0.318, obp: 0.395, slg: 0.553, ops: 0.948, wrcPlus: 154 },
    career: [
      { season: 2025, games: 138, ab: 510, hits: 158, hr: 23, rbi: 84, avg: 0.310, obp: 0.380, slg: 0.510, ops: 0.890, wrcPlus: 138 },
      { season: 2024, games: 132, ab: 480, hits: 152, hr: 25, rbi: 91, avg: 0.317, obp: 0.395, slg: 0.529, ops: 0.924, wrcPlus: 145 },
    ],
    grade: 'elite', pct: 89 },

  { id: '78531', name: '최형우', pos: 'DH', isP: false,
    season: { games: 36, ab: 128, hits: 41, hr: 7, rbi: 31, avg: 0.320, obp: 0.412, slg: 0.547, ops: 0.959, wrcPlus: 162 },
    career: [
      { season: 2025, games: 134, ab: 470, hits: 142, hr: 18, rbi: 82, avg: 0.302, obp: 0.398, slg: 0.491, ops: 0.889, wrcPlus: 139 },
      { season: 2024, games: 130, ab: 460, hits: 148, hr: 22, rbi: 89, avg: 0.322, obp: 0.418, slg: 0.539, ops: 0.957, wrcPlus: 157 },
    ],
    grade: 'rare', pct: 72 },

  { id: '78532', name: '김선빈', pos: '2B', isP: false,
    season: { games: 33, ab: 115, hits: 32, hr: 1, rbi: 14, avg: 0.278, obp: 0.342, slg: 0.348, ops: 0.690, wrcPlus: 98 },
    career: [
      { season: 2025, games: 128, ab: 450, hits: 134, hr: 3, rbi: 48, avg: 0.298, obp: 0.358, slg: 0.378, ops: 0.736, wrcPlus: 107 },
    ],
    grade: 'normal', pct: 38 },

  { id: '78533', name: '박찬호', pos: 'SS', isP: false,
    season: { games: 35, ab: 134, hits: 40, hr: 2, rbi: 18, avg: 0.299, obp: 0.371, slg: 0.418, ops: 0.789, wrcPlus: 121 },
    career: [
      { season: 2025, games: 136, ab: 488, hits: 144, hr: 5, rbi: 52, avg: 0.295, obp: 0.362, slg: 0.395, ops: 0.757, wrcPlus: 112 },
    ],
    grade: 'rare', pct: 74 },

  { id: '78534', name: '김태군', pos: 'C', isP: false,
    season: { games: 28, ab: 92, hits: 23, hr: 1, rbi: 10, avg: 0.250, obp: 0.318, slg: 0.337, ops: 0.655, wrcPlus: 88 },
    career: [
      { season: 2025, games: 110, ab: 360, hits: 92, hr: 4, rbi: 38, avg: 0.256, obp: 0.321, slg: 0.342, ops: 0.663, wrcPlus: 89 },
    ],
    grade: 'normal', pct: 33 },

  { id: '78535', name: '이우성', pos: '1B', isP: false,
    season: { games: 32, ab: 118, hits: 32, hr: 4, rbi: 19, avg: 0.271, obp: 0.342, slg: 0.432, ops: 0.774, wrcPlus: 116 },
    career: [
      { season: 2025, games: 124, ab: 442, hits: 122, hr: 11, rbi: 58, avg: 0.276, obp: 0.345, slg: 0.421, ops: 0.766, wrcPlus: 114 },
    ],
    grade: 'special', pct: 51 },

  { id: '78536', name: '소크라테스', pos: 'CF', isP: false,
    season: { games: 36, ab: 138, hits: 42, hr: 6, rbi: 24, avg: 0.304, obp: 0.371, slg: 0.493, ops: 0.864, wrcPlus: 138 },
    career: [
      { season: 2025, games: 142, ab: 540, hits: 162, hr: 19, rbi: 78, avg: 0.300, obp: 0.358, slg: 0.483, ops: 0.841, wrcPlus: 131 },
      { season: 2024, games: 140, ab: 530, hits: 168, hr: 21, rbi: 89, avg: 0.317, obp: 0.378, slg: 0.519, ops: 0.897, wrcPlus: 144 },
    ],
    grade: 'special', pct: 58 },

  { id: '78537', name: '최원준', pos: 'LF', isP: false,
    season: { games: 30, ab: 108, hits: 28, hr: 2, rbi: 12, avg: 0.259, obp: 0.328, slg: 0.398, ops: 0.726, wrcPlus: 104 },
    career: [
      { season: 2025, games: 118, ab: 408, hits: 108, hr: 7, rbi: 41, avg: 0.265, obp: 0.331, slg: 0.392, ops: 0.723, wrcPlus: 103 },
    ],
    grade: 'special', pct: 47 },

  // Pitchers
  { id: '78538', name: '양현종', pos: 'P', isP: true,
    season: { games: 8, ip: 51.0, era: 2.65, fip: 2.91, whip: 1.08, k: 48, bb: 14, hr: 4, k9: 8.47, bb9: 2.47 },
    career: [
      { season: 2025, games: 28, ip: 178.1, era: 2.95, fip: 3.15, whip: 1.18, k: 170, bb: 41, hr: 16, k9: 8.58, bb9: 2.07 },
      { season: 2024, games: 30, ip: 192.0, era: 2.78, fip: 3.02, whip: 1.12, k: 188, bb: 38, hr: 14, k9: 8.81, bb9: 1.78 },
    ],
    grade: 'elite', pct: 91 },

  { id: '78539', name: '이의리', pos: 'P', isP: true,
    season: { games: 7, ip: 38.2, era: 3.42, fip: 3.61, whip: 1.28, k: 38, bb: 18, hr: 3, k9: 8.84, bb9: 4.19 },
    career: [
      { season: 2025, games: 24, ip: 132.0, era: 3.55, fip: 3.78, whip: 1.32, k: 128, bb: 58, hr: 12, k9: 8.73, bb9: 3.95 },
    ],
    grade: 'rare', pct: 68 },

  { id: '78540', name: '임기영', pos: 'P', isP: true,
    season: { games: 7, ip: 41.1, era: 3.78, fip: 3.95, whip: 1.31, k: 32, bb: 13, hr: 5, k9: 6.97, bb9: 2.83 },
    career: [
      { season: 2025, games: 25, ip: 145.0, era: 3.85, fip: 4.01, whip: 1.34, k: 108, bb: 41, hr: 18, k9: 6.70, bb9: 2.54 },
    ],
    grade: 'special', pct: 52 },

  { id: '78541', name: '윤영철', pos: 'P', isP: true,
    season: { games: 6, ip: 32.0, era: 4.50, fip: 4.32, whip: 1.41, k: 26, bb: 14, hr: 5, k9: 7.31, bb9: 3.94 },
    career: [
      { season: 2025, games: 20, ip: 105.0, era: 4.31, fip: 4.18, whip: 1.38, k: 88, bb: 41, hr: 14, k9: 7.54, bb9: 3.51 },
    ],
    grade: 'normal', pct: 35 },

  { id: '78542', name: '정해영', pos: 'P', isP: true,
    season: { games: 18, ip: 18.2, era: 1.93, fip: 2.45, whip: 0.96, k: 22, bb: 5, hr: 1, k9: 10.61, bb9: 2.41 },
    career: [
      { season: 2025, games: 58, ip: 58.1, era: 2.31, fip: 2.61, whip: 1.04, k: 68, bb: 18, hr: 4, k9: 10.49, bb9: 2.78 },
    ],
    grade: 'elite', pct: 88 },

  { id: '78543', name: '전상현', pos: 'P', isP: true,
    season: { games: 16, ip: 16.0, era: 3.38, fip: 3.55, whip: 1.19, k: 18, bb: 7, hr: 1, k9: 10.13, bb9: 3.94 },
    career: [
      { season: 2025, games: 52, ip: 52.0, era: 3.46, fip: 3.71, whip: 1.21, k: 56, bb: 22, hr: 4, k9: 9.69, bb9: 3.81 },
    ],
    grade: 'rare', pct: 71 },
];

function gen10Batter(seed, mean) {
  const rng = mulberry32(seed);
  const records = [];
  const today = new Date();
  for (let i = 1; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ab = 3 + Math.floor(rng() * 3);
    const hits = Math.min(ab, Math.floor(rng() * 4));
    const hr = rng() < (mean / 1500) ? 1 : 0;
    const rbi = hits + (hr ? 1 : 0) + Math.floor(rng() * 2);
    records.push({
      date: d.toISOString().slice(0, 10),
      ab, hits, hr, rbi,
      ops: Number((0.6 + rng() * 0.6).toFixed(3)),
      wrcPlus: Math.floor(mean - 30 + rng() * 80),
    });
  }
  return records;
}

function gen10Pitcher(seed, eraBase) {
  const rng = mulberry32(seed);
  const records = [];
  const today = new Date();
  for (let i = 1; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 3);
    const ip = (3 + rng() * 4);
    const er = Math.floor(rng() * 4);
    records.push({
      date: d.toISOString().slice(0, 10),
      ip: Number(ip.toFixed(1)),
      er,
      k: Math.floor(rng() * 8),
      era: Number((eraBase * 0.7 + rng() * eraBase * 0.6).toFixed(2)),
      fip: Number((eraBase * 0.8 + rng() * eraBase * 0.5).toFixed(2)),
    });
  }
  return records;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PHOTO_MAP = {
  '78529': '0E0TLuZL', '78530': '0PvyMPV0', '78531': '0qNZjjT6', '78532': '16Eh4Yv6',
  '78533': '24l8k5ND', '78534': '2CYDdnGY', '78535': '9itcnLTs', '78536': 'BHr7Rlam',
  '78537': 'Bo6Lq1Ai', '78538': 'DdFHJzZx', '78539': 'HRXDTotj', '78540': 'JBdXoZRk',
  '78541': 'LA1JoC7U', '78542': 'NPSkXXN0', '78543': 'OI9tILBR',
};

function getPhotoUrl(id) {
  const f = PHOTO_MAP[id];
  return f ? `/assets/baseball/${f}.jpeg` : undefined;
}

await mkdir(OUT_DIR, { recursive: true });

for (const p of KIA) {
  const numericId = Number(p.id);
  const recent = p.isP
    ? gen10Pitcher(numericId, p.season.era)
    : gen10Batter(numericId, p.season.wrcPlus);
  recent.forEach((r) => (r.playerId = p.id));

  const detail = {
    player: {
      id: p.id,
      name: p.name,
      teamCode: 'KIA',
      position: p.pos,
      isPitcher: p.isP,
      photoUrl: getPhotoUrl(p.id),
    },
    currentSeason: { playerId: p.id, season: 2026, ...p.season, updatedAt: '2026-05-14T06:00:00+09:00' },
    careerSeasons: p.career.map((c) => ({ playerId: p.id, ...c, updatedAt: `${c.season}-10-30T20:00:00+09:00` })),
    recentTen: recent,
    currentGrade: { grade: p.grade, percentile: p.pct, basis: `최근 10경기 ${p.isP ? 'FIP' : 'wRC+'} 백분위 ${p.pct}` },
  };

  await writeFile(path.join(OUT_DIR, `${p.id}.json`), JSON.stringify(detail, null, 2) + '\n', 'utf8');
  console.log(`✓ ${p.id} ${p.name}`);
}

console.log(`\n[seed-kia-players] ${KIA.length} files written to ${OUT_DIR}/`);
