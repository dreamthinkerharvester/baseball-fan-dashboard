// Design Ref: kia-fan-service §5.3 (FR-05) — 세이버 용어 인라인 교육 사전.
// 포맷: "{지표명}: {한 줄 정의}. 이 선수 {값} → {해석}." (PRD F2)
// 정박 기준: wRC+/OPS+ = 리그평균 100. 나머지는 통상 범위로 해석.

export type SaberMetricKey =
  | 'wrcPlus'
  | 'fip'
  | 'babip'
  | 'kPct'
  | 'bbPct'
  | 'war'
  | 'woba'
  | 'ops';

interface GlossaryDef {
  label: string;
  oneLiner: string;
  anchor: number | null;
  interpret: (value: number) => string;
}

export const SABER_GLOSSARY: Record<SaberMetricKey, GlossaryDef> = {
  wrcPlus: {
    label: 'wRC+',
    oneLiner: '리그평균=100 기준 득점 생산력. 파크팩터 보정 포함.',
    anchor: 100,
    interpret: (v) =>
      v >= 100
        ? `리그 평균보다 ${Math.round(v - 100)}% 더 득점에 기여.`
        : `리그 평균보다 ${Math.round(100 - v)}% 적게 득점에 기여.`,
  },
  fip: {
    label: 'FIP',
    oneLiner: '수비 무관 투구 능력 (홈런·볼넷·삼진만 반영). 낮을수록 좋음.',
    anchor: null,
    interpret: (v) =>
      v <= 3.5
        ? `${v.toFixed(2)} → 리그 상위권 구위.`
        : v <= 4.5
          ? `${v.toFixed(2)} → 리그 평균권.`
          : `${v.toFixed(2)} → 평균 이하. 수비 도움이 필요한 유형.`,
  },
  babip: {
    label: 'BABIP',
    oneLiner: '인플레이 타구의 안타 비율. 평균(약 .300)에서 크게 벗어나면 운의 영향 가능성.',
    anchor: 0.3,
    interpret: (v) =>
      v >= 0.35
        ? `${v.toFixed(3)} → 평균보다 높음. 타구 운이 따랐을 수 있음.`
        : v <= 0.25
          ? `${v.toFixed(3)} → 평균보다 낮음. 불운했을 가능성.`
          : `${v.toFixed(3)} → 평균(.300) 부근.`,
  },
  kPct: {
    label: 'K%',
    oneLiner: '타석 대비 삼진 비율.',
    anchor: null,
    interpret: (v) => `${v.toFixed(1)}%.`,
  },
  bbPct: {
    label: 'BB%',
    oneLiner: '타석 대비 볼넷 비율. 높을수록 선구안 우수(타자) / 제구 불안(투수).',
    anchor: null,
    interpret: (v) => `${v.toFixed(1)}%.`,
  },
  war: {
    label: 'WAR',
    oneLiner: '대체 선수 대비 승리 기여. 시즌 누적 종합 가치.',
    anchor: 0,
    interpret: (v) =>
      v >= 3
        ? `${v.toFixed(1)}승 기여 → 리그 정상급.`
        : v >= 1
          ? `${v.toFixed(1)}승 기여 → 주전급.`
          : `${v.toFixed(1)}승 기여.`,
  },
  woba: {
    label: 'wOBA',
    oneLiner: '출루 유형별 득점 가치를 가중 평균한 종합 타격 지표.',
    anchor: 0.32,
    interpret: (v) =>
      v >= 0.4
        ? `${v.toFixed(3)} → 엘리트 타격.`
        : v >= 0.34
          ? `${v.toFixed(3)} → 평균 이상.`
          : `${v.toFixed(3)} → 평균(약 .320) 이하.`,
  },
  ops: {
    label: 'OPS',
    oneLiner: '출루율 + 장타율. 고전·세이버 사이의 다리 역할 지표.',
    anchor: null,
    interpret: (v) => `${v.toFixed(3)}.`,
  },
};

/** 툴팁 본문 생성. value가 null이면 정의만. */
export function glossaryText(key: SaberMetricKey, value: number | null): string {
  const def = SABER_GLOSSARY[key];
  const base = `${def.label}: ${def.oneLiner}`;
  if (value === null || !Number.isFinite(value)) return base;
  return `${base} 이 선수 ${formatMetric(key, value)} → ${def.interpret(value)}`;
}

export function formatMetric(key: SaberMetricKey, value: number): string {
  switch (key) {
    case 'wrcPlus':
      return value.toFixed(1);
    case 'fip':
      return value.toFixed(2);
    case 'babip':
    case 'woba':
    case 'ops':
      return value.toFixed(3).replace(/^0/, '');
    case 'kPct':
    case 'bbPct':
      return `${value.toFixed(1)}%`;
    case 'war':
      return value.toFixed(1);
  }
}
