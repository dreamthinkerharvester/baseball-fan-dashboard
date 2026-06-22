// Player detail — editorial "lookbook" page.
// Clicking any player (search / roster / lineup) routes here.
// Server component: reads stat cache (all collectible seasons) + news cache,
// renders the editorial-lookbook layout re-skinned for KIA, with crayon-portrait
// slots (/assets/players-crayon/{id}_{slot}.png) that fall back to placeholders
// until the hand-drawn images are supplied (see OUT crayon-portrait prompt MD).

import { existsSync } from 'node:fs';
import path from 'node:path';

import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { GRADE_LABELS, TEAMS } from '@/lib/constants';
import { getPlayerDetail, getKiaRoster } from '@/services/player';
import { getPlayerNews, naverNewsSearchUrl } from '@/services/news';

import './lookbook.css';

import type { Grade, TeamCode } from '@/types';

export const dynamicParams = true;

export async function generateStaticParams() {
  const roster = await getKiaRoster();
  return roster.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const res = await getPlayerDetail(params.id);
  const player = res.data?.player;
  if (!player) return { title: '선수를 찾을 수 없습니다 | 야구서비스' };
  const num = player.uniformNumber != null ? ` #${player.uniformNumber}` : '';
  return {
    title: `${player.name}${num} — KIA 타이거즈 | 야구서비스`,
    description: `${player.name} 선수의 올시즌 기록과 역대 통산 성적, 최신 뉴스를 크레파스 화풍 팬 카드로.`,
  };
}

// ────────────────────────────────────────────────────────────────────────────
type Rec = Record<string, unknown>;
const CRAYON_SLOTS = ['hero', 'side', 'action', 'back', 'face'] as const;
type CrayonSlot = (typeof CRAYON_SLOTS)[number];

const SLOT_LABEL: Record<CrayonSlot, string> = {
  hero: '정면 (대표)',
  side: '측면',
  action: '액션',
  back: '뒷모습',
  face: '얼굴',
};

/** grade → editorial accent (rarity tint). elite keeps KIA red. */
const ACCENT: Record<Grade, { accent: string; deep: string }> = {
  elite: { accent: '#ea0029', deep: '#a8001d' },
  rare: { accent: '#cf7a2c', deep: '#9a571a' },
  special: { accent: '#b8932a', deep: '#876a16' },
  normal: { accent: '#8a7d6f', deep: '#5f5249' },
};

