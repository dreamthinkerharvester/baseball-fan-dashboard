#!/usr/bin/env node
// Fetch career seasons + recent games per player from Naver playerend-record API.
// Run AFTER naver-fetch-lineup.mjs (which populates the player roster).
// Usage: node scripts/crawler/naver-fetch-player-stats.mjs [teamCode=KIA]

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const TEAM_CODE = process.argv[2] ?? 'KIA';
const RECORD_API = (code) => `https://api-gw.sports.naver.com/players/kbo/${code}/playerend-record`;
const RECORD_FALLBACK = (code) => `https://api-gw.sports.naver.com/players/kbo/${code}/record`;

const players = JSON.parse(await readFile('data/players.json', 'utf8'));
const target = players.filter((p) => p.teamCode === TEAM_CODE);
console.log(`[naver-fetch-stats] ${TEAM_CODE} target: ${target.length} players`);

function parseInning(innStr, inn2) {
  if (typeof innStr === 'string') {
    const m = innStr.match(/^(\d+)(?:\s+(\d+)\/(\d+))?$/);
    if (m) {
      const whole = Number(m[1]);
      const frac = m[2] ? Number(m[2]) / Number(m[3]) : 0;
      return Number((whole + frac).toFixed(1));
    }
    const n = Number(innStr);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof inn2 === 'number') return Number((inn2 / 3).toFixed(1));
  return 0;
}

function n(v) {
  if (v == null) return 0;
  const x = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(x) ? x : 0;
}

function gradeFromWrcPlus(wrcPlus) {
  // wrcPlus-based grade (hitters) — KBO 평균=100
  if (wrcPlus >= 140) return { grade: 'elite', percentile: Math.min(99, 80 + Math.round((wrcPlus - 140) / 2)) };
  if (wrcPlus >= 110) return { grade: 'rare', percentile: 60 + Math.round((wrcPlus - 110) * 2 / 3) };
  if (wrcPlus >= 90) return { grade: 'special', percentile: 40 + Math.round((wrcPlus - 90) / 2) };
  return { grade: 'normal', percentile: Math.max(5, Math.round(wrcPlus / 2.5)) };
}

function gradeFromFip(era, ip) {
  // pitcher grade by ERA (proxy for FIP)
  if (!ip || ip < 5) return { grade: 'normal', percentile: 30 };
  if (era <= 2.5) return { grade: 'elite', percentile: 90 };
  if (era <= 3.5) return { grade: 'rare', percentile: 72 };
  if (era <= 4.5) return { grade: 'special', percentile: 52 };
  return { grade: 'normal', percentile: 30 };
}

