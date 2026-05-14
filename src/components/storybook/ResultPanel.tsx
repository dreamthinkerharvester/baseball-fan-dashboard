import { ElevatedCard } from './ElevatedCard';

import type { Storybook } from '@/types';

interface Props {
  storybook: Storybook;
}

export function ResultPanel({ storybook }: Props) {
  const { player, today, prime, news, narrative, errors } = storybook;
  return (
    <div className="flex flex-col gap-4">
      <div
        className="m3-card"
        style={{
          padding: 16,
          background: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          borderLeft: '3px solid var(--md-sys-color-primary)',
        }}
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="font-brand" style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: 'var(--md-sys-color-on-surface)' }}>
            {player.name}
          </h2>
          <span className="m3-chip m3-chip-sm m3-chip-outline tabular">{player.position}</span>
          <span className="tabular" style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
            #{player.id}
          </span>
        </div>
        {errors && errors.length > 0 && (
          <p
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              fontSize: 12,
            }}
          >
            ⚠ 일부 데이터 수집 실패: {errors.join(', ')}
          </p>
        )}
      </div>

      <ElevatedCard overline="① 오늘의 경기" headline={today.played ? `${today.date} 경기 출장` : `${today.date} 결장`}>
        {today.played ? (
          today.batter ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="font-mono-tn" style={{ padding: '8px 10px', background: 'var(--md-sys-color-surface-container-highest)', borderRadius: 8, fontSize: 13 }}>
                {today.batter.ab}타수 {today.batter.h}안타 · HR {today.batter.hr} · RBI {today.batter.rbi} · BB {today.batter.bb} · SO {today.batter.so}
              </div>
              <div className="font-mono-tn" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }}>
                AVG {today.batter.avg.toFixed(3).replace(/^0/, '')} · OPS {today.batter.ops.toFixed(3).replace(/^0/, '')}
              </div>
            </div>
          ) : today.pitcher ? (
            <div className="font-mono-tn" style={{ padding: '8px 10px', background: 'var(--md-sys-color-surface-container-highest)', borderRadius: 8, fontSize: 13 }}>
              {today.pitcher.ip.toFixed(1)}이닝 · ER {today.pitcher.er} · K {today.pitcher.k} · BB {today.pitcher.bb} · ERA {today.pitcher.era.toFixed(2)}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>경기 기록 없음</p>
          )
        ) : (
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>경기 결장</p>
        )}
      </ElevatedCard>

      <ElevatedCard
        overline="② 전성기 시즌"
        headline={prime ? `${prime.year} — ${prime.metric} ${formatVal(prime.metric, prime.value)}` : '데이터 부족'}
        accent={!!prime}
      >
        {prime ? (
          <>
            {prime.highlights.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: prime.rookieFlag ? 8 : 0 }}>
                {prime.highlights.map((h, i) => {
                  const tier = i < 3 ? 'tier-special' : i < 5 ? 'tier-rare' : 'tier-elite';
                  return (
                    <span key={i} className={`m3-chip m3-chip-sm ${tier}`} style={{ fontWeight: 700 }}>
                      {h.value}
                    </span>
                  );
                })}
              </div>
            )}
            {prime.rookieFlag && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--md-sys-color-tertiary)' }}>
                (아직 신인급 — 더 많은 시즌이 쌓이면 갱신)
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>전성기 데이터 부족</p>
        )}
      </ElevatedCard>

      <ElevatedCard overline="③ 과거 뉴스" headline={`언론 보도 ${news.length}건`}>
        {news.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {news.slice(0, 5).map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--md-sys-color-outline-variant)',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="tabular"
                  style={{ width: 76, fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0, paddingTop: 2 }}
                >
                  {n.date}
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>{n.publisher}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--md-sys-color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.title}
                  </span>
                </div>
                <span className="mso" style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0, marginTop: 4 }}>
                  open_in_new
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
            관련 뉴스 없음 (API 키 미설정 또는 검색 결과 없음)
          </p>
        )}
      </ElevatedCard>

      <ElevatedCard overline="④ 선수 서사" headline={`연도별 타임라인 (${narrative.length}건)`}>
        {narrative.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {narrative.map((e, i) => {
              const last = i === narrative.length - 1;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: last ? 0 : 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 60 }}>
                    <span
                      className="tabular"
                      style={{
                        background: last
                          ? 'var(--md-sys-color-tertiary-container)'
                          : 'var(--md-sys-color-surface-container-highest)',
                        color: last
                          ? 'var(--md-sys-color-on-tertiary-container)'
                          : 'var(--md-sys-color-on-surface)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {e.year}
                    </span>
                    {!last && (
                      <div
                        style={{
                          flex: 1,
                          width: 2,
                          background: 'var(--md-sys-color-outline-variant)',
                          margin: '6px 0 0',
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingTop: 2, paddingBottom: 6, flex: 1 }}>
                    <span
                      style={{
                        fontSize: 14,
                        lineHeight: '20px',
                        color: last ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface)',
                        fontWeight: last ? 600 : 400,
                      }}
                    >
                      {e.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
            선수 서사 자료 미수집 — 직접 보충 필요
          </p>
        )}
      </ElevatedCard>
    </div>
  );
}

function formatVal(metric: 'WAR' | 'ERA' | 'OPS', value: number): string {
  if (metric === 'WAR') return value.toFixed(1);
  if (metric === 'OPS') return value.toFixed(3);
  return value.toFixed(2);
}
