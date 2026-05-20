// 감독 오늘의 승부운 — deterministic 생성기.
// 입력: 감독 프로필 + YYYY-MM-DD (KST) → 같은 (감독·날짜) 쌍이면 항상 같은 결과.
// 본질적으로 재미용 컨텐츠. 검증 가능한 운명 예측이 아님.

import type { ManagerProfile } from '../data/managers';

const ZODIACS = [
  { key: 'aries',       ko: '양자리',     emoji: '♈' },
  { key: 'taurus',      ko: '황소자리',   emoji: '♉' },
  { key: 'gemini',      ko: '쌍둥이자리', emoji: '♊' },
  { key: 'cancer',      ko: '게자리',     emoji: '♋' },
  { key: 'leo',         ko: '사자자리',   emoji: '♌' },
  { key: 'virgo',       ko: '처녀자리',   emoji: '♍' },
  { key: 'libra',       ko: '천칭자리',   emoji: '♎' },
  { key: 'scorpio',     ko: '전갈자리',   emoji: '♏' },
  { key: 'sagittarius', ko: '사수자리',   emoji: '♐' },
  { key: 'capricorn',   ko: '염소자리',   emoji: '♑' },
  { key: 'aquarius',    ko: '물병자리',   emoji: '♒' },
  { key: 'pisces',      ko: '물고기자리', emoji: '♓' },
] as const;

// 시작일 (month, day) — 종료일은 다음 별자리 시작 전날.
// 순서 주의: 월 오름차순(1월~12월). 3월 이후 날짜에 [1,20]/[2,19]가 잘못 덮어씌우지 않게.
const ZODIAC_RANGES: ReadonlyArray<{ from: [number, number]; index: number }> = [
  { from: [1, 20],  index: 10 }, // 물병자리
  { from: [2, 19],  index: 11 }, // 물고기자리
  { from: [3, 21],  index: 0 },  // 양자리
  { from: [4, 20],  index: 1 },  // 황소자리
  { from: [5, 21],  index: 2 },  // 쌍둥이자리
  { from: [6, 22],  index: 3 },  // 게자리
  { from: [7, 23],  index: 4 },  // 사자자리
  { from: [8, 23],  index: 5 },  // 처녀자리
  { from: [9, 23],  index: 6 },  // 천칭자리
  { from: [10, 23], index: 7 },  // 전갈자리
  { from: [11, 23], index: 8 },  // 사수자리
  { from: [12, 22], index: 9 },  // 염소자리
];

// 12간지 — 1981 mod 12 = 1 → 닭(酉)
const CHINESE_ZODIACS = [
  { key: 'monkey',  ko: '원숭이띠', emoji: '🐒' }, // mod 0
  { key: 'rooster', ko: '닭띠',     emoji: '🐓' }, // mod 1
  { key: 'dog',     ko: '개띠',     emoji: '🐕' }, // mod 2
  { key: 'pig',     ko: '돼지띠',   emoji: '🐖' }, // mod 3
  { key: 'rat',     ko: '쥐띠',     emoji: '🐀' }, // mod 4
  { key: 'ox',      ko: '소띠',     emoji: '🐂' }, // mod 5
  { key: 'tiger',   ko: '호랑이띠', emoji: '🐅' }, // mod 6
  { key: 'rabbit',  ko: '토끼띠',   emoji: '🐇' }, // mod 7
  { key: 'dragon',  ko: '용띠',     emoji: '🐉' }, // mod 8
  { key: 'snake',   ko: '뱀띠',     emoji: '🐍' }, // mod 9
  { key: 'horse',   ko: '말띠',     emoji: '🐎' }, // mod 10
  { key: 'sheep',   ko: '양띠',     emoji: '🐑' }, // mod 11
] as const;

export type ZodiacInfo = (typeof ZODIACS)[number];
export type ChineseZodiacInfo = (typeof CHINESE_ZODIACS)[number];

export type ToneKey = 'counter' | 'aggressive' | 'patient' | 'sharp';

