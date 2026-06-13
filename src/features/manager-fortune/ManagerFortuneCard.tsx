// 감독 오늘의 승부운 카드 — 재미용 운세 위젯.
// 별자리·띠는 deterministic 룰셋, 본문/키워드는 (감독·날짜) 시드 해시로 매일 변동.
// 2026-06-12 강화: 별자리 오늘 한 줄 + 사주 오행(일진 간지·상생상극) + 행운 요소.

'use client';

import { todayKstString } from '@/lib/date';

import { generateFortune, type ToneKey } from './lib/fortune';
import { ELEMENT_INFO, generateRichFortune } from './lib/saju';

import type { ManagerProfile } from './data/managers';

const TONE_LABEL: Record<ToneKey, { ko: string; emoji: string; accent: string; chipBg: string; chipText: string }> = {
  counter:    { ko: '카운터',  emoji: '🌊', accent: 'border-blue-300 bg-blue-50',     chipBg: 'bg-blue-100',   chipText: 'text-blue-800' },
  aggressive: { ko: '선공',    emoji: '🔥', accent: 'border-red-300 bg-red-50',       chipBg: 'bg-red-100',    chipText: 'text-red-800' },
  patient:    { ko: '디테일',  emoji: '🌱', accent: 'border-amber-300 bg-amber-50',   chipBg: 'bg-amber-100',  chipText: 'text-amber-900' },
  sharp:      { ko: '변칙',    emoji: '💨', accent: 'border-violet-300 bg-violet-50', chipBg: 'bg-violet-100', chipText: 'text-violet-800' },
};

export interface ManagerFortuneCardProps {
  manager: ManagerProfile;
  /** 테스트 주입용. 미지정 시 오늘(KST). */
  dateKst?: string;
}

export function ManagerFortuneCard({ manager, dateKst }: ManagerFortuneCardProps) {
  const date = dateKst ?? todayKstString();
  const f = generateFortune(manager, date);
  const rich = generateRichFortune(manager, date);
  const tone = TONE_LABEL[f.tone];

  return (
    <section
      className={`m3-card mx-3 my-3 sm:mx-4 border-2 ${tone.accent}`}
      aria-label={`${manager.name} 감독 오늘의 승부운`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span aria-hidden>🎯</span>
            <span>오늘의 승부운 — {manager.name} 감독</span>
          </div>
          <div className="text-xs text-gray-500">{date}</div>
        </div>

        <div className="mt-1 text-xs text-gray-600">
          <span className="mr-2">
            {f.zodiac.emoji} {f.zodiac.ko}
          </span>
          <span className="mr-2">
            {f.chineseZodiac.emoji} {f.chineseZodiac.ko}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.chipBg} ${tone.chipText}`}>
            {tone.emoji} {tone.ko}
          </span>
        </div>

        <p className="mt-3 text-base font-bold text-gray-900">{f.headline}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{f.body}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.keywords.map((kw) => (
            <span
              key={kw}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone.chipBg} ${tone.chipText}`}
            >
              #{kw}
            </span>
          ))}
        </div>

        {/* ── 심층: 별자리 오늘 + 사주 오행 + 행운 요소 ── */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* 별자리 운세 */}
          <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-gray-200">
            <p className="text-[11px] font-bold text-gray-500">
              {rich.zodiac.emoji} {rich.zodiac.ko} 오늘의 별자리
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-700">{rich.zodiacDaily}</p>
          </div>

          {/* 사주 오행 */}
          <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-gray-200">
            <p className="text-[11px] font-bold text-gray-500">
              {ELEMENT_INFO[rich.myElement].emoji} 사주 오행 — {rich.yearPillar}생
            </p>
            <p className="mt-1 text-xs text-gray-700">
              오늘은 <b>{rich.todayGanzhi}</b> ({ELEMENT_INFO[rich.todayElement].ko}) ·{' '}
              <span className="font-semibold">{rich.reading.relation}</span>
            </p>
            <p className="mt-0.5 text-xs text-amber-600" aria-label={`오늘의 기운 ${rich.reading.grade}점 만점 5점`}>
              오늘의 기운 {rich.reading.stars}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-700">{rich.reading.message}</p>
          </div>
        </div>

        {/* 행운 요소 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/70 border border-gray-200 px-3 py-2 text-[11px] text-gray-700">
          <span className="font-bold text-gray-500">🍀 오늘의 행운</span>
          <span>숫자 <b>{rich.lucky.number}</b></span>
          <span>방위 <b>{rich.lucky.direction}쪽</b></span>
          <span className="inline-flex items-center gap-1">
            색{' '}
            <span
              aria-hidden
              style={{ width: 10, height: 10, borderRadius: 3, background: rich.lucky.color, display: 'inline-block' }}
            />
            <b>{rich.lucky.colorName}</b>
          </span>
          <span>아이템 <b>{rich.lucky.item}</b></span>
        </div>

        <p className="mt-3 text-[10px] text-gray-400">
          ⚠ 별자리·사주 풀이는 전통 명리 공식을 차용한 재미용 콘텐츠입니다. 실제 경기 결과와 무관해요.
        </p>
      </div>
    </section>
  );
}
