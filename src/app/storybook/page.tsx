// /storybook — Blog draft builder for KIA players.
// Design Ref: kia-player-storybook.design.md §6 + m3-comp Screen3.

'use client';

import { useState } from 'react';
import useSWR from 'swr';

import { PlayerSearchBox } from '@/components/storybook/PlayerSearchBox';
import { ResultPanel } from '@/components/storybook/ResultPanel';
import { ImageGallery } from '@/components/storybook/ImageGallery';
import { DraftPreview } from '@/components/storybook/DraftPreview';
import { DraftActions } from '@/components/storybook/DraftActions';
import { fetcher } from '@/lib/api-client';

import type { Storybook } from '@/types';

interface KiaRosterResp {
  players: Array<{
    id: string;
    name: string;
    position: string;
    isPitcher: boolean;
    uniformNumber?: number;
  }>;
}

export default function StorybookPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageAssignments, setImageAssignments] = useState<Record<1 | 2 | 3, string | null>>({
    1: null,
    2: null,
    3: null,
  });

  const { data: rosterData } = useSWR<KiaRosterResp>(
    '/api/storybook/kia-players',
    fetcher,
  );

  const { data: storybook, error: storyError, isLoading } = useSWR<Storybook>(
    selectedId ? `/api/storybook/${selectedId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const roster = rosterData?.players ?? [];

  const handleImageClick = (imageUrl: string) => {
    setImageAssignments((prev) => {
      const nextSlot = ([1, 2, 3] as const).find((i) => prev[i] === null);
      if (!nextSlot) return prev;
      return { ...prev, [nextSlot]: imageUrl };
    });
  };

  const renderedMarkdown = storybook ? applyImageSlots(storybook.draft.markdown, imageAssignments) : '';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)' }}>
      <header
        className="m3-sticky-header"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <a
          href="/"
          className="m3-btn m3-btn-icon"
          aria-label="대시보드로 돌아가기"
          style={{ flexShrink: 0 }}
        >
          <span className="mso" style={{ fontSize: 22 }}>arrow_back</span>
        </a>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="mso filled" style={{ fontSize: 20, color: 'var(--md-sys-color-tertiary)' }}>
              auto_stories
            </span>
            Storybook
          </span>
          <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
            KIA 블로그 초안 빌더
          </span>
        </div>
        {storybook && (
          <span
            className="m3-chip m3-chip-sm"
            style={{
              background: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: '#EA0029',
              }}
            />
            {storybook.player.name}
          </span>
        )}
      </header>

      <section
        style={{
          padding: '16px 16px 32px',
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <PlayerSearchBox
          roster={roster}
          onSelect={(id) => {
            setSelectedId(id);
            setImageAssignments({ 1: null, 2: null, 3: null });
          }}
        />

        {isLoading && (
          <div
            className="m3-card"
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--md-sys-color-on-surface-variant)',
              background: 'var(--md-sys-color-surface-container-low)',
            }}
          >
            <span className="mso" style={{ fontSize: 24, color: 'var(--md-sys-color-primary)' }}>
              hourglass_top
            </span>
            <div style={{ marginTop: 8 }}>데이터 수집 중... (2~5초)</div>
          </div>
        )}
        {storyError && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              fontSize: 13,
            }}
          >
            스토리북 생성 실패. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {storybook && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <ResultPanel storybook={storybook} />
              </div>
              <aside>
                <ImageGallery
                  images={storybook.imagePool}
                  assignments={imageAssignments}
                  onImageClick={handleImageClick}
                  onClear={(slot) =>
                    setImageAssignments((prev) => ({ ...prev, [slot]: null }))
                  }
                />
              </aside>
            </div>

            <DraftPreview markdown={renderedMarkdown} charCount={renderedMarkdown.length} />
            <DraftActions
              markdown={renderedMarkdown}
              playerName={storybook.player.name}
              date={storybook.today.date}
              onRegenerate={() => {
                if (selectedId) {
                  setSelectedId(null);
                  setTimeout(() => setSelectedId(selectedId), 50);
                }
              }}
            />
          </>
        )}
      </section>
    </main>
  );
}

function applyImageSlots(
  markdown: string,
  assignments: Record<1 | 2 | 3, string | null>,
): string {
  let out = markdown;
  for (const slot of [1, 2, 3] as const) {
    const url = assignments[slot];
    const placeholder = `<!-- IMG_SLOT_${slot} -->`;
    if (url) {
      out = out.replace(placeholder, `![](${url})`);
    }
  }
  return out;
}
