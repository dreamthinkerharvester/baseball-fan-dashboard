// 사주(四柱)·별자리 심층 운세 — deterministic 생성기 (2026-06-12 콘텐츠 강화).
// 천간 오행 + 오늘의 일진(日辰) 간지 + 상생상극 해석 + 별자리 오늘 한 줄 + 행운 요소.
// 전통 명리학의 "오행 상생상극" 공식 구조를 차용한 재미용 콘텐츠 — 검증 가능한 예측이 아님.

import { getZodiac, type ZodiacInfo } from './fortune';

import type { ManagerProfile } from '../data/managers';

// ────────────────────────────────────────────────────────────────────────────
// 천간(天干) 10 · 지지(地支) 12 · 오행(五行) 5
// ────────────────────────────────────────────────────────────────────────────

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const ELEMENT_BY_STEM: readonly Element[] = [
  'wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water',
];

export const ELEMENT_INFO: Record<Element, { ko: string; emoji: string; color: string; colorName: string }> = {
  wood: { ko: '목(木)', emoji: '🌳', color: '#2EA45A', colorName: '초록' },
  fire: { ko: '화(火)', emoji: '🔥', color: '#E83A3F', colorName: '빨강' },
  earth: { ko: '토(土)', emoji: '⛰️', color: '#D8A848', colorName: '황토' },
  metal: { ko: '금(金)', emoji: '⚔️', color: '#C8D0E0', colorName: '흰색' },
  water: { ko: '수(水)', emoji: '🌊', color: '#56AAFF', colorName: '검정·파랑' },
};

/** 상생: 목→화→토→금→수→목 (앞이 뒤를 살린다) */
const FEEDS: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};
/** 상극: 목⊣토, 토⊣수, 수⊣화, 화⊣금, 금⊣목 (앞이 뒤를 누른다) */
const CONTROLS: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

/** 연도 천간 (year - 4) % 10 — 1984 = 갑자년 기준. */
export function yearStem(year: number): { stem: string; element: Element } {
  const idx = (((year - 4) % 10) + 10) % 10;
  return { stem: STEMS[idx]!, element: ELEMENT_BY_STEM[idx]! };
}

/**
 * 오늘의 일진(日辰) 간지. 앵커: 1984-02-02 = 갑자일(甲子日).
 * 60갑자 순환 — UTC 기준 일수 차이로 산출 (KST 날짜 문자열 입력).
 */
