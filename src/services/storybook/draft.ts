// Storybook M7: Blog Draft Builder — Design Ref §3.
// Pure function. No I/O.

import type {
  BatterTodayStat,
  ImageSlot,
  NarrativeEvent,
  NewsClip,
  PitcherTodayStat,
  PrimeSeason,
  StorybookDraft,
  StorybookPlayer,
  TodayPerformance,
} from '@/types';

interface BuildDraftInput {
  player: StorybookPlayer;
  today: TodayPerformance;
  prime: PrimeSeason | null;
  news: NewsClip[];
  narrative: NarrativeEvent[];
}

const SLOT_PLACEHOLDERS = [
  '<!-- IMG_SLOT_1 -->',
  '<!-- IMG_SLOT_2 -->',
  '<!-- IMG_SLOT_3 -->',
] as const;

export function buildDraft(input: BuildDraftInput): StorybookDraft {
  const { player, today, prime, news, narrative } = input;

  const title = `# ${player.name}, ${oneLineHook(today, prime, player.isPitcher)}`;
  const todaySection = renderToday(today, player.isPitcher);
  const primeSection = renderPrime(player.name, prime, news);
  const narrativeSection = renderNarrative(player.name, narrative);
  const outroSection = renderOutro(today, prime);

  const markdown = [
    title,
    '',
    SLOT_PLACEHOLDERS[0],
    '',
    '## 오늘의 경기',
    '',
    todaySection,
    '',
    '---',
    '',
    `## 다시 보는 전성기${prime ? ` — ${prime.year}시즌` : ''}`,
    '',
    SLOT_PLACEHOLDERS[1],
    '',
    primeSection,
    '',
    '---',
    '',
    `## ${player.name}의 길`,
    '',
    SLOT_PLACEHOLDERS[2],
    '',
    narrativeSection,
    '',
    '---',
    '',
    '## 마무리 — 다음 경기 관전 포인트',
    '',
    outroSection,
    '',
    '---',
    '',
    '> *본 글은 데이터 기반 자동 생성 초안입니다. 인용 출처는 본문 링크를 참조하세요.*',
    '',
  ].join('\n');

  const imageSlots: ImageSlot[] = [
    { index: 1, placeholder: SLOT_PLACEHOLDERS[0], suggestedSection: 'today' },
    { index: 2, placeholder: SLOT_PLACEHOLDERS[1], suggestedSection: 'prime' },
    { index: 3, placeholder: SLOT_PLACEHOLDERS[2], suggestedSection: 'narrative' },
  ];

  return {
    markdown,
    charCount: markdown.length,
    imageSlots,
  };
}

export function oneLineHook(
  today: TodayPerformance,
  prime: PrimeSeason | null,
  isPitcher: boolean,
): string {
  if (!today.played) {
    return prime
      ? `${prime.year}년 전성기의 이름이 다시 떠오를 때`
      : '오늘은 결장, 그러나 기록은 남는다';
  }
  if (isPitcher && today.pitcher) {
    const p = today.pitcher;
    if (p.er === 0 && p.ip >= 5) return `${p.ip.toFixed(1)}이닝 무실점 ${p.k}K`;
    if (p.k >= 8) return `${p.k}개의 삼진, 마운드의 주인`;
    return `${p.ip.toFixed(1)}이닝 ${p.er}자책 ${p.k}K`;
  }
  if (!isPitcher && today.batter) {
    const b = today.batter;
    if (b.hr >= 2) return `${b.hr}홈런 ${b.rbi}타점 — 멀티 홈런의 밤`;
    if (b.hr === 1 && b.h >= 3) return `${b.ab}타수 ${b.h}안타 ${b.hr}홈런 — ${monthLabel(today.date)}의 황태자`;
    if (b.h >= 3) return `${b.ab}타수 ${b.h}안타 — 멀티히트 그날`;
    return `${b.ab}타수 ${b.h}안타 ${b.rbi}타점`;
  }
  return '경기 후 한 줄';
}

function monthLabel(date: string): string {
  const m = Number(date.slice(5, 7));
  return Number.isFinite(m) ? `${m}월` : '오늘';
}

function renderToday(today: TodayPerformance, isPitcher: boolean): string {
  if (!today.played) {
    if (!today.fallbackRecent5 || today.fallbackRecent5.length === 0) {
      return `${today.date} 경기에 출장 기록이 없다. 다음 등판/타격 일정을 기다린다.`;
    }
    return `${today.date} 경기에는 결장. 다만 최근 5경기 기록은 여전히 살아있다.\n\n${recent5Summary(today.fallbackRecent5, isPitcher)}`;
  }

  if (isPitcher && today.pitcher) {
    return pitcherStatLine(today.pitcher, today);
  }
  if (!isPitcher && today.batter) {
    return batterStatLine(today.batter, today);
  }
  return `${today.date} 경기 기록 없음.`;
}