function num(o: Rec | null | undefined, k: string): number | null {
  const v = o?.[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function str(o: Rec | null | undefined, k: string): string | null {
  const v = o?.[k];
  return typeof v === 'string' && v.length > 0 ? v : null;
}
function fmt(v: number | null, d: number): string {
  return v == null ? '—' : v.toFixed(d);
}
function fmtInt(v: number | null): string {
  return v == null ? '—' : String(Math.round(v));
}
/** .277 스타일 (선행 0 제거) — KBO 관행. */
function rate(v: number | null, d = 3): string {
  if (v == null) return '—';
  return v.toFixed(d).replace(/^0\./, '.').replace(/^-0\./, '-.');
}

function fileSrc(rel: string): string | null {
  const abs = path.join(process.cwd(), 'public', rel);
  return existsSync(abs) ? `/${rel}` : null;
}

function crayonSrc(id: string, slot: CrayonSlot): string | null {
  return fileSrc(`assets/players-crayon/${id}_${slot}.png`);
}

/** Shared crayon fallback split only by pitcher/batter (see _generic/). */
function genericSrc(isPitcher: boolean, slot: CrayonSlot): string | null {
  const role = isPitcher ? 'pitcher' : 'batter';
  return (
    fileSrc(`assets/players-crayon/_generic/${role}_${slot}.png`) ??
    fileSrc(`assets/players-crayon/_generic/${role}_hero.png`)
  );
}

/** Best available: player-specific crayon → role-based generic → null (dotted placeholder). */
function portraitSrc(id: string, isPitcher: boolean, slot: CrayonSlot): string | null {
  return crayonSrc(id, slot) ?? genericSrc(isPitcher, slot);
}

interface PhProps {
  src: string | null;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}
function CrayonPh({ src, label, className, style }: PhProps) {
  return (
    <div className={`lb-ph${className ? ` ${className}` : ''}`} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} />
      ) : (
        <span className="lb-ph-tag">
          크레파스 초상화
          <br />
          {label}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default async function PlayerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await getPlayerDetail(params.id);
  const detail = res.data;
  if (!detail || !detail.player) notFound();

  const { player } = detail;
  const cur = (detail.currentSeason as Rec | null) ?? null;
  const careers = ((detail.careerSeasons as Rec[]) ?? [])
    .slice()
    .sort((a, b) => (num(b, 'season') ?? 0) - (num(a, 'season') ?? 0));
  const recent = (detail.recentTen as Rec[]) ?? [];
  const grade: Grade = (detail.currentGrade?.grade as Grade) ?? 'normal';
  const gradeBasis = detail.currentGrade?.basis ?? null;
  const team = TEAMS[player.teamCode as TeamCode] ?? TEAMS.KIA;
  const isP = player.isPitcher;

  const news = await getPlayerNews(player.id, player.name);
  const newsUrl = naverNewsSearchUrl(player.name);

  const accent = ACCENT[grade];
  const curSeasonYear = num(cur, 'season') ?? num(careers[0], 'season');

  // ── derived display ──
  const tagline =
    str(cur, 'recentForm') ??
    (isP
      ? `${curSeasonYear ?? ''} 시즌 ERA ${fmt(num(cur, 'era'), 2)}`
      : `${curSeasonYear ?? ''} 시즌 OPS ${rate(num(cur, 'ops'))}`);

  const concept = isP
    ? `${player.name}(${player.position}) 투수의 올시즌 기록과 역대 통산 성적, 최신 소식을 크레파스 화풍으로 담은 KIA 타이거즈 팬 카드입니다. 올시즌 ${fmtInt(num(cur, 'games'))}경기 ${fmt(num(cur, 'ip'), 1)}이닝, 평균자책점 ${fmt(num(cur, 'era'), 2)}.`
    : `${player.name}(${player.position}) 선수의 올시즌 기록과 역대 통산 성적, 최신 소식을 크레파스 화풍으로 담은 KIA 타이거즈 팬 카드입니다. 올시즌 ${fmtInt(num(cur, 'games'))}경기 타율 ${rate(num(cur, 'avg'))}, ${fmtInt(num(cur, 'hr'))}홈런 ${fmtInt(num(cur, 'rbi'))}타점.`;

  const tags = isP
    ? [
        ['ERA', fmt(num(cur, 'era'), 2)],
        ['WHIP', fmt(num(cur, 'whip'), 2)],
        ['K', fmtInt(num(cur, 'k'))],
        ['WAR', fmt(num(cur, 'war'), 2)],
      ]
    : [
        ['wRC+', fmtInt(num(cur, 'wrcPlus'))],
        ['OPS', rate(num(cur, 'ops'))],
        ['HR', fmtInt(num(cur, 'hr'))],
        ['WAR', fmt(num(cur, 'war'), 2)],
      ];

  const statGrid: Array<{ k: string; v: string; d: string }> = isP
    ? [
        { k: 'ERA', v: fmt(num(cur, 'era'), 2), d: '평균자책점' },
        { k: 'WHIP', v: fmt(num(cur, 'whip'), 2), d: '이닝당 출루' },
        { k: 'FIP', v: fmt(num(cur, 'fip'), 2), d: '수비무관 ERA' },
        { k: 'K', v: fmtInt(num(cur, 'k')), d: '탈삼진' },
        { k: 'K/9', v: fmt(num(cur, 'k9'), 1), d: '9이닝당 K' },
        { k: 'SV', v: fmtInt(num(cur, 'sv')), d: '세이브' },
        { k: 'HLD', v: fmtInt(num(cur, 'hold')), d: '홀드' },
        { k: 'WAR', v: fmt(num(cur, 'war'), 2), d: '대체선수대비' },
      ]
    : [
        { k: 'AVG', v: rate(num(cur, 'avg')), d: '타율' },
        { k: 'OBP', v: rate(num(cur, 'obp')), d: '출루율' },
        { k: 'SLG', v: rate(num(cur, 'slg')), d: '장타율' },
        { k: 'OPS', v: rate(num(cur, 'ops')), d: '출루+장타' },
        { k: 'HR', v: fmtInt(num(cur, 'hr')), d: '홈런' },
        { k: 'RBI', v: fmtInt(num(cur, 'rbi')), d: '타점' },
        { k: 'wRC+', v: fmtInt(num(cur, 'wrcPlus')), d: '조정득점생산' },
        { k: 'WAR', v: fmt(num(cur, 'war'), 2), d: '대체선수대비' },
      ];

  const sideBullets = isP
    ? [
        `평균자책점 ${fmt(num(cur, 'era'), 2)} · WHIP ${fmt(num(cur, 'whip'), 2)}`,
        `9이닝당 ${fmt(num(cur, 'k9'), 1)}K · 탈삼진 ${fmtInt(num(cur, 'k'))}개`,
        `${fmtInt(num(cur, 'hold'))}홀드 · ${fmtInt(num(cur, 'sv'))}세이브`,
      ]
    : [
        `타율 ${rate(num(cur, 'avg'))} · OPS ${rate(num(cur, 'ops'))}`,
        `${fmtInt(num(cur, 'hr'))}홈런 · ${fmtInt(num(cur, 'rbi'))}타점`,
        `wRC+ ${fmtInt(num(cur, 'wrcPlus'))} (리그 평균 100)`,
      ];

  const actionBullets = [
    str(cur, 'recentForm') ?? '최근 폼 데이터 준비 중',
    str(cur, 'lastGameDate') ? `최근 경기 ${str(cur, 'lastGameDate')}` : null,
    recent[0]
      ? isP
        ? `직전 ${fmt(num(recent[0], 'ip'), 1)}이닝 ${fmtInt(num(recent[0], 'er'))}자책 ${fmtInt(num(recent[0], 'k'))}K`
        : `직전 ${fmtInt(num(recent[0], 'ab'))}타수 ${fmtInt(num(recent[0], 'hits'))}안타`
      : null,
  ].filter(Boolean) as string[];

  const careerHeaders = isP
    ? ['시즌', 'G', 'IP', 'ERA', 'WHIP', 'FIP', 'K', 'BB', 'W-L', 'SV', 'HLD', 'WAR']
    : ['시즌', 'G', 'AVG', 'OBP', 'SLG', 'OPS', 'HR', 'RBI', 'SB', 'wRC+', 'WAR'];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--md-sys-color-surface)' }}>
      <Header />

      <div
        className="lb"
        style={
          {
            ['--lb-accent' as string]: accent.accent,
            ['--lb-accent-deep' as string]: accent.deep,
          } as React.CSSProperties
        }
      >
        <Link href="/players" className="lb-back">
          ← 선수 목록으로
        </Link>

        <article className="lb-card">
          {/* ═══════════ HERO ═══════════ */}
          <section className="lb-hero">
            <div className="intro">
              <p className="lb-kicker">{team.name} · {isP ? '투수' : '타자'}</p>
              <h1 className="lb-name">
                {player.name}
                {player.uniformNumber != null && <span className="num">#{player.uniformNumber}</span>}
              </h1>
              <p className="lb-tagline">{tagline}</p>
              <p className="lb-concept">{concept}</p>
              <div className="lb-badge">
                <span className="ic">✦</span>
                <span className="t">{GRADE_LABELS[grade]} GRADE</span>
              </div>
              <div className="lb-tags">
                {tags
                  .filter(([, v]) => v !== '—')
                  .map(([k, v]) => (
                    <span key={k}>#{k}_{v}</span>
                  ))}
                <span>#{player.position}</span>
              </div>
            </div>

            <CrayonPh
              src={portraitSrc(player.id, isP, 'hero')}
              label={`${player.name} 정면`}
              className="lb-visual"
            />

            <div className="lb-rail">
              <div className="block">
                <div className="lb-seclabel">
                  <h3>Side</h3>
                </div>
                <CrayonPh src={portraitSrc(player.id, isP, 'side')} label="측면 컷" className="pose" />
                <ul>
                  {sideBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="block">
                <div className="lb-seclabel">
                  <h3>In Action</h3>
                </div>
                <CrayonPh src={portraitSrc(player.id, isP, 'action')} label="액션 컷" className="pose" />
                <ul>
                  {actionBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <div className="lb-divider" />

          {/* ═══════════ ANALYSIS ═══════════ */}
          <section className="lb-analysis">
            <div>
              <div className="lb-seclabel">
                <span className="dia">◆</span>
                <h3>Season Line</h3>
                <span className="ko">{curSeasonYear ?? ''} 시즌</span>
              </div>
              <div className="lb-statgrid">
                {statGrid.map((s) => (
                  <div className="lb-stat" key={s.k}>
                    <div className="v">{s.v}</div>
                    <div className="k">{s.k}</div>
                    <div className="d">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="lb-seclabel">
                <span className="dia">◆</span>
                <h3>Recent Form</h3>
                <span className="ko">최근 {Math.min(recent.length, 10)}경기</span>
              </div>
              {recent.length > 0 ? (
                <div className="lb-recent">
                  {recent.slice(0, 10).map((g, i) => (
                    <div className="row" key={i}>
                      <span className="dt">{(str(g, 'date') ?? '').slice(5)}</span>
                      <span className="opp">{str(g, 'opponent') ?? '—'}</span>
                      <span className="line">
                        {isP
                          ? `${fmt(num(g, 'ip'), 1)}IP ${fmtInt(num(g, 'er'))}ER ${fmtInt(num(g, 'k'))}K`
                          : `${fmtInt(num(g, 'hits'))}/${fmtInt(num(g, 'ab'))}${num(g, 'hr') ? ` ${fmtInt(num(g, 'hr'))}HR` : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="lb-news-empty">최근 경기 기록이 아직 없습니다.</p>
              )}
            </div>

            <div>
              <div className="lb-seclabel">
                <span className="dia">◆</span>
                <h3>Profile</h3>
              </div>
              <div className="lb-profile">
                <div className="pf">
                  <span className="k">팀</span>
                  <span className="v">{team.name}</span>
                </div>
                <div className="pf">
                  <span className="k">포지션</span>
                  <span className="v">
                    {player.position} · {isP ? '투수' : '타자'}
                  </span>
                </div>
                {player.uniformNumber != null && (
                  <div className="pf">
                    <span className="k">등번호</span>
                    <span className="v">#{player.uniformNumber}</span>
                  </div>
                )}
                <div className="pf">
                  <span className="k">카드 등급</span>
                  <span className="v">
                    {GRADE_LABELS[grade]}
                    {detail.currentGrade?.percentile != null
                      ? ` · 상위 ${100 - detail.currentGrade.percentile}%`
                      : ''}
                  </span>
                </div>
                {gradeBasis && (
                  <div className="pf">
                    <span className="k">등급 산출</span>
                    <span className="v">{gradeBasis}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="lb-divider" />

          {/* ═══════════ CAREER (all collectible seasons) ═══════════ */}
          <section>
            <div className="lb-seclabel">
              <span className="dia">◆</span>
              <h3>Career Record</h3>
              <span className="ko">역대 통산 · 수집 가능한 전 시즌</span>
            </div>
            {careers.length > 0 ? (
              <div className="lb-career-wrap">
                <table className="lb-career">
                  <caption>역대 시즌 기록</caption>
                  <thead>
                    <tr>
                      {careerHeaders.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {careers.map((s, i) => {
                      const isCurrent = num(s, 'season') === curSeasonYear && i === 0;
                      return (
                        <tr key={`${num(s, 'season')}-${i}`} className={isCurrent ? 'is-current' : ''}>
                          <td>{fmtInt(num(s, 'season'))}</td>
                          <td>{fmtInt(num(s, 'games'))}</td>
                          {isP ? (
                            <>
                              <td>{fmt(num(s, 'ip'), 1)}</td>
                              <td>{fmt(num(s, 'era'), 2)}</td>
                              <td>{fmt(num(s, 'whip'), 2)}</td>
                              <td>{fmt(num(s, 'fip'), 2)}</td>
                              <td>{fmtInt(num(s, 'k'))}</td>
                              <td>{fmtInt(num(s, 'bb'))}</td>
                              <td>
                                {fmtInt(num(s, 'w'))}-{fmtInt(num(s, 'l'))}
                              </td>
                              <td>{fmtInt(num(s, 'sv'))}</td>
                              <td>{fmtInt(num(s, 'hold'))}</td>
                              <td>{fmt(num(s, 'war'), 2)}</td>
                            </>
                          ) : (
                            <>
                              <td>{rate(num(s, 'avg'))}</td>
                              <td>{rate(num(s, 'obp'))}</td>
                              <td>{rate(num(s, 'slg'))}</td>
                              <td>{rate(num(s, 'ops'))}</td>
                              <td>{fmtInt(num(s, 'hr'))}</td>
                              <td>{fmtInt(num(s, 'rbi'))}</td>
                              <td>{fmtInt(num(s, 'sb'))}</td>
                              <td>{fmtInt(num(s, 'wrcPlus'))}</td>
                              <td>{fmt(num(s, 'war'), 2)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="lb-news-empty">역대 기록이 아직 없습니다 (첫 시즌 진행 중).</p>
            )}
          </section>

          <div className="lb-divider" />

          {/* ═══════════ NEWS ═══════════ */}
          <section>
            <div className="lb-seclabel">
              <span className="dia">◆</span>
              <h3>Latest News</h3>
              <span className="ko">최신 뉴스</span>
            </div>
            {news.items.length > 0 ? (
              <div className="lb-news-list">
                {news.items.map((n, i) => (
                  <a
                    key={i}
                    className="lb-news-item"
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="nt">{n.title}</span>
                    <span className="meta">
                      {n.publisher}
                      {n.date ? ` · ${n.date}` : ''}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="lb-news-empty">
                아직 수집된 뉴스가 없습니다. 아래에서 네이버 최신 뉴스를 바로 확인하세요.
              </p>
            )}
            <a className="lb-news-more" href={newsUrl} target="_blank" rel="noopener noreferrer">
              네이버 뉴스에서 ‘{player.name}’ 더보기 →
            </a>
          </section>

          <div className="lb-divider" />

          {/* ═══════════ CRAYON GALLERY (angle recap) ═══════════ */}
          <section>
            <div className="lb-seclabel">
              <span className="dia">◆</span>
              <h3>Crayon Gallery</h3>
              <span className="ko">크레파스 인물화 · 5각도</span>
            </div>
            <div className="lb-gallery">
              {CRAYON_SLOTS.map((slot) => (
                <div className="cut" key={slot}>
                  <CrayonPh src={portraitSrc(player.id, isP, slot)} label={SLOT_LABEL[slot]} />
                  <span className="cap">{SLOT_LABEL[slot]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════ FOOTER BAND ═══════════ */}
          <section className="lb-footband">
            <div className="lb-palette">
              <div className="lb-seclabel">
                <h3>Team Colors</h3>
              </div>
              <div className="sw-row">
                <div className="sw">
                  <div className="dot" style={{ background: '#EA0029' }} />
                  <div className="n">KIA 레드</div>
                </div>
                <div className="sw">
                  <div className="dot" style={{ background: '#26201d' }} />
                  <div className="n">블랙</div>
                </div>
                <div className="sw">
                  <div className="dot" style={{ background: '#f4eee4' }} />
                  <div className="n">크림</div>
                </div>
              </div>
            </div>

            <div className="lb-statement">
              <div className="big">Be The Pride.</div>
              <div className="sub">{player.name}, 크레파스로 그린 우리의 타이거즈.</div>
            </div>

            <div className="lb-recommend">
              <div className="lb-seclabel">
                <h3>For Fans Who…</h3>
              </div>
              <div className="rec-row">
                <div className="rec">
                  <div className="em">🐯</div>
                  <div className="n">호랑이굴</div>
                </div>
                <div className="rec">
                  <div className="em">📊</div>
                  <div className="n">숫자덕</div>
                </div>
                <div className="rec">
                  <div className="em">🎨</div>
                  <div className="n">크레파스</div>
                </div>
                <div className="rec">
                  <div className="em">📰</div>
                  <div className="n">소식통</div>
                </div>
              </div>
            </div>
          </section>

          <p className="lb-credit">
            KIA TIGERS PLAYER LOOKBOOK · 크레파스 화풍 팬 카드 · <b>editorial-lookbook</b> 템플릿
          </p>
        </article>
      </div>

      <Footer />
    </main>
  );
}