export function dayGanzhi(dateKst: string): { stem: string; branch: string; element: Element; label: string } {
  const anchor = Date.UTC(1984, 1, 2); // 1984-02-02 갑자일
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKst);
  if (!m) throw new Error(`Invalid date: ${dateKst}`);
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const days = Math.round((target - anchor) / 86_400_000);
  const i60 = ((days % 60) + 60) % 60;
  const stemIdx = i60 % 10;
  const branchIdx = i60 % 12;
  return {
    stem: STEMS[stemIdx]!,
    branch: BRANCHES[branchIdx]!,
    element: ELEMENT_BY_STEM[stemIdx]!,
    label: `${STEMS[stemIdx]}${BRANCHES[branchIdx]}일`,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 오행 관계 → 오늘의 기운 (5등급)
// ────────────────────────────────────────────────────────────────────────────

export interface ElementReading {
  grade: 1 | 2 | 3 | 4 | 5; // 5 = 최상
  stars: string;
  relation: string;
  message: string;
}

export function readElements(me: Element, today: Element): ElementReading {
  const meInfo = ELEMENT_INFO[me].ko;
  const todayInfo = ELEMENT_INFO[today].ko;
  if (FEEDS[today] === me) {
    return {
      grade: 5,
      stars: '★★★★★',
      relation: `${todayInfo} 생(生) ${meInfo}`,
      message: '오늘의 기운이 감독의 기운을 살리는 상생일. 밀어붙이는 결정마다 순풍이 붙습니다.',
    };
  }
  if (today === me) {
    return {
      grade: 4,
      stars: '★★★★☆',
      relation: `${meInfo} 비화(比和)`,
      message: '같은 기운이 겹치는 날. 평소 스타일 그대로 가면 무난히 풀립니다. 무리수만 피할 것.',
    };
  }
  if (FEEDS[me] === today) {
    return {
      grade: 3,
      stars: '★★★☆☆',
      relation: `${meInfo} 생(生) ${todayInfo}`,
      message: '에너지를 내어주는 날. 성과는 있지만 체력 소모가 큽니다. 불펜 운용은 보수적으로.',
    };
  }
  if (CONTROLS[me] === today) {
    return {
      grade: 2,
      stars: '★★☆☆☆',
      relation: `${meInfo} 극(剋) ${todayInfo}`,
      message: '이기려 들수록 힘이 빠지는 날. 정면승부보다 우회 전략이 답입니다.',
    };
  }
  return {
    grade: 1,
    stars: '★☆☆☆☆',
    relation: `${todayInfo} 극(剋) ${meInfo}`,
    message: '기운이 눌리는 날. 변수 관리가 최우선 — 기본기와 수비로 버티면 액운이 비껴갑니다.',
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 별자리 오늘 한 줄 (12궁 × 풀)
// ────────────────────────────────────────────────────────────────────────────

const ZODIAC_DAILY: Record<string, readonly string[]> = {
  aries: [
    '불의 기운이 정점 — 첫 타석, 첫 결정에서 승부가 갈립니다.',
    '직감이 데이터보다 빠른 날. 다만 폭주는 금물.',
    '경쟁자가 머뭇거릴 때 먼저 움직이면 주도권을 쥡니다.',
  ],
  taurus: [
    '단단한 흙의 기운 — 서두르지 않는 쪽이 끝내 이깁니다.',
    '재물운이 들어오는 날. 작은 이득(진루타)을 모으면 큰 수확.',
    '고집이 빛나는 날이지만, 데이터가 반대하면 한 번은 접으세요.',
  ],
  gemini: [
    '정보가 무기인 날 — 상대 전력 분석에서 답이 나옵니다.',
    '두 가지 플랜을 동시에 굴리면 행운이 따릅니다.',
    '말 한마디가 분위기를 바꿉니다. 덕아웃 소통에 신경 쓸 것.',
  ],
  cancer: [
    '물의 직감이 깊어지는 날 — 선수의 컨디션 변화를 먼저 읽습니다.',
    '홈에서 강한 기운. 익숙한 루틴을 지키면 흐름이 옵니다.',
    '감정 기복이 변수 — 위기 상황일수록 표정 관리가 팀을 살립니다.',
  ],
  leo: [
    '태양의 기운 — 무대 중앙에서 빛나는 날. 과감한 쇼맨십이 통합니다.',
    '에이스에게 믿음을 보여주면 두 배로 돌아옵니다.',
    '자존심 싸움은 피하세요. 실리를 챙기는 사자가 진짜 왕입니다.',
  ],
  virgo: [
    '디테일의 신이 함께하는 날 — 수비 시프트 한 칸이 승부를 가릅니다.',
    '완벽주의가 빛나지만, 선수단엔 칭찬 한 스푼을 더하세요.',
    '기록지를 다시 보면 놓친 패턴이 보입니다.',
  ],
  libra: [
    '균형의 기운 — 공격과 수비, 어느 쪽도 치우치지 않는 운영이 답.',
    '판정 시비에 휘말리지 않는 것이 오늘의 핵심 운.',
    '라인업의 좌우 균형을 맞추면 시너지가 터집니다.',
  ],
  scorpio: [
    '깊은 물의 승부사 기질이 깨어나는 날 — 상대의 약점이 보입니다.',
    '숨겨둔 카드를 꺼낼 타이밍. 비밀 병기가 통합니다.',
    '집요함이 미덕 — 끝까지 물고 늘어지는 승부에서 이깁니다.',
  ],
  sagittarius: [
    '모험의 화살이 과녁을 향하는 날 — 도전적인 작전이 통합니다.',
    '낙관이 전염되는 날. 벤치 분위기가 곧 점수가 됩니다.',
    '멀리 보는 시야 — 오늘 한 경기보다 시리즈 전체를 설계하세요.',
  ],
  capricorn: [
    '산양의 끈기 — 계획대로 한 걸음씩 오르면 정상이 보입니다.',
    '책임감이 무거운 날이지만, 그 무게가 곧 권위가 됩니다.',
    '보수적 운용이 길합니다. 검증된 카드 위주로.',
  ],
  aquarius: [
    '바람의 발상 — 남들이 안 하는 수가 오늘의 정답입니다.',
    '데이터와 직감이 충돌하면 오늘은 데이터 쪽에 한 표.',
    '파격 라인업이 행운을 부르는 날.',
  ],
  pisces: [
    '물고기의 직감 — 흐름을 읽는 감각이 최고조입니다.',
    '공감 능력이 팀을 묶습니다. 부진한 선수에게 한마디를.',
    '꿈자리가 사나워도 걱정 금물 — 역몽(逆夢)의 날입니다.',
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 행운 요소 (숫자·방위·아이템) — 시드 기반
// ────────────────────────────────────────────────────────────────────────────

const DIRECTIONS = ['동', '서', '남', '북', '동남', '동북', '서남', '서북'] as const;
const ITEMS = [
  '검빨 머플러', '응원봉', '치킨', '캐치볼 글러브', '선글라스', '타이거즈 모자',
  '김밥', '커피', '쌍안경', '유니폼 풀착장', '수건', '응원 타올',
] as const;

export interface RichFortune {
  zodiac: ZodiacInfo;
  zodiacDaily: string;
  yearPillar: string; // "신유년 금(金)"
  myElement: Element;
  todayGanzhi: string; // "갑자일"
  todayElement: Element;
  reading: ElementReading;
  lucky: { number: number; direction: string; color: string; colorName: string; item: string };
}

function hash(parts: readonly string[]): number {
  let h = 5381;
  const joined = parts.join('|');
  for (let i = 0; i < joined.length; i++) h = ((h << 5) + h + joined.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function generateRichFortune(profile: ManagerProfile, dateKst: string): RichFortune {
  const zodiac = getZodiac(profile.birthDate);
  const birthYear = Number(profile.birthDate.slice(0, 4));
  const ys = yearStem(birthYear);
  const today = dayGanzhi(dateKst);
  const reading = readElements(ys.element, today.element);

  const seed = hash([profile.name, profile.birthDate, dateKst]);
  const dailyPool = ZODIAC_DAILY[zodiac.key] ?? ZODIAC_DAILY.aries!;
  const luckyElement = ELEMENT_INFO[FEEDS[ys.element]]; // 내가 살리는 기운의 색 = 활동 색

  return {
    zodiac,
    zodiacDaily: dailyPool[seed % dailyPool.length]!,
    yearPillar: `${ys.stem}${branchOfYear(birthYear)}년 ${ELEMENT_INFO[ys.element].ko}`,
    myElement: ys.element,
    todayGanzhi: today.label,
    todayElement: today.element,
    reading,
    lucky: {
      number: (seed % 99) + 1,
      direction: DIRECTIONS[seed % DIRECTIONS.length]!,
      color: luckyElement.color,
      colorName: luckyElement.colorName,
      item: ITEMS[(seed >> 3) % ITEMS.length]!,
    },
  };
}

function branchOfYear(year: number): string {
  const idx = (((year - 4) % 12) + 12) % 12;
  return BRANCHES[idx]!;
}
