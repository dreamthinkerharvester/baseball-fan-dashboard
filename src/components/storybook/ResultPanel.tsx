import type { Storybook } from '@/types';

interface Props {
  storybook: Storybook;
}

export function ResultPanel({ storybook }: Props) {
  const { player, today, prime, news, narrative, errors } = storybook;
  return (
    <div className="space-y-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-1">
          {player.name} <span className="text-white/50 text-xs sm:text-sm">({player.position})</span>
        </h2>
        {errors && errors.length > 0 && (
          <p className="text-yellow-300 text-xs sm:text-sm mt-2 break-words">
            ⚠ 일부 데이터 수집 실패: {errors.join(', ')}
          </p>
        )}
      </div>

      <Section title="① 오늘의 경기">
        {today.played ? (
          today.batter ? (
            <p>
              {today.date} — {today.batter.ab}타수 {today.batter.h}안타 {today.batter.hr}홈런 {today.batter.rbi}타점
            </p>
          ) : today.pitcher ? (
            <p>
              {today.date} — {today.pitcher.ip.toFixed(1)}이닝 {today.pitcher.er}자책 {today.pitcher.k}K
            </p>
          ) : (
            <p>{today.date} 경기 기록 없음.</p>
          )
        ) : (
          <p className="text-white/60">{today.date} 경기 결장</p>
        )}
      </Section>

      <Section title={`② 전성기${prime ? ` — ${prime.year}시즌` : ''}`}>
        {prime ? (
          <div>
            <p>
              {prime.metric} {formatVal(prime.metric, prime.value)}
              {prime.rookieFlag && <span className="ml-2 text-yellow-300 text-sm">(아직 신인급)</span>}
            </p>
            {prime.highlights.length > 0 && (
              <p className="text-sm text-white/70 mt-1">
                {prime.highlights.map((h) => h.value).join(' · ')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-white/60">전성기 데이터 부족</p>
        )}
      </Section>

      <Section title={`③ 과거 뉴스 (${news.length}건)`}>
        {news.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {news.slice(0, 5).map((n, i) => (
              <li key={i}>
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  • {n.date} {n.publisher} — {n.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/60">관련 뉴스 없음 (API 키 미설정 또는 검색 결과 없음)</p>
        )}
      </Section>

      <Section title={`④ 선수 서사 (${narrative.length}개 이벤트)`}>
        {narrative.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {narrative.map((e, i) => (
              <li key={i}>
                <strong>{e.year}</strong> — {e.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/60">선수 서사 자료 미수집 — 직접 보충 필요</p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-3 sm:p-4">
      <h3 className="font-semibold mb-2 text-sm sm:text-base">{title}</h3>
      <div className="text-sm sm:text-base break-words">{children}</div>
    </div>
  );
}

function formatVal(metric: 'WAR' | 'ERA' | 'OPS', value: number): string {
  if (metric === 'WAR') return value.toFixed(1);
  if (metric === 'OPS') return value.toFixed(3);
  return value.toFixed(2);
}