export interface FortuneResult {
  zodiac: ZodiacInfo;
  chineseZodiac: ChineseZodiacInfo;
  tone: ToneKey;
  headline: string;
  body: string;
  keywords: readonly [string, string, string];
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(s: string): { y: number; m: number; d: number } {
  const m = DATE_RE.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function getZodiac(birthDate: string): ZodiacInfo {
  const { m, d } = parseDate(birthDate);
  // 별자리 시작일 기준으로 가장 최근 범위 선택. 1월 1~19일은 염소자리(이전 해 시작).
  let chosen = 9; // 기본 염소자리 (1월 초)
  for (const range of ZODIAC_RANGES) {
    const [rm, rd] = range.from;
    if (m > rm || (m === rm && d >= rd)) chosen = range.index;
  }
  return ZODIACS[chosen]!;
}

export function getChineseZodiac(birthDate: string): ChineseZodiacInfo {
  const { y } = parseDate(birthDate);
  const idx = ((y % 12) + 12) % 12;
  return CHINESE_ZODIACS[idx]!;
}

// Tone은 별자리 원소(element)로 결정 — 12지 % 4.
// 0(불) = aggressive, 1(흙) = patient, 2(공기) = sharp, 3(물) = counter
const TONE_BY_ELEMENT: Record<number, ToneKey> = {
  0: 'aggressive',
  1: 'patient',
  2: 'sharp',
  3: 'counter',
};

function getElementTone(zodiacIndex: number): ToneKey {
  return TONE_BY_ELEMENT[zodiacIndex % 4]!;
}

// Deterministic seed: 별자리 + 띠 + 날짜 문자열을 djb2 해시.
function seedHash(parts: readonly string[]): number {
  let h = 5381;
  const joined = parts.join('|');
  for (let i = 0; i < joined.length; i++) {
    h = ((h << 5) + h + joined.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const MESSAGES: Record<ToneKey, {
  headlines: readonly string[];
  bodies: readonly string[];
  keywords: ReadonlyArray<readonly [string, string, string]>;
}> = {
  counter: {
    headlines: [
      '맞불 금지, 받아치기 모드',
      '초반은 견디고 후반에 한 방',
      '카운터 한 타이밍, 오늘의 키',
      '늦게 빼는 카드가 정답',
      '6~7회에 흐름이 갈린다',
      '끝까지 안 무너지는 끈기',
    ],
    bodies: [
      '초반 흐름이 무거워 보여도 7회 이후 반등 신호가 들어옵니다. 결정적 카드는 6~7회에 아끼지 말고 던지는 게 정답.',
      '점수가 더디게 나도 동요 금물. 상대 투수의 구종 패턴을 두 바퀴 돌리면 약점이 노출됩니다.',
      '먼저 치고 나가려 무리하면 역풍. 한 박자 늦춘 침착함이 승부를 가릅니다.',
      '벤치 카드(대타·계투)는 평소보다 한 단계 일찍 꺼낼 준비. 한 번의 교체가 점수로 직결되는 날.',
      '5회까지의 흐름은 의미가 적습니다. 진짜 승부는 6회 이후 — 늦게 폭발하는 타선에 베팅.',
      '수비 집중력을 끝까지 유지하는 팀이 가져가는 흐름. 마지막 한 아웃까지 풀어지지 마세요.',
    ],
    keywords: [
      ['카운터', '끈기', '후반승부'],
      ['관찰', '인내', '한 방'],
      ['역전', '집중', '교체타이밍'],
      ['수비', '끈기', '마지막아웃'],
      ['받아치기', '침착', '6회 이후'],
      ['디테일', '관찰', '늦은폭발'],
    ],
  },
  aggressive: {
    headlines: [
      '선제 한 방, 초반에 끝낸다',
      '먼저 두드리는 자에게 운',
      '1회부터 풀스윙',
      '주도권은 빠른 자의 것',
      '망설이지 말 것',
      '초반 3이닝이 전부',
    ],
    bodies: [
      '오늘은 선공이 곧 승부. 1~3회에 점수를 만들어 두면 경기 흐름이 그대로 굳어집니다.',
      '주자가 나가면 망설이지 말고 뛰게 하세요. 적극적인 주루가 상대 수비를 흔듭니다.',
      '에이스 카드를 아끼지 말 것. 일찍 끝내는 게 오늘의 정답이고, 길게 끌수록 변수만 늘어납니다.',
      '상대 선발이 흔들리는 신호가 보이면 즉시 풀스윙으로 전환. 한 번의 빅이닝이 경기를 닫습니다.',
      '오늘 운은 앞으로 나가는 자에게 붙습니다. 안전한 번트보다 강공이 어울리는 날.',
      '망설이는 순간 흐름이 꺾입니다. 결정은 빠르게, 신호는 명확하게.',
    ],
    keywords: [
      ['선공', '풀스윙', '빅이닝'],
      ['적극주루', '강공', '주도권'],
      ['속도', '결단', '에이스'],
      ['빠른교체', '주도', '풀스윙'],
      ['초반승부', '대담', '주루'],
      ['결단', '속도', '한방'],
    ],
  },
  patient: {
    headlines: [
      '디테일이 모든 것',
      '한 점을 가져가는 게임',
      '실수 안 하는 팀이 이긴다',
      '느린 페이스, 단단한 승부',
      '수비로 잠그는 하루',
      '작전야구가 빛나는 날',
    ],
    bodies: [
      '큰 한 방을 노리지 마세요. 1점, 1점을 차곡차곡 쌓는 끈적한 야구가 통하는 날입니다.',
      '오늘은 실수 없는 팀이 이깁니다. 송구 정확도, 베이스 커버, 사인 교환 — 기본기 점검부터.',
      '번트·진루타·희생플라이 — 작전야구의 모든 도구가 제값을 합니다. 화려함보다 정교함.',
      '투수 교체는 한 박자 빠르게, 수비 시프트는 한 박자 깊게. 디테일 한 끗이 점수를 막습니다.',
      '서두르면 손해. 카운트 깊게 가져가며 상대 투수의 구위를 갉아먹는 타격이 정답.',
      '느리지만 단단한 흐름. 점수가 안 나도 조급해하지 말고 계획대로 가세요.',
    ],
    keywords: [
      ['디테일', '기본기', '실수제로'],
      ['작전야구', '진루타', '희생타'],
      ['수비', '시프트', '정교함'],
      ['카운트', '인내', '구위소모'],
      ['1점승부', '끈적', '집중'],
      ['계획', '단단', '느린승부'],
    ],
  },
  sharp: {
    headlines: [
      '변칙 한 수, 오늘의 묘수',
      '예측 불가가 무기',
      '머리 싸움에서 이긴다',
      '깜짝 라인업이 정답',
      '읽는 자가 가져간다',
      '한 끗 발상의 전환',
    ],
    bodies: [
      '뻔한 수는 모두 읽힙니다. 평소와 다른 타순 배치나 시프트가 결정적인 한 점을 만듭니다.',
      '상대 사인을 읽어내는 집중력이 오늘의 무기. 첫 타석에서 패턴을 잡으면 두 번째부터는 우위.',
      '가벼운 야구가 아니라 영리한 야구. 1구 1구의 의도를 명확히 하면 결과가 따라옵니다.',
      '깜짝 선발·깜짝 대타가 통하는 흐름. 정공법은 오늘 한 박자 느릴 수 있습니다.',
      '미들·롱이닝 계투의 변칙 운용을 망설이지 말 것. 매뉴얼대로 가지 않아도 됩니다.',
      '필드 위 작은 변화 하나가 점수로 직결. 평소 안 하던 한 수를 시도해 볼 만한 날.',
    ],
    keywords: [
      ['변칙', '깜짝카드', '집중'],
      ['사인독해', '예측', '두뇌'],
      ['시프트', '의도', '영리함'],
      ['깜짝선발', '깜짝대타', '발상전환'],
      ['변칙계투', '유연', '실험'],
      ['관찰', '머리싸움', '한끗'],
    ],
  },
};

export function generateFortune(profile: ManagerProfile, dateKst: string): FortuneResult {
  if (!DATE_RE.test(dateKst)) throw new Error(`Invalid dateKst: ${dateKst}`);
  const zodiac = getZodiac(profile.birthDate);
  const chineseZodiac = getChineseZodiac(profile.birthDate);
  const zodiacIndex = ZODIACS.indexOf(zodiac);
  const tone = getElementTone(zodiacIndex);

  const pool = MESSAGES[tone];
  // 세 자리(headline·body·keywords)에 각각 다른 비트 영역 사용 → 날짜 1일 차이에도 다양성 확보.
  const seed = seedHash([profile.name, profile.birthDate, dateKst]);
  const seedB = seedHash([profile.birthDate, dateKst, profile.name]); // 입력 순서 섞어 두 번째 해시
  const seedC = seedHash([dateKst, profile.name, profile.birthDate]);
  const headline = pool.headlines[seed % pool.headlines.length]!;
  const body = pool.bodies[seedB % pool.bodies.length]!;
  const keywords = pool.keywords[seedC % pool.keywords.length]!;

  return { zodiac, chineseZodiac, tone, headline, body, keywords };
}