let ok = 0, fail = 0;
for (const p of target) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Referer': `https://m.sports.naver.com/player/index?playerId=${p.id}&category=kbo`,
      'Accept': 'application/json',
    };
    let resp = await fetch(RECORD_API(p.id), { headers });
    let usedFallback = false;
    if (!resp.ok) {
      // Try /record fallback (rookies don't have playerend-record)
      const fb = await fetch(RECORD_FALLBACK(p.id), { headers });
      if (!fb.ok) {
        console.log(`  ✗ ${p.id} ${p.name} HTTP ${resp.status} (fallback ${fb.status})`);
        fail++;
        continue;
      }
      resp = fb;
      usedFallback = true;
    }
    const json = await resp.json();
    const r = json?.result;
    if (!r) {
      console.log(`  ✗ ${p.id} ${p.name} no result`);
      fail++;
      continue;
    }

    // Branch by response shape
    if (usedFallback) {
      // /record returns current season only (no career, no game-by-game)
      const isPitcher = r.isPitcher === true;
      const cur = isPitcher
        ? {
            playerId: p.id, season: 2026, year: 2026,
            games: 0, ip: parseInning(r.inn, undefined),
            era: n(r.era), fip: n(r.era), whip: 0,
            k: n(r.kk), bb: 0, hr: 0,
            w: n(r.win), l: n(r.lose), sv: 0, hold: 0, war: 0,
            k9: 0, bb9: 0,
            updatedAt: new Date().toISOString(),
          }
        : {
            playerId: p.id, season: 2026, year: 2026,
            games: 0, ab: 0, hits: n(r.hit),
            hr: n(r.hr), rbi: n(r.rbi), sb: 0, run: 0,
            avg: n(r.hra), obp: 0, slg: 0, ops: 0,
            wrcPlus: 100,
            war: 0,
            updatedAt: new Date().toISOString(),
          };
      const gradeObj = isPitcher
        ? gradeFromFip(n(r.era), parseInning(r.inn, undefined))
        : gradeFromWrcPlus(100);
      const detail = {
        player: { id: p.id, name: p.name, teamCode: TEAM_CODE, position: p.position, uniformNumber: p.uniformNumber, isPitcher, photoUrl: p.photoUrl },
        currentSeason: cur,
        careerSeasons: [],
        recentTen: [],
        currentGrade: { ...gradeObj, basis: isPitcher ? `2026 ERA ${r.era}` : `2026 타율 ${r.hra}` },
      };
      await writeFile(`data/players/${p.id}.json`, JSON.stringify(detail, null, 2) + '\n');
      console.log(`  ⚠ ${p.id} ${p.name} — fallback (current season only) [${gradeObj.grade}/${gradeObj.percentile}%]`);
      ok++;
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    const isPitcher = r.playerType === 'pitcher';
    const basic = JSON.parse(r.basicRecord ?? '{}').basic ?? {};
    const rec = JSON.parse(r.record ?? '{}');
    const seasonsRaw = (rec.season ?? []).filter((s) => s.gyear !== '통산');
    const gamesRaw = rec.game ?? [];

    // Build careerSeasons in our format
    const careerSeasons = seasonsRaw.map((s) => {
      const year = Number(s.gyear);
      if (isPitcher) {
        return {
          playerId: p.id, season: year, year,
          games: n(s.gamenum), ip: parseInning(s.inn, s.inn2),
          era: n(s.era), fip: n(s.era), whip: n(s.whip),
          k: n(s.kk), bb: n(s.bb), hr: n(s.hr),
          w: n(s.w), l: n(s.l), sv: n(s.sv), hold: n(s.hold),
          war: n(s.war),
          k9: n(s.k9), bb9: n(s.bb9),
          updatedAt: `${year}-10-30T20:00:00+09:00`,
        };
      }
      return {
        playerId: p.id, season: year, year,
        games: n(s.gamenum), ab: n(s.ab), hits: n(s.hit),
        hr: n(s.hr), rbi: n(s.rbi), sb: n(s.sb), run: n(s.run),
        avg: n(s.hra), obp: n(s.obp), slg: n(s.slg), ops: n(s.ops),
        wrcPlus: n(s.wrcPlus),
        war: n(s.war),
        updatedAt: `${year}-10-30T20:00:00+09:00`,
      };
    });

    // Recent games (max 10)
    const recentTen = gamesRaw.slice(0, 10).map((g) => {
      const date = `${g.gday.slice(0, 4)}-${g.gday.slice(4, 6)}-${g.gday.slice(6, 8)}`;
      if (isPitcher) {
        return {
          playerId: p.id, date,
          ip: parseInning(g.inn, undefined),
          er: n(g.er), k: n(g.kk), bb: n(g.bb), h: n(g.hit),
          era: n(g.era), whip: n(g.whip),
          opponent: g.opponent ?? null,
        };
      }
      return {
        playerId: p.id, date,
        ab: n(g.ab), hits: n(g.hit), hr: n(g.hr),
        rbi: n(g.rbi), bb: n(g.bb), so: n(g.kk),
        ops: 0, // not provided per-game by Naver
        wrcPlus: 0,
        opponent: g.opponent ?? null,
      };
    });

    // Current season — derive from latest non-통산 entry
    const cur2026 = careerSeasons.find((s) => s.year === 2026) ?? careerSeasons[0] ?? null;
    const currentSeason = cur2026 ? { ...cur2026, season: 2026, updatedAt: new Date().toISOString() } : null;

    // Grade — recompute from real stats
    let gradeObj;
    if (isPitcher) {
      gradeObj = gradeFromFip(n(basic.era), parseInning(basic.inn, basic.inn2));
    } else {
      gradeObj = gradeFromWrcPlus(currentSeason ? currentSeason.wrcPlus : 100);
    }

    const detail = {
      player: {
        id: p.id, name: p.name, teamCode: TEAM_CODE,
        position: p.position, uniformNumber: p.uniformNumber, isPitcher,
        photoUrl: p.photoUrl,
      },
      currentSeason,
      careerSeasons,
      recentTen,
      currentGrade: {
        grade: gradeObj.grade, percentile: gradeObj.percentile,
        basis: isPitcher
          ? `2026 ERA ${basic.era ?? '?'} (${parseInning(basic.inn, basic.inn2)}이닝)`
          : `2026 wRC+ ${currentSeason?.wrcPlus ?? '?'}`,
      },
    };

    await writeFile(`data/players/${p.id}.json`, JSON.stringify(detail, null, 2) + '\n');
    const tag = isPitcher
      ? `${detail.currentSeason?.w ?? 0}W ${detail.currentSeason?.l ?? 0}L ERA ${detail.currentSeason?.era ?? '?'}`
      : `${detail.currentSeason?.avg ?? '?'} ${detail.currentSeason?.hr ?? 0}HR wRC+${detail.currentSeason?.wrcPlus ?? '?'}`;
    console.log(`  ✓ ${p.id} ${p.name} — ${careerSeasons.length}시즌, ${recentTen.length}경기, ${tag} [${gradeObj.grade}/${gradeObj.percentile}%]`);
    ok++;
    await new Promise((r) => setTimeout(r, 120)); // be nice
  } catch (e) {
    console.log(`  ✗ ${p.id} ${p.name} ${e.message}`);
    fail++;
  }
}

console.log(`\n[naver-fetch-stats] ✅ ${ok} ok / ${fail} fail`);