function batterStatLine(b: BatterTodayStat, today: TodayPerformance): string {
  const main = `${today.date}. ${b.ab}타수 ${b.h}안타 ${b.hr}홈런 ${b.rbi}타점.`;
  const trend = today.seasonTrend
    ? ` 시즌 ${today.seasonTrend.metric} ${today.seasonTrend.before.toFixed(3)} → ${today.seasonTrend.after.toFixed(3)}.`
    : '';
  let note = '';
  if (b.h >= 2 && b.hr === 0) note = ' 이번 시즌 멀티히트가 누적되고 있다.';
  if (b.hr >= 1) note = ' 한 방의 무게가 점점 단단해진다.';
  return `${main}${trend}${note}`;
}

function pitcherStatLine(p: PitcherTodayStat, today: TodayPerformance): string {
  const main = `${today.date}. ${p.ip.toFixed(1)}이닝 ${p.er}자책 ${p.k}K ${p.bb}볼넷.`;
  const trend = today.seasonTrend
    ? ` 시즌 ${today.seasonTrend.metric} ${today.seasonTrend.before.toFixed(2)} → ${today.seasonTrend.after.toFixed(2)}.`
    : '';
  let note = '';
  if (p.er === 0 && p.ip >= 5) note = ' 흠 잡을 데 없는 경기 운영이다.';
  if (p.k >= 8) note = ' 결정구가 잘 들어가는 날.';
  return `${main}${trend}${note}`;
}

function recent5Summary(
  records: TodayPerformance['fallbackRecent5'],
  isPitcher: boolean,
): string {
  if (!records || records.length === 0) return '';
  if (isPitcher) {
    const list = (records as PitcherTodayStat[])
      .map((r) => `- ${r.date}: ${r.ip.toFixed(1)}이닝 ${r.er}자책 ${r.k}K`)
      .join('\n');
    return list;
  }
  const list = (records as BatterTodayStat[])
    .map((r) => `- ${r.date}: ${r.ab}타수 ${r.h}안타 ${r.hr}홈런 ${r.rbi}타점`)
    .join('\n');
  return list;
}

function renderPrime(
  playerName: string,
  prime: PrimeSeason | null,
  news: NewsClip[],
): string {
  if (!prime) {
    return `${playerName}의 전성기는 아직 데이터로 충분히 잡히지 않는다. 직접 보충 필요.`;
  }

  if (prime.rookieFlag) {
    return [
      `${playerName}은 아직 전성기를 향해 가는 중이다.`,
      `현재까지의 시즌 중 가장 두드러진 해는 ${prime.year}년으로, ${prime.metric} ${formatMetricValue(prime.metric, prime.value)}을 기록했다.`,
      prime.highlights.length > 0
        ? `주목할 만한 기록: ${prime.highlights.map((h) => h.value).join(' · ')}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const intro = `${prime.year}년 ${playerName}은 ${prime.metric} ${formatMetricValue(prime.metric, prime.value)}을 기록하며 본인의 가장 빛났던 시즌을 보냈다.`;
  const highlightLine =
    prime.highlights.length > 0
      ? prime.highlights.map((h) => h.value).join(' · ') + '는 그 해의 상징이다.'
      : '';
  const newsBlock = renderNewsQuotes(news.slice(0, 2));

  return [intro, highlightLine, newsBlock].filter(Boolean).join('\n\n');
}

function formatMetricValue(metric: PrimeSeason['metric'], value: number): string {
  if (metric === 'WAR') return value.toFixed(1);
  if (metric === 'OPS') return value.toFixed(3);
  return value.toFixed(2);
}

function renderNewsQuotes(clips: NewsClip[]): string {
  if (clips.length === 0) return '';
  return clips
    .map((c) => `> ([출처](${c.url})) ${c.publisher} ${c.date} — "${c.title}"`)
    .join('\n>\n');
}

function renderNarrative(playerName: string, events: NarrativeEvent[]): string {
  if (events.length === 0) {
    return `${playerName}의 서사 자료가 충분히 수집되지 않았다. 직접 보충해서 다듬어주세요.`;
  }
  return events.map((e) => `- **${e.year}**: ${e.text}`).join('\n');
}

function renderOutro(today: TodayPerformance, prime: PrimeSeason | null): string {
  const lines: string[] = [];
  if (today.played) {
    lines.push('오늘의 페이스가 이어진다면 다음 경기도 기대해볼 만하다.');
  } else {
    lines.push('다음 경기에서의 복귀를 지켜보자.');
  }
  if (prime && !prime.rookieFlag) {
    lines.push(`${prime.year}년의 그 감각을 다시 보여줄 수 있을지가 관전 포인트.`);
  }
  return lines.join(' ');
}
